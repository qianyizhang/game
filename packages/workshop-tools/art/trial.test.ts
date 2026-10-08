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

await test('v2 pins per-trial limits and reserve while historical v1 remains unchanged', () => {
  const second = {
    ...init,
    version: 2,
    limits: { assetMinutes: 120, packageMinutes: 40, failedRevisions: 3, credits: 400 },
    reserve: { minutes: 20, credits: 80 },
  };
  const timeNow = start + 90 * 60_000;
  assert.equal(evaluate([init, usage(90, 260)], timeNow).allowed, false);
  const current = evaluate([second, usage(90, 260)], timeNow);
  assert.equal(current.allowed, true);
  assert.equal(current.remaining.minutes, 30);
  assert.equal(current.remaining.credits, 140);
  assert.match(handoff([second, usage(90, 260)], 'auditor', timeNow), /400/);
  assert.equal(evaluate([second, usage(100, 260)], start + 100 * 60_000).allowed, false);
  assert.equal(evaluate([second, usage(90, 320)], timeNow).allowed, false);
  assert.throws(
    () => evaluate([{ ...init, limits: second.limits }], start),
    /cannot be overridden/,
  );
  assert.throws(
    () => evaluate([{ ...second, reserve: { minutes: 120, credits: 80 } }], start),
    /Reserve/,
  );
  assert.throws(
    () => evaluate([{ ...second, limits: { ...second.limits, failedRevisions: 1.5 } }], start),
    /integer/,
  );
});

