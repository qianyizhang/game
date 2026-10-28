import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

test.skip(process.env.BLINDSIDE_JOKER_CAPTURE !== '1', 'Manual issue 37 capture only.');

const output = resolve('test-results/issue37-context');
const seed = 'JOKER-REVIEW-5';
const setup = {
  cash: 100,
  jokers: ['spark', 'granite', 'duet', 'twins', 'trio'],
  deck: Array.from({ length: 12 }, () => ({ rank: 10, suit: 'hearts' })),
};
const names = ['Spark', 'Granite', 'Duet', 'Double Take', 'Trio', 'Stairway'];
const source = 'src/games/balatro/ui/art/jokers.tsx';
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
const head = (cwd: string) =>
  execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();

async function collection(page: Page, url: string, label: string, size: string) {
  await page.goto(url);
  await page.getByLabel('Choose game').selectOption('balatro');
  await page.getByRole('button', { name: /Collection/ }).click();
  const cards = page.locator('.catalogue-card');
  for (const [index, name] of names.entries()) {
    await expect(cards.nth(index)).toContainText(name);
    await expect(cards.nth(index).locator('svg.card-art')).toHaveAttribute('aria-hidden', 'true');
  }
  const clip = await cards.evaluateAll((nodes) => {
    const first = nodes[0].getBoundingClientRect();
    const last = nodes[5].getBoundingClientRect();
    const x = Math.floor(first.left + window.scrollX);
    const y = Math.floor(first.top + window.scrollY);
    return {
      x,
      y,
      width: Math.ceil(last.right + window.scrollX - x),
      height: Math.ceil(last.bottom + window.scrollY - y),
    };
  });
  expect(clip.width).toBeGreaterThan(100);
  expect(clip.height).toBeGreaterThan(80);
  await page.screenshot({
    path: join(output, `${label}-collection-${size}.png`),
    clip,
    animations: 'disabled',
  });
}

async function shopAndHeld(page: Page, url: string, label: string, size: string) {
  await page.goto(url);
  await page.getByLabel('Choose game').selectOption('balatro');
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  await page.getByLabel('Scenario seed').fill(seed);
  await page.getByLabel('Scenario setup').fill(JSON.stringify(setup));
  await page.getByRole('button', { name: 'Start practice scenario →' }).click();
  for (let index = 0; index < 5; index++) await page.locator('.playing-card').nth(index).click();
  await page.getByRole('button', { name: 'Play hand' }).click();
  const skip = page.getByRole('button', { name: 'Skip to result' });
  if (await skip.isVisible()) await skip.click();
  await expect(
    page.getByRole('heading', { name: 'Find your next unfair advantage.' }),
  ).toBeVisible();
  const held = page.locator('.owned-joker');
  await expect(held).toHaveCount(5);
  for (const [index, name] of names.slice(0, 5).entries())
    await expect(held.nth(index)).toContainText(name);
  const stair = page.locator('.shop-card').filter({ hasText: 'Stairway' });
  await expect(stair).toHaveCount(1);
  await expect(stair).toContainText('Buy');
  await page.locator('.joker-rack').screenshot({
    path: join(output, `${label}-held-${size}.png`),
    animations: 'disabled',
  });
  await stair.screenshot({
    path: join(output, `${label}-shop-${size}.png`),
    animations: 'disabled',
  });
}

test('capture matched opening Joker collection, held rack and shop at desktop and phone sizes', async ({
  page,
  browser,
}) => {
  const baselineDir = process.env.BLINDSIDE_JOKER_BASE_DIR;
  if (!baselineDir) throw new Error('Baseline worktree is required.');
  const baselineSha = head(baselineDir);
  const candidateSha = head(process.cwd());
  expect(baselineSha).toBe(process.env.BLINDSIDE_JOKER_BASE_SHA);
  expect(candidateSha).toBe(process.env.GITHUB_SHA);
  const baselineSourceSha256 = sha256(join(baselineDir, source));
  const candidateSourceSha256 = sha256(resolve(source));
  expect(baselineSourceSha256).toBe(process.env.BLINDSIDE_JOKER_BASE_SOURCE_SHA256);
  expect(candidateSourceSha256).toBe(process.env.BLINDSIDE_JOKER_CANDIDATE_SOURCE_SHA256);
  mkdirSync(output, { recursive: true });
  await page.addInitScript(() => localStorage.setItem('card-workshop.playback-speed', '1000'));
  for (const [label, url] of [
    ['baseline', 'http://127.0.0.1:4174/'],
    ['candidate', 'http://127.0.0.1:4173/'],
  ]) {
    for (const viewport of [
      { name: 'desktop', width: 1440, height: 1080 },
      { name: 'phone', width: 390, height: 844 },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await collection(page, url, label, viewport.name);
      if (viewport.name === 'phone')
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      await shopAndHeld(page, url, label, viewport.name);
      if (viewport.name === 'phone')
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
    }
  }
  const files = readdirSync(output)
    .filter((name) => name.endsWith('.png'))
    .sort();
  expect(files).toHaveLength(12);
  writeFileSync(
    join(output, 'receipt.json'),
    JSON.stringify(
      {
        baselineSha,
        candidateSha,
        baselineSourceSha256,
        candidateSourceSha256,
        browser: browser.version(),
        seed,
        setup,
        viewports: ['1440x1080', '390x844'],
        screenshots: Object.fromEntries(files.map((name) => [name, sha256(join(output, name))])),
      },
      null,
      2,
    ),
  );
});
