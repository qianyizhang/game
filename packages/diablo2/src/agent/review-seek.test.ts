import { expect, it } from 'vitest';
import type { Json } from '../../../../src/shared/policy/types';
import { recordEpisode } from '../../../../src/shared/policy/rollout';
import exposure from '../../../../tests/fixtures/emberwake-exposure';
import history from '../../../../tests/fixtures/emberwake-v2-continuity.json';
import { dispatch, newSession, exportSession } from '../application/session';
import { adapter, at, cursor } from './adapter';
import { createReviewSeeker } from './review-seek';

it('cached forward/backward and split-advance seeks match independent native reconstruction, including old versions', () => {
  let session = newSession('REVIEW-CHECKPOINT', 'barbarian');
  for (let i = 0; i < 260; i++) session = dispatch(session, { type: 'advance', ticks: 50 }).session;
  const replay = JSON.parse(exportSession(session)) as Json;
  const seek = createReviewSeeker();
  const full = adapter.restore(replay);
  for (const point of [0, 6401, 12999, 1, cursor(session), 6400, 49, 12750]) {
    const expected = at(full, point).session;
    expect(seek(replay, point)).toEqual(expected);
  }
  expect(() => seek(replay, -1)).toThrow('cursor');
  expect(() => seek(replay, cursor(session) + 1)).toThrow('cursor');
  const sandbox = JSON.parse(
    exportSession(newSession('SANDBOX', 'barbarian', undefined, true)),
  ) as Json;
  expect(() => seek(sandbox, 0)).toThrow('outside the campaign');
  (replay as Record<string, Json>).seed = 'CHANGED-REPLAY-BYTES';
  expect(seek(replay, 0).state.seed).toBe('CHANGED-REPLAY-BYTES');
  const legacy = history.cases[0].replay as unknown as Json;
  const old = adapter.restore(legacy);
  for (const point of [0, 10, adapter.cursor(old), 1])
    expect(seek(legacy, point)).toEqual(at(old, point).session);
});

it('preserves first-death padding and original retained knowledge independently of cached views', async () => {
  const run = await recordEpisode(adapter, exposure, {
    seed: 'POLICY-ADOPTION-1-DEV-01',
    setup: {},
    policySeed: 'EXPOSURE',
    policyOptions: {},
    maxDecisions: 1000,
  });
  const original = JSON.stringify(run);
  const final = adapter.restore(run.replay);
  const seek = createReviewSeeker();
  const last = run.decisions.at(-1)!;
  expect(run.episode.metrics.outcome).toBe('dead');
  expect(last.after - last.before).toBeGreaterThan(1);
  for (const point of [last.after, last.before + 1, last.after - 1, last.before])
    expect(seek(run.replay, point)).toEqual(at(final, point).session);
  expect(JSON.stringify(run)).toBe(original);
});
