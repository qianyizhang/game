import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
  checkedHandoff,
  evaluate,
  handoff,
  hash,
  initialize,
  load,
  record,
  refreshCredits,
} from './trial.ts';

const epoch = Date.parse('2026-10-08T00:00:00.000Z');
const at = (minute: number) => new Date(epoch + minute * 60_000).toISOString();
const spec =
  'Preserve protective forward weight; prove continuous shoulder/neck anatomy in clay and motion.';
const pinned = { path: 'evidence.json', sha256: '1'.repeat(64) };
const roles = {
  orchestrator: { id: 'sol-root', model: 'gpt-6.1-sol', effort: 'high' },
  director: { id: 'astra-director', model: 'gpt-6-astra', effort: 'high' },
  author: { id: 'sol-author', model: 'gpt-6.1-sol', effort: 'high' },
  verifier: { id: 'sol-verifier', model: 'gpt-6.1-sol', effort: 'high' },
};
const init = {
  kind: 'init',
  version: 3,
  at: at(0),
  trial: 'matriarch-test',
  asset: 'matriarch',
  spec,
  baseline: [pinned],
  roles,
  limits: { assetMinutes: 90, packageMinutes: 30, failedRevisions: 2, credits: 1000 },
  reserve: { minutes: 20, credits: 200 },
};
const audit = {
  kind: 'audit',
  at: at(1),
  reviewer: roles.verifier.id,
  specHash: hash(spec),
  approved: true,
  findings: 'Bounded and observable',
  evidence: ['audit.md'],
};
const estimate = {
  minutes: 20,
  credits: 450,
  basis: 'Whole package including prototype and polish',
};
const begin = {
  kind: 'start',
  at: at(2),
  package: 'neck',
  defect: 'Visible transition defect',
  ownedPaths: ['source.blend'],
  interfaces: 'Neck skin, head fittings, planted paws',
  acceptance: 'Continuous in clay and motion; editable native transition',
  estimate,
};
const directed = { package: 'neck', director: roles.director.id, specHash: hash(spec) };
const proof = {
  kind: 'prototype',
  at: at(3),
  ...directed,
  source: pinned,
  views: { whole: pinned, detail: pinned, motion: pinned },
  rationale: 'Modify the existing transition',
};
const usage = (minute: number, credits = 100) => ({
  kind: 'usage',
  at: at(minute),
  through: at(minute),
  credits,
  coverage: 'complete',
  source: 'all-role-report.json',
});
const review = (minute: number, verdict = 'clear') => ({
  kind: 'review',
  at: at(minute),
  package: 'neck',
  reviewer: roles.verifier.id,
  specHash: hash(spec),
  candidate: pinned,
  verdict,
  evidence: ['clay.png', 'motion.png'],
  critique: 'Side / shoulder root / integrate into neck',
  classification: 'structural',
  cause: 'Separate surface',
  correction: 'Rebuild transition',
  successEvidence: 'Continuous clay contour at motion extreme',
});
const direction = {
  kind: 'direction',
  at: at(5),
  ...directed,
  action: 'repair',
  diagnosis: 'Disconnected roots',
  operation: 'Integrate roots into existing surface',
  successEvidence: 'Side clay and motion extreme',
  evidence: ['diagnosis.md'],
};
const reopen = {
  kind: 'reopen',
  at: at(7),
  ...directed,
  mode: 'polish',
  rejected: false,
  reason: 'Small native surface adjustment',
  evidence: ['final-review.png'],
  estimate: { minutes: 4, credits: 100, basis: 'Polish plus changed-byte verification' },
};
const accept = {
  kind: 'acceptance',
  at: at(10),
  ...directed,
  candidate: pinned,
  review: pinned,
  verdict: 'Source and consumer meet visual and delivery gates',
};
const now = (minute: number) => epoch + minute * 60_000;

