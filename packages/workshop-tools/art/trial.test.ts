import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { evaluate, handoff, hash, initialize, load, record } from './trial.ts';

const start = Date.parse('2026-10-08T00:00:00.000Z');
const at = (minutes: number) => new Date(start + minutes * 60_000).toISOString();
const spec =
  'Preserve identity; repair wing attachment; inspect front/side/rear and a motion probe.';
const init = {
  kind: 'init',
  version: 1,
  at: at(0),
  trial: 'stormroc-method-pilot',
  asset: 'stormroc',
  spec,
  baseline: [{ path: 'baseline-manifest.json', sha256: '0'.repeat(64) }],
  roles: {
    director: { id: 'astra-root', model: 'gpt-6-astra', effort: 'xhigh' },
    author: { id: 'sol-author', model: 'gpt-6.1-sol', effort: 'high' },
    verifier: { id: 'sol-verifier', model: 'gpt-6.1-sol', effort: 'high' },
  },
};
const usage = (minute: number, credits = 1, coverage = 'complete') => ({
  kind: 'usage',
  at: at(minute),
  through: at(minute),
  credits,
  coverage,
  source: 'visible usage receipt covering all participants, including director',
});
const audit = {
  kind: 'audit',
  at: at(1),
  reviewer: 'sol-verifier',
  specHash: hash(spec),
  approved: true,
  findings: 'Observable and bounded',
  evidence: ['audit.md'],
};
const begin = {
  kind: 'start',
  at: at(2),
  package: 'wing-root',
  defect: 'Detached wing root',
  ownedPaths: ['candidate.blend'],
  interfaces: 'Shoulder anchor and wing excursion preserved',
  acceptance: 'Fitted in clay views and both motion extremes',
};
const review = (minute: number, verdict = 'fail') => ({
  kind: 'review',
  at: at(minute),
  package: 'wing-root',
  reviewer: 'sol-verifier',
  specHash: hash(spec),
  candidate: { path: 'candidate-manifest.json', sha256: '1'.repeat(64) },
  verdict,
  evidence: ['front.png', 'side.png', 'motion.png'],
  critique: 'Side / shoulder separates / fit at extreme',
});

await test('handoffs share one audited spec and enforce independent ownership', () => {
  const history = [init, audit, usage(2), begin];
  const author = handoff(history, 'author', start + 2 * 60_000);
  const verifier = handoff(history, 'verifier', start + 2 * 60_000);
  for (const message of [author, verifier]) {
    assert.ok(message.includes(spec));
    assert.ok(message.includes(hash(spec)));
    assert.match(message, /wing-root/);
  }
  assert.match(verifier, /before reading author self-assessment/);
  assert.throws(() => evaluate([init, begin], start + 2 * 60_000), /Audit the specification/);
  assert.throws(
    () => evaluate([{ ...init, roles: { ...init.roles, verifier: init.roles.author } }], start),
    /distinct/,
  );
  assert.throws(
    () => evaluate([init, { ...audit, specHash: 'old' }], start + 60_000),
    /pin the current/,
  );
});

await test('caps are cumulative, inclusive, and cannot be reset by a later pass or takeover', () => {
  const history = [init, audit, usage(2), begin, review(10), review(15)];
  const state = evaluate([...history, usage(15)], start + 15 * 60_000);
  assert.equal(state.allowed, false);
  assert.ok(state.reasons.includes('wing-root: failed revision cap reached'));
  const later = [
    ...history,
    {
      kind: 'intervention',
      at: at(16),
      actor: 'astra-root',
      model: 'gpt-6-astra',
      effort: 'xhigh',
      detail: 'Takeover',
      evidence: ['takeover.md'],
    },
    review(17, 'clear'),
    usage(17),
  ];
  assert.equal(evaluate(later, start + 17 * 60_000).allowed, false);
  assert.throws(
    () => evaluate([init, audit, begin, { ...begin, at: at(3) }], start + 3 * 60_000),
    /cannot restart/,
  );
  assert.ok(
    evaluate([init, audit, begin, usage(32)], start + 32 * 60_000).reasons.includes(
      'wing-root: package time cap reached',
    ),
  );
  assert.ok(
    evaluate([init, usage(90)], start + 90 * 60_000).reasons.includes('Asset time cap reached'),
  );
  assert.ok(
    evaluate([init, usage(1, 250)], start + 60_000).reasons.includes('Asset credit cap reached'),
  );
});

