import { expect, test } from 'vitest';
import { recordEpisode, auditRollout, digest, parseRollout } from './rollout';
import { runEpisode } from './benchmark';
import { createPolicy } from './policy';
import { createPlayback } from '../application/playback';

const options = {
  seed: 'rollout-knowledge',
  weapon: 'bow' as const,
  control: 'heavy' as const,
  maxTicks: 80,
  maxActions: 50,
};

test('recording preserves executed play, original delayed knowledge and packed replay decision boundaries', async () => {
  const rollout = await recordEpisode(options);
  const baseline = runEpisode(options);
  expect(rollout.episode).toEqual(baseline);
  expect(await auditRollout(parseRollout(JSON.stringify(rollout)))).toMatchObject({
    replay: 'passed',
    integrity: 'passed',
    inputs: 'passed',
    decisions: 'passed',
    firstMismatch: null,
  });
  const playback = createPlayback(rollout.replay);
  for (const row of rollout.decisions) {
    const before = playback.seekUnit(row.before);
    expect(before.state.tick).toBe(row.input.perception.decisionTick);
    expect(playback.seekUnit(row.after).state.tick).toBe(
      row.timing?.nextDecisionTick ?? before.state.tick,
    );
    expect(row.input).not.toHaveProperty('seed');
    expect(row.input.player).not.toHaveProperty('dashCooldown');
  }
  expect(rollout.decisions.some((r) => r.input.perception.ageTicks === 3)).toBe(true);
  const last = rollout.decisions.at(-1)!;
  expect(last.timing?.deliveryTick).toBeNull();
  expect(last.after - last.before).toBeLessThanOrEqual(last.timing!.requestedDelayTicks);
});

test('a rehashed hidden-information leak fails the knowledge audit while the legal replay remains valid', async () => {
  const rollout = await recordEpisode(options);
  Object.assign(rollout.decisions[1].input.player, { dashCooldown: 123 });
  rollout.decisions[1].inputDigest = await digest(rollout.decisions[1].input);
  const { digest: originalDigest, ...data } = rollout;
  expect(originalDigest).toHaveLength(64);
  rollout.digest = await digest(data);
  expect(await auditRollout(rollout)).toMatchObject({
    replay: 'passed',
    integrity: 'passed',
    inputs: 'failed',
    firstMismatch: {
      decision: 1,
      message:
        'Recorded knowledge differs from the permitted controller observation. $.player.dashCooldown: recorded 123, reconstructed undefined',
    },
  });
});

test('truncated traces, mismatched results and byte tampering are reported rather than repaired', async () => {
  const rollout = await recordEpisode(options);
  rollout.decisions.pop();
  const audit = await auditRollout(rollout);
  expect(audit.integrity).toBe('failed');
  expect(audit.replay).toBe('failed');
  rollout.episode.score++;
  expect((await auditRollout(rollout)).replay).toBe('failed');
  expect(() => parseRollout(rollout.replay)).toThrow('no recorded policy knowledge');
});

test('custom policy factories reset per episode and exceptions/rejections stay reviewable', async () => {
  let factories = 0;
  const player = {
    id: 'developer-example',
    version: 'example-1',
    create() {
      factories++;
      let calls = 0;
      const base = createPolicy('quick');
      return (input: Parameters<typeof base>[0]) => {
        if (++calls === 3) throw new Error('example failure');
        return base(input);
      };
    },
  };
  const first = await recordEpisode({ ...options, player });
  expect(first.episode.status).toBe('error');
  expect(first.decisions.at(-1)).toMatchObject({
    command: null,
    accepted: false,
    error: 'example failure',
  });
  expect(await recordEpisode({ ...options, player })).toEqual(first);
  expect(factories).toBe(2);
  expect(await auditRollout(first)).toMatchObject({
    replay: 'passed',
    inputs: 'passed',
    decisions: 'unavailable',
  });
  expect(await auditRollout(first, player)).toMatchObject({
    replay: 'passed',
    inputs: 'passed',
    decisions: 'passed',
  });
  const rejected = await recordEpisode({
    ...options,
    player: {
      id: 'rejected-example',
      version: '1',
      create: () => () => ({
        command: { type: 'buy', item: 'heart' },
        work: { total: 0, entities: 0, geometry: 0, candidates: 0 },
      }),
    },
  });
  expect(rejected.decisions[0]).toMatchObject({ before: 1, after: 1, accepted: false });
  expect((await auditRollout(rejected)).replay).toBe('passed');
  const emptyError = await recordEpisode({
    ...options,
    player: {
      id: 'empty-error',
      version: '1',
      create: () => () => {
        throw new Error('');
      },
    },
  });
  expect(emptyError.episode.status).toBe('error');
  expect((await auditRollout(emptyError)).replay).toBe('passed');
});

