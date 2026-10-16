import { expect, it } from 'vitest';
import { auditRollout, parseRollout, recordEpisode } from '../../../../src/shared/policy/rollout';
import exposure from '../../../../tests/fixtures/emberwake-exposure';
import { adapter } from './adapter';

it('records and independently audits an external public policy through its first natural death', async () => {
  const run = await recordEpisode(adapter, exposure, {
    seed: 'POLICY-ADOPTION-1-DEV-01',
    setup: { hero: 'barbarian', difficulty: 'standard' },
    policySeed: 'INDEPENDENT-EXPOSURE',
    policyOptions: {},
    maxDecisions: 1000,
  });
  expect(run.episode.status).toBe('terminal');
  expect(run.episode.metrics.outcome).toBe('dead');
  expect(run.episode.metrics.hp).toBe(0);
  expect(run.decisions.every((row) => row.accepted)).toBe(true);
  const decoded = parseRollout(JSON.stringify(run));
  expect(await auditRollout(adapter, decoded, exposure)).toMatchObject({
    integrity: 'passed',
    replay: 'passed',
    inputs: 'passed',
    decisions: 'passed',
  });
  expect(await auditRollout(adapter, decoded)).toMatchObject({
    integrity: 'passed',
    replay: 'passed',
    inputs: 'passed',
    decisions: 'unavailable',
  });
  expect(
    adapter.restore(run.replay).session.replay.commands.some((c) => c.type === 'respawn'),
  ).toBe(false);
});
