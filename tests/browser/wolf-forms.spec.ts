import { browserBudget } from './budget';
import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getAsset, loadRegistry } from '../../packages/dcc-workbench/registry';
import { resolvePublication } from '../../packages/dcc-workbench/releases';

const root = resolve('packages/dcc-workbench');
const forms = [
  { form: 'bloom', asset: 'wolf-bloom', title: 'Bloom Warden', alignment: 'Friendly' },
  { form: 'elder', asset: 'wolf-elder', title: 'Elder Sentinel', alignment: 'Neutral' },
  { form: 'thorn', asset: 'wolf-thorn', title: 'Thorn Tyrant', alignment: 'Evil' },
] as const;
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

// Protect separate authored deliveries: changing the visible title must never
// leave another form's model/source active, replace the base, or alter game saves.
test('Wolf form selection and keyboard alignment deliver exact separate models and sources', async ({
  page,
}, info) => {
  test.setTimeout(browserBudget(150_000));
  const registry = loadRegistry(root);
  const base = resolvePublication(root, getAsset(registry, 'wolf'));
  const protectedPaths = [
    resolve(root, 'subjects/wolf/source.blend'),
    ...['wolf', 'nightjar', 'phoenix', 'stormroc', 'prowler'].map((id) =>
      resolve(root, `assets/${id}/published/current.json`),
    ),
    resolve(root, 'assets/briar-hydra/current.json'),
  ];
  const before = await Promise.all(
    protectedPaths.map(async (path) => sha256(await readFile(path))),
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const saves = await page.evaluate(() =>
    JSON.stringify(
      Object.fromEntries(
        Object.entries(localStorage).filter(([key]) => key !== 'card-workshop.screen'),
      ),
    ),
  );
  await page.getByRole('button', { name: '3D art gallery' }).click();
  const studies = page.getByRole('navigation', { name: 'Choose a 3D study' });
  await expect(studies.getByRole('button')).toHaveCount(29);
  await studies.getByRole('button', { name: /Wolf/ }).click();
  const render = page.locator('.study-render');
  await expect(render).toHaveAttribute('data-form', 'base');
  await expect(render).toHaveAttribute('data-ready', 'true');
  const alignment = page.getByRole('slider', { name: 'Wolf alignment' });
  await expect(alignment).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Original base' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const captureDownload = async (label: string, filename: string, expectedPath: string) => {
    const pending = page.waitForEvent('download');
    if (label === 'Editable Blender source') await page.getByRole('link', { name: label }).click();
    else await page.getByRole('button', { name: label }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe(filename);
    const path = info.outputPath(filename);
    await download.saveAs(path);
    expect(await readFile(path)).toEqual(await readFile(expectedPath));
  };
  for (const [index, entry] of forms.entries()) {
    const publication = resolvePublication(root, getAsset(registry, entry.asset));
    expect(publication.legacyStudyId).toBe(entry.asset);
    expect(publication.reviewScope).toBe('gallery');
    expect(publication.reviewDecision).toBe('accepted');
    await page.getByRole('button', { name: `${entry.alignment} ${entry.title}` }).click();
    await expect(render).toHaveAttribute('data-form', entry.form);
    await expect(render).toHaveAttribute('data-ready', 'true');
    await expect(render).toHaveAttribute('data-delivery', 'native');
    await expect(render).toHaveAttribute('data-duration', '6');
    await expect(page.getByRole('heading', { name: entry.title, exact: true })).toBeVisible();
    await expect(alignment).toHaveValue(String(index));
    await expect(alignment).toHaveAttribute('aria-valuetext', entry.alignment);
    await expect(page).toHaveURL(new RegExp(`study=wolf&form=${entry.form}`));
    await page.getByLabel('Animation timeline').fill('0');
    const rest = await page.locator('canvas').screenshot();
    await page.getByLabel('Animation timeline').fill('3.5');
    await expect(async () =>
      expect((await page.locator('canvas').screenshot()).equals(rest)).toBe(false),
    ).toPass();
    await captureDownload(
      'Download 3D model',
      `card-workshop-${entry.asset}.glb`,
      publication.modelPath,
    );
    await captureDownload(
      'Editable Blender source',
      `${entry.asset}.blend`,
      publication.sourcePath,
    );
  }
  await alignment.focus();
  await alignment.press('Home');
  await expect(render).toHaveAttribute('data-form', 'bloom');
  await alignment.press('ArrowRight');
  await expect(render).toHaveAttribute('data-form', 'elder');
  await alignment.press('End');
  await expect(render).toHaveAttribute('data-form', 'thorn');
  await expect(render).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Original base' }).click();
  await expect(render).toHaveAttribute('data-form', 'base');
  await expect(render).toHaveAttribute('data-ready', 'true');
  await expect(page).not.toHaveURL(/form=/);
  await captureDownload('Download 3D model', 'card-workshop-wolf.glb', base.modelPath);
  await captureDownload('Editable Blender source', 'wolf.blend', base.sourcePath);
  await studies.getByRole('button', { name: /Spiral/ }).click();
  await expect(render).toHaveAttribute('data-ready', 'true');
  await expect(render).toHaveAttribute('data-delivery', 'procedural');
  await expect(page.getByRole('region', { name: 'Wolf forms', exact: true })).toHaveCount(0);
  await studies.getByRole('button', { name: /Wolf/ }).click();
  await expect(render).toHaveAttribute('data-form', 'base');
  await expect(render).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(() =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(localStorage).filter(([key]) => key !== 'card-workshop.screen'),
        ),
      ),
    ),
  ).toBe(saves);
  expect(
    await Promise.all(protectedPaths.map(async (path) => sha256(await readFile(path)))),
  ).toEqual(before);
});

