import { expect, it } from 'vitest';
import type { Json } from '../../../shared/policy/types';
import { compareScores } from '../../../shared/policy/scoring';
import { exportSession, importSession } from '../application/session';
import { adapter, builtins, study, type EpisodeState } from './adapter';

const seed = 'CARTOGRAPHER-STRENGTH-3-DEV-01';
function play(difficulty: string, policy: 'immediate' | 'survival'): EpisodeState {
  let state = adapter.create(seed, { difficulty });
  const choose = builtins[policy].create({
    setup: { difficulty },
    options: {},
    policySeed: 'SCORE-REGRESSION-1',
  });
  for (let step = 0; step < 2000 && !adapter.terminal(state); step++) {
    const result = adapter.act(state, choose(adapter.observe(state)).command);
    expect(result.error).toBeUndefined();
    state = result.state;
  }
  return state;
}
function score(state: EpisodeState): number[] {
  const value = adapter.metrics(state).score;
  if (!Array.isArray(value) || !value.every((item): item is number => typeof item === 'number'))
    throw new Error('Expected numeric Cartographer score vector.');
  return value;
}

it('ranks native victories before failed/partial runs, then declared health and command efficiency', () => {
  const definition = study.score;
  if (!definition) throw new Error('Missing score definition.');
  expect(adapter.identity.score).toBe('cartographer-performance-2');
  const partial = adapter.create(seed, { difficulty: 'relaxed' });
  const failed = play('severe', 'immediate');
  const fast = play('relaxed', 'immediate');
  const safe = play('relaxed', 'survival');
  expect(failed.session.state.status).toBe('lost');
  expect(score(failed)).toEqual([0, 4, 0, 0]);
  expect(score(partial)).toEqual([0, 1, 0, 0]);
  expect(compareScores(definition, score(failed), score(partial))).toBe(1);
  expect(fast.session.state.status).toBe('won');
  expect(safe.session.state.status).toBe('won');
  expect(score(fast).slice(0, 3)).toEqual([1, 9, 26 / 48]);
  expect(score(safe).slice(0, 3)).toEqual([1, 9, 1]);
  expect(compareScores(definition, score(fast), score(failed))).toBe(1);
  expect(compareScores(definition, score(safe), score(fast))).toBe(1);
  expect(fast.session.replay.commands.length).toBeLessThan(safe.session.replay.commands.length);
  const before = exportSession(safe.session);
  score(safe);
  expect(exportSession(safe.session)).toBe(before);
  expect(adapter.restore(adapter.replay(safe)).session).toEqual(safe.session);
});

// Zero-turn draft cancellation can be repeated without changing the world. Counting
// only native turns would fail to penalize this loop despite identical winning state.
it('counts zero-turn accepted commands without changing native replay meaning or state', () => {
  const definition = study.score;
  if (!definition) throw new Error('Missing score definition.');
  const original = play('relaxed', 'survival');
  const commands = original.session.replay.commands;
  const index = commands.findIndex((command) => command.type === 'explore');
  const explore = commands[index];
  expect(explore.type).toBe('explore');
  const slower = importSession(
    JSON.stringify({
      ...original.session.replay,
      commands: [
        ...commands.slice(0, index + 1),
        { type: 'cancel-draft' },
        explore,
        ...commands.slice(index + 1),
      ],
    }),
  );
  expect(slower.state).toEqual(original.session.state);
  expect(slower.state.turn).toBe(original.session.state.turn);
  expect(slower.replay.commands.length).toBe(commands.length + 2);
  const restored = adapter.restore(JSON.parse(exportSession(slower)) as Json);
  expect(score(restored)).toEqual([1, 9, 1, commands.length + 2]);
  expect(compareScores(definition, score(original), score(restored))).toBe(1);
  expect(importSession(exportSession(slower))).toEqual(slower);
});
