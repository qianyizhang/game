import { expect, test } from '@playwright/test';
import { JOKERS } from '../../src/games/balatro/content/jokers';
import { CONSUMABLES } from '../../src/games/balatro/content/consumables';
import { BOSSES } from '../../src/games/balatro/content/blinds';
import { CARDS } from '../../src/games/spire/content/cards';
import { MINIONS } from '../../src/games/battlegrounds/content/minions';

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
