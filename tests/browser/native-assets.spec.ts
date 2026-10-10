import { browserBudget, sceneReadyTimeout } from './budget';
import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { resolve } from 'node:path';
import { getAsset, loadRegistry } from '../../packages/dcc-workbench/registry';
import { resolvePublication } from '../../packages/dcc-workbench/releases';
import type { PublishedSavedPoseSamples } from '../../packages/dcc-workbench/src/delivery-types';

test('review scope selects gallery defaults and native workbench downloads stay isolated', async ({
  page,
}, info) => {
  const root = resolve('packages/dcc-workbench');
  const registry = loadRegistry(root);
  const hydra = resolvePublication(root, getAsset(registry, 'briar-hydra'));
  const nightjar = resolvePublication(root, getAsset(registry, 'nightjar'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?art=3d&study=hydra');
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'native');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download 3D model' }).click();
  const file = await download;
  await file.saveAs(info.outputPath('native-hydra.glb'));
  expect(
    (await readFile(info.outputPath('native-hydra.glb'))).equals(await readFile(hydra.modelPath)),
  ).toBe(true);
  await page.route('**/*.glb', (route) => route.abort());
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('could not be loaded');
  await expect(page.locator('.study-render')).not.toHaveAttribute('data-delivery', 'procedural');
  await page
    .getByRole('navigation', { name: 'Choose a 3D study' })
    .getByRole('button', { name: /Spiral/ })
    .click();
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'procedural');
  await page.unroute('**/*.glb');
  await page
    .getByRole('navigation', { name: 'Choose a 3D study' })
    .getByRole('button', { name: /Nightjar/ })
    .click();
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'native');
  const nightjarDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download 3D model' }).click();
  const nightjarFile = await nightjarDownload;
  await nightjarFile.saveAs(info.outputPath('native-nightjar.glb'));
  expect(
    (await readFile(info.outputPath('native-nightjar.glb'))).equals(
      await readFile(nightjar.modelPath),
    ),
  ).toBe(true);
  // Both real pilots are now gallery accepted. Exercise a workbench-only review at the
  // browser metadata interface without changing any production receipt or publication.
  await page.evaluate(async () => {
    const path = '/packages/dcc-workbench/src/delivery.ts';
    const { getPublishedAsset } = (await import(
      path
    )) as typeof import('../../packages/dcc-workbench/src/delivery');
    getPublishedAsset('nightjar').info.reviewScope = 'workbench';
  });
  await page
    .getByRole('navigation', { name: 'Choose a 3D study' })
    .getByRole('button', { name: /Hydra/ })
    .click();
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  await page
    .getByRole('navigation', { name: 'Choose a 3D study' })
    .getByRole('button', { name: /Nightjar/ })
    .click();
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'procedural');
  await page.goto('/?workbench=dcc');
  await page.getByLabel('Choose native asset').selectOption('nightjar');
  await expect(page).toHaveURL(/asset=nightjar/);
  await expect(page.getByRole('heading', { name: 'Nightjar.' })).toBeVisible();
  await expect(page.locator('.dcc-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  const sourceDownload = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Editable Blender source' }).click();
  const source = await sourceDownload;
  await source.saveAs(info.outputPath('nightjar.blend'));
  expect(
    (await readFile(info.outputPath('nightjar.blend'))).equals(await readFile(nightjar.sourcePath)),
  ).toBe(true);
  await page.getByLabel('Choose native asset').selectOption('briar-hydra');
  await expect(page.getByRole('heading', { name: 'Briar Hydra.' })).toBeVisible();
  await expect(page.locator('.dcc-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  expect(errors).toEqual([]);
});

test('saved native candidate agrees with its delivered anatomy and fitted motion', async ({
  page,
}, info) => {
  const candidate = process.env.DCC_SAVED_CANDIDATE;
  test.skip(!candidate, 'Set DCC_SAVED_CANDIDATE to a sealed native candidate directory.');
  test.setTimeout(browserBudget(90000));
  const samples = JSON.parse(
    await readFile(join(candidate!, 'pose-samples.json'), 'utf8'),
  ) as PublishedSavedPoseSamples;
  const manifest = JSON.parse(await readFile(join(candidate!, 'candidate.json'), 'utf8')) as {
    outputs: { model: { path: string } };
  };
  const model = join(candidate!, manifest.outputs.model.path);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*.glb', (route) =>
    route.fulfill({ path: model, contentType: 'model/gltf-binary' }),
  );
  await page.goto('/?workbench=dcc');
  await expect(page.locator('.dcc-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  const result = await page.evaluate(async (samples) => {
    const path = '/tests/browser/dcc-roundtrip.ts';
    const { compareSavedPoses } = (await import(path)) as typeof import('./dcc-roundtrip');
    return compareSavedPoses('/native-candidate.glb', samples);
  }, samples);
  await writeFile(info.outputPath('native-three-poses.json'), JSON.stringify(result, null, 2));
  expect(result.sampledObjects).toBe(samples.objects.length);
  expect(result.sampledSkins).toBe(
    samples.objects.filter((object) => object.role === 'skinned').length,
  );
  expect(result.sampledRigid).toBe(
    samples.objects.filter((object) => object.role === 'rigid').length,
  );
  expect(result.maxRestMatchError).toBeLessThan(0.0001);
  expect(result.maxPoseError).toBeLessThan(0.0001);
  await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
  for (const surface of ['Clay', 'Material']) {
    await page.getByRole('button', { name: surface, exact: true }).click();
    for (const view of ['Front', 'Side', 'Back']) {
      await page.getByRole('button', { name: view, exact: true }).click();
      for (const seconds of [0, 1.5, 3, 4.5, 6]) {
        await page.getByLabel('Animation time').fill(String(seconds));
        await expect(page.locator('.dcc-render')).toHaveAttribute('data-time', seconds.toFixed(3));
        await page
          .locator('canvas')
          .screenshot({ path: info.outputPath(`${view}-${surface}-${seconds}.png`) });
      }
    }
  }
  await page.getByRole('button', { name: 'Portrait', exact: true }).click();
  await page.getByLabel('Animation time').fill('0');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.dcc-viewport').screenshot({ path: info.outputPath('phone-material.png') });
  expect(errors).toEqual([]);
});
