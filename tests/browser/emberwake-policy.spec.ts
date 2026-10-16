import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { recordEpisode } from '../../src/shared/policy/rollout';
import { adapter, builtins } from '../../packages/diablo2/src/agent/adapter';
import {
  ACTIVE_MODE_KEY,
  LEGACY_SAVE_KEY,
  PREVIOUS_SAVE_KEY,
  SAVE_KEY,
  exportSession,
  newSession,
  importSession,
  dispatch,
} from '../../packages/diablo2/src/application/session';
import { readFileSync } from 'node:fs';
import { HEALTH_POTION_COOLDOWN, stats } from '../../packages/diablo2/src/domain/game';
import { currentWorld } from '../../packages/diablo2/src/domain/world';
import type { Command } from '../../packages/diablo2/src/domain/types';
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
  await page.getByRole('button', { name: 'Restore v2 campaign', exact: true }).click();
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

test('Emberwake first upgrade resumes v3 exactly and keeps v2/v3 saves when starting and restoring v4', async ({
  page,
}) => {
  const historical = JSON.parse(
    readFileSync('tests/fixtures/emberwake-v3-continuity.json', 'utf8'),
  ) as {
    content: unknown;
    cases: {
      difficulty: string;
      replayHeader: Record<string, unknown>;
      commands: unknown[];
      witnesses: { nativeCommandCount: number }[];
    }[];
  };
  const row = historical.cases.find((entry) => entry.difficulty === 'severe')!;
  const oldV3 = JSON.stringify({
    ...row.replayHeader,
    content: historical.content,
    commands: row.commands.slice(0, row.witnesses[0].nativeCommandCount),
  });
  const oldV2 = JSON.stringify(baseline.cases[0].replay);
  await page.goto('/');
  await page.evaluate(
    ({ key3, key2, mode, v3, v2 }) => {
      localStorage.setItem(key3, v3);
      localStorage.setItem(key2, v2);
      localStorage.setItem(mode, 'campaign');
    },
    { key3: PREVIOUS_SAVE_KEY, key2: LEGACY_SAVE_KEY, mode: ACTIVE_MODE_KEY, v3: oldV3, v2: oldV2 },
  );
  await page.goto('/?game=diablo2');
  await expect(page.locator('.ew-topline')).toContainText('Severe · previous rules v3');
  await expect(page.locator('.ew-topline span[title]')).toHaveAttribute(
    'title',
    /damage ×1.3; life potion recovery 0s/,
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBeNull();
  expect(await page.evaluate((key) => localStorage.getItem(key), PREVIOUS_SAVE_KEY)).toBe(oldV3);
  await page.getByRole('button', { name: 'New journey', exact: true }).click();
  await page.getByLabel('Difficulty', { exact: true }).selectOption('standard');
  await page.getByRole('button', { name: 'Begin journey', exact: true }).click();
  await expect(page.locator('.ew-topline')).toContainText('Standard');
  await expect(page.locator('.ew-topline')).not.toContainText('previous rules');
  const current = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
  expect(importSession(current).replay.rulesVersion).toBe('emberwake-4');
  expect(await page.evaluate((key) => localStorage.getItem(key), ACTIVE_MODE_KEY)).toBe(
    'campaign-v4',
  );
  await page.reload();
  await expect(page.locator('.ew-topline')).toContainText('Standard');
  await page.getByRole('button', { name: 'New journey', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export v3 campaign', exact: true }).click();
  expect((await readFile(await (await downloading).path())).equals(Buffer.from(oldV3))).toBe(true);
  await page.getByRole('button', { name: 'Restore v3 campaign', exact: true }).click();
  await expect(page.locator('.ew-topline')).toContainText('Severe · previous rules v3');
  await page.reload();
  await expect(page.locator('.ew-topline')).toContainText('Severe · previous rules v3');
  expect(await page.evaluate((key) => localStorage.getItem(key), ACTIVE_MODE_KEY)).toBe(
    'campaign-v3',
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(current);
  expect(await page.evaluate((key) => localStorage.getItem(key), PREVIOUS_SAVE_KEY)).toBe(oldV3);
  expect(await page.evaluate((key) => localStorage.getItem(key), LEGACY_SAVE_KEY)).toBe(oldV2);
});

test('Emberwake displays and enforces native life-potion recovery after a recorded legal drink', async ({
  page,
}) => {
  test.setTimeout(90000);
  // This native lifecycle fixture uses full state to arrange a legal hit. It is
  // independent of policy choices and is not restricted-policy performance evidence.
  let prefix = newSession('EMBERWAKE-RECOVERY-BROWSER-1', 'barbarian');
  const act = (command: Command) => {
    const result = dispatch(prefix, command);
    expect(result.error).toBeNull();
    prefix = result.session;
  };
  act({ type: 'travel', act: 0, region: prefix.state.region });
  const p = prefix.state.player;
  const foe = currentWorld(prefix.state)
    .enemies.filter((enemy) => !enemy.boss)
    .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
  act({ type: 'move', target: { x: foe.x, y: foe.y } });
  const maximum = stats(prefix.state, prefix.replay.content).maxHp;
  for (let tick = 0; tick < 2000 && prefix.state.player.hp === maximum; tick++)
    act({ type: 'advance', ticks: 1 });
  expect(prefix.state.status).toBe('playing');
  expect(prefix.state.player.hp).toBeLessThan(maximum);
  act({ type: 'potion', kind: 'health' });
  expect(prefix.state.player.cooldowns[HEALTH_POTION_COOLDOWN]).toBe(200);
  const original = exportSession(prefix);
  await page.goto('/');
  await page.evaluate(
    ({ key, mode, text }) => {
      localStorage.setItem(key, text);
      localStorage.setItem(mode, 'campaign-v4');
    },
    { key: SAVE_KEY, mode: ACTIVE_MODE_KEY, text: original },
  );
  await page.goto('/?game=diablo2');
  const potion = page.getByRole('button', { name: /1 · Life potion/ });
  await expect(potion).toContainText('Ready in 20.0s');
  await expect(potion).toBeDisabled();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(original);
  await page.reload();
  await expect(potion).toContainText('Ready in 20.0s');
  await expect(potion).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mkdir('test-results/emberwake-policy-review', { recursive: true });
  await page.screenshot({
    path: 'test-results/emberwake-policy-review/recovery-phone.png',
    fullPage: true,
  });
});

test('lossless rollout containers keep distinct originals selectable and reject damaged transfers', async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  // A small known policy isolates shared storage/review behavior from campaign strength.
  const { adapter: sharedAdapter, builtins: sharedPolicies } =
    await import('../../src/games/balatro/agent/adapter');
  const { gzipSync } = await import('node:zlib');
  const run = await recordEpisode(sharedAdapter, sharedPolicies.immediate, {
    seed: 'POLICY-CONTAINER-BROWSER-DEV-01',
    setup: { difficulty: 'standard' },
    policySeed: 'POLICY-STREAM-1',
    policyOptions: {},
    maxDecisions: 8,
  });
  const plain = Buffer.from(JSON.stringify(run) + '\n');
  const first = gzipSync(plain);
  const second = Buffer.from(first);
  // Gzip MTIME is outside the decoded payload; both valid containers encode identical JSON.
  second.writeUInt32LE(1, 4);
  expect(first.equals(second)).toBe(false);
  const originals = [
    { name: 'original-a.json.gzip', bytes: first },
    { name: 'original-b.json.gz', bytes: second },
    { name: 'original-c.json', bytes: plain },
    { name: 'original-d.json', bytes: Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), plain]) },
  ];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=balatro&review=policy');
  const open = page.getByLabel('Open policy rollouts');
  await open.setInputFiles(
    originals.map(({ name, bytes }) => ({
      name,
      mimeType: 'application/octet-stream',
      buffer: bytes,
    })),
  );
  await expect(page.getByTestId('rollout-audit')).toHaveText(
    'Replay reconstruction: passed · Artifact integrity: passed · Permitted inputs: passed · Policy reproduction: passed',
  );
  for (const original of originals) {
    await expect(page.getByRole('button', { name: original.name, exact: true })).toBeVisible();
    await page.getByRole('button', { name: original.name, exact: true }).click();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download original rollout', exact: true }).click();
    const downloaded = await downloading;
    expect(downloaded.suggestedFilename()).toBe(original.name);
    expect((await readFile(await downloaded.path())).equals(original.bytes)).toBe(true);
  }
  await page.getByRole('button', { name: originals[0].name, exact: true }).click();
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(run.decisions[0].input, null, 2),
  );
  await expect(page.getByTestId('evaluator-knowledge')).toHaveCount(0);
  await expect(page.getByLabel('Recorded Blindside table')).toContainText('ready');
  await page.getByRole('button', { name: 'After decision', exact: true }).click();
  await expect(page.getByLabel('Recorded Blindside table')).toContainText('playing');
  await page.getByRole('button', { name: 'Before decision', exact: true }).click();
  await expect(page.getByLabel('Recorded Blindside table')).toContainText('ready');
  await page.getByRole('button', { name: 'Last decision', exact: true }).click();
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(run.decisions.at(-1)!.input, null, 2),
  );
  await page.getByRole('button', { name: 'Show evaluator view', exact: true }).click();
  await expect(page.getByTestId('evaluator-knowledge')).toContainText('"rng"');
  await page.getByRole('button', { name: 'Hide evaluator view', exact: true }).click();
  // Failed imports leave the selected original and its decision intact.
  const corrupt = Buffer.from(first);
  corrupt[corrupt.length - 8] ^= 1;
  const invalid = [
    { name: 'truncated.json.gzip', buffer: first.subarray(0, -4) },
    { name: 'crc.json.gzip', buffer: corrupt },
    { name: 'utf8.json.gzip', buffer: gzipSync(Uint8Array.of(0xff)) },
    { name: 'members.json.gzip', buffer: Buffer.concat([first, second]) },
    { name: 'expansion.json.gzip', buffer: gzipSync(Buffer.alloc(150_000_001)) },
  ];
  for (const file of invalid) {
    await open.setInputFiles({ ...file, mimeType: 'application/gzip' });
    await expect(page.getByRole('status')).toContainText(file.name, { timeout: 30000 });
    await expect(page.getByRole('button', { name: file.name, exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Decision number')).toHaveValue(String(run.decisions.length));
    await expect(page.getByTestId('policy-knowledge')).toHaveText(
      JSON.stringify(run.decisions.at(-1)!.input, null, 2),
    );
  }
  for (const [label, name] of [
    ['Download replay', 'replay.json'],
    ['Download current audit', 'audit.json'],
  ] as const) {
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: label, exact: true }).click();
    const downloaded = await downloading;
    expect(downloaded.suggestedFilename()).toBe(name);
    JSON.parse(await readFile(await downloaded.path(), 'utf8'));
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('compressed-original-phone.png'),
    fullPage: true,
  });
  // Simulate the server's two distinct behaviors using real browser Fetch decoding.
  await page.route(
    (url) => url.pathname === '/container.json.gzip',
    (route) => route.fulfill({ contentType: 'application/gzip', body: first }),
  );
  await page.goto('/?game=balatro&review=policy&rollout=/container.json.gzip');
  await expect(page.getByTestId('rollout-audit')).toContainText('Policy reproduction: passed');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original rollout', exact: true }).click();
  const downloaded = await downloading;
  expect(downloaded.suggestedFilename()).toBe('container.json.gzip');
  expect((await readFile(await downloaded.path())).equals(first)).toBe(true);
  const { writeFile } = await import('node:fs/promises');
  const served = async (name: string, bytes: Buffer) => {
    const file = testInfo.outputPath(name);
    await writeFile(file, bytes);
    return '/' + relative(process.cwd(), file).replaceAll('\\', '/');
  };
  // Vite's real .gz response applies HTTP gzip decoding before Fetch exposes the body.
  const decodedUrl = await served('decoded-container.json.gz', first);
  await page.goto('/?game=balatro&review=policy&rollout=' + encodeURIComponent(decodedUrl));
  await expect(page.getByRole('status')).toContainText('server decoded this gzip file');
  await expect(page.getByRole('status')).toContainText('Open the original local file');
  await expect(
    page.getByRole('button', { name: 'Download original rollout', exact: true }),
  ).toHaveCount(0);
  // A server can omit the encoding header, so a remote gzip filename still requires gzip magic.
  const missingHeaderUrl = await served('header-lost.json.gzip', plain);
  const headerLostResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === missingHeaderUrl,
  );
  await page.goto('/?game=balatro&review=policy&rollout=' + encodeURIComponent(missingHeaderUrl));
  expect((await headerLostResponse).headers()['content-encoding']).toBeUndefined();
  await expect(page.getByRole('status')).toContainText(
    'server may have decoded it or the file may be misnamed',
  );
  await expect(page.getByRole('status')).toContainText('Open the original local file');
  await expect(
    page.getByRole('button', { name: 'Download original rollout', exact: true }),
  ).toHaveCount(0);
  // A route supplies the post-transport-decoding response shape for an ordinary .json URL.
  // Playwright fulfillment itself does not exercise HTTP content decoding.
  await page.route(
    (url) => url.pathname === '/transport.json',
    (route) =>
      route.fulfill({
        contentType: 'application/json',
        headers: { 'Content-Encoding': 'gzip' },
        body: plain,
      }),
  );
  await page.goto('/?game=balatro&review=policy&rollout=/transport.json');
  await expect(page.getByTestId('rollout-audit')).toContainText('Policy reproduction: passed');
  const transportDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original rollout', exact: true }).click();
  expect((await readFile(await (await transportDownload).path())).equals(plain)).toBe(true);
  // An actual Vite HTTP gzip layer over the saved inner container remains valid.
  const outerUrl = await served('outer.json.gzip.gz', gzipSync(first));
  await page.goto('/?game=balatro&review=policy&rollout=' + encodeURIComponent(outerUrl));
  await expect(page.getByTestId('rollout-audit')).toContainText('Policy reproduction: passed');
  const outerDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original rollout', exact: true }).click();
  expect((await readFile(await (await outerDownload).path())).equals(first)).toBe(true);
  expect(errors).toEqual([]);
});

