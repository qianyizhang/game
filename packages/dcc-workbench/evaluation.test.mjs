import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluate } from './evaluation/index.ts';
import { evaluateCanid } from './subjects/canid/evaluation.ts';
import { record } from './contracts.ts';
import { readMotions } from './motion-contract.ts';

await test('motion measurements cannot approve an unreviewed rubric or hide missing evidence', () => {
  /** @type {import('./evaluation/index.ts').Criterion[]} */
  const profile = [
    {
      id: 'response',
      title: 'Response',
      dimension: 'timing',
      rationale: 'Brief requirement',
      kind: 'metric',
      metric: 'contact',
      unit: 's',
      min: 0.1,
      max: 0.4,
      basis: 'art-direction',
    },
    {
      id: 'weight',
      title: 'Weight',
      dimension: 'plausibility',
      rationale: 'Needs observation',
      kind: 'rubric',
      prompt: 'Does the subject load before moving?',
    },
  ];
  const measured = { contact: { value: 0.2, unit: 's', coverage: 'Authored contact marker' } };
  assert.deepEqual(
    evaluate(profile, measured).map((f) => f.status),
    ['pass', 'unassessed'],
  );
  assert.equal(
    evaluate(profile, { contact: { ...measured.contact, value: 1.2 } })[0].status,
    'revise',
  );
  assert.equal(
    evaluate(profile, { contact: { ...measured.contact, unit: 'frames' } })[0].status,
    'unassessed',
  );
  assert.equal(
    evaluate(profile, { contact: { ...measured.contact, value: NaN } })[0].status,
    'unassessed',
  );
  const findings = evaluate(profile, measured, [
    {
      criterion: 'weight',
      judgment: 'revise',
      reviewer: 'reviewer',
      reason: 'The chest drifts before the hind feet load.',
      evidence: ['side view at 0.2 s'],
    },
  ]);
  assert.equal(findings[1].status, 'revise');
  assert.match(findings[1].reason, /chest/);
});

await test('the canid adapter evaluates every delivered motion and catches stretched attack timing', () => {
  const receipt = record(
    JSON.parse(readFileSync(new URL('./assets/canid/refined/ash.json', import.meta.url), 'utf8')),
  );
  const report = evaluateCanid(receipt);
  assert.equal(Object.keys(report.motions).length, 10);
  for (const motion of Object.values(report.motions)) {
    assert.equal(motion.findings.find((f) => f.criterion.id === 'reference')?.status, 'unassessed');
    assert.ok(motion.measurements.duration.value > 0);
  }
  const clips = readMotions(receipt.clips);
  const bite = clips.bite;
  bite.seconds *= 3;
  for (const point of bite.trajectory) point[0] *= 3;
  for (const marker of bite.markers) marker.time *= 3;
  for (const phase of bite.contacts) {
    phase.start *= 3;
    phase.end *= 3;
  }
  const slow = evaluateCanid({ ...receipt, clips }).motions.bite;
  assert.equal(slow.findings.find((f) => f.criterion.id === 'event-latency')?.status, 'revise');
  assert.equal(slow.findings.find((f) => f.criterion.id === 'attack-drive')?.status, 'revise');
});
