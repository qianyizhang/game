import { API_VERSION, createAgent } from '../application/agent';
import {
  createController,
  CONTROL_VERSION,
  type ControlPreset,
  type ControlConfig,
  type ControlMetrics,
  type ControlTrace,
} from '../application/control';
import { RULES_VERSION, type RulesVersion, type Difficulty } from '../domain/contracts';
import { createPolicy, POLICY_VERSION, type Policy } from './policy';
import type { RuneId, WeaponId } from '../domain/types';
import { baselineCommand, PLAYER_VERSION, playerConfig, type PlayerConfig } from './player';

export const BENCHMARK_VERSION = 'night-passage-benchmark-2';
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
  rules?: RulesVersion;
  difficulty?: Difficulty;
  control?: ControlPreset | 'exact';
  controlConfig?: Partial<ControlConfig>;
  policy?: Policy;
  includeTrace?: boolean;
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
  difficulty: Difficulty;
  policy: Policy | 'baseline';
  control: ControlPreset | 'exact';
  controlConfig?: ControlConfig;
  controlMetrics?: ControlMetrics;
  trace?: ControlTrace[];
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
  const config = playerConfig(
    options.control && options.control !== 'exact'
      ? { decisionTicks: 1, ...options.config }
      : options.config,
  );
  if (
    options.rules === 'night-passage-4' &&
    options.difficulty &&
    options.difficulty !== 'standard'
  )
    throw new Error('Legacy rules require Standard difficulty.');
  const limits = budgets(options);
  if (options.control && options.control !== 'exact')
    return controlledEpisode(options, config, limits);
  const agent = createAgent(options.seed, options.rules);
  let observation = agent.observe();
  let actions = 0;
  let error: string | null = null;
  try {
    const started = agent.step({
      type: 'start',
      weapon: options.weapon,
      runes: [...RUNES],
      ...(options.rules !== 'night-passage-4'
        ? { difficulty: options.difficulty ?? 'standard' }
        : {}),
    });
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
    difficulty: options.difficulty ?? 'standard',
    policy: 'baseline',
    control: 'exact',
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
      rules: observation.rulesVersion,
      content: observation.contentVersion,
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
  | 'config'
  | 'maxActions'
  | 'maxTicks'
  | 'rules'
  | 'difficulty'
  | 'control'
  | 'controlConfig'
  | 'policy'
> {
  suite?: keyof typeof BENCHMARK_SUITES;
}
export interface BenchmarkReport {
  suite: string;
  difficulty: Difficulty;
  control: ControlPreset | 'exact';
  policy: Policy | 'baseline';
  controlConfig?: ControlConfig;
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
  const config = playerConfig(
    options.control && options.control !== 'exact'
      ? { decisionTicks: 1, ...options.config }
      : options.config,
  );
  const limits = budgets(options);
  const episodes = BENCHMARK_WEAPONS.flatMap((weapon) =>
    suite.seeds.map((seed) => runEpisode({ ...options, seed, weapon, config, ...limits })),
  );
  const winTicks = episodes
    .filter((episode) => episode.status === 'won')
    .map((episode) => episode.elapsedTicks)
    .sort((a, b) => a - b);
  const middle = Math.floor(winTicks.length / 2);
  return {
    suite: suite.id,
    difficulty: episodes[0].difficulty,
    control: episodes[0].control,
    policy: episodes[0].policy,
    ...(episodes[0].controlConfig ? { controlConfig: episodes[0].controlConfig } : {}),
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

function controlledEpisode(
  options: EpisodeOptions,
  config: PlayerConfig,
  limits: EpisodeResult['budgets'],
): EpisodeResult {
  const control = options.control as ControlPreset;
  const policy = options.policy ?? 'balanced';
  const agent = createController(options.seed, {
    rules: options.rules ?? RULES_VERSION,
    preset: control,
    config: options.controlConfig,
  });
  const decide = createPolicy(policy, config);
  let actions = 0,
    error: string | null = null;
  try {
    const start = agent.step({
      type: 'start',
      weapon: options.weapon,
      runes: [...RUNES],
      ...(options.rules !== 'night-passage-4'
        ? { difficulty: options.difficulty ?? 'standard' }
        : {}),
    });
    if (!start.accepted) throw new Error(start.error ?? 'Start rejected.');
    actions++;
    while (actions < limits.maxActions) {
      const current = agent.result();
      if (current.tick >= limits.maxTicks || ['won', 'lost'].includes(current.phase)) break;
      const decision = decide(agent.observe());
      const result = agent.step(
        decision.command,
        decision.work.total,
        limits.maxTicks - current.tick,
      );
      if (!result.accepted) throw new Error(result.error ?? 'Control rejected.');
      actions++;
    }
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }
  const observation = agent.result();
  return {
    seed: options.seed,
    weapon: options.weapon,
    difficulty: observation.difficulty,
    policy,
    control,
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
      engine: POLICY_VERSION,
      rules: observation.rulesVersion,
      content: observation.contentVersion,
      api: CONTROL_VERSION,
      score: observation.score.version,
    },
    config,
    budgets: limits,
    profile: 'fresh',
    runes: [...RUNES],
    controlConfig: agent.config,
    controlMetrics: agent.metrics(),
    ...(options.includeReplay ? { replay: agent.exportReplay() } : {}),
    ...(options.includeTrace ? { trace: agent.trace() } : {}),
  };
}
