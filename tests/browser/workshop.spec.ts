import { expect, test, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { importReplay, SAVE_KEY } from '../../src/games/balatro/application/session';
import { scoreHand } from '../../src/games/balatro/domain/scoring';
import { JOKERS, JOKER_BY_ID } from '../../src/games/balatro/content/jokers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('card-workshop.playback-speed', '100'));
});

async function saved(page: Page) {
  const value = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  return importReplay(value!);
}
async function playBestHand(page: Page) {
  const { run } = await saved(page);
  let best: string[] = [];
  let score = -1;
  for (let bits = 1; bits < 2 ** run.hand.length; bits++) {
    const cards = run.hand.filter((_, i) => (bits & (1 << i)) !== 0);
    if (cards.length > 5) continue;
    const value = scoreHand(run, cards).total;
    if (value > score) {
      score = value;
      best = cards;
    }
  }
  for (const id of best) await page.locator('.playing-card').nth(run.hand.indexOf(id)).click();
  await page.getByRole('button', { name: 'Play hand' }).click();
}

test('play, inspect, save, shop, buy, reorder, advance and resume', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Every hand/ })).toBeVisible();
  await page.screenshot({ path: info.outputPath('desktop-ready.png'), fullPage: true });
  await page.getByRole('button', { name: 'Play Small Blind' }).click();
  await expect(page.locator('.playing-card')).toHaveCount(8);
  await page.locator('.playing-card').first().click();
  await expect(page.getByRole('heading', { name: 'Your hand, explained.' })).toBeVisible();
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  expect((await saved(page)).run.discardsLeft).toBe(2);
  await page.screenshot({ path: info.outputPath('desktop-playing.png'), fullPage: true });
  for (let hand = 0; hand < 4 && (await saved(page)).run.phase === 'playing'; hand++)
    await playBestHand(page);
  await expect(
    page.getByRole('heading', { name: 'Find your next unfair advantage.' }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath('desktop-shop.png'), fullPage: true });
  const affordable = page
    .locator('.shop-card')
    .filter({ has: page.getByRole('button', { name: /^Buy/ }) })
    .getByRole('button', { name: /^Buy/ });
  await affordable.first().click();
  await expect(page.locator('.owned-joker')).toHaveCount(1);
  await affordable.first().click();
  await expect(page.locator('.owned-joker')).toHaveCount(2);
  const previousOrder = (await saved(page)).run.jokers;
  const movedName = JOKER_BY_ID[previousOrder[1].definitionId].name;
  await page.getByRole('button', { name: `Move ${movedName} left`, exact: true }).click();
  await expect(page.locator('.owned-joker').first()).toContainText(movedName);
  expect((await saved(page)).run.jokers.map((j) => j.id)).toEqual([
    previousOrder[1].id,
    previousOrder[0].id,
  ]);
  const before = await saved(page);
  await page.reload();
  expect(await saved(page)).toEqual(before);
  await expect(page.locator('.owned-joker')).toHaveCount(2);
  await page.getByRole('button', { name: 'Next blind' }).click();
  await page.getByRole('button', { name: 'Play Big Blind' }).click();
  expect((await saved(page)).run.blind).toBe(1);
  await expect(page.locator('.playing-card')).toHaveCount(8);
  await page.getByRole('button', { name: 'Rank', exact: true }).click();
  const sorted = (await saved(page)).run;
  const ranks = sorted.hand.map((id) => sorted.deck.find((card) => card.id === id)!.rank);
  expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
  await page.getByRole('button', { name: 'Move card 1 right', exact: true }).click();
  expect((await saved(page)).run.hand[1]).toBe(sorted.hand[0]);
  expect(errors).toEqual([]);
});

test('collection, mod guide, export/import and new seed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Collection' }).click();
  await expect(page.locator('.catalogue-card')).toHaveCount(JOKERS.length);
  await page.getByRole('textbox', { name: 'Search collection' }).fill('Retrigger');
  await expect(page.getByRole('heading', { name: 'Little Echo' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search collection' }).fill('');
  await page.getByRole('button', { name: 'Consumables', exact: true }).click();
  await expect(page.locator('.catalogue-card')).toHaveCount(18);
  await page.getByRole('button', { name: 'The workshop' }).click();
  await expect(page.getByRole('heading', { name: 'Make it your game.' })).toBeVisible();
  await page.getByRole('button', { name: '+ New run' }).click();
  await page.getByLabel('Run seed').fill('BROWSER-ROUNDTRIP');
  await page.getByRole('button', { name: 'Start new run' }).click();
  await page.getByRole('button', { name: 'Play Small Blind' }).click();
  const before = await saved(page);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const download = await downloadEvent;
  await page.getByLabel('Import replay file').setInputFiles((await download.path())!);
  expect(await saved(page)).toEqual(before);
  const corruptedFile = {
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"game":"wrong"}'),
  };
  await page.getByLabel('Import replay file').setInputFiles(corruptedFile);
  await expect(page.getByRole('alert')).toContainText('Import failed');
  expect(await saved(page)).toEqual(before);
});

test('phone layout stays within viewport and actions are reachable', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play Small Blind' }).click();
  await page.locator('.playing-card').first().click();
  await page.getByRole('button', { name: 'Play hand' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: info.outputPath('phone-playing.png'), fullPage: true });
  await page.getByRole('button', { name: 'Guide', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Build an engine.' })).toBeVisible();
});

test('a complete legal eight-ante replay restores its victory screen', async ({ page }, info) => {
  await page.goto('/');
  await page
    .getByLabel('Import replay file')
    .setInputFiles(resolve('tests/fixtures/blindside-win.json'));
  await expect(page.getByRole('heading', { name: 'You broke the blind.' })).toBeVisible();
  const session = await saved(page);
  expect(session.run.phase).toBe('won');
  expect(session.run.ante).toBe(8);
  expect(session.replay.commands.filter((command) => command.type === 'startBlind')).toHaveLength(
    24,
  );
  await page.screenshot({ path: info.outputPath('desktop-victory.png'), fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'You broke the blind.' })).toBeVisible();
});
