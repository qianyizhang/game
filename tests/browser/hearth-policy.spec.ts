import { openReviewSection } from './policy-review';
import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { recordEpisode } from '../../src/shared/policy/rollout';
import { adapter } from '../../src/games/battlegrounds/agent/adapter';
import { builtins } from '../../src/games/battlegrounds/agent/policy';
import type { Observation } from '../../src/games/battlegrounds/agent/observation';
import { arenaSession, arenaSessionV2 } from '../../src/games/battlegrounds/application/arena';
import { bgSession } from '../../src/games/battlegrounds/application/session';
import { mixedRivalsConfig } from '../../src/games/battlegrounds/domain/arena';

// Shared damaged-artifact/import races are covered by Blindside. These journeys
// protect Hearth's all-actor spans, public native board and versioned human setup.
test('Hearth policy review navigates original all-actor spans through a passive public board without storage access', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const run = await recordEpisode(adapter, builtins.immediate, {
    seed: 'hearth-policy-browser',
    setup: { hero: 'forgekeeper', difficulty: 'standard' },
    policySeed: 'independent-hearth-policy',
    policyOptions: {},
    maxDecisions: 40,
  });
  const first = run.decisions[0];
  const firstInput = first.input as unknown as Observation;
  expect(firstInput.observation.round).toBe(1);
  expect(firstInput.observation.turn.actions).toBe(0);
  expect(first.before).toBe(1);
  const spanIndex = run.decisions.findIndex((row) => row.after - row.before > 1);
  expect(spanIndex).toBeGreaterThanOrEqual(0);
  const span = run.decisions[spanIndex];
  expect(span.output).toMatchObject({ command: { type: 'endRecruit' } });
  const original = JSON.stringify(run);
  await page.addInitScript((saveKey) => {
    localStorage.setItem(saveKey, 'original-live-save');
    localStorage.setItem('card-workshop.active-game', 'balatro');
    localStorage.setItem('card-workshop.screen', 'challenges');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const get = Storage.prototype.getItem;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const set = Storage.prototype.setItem;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const remove = Storage.prototype.removeItem;
    const accesses: string[] = [];
    Object.assign(window, {
      saveAccesses: accesses,
      originalSave: () => get.call(localStorage, saveKey),
    });
    Storage.prototype.getItem = function (key) {
      accesses.push(`get:${key}`);
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      accesses.push(`set:${key}`);
      return set.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      accesses.push(`remove:${key}`);
      return remove.call(this, key);
    };
  }, arenaSession.key);
  await page.route(
    (url) => url.pathname === '/hearth-policy.json',
    (route) => route.fulfill({ contentType: 'application/json', body: original }),
  );
  await page.goto('/?game=battlegrounds&review=policy&rollout=/hearth-policy.json');
  const board = page.getByLabel('Recorded Hearth table');
  await expect(page.getByRole('heading', { name: 'Last Hearth policy review' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to game' })).toHaveAttribute(
    'href',
    '/?game=battlegrounds',
  );
  await expect(page.getByTestId('rollout-audit')).toHaveText(
    'Replay reconstruction: passed · Artifact integrity: passed · Permitted inputs: passed · Policy reproduction: passed',
  );
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(first.input, null, 2),
  );
  await expect(page.getByTestId('policy-knowledge')).not.toBeVisible();
  await expect(page.getByTestId('rollout-audit')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Before decision', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByTestId('evaluator-knowledge')).toHaveCount(0);
  await expect(board).toContainText('Round 1');
  await expect(board.getByLabel('Your tavern offers', { exact: true })).toBeVisible();
  await expect(board.getByLabel('Public lobby')).toContainText('round-opening snapshot');
  await expect(board.locator('.minion-card:enabled')).toHaveCount(0);
  expect(
    await board
      .locator('.minion-card')
      .first()
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe('1');
  await page.getByLabel('Decision number').fill(String(spanIndex + 1));
  await expect(page.getByTestId('rollout-decision')).toContainText(
    `Replay units ${span.before} → ${span.after}`,
  );
  const beforeRound = (span.input as unknown as Observation).observation.round;
  await expect(board).toContainText(`Round ${beforeRound}`);
  await page.getByRole('button', { name: 'After decision', exact: true }).click();
  await expect(board).toContainText(`Round ${beforeRound + 1}`);
  await expect(board.getByLabel('Last combat result')).toBeVisible();
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(span.input, null, 2),
  );
  await page.getByRole('button', { name: 'Before decision', exact: true }).click();
  await expect(board).toContainText(`Round ${beforeRound}`);
  await openReviewSection(page, 'Decision details');
  await page.getByRole('button', { name: 'Show evaluator view', exact: true }).click();
  await expect(page.getByTestId('evaluator-knowledge')).toContainText('"rng"');
  await page.getByRole('button', { name: 'Hide evaluator view', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await openReviewSection(page, 'Downloads');
  await page.getByRole('button', { name: 'Download original rollout', exact: true }).click();
  expect((await readFile(await (await downloading).path())).equals(Buffer.from(original))).toBe(
    true,
  );
  await mkdir('test-results/hearth-policy-review', { recursive: true });
  await page.screenshot({ path: 'test-results/hearth-policy-review/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/hearth-policy-review/phone.png' });
  await board
    .getByRole('heading', { name: 'The Forgekeeper', exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/hearth-policy-review/phone-board.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    await page.evaluate(() => (window as unknown as { saveAccesses: string[] }).saveAccesses),
  ).toEqual([]);
  expect(
    await page.evaluate(() => (window as unknown as { originalSave: () => string }).originalSave()),
  ).toBe('original-live-save');
  await page.reload();
  await expect(page.getByLabel('Decision number')).toHaveValue(String(spanIndex + 1));
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(span.input, null, 2),
  );
  expect(
    await page.evaluate(() => (window as unknown as { saveAccesses: string[] }).saveAccesses),
  ).toEqual([]);
  expect(errors).toEqual([]);
});

test('Mixed Rivals applies selectable Severe health before hero choice and retains Classic', async ({
  page,
}) => {
  await page.addInitScript(
    ({ classicKey }) => {
      localStorage.setItem('card-workshop.hearth-mode', 'mixed');
      localStorage.setItem(classicKey, 'classic-save-untouched');
    },
    { classicKey: bgSession.key },
  );
  await page.goto('/?game=battlegrounds');
  await page.getByLabel('Mixed Rivals difficulty').selectOption('severe');
  await page.locator('.hero-choices > button').first().click();
  await expect(page.locator('.round-strip')).toContainText('Severe');
  await expect(page.locator('.round-strip .health')).toHaveText('♥ 28');
  await expect(page.getByLabel('Mixed Rivals difficulty')).toHaveCount(0);
  const raw = await page.evaluate((key) => localStorage.getItem(key), arenaSession.key);
  const session = arenaSession.decode(raw!);
  expect(session.replay.version).toBe(3);
  expect(session.state.players.map((p) => p.hp)).toEqual([28, 40, 40, 40, 40, 40, 40, 40]);
  expect(await page.evaluate((key) => localStorage.getItem(key), bgSession.key)).toBe(
    'classic-save-untouched',
  );
  // A configured v3 journal may omit difficulty: its rules mean Standard even
  // while this mounted view still retains the earlier Severe setup draft.
  const standard = arenaSession.act(arenaSession.create('STANDARD-OMITTED-TIER'), {
    type: 'configure',
    config: mixedRivalsConfig('STANDARD-OMITTED-TIER', 'forgekeeper'),
  }).session;
  expect(standard.state.arena.config).not.toHaveProperty('difficulty');
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'standard-implicit.json',
    mimeType: 'application/json',
    buffer: Buffer.from(arenaSession.encode(standard)),
  });
  await expect(page.locator('.round-strip')).toContainText('Standard');
  await expect(page.locator('.round-strip')).not.toContainText('Severe');
  await expect(page.locator('.round-strip .health')).toHaveText('♥ 40');
  await expect(page.locator('.round-strip')).toContainText('Starting health 40');
  // Resume the earlier Severe run to keep its combat/reload coverage.
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'severe.json',
    mimeType: 'application/json',
    buffer: Buffer.from(raw!),
  });
  await expect(page.locator('.round-strip')).toContainText('Severe');
  await page.getByRole('button', { name: 'Ready · fight →' }).click();
  await expect(page.locator('.combat-replay')).toBeVisible();
  await page.reload();
  await expect(page.locator('.round-strip')).toContainText('Severe');
});