await test('only explicit user wait is excluded from elapsed time, including package overlap', () => {
  const history = [
    init,
    audit,
    begin,
    { kind: 'pause', at: at(10), reason: 'user-wait', evidence: 'Question awaiting user' },
    { kind: 'resume', at: at(70) },
    usage(80),
  ];
  const state = evaluate(history, start + 80 * 60_000);
  assert.equal(state.minutes, 20);
  assert.equal(state.packages[0]?.minutes, 18);
  assert.equal(state.allowed, true);
  assert.throws(
    () =>
      evaluate(
        [init, { kind: 'pause', at: at(1), reason: 'rendering', evidence: 'render' }],
        start + 60_000,
      ),
    /user-wait/,
  );
  assert.throws(() => evaluate([init, { kind: 'resume', at: at(1) }], start + 60_000), /No pause/);
});

await test('unknown, stale, partial and decreasing telemetry cannot authorize another dispatch', () => {
  assert.equal(evaluate([init], start).allowed, false);
  assert.equal(evaluate([init, usage(1, 0, 'partial')], start + 60_000).allowed, false);
  assert.equal(evaluate([init, usage(1)], start + 4 * 60_000).allowed, false);
  assert.equal(evaluate([init, usage(1)], start + 3 * 60_000).allowed, true);
  assert.throws(
    () => evaluate([init, usage(1, 10), usage(2, 9)], start + 2 * 60_000),
    /cannot decrease/,
  );
  assert.throws(
    () => evaluate([init, { ...usage(1), credits: Number.NaN }], start + 60_000),
    /finite/,
  );
});

await test('director spec revisions require re-audit and retain active package clocks and failures', () => {
  const revision = {
    kind: 'spec',
    at: at(2),
    text: 'Revised bounded brief',
    reason: 'Audit ambiguity',
    director: 'astra-root',
  };
  const state = evaluate([init, audit, usage(2, 12), revision], start + 2 * 60_000);
  assert.equal(state.audited, false);
  assert.equal(state.usage?.credits, 12);
  assert.equal(state.minutes, 2);
  assert.throws(
    () => handoff([init, audit, usage(2), revision], 'author', start + 2 * 60_000),
    /audit is required/,
  );
  const changed = [init, audit, begin, review(10), { ...revision, at: at(11) }, usage(11, 20)];
  const active = evaluate(changed, start + 11 * 60_000);
  assert.equal(active.packages[0]?.failures, 1);
  assert.equal(active.packages[0]?.minutes, 9);
  assert.equal(active.audited, false);
  assert.throws(() => evaluate([...changed, review(12)], start + 12 * 60_000), /Audit the current/);
  assert.throws(
    () => evaluate([init, { ...revision, director: 'sol-author' }], start + 2 * 60_000),
    /Director must own/,
  );
});

await test('disk receipts refuse overwrite, changed pins, symlinks and rewritten history', async (t) => {
  const root = await realpath(await mkdtemp(resolve(tmpdir(), 'art-trial-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const baseline = resolve(root, 'baseline.json');
  await writeFile(baseline, 'baseline');
  const realInit = {
    ...init,
    at: new Date(Date.now() - 60_000).toISOString(),
    baseline: [{ path: baseline, sha256: hash('baseline') }],
  };
  const directory = resolve(root, 'trial');
  await initialize(directory, realInit);
  await assert.rejects(initialize(directory, realInit), /EEXIST/);
  await assert.rejects(
    initialize(resolve(root, 'bad'), {
      ...realInit,
      baseline: [{ path: baseline, sha256: '0'.repeat(64) }],
    }),
    /pin changed/,
  );
  await record(directory, {
    kind: 'usage',
    at: new Date().toISOString(),
    through: new Date().toISOString(),
    credits: 1,
    coverage: 'complete',
    source: 'test receipt',
  });
  assert.equal((await load(directory)).values.length, 2);
  const first = resolve(directory, '000000.json');
  const original = await readFile(first, 'utf8');
  await writeFile(first, original.replace('stormroc-method-pilot', 'tampered-trial'));
  await assert.rejects(load(directory), /hash chain/);
  await writeFile(first, original);
  const link = resolve(root, 'linked');
  await symlink(directory, link);
  await assert.rejects(load(link), /symlinks/);
  await record(directory, {
    kind: 'stop',
    at: new Date().toISOString(),
    reason: 'Budget exhausted',
    evidence: ['bounded-result.md'],
  });
  await assert.rejects(record(directory, { ...begin, at: new Date().toISOString() }), /stopped/);
  await record(directory, {
    kind: 'intervention',
    at: new Date().toISOString(),
    actor: 'astra-root',
    model: 'gpt-6-astra',
    effort: 'xhigh',
    detail: 'Recorded late closeout evidence only',
    evidence: ['closeout.md'],
  });
});
