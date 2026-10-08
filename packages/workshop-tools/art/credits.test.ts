import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { collectCredits } from './credits.ts';
import { hash, initialize, load, refreshCredits } from './trial.ts';

const rootId = '00000000-0000-0000-0000-000000000001';
const childId = '00000000-0000-0000-0000-000000000002';
const otherId = '00000000-0000-0000-0000-000000000003';
const since = '2026-10-08T00:10:00.000Z';
const through = '2026-10-08T00:20:00.000Z';
const event = (type: string, payload: unknown, timestamp = '2026-10-08T00:11:00.000Z') => ({
  timestamp,
  type,
  payload,
});
const meta = (id: string, parent?: string) =>
  event(
    'session_meta',
    {
      id,
      source: parent ? { subagent: { thread_spawn: { parent_thread_id: parent } } } : 'vscode',
    },
    '2026-10-08T00:00:00.000Z',
  );
const context = (model: string) =>
  event('turn_context', { turn_id: 'turn', model, effort: 'high' }, '2026-10-08T00:01:00.000Z');
const meter = (id: string, response = 'response', input = 1000) =>
  event('token_usage_record', {
    thread_id: id,
    session_id: rootId,
    turn_id: 'turn',
    response_id: response,
    usage: {
      input_tokens: input,
      cached_input_tokens: 400,
      output_tokens: 100,
      reasoning_output_tokens: 80,
      cache_write_input_tokens: 0,
      total_tokens: input + 100,
    },
  });
