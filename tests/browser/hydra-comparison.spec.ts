import { browserBudget } from './budget';
import { expect, test } from '@playwright/test';

test('Hydra comparison keeps views, clock and baselines matched', async ({ page }, info) => {
  test.setTimeout(browserBudget(90000));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const saves = await page.evaluate(() => JSON.stringify(localStorage));
  const entry = page.getByRole('button', { name: 'DCC workbench' });
  await entry.click();
  await page.getByRole('button', { name: /Compare Hydra versions/ }).click();
  const viewer = page.locator('.dcc-comparison-render');
  await expect(viewer).toHaveAttribute('data-ready', 'true');
  await expect(viewer).toHaveAttribute('data-time', '0.000');
  await expect(page.getByRole('button', { name: 'Play comparison', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('comparison-front-clay.png'), fullPage: true });
  for (const view of ['Front', 'Side', 'Back', 'Portrait']) {
    await page.getByRole('button', { name: view, exact: true }).click();
    for (const surface of ['Silhouette', 'Clay', 'Material']) {
      await page.getByRole('button', { name: surface, exact: true }).click();
      await expect(viewer).toHaveAttribute('data-surface', surface);
      await page
        .locator('.dcc-comparison-stage')
        .screenshot({ path: info.outputPath(`direction-${view}-${surface}.png`) });
    }
  }
  const camera = await viewer.getAttribute('data-camera');
  const zero = await page.locator('canvas').screenshot();
  await page.getByLabel('Shared animation time').fill('3');
  await expect(viewer).toHaveAttribute('data-time', '3.000');
  expect((await page.locator('canvas').screenshot()).equals(zero)).toBe(false);
  await page.getByLabel('Shared animation time').fill('6');
  await expect(viewer).toHaveAttribute('data-time', '6.000');
  expect((await page.locator('canvas').screenshot()).equals(zero)).toBe(true);
  await page.getByRole('button', { name: /Quality before/ }).click();
  await expect(viewer).toHaveAttribute('data-pair', '2,3');
  await expect(viewer).toHaveAttribute('data-camera', camera!);
  await expect(viewer).toHaveAttribute('data-time', '6.000');
  await page.getByRole('button', { name: /Swap sides/ }).click();
  await expect(viewer).toHaveAttribute('data-pair', '3,2');
  await expect(viewer).toHaveAttribute('data-camera', camera!);
  await page.getByRole('button', { name: /Swap sides/ }).click();
  await page.getByLabel('Shared animation time').fill('0');
  for (const view of ['Front', 'Side', 'Back', 'Portrait']) {
    await page.getByRole('button', { name: view, exact: true }).click();
    for (const surface of ['Clay', 'Material']) {
      await page.getByRole('button', { name: surface, exact: true }).click();
      await expect(viewer).toHaveAttribute('data-surface', surface);
      await page
        .locator('.dcc-comparison-stage')
        .screenshot({ path: info.outputPath(`revision-${view}-${surface}.png`) });
    }
  }
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) throw new Error('Missing comparison canvas');
  const orbitBefore = await viewer.getAttribute('data-camera');
  await page.mouse.move(canvas.x + 100, canvas.y + 220);
  await page.mouse.down();
  await page.mouse.move(canvas.x + 190, canvas.y + 245, { steps: 5 });
  await page.mouse.up();
  await expect(viewer).not.toHaveAttribute('data-camera', orbitBefore!);
  await page.getByRole('button', { name: 'Reset camera' }).click();
  await expect(viewer).toHaveAttribute('data-camera', orbitBefore!);
  await page.getByRole('button', { name: 'Play comparison', exact: true }).click();
  await expect(viewer).not.toHaveAttribute('data-time', '0.000');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByRole('button', { name: 'Play comparison', exact: true })).toBeVisible();
  await page.getByLabel('Shared animation time').fill('0');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }).toPass();
  await page.screenshot({ path: info.outputPath('comparison-phone.png'), fullPage: true });
  await page.getByRole('button', { name: 'Return to my table' }).click();
  await expect(page).not.toHaveURL(/workbench=|compare=/);
  await expect(entry).toBeFocused();
  await entry.click();
  await expect(page.locator('.dcc-render')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: /Compare Hydra versions/ }).click();
  await expect(viewer).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Back to workbench' }).click();
  await expect(page.locator('.dcc-render')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Return to my table' }).click();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(saves);
  expect(errors).toEqual([]);
});

test('Hydra comparison can be linked and failed loading leaves navigation available', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/blender-before.glb*', (route) =>
    route.request().resourceType() === 'fetch' ? route.abort() : route.continue(),
  );
  await page.goto('/?workbench=dcc&compare=hydra');
  await expect(page.getByRole('alert')).toContainText('could not be loaded');
  await page.getByRole('button', { name: 'Back to workbench' }).click();
  await expect(page).not.toHaveURL(/compare=/);
  await expect(page.locator('.dcc-render')).toHaveAttribute('data-ready', 'true');
});