test('explicit previous-save restore continues a v2 rival prefix and preserves its original slot', async ({
  page,
}) => {
  let session = arenaSessionV2.act(arenaSessionV2.create('HEARTH-V2-RESTORE'), {
    type: 'configure',
    config: mixedRivalsConfig('HEARTH-V2-RESTORE', 'oathkeeper'),
  }).session;
  session = arenaSessionV2.act(session, {
    type: 'seat',
    seat: 0,
    action: { type: 'endRecruit' },
  }).session;
  const original = arenaSessionV2.encode(session);
  await page.addInitScript(
    ({ key, raw }) => {
      localStorage.setItem('card-workshop.hearth-mode', 'mixed');
      localStorage.setItem(key, raw);
    },
    { key: arenaSessionV2.key, raw: original },
  );
  await page.goto('/?game=battlegrounds');
  await page
    .getByRole('button', { name: 'Restore previous Mixed Rivals v2 save', exact: true })
    .click();
  await expect(page.locator('.combat-replay')).toBeVisible();
  const raw = await page.evaluate((key) => localStorage.getItem(key), arenaSession.key);
  const resumed = arenaSession.decode(raw!);
  expect(resumed.replay.version).toBe(2);
  expect(resumed.replay.commands.length).toBeGreaterThan(session.replay.commands.length);
  expect(resumed.replay.commands.slice(0, 2)).toEqual(session.replay.commands);
  expect(await page.evaluate((key) => localStorage.getItem(key), arenaSessionV2.key)).toBe(
    original,
  );
  await page.getByRole('button', { name: /Return to tavern/ }).click();
  await expect(page.locator('.tavern')).toBeVisible();
  const continued = arenaSession.decode(
    (await page.evaluate((key) => localStorage.getItem(key), arenaSession.key))!,
  );
  expect(continued.replay.version).toBe(2);
  expect(continued.state.round).toBe(2);
  expect(await page.evaluate((key) => localStorage.getItem(key), arenaSessionV2.key)).toBe(
    original,
  );
});