await test('v3 author waits for native proof; structural rejection routes through art direction without resetting counters', () => {
  const history = [init, audit, begin, usage(2)];
  assert.throws(() => handoff(history, 'author', now(2)), /prototype/);
  assert.match(handoff(history, 'director', now(2)), /native-construction/);
  assert.throws(
    () => evaluate([init, audit, begin, { ...proof, director: roles.orchestrator.id }], now(3)),
    /Art director/,
  );
  const proven = [init, audit, begin, proof, usage(3)];
  assert.match(handoff(proven, 'author', now(3)), /active-package/);
  const failed = [...proven, review(4, 'fail'), usage(4)];
  assert.throws(() => handoff(failed, 'author', now(4)), /diagnosis/);
  assert.match(handoff(failed, 'director', now(4)), /representation-diagnosis/);
  assert.throws(() => evaluate([...failed, review(5)], now(5)), /diagnosis/);
  const repaired = [...failed, direction, usage(5)];
  assert.match(handoff(repaired, 'author', now(5)), /active-package/);
  const state = evaluate([...repaired, review(6, 'fail')], now(6));
  assert.equal(state.packages[0].minutes, 4);
  assert.equal(state.packages[0].failures, 2);
  assert.equal(state.allowed, false);
  assert.throws(
    () => handoff([...repaired, review(6, 'fail')], 'director', now(6)),
    /failed revision cap/,
  );
});

await test('v3 formal opening rejection retains direction ownership and shares the production cap', () => {
  const rejection = {
    ...proof,
    kind: 'prototype-rejection',
    reviewer: roles.verifier.id,
    critique: 'Detail / detached orbital rim',
    cause: 'Separate annulus',
    correction: 'Integrate the margin with native skin',
    successEvidence: 'Continuous in whole clay and motion',
  };
  const rejected = [init, audit, begin, rejection, usage(3)];
  const state = evaluate(rejected, now(3));
  assert.equal(state.packages[0].owner, 'director');
  assert.equal(state.packages[0].failures, 1);
  assert.throws(() => handoff(rejected, 'author', now(3)), /prototype/);
  const proven = [...rejected, { ...proof, at: at(4) }, usage(4)];
  assert.equal(evaluate(proven, now(4)).packages[0].failures, 1);
  assert.match(handoff(proven, 'author', now(4)), /active-package/);
  assert.throws(() => evaluate([...proven, { ...rejection, at: at(5) }], now(5)), /precede proof/);
  const stopped = [...rejected, { ...rejection, at: at(4) }, usage(4)];
  assert.equal(evaluate(stopped, now(4)).packages[0].minutes, 2);
  assert.throws(() => handoff(stopped, 'director', now(4)), /failed revision cap/);
});

await test('polish retains package clock and needs fresh clearance; takeover and acceptance stay distinct from orchestration', () => {
  const cleared = [init, audit, begin, proof, review(6), usage(6)];
  assert.throws(() => handoff(cleared, 'publisher', now(6)), /acceptance/);
  const polishing = [...cleared, { ...reopen, mode: 'takeover', rejected: true }, usage(7)];
  const state = evaluate(polishing, now(7));
  assert.equal(state.packages[0].minutes, 5);
  assert.equal(state.packages[0].failures, 1);
  assert.equal(state.packages[0].takeover, true);
  assert.equal(state.packages[0].clearance, undefined);
  assert.throws(() => handoff(polishing, 'author', now(7)), /prototype/);
  assert.throws(() => evaluate([...polishing, accept], now(10)), /clearance/);
  const recleared = [...polishing, review(9)];
  assert.throws(
    () => evaluate([...recleared, { ...accept, director: roles.orchestrator.id }], now(10)),
    /Art director/,
  );
  assert.throws(
    () =>
      evaluate(
        [...recleared, { ...accept, candidate: { ...pinned, sha256: '2'.repeat(64) } }],
        now(10),
      ),
    /exact cleared/,
  );
  const accepted = [...recleared, accept, usage(10, 800)];
  assert.match(handoff(accepted, 'publisher', now(10)), /publication/);
  assert.match(handoff(accepted, 'director', now(10)), /Review-only reserve/);
  assert.throws(
    () => handoff([...cleared, reopen, usage(7, 800)], 'director', now(7)),
    /Reserved final-review/,
  );
  const changed = [
    ...accepted,
    {
      kind: 'spec',
      at: at(11),
      director: roles.director.id,
      text: `${spec} New constraint`,
      reason: 'Changed representation',
    },
  ];
  assert.throws(() => handoff(changed, 'publisher', now(11)), /audit/);
  assert.equal(evaluate(changed, now(11)).packages[0].acceptance, undefined);
  assert.throws(() => handoff([...accepted, usage(11, 1000)], 'publisher', now(11)), /credit cap/);
});

