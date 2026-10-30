import { expect, test } from '@playwright/test';
import { blindsideSession } from '../../src/games/balatro/application/session';
import { replayCodec } from '../../src/shared/replay';
import type { Command } from '../../src/games/balatro/domain/types';

const practice = replayCodec(blindsideSession.rules, true);

// An eight-card practice deck, two legal blind wins, and purchased Erasers.
function sixCardDeck() {
  let session = practice.create('ERASER-BOUNDARY', {
    cash: 999,
    jokers: ['granite', 'spark'],
    deck: [7, 8, 9, 10, 11, 12, 13, 14].map((rank) => ({ rank, suit: 'hearts' })),
  });
  const commands: Command[] = [
    { type: 'play', cards: ['card-55', 'card-56', 'card-57', 'card-58', 'card-59'] },
    { type: 'reroll' },
    { type: 'buy', offerId: 'offer-78' },
    ...Array.from({ length: 4 }, () => ({ type: 'reroll' as const })),
    { type: 'buy', offerId: 'offer-106' },
    { type: 'leaveShop' },
    { type: 'startBlind' },
    { type: 'useConsumable', id: 'consumable-79', cards: ['card-55', 'card-56'] },
    { type: 'play', cards: ['card-57', 'card-58', 'card-59', 'card-60', 'card-61'] },
    ...Array.from({ length: 3 }, () => ({ type: 'reroll' as const })),
    { type: 'buy', offerId: 'offer-136' },
    { type: 'leaveShop' },
    { type: 'startBlind' },
  ];
  for (const command of commands) {
    const result = practice.act(session, command);
    expect(result.error).toBeUndefined();
    session = result.session;
  }
  expect(session.state.deck).toHaveLength(6);
  expect(session.state.consumables.map((item) => item.definitionId)).toEqual([
    'destroy',
    'destroy',
  ]);
  return session;
}

test('Eraser selection respects the five-card deck floor and keeps valid play available', async ({
  page,
}) => {
  const initial = sixCardDeck();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?game=balatro');
  const normal = await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key);
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  await page.getByLabel('Import practice replay', { exact: true }).setInputFiles({
    name: 'six-card-deck.json',
    mimeType: 'application/json',
    buffer: Buffer.from(practice.encode(initial)),
  });
  const cards = page.locator('.hand-cards .playing-card');
  const erasers = page.locator('.pocket').filter({
    has: page.getByText('The Eraser', { exact: true }),
  });
  const use = erasers.first().getByRole('button', { name: 'Use', exact: true });
  await expect(cards).toHaveCount(6);
  await expect(use).toBeDisabled();
  // Remove the lowest rank so the remaining five-card hand can clear the boss.
  const nine = page.getByRole('button', { name: '9 of hearts', exact: true });
  await nine.click();
  await expect(use).toBeEnabled();
  await page.getByRole('button', { name: '10 of hearts', exact: true }).click();
  const before = await page.evaluate((key) => localStorage.getItem(key), practice.key);
  await expect(use).toBeDisabled();
  expect(await page.evaluate((key) => localStorage.getItem(key), practice.key)).toBe(before);
  await page.getByRole('button', { name: '10 of hearts', exact: true }).click();
  await use.focus();
  await page.keyboard.press('Enter');
  await expect(cards).toHaveCount(5);
  await expect(erasers).toHaveCount(1);
  await expect(page.locator('.playing-card[aria-pressed="true"]')).toHaveCount(0);
  const five = practice.decode(
    (await page.evaluate((key) => localStorage.getItem(key), practice.key))!,
  );
  expect(five.state.deck).toHaveLength(5);
  expect(five.replay.commands).toHaveLength(initial.replay.commands.length + 1);
  await cards.first().click();
  await expect(use).toBeDisabled();
  await expect(page.getByRole('alert')).toHaveCount(0);
  for (let index = 1; index < 5; index++) await cards.nth(index).click();
  await page.getByRole('button', { name: /^Play hand/ }).click();
  const played = practice.decode(
    (await page.evaluate((key) => localStorage.getItem(key), practice.key))!,
  );
  expect(played.state.phase).toBe('shop');
  expect(played.state.consumables).toEqual(five.state.consumables);
  expect(played.replay.commands).toHaveLength(five.replay.commands.length + 1);
  expect(await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key)).toBe(
    normal,
  );
});