test('large retained campaign container decodes exact original bytes in actual Chrome', async ({
  page,
}, testInfo) => {
  const witness = process.env.POLICY_GZIP_WITNESS;
  test.skip(
    !witness,
    'Set POLICY_GZIP_WITNESS to an existing same-origin .json.gzip witness; no campaign is generated by this primitive test.',
  );
  test.setTimeout(120000);
  const { createHash } = await import('node:crypto');
  const { gunzipSync } = await import('node:zlib');
  const { writeFile } = await import('node:fs/promises');
  const encoded = await readFile(witness!);
  const decoded = gunzipSync(encoded, { maxOutputLength: 150_000_000 });
  const expected = {
    encodedBytes: encoded.byteLength,
    encodedSha256: createHash('sha256').update(encoded).digest('hex'),
    decodedBytes: decoded.byteLength,
    decodedSha256: createHash('sha256').update(decoded).digest('hex'),
  };
  await page.goto('/?game=balatro&review=policy');
  const result = await page.evaluate(async (path) => {
    const { decodeArtifact, readArtifactStream, assertFetchedArtifact } =
      await import('../../src/shared/policy/artifact');
    const response = await fetch('/' + path);
    if (!response.ok || !response.body) throw new Error('Retained witness unavailable.');
    const bytes = await readArtifactStream(response.body);
    assertFetchedArtifact(
      bytes,
      new URL(response.url).pathname,
      response.headers.get('content-encoding'),
    );
    const text = await decodeArtifact(bytes);
    const hash = async (value: Uint8Array<ArrayBuffer>) =>
      Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', value)), (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join('');
    return {
      encodedBytes: bytes.byteLength,
      encodedSha256: await hash(bytes),
      decodedBytes: new TextEncoder().encode(text).byteLength,
      decodedSha256: await hash(new TextEncoder().encode(text)),
      magic: [...bytes.subarray(0, 2)],
      contentEncoding: response.headers.get('content-encoding'),
    };
  }, witness!);
  expect(result.magic).toEqual([31, 139]);
  expect(result.encodedBytes).toBe(expected.encodedBytes);
  expect(result.encodedSha256).toBe(expected.encodedSha256);
  expect(result.decodedBytes).toBe(expected.decodedBytes);
  expect(result.decodedSha256).toBe(expected.decodedSha256);
  await writeFile(
    testInfo.outputPath('large-container-bytes.json'),
    JSON.stringify(
      {
        ...result,
        witness,
        scope:
          'Storage primitive only; no native replay or historical policy reproduction verdict.',
      },
      null,
      2,
    ) + '\n',
  );
});

