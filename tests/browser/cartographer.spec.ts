import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { browserBudget } from './budget';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  SAVE_KEY,
  type Session,
} from '../../src/games/cartographer/application/session';
import { chamber, RELICS } from '../../src/games/cartographer/domain/content';
import { expeditionCommand } from '../simulation/cartographer-policy';
import { type Command } from '../../src/games/cartographer/domain/game';

const review = 'test-results/cartographer';
test.beforeEach(() => mkdirSync(review, { recursive: true }));
async function act(page: Page, session: Session, command: Command): Promise<Session> {
  if (command.type === 'move')
    await page.getByRole('button', { name: `Move ${command.direction}`, exact: true }).click();
  else if (command.type === 'explore')
    await page
      .getByRole('button', { name: `Explore ${command.direction} · draft a room`, exact: true })
      .click();
  else if (command.type === 'draft')
    await page
      .getByRole('button', {
        name: `Place ${chamber(session.state.offers[command.offer]).name}`,
        exact: true,
      })
      .click();
  else if (command.type === 'relic')
    await page
      .getByRole('button', {
        name: `Take ${RELICS.find((r) => r.id === command.id)!.name}`,
        exact: true,
      })
      .click();
  else if (command.type === 'brace')
    await page.getByRole('button', { name: 'Brace / wait', exact: false }).click();
  else if (command.type === 'strike' || command.type === 'shove' || command.type === 'flare') {
    const enemy = session.state.enemies.find((e) => e.id === command.target)!;
    await page.getByRole('button', { name: new RegExp(`^${enemy.x},${enemy.y}:`) }).click();
    await page
      .locator('.dc-actions')
      .getByRole('button', { name: new RegExp(`^${command.type}`, 'i') })
      .click();
  } else throw new Error('Unsupported journey command');
  const result = dispatch(session, command);
  expect(result.error).toBeNull();
  return result.session;
}

test(
  'draft rotation, combat, keyboard, reload, export/import and mobile navigation',
  { tag: '@smoke' },
  async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/?game=cartographer');
    await expect(page).toHaveTitle('Dungeon Cartographer · Card Workshop');
    await page.getByRole('group', { name: 'Tactical room', exact: true }).focus();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.getByRole('button', { name: 'Explore north · draft a room' }).click();
    await expect(page.getByRole('region', { name: 'Room draft' })).toBeVisible();
    await page.screenshot({ path: `${review}/draft-desktop.png`, fullPage: true });
    const first = page.locator('.dc-offers article').first();
    const beforeRotation = await first.locator('.dc-mini').getAttribute('aria-label');
    await first.getByRole('button', { name: /Rotate/ }).click();
    await expect(first.locator('.dc-mini')).not.toHaveAttribute('aria-label', beforeRotation!);
    await first.getByRole('button', { name: /^Place / }).click();
    await expect(page.locator('.dc-enemy-card')).toHaveCount(2);
    const before = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
    await page.reload();
    await expect(page.locator('.dc-board')).toHaveAttribute(
      'data-room',
      importSession(before).state.layout.rooms.at(-1)!.id,
    );
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(before);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.dc-board').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${review}/combat-mobile.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Brace / wait', exact: false }).click();
    const text = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
    expect(importSession(text).state.turn).toBe(importSession(before).state.turn + 1);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export replay', exact: true }).click();
    const download = await pending;
    const path = await download.path();
    await page.getByRole('button', { name: 'New expedition', exact: true }).click();
    await page.getByLabel('Import Cartographer replay').setInputFiles(path);
    await expect(page.getByRole('alert')).toContainText('Replay restored');
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(text);
    await page.getByRole('combobox', { name: 'Choose game' }).selectOption('diablo2');
    await expect(page.getByRole('heading', { name: 'Choose your hero' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Choose game' }).selectOption('cartographer');
    await expect(page.locator('.dc-board')).toBeVisible();
    expect(errors).toEqual([]);
  },
);

test('wins a complete expedition using visible controls and reloads the ending', async ({
  page,
}) => {
  test.setTimeout(browserBudget(120000));
  await page.goto('/?game=cartographer');
  let session = newSession('ink-and-ember');
  for (let step = 0; step < 600 && session.state.status === 'playing'; step++)
    session = await act(page, session, expeditionCommand(session.state));
  expect(session.state.status).toBe('won');
  await expect(page.getByRole('heading', { name: 'A way home, written in light.' })).toBeVisible();
  const saved = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
  expect(importSession(saved)).toEqual(session);
  await page.screenshot({ path: `${review}/victory-desktop.png`, fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'A way home, written in light.' })).toBeVisible();
});

test('preserves an unreadable save and reports unavailable storage without preventing play', async ({
  page,
}) => {
  await page.addInitScript(
    ({ key }) => {
      localStorage.setItem(key, 'broken-replay');
    },
    { key: SAVE_KEY },
  );
  await page.goto('/?game=cartographer');
  await expect(page.getByRole('alert')).toContainText('Saved expedition could not load');
  await page.getByRole('button', { name: 'Move north', exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe('broken-replay');
  await page.getByRole('button', { name: 'New expedition', exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(
    exportSession(newSession('ink-and-ember')),
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('blocked');
    };
  });
  await page.getByRole('button', { name: 'Move north', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Storage unavailable');
  await expect(page.getByTestId('dc-turn')).toHaveText('1');
});
