import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { recordEpisode, digest } from '../../src/games/night-passage/agent/rollout';
import {
  createChronicle,
  exportChronicle,
} from '../../src/games/night-passage/application/chronicle';
import { SAVE_KEY } from '../../src/games/night-passage/application/live-chronicle';

const options = {
  seed: 'review-knowledge',
  weapon: 'bow' as const,
  control: 'heavy' as const,
  maxTicks: 100,
  maxActions: 50,
};

test('damaged artifacts retain their audit and original knowledge, clear unrelated playback and recover valid boundaries', async ({
  page,
}) => {
  const valid = await recordEpisode(options);
  const badBoundary = structuredClone(valid);
  badBoundary.decisions[0].before = Number.MAX_SAFE_INTEGER;
  const badReplay = structuredClone(valid);
  badReplay.replay = 'invalid replay';
  await page.goto('/?game=night-passage&watch=1');
  await page.getByLabel('Open policy rollouts').setInputFiles({
    name: 'valid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(valid)),
  });
  await expect(page.getByTestId('policy-knowledge')).toBeVisible();
  for (const [name, rollout] of [
    ['boundary.json', badBoundary],
    ['replay.json', badReplay],
  ] as const) {
    const original = JSON.stringify(rollout);
    await page
      .getByLabel('Open policy rollouts')
      .setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(original) });
    await expect(page.getByTestId('rollout-audit')).toBeVisible();
    await expect(page.getByTestId('policy-knowledge')).toHaveText(
      JSON.stringify(rollout.decisions[0].input, null, 2),
    );
    await expect(page.getByRole('status')).toContainText('Playback unavailable:');
    await expect(page.getByLabel('Recorded Night Passage arena')).toHaveCount(0);
    await page.getByRole('button', { name: 'Show evaluator view', exact: true }).click();
    await expect(page.getByTestId('evaluator-knowledge')).toHaveCount(0);
    await expect(
      page.getByText('Evaluator unavailable: playback could not reconstruct this boundary.', {
        exact: true,
      }),
    ).toBeVisible();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download original rollout', exact: true }).click();
    expect(await readFile(await (await downloading).path(), 'utf8')).toBe(original);
    if (name === 'boundary.json') {
      await page.getByRole('button', { name: 'Next decision', exact: true }).click();
      await expect(page.getByLabel('Recorded Night Passage arena')).toBeVisible();
      await expect(page.getByTestId('evaluator-knowledge')).toBeVisible();
    }
  }
});

test('new selections supersede delayed URL and file imports', async ({ page }) => {
  const rollout = await recordEpisode(options);
  const other = await recordEpisode({ ...options, seed: 'later-import' });
  let releaseFetch!: () => void;
  const fetchGate = new Promise<void>((resolve) => {
    releaseFetch = resolve;
  });
  await page.route(
    (url) => url.pathname === '/delayed-replay.json',
    async (route) => {
      await fetchGate;
      await route.fulfill({ contentType: 'application/json', body: other.replay });
    },
  );
  await page.addInitScript(() => {
    const original = (file: File) => Blob.prototype.text.call(file);
    File.prototype.text = function () {
      if (!this.name.startsWith('delayed')) return original(this);
      const content = original(this);
      return new Promise<string>((resolve) => {
        (window as unknown as { releaseFile: () => void }).releaseFile = () => {
          void content.then(resolve);
        };
      });
    };
  });
  await page.goto('/?game=night-passage&watch=1&replay=/delayed-replay.json', {
    waitUntil: 'domcontentloaded',
  });
  await page.getByLabel('Open policy rollouts').setInputFiles({
    name: 'selected.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(rollout)),
  });
  await expect(page.getByTestId('policy-knowledge')).toBeVisible();
  const fetched = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/delayed-replay.json',
  );
  releaseFetch();
  await (await fetched).finished();
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
  await expect(page.getByLabel('Decision number')).toHaveValue('1');
  for (const [label, name, content] of [
    ['Open policy rollouts', 'delayed-rollout.json', JSON.stringify(other)],
    ['Open replay to watch', 'delayed-replay.json', other.replay],
  ]) {
    await page
      .getByLabel(label)
      .setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(content) });
    await expect
      .poll(() =>
        page.evaluate(() => typeof (window as unknown as { releaseFile?: unknown }).releaseFile),
      )
      .toBe('function');
    if (label === 'Open policy rollouts')
      await page.getByRole('button', { name: 'selected.json', exact: true }).click();
    else await page.getByRole('button', { name: 'Next decision', exact: true }).click();
    await page.evaluate(() => {
      const state = window as unknown as { releaseFile?: () => void };
      state.releaseFile!();
      delete state.releaseFile;
    });
    // A browser task after the released read lets its stale completion run.
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
    await expect(page.getByTestId('policy-knowledge')).toHaveText(
      JSON.stringify(rollout.decisions[label === 'Open policy rollouts' ? 0 : 1].input, null, 2),
    );
    await expect(
      page.getByRole('button', { name: 'delayed-rollout.json', exact: true }),
    ).toHaveCount(0);
    expect(new URL(page.url()).searchParams.get('run')).toBe(rollout.digest);
  }
});