test('large retained campaign review preserves knowledge, native boundaries and exact compressed download', async ({
  page,
}, testInfo) => {
  const witness = process.env.POLICY_GZIP_REVIEW_WITNESS;
  test.skip(
    !witness,
    'Set POLICY_GZIP_REVIEW_WITNESS to a retained campaign container; no campaign is generated by this review test.',
  );
  test.setTimeout(180000);
  const { gunzipSync } = await import('node:zlib');
  const { writeFile } = await import('node:fs/promises');
  const { createHash } = await import('node:crypto');
  const { parseRollout } = await import('../../src/shared/policy/rollout');
  const original = await readFile(witness!);
  const run = parseRollout(gunzipSync(original, { maxOutputLength: 150_000_000 }).toString('utf8'));
  const expectedDecisions = Object.values(builtins).some(
    (factory) => factory.id === run.policy.id && factory.version === run.policy.version,
  )
    ? 'passed'
    : 'unavailable';
  await page.goto('/?game=diablo2&review=policy&rollout=' + encodeURIComponent('/' + witness!));
  await expect(page.getByTestId('rollout-audit')).toHaveText(
    `Replay reconstruction: passed · Artifact integrity: passed · Permitted inputs: passed · Policy reproduction: ${expectedDecisions}`,
    { timeout: 120000 },
  );
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(run.decisions[0].input, null, 2),
  );
  await expect(page.getByTestId('evaluator-knowledge')).toHaveCount(0);
  await expect(page.getByLabel('Recorded Emberwake journey')).toBeVisible();
  await page.getByRole('button', { name: 'Last decision', exact: true }).click();
  const last = run.decisions.at(-1)!;
  await expect(page.getByTestId('policy-knowledge')).toHaveText(
    JSON.stringify(last.input, null, 2),
  );
  await expect(page.getByTestId('rollout-decision')).toContainText(
    `Replay units ${last.before} → ${last.after}`,
  );
  await page.getByRole('button', { name: 'After decision', exact: true }).click();
  await expect(page.getByTestId('rollout-decision')).toContainText('after');
  await page.getByRole('button', { name: 'Show evaluator view', exact: true }).click();
  const evaluator = JSON.parse(await page.getByTestId('evaluator-knowledge').innerText()) as {
    session: { state: { tick: number; status: string } };
  };
  expect(evaluator.session.state.tick).toBe(run.episode.metrics.executedTicks);
  expect(evaluator.session.state.status).toBe(run.episode.metrics.outcome);
  await page.getByRole('button', { name: 'Hide evaluator view', exact: true }).click();
  await page.getByRole('button', { name: 'Before decision', exact: true }).click();
  await expect(page.getByTestId('rollout-decision')).toContainText('before');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('large-review-phone.png'), fullPage: true });
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original rollout', exact: true }).click();
  const downloaded = await downloading;
  expect(downloaded.suggestedFilename()).toBe(witness!.split('/').at(-1));
  const delivered = await readFile(await downloaded.path());
  expect(delivered.equals(original)).toBe(true);
  await writeFile(
    testInfo.outputPath('large-review-receipt.json'),
    JSON.stringify(
      {
        witness,
        nativeIdentity: run.identity,
        policy: run.policy,
        decisions: run.decisions.length,
        audit: {
          integrity: 'passed',
          replay: 'passed',
          inputs: 'passed',
          decisions: expectedDecisions,
        },
        encodedBytes: original.byteLength,
        encodedSha256: createHash('sha256').update(delivered).digest('hex'),
        finalNativeExecutedTicks: evaluator.session.state.tick,
        finalNativeOutcome: evaluator.session.state.status,
      },
      null,
      2,
    ) + '\n',
  );
});
