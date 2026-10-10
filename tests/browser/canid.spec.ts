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
  if (process.env.CANID_REVIEW_FRAMES) {
    // Optional review evidence, not automated visual acceptance. Matched framing
    // makes each phase comparable across bodies and across a timing revision.
    for (const clip of [
      'idle',
      'walk',
      'trot',
      'run',
      'look',
      'lunge',
      'bite',
      'swipe',
      'roll',
      'flee',
    ]) {
      await page.getByLabel('Movement', { exact: true }).selectOption(clip);
      await expect(viewer).toHaveAttribute('data-clip', clip);
      const duration = Number(await page.getByLabel('Shared motion time').getAttribute('max'));
      for (const fraction of [0.15, 0.32, 0.58, 0.84]) {
        const time = String(Number((duration * fraction).toFixed(2)));
        await page.getByLabel('Shared motion time').fill(time);
        await expect(viewer).toHaveAttribute('data-time', Number(time).toFixed(3));
        await page.getByRole('region', { name: 'Matched canid views' }).screenshot({
          path: info.outputPath(`review-${clip}-${fraction}.png`),
        });
      }
      await page.getByRole('button', { name: 'Portrait', exact: true }).click();
      await page
        .getByLabel('Shared motion time')
        .fill(String(Number((duration * 0.32).toFixed(2))));
      await page.getByRole('region', { name: 'Matched canid views' }).screenshot({
        path: info.outputPath(`review-${clip}-portrait.png`),
      });
      await page.getByRole('button', { name: 'Side', exact: true }).click();
    }
    await page.getByLabel('Movement', { exact: true }).selectOption('walk');
    await page.getByLabel('Shared motion time').fill('0');
  }
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
    const duration = await page.getByLabel('Shared motion time').getAttribute('max');
    await page.getByLabel('Shared motion time').fill(duration!);
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
      const original: unknown = await (
        await fetch(`/packages/dcc-workbench/assets/canid/refined/${id}.json`)
      ).json();
      results.push({
        id,
        clips: await compareCanid(
          `/@fs${path}/models/${id}.glb`,
          receipt as Parameters<typeof compareCanid>[1],
        ),
        changedPoses: (
          await compareCanid(
            `/@fs${path}/models/${id}.glb`,
            original as Parameters<typeof compareCanid>[1],
          )
        ).filter((clip) => clip.name === 'look' || clip.name === 'bite'),
      });
    }
    return results;
  }, resolve(directory!));
  for (const character of results) {
    for (const clip of character.clips) expect(clip.maxError).toBeLessThan(0.0001);
    for (const changed of character.changedPoses) expect(changed.maxError).toBeGreaterThan(0.001);
  }
  await writeFile(
    info.outputPath('edited-native-agreement.json'),
    JSON.stringify(results, null, 2),
  );
});

test('actions hold their final pose, replay, expose phase markers, and show scene travel', async ({
  page,
}, info) => {
  test.setTimeout(60_000);
  await page.goto('/?workbench=dcc&compare=canid');
  const viewer = page.locator('.canid-render');
  await expect(viewer).toHaveAttribute('data-ready', 'true');
  await page.getByLabel('Characters', { exact: true }).selectOption('moss');
  for (const clip of ['lunge', 'bite', 'swipe', 'roll', 'flee']) {
    await page.getByLabel('Movement', { exact: true }).selectOption(clip);
    await expect(viewer).toHaveAttribute('data-clip', clip);
    const duration = Number(await page.getByLabel('Shared motion time').getAttribute('max'));
    await page.getByLabel('Shared motion time').fill((duration - 0.08).toFixed(2));
    await page.getByRole('button', { name: 'Play motion', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Replay motion', exact: true })).toBeVisible();
    await expect(viewer).toHaveAttribute('data-time', duration.toFixed(3));
    await page.waitForTimeout(160);
    await expect(viewer).toHaveAttribute('data-time', duration.toFixed(3));
    await page.getByRole('button', { name: 'Replay motion', exact: true }).click();
    await expect(viewer).not.toHaveAttribute('data-time', duration.toFixed(3));
    await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
    const marker = page.getByRole('button', {
      name: clip === 'roll' ? /^back ·/ : clip === 'flee' ? /^run ·/ : /^contact ·/,
    });
    await marker.click();
    await page.screenshot({ path: info.outputPath(`${clip}-contact.png`), fullPage: true });
  }
  await page.getByLabel('Movement', { exact: true }).selectOption('flee');
  await page.getByLabel('Movement space').selectOption('travel');
  await page.getByLabel('Shared motion time').fill('1.8');
  await expect(viewer).toHaveAttribute('data-movement', 'travel');
  await page.screenshot({ path: info.outputPath('escape-travel.png'), fullPage: true });
  await page.getByLabel('Movement', { exact: true }).selectOption('run');
  await expect(viewer).toHaveAttribute('data-clip', 'run');
});

test('visible playback keeps elapsed time after a slow render frame', async ({ page }) => {
  await page.goto('/?workbench=dcc&compare=canid');
  const viewer = page.locator('.canid-render');
  await expect(viewer).toHaveAttribute('data-ready', 'true');
  await page.getByLabel('Movement', { exact: true }).selectOption('roll');
  await expect(viewer).toHaveAttribute('data-time', '0.000');
  await page.getByRole('button', { name: 'Play motion', exact: true }).click();
  const before = Number(await viewer.getAttribute('data-time'));
  // Inject a real main-thread stall: clamping each delta to 50 ms loses elapsed time.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => {
          const start = performance.now();
          while (performance.now() - start < 180) {
            /* simulated slow frame */
          }
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
      ),
  );
  const after = Number(await viewer.getAttribute('data-time'));
  expect(after - before).toBeGreaterThan(0.16);
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
});

