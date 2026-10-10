import { expect, test } from '@playwright/test';

test('native delivery skips procedural construction until a fallback is selected', async ({
  page,
}) => {
  const procedural: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/src/art3d/procedural/')) procedural.push(request.url());
  });
  await page.goto('/?art=3d&study=phoenix');
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.study-render')).toHaveAttribute('data-delivery', 'native');
  expect(procedural).toEqual([]);
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
