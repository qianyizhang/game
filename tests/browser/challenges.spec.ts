import { objectValue } from '../../src/shared/json';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { blindsideSession } from '../../src/games/balatro/application/session';
import { spireSession } from '../../src/games/spire/application/session';
import { bgSession } from '../../src/games/battlegrounds/application/session';
import { jokerOrderChallenge } from '../../src/games/balatro/application/challenges';
import { challengeKey, decodeChallenge } from '../../src/shared/challenges';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('card-workshop.playback-speed', '100'));
});
async function openLibrary(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '◇ Challenges', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Find the better move.' })).toBeVisible();
}
async function finishPlayback(page: Page) {
  const skip = page.getByRole('button', { name: 'Skip to result' });
  if (await skip.isVisible()) await skip.click();
}
test('blocked storage reads show attention instead of treating saves as new puzzles', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException('Denied', 'SecurityError');
    };
  });
  await openLibrary(page);
  await expect(page.getByText('Saved progress needs attention', { exact: true })).toHaveCount(3);
  await expect(page.getByText('New puzzle', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open The last multiplier' }).click();
  await expect(page.getByRole('alert')).toContainText('Saved progress could not be loaded');
  await page.getByRole('button', { name: 'Move Spark left' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export attempts' }).click();
  expect(
    decodeChallenge(jokerOrderChallenge, readFileSync(await (await download).path(), 'utf8'))
      .current.session.replay.commands,
  ).toHaveLength(1);
  expect(errors).toEqual([]);
});
test('Joker puzzle preserves every normal/practice save, compares attempts and resumes its review', async ({
  page,
}, info) => {
  const saves = [blindsideSession, spireSession, bgSession].flatMap((codec) => [
    [codec.key, JSON.stringify(codec.create('KEEP-NORMAL').replay)],
    [
      `${codec.key}.practice`,
      JSON.stringify({ ...codec.create('KEEP-PRACTICE').replay, mode: 'practice' }),
    ],
  ]);
  await page.addInitScript((values) => {
    if (localStorage.getItem('challenge-test-initialized')) return;
    for (const [key, value] of values) localStorage.setItem(key, value);
    localStorage.setItem('challenge-test-initialized', 'yes');
  }, saves);
  await openLibrary(page);
  await page.screenshot({ path: info.outputPath('challenge-library-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Open The last multiplier' }).click();
  await expect(page.getByText('YOUR GOAL', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'A of spades', exact: true }).click();
  await page.getByRole('button', { name: 'Play selected card' }).click();
  await expect(page.getByRole('heading', { name: 'Not yet', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '104', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try another choice' }).click();
  await page.getByRole('button', { name: /Show a hint/ }).click();
  await page.getByRole('button', { name: 'Move Spark left', exact: true }).click();
  await page.getByRole('button', { name: 'A of spades', exact: true }).click();
  await page.getByRole('button', { name: 'Play selected card' }).click();
  await expect(page.getByRole('heading', { name: 'Challenge cleared' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Previous attempt' })).toBeVisible();
  const score = page
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name: 'Score (points)' }) });
  await expect(score.getByRole('cell')).toHaveText(['200', '104']);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Challenge cleared' })).toBeVisible();
  await expect(page.getByText('1 / 2 hints used', { exact: true })).toBeVisible();
  await finishPlayback(page);
  await page.screenshot({ path: info.outputPath('challenge-review-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Try again before decision 2' }).click();
  await expect(page.locator('.challenge-table .owned-joker').first()).toContainText('Spark');
  const raw = await page.evaluate(
    (key) => localStorage.getItem(key)!,
    challengeKey(jokerOrderChallenge),
  );
  const restored = decodeChallenge(jokerOrderChallenge, raw);
  expect(restored.current.session.replay.commands).toHaveLength(1);
  expect(restored.previous?.session.state.lastScore?.total).toBe(200);
  await page.getByRole('button', { name: '← Return to my run' }).click();
  await expect(page.getByRole('button', { name: '◇ Challenges', exact: true })).toBeFocused();
  for (const [key, value] of saves)
    expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(value);
  await expect(page.getByRole('heading', { name: /Every hand/ })).toBeVisible();
});

test('Silent puzzle resolves actual card controls, optional hints, and the Sentry response', async ({
  page,
}, info) => {
  await openLibrary(page);
  await page.getByRole('button', { name: 'Open One layer of protection' }).click();
  await finishPlayback(page);
  await expect(page.getByRole('button', { name: 'Target Sentry' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Target Sentry' })).toContainText('Beam: 9 damage');
  await page.screenshot({ path: info.outputPath('challenge-spire-position.png'), fullPage: true });
  for (const name of ['Neutralize', 'Deadly Poison', 'Catalyst', 'Defend']) {
    await page
      .locator('.challenge-board .battle-hand .ability-card')
      .filter({ has: page.locator('strong', { hasText: new RegExp(`^${name}\\+?$`) }) })
      .click();
    await finishPlayback(page);
  }
  await page.getByRole('button', { name: 'End turn →', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Challenge cleared' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '14', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '70', exact: true })).toBeVisible();
  await expect(page.getByLabel('Your decisions').locator('summary')).toHaveCount(5);
  await page.getByRole('button', { name: 'Try again before decision 2' }).click();
  await finishPlayback(page);
  await expect(page.locator('.challenge-board .battle-hand .ability-card')).toHaveCount(4);
});

test('warband challenge goes from tie to win with movable real minions and combat replay', async ({
  page,
}, info) => {
  await openLibrary(page);
  await page.getByRole('button', { name: 'Open Make room for the Cub' }).click();
  await page.getByRole('button', { name: 'Fight this warband' }).click();
  await expect(page.getByRole('heading', { name: 'Not yet', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try another choice' }).click();
  await page.getByRole('button', { name: 'Move Pack Caller right' }).click();
  await page.getByRole('button', { name: 'Move Pack Caller right' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('challenge-hearth-phone.png'), fullPage: true });
  await page.getByRole('button', { name: 'Fight this warband' }).click();
  await expect(page.getByRole('heading', { name: 'Challenge cleared' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Win', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Tie', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Last combat event', exact: true }).click();
  await page.getByRole('button', { name: 'First combat event', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: info.outputPath('challenge-hearth-review-phone.png'),
    fullPage: true,
  });
});

test('attempt export/import validates the puzzle and preserves progress on invalid input', async ({
  page,
}) => {
  await openLibrary(page);
  await page.getByRole('button', { name: 'Open The last multiplier' }).click();
  await page.getByRole('button', { name: 'Move Spark left' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export attempts' }).click();
  const exported = readFileSync(await (await download).path(), 'utf8');
  expect(
    decodeChallenge(jokerOrderChallenge, exported).current.session.replay.commands,
  ).toHaveLength(1);
  await page.getByRole('button', { name: 'End attempt & review' }).click();
  await page.getByRole('button', { name: 'Try another choice' }).click();
  await page.getByLabel('Import challenge attempts').setInputFiles({
    name: 'attempts.json',
    mimeType: 'application/json',
    buffer: Buffer.from(exported),
  });
  await expect(page.locator('.challenge-table .owned-joker').first()).toContainText('Spark');
  const wrongRevision = objectValue(JSON.parse(exported));
  const pin = objectValue(objectValue(wrongRevision.current).challenge);
  if (typeof pin.revision !== 'number') throw new Error('Expected puzzle revision');
  pin.revision++;
  await page.getByLabel('Import challenge attempts').setInputFiles({
    name: 'old-puzzle.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(wrongRevision)),
  });
  await expect(page.getByRole('alert')).toContainText('different challenge or puzzle revision');
  expect(
    await page.evaluate((key) => localStorage.getItem(key), challengeKey(jokerOrderChallenge)),
  ).toBe(exported);
  const bad = objectValue(JSON.parse(exported));
  objectValue(objectValue(bad.current).replay).seed = 'WRONG';
  await page.getByLabel('Import challenge attempts').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(bad)),
  });
  await expect(page.getByRole('alert')).toContainText('different challenge position');
  await expect(page.locator('.challenge-table .owned-joker').first()).toContainText('Spark');
});

test('storage failure leaves a working, exportable attempt and phone library navigation', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Full', 'QuotaExceededError');
    };
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await openLibrary(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('challenge-library-phone.png'), fullPage: true });
  await page.getByRole('button', { name: 'Open The last multiplier' }).click();
  await page.getByRole('button', { name: 'Move Spark left' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Storage unavailable · export before closing this tab',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export attempts' }).click();
  expect(
    decodeChallenge(jokerOrderChallenge, readFileSync(await (await download).path(), 'utf8'))
      .current.session.replay.commands,
  ).toHaveLength(1);
  await page.getByRole('button', { name: '← All challenges' }).click();
  await expect(page.getByRole('heading', { name: 'Find the better move.' })).toBeFocused();
  const puzzle = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'The last multiplier' }) });
  await expect(puzzle).toContainText('In progress');
  await expect(puzzle.getByRole('button')).toHaveText('Resume attempt →');
  await puzzle.getByRole('button').click();
  await expect(page.locator('.challenge-table .owned-joker').first()).toContainText('Spark');
  await page.getByRole('button', { name: '← Return to my run' }).click();
  await page.getByRole('button', { name: '◇ Challenges', exact: true }).click();
  await page.getByRole('button', { name: 'Open The last multiplier' }).click();
  await expect(page.locator('.challenge-table .owned-joker').first()).toContainText('Spark');
  await page.getByRole('button', { name: /Show a hint/ }).click();
  await page.getByRole('button', { name: /Show next hint/ }).click();
  await expect(page.getByRole('button', { name: /All hints shown/ })).toBeDisabled();
});

test('a delayed import cannot overwrite a newer move', async ({ page }) => {
  await page.addInitScript(() => {
    const read = Reflect.get(File.prototype, 'text');
    File.prototype.text = async function () {
      if (this.name === 'delayed.json')
        await new Promise<void>((resolve) => {
          Object.assign(window, { releaseChallengeImport: resolve });
        });
      return read.call(this);
    };
  });
  await openLibrary(page);
  await page.getByRole('button', { name: 'Open The last multiplier' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export attempts' }).click();
  const original = readFileSync(await (await download).path(), 'utf8');
  await page.getByLabel('Import challenge attempts').setInputFiles({
    name: 'delayed.json',
    mimeType: 'application/json',
    buffer: Buffer.from(original),
  });
  await page.waitForFunction(() => 'releaseChallengeImport' in window);
  await page.getByRole('button', { name: 'Move Spark left' }).click();
  await page.evaluate(() =>
    (window as unknown as { releaseChallengeImport: () => void }).releaseChallengeImport(),
  );
  await expect(page.getByLabel('Import challenge attempts')).toHaveValue('');
  await expect(page.locator('.challenge-table .owned-joker').first()).toContainText('Spark');
  await page.reload();
  await expect(page.locator('.challenge-table .owned-joker').first()).toContainText('Spark');
});

test('corrupt challenge progress is preserved and archived before a new attempt is saved', async ({
  page,
}) => {
  const key = challengeKey(jokerOrderChallenge);
  await page.addInitScript((key) => localStorage.setItem(key, '{broken'), key);
  await openLibrary(page);
  await page.getByRole('button', { name: 'Open The last multiplier' }).click();
  await expect(page.getByRole('alert')).toContainText('Saved progress could not be loaded');
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe('{broken');
  await page.getByRole('button', { name: 'Move Spark left' }).click();
  const recovery = await page.evaluate(
    (key) =>
      Object.keys(localStorage)
        .filter((k) => k.startsWith(`${key}.recovery.`))
        .map((k) => localStorage.getItem(k)),
    key,
  );
  expect(recovery).toEqual(['{broken']);
  expect(
    decodeChallenge(
      jokerOrderChallenge,
      (await page.evaluate((key) => localStorage.getItem(key), key))!,
    ).current.session.replay.commands,
  ).toHaveLength(1);
});
