import { resolve } from 'node:path';
import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

test('canid clips preserve native deformation and support matched review and downloads', async ({
  page,
}, info) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?workbench=dcc&compare=canid');
  await expect(page.getByRole('heading', { name: 'A family in motion.' })).toBeVisible();
  const viewer = page.locator('.canid-render');
  await expect(viewer).toHaveAttribute('data-ready', 'true');
  const agreement = await page.evaluate(async () => {
    const path = '/tests/browser/canid-evidence.ts';
    const { compareCanids } = (await import(path)) as typeof import('./canid-evidence');
    return compareCanids();
  });
  await writeFile(info.outputPath('native-agreement.json'), JSON.stringify(agreement, null, 2));
  for (const character of agreement)
    for (const clip of character.clips)
      expect(clip.maxError, `${character.id}/${clip.name}`).toBeLessThan(0.0001);
  await page.screenshot({ path: info.outputPath('clay-side.png'), fullPage: true });
  await page.getByLabel('Shared motion time').fill('0.5');
  await expect(viewer).toHaveAttribute('data-time', '0.500');
  await page.getByRole('button', { name: 'Material', exact: true }).click();
  await page.getByRole('button', { name: 'Portrait', exact: true }).click();
  await page.screenshot({ path: info.outputPath('material-portrait.png'), fullPage: true });
  await page.getByRole('button', { name: 'Play motion', exact: true }).click();
  await expect(async () => {
    expect(await viewer.getAttribute('data-time')).not.toBe('0.500');
  }).toPass();
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  for (const clip of ['idle', 'look', 'walk', 'trot']) {
    await page.getByLabel('Movement', { exact: true }).selectOption(clip);
    await expect(viewer).toHaveAttribute('data-clip', clip);
    await page
      .getByLabel('Shared motion time')
      .fill(({ idle: '4', look: '2.5', walk: '0.9', trot: '0.6' } as Record<string, string>)[clip]);
    await page.getByLabel('Shared motion time').fill('0');
    await expect(viewer).toHaveAttribute('data-time', '0.000');
  }
  await page.getByLabel('Revision', { exact: true }).selectOption('comparison');
  await expect(viewer).toHaveAttribute('data-revision', 'comparison');
  await expect(viewer).toHaveAttribute('data-character', 'ash');
  await expect(viewer).toHaveAttribute('data-clip', 'walk');
  await expect(
    page.getByLabel('Movement', { exact: true }).getByRole('option', { name: 'Trot', exact: true }),
  ).toHaveCount(0);
  await page.getByLabel('Shared motion time').fill('0.45');
  await expect(viewer).toHaveAttribute('data-time', '0.450');
  await page.screenshot({ path: info.outputPath('before-after.png'), fullPage: true });
  await page.getByLabel('Revision', { exact: true }).selectOption('baseline');
  await expect(viewer).toHaveAttribute('data-revision', 'baseline');
  await expect(
    page.getByRole('link', { name: 'Download Ash GLB', exact: true }),
  ).not.toHaveAttribute('href', /refined/);
  await page.getByLabel('Revision', { exact: true }).selectOption('refined');
  await expect(viewer).toHaveAttribute('data-revision', 'refined');
  await page.getByLabel('Characters', { exact: true }).selectOption('moss');
  await expect(viewer).toHaveAttribute('data-character', 'moss');
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download Moss GLB', exact: true }).click();
  const file = await download;
  await file.saveAs(info.outputPath('moss.glb'));
  expect(await readFile(info.outputPath('moss.glb'))).toEqual(
    await readFile('packages/dcc-workbench/assets/canid/refined/moss.glb'),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel('Characters', { exact: true }).selectOption('all');
  await expect(async () =>
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    ),
  ).toPass();
  await page.screenshot({ path: info.outputPath('phone.png'), fullPage: true });
  await page.getByRole('button', { name: 'Back to workbench' }).click();
  await expect(page.getByRole('button', { name: /Canid motion study/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('canid study starts paused and reports a failed asset load', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?workbench=dcc&compare=canid');
  await expect(page.locator('.canid-render')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('button', { name: 'Play motion', exact: true })).toBeVisible();
  await page.route('**/ash.glb*', (route) =>
    route.request().resourceType() === 'fetch' ? route.abort() : route.continue(),
  );
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('could not load');
  await expect(page.getByRole('link', { name: 'Editable Ash source' })).toBeVisible();
});

test('edited shared motion survives export and consumer reload for every character', async ({
  page,
}, info) => {
  const directory = process.env.CANID_NATIVE_RESULTS;
  test.skip(
    !directory,
    'Requires the disposable native mutation run; ordinary CI is not credited with native execution.',
  );
  await page.goto('/?workbench=dcc&compare=canid');
  await expect(page.locator('.canid-render')).toHaveAttribute('data-ready', 'true');
  const results = await page.evaluate(async (path) => {
    const module = '/tests/browser/canid-evidence.ts';
    const { compareCanid } = (await import(module)) as typeof import('./canid-evidence');
    const results = [];
    for (const id of ['ash', 'russet', 'moss']) {
      const response = await fetch(`/@fs${path}/models/${id}.json`);
      if (!response.ok) throw new Error('Missing native mutation receipt');
      const receipt: unknown = await response.json();
      results.push({
        id,
        clips: await compareCanid(
          `/@fs${path}/models/${id}.glb`,
          receipt as Parameters<typeof compareCanid>[1],
        ),
      });
    }
    return results;
  }, resolve(directory!));
  for (const character of results)
    for (const clip of character.clips) expect(clip.maxError).toBeLessThan(0.0001);
  await writeFile(
    info.outputPath('edited-native-agreement.json'),
    JSON.stringify(results, null, 2),
  );
});
