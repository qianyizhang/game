import { browserBudget, sceneReadyTimeout } from './budget';
import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { getAsset, loadRegistry } from '../../packages/dcc-workbench/registry';
import { resolvePublication } from '../../packages/dcc-workbench/releases';
import { objectValue, isList } from '../../src/shared/json';

test('DCC pilot carries the concept into an animated downloadable asset', async ({
  page,
}, info) => {
  test.setTimeout(browserBudget(90000));
  const packageRoot = resolve('packages/dcc-workbench');
  const published = resolvePublication(
    packageRoot,
    getAsset(loadRegistry(packageRoot), 'briar-hydra'),
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const saves = await page.evaluate(() => JSON.stringify(localStorage));
  const entry = page.getByRole('button', { name: 'DCC workbench' });
  await entry.click();
  await expect(page).toHaveURL(/workbench=dcc/);
  await expect(page).toHaveTitle('DCC Workbench · Card Workshop');
  await expect(page.getByRole('heading', { name: 'Briar Hydra.' })).toBeVisible();
  await expect(page.locator('.dcc-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  await page.getByRole('button', { name: 'Pause animation' }).click();
  await page.getByLabel('Animation time').fill('0');
  await expect(page.locator('.dcc-render')).toHaveAttribute('data-time', '0.000');
  await page.screenshot({ path: info.outputPath('workbench-desktop.png'), fullPage: true });
  const before = await page
    .locator('canvas')
    .screenshot({ path: info.outputPath('hydra-material.png') });
  await page.getByLabel('Animation time').fill('3');
  await expect(page.locator('.dcc-render')).toHaveAttribute('data-time', '3.000');
  const middle = await page
    .locator('canvas')
    .screenshot({ path: info.outputPath('hydra-motion.png') });
  expect(middle.equals(before)).toBe(false);
  await page.getByLabel('Animation time').fill('6');
  await expect(page.locator('.dcc-render')).toHaveAttribute('data-time', '6.000');
  const loop = await page.locator('canvas').screenshot();
  expect(loop.equals(before)).toBe(true);
  await page.getByLabel('Animation time').fill('0');
  for (const view of ['Front', 'Side', 'Back']) {
    await page.getByRole('button', { name: view, exact: true }).click();
    await page
      .locator('canvas')
      .screenshot({ path: info.outputPath(`hydra-${view.toLowerCase()}.png`) });
  }
  await page.getByRole('button', { name: 'Portrait', exact: true }).click();
  await page.getByRole('button', { name: /Form/ }).click();
  await expect(page.getByRole('button', { name: 'Clay', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.locator('canvas').screenshot({ path: info.outputPath('hydra-clay.png') });
  for (const name of [/Surface/, /Motion/, /Delivery/])
    await page.getByRole('button', { name }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download animated GLB' }).click();
  const file = await download;
  await file.saveAs(info.outputPath('briar-hydra.glb'));
  expect(await readFile(info.outputPath('briar-hydra.glb'))).toEqual(
    await readFile(published.modelPath),
  );
  const sourceDownload = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Editable Blender source' }).click();
  const source = await sourceDownload;
  await source.saveAs(info.outputPath('briar-hydra.blend'));
  expect(await readFile(info.outputPath('briar-hydra.blend'))).toEqual(
    await readFile(published.sourcePath),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }).toPass();
  await page.screenshot({ path: info.outputPath('workbench-phone.png'), fullPage: true });
  await page.locator('.dcc-viewport').screenshot({ path: info.outputPath('hydra-phone.png') });
  await page.getByRole('button', { name: 'Return to my table' }).click();
  await expect(entry).toBeFocused();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(saves);
  expect(errors).toEqual([]);
});

test('DCC reduced motion pauses startup and GLB load failure remains actionable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?workbench=dcc');
  await expect(page.locator('.dcc-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  await expect(page.getByRole('button', { name: 'Play animation' })).toBeVisible();
  await expect(page.locator('.dcc-render')).toHaveAttribute('data-time', '0.000');
  await page.getByRole('button', { name: 'Play animation' }).click();
  await expect(page.locator('.dcc-render')).not.toHaveAttribute('data-time', '0.000');
  await page.route('**/*.glb', (route) => route.abort());
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('could not be loaded');
  await expect(page.getByRole('link', { name: 'Editable Blender source' })).toBeVisible();
  await page.getByRole('button', { name: 'Return to my table' }).click();
  await expect(page.getByRole('button', { name: 'DCC workbench' })).toBeFocused();
});

test('DCC exported anatomy reproduces Blender evaluated poses', async ({ page }, info) => {
  await page.goto('/?workbench=dcc');
  await expect(page.locator('.dcc-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/dcc-roundtrip.ts';
    const { compareDccPoses } = (await import(path)) as typeof import('./dcc-roundtrip');
    return compareDccPoses();
  });
  await writeFile(info.outputPath('blender-three-poses.json'), JSON.stringify(result, null, 2));
  expect(result.sampleVertices).toBeGreaterThanOrEqual(64);
  expect(result.maxRestMatchError).toBeLessThan(0.0001);
  expect(result.maxPoseError).toBeLessThan(0.0001);
});

test('DCC native saved edit reproduces its exported poses', async ({ page }, info) => {
  const candidate = process.env.DCC_NATIVE_CANDIDATE;
  test.skip(!candidate, 'Run npm run test:dcc:native for the local Blender edit loop.');
  const raw = objectValue(
    JSON.parse(await readFile(join(candidate!, 'pose-samples.json'), 'utf8')),
  );
  if (!isList(raw.samples)) throw new Error('Missing native poses');
  const samples = raw.samples.map((value) => {
    const pose = objectValue(value);
    if (typeof pose.seconds !== 'number' || !Number.isFinite(pose.seconds) || !isList(pose.points))
      throw new Error('Invalid native pose');
    const points = pose.points.map((point): [number, number, number] => {
      if (
        !isList(point) ||
        point.length !== 3 ||
        !point.every((n): n is number => typeof n === 'number' && Number.isFinite(n))
      )
        throw new Error('Invalid native point');
      return [point[0], point[1], point[2]];
    });
    return { seconds: pose.seconds, points };
  });
  const url = '/native-edited-hydra.glb';
  await page.route(`**${url}`, (route) =>
    route.fulfill({
      path: join(candidate!, 'briar-hydra.pending.glb'),
      contentType: 'model/gltf-binary',
    }),
  );
  await page.goto('/?workbench=dcc');
  const result = await page.evaluate(
    async ({ url, samples }) => {
      const path = '/tests/browser/dcc-roundtrip.ts';
      const { compareDccPoses } = (await import(path)) as typeof import('./dcc-roundtrip');
      return compareDccPoses(url, { space: 'glTF world, Y up', samples });
    },
    { url, samples },
  );
  await writeFile(info.outputPath('native-edited-poses.json'), JSON.stringify(result, null, 2));
  expect(result.sampleVertices).toBe(64);
  expect(result.perPose).toHaveLength(5);
  expect(result.maxRestMatchError).toBeLessThan(0.0001);
  expect(result.maxPoseError).toBeLessThan(0.0001);
});
