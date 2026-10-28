import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('Lantern Keep plays offline and preserves deterministic pixel scaling', async ({ page }) => {
  const html = readFileSync('docs/art/studies/lantern-keep/lantern-keep.html');
  const errors: string[] = [];
  const dependencies: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', (route) => {
    if (new URL(route.request().url()).pathname === '/lantern-keep.html')
      return route.fulfill({ contentType: 'text/html', body: html });
    dependencies.push(route.request().url());
    return route.abort();
  });
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto('/lantern-keep.html');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('width', '300');
  const first = await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL());
  await expect
    .poll(() => canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL()))
    .not.toBe(first);
  await expect(page.locator('button, input, select, a')).toHaveCount(0);

  await page.goto('/lantern-keep.html?capture');
  const frames = await page.evaluate(() => {
    const scene = window as unknown as { renderAt: (seconds: number) => void };
    const canvas = document.querySelector('canvas')!;
    const frame = (seconds: number) => {
      scene.renderAt(seconds);
      return canvas.toDataURL();
    };
    return [frame(0), frame(3), frame(10.5), frame(14), frame(0)];
  });
  expect(new Set(frames.slice(0, 4)).size).toBe(4);
  expect(frames[4]).toBe(frames[0]);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(canvas).toHaveAttribute('width', '130');
  await expect(canvas).toHaveCSS('width', '390px');
  expect(errors).toEqual([]);
  expect(dependencies).toEqual([]);
});