test('attack stage clamps stale indices and recovers across empty timelines', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const render = (index: number, empty = false) =>
    page.evaluate(
      async ({ index, empty }) => {
        const module = '/tests/browser/canid-stage.ts';
        const { renderAttackStage } = (await import(module)) as typeof import('./canid-stage');
        renderAttackStage(index, empty);
      },
      { index, empty },
    );
  const stage = page.getByRole('region', { name: 'Briar Stray attack stage' });
  const canvas = page.locator('.canid-attack-canvas');
  await render(0, true);
  await expect(stage).toHaveCount(0);
  await render(0);
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await expect(canvas).toHaveAttribute('data-clip', 'lunge');
  await render(99);
  await expect(canvas).toHaveAttribute('data-clip', 'bite');
  await render(-99);
  await expect(canvas).toHaveAttribute('data-clip', 'lunge');
  await render(0, true);
  await expect(stage).toHaveCount(0);
  await render(1);
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await expect(canvas).toHaveAttribute('data-clip', 'bite');
  await expect(canvas.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Last Hearth presents resolved Stray attacks on the replay clock without changing the result', async ({
  page,
}, info) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: '◇ Challenges', exact: true }).click();
  await page.getByRole('button', { name: 'Open Make room for the Cub' }).click();
  await page.getByRole('button', { name: 'Fight this warband' }).click();
  const stage = page.getByRole('region', { name: 'Briar Stray attack stage', includeHidden: true });
  const canvas = page.locator('.canid-attack-canvas');
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  const verdict = await page.locator('.combat-verdict').innerText();
  const saved = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
  await page.getByRole('button', { name: 'First combat event', exact: true }).click();
  for (let i = 0; i < 40 && (await stage.getAttribute('data-active')) !== 'true'; i++) {
    await page.getByRole('button', { name: 'Next combat event', exact: true }).click();
  }
  await expect(stage).toBeVisible();
  await expect(stage).toHaveAttribute('data-active', 'true');
  await expect(canvas).toHaveAttribute('data-clip', /lunge|bite|swipe/);
  await page.getByRole('button', { name: 'Play replay', exact: true }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: 'Pause playback', exact: true }).click();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const held = await canvas.getAttribute('data-progress');
  await page.waitForTimeout(160);
  await expect(canvas).toHaveAttribute('data-progress', held!);
  await page
    .locator('.combat-replay')
    .screenshot({ path: info.outputPath('last-hearth-attack.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(stage).toHaveAttribute('data-reduced-motion', 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(async () =>
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    ),
  ).toPass();
  await page
    .locator('.combat-replay')
    .screenshot({ path: info.outputPath('last-hearth-phone.png') });
  await page.getByLabel('Playback speed', { exact: true }).selectOption('200');
  await page.getByRole('button', { name: 'Last combat event', exact: true }).click();
  await expect(page.locator('.combat-verdict')).toHaveText(verdict);
  expect(await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()))).toBe(
    saved,
  );
  expect(errors).toEqual([]);
});
