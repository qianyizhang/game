import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { sceneReadyTimeout } from './budget';

const spiralURL = (url: URL) =>
  url.pathname.endsWith('/baked/spiral.glb') && !url.searchParams.has('url');

test('ordinary game routes leave 3D modules unloaded', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/\/src\/art3d\/|\/packages\/dcc-workbench\/|\/three(?:\.js|\/)/.test(request.url()))
      requests.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByLabel('Choose game')).toBeVisible();
  for (const game of ['spire', 'battlegrounds', 'balatro']) {
    await page.getByLabel('Choose game').selectOption(game);
    await expect(page.getByLabel('Choose game')).toHaveValue(game);
  }
  expect(requests).toEqual([]);
});

test('native and baked delivery never request procedural constructors', async ({ page }) => {
  const procedural: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/src/art3d/procedural/')) procedural.push(request.url());
  });
  await page.goto('/?art=3d&study=phoenix');
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'native');
  await page.getByRole('button', { name: /Spiral/ }).click();
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'baked');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download 3D model' }).click();
  await download;
  expect(procedural).toEqual([]);
});

test('switching studies during a delayed baked fetch keeps the current native scene', async ({
  page,
}) => {
  // This journey checks load ownership; continuous animation has separate coverage.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let release: () => void = () => {};
  let arrived: () => void = () => {};
  let finished: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    arrived = resolve;
  });
  const completed = new Promise<void>((resolve) => {
    finished = resolve;
  });
  await page.goto('/?art=3d&study=phoenix');
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  await page.route(spiralURL, async (route) => {
    arrived();
    await pending;
    try {
      await route.fulfill({
        body: readFileSync('src/art3d/baked/spiral.glb'),
        contentType: 'model/gltf-binary',
      });
    } finally {
      finished();
    }
  });
  await page.getByRole('button', { name: /Spiral/ }).click();
  await requested;
  await page.getByRole('button', { name: /Phoenix/ }).click();
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  release();
  await completed;
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'native');
  await expect(page.locator('.study-render canvas')).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.unroute(spiralURL);
  await page.getByRole('button', { name: /Spiral/ }).click();
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'baked');
});

for (const failure of ['missing', 'corrupt']) {
  test(`a ${failure} baked file fails visibly without regeneration and another study recovers`, async ({
    page,
  }) => {
    const procedural: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/src/art3d/procedural/')) procedural.push(request.url());
    });
    await page.route(spiralURL, (route) =>
      route.fulfill(
        failure === 'missing'
          ? { status: 404, body: 'missing' }
          : { body: Buffer.from('corrupt GLB'), contentType: 'model/gltf-binary' },
      ),
    );
    await page.goto('/?art=3d&study=spiral');
    await expect(page.getByRole('alert')).toContainText('could not be loaded');
    await expect(page.locator('.study-render canvas')).toHaveCount(0);
    await page.getByRole('button', { name: /Phoenix/ }).click();
    await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true');
    expect(procedural).toEqual([]);
  });
}
