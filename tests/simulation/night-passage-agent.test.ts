import { expect, test } from 'vitest';
import {
  BENCHMARK_SUITES,
  BENCHMARK_WEAPONS,
  runEpisode,
} from '../../src/games/night-passage/agent/benchmark';

test.each(
  BENCHMARK_WEAPONS.flatMap((weapon) =>
    BENCHMARK_SUITES.training.seeds.map((seed) => ({ weapon, seed })),
  ),
)(
  'observation-only Night Passage baseline escapes with $weapon on $seed',
  ({ weapon, seed }) => {
    const episode = runEpisode({ weapon, seed });
    expect(episode, JSON.stringify(episode)).toMatchObject({
      status: 'won',
      region: 3,
      error: null,
      profile: 'fresh',
    });
    expect(episode.score).toBe(10_000 + episode.combatClears * 100);
    expect(episode.combatClears).toBeGreaterThanOrEqual(4);
    expect(episode.elapsedTicks).toBeLessThanOrEqual(episode.budgets.maxTicks);
    expect(episode.actions).toBeLessThanOrEqual(episode.budgets.maxActions);
  },
  30_000,
);
