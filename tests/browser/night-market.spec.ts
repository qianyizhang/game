import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { NIGHT_MARKET_JOKERS } from '../../src/games/balatro/content/night-market-jokers';
import { NIGHT_MARKET_MINIONS } from '../../src/games/battlegrounds/content/night-market-minions';
import { blindsideSession } from '../../src/games/balatro/application/session';

for (const [game, cards, selector] of [
  ['balatro', NIGHT_MARKET_JOKERS, '.catalogue-card'],
  ['battlegrounds', NIGHT_MARKET_MINIONS, '.minion-catalogue .minion-card'],
] as const) {
  test(`${game} Night Market cards are searchable, illustrated and readable on phones`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await page.getByLabel('Choose game').selectOption(game);
    await page.getByRole('button', { name: /Collection/ }).click();
    for (const card of cards) {
      await page.getByLabel('Search collection').fill(card.name);
      await expect(page.locator(selector)).toHaveCount(1);
      await expect(page.locator(selector)).toContainText(card.name);
      await expect(page.locator(selector).locator('svg.card-art')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`${game}-market-phone.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}

test('market shop illustrations preserve purchases, tag labels and older saved runs', async ({
  page,
}, info) => {
  const oldKey = 'card-workshop.blindside.v3';
  const oldRun = JSON.stringify({ preserved: 'prior version save' });
  await page.addInitScript(({ oldKey, oldRun }) => localStorage.setItem(oldKey, oldRun), {
    oldKey,
    oldRun,
  });
  await page.goto('/');
  await expect(page.locator('.skip-offer .shop-art-tag')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip blind for this tag' })).toBeVisible();
  const replay = JSON.parse(readFileSync('tests/fixtures/blindside-win.json', 'utf8'));
  let session = blindsideSession.create(replay.seed);
  for (const command of replay.commands) {
    const result = blindsideSession.act(session, command);
    expect(result.error).toBeUndefined();
    session = result.session;
    if (
      session.state.phase === 'shop' &&
      session.state.cash >= 22 &&
      session.state.jokers.length < 5
    )
      break;
  }
  expect(session.state.phase).toBe('shop');
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'market-shop.json',
    mimeType: 'application/json',
    buffer: Buffer.from(blindsideSession.encode(session)),
  });
  await expect(page.locator('.extras-grid .shop-art-pack')).toHaveCount(session.state.packs.length);
  await expect(page.locator('.extras-grid .shop-art-voucher')).toHaveCount(1);
  const clippedJokers = () =>
    page
      .locator('.owned-joker')
      .evaluateAll((cards) =>
        cards
          .filter((card) => card.scrollHeight > card.clientHeight + 1)
          .map((card) => card.textContent),
      );
  expect(await clippedJokers()).toEqual([]);
  // Shop CSS must preserve the SVG viewBox instead of the generic 90px article height.
  for (const art of await page.locator('.extras-grid .shop-art').all()) {
    const bounds = await art.boundingBox();
    expect(bounds!.width / bounds!.height).toBeCloseTo(160 / 112, 2);
  }
  await page.screenshot({ path: info.outputPath('market-shop-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Buy voucher · $10' }).click();
  await expect(page.locator('.voucher-rack .shop-art-voucher')).toBeVisible();
  expect(await clippedJokers()).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('market-shop-phone.png'), fullPage: true });
  await page
    .getByRole('button', { name: /Open pack/ })
    .first()
    .click();
  await expect(page.locator('.pack-choice')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), oldKey)).toBe(oldRun);
});

test('Silent upgrade plates render in a playable hand at desktop and phone sizes', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('spire');
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  const deck = ['deadlyPoison', 'bladeDance', 'afterImage', 'envenom', 'infiniteBlades'];
  await page
    .getByLabel('Scenario setup')
    .fill(JSON.stringify({ character: 'silent', deck, upgrades: deck, enemies: ['sentry'] }));
  await page.getByRole('button', { name: 'Start practice scenario' }).click();
  const skip = page.getByRole('button', { name: 'Skip to result' });
  if (await skip.isVisible()) await skip.click();
  await expect(page.locator('.battle-hand .ability-card.upgraded svg.card-art')).toHaveCount(5);
  await page.screenshot({ path: info.outputPath('silent-upgrades-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('silent-upgrades-phone.png'), fullPage: true });
});
