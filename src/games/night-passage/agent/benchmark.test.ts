import { expect, test } from 'vitest';
import { observeChronicle } from '../application/agent';
import { restoreChronicle } from '../application/chronicle';
import { runBenchmark, runEpisode } from './benchmark';
import { baselineCommand } from './player';

test('a bounded attempt is deterministic, stays within both budgets and exports a replay of its result', () => {
  const options = {
    seed: 'bounded-passage',
    weapon: 'sword' as const,
    maxActions: 50,
    maxTicks: 17,
    includeReplay: true,
  };
  const first = runEpisode(options);
  expect(first).toEqual(runEpisode(options));
  expect(first.status, JSON.stringify(first)).toBe('timeout');
  expect(first.elapsedTicks).toBe(17);
  expect(first.actions).toBeLessThanOrEqual(50);
  const observation = observeChronicle(restoreChronicle(first.replay!));
  expect(observation.tick).toBe(first.elapsedTicks);
  expect(observation.score.value).toBe(first.score);
  expect(observation.player.hp).toBe(first.hp);
  const before = structuredClone(observation);
  baselineCommand(observation);
  expect(observation).toEqual(before);
  const oneAction = runEpisode({ ...options, maxActions: 1 });
  expect(oneAction).toMatchObject({ status: 'timeout', actions: 1, elapsedTicks: 0 });
});

test('benchmark failures cannot masquerade as wins or timing improvements', () => {
  const report = runBenchmark({ maxActions: 1 });
  expect(report.summary).toEqual({
    episodes: 15,
    wins: 0,
    losses: 0,
    timeouts: 15,
    errors: 0,
    meanScore: 0,
    medianWinTicks: null,
  });
  expect(report.episodes).toHaveLength(15);
  expect(new Set(report.episodes.map((episode) => `${episode.seed}/${episode.weapon}`)).size).toBe(
    15,
  );
  expect(() => runEpisode({ seed: 'invalid-budget', weapon: 'bow', maxTicks: NaN })).toThrow(
    'budgets',
  );
  expect(() =>
    runEpisode({ seed: 'invalid-config', weapon: 'bow', config: { decisionTicks: 0 } }),
  ).toThrow('configuration');
});
