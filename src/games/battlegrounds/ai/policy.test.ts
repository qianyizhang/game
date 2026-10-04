import { expect, it } from 'vitest';
import { bgSession } from '../application/session';
import { observeHearth } from '../application/agent';
import { makeUnit } from '../domain/units';
import { createHearthPolicy, searchPosition, type HearthPolicyConfig } from './policy';
import {
  compareHearthEpisodes,
  runHearthEpisode,
  type EpisodeReport,
} from '../../../engines/hearth-experiment';

const config: HearthPolicyConfig = {
  kind: 'scout-search-v1',
  hero: 'archivist',
  seed: 'INDEPENDENT-POLICY-SEED',
  samples: 4,
  maxOrders: 6,
};

it('searches with independent common samples, bounded compute and immutable observations', () => {
  const observation = observeHearth(bgSession.create('HIDDEN-ENVIRONMENT'));
  observation.phase = 'recruit';
  observation.self.board = [
    makeUnit('mother', 'mother'),
    makeUnit('rat', 'rat'),
    makeUnit('hydra', 'hydra'),
  ];
  observation.opponent = {
    playerId: 1,
    source: 'last-seen',
    seenRound: 3,
    tier: 3,
    board: [makeUnit('sentinel', 'enemy'), makeUnit('cobalt', 'enemy2')],
  };
  const before = structuredClone(observation);
  const result = searchPosition(observation, config)!;
  expect(result).toEqual(searchPosition(observation, config));
  expect(result.simulations).toBe(result.estimates.length * config.samples);
  expect(result.simulations).toBeLessThanOrEqual(config.maxOrders * config.samples);
  expect(result.estimates.every((row) => row.wins + row.ties + row.losses === config.samples)).toBe(
    true,
  );
  expect(
    result.estimates.find((row) => JSON.stringify(row.order) === JSON.stringify(result.selected))!
      .meanNetDamage,
  ).toBe(Math.max(...result.estimates.map((row) => row.meanNetDamage)));
  expect(observation).toEqual(before);
  observation.opponent = {
    playerId: 1,
    source: 'unseen',
    seenRound: null,
    tier: null,
    board: null,
  };
  expect(searchPosition(observation, config)).toBeNull();
});

it('completes legal reproducible episodes for both new heroes and both policies', () => {
  for (const hero of ['archivist', 'oathkeeper']) {
    for (const kind of ['heuristic-v1', 'scout-search-v1'] as const) {
      const settings = { ...config, hero, kind };
      const first = runHearthEpisode('POLICY-REGRESSION', settings);
      const second = runHearthEpisode('POLICY-REGRESSION', settings);
      expect(first.status, first.error).toBe('complete');
      expect(first.replayVerified).toBe(true);
      expect(first.replay).toBe(second.replay);
      expect(first.simulations).toBe(second.simulations);
      expect(first.placement).toBeGreaterThanOrEqual(1);
      expect(first.placement).toBeLessThanOrEqual(8);
    }
  }
}, 30000);

it('preserves command-limited episodes and enforces finite search budgets', () => {
  const limited = runHearthEpisode('LIMIT', config, { maxCommands: 2 });
  expect(limited.status).toBe('limit');
  expect(limited.commands).toBe(2);
  expect(limited.replayVerified).toBe(true);
  expect(() => createHearthPolicy({ ...config, samples: 0 })).toThrow('budgets');
  expect(() => createHearthPolicy({ ...config, maxOrders: Infinity })).toThrow('budgets');
});

it('retains failures and excludes incomplete, duplicate and mismatched experimental pairs', () => {
  const limited = runHearthEpisode('PAIR', config, { maxCommands: 1 });
  const base: EpisodeReport = {
    ...limited,
    status: 'complete',
    placement: 5,
    policy: { ...config, kind: 'heuristic-v1' },
  };
  const candidate: EpisodeReport = { ...base, placement: 3, policy: config };
  expect(compareHearthEpisodes([base, candidate])).toMatchObject({
    matchedPairs: 1,
    meanPlacementImprovement: 2,
    candidateBetter: 1,
    standardError: null,
  });
  expect(compareHearthEpisodes([base, limited]).excluded[0].reason).toContain('Incomplete');
  expect(compareHearthEpisodes([base, candidate, candidate]).matchedPairs).toBe(0);
  expect(
    compareHearthEpisodes([base, { ...candidate, policy: { ...config, seed: 'changed' } }])
      .excluded[0].reason,
  ).toContain('mismatch');
  const failed = runHearthEpisode('CALLBACK-FAILURE', config, {
    onDecision: () => {
      throw new Error('trace writer failed');
    },
  });
  expect(failed.status).toBe('error');
  expect(failed.error).toContain('trace writer failed');
  expect(failed.commands).toBe(1);
  expect(failed.replayVerified).toBe(true);
});
