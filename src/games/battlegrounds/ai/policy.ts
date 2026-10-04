import { hashSeed } from '../../../shared/random';
import type { HearthFrame, HearthObservation } from '../application/agent';
import { HEROES } from '../content/minions';
import { baselineOrder, botDecision } from '../domain/bots';
import { resolveCombat } from '../domain/combat';
import { endRecruitment } from '../domain/recruitment';
import type { BGCommand, Unit } from '../domain/types';

export interface HearthPolicyConfig {
  kind: 'heuristic-v1' | 'scout-search-v1';
  hero: string;
  /** Independent policy randomness. Never pass the environment seed or RNG here. */
  seed: string;
  samples: number;
  maxOrders: number;
}
export interface OrderEstimate {
  order: string[];
  wins: number;
  ties: number;
  losses: number;
  meanDamageDealt: number;
  meanDamageTaken: number;
  meanNetDamage: number;
}
export interface PositionSearch {
  model: 'conditional-scout-board';
  source: 'last-seen' | 'ghost';
  seenRound: number | null;
  samplesPerOrder: number;
  simulations: number;
  selected: string[];
  estimates: OrderEstimate[];
}
export interface PolicyDecision {
  command: BGCommand;
  reason: 'hero' | 'next-round' | 'recruitment' | 'baseline-order' | 'sampled-order' | 'finish';
  plannedOrder?: string[];
  search?: PositionSearch;
}

/** Stable bounded neighborhood; baseline first provides a conservative deterministic tie break. */
export function candidateOrders(board: readonly Unit[], maximum: number): Unit[][] {
  const baseline = baselineOrder(board);
  const orders: Unit[][] = [];
  const seen = new Set<string>();
  const add = (order: Unit[]) => {
    const key = order.map((unit) => unit.id).join('|');
    if (!seen.has(key) && orders.length < maximum) {
      seen.add(key);
      orders.push(order);
    }
  };
  add(baseline);
  add([...board]);
  // Move each unit to each slot. These include adjacent swaps and support relocations.
  for (let from = 0; from < baseline.length; from++)
    for (let to = 0; to < baseline.length; to++) {
      if (from === to) continue;
      const order = [...baseline];
      order.splice(to, 0, order.splice(from, 1)[0]);
      add(order);
    }
  return orders;
}

export function searchPosition(
  observation: HearthObservation,
  config: HearthPolicyConfig,
): PositionSearch | null {
  validatePolicyConfig(config);
  const opponent = observation.opponent;
  if (
    !opponent ||
    opponent.source === 'unseen' ||
    !opponent.board ||
    opponent.tier === null ||
    observation.self.board.length < 2
  )
    return null;
  const estimates = candidateOrders(observation.self.board, config.maxOrders).map((order) => {
    const player = structuredClone(observation.self);
    player.board = structuredClone(order);
    // Apply the real order-dependent end-of-recruitment growth on an isolated copy.
    endRecruitment(player);
    let wins = 0,
      ties = 0,
      dealt = 0,
      taken = 0;
    for (let sample = 0; sample < config.samples; sample++) {
      // Common random samples across orders. The actual environment stream is inaccessible.
      const result = resolveCombat(
        player.board,
        opponent.board!,
        [player.tier, opponent.tier!],
        hashSeed(`${config.seed}:round-${observation.round}:sample-${sample}`),
        false,
      );
      wins += Number(result.winner === 0);
      ties += Number(result.winner === null);
      dealt += result.damage[1];
      taken += result.damage[0];
    }
    return {
      order: order.map((unit) => unit.id),
      wins,
      ties,
      losses: config.samples - wins - ties,
      meanDamageDealt: dealt / config.samples,
      meanDamageTaken: taken / config.samples,
      meanNetDamage: (dealt - taken) / config.samples,
    };
  });
  const best = estimates.reduce((best, row) =>
    row.meanNetDamage > best.meanNetDamage ? row : best,
  );
  return {
    model: 'conditional-scout-board',
    source: opponent.source,
    seenRound: opponent.seenRound,
    samplesPerOrder: config.samples,
    simulations: estimates.length * config.samples,
    selected: best.order,
    estimates,
  };
}

function validatePolicyConfig(config: HearthPolicyConfig) {
  if (
    !['heuristic-v1', 'scout-search-v1'].includes(config.kind) ||
    !HEROES.some((hero) => hero.id === config.hero)
  )
    throw new Error('Unknown policy or hero.');
  if (
    !Number.isSafeInteger(config.samples) ||
    config.samples < 1 ||
    config.samples > 256 ||
    !Number.isSafeInteger(config.maxOrders) ||
    config.maxOrders < 1 ||
    config.maxOrders > 64
  )
    throw new Error('Search budgets must be integers: samples 1–256, orders 1–64.');
  if (typeof config.seed !== 'string' || !config.seed || config.seed.length > 100)
    throw new Error('An independent policy seed is required.');
}

export function createHearthPolicy(config: HearthPolicyConfig) {
  validatePolicyConfig(config);
  let round = 0,
    refreshes = 0;
  let plannedOrder: string[] | null = null;
  const policyConfig = Object.freeze(structuredClone(config));
  return {
    config: policyConfig,
    /** Inputs are public observations and actions; this closure owns no game session. */
    decide(frame: HearthFrame): PolicyDecision {
      const observation = frame.observation;
      if (observation.round !== round) {
        round = observation.round;
        refreshes = 0;
        plannedOrder = null;
      }
      if (observation.phase === 'hero')
        return { command: { type: 'chooseHero', hero: policyConfig.hero }, reason: 'hero' };
      if (observation.phase === 'combat')
        return { command: { type: 'nextRound' }, reason: 'next-round' };
      if (observation.phase !== 'recruit')
        throw new Error('Policy cannot act on a terminal position.');
      const recruitment = botDecision({ round: observation.round }, observation.self, refreshes);
      if (recruitment) return { command: recruitment, reason: 'recruitment' };
      let search: PositionSearch | null = null;
      if (!plannedOrder) {
        search =
          policyConfig.kind === 'scout-search-v1'
            ? searchPosition(observation, policyConfig)
            : null;
        plannedOrder =
          search?.selected ?? baselineOrder(observation.self.board).map((unit) => unit.id);
      }
      const board = observation.self.board;
      const index = board.findIndex((unit, i) => unit.id !== plannedOrder![i]);
      const command: BGCommand =
        index < 0
          ? { type: 'endRecruit' }
          : {
              type: 'move',
              id: plannedOrder[index],
              direction: -1,
            };
      return {
        command,
        reason:
          index < 0
            ? 'finish'
            : policyConfig.kind === 'scout-search-v1'
              ? 'sampled-order'
              : 'baseline-order',
        plannedOrder: [...plannedOrder],
        ...(search ? { search } : {}),
      };
    },
    /** Call only after authoritative acceptance. Rejected actions consume no policy memory. */
    accepted(command: BGCommand) {
      if (command.type === 'refresh') refreshes++;
      if (command.type !== 'move') plannedOrder = null;
    },
  };
}