await test('CLI handoffs recheck frozen proof and accepted review bytes; ledger root is the Sol orchestrator', async () => {
  const dir = await realpath(await mkdtemp(resolve(tmpdir(), 'art-direction-')));
  try {
    const path = resolve(dir, 'evidence.json');
    const bytes = JSON.stringify({ id: 'matriarch' });
    await writeFile(path, bytes);
    const artifact = { path, sha256: hash(bytes) };
    const instant = new Date(Date.now() - 1000).toISOString();
    const ledger = resolve(dir, 'ledger');
    await initialize(ledger, { ...init, at: instant, baseline: [artifact] });
    const append = (event: Record<string, unknown>) => record(ledger, { ...event, at: instant });
    await append({ ...usage(0), through: instant });
    await append(audit);
    await append(begin);
    await assert.rejects(checkedHandoff(ledger, 'author'), /prototype/);
    await append({
      ...proof,
      source: artifact,
      views: { whole: artifact, detail: artifact, motion: artifact },
    });
    assert.match(await checkedHandoff(ledger, 'author'), /active-package/);
    await writeFile(path, 'changed');
    await assert.rejects(checkedHandoff(ledger, 'author'), /Artifact pin changed/);
    await writeFile(path, bytes);
    await append({ ...review(0), candidate: artifact });
    const reviewPath = resolve(dir, 'review.json');
    const reviewData = {
      schemaVersion: 1,
      id: 'matriarch',
      candidateDigest: artifact.sha256,
      reviewer: { role: 'parent', name: roles.orchestrator.id },
      decision: 'accepted',
      scope: 'gallery',
      evidence: [
        { view: 'side', reference: 'side.png', observation: 'Fitted', sha256: artifact.sha256 },
      ],
    };
    const saveReview = async () => {
      const value = JSON.stringify(reviewData);
      await writeFile(reviewPath, value);
      return { path: reviewPath, sha256: hash(value) };
    };
    await assert.rejects(
      append({ ...accept, candidate: artifact, review: await saveReview() }),
      /art director/,
    );
    reviewData.reviewer.name = roles.director.id;
    await append({ ...accept, candidate: artifact, review: await saveReview() });
    assert.match(await checkedHandoff(ledger, 'publisher'), /publication/);
    await writeFile(reviewPath, '{}');
    await assert.rejects(checkedHandoff(ledger, 'publisher'), /Artifact pin changed/);
    await saveReview();
    await append(reopen);
    await assert.rejects(checkedHandoff(ledger, 'publisher'), /acceptance/);
    await append({ ...review(0), candidate: artifact });
    await append({ ...usage(0, 800), through: instant });
    await assert.rejects(append(reopen), /Reserved final-review/);
    await assert.rejects(refreshCredits(ledger, roles.director.id), /orchestrator thread ID/);
    const events = (await load(ledger)).values;
    assert.equal(events.filter((e) => e.kind === 'acceptance').length, 1);
    assert.ok((await readFile(resolve(ledger, '000000.json'), 'utf8')).includes('"version": 3'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
