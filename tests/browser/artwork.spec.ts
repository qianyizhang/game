import { expect, test } from '@playwright/test';
import { JOKERS } from '../../src/games/balatro/content/jokers';
import { CONSUMABLES } from '../../src/games/balatro/content/consumables';
import { BOSSES } from '../../src/games/balatro/content/blinds';
import { CARDS } from '../../src/games/spire/content/cards';
import { MINIONS } from '../../src/games/battlegrounds/content/minions';
import { blindsideSession } from '../../src/games/balatro/application/session';
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

// A legal two-hand Small Blind win: both giants in the shop and a Mega Celestial pack.
function planetShop() {
  let session = blindsideSession.create('PLANET-PRINT-16');
  for (const command of [
    { type: 'startBlind' as const },
    { type: 'play' as const, cards: ['card-52', 'card-45', 'card-26', 'card-6'] },
    { type: 'play' as const, cards: ['card-22', 'card-47', 'card-50', 'card-20', 'card-23'] },
  ]) {
    const result = blindsideSession.act(session, command);
    expect(result.error).toBeUndefined();
    session = result.session;
  }
  expect(session.state.phase).toBe('shop');
  return session;
}

async function savedPlanets(page: Page) {
  const text = await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key);
  return blindsideSession.decode(text!);
}

async function importPlanetShop(page: Page) {
  await page.addInitScript(() => localStorage.setItem('card-workshop.playback-speed', '100'));
  await page.goto('/');
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'planet-shop.json',
    mimeType: 'application/json',
    buffer: Buffer.from(blindsideSession.encode(planetShop())),
  });
  const skip = page.getByRole('button', { name: 'Skip to result' });
  if (await skip.isVisible()) await skip.click();
  await expect(page.getByRole('button', { name: 'Next blind' })).toBeVisible();
}

const collections = [
  { game: 'balatro', cards: '.catalogue-card', count: JOKERS.length },
  { game: 'spire', cards: '.ability-grid .ability-card', count: CARDS.length },
  { game: 'battlegrounds', cards: '.minion-catalogue .minion-card', count: MINIONS.length },
];

for (const collection of collections) {
  test(`${collection.game} illustrations preserve collection labels and phone layout`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
    await page.goto('/');
    await page.getByLabel('Choose game').selectOption(collection.game);
    await page.getByRole('button', { name: /Collection/ }).click();
    const cards = page.locator(collection.cards);
    await expect(cards).toHaveCount(collection.count);
    await expect(cards.locator('svg.card-art')).toHaveCount(collection.count);
    await expect(cards.first()).toContainText(
      collection.game === 'balatro'
        ? 'Spark'
        : collection.game === 'spire'
          ? 'Strike'
          : MINIONS[0].name,
    );
    const art = cards.first().locator('svg.card-art');
    await expect(art).toHaveAttribute('aria-hidden', 'true');
    await expect(art).toHaveAttribute('focusable', 'false');
    await page.screenshot({ path: info.outputPath(`${collection.game}-illustrated-desktop.png`) });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const bounds = await art.boundingBox();
    expect(bounds!.width).toBeGreaterThan(70);
    expect(bounds!.height).toBeGreaterThan(45);
    await page.screenshot({ path: info.outputPath(`${collection.game}-illustrated-phone.png`) });
    if (collection.game === 'balatro') {
      await page.getByRole('button', { name: 'Consumables', exact: true }).click();
      await expect(cards.locator('svg.card-art')).toHaveCount(CONSUMABLES.length);
      await page.getByRole('button', { name: 'Bosses', exact: true }).click();
      await expect(cards.locator('svg.card-art')).toHaveCount(BOSSES.length);
    }
    expect(errors).toEqual([]);
  });
}

test('illustrated playing cards retain keyboard selection and readable ranks', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play Small Blind' }).click();
  const cards = page.locator('.playing-card');
  await expect(cards).toHaveCount(8);
  await expect(cards.locator('.blindside-poker-art')).toHaveCount(8);
  await expect(cards.first()).toHaveAccessibleName(
    /(?:[2-9]|10|J|Q|K|A) of (?:hearts|diamonds|spades|clubs)/,
  );
  await cards.first().focus();
  await page.keyboard.press('Space');
  await expect(cards.first()).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: info.outputPath('blindside-illustrated-hand.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: info.outputPath('blindside-illustrated-hand-phone.png'),
    fullPage: true,
  });
});

