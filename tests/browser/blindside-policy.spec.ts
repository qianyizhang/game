import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { recordEpisode } from '../../src/shared/policy/rollout';
import { adapter } from '../../src/games/balatro/agent/adapter';
import { builtins } from '../../src/games/balatro/agent/policy';
import { blindsideSession } from '../../src/games/balatro/application/session';

const options = {
  seed: 'policy-browser',
  setup: { difficulty: 'standard' },
  policySeed: 'independent-policy',
  policyOptions: {},
  maxDecisions: 8,
};

test('Blindside review navigates original knowledge and consequences without reading or writing live saves', async ({
  page,
}) => {
  const rollout = await recordEpisode(adapter, builtins.immediate, options);
  const other = await recordEpisode(adapter, builtins.survival, {
    ...options,
    seed: 'policy-other',
    setup: { difficulty: 'relaxed' },
  });
  const original = JSON.stringify(rollout);
  await page.addInitScript(() => {
    localStorage.setItem('card-workshop.active-game', 'spire');
    localStorage.setItem('card-workshop.blindside.v4', 'historical-save');
    localStorage.setItem('card-workshop.blindside.v5', 'current-save');
    // Capture the native method; each wrapper below forwards its original Storage receiver.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalGet = Storage.prototype.getItem;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalSet = Storage.prototype.setItem;
    const accesses: string[] = [];
    (window as unknown as { saveAccesses: string[] }).saveAccesses = accesses;
    Storage.prototype.getItem = function (key) {
      if (key.startsWith('card-workshop.blindside')) accesses.push(`get:${key}`);
      return originalGet.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('card-workshop.blindside')) accesses.push(`set:${key}`);
      return originalSet.call(this, key, value);
    };
  });
  await page.route(
    (url) => url.pathname === '/policy-fixture.json',
    (route) => route.fulfill({ contentType: 'application/json', body: original }),
  );
  await page.goto('/?game=balatro&review=policy&rollout=/policy-fixture.json&decision=2');
  await expect(page.getByRole('link', { name: 'Return to game' })).toHaveAttribute(
    'href',
    '/?game=balatro',
  );
  await expect(page.getByLabel('Decision number')).toHaveValue('2');
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(rollout.decisions[1].input, null, 2),
  );
  await expect(page.getByTestId('rollout-audit')).toHaveText(
    'Replay reconstruction: passed · Artifact integrity: passed · Permitted inputs: passed · Policy reproduction: passed',
  );
  await expect(page.getByTestId('evaluator-knowledge')).toHaveCount(0);
  const input = JSON.parse(await page.getByTestId('policy-knowledge').innerText()) as Record<
    string,
    unknown
  >;
  for (const hidden of ['seed', 'rng', 'draw', 'bossIds']) expect(input).not.toHaveProperty(hidden);
  await page.getByRole('button', { name: 'First decision', exact: true }).click();
  await expect(page.getByLabel('Recorded Blindside table')).toContainText('ready');
  await page.getByRole('button', { name: 'After decision', exact: true }).click();
  await expect(page.getByLabel('Recorded Blindside table')).toContainText('playing');
  await page.getByRole('button', { name: 'Before decision', exact: true }).click();
  await expect(page.getByLabel('Recorded Blindside table')).toContainText('ready');
  await page.getByRole('button', { name: 'Next decision', exact: true }).click();
  await expect(page.getByLabel('Recorded Blindside table')).toContainText('playing');
  await page.getByRole('button', { name: 'Show evaluator view', exact: true }).click();
  await expect(page.getByTestId('evaluator-knowledge')).toContainText('"rng"');
  await page.getByLabel('Decision number').fill('4');
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(rollout.decisions[3].input, null, 2),
  );
  expect(new URL(page.url()).searchParams.get('decision')).toBe('4');
  await page.getByRole('button', { name: 'Play decisions', exact: true }).click();
  await expect(page.getByLabel('Decision number')).not.toHaveValue('4');
  await page.getByRole('button', { name: 'Last decision', exact: true }).click();
  await expect(page.getByLabel('Decision number')).toHaveValue(String(rollout.decisions.length));
  await page.getByRole('button', { name: 'Previous decision', exact: true }).click();
  await expect(page.getByLabel('Decision number')).toHaveValue(
    String(rollout.decisions.length - 1),
  );
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original rollout', exact: true }).click();
  expect((await readFile(await (await downloading).path())).equals(Buffer.from(original))).toBe(
    true,
  );
  await page.getByLabel('Open policy rollouts').setInputFiles({
    name: 'survival.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(other)),
  });
  await expect(page.getByRole('button', { name: 'survival.json', exact: true })).toBeVisible();
  await expect(page.getByLabel('Decision number')).toHaveValue('1');
  expect(new URL(page.url()).searchParams.has('rollout')).toBe(false);
  await page.getByLabel('Filter rollouts').fill('relaxed');
  await expect(page.getByRole('button', { name: '/policy-fixture.json', exact: true })).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(() => (window as unknown as { saveAccesses: string[] }).saveAccesses),
  ).toEqual([]);
  await page.getByRole('button', { name: 'Next decision', exact: true }).click();
  await mkdir('test-results/blindside-policy-review', { recursive: true });
  await page.screenshot({
    path: 'test-results/blindside-policy-review/desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/blindside-policy-review/phone.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Return to game' }).click();
  await expect(page.getByLabel('Choose game')).toHaveValue('balatro');
});

