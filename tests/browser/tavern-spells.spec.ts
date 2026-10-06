import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { bgSession } from '../../src/games/battlegrounds/application/session';
import { TAVERN_SPELLS } from '../../src/games/battlegrounds/content/spells';
import type { BGCommand } from '../../src/games/battlegrounds/domain/types';

const fixture = JSON.parse(readFileSync('tests/fixtures/battlegrounds-v6-win.json', 'utf8')) as {
  seed: string;
  commands: BGCommand[];
};
function beforePurchase(definitionId: string) {
  let session = bgSession.create(fixture.seed);
  for (const command of fixture.commands) {
    if (
      command.type === 'buySpell' &&
      session.state.players[0].tavern!.offer!.definitionId === definitionId
    )
      return session;
    const result = bgSession.act(session, command);
    if (result.error) throw new Error(result.error);
    session = result.session;
  }
  throw new Error(`Missing ${definitionId} purchase in fixture`);
}
async function saved(page: Page) {
  return bgSession.decode(
    (await page.evaluate((key) => localStorage.getItem(key), bgSession.key))!,
  );
}
async function load(page: Page, definitionId: string) {
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('battlegrounds');
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'spells.json',
    mimeType: 'application/json',
    buffer: Buffer.from(bgSession.encode(beforePurchase(definitionId))),
  });
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('card-workshop.playback-speed', '100');
  });
});

test('buys and keyboard-casts a targeted spell, reloads exactly, and preserves legacy saves', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await load(page, 'whetstone');
  await page.evaluate(() => {
    localStorage.setItem('card-workshop.last-hearth.v5', 'preserved-v5-save');
    localStorage.setItem('card-workshop.last-hearth-arena.v1', 'preserved-v1-arena');
  });
  const before = await saved(page),
    p = before.state.players[0];
  await page.locator('.warband .minion-card').nth(1).click();
  await page.getByRole('button', { name: 'Buy Whetstone · 1 gold' }).click();
  expect((await saved(page)).state.players[0].gold).toBe(p.gold - 1);
  const cast = page.getByRole('button', { name: 'Cast Whetstone', exact: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('region', { name: 'Tavern spells' })
    .screenshot({ path: info.outputPath('spells-held-phone.png') });
  await cast.focus();
  await page.keyboard.press('Enter');
  const after = await saved(page),
    next = after.state.players[0];
  expect(next.gold).toBe(p.gold - 1);
  expect(next.board[0].attack).toBe(p.board[0].attack);
  expect(next.board[1].attack).toBe(p.board[1].attack + 3);
  expect(next.tavern!.hand).toHaveLength(0);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Tavern spells' })).toBeVisible();
  expect(await saved(page)).toEqual(after);
  expect(await page.evaluate(() => localStorage.getItem('card-workshop.last-hearth.v5'))).toBe(
    'preserved-v5-save',
  );
  expect(
    await page.evaluate(() => localStorage.getItem('card-workshop.last-hearth-arena.v1')),
  ).toBe('preserved-v1-arena');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page
    .getByRole('region', { name: 'Tavern spells' })
    .screenshot({ path: info.outputPath('spells-target-phone.png') });
  expect(errors).toEqual([]);
});

test('holds a note across rounds, then shows and receives its next-round income once', async ({
  page,
}, info) => {
  await load(page, 'promissory-note');
  await page.getByRole('button', { name: 'Buy Promissory Note · 1 gold' }).click();
  await page.getByRole('button', { name: 'Ready · fight →' }).click();
  await page.getByRole('button', { name: /Return to tavern/ }).click();
  await expect(
    page.getByRole('button', { name: 'Cast Promissory Note', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cast Promissory Note', exact: true }).click();
  await expect(page.locator('.spell-status')).toContainText('Next recruitment: +3 gold');
  await page
    .getByRole('region', { name: 'Tavern spells' })
    .screenshot({ path: info.outputPath('spells-note-desktop.png') });
  await page.getByRole('button', { name: 'Ready · fight →' }).click();
  await page.getByRole('button', { name: /Return to tavern/ }).click();
  expect((await saved(page)).state.players[0].gold).toBe(13);
  expect((await saved(page)).state.players[0].tavern!.nextGold).toBe(0);
});

test('coupon updates minion prices and is consumed by exactly one purchase', async ({
  page,
}, info) => {
  await load(page, 'recruit-coupon');
  await page.getByRole('button', { name: 'Buy Recruit Coupon · 1 gold' }).click();
  await page.getByRole('button', { name: 'Cast Recruit Coupon', exact: true }).click();
  await expect(page.locator('.spell-status')).toContainText('Next minion: 1 gold');
  await expect(page.locator('.tavern-offers button').first()).toContainText('Recruit · 1 gold');
  const before = (await saved(page)).state.players[0].gold;
  await page.locator('.tavern-offers button').first().click();
  expect((await saved(page)).state.players[0].gold).toBe(before - 1);
  expect((await saved(page)).state.players[0].tavern!.discount).toBe(0);
  await expect(page.locator('.tavern-offers button').first()).toContainText('Recruit · 3 gold');
  await page.screenshot({ path: info.outputPath('spells-coupon-desktop.png'), fullPage: true });
});

test('collection displays all eight spell effects and decorative art without phone overflow', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('battlegrounds');
  await page.getByRole('button', { name: 'Collection', exact: true }).click();
  const cards = page.locator('.spell-catalogue .spell-card');
  await expect(cards).toHaveCount(TAVERN_SPELLS.length);
  for (const spell of TAVERN_SPELLS)
    await expect(cards.filter({ hasText: spell.name })).toContainText(spell.text);
  await expect(cards.locator('svg')).toHaveCount(TAVERN_SPELLS.length);
  await expect(cards.first().locator('svg')).toHaveAttribute('aria-hidden', 'true');
  await page
    .locator('.spell-catalogue')
    .screenshot({ path: info.outputPath('spells-collection-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('spells-collection-phone.png'), fullPage: true });
  await page.getByLabel('Search collection').fill('coupon');
  await expect(cards).toHaveCount(1);
});
