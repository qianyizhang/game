import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { evaluate, handoff, hash, initialize, load, record } from './trial.ts';

const epoch = Date.parse('2026-10-09T00:00:00.000Z');
const at = (minute: number) => new Date(epoch + minute * 60_000).toISOString();
const pin = { path: 'construction.blend', sha256: '1'.repeat(64) };
const spec = 'A connected eyelid margin in whole clay, detail and motion.';
const init = {
  kind: 'init',
  version: 2,
  at: at(0),
  trial: 'opening-construction',
  asset: 'fixture',
  spec,
  baseline: [pin],
  roles: {
    director: { id: 'director', model: 'gpt-6-astra', effort: 'high' },
    author: { id: 'author', model: 'gpt-6.1-sol', effort: 'high' },
    verifier: { id: 'verifier', model: 'gpt-6.1-sol', effort: 'high' },
  },
  limits: { assetMinutes: 90, packageMinutes: 30, failedRevisions: 2, credits: 1000 },
  reserve: { minutes: 20, credits: 200 },
};
const audit = {
  kind: 'audit',
  at: at(1),
  reviewer: 'verifier',
  specHash: hash(spec),
  approved: true,
  findings: 'Observable construction',
  evidence: ['spec-audit.json'],
};
const begin = {
  kind: 'start',
  at: at(2),
  package: 'orbit',
  defect: 'Detached eyelid ring',
  ownedPaths: ['source.blend'],
  interfaces: 'Eye and head weights',
  acceptance: spec,
  estimate: { minutes: 20, credits: 200, basis: 'Construction and changed-byte review' },
};
const usage = (minute: number) => ({
  kind: 'usage',
  at: at(minute),
  through: at(minute),
  credits: 100,
  coverage: 'complete',
  source: 'usage.json',
});
const reject = (minute: number) => ({
  kind: 'prototype-rejection',
  at: at(minute),
  package: 'orbit',
  reviewer: 'verifier',
  specHash: hash(spec),
  source: pin,
  views: { whole: pin, detail: pin, motion: pin },
  critique: 'Detail / detached ring',
  cause: 'Separate annulus',
  correction: 'Build a connected margin',
  successEvidence: 'Continuous lid in clay and motion',
});

await test('formal opening rejections share the original clock and stop at two failures', () => {
  const first = [init, audit, begin, reject(3), usage(3)];
  const state = evaluate(first, epoch + 3 * 60_000);
  assert.equal(state.packages[0].failures, 1);
  assert.equal(state.packages[0].minutes, 1);
  assert.equal(state.packages[0].cleared, false);
  const stopped = [...first, reject(8), usage(8)];
  const final = evaluate(stopped, epoch + 8 * 60_000);
  assert.equal(final.packages[0].minutes, 6);
  assert.equal(final.packages[0].failures, 2);
  assert.equal(final.allowed, false);
  assert.throws(() => handoff(stopped, 'author', epoch + 8 * 60_000), /failed revision cap/);
});

await test('rejections require review authority, current criteria and complete view pins', () => {
  const base = [init, audit, begin];
  for (const changed of [
    { reviewer: 'author' },
    { specHash: hash('other spec') },
    { views: { whole: pin, detail: pin } },
    { cause: '' },
    { package: 'other' },
  ])
    assert.throws(() => evaluate([...base, { ...reject(3), ...changed }], epoch + 3 * 60_000));
  assert.throws(
    () =>
      evaluate(
        [
          { ...init, version: 1, limits: undefined, reserve: undefined },
          audit,
          { ...begin, estimate: undefined },
          reject(3),
        ],
        epoch + 3 * 60_000,
      ),
    /v2 or v3/,
  );
  const reviewed = {
    kind: 'review',
    at: at(3),
    package: 'orbit',
    reviewer: 'verifier',
    specHash: hash(spec),
    candidate: pin,
    verdict: 'fail',
    evidence: ['clay.png'],
    critique: 'Failed candidate',
  };
  assert.throws(
    () => evaluate([...base, reviewed, reject(4)], epoch + 4 * 60_000),
    /precede proof/,
  );
});

await test('persisted rejection pins are checked before adding a failure receipt', async () => {
  const directory = await realpath(await mkdtemp(resolve(tmpdir(), 'prototype-rejection-')));
  try {
    const source = resolve(directory, 'source.blend');
    await writeFile(source, 'frozen construction');
    const artifact = { path: source, sha256: hash(await readFile(source, 'utf8')) };
    const ledger = resolve(directory, 'ledger');
    const now = Date.now();
    const stamp = (offset: number) => new Date(now + offset).toISOString();
    await initialize(ledger, { ...init, at: stamp(-6000), baseline: [artifact] });
    await record(ledger, { ...audit, at: stamp(-5000) });
    await record(ledger, { ...usage(0), at: stamp(-4000), through: stamp(-4000) });
    await record(ledger, { ...begin, at: stamp(-3000) });
    const event = {
      ...reject(0),
      at: stamp(-2000),
      source: artifact,
      views: { whole: artifact, detail: artifact, motion: artifact },
    };
    await record(ledger, event);
    assert.equal(evaluate((await load(ledger)).values).packages[0].failures, 1);
    await writeFile(source, 'changed construction');
    await assert.rejects(record(ledger, { ...event, at: stamp(-1000) }), /Artifact pin changed/);
    assert.equal((await load(ledger)).values.length, 5);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
