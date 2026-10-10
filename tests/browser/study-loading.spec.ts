import { expect, test } from '@playwright/test';

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
    await expect(page.locator('.app-shell')).toBeVisible();
  }
  expect(requests).toEqual([]);
});

test('native delivery skips procedural construction until a fallback is selected', async ({
  page,
}) => {
  const procedural: string[] = [];
  const downloads: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/src/art3d/procedural/')) procedural.push(request.url());
    if (
      request.resourceType() !== 'script' &&
      /\.(glb|blend|json)$/.test(new URL(request.url()).pathname)
    )
      downloads.push(request.url());
  });
  await page.goto('/?art=3d&study=phoenix');
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'native');
  expect(procedural).toEqual([]);
  // Development StrictMode may cancel and restart the same selected model request.
  const files = [...new Set(downloads)];
  expect(files).toHaveLength(1);
  expect(files[0]).toContain('/assets/phoenix/');
  expect(new URL(files[0]).pathname).toMatch(/\/model\.glb$/);
  await page.getByRole('button', { name: /Spiral/ }).click();
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'procedural');
  expect(procedural.some((url) => url.includes('/factory.ts'))).toBe(true);
});

test('switching studies during a delayed fallback keeps the current native scene', async ({
  page,
}) => {
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/src/art3d/procedural/factory.ts', async (route) => {
    await pending;
    await route.continue();
  });
  await page.goto('/?art=3d&study=phoenix');
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true');
  const requested = page.waitForRequest('**/src/art3d/procedural/factory.ts');
  await page.getByRole('button', { name: /Spiral/ }).click();
  await requested;
  await page.getByRole('button', { name: /Phoenix/ }).click();
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true');
  const loaded = page.waitForResponse('**/src/art3d/procedural/factory.ts');
  release();
  await loaded;
  // Wait for the complete module graph so the cancelled load has had a chance to finish.
  await page.evaluate(async () => {
    const modulePath = '/src/art3d/procedural/factory.ts';
    await import(modulePath);
  });
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'native');
  await expect(page.locator('.study-render canvas')).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: /Spiral/ }).click();
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'procedural');
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.study-render canvas')).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(0);
});