const lines = (records: unknown[]) => `${records.map((row) => JSON.stringify(row)).join('\n')}\n`;
async function fixture(t: { after: (fn: () => Promise<void>) => void }) {
  const directory = await realpath(await mkdtemp(resolve(tmpdir(), 'trial-credits-')));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

await test('root lineage, timestamp boundary and response identity give reproducible Standard credits without private content', async (t) => {
  const dir = await fixture(t);
  const rootRows = [
    meta(rootId),
    context('gpt-6-astra'),
    event('event_msg', { type: 'task_started', turn_id: 'turn' }),
    meter(rootId),
    meter(rootId),
    { ...meter(rootId, 'old'), timestamp: '2026-10-08T00:09:59.000Z' },
    event('event_msg', {
      type: 'token_count',
      info: { total_token_usage: { input_tokens: 999999999 } },
    }),
    event('response_item', { type: 'reasoning', content: 'PRIVATE_REASONING_SENTINEL' }),
  ];
  await writeFile(resolve(dir, 'root.jsonl'), lines(rootRows));
  await writeFile(resolve(dir, 'mirror.jsonl'), lines(rootRows));
  await writeFile(
    resolve(dir, 'child.jsonl'),
    lines([
      meta(childId, rootId),
      context('gpt-6.1-sol'),
      meter(childId),
      meter(rootId, 'inherited'),
    ]),
  );
  await writeFile(
    resolve(dir, 'unrelated.jsonl'),
    lines([meta(otherId), context('gpt-6-astra'), meter(otherId)]),
  );
  const report = await collectCredits({ root: rootId, since, through, sessionRoots: [dir] });
  assert.equal(report.coverage, 'complete');
  assert.equal(report.records.length, 2);
  assert.ok(Math.abs(report.credits - 0.341) < 1e-12);
  assert.equal(report.duplicates, 3);
  assert.equal(report.inheritedUsageIgnored, 1);
  assert.equal(report.inFlightTurns.length, 1);
  assert.equal(report.through, through);
  assert.equal(report.lastUsageAt, '2026-10-08T00:11:00.000Z');
  assert.equal(
    report.byThread.some((row) => row.thread === otherId),
    false,
  );
  assert.doesNotMatch(JSON.stringify(report), /PRIVATE_REASONING_SENTINEL|total_token_usage/);
  assert.ok(report.sources.every((source) => /^[a-f0-9]{64}$/.test(source.sha256)));
});

await test('model switches use their own rate; missing rates and invalid counters stay partial', async (t) => {
  const dir = await fixture(t);
  await writeFile(
    resolve(dir, 'root.jsonl'),
    lines([
      meta(rootId),
      context('gpt-6-astra'),
      meter(rootId, 'astra'),
      { ...context('gpt-6.1-sol'), timestamp: '2026-10-08T00:12:00.000Z' },
      { ...meter(rootId, 'sol'), timestamp: '2026-10-08T00:13:00.000Z' },
      { ...context('unknown-model'), timestamp: '2026-10-08T00:14:00.000Z' },
      { ...meter(rootId, 'unknown'), timestamp: '2026-10-08T00:15:00.000Z' },
      { ...meter(rootId, 'invalid', 1), timestamp: '2026-10-08T00:16:00.000Z' },
    ]),
  );
  const report = await collectCredits({ root: rootId, since, through, sessionRoots: [dir] });
  assert.equal(report.coverage, 'partial');
  assert.ok(Math.abs(report.credits - 0.341) < 1e-12);
  assert.match(report.gaps.join('\n'), /Unknown model rate/);
  assert.match(report.gaps.join('\n'), /Cached input exceeds input/);
});

await test('conflicting duplicates, missing children, image charges and truncated tails block complete coverage', async (t) => {
  const dir = await fixture(t);
  await writeFile(
    resolve(dir, 'root.jsonl'),
    lines([
      meta(rootId),
      context('gpt-6-astra'),
      meter(rootId),
      meter(rootId, 'response', 2000),
      event('response_item', { type: 'function_call', name: 'spawn_agent', call_id: 'spawn' }),
      event('response_item', {
        type: 'function_call_output',
        call_id: 'spawn',
        output: JSON.stringify({ agent_id: childId }),
      }),
      event('response_item', {
        type: 'function_call',
        name: 'functions.exec',
        arguments: 'await tools.image_gen__imagegen({prompt: "a bird"})',
      }),
    ]) + '{"incomplete":',
  );
  const report = await collectCredits({ root: rootId, since, through, sessionRoots: [dir] });
  assert.equal(report.coverage, 'partial');
  const reasons = report.gaps.join('\n');
  assert.match(reasons, /Conflicting duplicate/);
  assert.match(reasons, /Spawned agent log not discovered/);
  assert.match(reasons, /Image generation requires/);
  assert.match(reasons, /Incomplete log tail/);
});

await test('absent root and empty metering never become an invented zero-cost success', async (t) => {
  const dir = await fixture(t);
  await writeFile(resolve(dir, 'root.jsonl'), lines([meta(rootId), context('gpt-6-astra')]));
  const report = await collectCredits({ root: rootId, since, through, sessionRoots: [dir] });
  assert.equal(report.coverage, 'partial');
  assert.match(report.gaps.join('\n'), /No metered responses/);
  await assert.rejects(
    collectCredits({ root: childId, since, through, sessionRoots: [dir] }),
    /not found/,
  );
});

await test('ledger refresh writes a pinned receipt, accumulates rather than adds snapshots, and refuses accounting-root changes', async (t) => {
  const dir = await fixture(t);
  const rootFile = resolve(dir, 'root.jsonl');
  const rows = [meta(rootId), context('gpt-6-astra'), meter(rootId)];
  await writeFile(rootFile, lines(rows));
  const baseline = resolve(dir, 'baseline');
  await writeFile(baseline, 'baseline');
  const ledger = resolve(dir, 'ledger');
  await initialize(ledger, {
    kind: 'init',
    version: 1,
    at: since,
    trial: 'test',
    asset: 'stormroc',
    spec: 'bounded spec',
    baseline: [{ path: baseline, sha256: hash('baseline') }],
    roles: {
      director: { id: rootId, model: 'gpt-6-astra', effort: 'xhigh' },
      author: { id: childId, model: 'gpt-6.1-sol', effort: 'high' },
      verifier: { id: otherId, model: 'gpt-6.1-sol', effort: 'high' },
    },
  });
  const first = await refreshCredits(ledger, rootId, [dir]);
  const firstBytes = await readFile(first.output, 'utf8');
  const firstReport = JSON.parse(firstBytes) as Awaited<ReturnType<typeof collectCredits>>;
  assert.equal(first.coverage, 'complete');
  assert.ok(Math.abs(first.credits - 0.285) < 1e-12);
  await writeFile(rootFile, lines([...rows, meter(rootId, 'second')]));
  const second = await refreshCredits(ledger, rootId, [dir]);
  assert.ok(Math.abs(second.credits - 0.57) < 1e-12);
  assert.equal(await readFile(first.output, 'utf8'), firstBytes);
  const history = await load(ledger);
  assert.equal(history.values.length, 3);
  assert.deepEqual(history.values[1]?.accounting, {
    root: rootId,
    rateCardHash: firstReport.rateCard.sha256,
    reportHash: hash(firstBytes),
    scope: firstReport.coverageScope,
  });
  await writeFile(
    resolve(dir, 'other.jsonl'),
    lines([meta(otherId), context('gpt-6.1-sol'), meter(otherId)]),
  );
  await assert.rejects(refreshCredits(ledger, otherId, [dir]), /Accounting root\/rates changed/);
});
