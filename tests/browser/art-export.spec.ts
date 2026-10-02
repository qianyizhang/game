import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('standalone SVG assets load without app CSS and the cabinet filters by collection', async ({
  page,
}, info) => {
  execFileSync(process.execPath, ['scripts/export-card-art.mjs'], { cwd: process.cwd() });
  const manifest = JSON.parse(readFileSync('test-results/card-art/manifest.json', 'utf8')) as {
    file: string;
  }[];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/test-results/card-art/index.html');
  await expect(page.locator('.asset')).toHaveCount(manifest.length);
  // Decoding catches malformed SVGs and broken links across every exported asset.
  const failed = await page.locator('.asset img').evaluateAll(async (images) => {
    const results = await Promise.all(
      images.map(async (image) => {
        const img = image as HTMLImageElement;
        img.loading = 'eager';
        try {
          await img.decode();
          return img.naturalWidth > 0 ? null : img.getAttribute('src');
        } catch {
          return img.getAttribute('src');
        }
      }),
    );
    return results.filter(Boolean);
  });
  expect(failed).toEqual([]);
  for (const [group, file] of [
    ['Blindside · Jokers', 'blindside-cabinet'],
    ['Slay the Spire · Cards', 'spire-cabinet'],
    ['Last Hearth · Minions', 'hearth-cabinet'],
    ['Shared · Primitives', 'primitives-cabinet'],
  ]) {
    await page.getByLabel('Collection', { exact: true }).selectOption(group);
    await page.screenshot({ path: info.outputPath(`${file}.png`), fullPage: true });
  }
  await page.getByLabel('Find an illustration').fill('sword');
  await expect(page.locator('.asset:visible')).toHaveCount(1);
  await expect(page.locator('.asset:visible')).toHaveAttribute('href', 'primitives/sword.svg');
  await page.getByLabel('Find an illustration').fill('no-such-illustration');
  await expect(page.locator('#count')).toHaveText('0 illustrations');
  await expect(page.locator('#empty')).toBeVisible();
  await page.getByLabel('Find an illustration').fill('  SWORD  ');
  await expect(page.locator('.asset:visible')).toHaveCount(1);
  await expect(page.locator('#empty')).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
