import { openReviewSection } from './policy-review';
import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { recordEpisode } from '../../src/shared/policy/rollout';
import { adapter } from '../../src/games/cartographer/agent/adapter';
import { builtins } from '../../src/games/cartographer/agent/policy';
import {
  ACTIVE_SAVE_KEY,
  LEGACY_SAVE_KEY,
  PREVIOUS_SAVE_KEY,
  SAVE_KEY,
  exportSession,
  importSession,
  newSession,
} from '../../src/games/cartographer/application/session';
const baseline = JSON.parse(
  readFileSync('tests/fixtures/cartographer-v1-continuity.json', 'utf8'),
) as { cases: { replay: unknown }[] };

// Shared import/race behavior has broader coverage in Blindside. These journeys
// protect Cartographer's seeded draft boundary and independent native save versions.
test('Cartographer policy review navigates original knowledge across a seeded draft without touching live storage', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const run = await recordEpisode(adapter, builtins.immediate, {
    seed: 'cartographer-policy-browser',
    setup: { difficulty: 'standard' },
    policySeed: 'independent-cartographer-policy',
    policyOptions: {},
    maxDecisions: 60,
  });
  const explore = run.decisions.findIndex(
    (row) => (row.output as { command?: { type?: string } }).command?.type === 'explore',
  );
  expect(explore).toBeGreaterThanOrEqual(0);
  const original = JSON.stringify(run);
  await page.addInitScript((key) => {
    localStorage.setItem(key, 'untouched-live-expedition');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const get = Storage.prototype.getItem;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const set = Storage.prototype.setItem;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const remove = Storage.prototype.removeItem;
    const accesses: string[] = [];
    Object.assign(window, {
      saveAccesses: accesses,
      originalSave: () => get.call(localStorage, key),
    });
    Storage.prototype.getItem = function (name) {
      accesses.push(`get:${name}`);
      return get.call(this, name);
    };
    Storage.prototype.setItem = function (name, value) {
      accesses.push(`set:${name}`);
      return set.call(this, name, value);
    };
    Storage.prototype.removeItem = function (name) {
      accesses.push(`remove:${name}`);
      return remove.call(this, name);
    };
  }, SAVE_KEY);
  await page.route(
    (url) => url.pathname === '/cartographer-policy.json',
    (route) => route.fulfill({ contentType: 'application/json', body: original }),
  );
  await page.goto('/?game=cartographer&review=policy&rollout=/cartographer-policy.json');
  await expect(
    page.getByRole('heading', { name: 'Dungeon Cartographer policy review' }),
  ).toBeVisible();
  await expect(page.getByTestId('rollout-audit')).toHaveText(
    'Replay reconstruction: passed · Artifact integrity: passed · Permitted inputs: passed · Policy reproduction: passed',
  );
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(run.decisions[0].input, null, 2),
  );
  await expect(page.getByTestId('evaluator-knowledge')).toHaveCount(0);
  const board = page.getByLabel('Recorded Cartographer expedition');
  await expect(board.getByLabel('Recorded tactical room')).toBeVisible();
  await expect(board.getByRole('button')).toHaveCount(0);
  await page.getByLabel('Decision number').fill(String(explore + 1));
  await expect(board.getByLabel('Recorded room draft')).toHaveCount(0);
  await page.getByRole('button', { name: 'After decision', exact: true }).click();
  await expect(board.getByLabel('Recorded room draft')).toBeVisible();
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(run.decisions[explore].input, null, 2),
  );
  await openReviewSection(page, 'Decision details');
  await page.getByRole('button', { name: 'Show evaluator view', exact: true }).click();
  await expect(page.getByTestId('evaluator-knowledge')).toContainText('"seed"');
  await page.getByRole('button', { name: 'Hide evaluator view', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await openReviewSection(page, 'Downloads');
  await page.getByRole('button', { name: 'Download original rollout', exact: true }).click();
  expect((await readFile(await (await downloading).path())).equals(Buffer.from(original))).toBe(
    true,
  );
  await mkdir('test-results/cartographer-policy-review', { recursive: true });
  await page.screenshot({
    path: 'test-results/cartographer-policy-review/desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await board.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/cartographer-policy-review/phone.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('ArrowUp');
  expect(
    await page.evaluate(() => (window as unknown as { saveAccesses: string[] }).saveAccesses),
  ).toEqual([]);
  expect(
    await page.evaluate(() => (window as unknown as { originalSave: () => string }).originalSave()),
  ).toBe('untouched-live-expedition');
  await page.reload();
  await expect(page.getByLabel('Decision number')).toHaveValue(String(explore + 1));
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(run.decisions[explore].input, null, 2),
  );
  expect(errors).toEqual([]);
});

test('Cartographer difficulty applies only on a new expedition and historical restoration preserves its own slot', async ({
  page,
}) => {
  const legacy = JSON.stringify(baseline.cases[0].replay);
  await page.addInitScript(({ key, text }) => localStorage.setItem(key, text), {
    key: LEGACY_SAVE_KEY,
    text: legacy,
  });
  await page.goto('/?game=cartographer');
  const status = page.getByLabel('Expedition status');
  await page.getByLabel('Difficulty', { exact: true }).selectOption('severe');
  await expect(status).toContainText('Standard');
  await expect(status).toContainText('36 / 36');
  await page.getByRole('button', { name: 'New expedition', exact: true }).click();
  await expect(status).toContainText('Severe');
  await expect(status).toContainText('28 / 28');
  const current = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
  expect(importSession(current).state.difficulty).toBe('severe');
  expect(await page.evaluate((key) => localStorage.getItem(key), LEGACY_SAVE_KEY)).toBe(legacy);
  await page.reload();
  await expect(status).toContainText('Severe');
  await page.getByRole('button', { name: 'Restore previous expedition', exact: true }).click();
  await expect(status).toContainText('Standard · previous rules');
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(current);
  await page.reload();
  await expect(status).toContainText('Standard · previous rules');
  expect(await page.evaluate((key) => localStorage.getItem(key), ACTIVE_SAVE_KEY)).toBe(
    LEGACY_SAVE_KEY,
  );
  await page.getByLabel('Import Cartographer replay').setInputFiles({
    name: 'relaxed.json',
    mimeType: 'application/json',
    buffer: Buffer.from(exportSession(newSession('relaxed-import', 'relaxed'))),
  });
  await expect(status).toContainText('Relaxed');
  await expect(status).toContainText('48 / 48');
  await expect(status).not.toContainText('Severe');
});

test('Cartographer v2 restore, continuation and export preserve its slot beside a new v3 expedition', async ({
  page,
}) => {
  const historical = JSON.parse(
    readFileSync('tests/fixtures/cartographer-v2-continuity.json', 'utf8'),
  ) as {
    cases: { prefixReplay: unknown }[];
  };
  const previous = JSON.stringify(historical.cases[2].prefixReplay);
  await page.addInitScript(
    ({ key, text }) => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, text);
    },
    {
      key: PREVIOUS_SAVE_KEY,
      text: previous,
    },
  );
  await page.goto('/?game=cartographer');
  await page.getByLabel('Difficulty', { exact: true }).selectOption('severe');
  await page.getByRole('button', { name: 'New expedition', exact: true }).click();
  const current = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
  expect(importSession(current).replay.rules).toBe('cartographer-3');
  await page.getByRole('button', { name: 'Restore v2 expedition', exact: true }).click();
  await expect(page.getByLabel('Expedition status')).toContainText(
    'Standard · previous rules · cartographer-2',
  );
  await expect(page.getByRole('button', { name: /Brace \/ wait/ })).toContainText(
    'block 3 per hit',
  );
  await page.getByRole('button', { name: /Brace \/ wait/ }).click();
  const continued = await page.evaluate((key) => localStorage.getItem(key)!, PREVIOUS_SAVE_KEY);
  expect(importSession(continued).replay.commands.length).toBe(
    importSession(previous).replay.commands.length + 1,
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(current);
  await page.reload();
  await expect(page.getByLabel('Expedition status')).toContainText('cartographer-2');
  expect(await page.evaluate((key) => localStorage.getItem(key), ACTIVE_SAVE_KEY)).toBe(
    PREVIOUS_SAVE_KEY,
  );
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export v2 expedition', exact: true }).click();
  const download = await downloaded;
  expect((await readFile(await download.path())).equals(Buffer.from(continued))).toBe(true);
  await page.getByRole('button', { name: 'New expedition', exact: true }).click();
  await expect(page.getByLabel('Expedition status')).not.toContainText('previous rules');
  expect(await page.evaluate((key) => localStorage.getItem(key), PREVIOUS_SAVE_KEY)).toBe(
    continued,
  );
});