await test('v2 dispatch refuses a step that cannot leave final-review reserve; evidence stays recordable', async (t) => {
  const root = await realpath(await mkdtemp(resolve(tmpdir(), 'art-trial-reserve-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const baseline = resolve(root, 'baseline.json');
  await writeFile(baseline, 'baseline');
  const directory = resolve(root, 'trial');
  const stamp = () => new Date().toISOString();
  await initialize(directory, {
    ...init,
    version: 2,
    at: new Date(Date.now() - 60_000).toISOString(),
    limits: { assetMinutes: 90, packageMinutes: 30, failedRevisions: 2, credits: 250 },
    reserve: { minutes: 20, credits: 60 },
    baseline: [{ path: baseline, sha256: hash('baseline') }],
  });
  await record(directory, { ...audit, at: stamp() });
  const through = stamp();
  await record(directory, { ...usage(1, 120), at: through, through });
  const estimated = {
    ...begin,
    at: stamp(),
    estimate: { minutes: 25, credits: 80, basis: 'Author plus verifier and parent integration' },
  };
  await assert.rejects(record(directory, estimated), /does not fit/);
  await record(directory, { ...estimated, estimate: { ...estimated.estimate, credits: 50 } });
  const capStamp = stamp();
  await record(directory, { ...usage(1, 190), at: capStamp, through: capStamp });
  const values = (await load(directory)).values;
  assert.throws(() => handoff(values, 'author'), /Reserved final-review credits/);
  assert.match(handoff(values, 'verifier'), /Review-only reserve/);
  assert.match(handoff(values, 'director'), /Review-only reserve/);
  await record(directory, {
    kind: 'stop',
    at: stamp(),
    reason: 'Reserve reached; freeze for final review',
    evidence: ['candidate.json'],
  });
  assert.equal((await load(directory)).values.at(-1)?.kind, 'stop');
  assert.throws(
    () =>
      handoff(
        values.concat({ kind: 'stop', at: stamp(), reason: 'Done', evidence: ['done.json'] }),
        'director',
      ),
    /explicitly stopped/,
  );
});

await test('reserve permits review only, while actual caps, failed revisions, pauses and telemetry still block it', () => {
  const configured = {
    ...init,
    version: 2,
    limits: { assetMinutes: 90, packageMinutes: 30, failedRevisions: 2, credits: 250 },
    reserve: { minutes: 20, credits: 60 },
  };
  const started = {
    ...begin,
    estimate: { minutes: 10, credits: 20, basis: 'Measured comparison' },
  };
  const history = [configured, audit, started, usage(20, 190)];
  const now = start + 20 * 60_000;
  assert.equal(evaluate(history, now).allowed, false);
  for (const role of ['verifier', 'director']) {
    assert.match(handoff(history, role, now), /Review-only reserve/);
    assert.throws(() => handoff([...history, usage(20, 250)], role, now), /Asset credit cap/);
    assert.throws(() => handoff(history, role, now + 180_000), /usage must be refreshed/);
    assert.throws(
      () =>
        handoff(
          [...history, { kind: 'pause', at: at(20), reason: 'user-wait', evidence: 'Question' }],
          role,
          now,
        ),
      /Waiting for user/,
    );
    assert.throws(
      () => handoff([...history, review(20), review(20)], role, now),
      /failed revision cap/,
    );
    assert.throws(
      () => handoff([...history, usage(32, 190)], role, start + 32 * 60_000),
      /package time cap/,
    );
  }
  const timeReserve = [configured, audit, { ...started, at: at(60) }, usage(70, 100)];
  assert.match(handoff(timeReserve, 'verifier', start + 70 * 60_000), /Review-only reserve/);
  assert.throws(
    () => handoff(timeReserve, 'author', start + 70 * 60_000),
    /Reserved final-review time/,
  );
  assert.throws(
    () => handoff([configured, usage(90, 100)], 'director', start + 90 * 60_000),
    /Asset time cap/,
  );
});

const extendAllowance = (minute: number, credits = 1000) => ({
  kind: 'allowance',
  at: at(minute),
  director: init.roles.director.id,
  credits,
  reserveCredits: 200,
  authorization: 'User explicitly raised this asset allowance; cumulative usage is retained.',
  evidence: ['user-authorization.json'],
});
const allowanceInit = {
  ...init,
  version: 2,
  limits: { assetMinutes: 90, packageMinutes: 30, failedRevisions: 2, credits: 250 },
  reserve: { minutes: 20, credits: 60 },
};

await test('allowance increases only the effective credit policy without rewriting history or counters', () => {
  const initialBytes = JSON.stringify(allowanceInit);
  const begun = {
    ...begin,
    estimate: { minutes: 10, credits: 20, basis: 'Comparable whole-step receipt' },
  };
  const history = [allowanceInit, audit, begun, review(3), usage(4, 260)];
  const before = evaluate(history, start + 5 * 60_000);
  const extended = [...history, extendAllowance(5)];
  const after = evaluate(extended, start + 5 * 60_000);
  assert.equal(before.limits.credits, 250);
  assert.equal(before.allowed, false);
  assert.equal(after.allowed, true);
  assert.deepEqual(after.limits, { ...before.limits, credits: 1000 });
  assert.deepEqual(after.reserve, { ...before.reserve, credits: 200 });
  assert.deepEqual(after.usage, before.usage);
  assert.deepEqual(after.packages, before.packages);
  assert.equal(after.minutes, before.minutes);
  assert.equal(after.remaining.credits, 740);
  assert.equal(JSON.stringify(allowanceInit), initialBytes);
  assert.equal(evaluate(history, start + 4 * 60_000).limits.credits, 250);
  assert.match(handoff(extended, 'author', start + 5 * 60_000), /"credits": 1000/);
  assert.equal(evaluate([...extended, usage(5, 800)], start + 5 * 60_000).allowed, false);
  assert.throws(
    () => handoff([...extended, usage(5, 1000)], 'director', start + 5 * 60_000),
    /Asset credit cap/,
  );
  assert.throws(() => evaluate([...extended, usage(5, 0)], start + 5 * 60_000), /cannot decrease/);
  assert.ok(
    evaluate([...extended, review(5)], start + 5 * 60_000).reasons.some((r) =>
      r.includes('failed revision cap'),
    ),
  );
  assert.ok(
    evaluate([...extended, usage(32, 270)], start + 32 * 60_000).reasons.some((r) =>
      r.includes('package time cap'),
    ),
  );
  assert.ok(
    evaluate([...extended, usage(90, 270)], start + 90 * 60_000).reasons.includes(
      'Asset time cap reached',
    ),
  );
});

await test('allowance rejects unapproved identities, missing evidence, repeated or decreasing caps and noncredit changes', () => {
  const extension = extendAllowance(1);
  const now = start + 60_000;
  assert.throws(() => evaluate([init, extension], now), /v2 required/);
  for (const patch of [
    { director: init.roles.author.id },
    { authorization: ' ' },
    { evidence: [] },
    { evidence: [' '] },
    { credits: 250 },
    { credits: 200 },
    { reserveCredits: 0 },
    { reserveCredits: 1000 },
    { assetMinutes: 200 },
    { limits: { credits: 1000 } },
  ])
    assert.throws(() => evaluate([allowanceInit, { ...extension, ...patch }], now));
  assert.throws(() => evaluate([allowanceInit, extension, extension], now), /strictly increase/);
  assert.throws(
    () => evaluate([allowanceInit, extension, extendAllowance(1, 900)], now),
    /strictly increase/,
  );
});

await test('recorded allowance is append-only, preserves cumulative usage and cannot revive a stopped trial', async (t) => {
  const root = await realpath(await mkdtemp(resolve(tmpdir(), 'art-trial-allowance-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const baseline = resolve(root, 'baseline.json');
  await writeFile(baseline, 'baseline');
  const directory = resolve(root, 'trial');
  const stamp = () => new Date().toISOString();
  await initialize(directory, {
    ...allowanceInit,
    at: new Date(Date.now() - 60_000).toISOString(),
    baseline: [{ path: baseline, sha256: hash('baseline') }],
  });
  const initial = await readFile(resolve(directory, '000000.json'));
  const metered = stamp();
  await record(directory, { ...usage(1, 260), at: metered, through: metered });
  const earlier = (await load(directory)).values;
  assert.equal(evaluate(earlier).limits.credits, 250);
  await record(directory, { ...extendAllowance(1), at: stamp() });
  const extended = (await load(directory)).values;
  assert.equal(evaluate(extended).allowed, true);
  assert.equal(evaluate(extended).usage?.credits, 260);
  assert.equal(evaluate(earlier).limits.credits, 250);
  assert.deepEqual(await readFile(resolve(directory, '000000.json')), initial);
  await assert.rejects(
    record(directory, { ...extendAllowance(1), at: stamp() }),
    /strictly increase/,
  );
  await record(directory, { kind: 'stop', at: stamp(), reason: 'Frozen', evidence: ['stop.json'] });
  await record(directory, { ...extendAllowance(1, 1200), at: stamp() });
  const stopped = (await load(directory)).values;
  assert.equal(evaluate(stopped).limits.credits, 1200);
  assert.equal(evaluate(stopped).usage?.credits, 260);
  assert.equal(evaluate(stopped).allowed, false);
  assert.throws(() => handoff(stopped, 'director'), /explicitly stopped/);
  await assert.rejects(
    record(directory, {
      ...begin,
      at: stamp(),
      estimate: { minutes: 5, credits: 5, basis: 'Repair' },
    }),
    /explicitly stopped/,
  );
  assert.deepEqual(await readFile(resolve(directory, '000000.json')), initial);
});
