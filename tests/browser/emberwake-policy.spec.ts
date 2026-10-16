import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { recordEpisode } from '../../src/shared/policy/rollout';
import { adapter, builtins } from '../../packages/diablo2/src/agent/adapter';
import {
  ACTIVE_MODE_KEY,
  LEGACY_SAVE_KEY,
  SAVE_KEY,
  exportSession,
  newSession,
  importSession,
} from '../../packages/diablo2/src/application/session';
import { readFileSync } from 'node:fs';
const baseline = JSON.parse(
  readFileSync('tests/fixtures/emberwake-v2-continuity.json', 'utf8'),
) as { cases: { replay: unknown }[] };

// Other games cover generic damaged files/import races. These cases cover the
// continuous game's passive sensor view and actual difficulty/version lifecycle.
test('Emberwake policy review retains original decisions and seeks requested ticks without touching live saves', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const run = await recordEpisode(adapter, builtins.immediate, {
    seed: 'emberwake-policy-browser',
    setup: { hero: 'barbarian', difficulty: 'standard' },
    policySeed: 'independent-emberwake-policy',
    policyOptions: {},
    maxDecisions: 35,
  });
  const travel = run.decisions.findIndex(
    (row) => (row.output as { command?: { type?: string } }).command?.type === 'travel',
  );
  expect(travel).toBeGreaterThanOrEqual(0);
  const original = JSON.stringify(run);
  await page.addInitScript((key) => {
    localStorage.setItem(key, 'untouched-live-save');
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
    (url) => url.pathname === '/emberwake-policy.json',
    (route) => route.fulfill({ contentType: 'application/json', body: original }),
  );
  await page.goto('/?game=diablo2&review=policy&rollout=/emberwake-policy.json');
  await expect(page.getByRole('heading', { name: 'Emberwake policy review' })).toBeVisible();
  await expect(page.getByTestId('rollout-audit')).toHaveText(
    'Replay reconstruction: passed · Artifact integrity: passed · Permitted inputs: passed · Policy reproduction: passed',
  );
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(run.decisions[0].input, null, 2),
  );
  await expect(page.getByTestId('evaluator-knowledge')).toHaveCount(0);
  const board = page.getByLabel('Recorded Emberwake journey');
  await expect(board.getByRole('heading', { name: 'Lantern Refuge' })).toBeVisible();
  await page.getByLabel('Decision number').fill(String(travel + 1));
  await page.getByRole('button', { name: 'After decision', exact: true }).click();
  await expect(board.getByRole('heading', { name: 'Lantern Approach' })).toBeVisible();
  await expect(board.getByLabel('Recorded field, known terrain only')).toBeVisible();
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(run.decisions[travel].input, null, 2),
  );
  await page.getByRole('button', { name: 'Show evaluator view', exact: true }).click();
  await expect(page.getByTestId('evaluator-knowledge')).toContainText('"rng"');
  await page.getByRole('button', { name: 'Hide evaluator view', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original rollout', exact: true }).click();
  expect((await readFile(await (await downloading).path())).equals(Buffer.from(original))).toBe(
    true,
  );
  await mkdir('test-results/emberwake-policy-review', { recursive: true });
  await page.screenshot({
    path: 'test-results/emberwake-policy-review/desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await board.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/emberwake-policy-review/phone.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    await page.evaluate(() => (window as unknown as { saveAccesses: string[] }).saveAccesses),
  ).toEqual([]);
  expect(
    await page.evaluate(() => (window as unknown as { originalSave: () => string }).originalSave()),
  ).toBe('untouched-live-save');
  await page.reload();
  await expect(page.getByLabel('Decision number')).toHaveValue(String(travel + 1));
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(run.decisions[travel].input, null, 2),
  );
  expect(errors).toEqual([]);
});

test('Emberwake selects Severe, reloads it, and restores the untouched historical Standard campaign', async ({
  page,
}) => {
  const legacy = JSON.stringify(baseline.cases[0].replay);
  await page.addInitScript(({ key, text }) => localStorage.setItem(key, text), {
    key: LEGACY_SAVE_KEY,
    text: legacy,
  });
  await page.goto('/?game=diablo2');
  await page.getByLabel('Difficulty', { exact: true }).selectOption('severe');
  await page.getByRole('button', { name: 'Begin journey', exact: true }).click();
  await expect(page.locator('.ew-topline')).toContainText('Severe');
  const current = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
  expect(importSession(current).state.difficulty).toBe('severe');
  expect(await page.evaluate((key) => localStorage.getItem(key), LEGACY_SAVE_KEY)).toBe(legacy);
  await page.reload();
  await expect(page.locator('.ew-topline')).toContainText('Severe');
  await page.getByRole('button', { name: 'New journey', exact: true }).click();
  await page.getByRole('button', { name: 'Restore previous campaign', exact: true }).click();
  await expect(page.locator('.ew-topline')).toContainText('Standard · previous rules');
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(current);
  await page.reload();
  await expect(page.locator('.ew-topline')).toContainText('Standard · previous rules');
  expect(await page.evaluate((key) => localStorage.getItem(key), ACTIVE_MODE_KEY)).toBe(
    'campaign-v2',
  );
  // Imported setup metadata is effective even when the new-journey draft remains Severe.
  const input = page.locator('input[type=file]').first();
  await input.setInputFiles({
    name: 'standard.json',
    mimeType: 'application/json',
    buffer: Buffer.from(exportSession(newSession('import-standard', 'barbarian'))),
  });
  await expect(page.locator('.ew-topline')).toContainText('Standard');
  await expect(page.locator('.ew-topline')).not.toContainText('Severe');
});