test('damaged Blindside evidence stays inspectable and newer selection supersedes delayed import', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const valid = await recordEpisode(adapter, builtins.immediate, options);
  const other = await recordEpisode(adapter, builtins.survival, { ...options, seed: 'delayed' });
  const bad = structuredClone(valid);
  bad.replay = 'invalid replay';
  const original = JSON.stringify(bad);
  await page.addInitScript(() => {
    const originalBytes = (file: File) => Blob.prototype.arrayBuffer.call(file);
    File.prototype.arrayBuffer = function () {
      if (this.name !== 'delayed.json') return originalBytes(this);
      const contents = originalBytes(this);
      return new Promise<ArrayBuffer>((resolve) => {
        (window as unknown as { releaseFile: () => void }).releaseFile = () => {
          void contents.then(resolve);
        };
      });
    };
  });
  await page.goto('/?game=balatro&review=policy');
  const open = page.getByLabel('Open policy rollouts');
  await open.setInputFiles({
    name: 'valid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(valid)),
  });
  await expect(page.getByLabel('Recorded Blindside table')).toBeVisible();
  await open.setInputFiles({
    name: 'null-row.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...valid, decisions: [null] })),
  });
  await expect(page.getByRole('status')).toContainText('Invalid decision row.');
  await expect(page.getByLabel('Recorded Blindside table')).toBeVisible();
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(valid.decisions[0].input, null, 2),
  );
  await expect(page.getByRole('button', { name: 'null-row.json', exact: true })).toHaveCount(0);
  await open.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from(original),
  });
  await expect(page.getByRole('alert').filter({ hasText: 'Playback unavailable:' })).toBeVisible();
  await expect(page.getByLabel('Recorded Blindside table')).toHaveCount(0);
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(bad.decisions[0].input, null, 2),
  );
  await page.getByRole('button', { name: 'Show evaluator view', exact: true }).click();
  await expect(page.getByTestId('evaluator-knowledge')).toHaveCount(0);
  await expect(
    page.getByText('Evaluator unavailable: playback could not reconstruct this boundary.'),
  ).toBeVisible();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original rollout', exact: true }).click();
  expect((await readFile(await (await downloading).path())).equals(Buffer.from(original))).toBe(
    true,
  );
  await page.getByRole('button', { name: 'valid.json', exact: true }).click();
  await open.setInputFiles({
    name: 'delayed.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(other)),
  });
  await expect
    .poll(() =>
      page.evaluate(() => typeof (window as unknown as { releaseFile?: unknown }).releaseFile),
    )
    .toBe('function');
  await page.getByRole('button', { name: 'Next decision', exact: true }).click();
  await page.evaluate(() => (window as unknown as { releaseFile: () => void }).releaseFile());
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
  await expect(page.getByLabel('Decision number')).toHaveValue('2');
  await expect(page.getByRole('button', { name: 'delayed.json', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(valid.decisions[1].input, null, 2),
  );
  expect(errors).toEqual([]);
});

test('Blindside difficulty selection persists and restores a historical Standard run without changing its v4 slot', async ({
  page,
}) => {
  const legacy = blindsideSession.encode(blindsideSession.create('LEGACY-RESTORE', undefined, 4));
  await page.addInitScript(
    ({ legacy }) => {
      localStorage.setItem('card-workshop.blindside.v4', legacy);
    },
    { legacy },
  );
  await page.goto('/?game=balatro');
  await page.getByLabel('Blindside difficulty').selectOption('relaxed');
  await expect(page.locator('.blind-intro')).toContainText('Score 150 points to clear this blind.');
  await page.reload();
  await expect(page.getByLabel('Blindside difficulty')).toHaveValue('relaxed');
  await expect(page.locator('.blind-intro')).toContainText('Score 150 points to clear this blind.');
  expect(await page.evaluate(() => localStorage.getItem('card-workshop.blindside.v4'))).toBe(
    legacy,
  );
  await page.getByRole('button', { name: 'Restore v4 save', exact: true }).click();
  await expect(page.getByLabel('Blindside difficulty')).toHaveCount(0);
  await expect(page.locator('.blind-intro')).toContainText('Score 200 points to clear this blind.');
  await page.getByRole('button', { name: /^Play Small Blind/ }).click();
  await expect(page.locator('.hand-cards .playing-card')).toHaveCount(8);
  const current = await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key);
  const restored = blindsideSession.decode(current!);
  expect(restored.replay.version).toBe(4);
  expect(restored.replay.seed).toBe('LEGACY-RESTORE');
  expect(restored.replay.commands).toEqual([{ type: 'startBlind' }]);
  expect(restored.state.target).toBe(200);
  expect(await page.evaluate(() => localStorage.getItem('card-workshop.blindside.v4'))).toBe(
    legacy,
  );
});
