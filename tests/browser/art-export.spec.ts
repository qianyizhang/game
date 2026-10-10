import { expect, test } from '@playwright/test';
import { browserBudget } from './budget';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

test('standalone SVG assets load without app CSS and the cabinet filters by collection', async ({
  page,
}, info) => {
  const output = info.outputPath('cabinet');
  execFileSync(process.execPath, ['packages/workshop-tools/art/export.ts', output]);
  const manifest = JSON.parse(readFileSync(`${output}/manifest.json`, 'utf8')) as {
    file: string;
  }[];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/' + relative(process.cwd(), output).split('\\').join('/') + '/index.html');
  await expect(page.locator('.asset')).toHaveCount(manifest.length);
  // Decoding catches malformed SVGs and broken links across every exported asset.
  // Vite may reload a just-created cabinet; retry decoding the complete current document.
  await expect(async () => {
    const decoded = await page.locator('.asset img').evaluateAll(async (images) => {
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
      return { count: images.length, failed: results.filter(Boolean) };
    });
    expect(decoded.count).toBe(manifest.length);
    expect(decoded.failed).toEqual([]);
  }).toPass({ timeout: browserBudget(10_000) });
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
