import { describe, expect, it } from 'vitest';
import { adapter, builtins } from '../../games/balatro/agent/adapter';
import { auditRollout, digest, parseRollout, recordEpisode } from './rollout';
import type { PolicyFactory } from './types';
import type { Observation } from '../../games/balatro/agent/observation';
import type { Command } from '../../games/balatro/domain/types';
const options = {
  seed: 'POLICY-ADOPTION-1-DEV-01',
  setup: { difficulty: 'standard' },
  policySeed: 'POLICY-STREAM-1',
  policyOptions: {},
  maxDecisions: 2000,
};
async function rehash<T extends { digest: string }>(run: T) {
  const { digest: _old, ...payload } = run;
  void _old;
  run.digest = await digest(payload);
  return run;
}
describe('policy evidence across the ordinary Blindside boundary', () => {
  it('reconstructs a complete episode independently and catches rehashed hidden input, replay and budget lies', async () => {
    const run = await recordEpisode(adapter, builtins.immediate, options);
    const audit = await auditRollout(
      adapter,
      parseRollout(JSON.stringify(run)),
      builtins.immediate,
    );
    expect(audit).toMatchObject({
      integrity: 'passed',
      replay: 'passed',
      inputs: 'passed',
      decisions: 'passed',
    });
    expect(run.episode.status).toBe('terminal');
    const invalidRows = { ...run, decisions: [null] };
    expect(() => parseRollout(JSON.stringify(invalidRows))).toThrow('Invalid decision row');
    expect(() =>
      parseRollout(
        JSON.stringify({ ...run, episode: { ...run.episode, status: { broken: true } } }),
      ),
    ).toThrow('Invalid episode result');
    const damagedBoundary = structuredClone(run);
    damagedBoundary.decisions[0].before = -1;
    expect(() => parseRollout(JSON.stringify(damagedBoundary))).not.toThrow();
    expect((await auditRollout(adapter, run)).decisions).toBe('unavailable');
    const hidden = structuredClone(run);
    hidden.decisions[0].input = { ...(hidden.decisions[0].input as object), privateRng: 123 };
    hidden.decisions[0].inputDigest = await digest(hidden.decisions[0].input);
    await rehash(hidden);
    expect(await auditRollout(adapter, hidden, builtins.immediate)).toMatchObject({
      integrity: 'passed',
      replay: 'passed',
      inputs: 'failed',
      firstMismatch: { decision: 0, path: 'input' },
    });
    const budget = structuredClone(run);
    budget.options.maxDecisions = 1;
    await rehash(budget);
    expect(await auditRollout(adapter, budget, builtins.immediate)).toMatchObject({
      replay: 'failed',
      inputs: 'unavailable',
      decisions: 'unavailable',
    });
    const replay = structuredClone(run);
    replay.replay = null;
    await rehash(replay);
    expect((await auditRollout(adapter, replay)).replay).toBe('failed');
  });
  it('keeps historical API checks unavailable while the native replay remains usable', async () => {
    const historical = {
      ...adapter,
      identity: { ...adapter.identity, observation: 'historical-observation' },
    };
    const run = await recordEpisode(historical, builtins.immediate, options);
    const bytes = JSON.stringify(run);
    expect(adapter.metrics(adapter.restore(run.replay))).toEqual(run.episode.metrics);
    expect(await auditRollout(adapter, parseRollout(bytes), builtins.immediate)).toMatchObject({
      integrity: 'passed',
      replay: 'unavailable',
      inputs: 'unavailable',
      decisions: 'unavailable',
      firstMismatch: null,
      message: 'Game/rules/content/API identity unavailable in this runtime.',
    });
    expect(JSON.stringify(run)).toBe(bytes);
    expect(await auditRollout(historical, run, builtins.immediate)).toMatchObject({
      replay: 'passed',
      inputs: 'passed',
      decisions: 'passed',
    });
  });
  it('retains malformed output/factory errors and original input before policy mutation', async () => {
    const malformed: PolicyFactory<Observation, Command> = {
      id: 'malformed',
      version: '1',
      create: () => (input) => {
        Object.assign(input, { forbiddenMutation: true });
        return { wrong: 'retained' } as never;
      },
    };
    const run = await recordEpisode(adapter, malformed, options);
    expect(run.episode.status).toBe('error');
    expect(run.decisions[0]).toMatchObject({
      failureStage: 'output',
      output: { wrong: 'retained' },
      accepted: false,
    });
    expect(run.decisions[0].input).not.toHaveProperty('forbiddenMutation');
    expect(await auditRollout(adapter, run, malformed)).toMatchObject({
      integrity: 'passed',
      replay: 'passed',
      inputs: 'passed',
      decisions: 'passed',
    });
    const factory: PolicyFactory<Observation, Command> = {
      id: 'factory',
      version: '1',
      create: () => {
        throw new Error('');
      },
    };
    const failed = await recordEpisode(adapter, factory, options);
    expect(failed.episode.status).toBe('error');
    expect(failed.decisions[0]).toMatchObject({ failureStage: 'factory', error: '' });
    expect((await auditRollout(adapter, failed, factory)).decisions).toBe('passed');
  });
});