test('browser tolerance is explicit and never permits extra fields or altered decision clocks', async () => {
  const rollout = await recordEpisode(options);
  rollout.decisions[1].input.player.x += 1e-12;
  rollout.decisions[1].inputDigest = await digest(rollout.decisions[1].input);
  const reseal = async () => {
    const data = {
      schema: rollout.schema,
      episode: rollout.episode,
      replay: rollout.replay,
      decisions: rollout.decisions,
      provenance: rollout.provenance,
    };
    rollout.digest = await digest(data);
  };
  await reseal();
  expect((await auditRollout(rollout)).inputs).toBe('failed');
  const tolerant = await auditRollout(rollout, undefined, { continuousTolerance: 1e-10 });
  expect(tolerant.inputs).toBe('passed');
  expect(tolerant.numericDrift.count).toBeGreaterThan(0);
  rollout.decisions[1].input.perception.decisionTick++;
  rollout.decisions[1].inputDigest = await digest(rollout.decisions[1].input);
  await reseal();
  expect((await auditRollout(rollout, undefined, { continuousTolerance: 1e-10 })).inputs).toBe(
    'failed',
  );
});

test('rehashing cannot claim a stricter action budget than the recorded attempt followed', async () => {
  const rollout = await recordEpisode({ ...options, maxActions: 5, maxTicks: 1000 });
  expect(rollout.episode.actions).toBe(5);
  rollout.episode.budgets.maxActions = 1;
  const { digest: originalDigest, ...data } = rollout;
  expect(originalDigest).toHaveLength(64);
  rollout.digest = await digest(data);
  const audit = await auditRollout(rollout);
  expect(audit.integrity).toBe('passed');
  expect(audit.replay).toBe('failed');
  expect(audit.firstMismatch?.decision).toBe(0);
  expect(audit.firstMismatch?.message).toContain('budget');
  expect(audit.inputs).toBe('unavailable');
  expect(audit.decisions).toBe('unavailable');
});

test('malformed custom returns and factory exceptions retain the attempted input and reproduce as errors', async () => {
  const malformed: unknown[] = [
    null,
    { command: null, work: { total: 0, entities: 0, candidates: 0, geometry: 0 } },
    { command: { type: 'retire' } },
  ];
  for (const raw of malformed) {
    const player = {
      id: 'malformed-output',
      version: '1',
      create: () => () => raw as ReturnType<ReturnType<typeof createPolicy>>,
    };
    const rollout = await recordEpisode({ ...options, player });
    expect(rollout.episode).toMatchObject({ status: 'error', actions: 1 });
    expect(rollout.decisions).toHaveLength(1);
    expect(rollout.decisions[0]).toMatchObject({
      before: 1,
      after: 1,
      failureStage: 'output',
      rawOutput: raw,
      accepted: false,
    });
    expect(await auditRollout(parseRollout(JSON.stringify(rollout)), player)).toMatchObject({
      replay: 'passed',
      integrity: 'passed',
      inputs: 'passed',
      decisions: 'passed',
    });
  }
  const player = {
    id: 'factory-error',
    version: '1',
    create: () => {
      throw new Error('factory failed');
    },
  };
  const rollout = await recordEpisode({ ...options, player });
  expect(rollout.episode).toMatchObject({ status: 'error', actions: 1, error: 'factory failed' });
  expect(rollout.decisions[0]).toMatchObject({
    failureStage: 'factory',
    command: null,
    before: 1,
    after: 1,
  });
  expect(await auditRollout(parseRollout(JSON.stringify(rollout)), player)).toMatchObject({
    replay: 'passed',
    decisions: 'passed',
  });
});
