import { openReviewSection } from './policy-review';
import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { recordEpisode } from '../../src/shared/policy/rollout';
import type { JsonObject } from '../../src/shared/policy/types';
import { adapter } from '../../src/games/spire/agent/adapter';
import { builtins } from '../../src/games/spire/agent/policy';
import { spireSession } from '../../src/games/spire/application/session';

// Shared multi-file, damaged-artifact and delayed-import behavior is covered by
// blindside-policy.spec.ts. This journey protects Spire's native passive board,
// map/combat boundaries, pile inspection and independent live-save namespace.
test('Spire policy review connects original knowledge to a passive map and combat without touching live saves', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const rollout = await recordEpisode(adapter, builtins.immediate, {
    seed: 'spire-policy-browser',
    setup: { character: 'silent', ascension: 2 },
    policySeed: 'independent-browser-policy',
    policyOptions: {},
    maxDecisions: 40,
  });
  const original = JSON.stringify(rollout);
  const mapIndex = rollout.decisions.findIndex((row) => (row.input as JsonObject).phase === 'map');
  const combatIndex = rollout.decisions.findIndex(
    (row) => (row.input as JsonObject).phase === 'combat',
  );
  expect(mapIndex).toBeGreaterThanOrEqual(0);
  expect(combatIndex).toBeGreaterThan(mapIndex);
  await page.addInitScript((saveKey) => {
    localStorage.setItem('card-workshop.active-game', 'balatro');
    localStorage.setItem(saveKey, 'original-live-save');
    localStorage.setItem('card-workshop.screen', 'challenges');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalGet = Storage.prototype.getItem;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalSet = Storage.prototype.setItem;
    const accesses: string[] = [];
    (window as unknown as { saveAccesses: string[] }).saveAccesses = accesses;
    Storage.prototype.getItem = function (key) {
      accesses.push(`get:${key}`);
      return originalGet.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      accesses.push(`set:${key}`);
      return originalSet.call(this, key, value);
    };
  }, spireSession.key);
  await page.route(
    (url) => url.pathname === '/spire-policy.json',
    (route) => route.fulfill({ contentType: 'application/json', body: original }),
  );
  await page.goto(`/?game=spire&review=policy&rollout=/spire-policy.json&decision=${mapIndex + 1}`);
  const board = page.getByLabel('Recorded Spire table');
  await expect(page.getByRole('link', { name: 'Return to game' })).toHaveAttribute(
    'href',
    '/?game=spire',
  );
  await expect(page.getByTestId('rollout-audit')).toHaveText(
    'Replay reconstruction: passed · Artifact integrity: passed · Permitted inputs: passed · Policy reproduction: passed',
  );
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(rollout.decisions[mapIndex].input, null, 2),
  );
  await expect(page.getByTestId('evaluator-knowledge')).toHaveCount(0);
  await expect(board).toContainText('silent · Ascension 2');
  await expect(board.locator('.sts-map-panel')).toBeVisible();
  await expect(board.locator('.sts-map-node:enabled')).toHaveCount(0);
  await page.getByRole('button', { name: 'After decision', exact: true }).click();
  await expect(board.locator('.sts-battle')).toBeVisible();
  await page.getByRole('button', { name: 'Before decision', exact: true }).click();
  await expect(board.locator('.sts-map-panel')).toBeVisible();
  await page.getByLabel('Decision number').fill(String(combatIndex + 1));
  await expect(board.locator('.sts-battle')).toBeVisible();
  const enemy = board.getByRole('button', { name: /^Target / }).first();
  await expect(enemy.getByText('Next action', { exact: true })).toBeVisible();
  await expect(enemy).toHaveAccessibleDescription(/Next action\s+\S/);
  await expect(board.locator('.battle-hand .ability-card:enabled')).toHaveCount(0);
  await expect(board.getByRole('button', { name: 'End turn' })).toBeDisabled();
  await expect(board.locator('.enemy:enabled')).toHaveCount(0);
  await openReviewSection(page, 'Decision details');
  const knowledge = JSON.parse(
    await page.getByTestId('policy-knowledge').innerText(),
  ) as JsonObject;
  for (const hidden of ['seed', 'rng', 'resolution', 'lastEncounter', 'unknownChances'])
    expect(knowledge).not.toHaveProperty(hidden);
  await board.getByRole('button', { name: /^draw ·/ }).click();
  await expect(
    board.getByRole('heading', { name: 'Draw pile · alphabetical, order hidden' }),
  ).toBeVisible();
  await board.getByRole('button', { name: /^discard ·/ }).click();
  await expect(board.locator('.sts-pile')).toContainText('This pile is empty.');
  await board.getByText(/^Permanent deck ·/).click();
  await expect(board.locator('.deck-list button')).toHaveCount(12);
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
  await mkdir('test-results/spire-policy-review', { recursive: true });
  await page.screenshot({ path: 'test-results/spire-policy-review/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const hand = board.getByRole('region', { name: 'Cards in hand', exact: true });
  const handTops = await hand
    .locator('.ability-card')
    .evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().top)));
  expect(handTops.length).toBeGreaterThan(1);
  expect(new Set(handTops).size).toBe(1);
  expect(await hand.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  // A late-run label can be wider than the phone. Exercise native select sizing
  // without recording a thousand decisions just to produce multi-digit counters.
  await page.getByLabel('Rollout location').evaluate((select: HTMLSelectElement) => {
    select.options[0].textContent = 'Decision 1010 · Act 3 · Room 16 · combat · Turn 13';
  });
  await page.screenshot({ path: 'test-results/spire-policy-review/phone.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    await page.evaluate(() => (window as unknown as { saveAccesses: string[] }).saveAccesses),
  ).toEqual([]);
  await page.reload();
  await expect(page.getByLabel('Decision number')).toHaveValue(String(combatIndex + 1));
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(rollout.decisions[combatIndex].input, null, 2),
  );
  expect(
    await page.evaluate(() => (window as unknown as { saveAccesses: string[] }).saveAccesses),
  ).toEqual([]);
  expect(errors).toEqual([]);
});