for (const entry of forms) {
  test(`${entry.title} deep link preserves motion preferences and fits phone views`, async ({
    page,
  }, info) => {
    test.setTimeout(browserBudget(60_000));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?art=3d&study=wolf&form=${entry.form}`);
    const render = page.locator('.study-render');
    await expect(render).toHaveAttribute('data-form', entry.form);
    await expect(render).toHaveAttribute('data-ready', 'true');
    await expect(render).toHaveAttribute('data-delivery', 'native');
    const play = page.getByRole('button', { name: 'Play animation' });
    await expect(play).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('button', { name: 'Slow turntable' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await play.click();
    const timeline = page.getByLabel('Animation timeline');
    const start = Number(await timeline.inputValue());
    await expect
      .poll(async () => (Number(await timeline.inputValue()) - start + 6) % 6)
      .toBeGreaterThan(0.05);
    await page.getByRole('button', { name: 'Pause animation' }).click();
    await timeline.fill('0');
    await page
      .locator('.art-studio')
      .screenshot({ path: info.outputPath(`${entry.asset}-desktop-material.png`) });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByRole('slider', { name: 'Wolf alignment' })).toBeVisible();
    await page
      .getByRole('region', { name: 'Wolf forms', exact: true })
      .screenshot({ path: info.outputPath(`${entry.asset}-phone-controls.png`) });
    for (const seconds of [0, 3.5]) {
      await timeline.fill(String(seconds));
      await expect.poll(async () => Number(await timeline.inputValue())).toBeCloseTo(seconds, 2);
      await page
        .locator('.studio-stage')
        .screenshot({ path: info.outputPath(`${entry.asset}-phone-${seconds}.png`) });
    }
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

// A failed evolved delivery must show an error rather than silently substitute
// the accepted base. One form exercises this shared loader failure boundary.
test('an unavailable evolved Wolf fails closed and the base remains recoverable', async ({
  page,
}) => {
  await page.route('**/*.glb', (route) => route.abort());
  await page.goto('/?art=3d&study=wolf&form=thorn');
  await expect(page.getByRole('alert')).toContainText('could not be loaded');
  await expect(page.locator('.study-render')).not.toHaveAttribute('data-delivery', 'procedural');
  await page.unroute('**/*.glb');
  await page.getByRole('button', { name: 'Original base' }).click();
  await expect(page.locator('.study-render')).toHaveAttribute('data-form', 'base');
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'native');
  await expect(page.getByRole('alert')).toHaveCount(0);
});
