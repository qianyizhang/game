import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { bgSession } from '../../src/games/battlegrounds/application/session';
import type { BGCommand, BGState } from '../../src/games/battlegrounds/domain/types';
import { MINIONS } from '../../src/games/battlegrounds/content/minions';

async function saved(page: Page) {
  return bgSession.decode(
    (await page.evaluate((key) => localStorage.getItem(key), bgSession.key))!,
  );
}
async function loadUntil(page: Page, predicate: (state: BGState) => boolean) {
  const replay = JSON.parse(readFileSync('tests/fixtures/battlegrounds-win.json', 'utf8')) as {
    seed: string;
    commands: BGCommand[];
  };
  let session = bgSession.create(replay.seed);
  for (const command of replay.commands) {
    session = bgSession.act(session, command).session;
    if (predicate(session.state)) break;
  }
  expect(predicate(session.state)).toBe(true);
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'run.json',
    mimeType: 'application/json',
    buffer: Buffer.from(bgSession.encode(session)),
  });
}

test('Battlegrounds recruitment, combat playback, save/resume and navigation', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('battlegrounds');
  await expect(page.getByRole('heading', { name: 'Who will lead your warband?' })).toBeVisible();
  await page.locator('.hero-choices > button').first().click();
  await page.locator('.tavern-offers button').first().click();
  await page.locator('.recruit-hand button').first().click();
  expect((await saved(page)).state.players[0].board.length).toBeGreaterThanOrEqual(1);
  await page.getByRole('button', { name: 'Freeze', exact: true }).click();
  await page.screenshot({ path: info.outputPath('hearth-recruit.png'), fullPage: true });
  await page.getByRole('button', { name: 'Ready · fight →' }).click();
  await expect(page.locator('.combat-replay')).toBeVisible();
  const before = await saved(page);
  await page.getByRole('button', { name: 'Next combat event' }).click();
  await page.getByRole('button', { name: 'Last combat event' }).click();
  await page.getByLabel('Playback speed').selectOption('200');
  expect(await saved(page)).toEqual(before);
  await page.screenshot({ path: info.outputPath('hearth-combat.png'), fullPage: true });
  await page.reload();
  expect(await saved(page)).toEqual(before);
  await page.getByRole('button', { name: /Return to tavern/ }).click();
  await page.getByRole('button', { name: /Hero power/ }).click();
  expect((await saved(page)).state.players[0].powerUsed).toBe(true);
  await page.getByRole('button', { name: 'Collection', exact: true }).click();
  await expect(page.locator('.minion-catalogue .minion-card')).toHaveCount(MINIONS.length);
  await page.getByRole('button', { name: 'Rules & workshop' }).click();
  await expect(page.getByRole('heading', { name: 'Automatic combat' })).toBeVisible();
  const hearth = await saved(page);
  await page.getByLabel('Choose game').selectOption('spire');
  await page.getByLabel('Choose game').selectOption('battlegrounds');
  expect(await saved(page)).toEqual(hearth);
  expect(errors).toEqual([]);
});

test('Battlegrounds triples, Discover, legal victory, invalid import and phone controls', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('battlegrounds');
  await loadUntil(page, (s) => s.players[0].discover.length > 0);
  await expect(
    page.getByRole('heading', { name: 'Discover one minion. It costs nothing.' }),
  ).toBeVisible();
  const before = await saved(page);
  await page.locator('.discover-panel button').first().click();
  expect((await saved(page)).state.players[0].gold).toBe(before.state.players[0].gold);
  expect((await saved(page)).state.players[0].discover).toHaveLength(0);
  await loadUntil(page, (s) => s.phase === 'won');
  await expect(page.getByRole('heading', { name: 'First place.', exact: true })).toBeVisible();
  const victory = await saved(page);
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":999}'),
  });
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await saved(page)).toEqual(victory);
  await page.getByRole('button', { name: 'Dismiss error' }).click();
  await page.screenshot({ path: info.outputPath('hearth-victory.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await loadUntil(
    page,
    (s) => s.phase === 'recruit' && s.round >= 7 && s.players[0].board.length >= 5,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('hearth-phone.png'), fullPage: true });
  await page.getByRole('button', { name: 'Collection', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Build a warband with a plan.' })).toBeVisible();
});
