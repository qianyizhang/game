import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

test('independent asset comparisons, changelog links, offline delivery and phone layout', async ({
  page,
}, info) => {
  const output = info.outputPath('gallery');
  execFileSync(process.execPath, ['packages/workshop-tools/art/gallery.ts', output]);
  const html = readFileSync(`${output}/index.html`);
  expect(html.length).toBeLessThanOrEqual(600 * 1024);
  // Serve the generated file unchanged: Vite's dev client would add a script to static HTML.
  await page.route('**/asset-review.html', (route) =>
    route.fulfill({ contentType: 'text/html', body: html }),
  );
  const external: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== 'http://127.0.0.1:4173')
      external.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('asset-review-save-sentinel', 'unchanged'));
  await page.goto('/asset-review.html');
  const saved = await page.evaluate(() => ({ ...localStorage }));
  await expect(page.getByRole('heading', { name: 'Latest changes', exact: true })).toBeVisible();
  const dates = await page
    .locator('time')
    .evaluateAll((times) => times.map((t) => t.getAttribute('datetime')!));
  expect(dates).toEqual([...dates].sort().reverse());
  for (const href of await page
    .locator('.change-links a[href^="#"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')!)))
    await expect(page.locator(href)).toHaveCount(1);
  const attack = page.locator('#asset-attack details');
  const block = page.locator('#asset-block details');
  await attack.locator('summary').focus();
  await page.keyboard.press('Enter');
  await block.locator('summary').click();
  await expect(attack).toHaveAttribute('open', '');
  await expect(block).toHaveAttribute('open', '');
  await attack.locator('summary').click();
  await expect(attack).not.toHaveAttribute('open', '');
  await expect(block).toHaveAttribute('open', '');
  const decoded: boolean[] = [];
  for (const image of await page.locator('img').all()) {
    // Retained history can put a lazy capture outside the initial preload distance.
    await image.scrollIntoViewIfNeeded();
    decoded.push(
      await image.evaluate(async (node) => {
        const img = node as HTMLImageElement;
        await img.decode();
        return img.naturalWidth > 0 && img.naturalHeight > 0;
      }),
    );
  }
  expect(decoded).toEqual(Array<boolean>(10).fill(true));
  const map = page.locator('#review-cartographer');
  await map.locator('summary').click();
  await expect(map).not.toHaveAttribute('open', '');
  await expect(page.locator('#review-hearth-shield')).toHaveAttribute('open', '');
  await expect(page.locator('#review-score')).toHaveAttribute('open', '');
  await expect(page.locator('#review-combat')).toHaveAttribute('open', '');
  await map.locator('summary').click();
  await expect(page.getByText('Local only · not submitted', { exact: true })).toBeVisible();
  const shield = page.locator('#review-hearth-shield');
  const score = page.locator('#review-score');
  await shield.locator('summary').click();
  await expect(shield).not.toHaveAttribute('open', '');
  await expect(score).toHaveAttribute('open', '');
  await expect(page.locator('#review-combat')).toHaveAttribute('open', '');
  await shield.locator('summary').click();
  await expect(shield.locator('.hearth-shield-break')).toHaveText('Shield broken');
  await score.locator('summary').click();
  await expect(score).not.toHaveAttribute('open', '');
  await expect(shield).toHaveAttribute('open', '');
  await expect(page.locator('#review-combat')).toHaveAttribute('open', '');
  await expect(block).toHaveAttribute('open', '');
  await score.locator('summary').click();
  await expect(score.locator('.score-source h3')).toHaveText('Spark');
  await expect(page.locator('script')).toHaveCount(0);
  await map.screenshot({ path: info.outputPath('gallery-cartographer-desktop.png') });
  await shield.screenshot({
    path: info.outputPath('gallery-shield-desktop.png'),
    animations: 'disabled',
  });
  await score.screenshot({
    path: info.outputPath('gallery-score-desktop.png'),
    animations: 'disabled',
  });
  await page.screenshot({ path: info.outputPath('gallery-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await map.screenshot({ path: info.outputPath('gallery-cartographer-phone.png') });
  await shield.screenshot({
    path: info.outputPath('gallery-shield-phone.png'),
    animations: 'disabled',
  });
  await score.screenshot({
    path: info.outputPath('gallery-score-phone.png'),
    animations: 'disabled',
  });
  await page.screenshot({ path: info.outputPath('gallery-phone.png'), fullPage: true });
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(saved);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  // The portable delivery contains the same preserved, dated source history.
  expect(readFileSync(`${output}/CHANGELOG.json`, 'utf8')).toBe(
    readFileSync('src/asset-gallery/CHANGELOG.json', 'utf8'),
  );
  expect(relative(process.cwd(), output)).not.toContain('..');
});
