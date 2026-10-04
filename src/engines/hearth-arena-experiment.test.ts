import { expect, it } from 'vitest';
import {
  ARENA_CONDITIONS,
  compareArenaEpisodes,
  runArenaEpisode,
  type ArenaReport,
} from './hearth-arena-experiment';
import {
  mixedRivalsConfig,
  type RivalStyle,
  type StyleVisibility,
} from '../games/battlegrounds/domain/arena';

function block(seed: string): ArenaReport[] {
  return Array.from({ length: 8 }, (_, seat) =>
    ARENA_CONDITIONS.map((condition) => {
      const [style, visibility] = condition.split('/') as [RivalStyle, StyleVisibility];
      const config = mixedRivalsConfig(seed, 'forgekeeper', visibility);
      config.visibilitySeat = seat;
      config.seats[seat].style = style;
      // Synthetic statistics fixture; every row has eight valid placements.
      const placements = Array.from({ length: 8 }, (_, i) => ((i - seat + 8) % 8) + 1);
      if (style === 'baseline-v1') [placements[seat], placements[(seat + 2) % 8]] = [3, 1];
      return {
        seed,
        focalSeat: seat,
        config,
        status: 'complete' as const,
        placements,
        survivalRounds: Array(8).fill(10),
        rounds: 10,
        commands: 1,
        decisionMs: 0,
        replayVerified: true,
        replay: JSON.stringify({ content: [], commands: [{ type: 'configure', config }] }),
      };
    }),
  ).flat();
}
it('compares matched seat rotations and computes uncertainty across seed blocks', () => {
  const comparison = compareArenaEpisodes([...block('A'), ...block('B')]);
  expect(comparison.includedLobbies).toBe(64);
  expect(comparison.hiddenImprovement).toEqual({
    mean: 2,
    standardErrorAcrossSeedBlocks: 0,
    seedBlocks: 2,
  });
  expect(comparison.tempoDisclosureImprovement.mean).toBe(0);
  expect(comparison.conditions[0]).toMatchObject({ lobbies: 16, meanPlacement: 3, topFour: 16 });
});
it('excludes the whole block for missing, duplicate, failed, mismatched or leaking runs', () => {
  const valid = block('A');
  const cases = [
    valid.slice(1),
    [...valid.slice(1), valid[1]],
    structuredClone(valid),
    structuredClone(valid),
    structuredClone(valid),
  ];
  cases[2][0].status = 'limit';
  cases[3][0].config.seats[7].hero =
    cases[3][0].config.seats[7].hero === 'oathkeeper' ? 'archivist' : 'oathkeeper';
  cases[4][1].replay = JSON.stringify({ content: [], commands: [{}, { type: 'nextRound' }] });
  for (const rows of cases) {
    const comparison = compareArenaEpisodes(rows);
    expect(comparison.includedLobbies).toBe(0);
    expect(comparison.excluded).toHaveLength(1);
    expect(comparison.hiddenImprovement.mean).toBeNull();
  }
});
it('preserves limited episodes and does not count them as completed evidence', () => {
  const result = runArenaEpisode('LIMIT', mixedRivalsConfig('LIMIT', 'forgekeeper'), 0, {
    maxCommands: 2,
  });
  expect(result.status).toBe('limit');
  expect(result.commands).toBe(2);
  expect(result.replayVerified).toBe(true);
});