test('rollout review navigates original knowledge, consequences, multiple runs and exports without touching the save', async ({
  page,
}) => {
  const first = await recordEpisode(options);
  const second = await recordEpisode({ ...options, policy: 'deliberate', difficulty: 'veteran' });
  const saved = exportChronicle(createChronicle('my-game-is-separate'));
  await page.addInitScript(({ key, saved }) => localStorage.setItem(key, saved), {
    key: SAVE_KEY,
    saved,
  });
  await page.goto('/?game=night-passage&watch=1');
  await page.getByLabel('Open policy rollouts').setInputFiles(
    [first, second].map((r, i) => ({
      name: `episode-${i}.json`,
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(r)),
    })),
  );
  await expect(page.getByTestId('rollout-audit')).toContainText('Permitted inputs: passed');
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(first.decisions[0].input, null, 2),
  );
  await expect(page.getByTestId('evaluator-knowledge')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next decision', exact: true }).click();
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(first.decisions[1].input, null, 2),
  );
  await expect(page.getByTestId('policy-observed-tick')).toHaveText(
    String(first.decisions[1].input.perception.observedTick),
  );
  expect(new URL(page.url()).searchParams.get('decision')).toBe('2');
  await page.getByRole('button', { name: 'Show evaluator view', exact: true }).click();
  await expect(page.getByTestId('evaluator-knowledge')).toContainText('"dashCooldown"');
  await expect(page.getByTestId('policy-knowledge')).not.toContainText('"dashCooldown"');
  await page.getByRole('button', { name: 'After decision', exact: true }).click();
  await expect(page.getByTestId('evaluator-knowledge')).toContainText(
    `"tick": ${first.decisions[1].timing!.nextDecisionTick},`,
  );
  await page.getByRole('button', { name: 'Last decision', exact: true }).click();
  await expect(page.getByLabel('Decision number')).toHaveValue(String(first.decisions.length));
  await page.getByRole('button', { name: 'First decision', exact: true }).click();
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(first.decisions[0].input, null, 2),
  );
  await page.getByLabel('Filter rollouts').fill('veteran');
  await expect(page.getByRole('button', { name: 'episode-0.json', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'episode-1.json', exact: true }).click();
  await expect(page.getByTestId('evaluator-knowledge')).toHaveCount(0);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original rollout', exact: true }).click();
  const downloaded = await downloading;
  expect(downloaded.suggestedFilename()).toBe('rollout.json');
  expect(await readFile(await downloaded.path(), 'utf8')).toBe(JSON.stringify(second));
  await page.getByLabel('Replay view').selectOption('canvas');
  await mkdir('test-results/night-passage-rollout-review', { recursive: true });
  await page.screenshot({
    path: 'test-results/night-passage-rollout-review/desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Next decision', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: 'test-results/night-passage-rollout-review/phone.png',
    fullPage: true,
  });
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
  await page.getByLabel('Open replay to watch').setInputFiles({
    name: 'plain-replay.json',
    mimeType: 'application/json',
    buffer: Buffer.from(first.replay),
  });
  await expect(page.getByTestId('policy-knowledge')).toHaveCount(0);
  await expect(page.getByTestId('rollout-audit')).toHaveCount(0);
});

test('a same-origin decision link reloads the selected knowledge and flags a rehashed leak at its exact decision', async ({
  page,
}) => {
  const rollout = await recordEpisode(options);
  Object.assign(rollout.decisions[1].input.player, { dashCooldown: 123 });
  rollout.decisions[1].inputDigest = await digest(rollout.decisions[1].input);
  const { digest: originalDigest, ...data } = rollout;
  expect(originalDigest).toHaveLength(64);
  rollout.digest = await digest(data);
  await page.route(
    (url) => url.pathname === '/review-fixture.json',
    (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(rollout) }),
  );
  await page.goto('/?game=night-passage&watch=1&rollout=/review-fixture.json&decision=3');
  await expect(page.getByLabel('Decision number')).toHaveValue('3');
  await expect(page.getByTestId('rollout-audit')).toContainText('Replay reconstruction: passed');
  await expect(page.getByTestId('rollout-audit')).toContainText('Permitted inputs: failed');
  await page.getByRole('button', { name: 'Go to first mismatch', exact: true }).click();
  await expect(page.getByLabel('Decision number')).toHaveValue('2');
  await expect(page.getByTestId('policy-knowledge')).toContainText('"dashCooldown": 123');
  await page.reload();
  await expect(page.getByLabel('Decision number')).toHaveValue('2');
  await page.getByLabel('Open policy rollouts').setInputFiles({
    name: 'local-copy.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(rollout)),
  });
  await expect(page.getByRole('button', { name: 'local-copy.json', exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.has('rollout')).toBe(false);
  await page.goto('/?game=night-passage&watch=1&rollout=https://example.com/secret.json');
  await expect(
    page.getByText('Rollout links must use this site. Open a local file below.', { exact: true }),
  ).toBeVisible();
});

test('a complete recorded victory stays navigable through menu boundaries and terminal replay', async ({
  page,
}) => {
  test.slow();
  const rollout = await recordEpisode({
    seed: 'a-light-in-the-dark',
    weapon: 'bow',
    control: 'light',
    policy: 'deliberate',
  });
  expect(rollout.episode.status).toBe('won');
  await page.route(
    (url) => url.pathname === '/complete-rollout.json',
    (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(rollout) }),
  );
  await page.goto('/?game=night-passage&watch=1&rollout=/complete-rollout.json');
  await expect(page.getByTestId('rollout-audit')).toContainText('Artifact integrity: passed', {
    timeout: 60_000,
  });
  await expect(page.getByTestId('rollout-audit')).toContainText('Replay reconstruction: passed');
  const menu = rollout.decisions.findIndex((r) => r.input.phase === 'reward');
  expect(menu).toBeGreaterThan(0);
  await page.getByLabel('Decision number').fill(String(menu + 1));
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(rollout.decisions[menu].input, null, 2),
  );
  await page.getByRole('button', { name: 'Last decision', exact: true }).click();
  await page.getByRole('button', { name: 'After decision', exact: true }).click();
  await expect(page.getByTestId('np-replay-score')).toHaveText(`${rollout.episode.score} points`);
  await expect(
    page.getByText(`Replay complete · Escaped · ${rollout.episode.score} points`, { exact: true }),
  ).toBeVisible();
});