test('planet identities survive collection, pocket use, levels and replay reload', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await importPlanetShop(page);
  await page.getByRole('button', { name: 'Collection', exact: true }).click();
  await page.getByRole('button', { name: 'Consumables', exact: true }).click();
  await page.getByLabel('Search collection').fill('Level up');
  const worlds = page.locator('.catalogue-card');
  await expect(worlds).toHaveCount(9);
  for (const name of [
    'Mercury',
    'Venus',
    'Earth',
    'Mars',
    'Jupiter',
    'Saturn',
    'Uranus',
    'Neptune',
    'Pluto',
  ])
    await expect(worlds.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(worlds.locator('svg')).toHaveCount(9);
  await page.screenshot({
    path: info.outputPath('planets-collection-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('planets-collection-phone.png'), fullPage: true });
  await page.reload(); // Collection is transient; reload returns to the saved shop.
  for (const name of ['Jupiter', 'Saturn']) {
    const offer = page
      .locator('.shop-card')
      .filter({ has: page.getByRole('heading', { name, exact: true }) });
    await offer.getByRole('button', { name: 'Buy · $3', exact: true }).click();
  }
  expect((await savedPlanets(page)).state.cash).toBe(6);
  await expect(page.locator('.pocket')).toHaveCount(2);
  await page.getByRole('button', { name: 'Next blind' }).click();
  await page.getByRole('button', { name: 'Play Big Blind' }).click();
  const beforeUse = await savedPlanets(page);
  await expect(page.locator('.playing-card')).toHaveCount(8);
  await expect(page.locator('.pocket svg').first()).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.pocket svg').first()).toHaveAttribute('focusable', 'false');
  expect((await page.locator('.pocket svg').first().boundingBox())!.width).toBe(48);
  await page.screenshot({ path: info.outputPath('planets-playing-phone.png'), fullPage: true });
  await page
    .locator('.consumable-bar')
    .screenshot({ path: info.outputPath('planets-pocket-phone.png') });
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.screenshot({ path: info.outputPath('planets-playing-desktop.png'), fullPage: true });
  await page
    .locator('.consumable-bar')
    .screenshot({ path: info.outputPath('planets-pocket-desktop.png') });
  const jupiter = page
    .locator('.pocket')
    .filter({ has: page.getByText('Jupiter', { exact: true }) });
  await jupiter.getByRole('button', { name: 'Use', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.pocket')).toHaveCount(1);
  let afterUse = await savedPlanets(page);
  expect(afterUse.state.levels.straight).toBe(2);
  expect(afterUse.state.levels.flush).toBe(1);
  expect(afterUse.state.deck).toEqual(beforeUse.state.deck);
  expect(afterUse.state.hand).toEqual(beforeUse.state.hand);
  await page.locator('.pocket').getByRole('button', { name: 'Use', exact: true }).click();
  await expect(page.locator('.pocket')).toHaveCount(0);
  afterUse = await savedPlanets(page);
  expect(afterUse.state.levels.flush).toBe(2);
  await page.reload();
  expect(await savedPlanets(page)).toEqual(afterUse);
  await expect(page.locator('.pocket')).toHaveCount(0);
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const bytes = readFileSync(await (await downloaded).path(), 'utf8');
  expect(blindsideSession.decode(bytes)).toEqual(afterUse);
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'planets-used.json',
    mimeType: 'application/json',
    buffer: Buffer.from(bytes),
  });
  expect(await savedPlanets(page)).toEqual(afterUse);
  expect(errors).toEqual([]);
});

test('planet booster choices apply immediately and preserve pocket use rules', async ({
  page,
}, info) => {
  await importPlanetShop(page);
  const jupiter = page
    .locator('.shop-card')
    .filter({ has: page.getByRole('heading', { name: 'Jupiter', exact: true }) });
  await jupiter.getByRole('button', { name: 'Buy · $3', exact: true }).click();
  const pack = page
    .locator('.extras-grid article')
    .filter({ has: page.getByRole('heading', { name: 'Mega Celestial Pack', exact: true }) });
  await pack.getByRole('button', { name: 'Open pack · $8', exact: true }).click();
  await expect(page.locator('.pack-choice .extras-grid article')).toHaveCount(5);
  await expect(
    page.locator('.pocket').getByRole('button', { name: 'Use', exact: true }),
  ).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('planets-booster-phone.png'), fullPage: true });
  const before = await savedPlanets(page);
  expect(before.state.cash).toBe(1);
  const planet = before.state.pack!.choices[0];
  if (planet.kind !== 'planet') throw new Error('Expected a planet choice.');
  const definition = CONSUMABLES.find((item) => item.id === planet.definitionId)!;
  if (definition.effect.type !== 'level') throw new Error('Expected a hand upgrade.');
  await page
    .locator('.pack-choice')
    .getByRole('button', { name: 'Use planet', exact: true })
    .first()
    .click();
  const picked = await savedPlanets(page);
  expect(picked.state.levels[definition.effect.hand]).toBe(2);
  expect(picked.state.consumables).toEqual(before.state.consumables);
  expect(picked.state.pack!.remaining).toBe(1);
  await page.reload();
  expect(await savedPlanets(page)).toEqual(picked);
  await expect(page.locator('.pack-choice')).toBeVisible();
  await page.getByRole('button', { name: 'Skip remaining choices' }).click();
  await expect(page.getByRole('button', { name: 'Next blind' })).toBeVisible();
  await expect(
    page.locator('.pocket').getByRole('button', { name: 'Use', exact: true }),
  ).toBeEnabled();
});
