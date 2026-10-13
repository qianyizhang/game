import { API_VERSION, createAgent } from '../application/agent';
import { CONTENT_VERSION } from '../domain/content';
import { RULES_VERSION } from '../domain/game';
import type { RuneId, WeaponId } from '../domain/types';
import { baselineCommand, PLAYER_VERSION, playerConfig, type PlayerConfig } from './player';

export const BENCHMARK_VERSION = 'night-passage-benchmark-1';
export const BENCHMARK_SUITES = {
  training: {
    id: 'night-passage-training-1',
    seeds: ['passage-verification', 'a-light-in-the-dark', 'gods-and-runes'],
  },
  'held-out': {
    id: 'night-passage-held-out-1',
    seeds: ['passage-holdout-lantern-01', 'passage-holdout-ferry-02', 'passage-holdout-dawn-03'],
  },
} as const;
export const BENCHMARK_WEAPONS: readonly WeaponId[] = ['sword', 'spear', 'shield', 'bow', 'fists'];
export const DEFAULT_BUDGETS = Object.freeze({ maxActions: 20_000, maxTicks: 120_000 });
const RUNES: readonly RuneId[] = ['vigor', 'fleet'];

export interface EpisodeOptions {
  seed: string;
  weapon: WeaponId;
  maxActions?: number;
  maxTicks?: number;
  config?: Partial<PlayerConfig>;
  includeReplay?: boolean;
}
export interface EpisodeResult {
  seed: string;
  weapon: WeaponId;
  status: 'won' | 'lost' | 'timeout' | 'error';
  score: number;
  elapsedTicks: number;
  actions: number;
  combatClears: number;
  region: number;
  chamber: number;
  hp: number;
  error: string | null;
  versions: {
    benchmark: string;
    engine: string;
    rules: string;
    content: string;
    api: string;
    score: string;
  };
  config: PlayerConfig;
  budgets: { maxActions: number; maxTicks: number };
  profile: 'fresh';
  runes: RuneId[];
  replay?: string;
}
function budgets(
  options: Pick<EpisodeOptions, 'maxActions' | 'maxTicks'>,
): EpisodeResult['budgets'] {
  const result = {
    maxActions: options.maxActions ?? DEFAULT_BUDGETS.maxActions,
    maxTicks: options.maxTicks ?? DEFAULT_BUDGETS.maxTicks,
  };
  if (
    !Number.isSafeInteger(result.maxActions) ||
    result.maxActions < 1 ||
    !Number.isSafeInteger(result.maxTicks) ||
    result.maxTicks < 1
  )
    throw new Error('Episode budgets must be positive safe integers.');
  return result;
}

/** One fresh-profile attempt, using only accepted commands through the agent boundary. */
export function runEpisode(options: EpisodeOptions): EpisodeResult {
  const config = playerConfig(options.config);
  const limits = budgets(options);
  const agent = createAgent(options.seed);
  let observation = agent.observe();
  let actions = 0;
  let error: string | null = null;
  try {
    const started = agent.step({ type: 'start', weapon: options.weapon, runes: [...RUNES] });
    observation = started.observation;
    if (!started.accepted) throw new Error(started.error ?? 'Start was rejected.');
    actions++;
    while (
      observation.phase !== 'won' &&
      observation.phase !== 'lost' &&
      actions < limits.maxActions &&
      observation.tick < limits.maxTicks
    ) {
      const command = baselineCommand(observation, config);
      if (command.type === 'frame')
        command.ticks = Math.min(command.ticks, limits.maxTicks - observation.tick);
      const next = agent.step(command);
      observation = next.observation;
      if (!next.accepted) throw new Error(next.error ?? 'Player command was rejected.');
      actions++;
    }
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }
  return {
    seed: options.seed,
    weapon: options.weapon,
    status: error
      ? 'error'
      : observation.phase === 'won'
        ? 'won'
        : observation.phase === 'lost'
          ? 'lost'
          : 'timeout',
    score: observation.score.value,
    elapsedTicks: observation.tick,
    actions,
    combatClears: observation.score.combatClears,
    region: observation.region,
    chamber: observation.chamber,
    hp: observation.player.hp,
    error,
    versions: {
      benchmark: BENCHMARK_VERSION,
      engine: PLAYER_VERSION,
      rules: RULES_VERSION,
      content: CONTENT_VERSION,
      api: API_VERSION,
      score: observation.score.version,
    },
    config,
    budgets: limits,
    profile: 'fresh',
    runes: [...RUNES],
    ...(options.includeReplay ? { replay: agent.exportReplay() } : {}),
  };
}

export interface BenchmarkOptions extends Pick<
  EpisodeOptions,
  'config' | 'maxActions' | 'maxTicks'
> {
  suite?: keyof typeof BENCHMARK_SUITES;
}
export interface BenchmarkReport {
  suite: string;
  versions: EpisodeResult['versions'];
  config: PlayerConfig;
  budgets: EpisodeResult['budgets'];
  profile: 'fresh';
  runes: RuneId[];
  seeds: readonly string[];
  weapons: readonly WeaponId[];
  ranking: readonly ['wins', 'meanScore', 'medianWinTicks'];
  summary: {
    episodes: number;
    wins: number;
    losses: number;
    timeouts: number;
    errors: number;
    meanScore: number;
    medianWinTicks: number | null;
  };
  episodes: Pick<
    EpisodeResult,
    | 'seed'
    | 'weapon'
    | 'status'
    | 'score'
    | 'elapsedTicks'
    | 'actions'
    | 'combatClears'
    | 'region'
    | 'chamber'
    | 'hp'
    | 'error'
  >[];
}

/** Freeze a candidate on training seeds before inspecting this suite's held-out results. */
export function runBenchmark(options: BenchmarkOptions = {}): BenchmarkReport {
  const suite = BENCHMARK_SUITES[options.suite ?? 'training'];
  const config = playerConfig(options.config);
  const limits = budgets(options);
  const episodes = BENCHMARK_WEAPONS.flatMap((weapon) =>
    suite.seeds.map((seed) => runEpisode({ seed, weapon, config, ...limits })),
  );
  const winTicks = episodes
    .filter((episode) => episode.status === 'won')
    .map((episode) => episode.elapsedTicks)
    .sort((a, b) => a - b);
  const middle = Math.floor(winTicks.length / 2);
  return {
    suite: suite.id,
    versions: episodes[0].versions,
    config,
    budgets: limits,
    profile: 'fresh',
    runes: [...RUNES],
    seeds: [...suite.seeds],
    weapons: [...BENCHMARK_WEAPONS],
    ranking: ['wins', 'meanScore', 'medianWinTicks'],
    summary: {
      episodes: episodes.length,
      wins: winTicks.length,
      losses: episodes.filter((episode) => episode.status === 'lost').length,
      timeouts: episodes.filter((episode) => episode.status === 'timeout').length,
      errors: episodes.filter((episode) => episode.status === 'error').length,
      meanScore: episodes.reduce((total, episode) => total + episode.score, 0) / episodes.length,
      medianWinTicks: winTicks.length
        ? winTicks.length % 2
          ? winTicks[middle]
          : (winTicks[middle - 1] + winTicks[middle]) / 2
        : null,
    },
    episodes: episodes.map(
      ({
        seed,
        weapon,
        status,
        score,
        elapsedTicks,
        actions,
        combatClears,
        region,
        chamber,
        hp,
        error,
      }) => ({
        seed,
        weapon,
        status,
        score,
        elapsedTicks,
        actions,
        combatClears,
        region,
        chamber,
        hp,
        error,
      }),
    ),
  };
}
