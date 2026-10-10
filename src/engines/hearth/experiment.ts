import { replayEnvelope } from '../replay-envelope';
import {
  actHearthAgent,
  hearthFrame,
  type HearthFrame,
  type HearthEvent,
} from '../../games/battlegrounds/application/agent';
import { bgSessionV5 as bgSession } from '../../games/battlegrounds/application/session';
import {
  createHearthPolicy,
  type HearthPolicyConfig,
  type PolicyDecision,
} from '../../games/battlegrounds/ai/policy';
import { RECRUITS } from '../../games/battlegrounds/content/minions';
import { supplyTotal } from '../../games/battlegrounds/domain/game';
import { POOL_COPIES } from '../../games/battlegrounds/domain/recruitment';

export interface EpisodeDecision {
  step: number;
  input: HearthFrame;
  decision: PolicyDecision;
  action: string;
  events: HearthEvent[];
  elapsedMs: number;
}
export interface EpisodeReport {
  status: 'complete' | 'limit' | 'error';
  error?: string;
  policy: HearthPolicyConfig;
  environmentSeed: string;
  outcome: string;
  placement: number | null;
  rounds: number;
  commands: number;
  simulations: number;
  decisionMs: number;
  replayVerified: boolean;
  replay: string;
}

/** Evaluator owns seed, session and replay. Policy receives only detached public frames. */
export function runEpisode(
  seed: string,
  config: HearthPolicyConfig,
  options: {
    maxCommands?: number;
    onDecision?: (decision: EpisodeDecision) => void;
  } = {},
): EpisodeReport {
  const maxCommands = options.maxCommands ?? 2000;
  if (!Number.isSafeInteger(maxCommands) || maxCommands < 1 || maxCommands > 10000)
    throw new Error('Command budget must be 1–10000.');
  const policy = createHearthPolicy(config);
  let session = bgSession.create(seed);
  let simulations = 0,
    decisionMs = 0;
  let error: string | undefined;
  try {
    for (
      let step = 0;
      step < maxCommands && !['won', 'lost'].includes(session.state.phase);
      step++
    ) {
      const input = hearthFrame(session);
      const start = performance.now();
      const decision = policy.decide(structuredClone(input));
      const elapsedMs = performance.now() - start;
      decisionMs += elapsedMs;
      simulations += decision.search?.simulations ?? 0;
      const action = input.actions.find(
        (entry) => JSON.stringify(entry.command) === JSON.stringify(decision.command),
      );
      if (!action)
        throw new Error(
          `Policy proposed an unavailable command at step ${step}: ${JSON.stringify(decision.command)}`,
        );
      const result = actHearthAgent(session, { step: input.step, action: action.id });
      if ('error' in result) throw new Error(result.error);
      session = result.session;
      policy.accepted(decision.command);
      for (const definition of RECRUITS)
        if (
          session.state.pool[definition.id] < 0 ||
          supplyTotal(session.state, definition.id) !== POOL_COPIES[definition.tier]
        )
          throw new Error(`Supply invariant failed: ${definition.id}`);
      options.onDecision?.({
        step,
        input,
        decision,
        action: action.id,
        events: result.events,
        elapsedMs,
      });
    }
  } catch (failure) {
    error = String(failure);
  }
  const replay = bgSession.encode(session);
  let replayVerified = false;
  try {
    replayVerified = JSON.stringify(bgSession.decode(replay)) === JSON.stringify(session);
    if (!replayVerified) error = error ?? 'Replay did not reconstruct the exact final state.';
  } catch (failure) {
    error = error ?? `Replay verification failed: ${String(failure)}`;
  }
  return {
    status: error ? 'error' : ['won', 'lost'].includes(session.state.phase) ? 'complete' : 'limit',
    ...(error ? { error } : {}),
    policy: structuredClone(config),
    environmentSeed: seed,
    outcome: session.state.phase,
    placement: session.state.players[0].placement,
    rounds: session.state.round,
    commands: session.replay.commands.length,
    simulations,
    decisionMs,
    replayVerified,
    replay,
  };
}

export function compareEpisodes(reports: readonly EpisodeReport[]) {
  const groups = new Map<string, EpisodeReport[]>();
  for (const report of reports) {
    const key = JSON.stringify([report.environmentSeed, report.policy.hero]);
    groups.set(key, [...(groups.get(key) ?? []), report]);
  }
  const pairs: {
    environmentSeed: string;
    hero: string;
    baseline: number;
    candidate: number;
    improvement: number;
  }[] = [];
  const excluded: { key: string; reason: string }[] = [];
  for (const [key, group] of groups) {
    const baseline = group.filter((row) => row.policy.kind === 'heuristic-v1');
    const candidate = group.filter((row) => row.policy.kind === 'scout-search-v1');
    if (group.length !== 2 || baseline.length !== 1 || candidate.length !== 1) {
      excluded.push({ key, reason: 'Missing or duplicate policy run.' });
      continue;
    }
    if (
      group.some(
        (row) => row.status !== 'complete' || !row.replayVerified || row.placement === null,
      )
    ) {
      excluded.push({ key, reason: 'Incomplete, failed or unverified run.' });
      continue;
    }
    if (
      baseline[0].policy.seed !== candidate[0].policy.seed ||
      baseline[0].policy.samples !== candidate[0].policy.samples ||
      baseline[0].policy.maxOrders !== candidate[0].policy.maxOrders ||
      JSON.stringify(replayEnvelope(baseline[0].replay).content) !==
        JSON.stringify(replayEnvelope(candidate[0].replay).content)
    ) {
      excluded.push({ key, reason: 'Policy configuration or content mismatch.' });
      continue;
    }
    pairs.push({
      environmentSeed: baseline[0].environmentSeed,
      hero: baseline[0].policy.hero,
      baseline: baseline[0].placement!,
      candidate: candidate[0].placement!,
      improvement: baseline[0].placement! - candidate[0].placement!,
    });
  }
  const mean = (values: number[]) =>
    values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const deltas = pairs.map((pair) => pair.improvement);
  const average = mean(deltas);
  const standardError =
    deltas.length > 1
      ? Math.sqrt(
          deltas.reduce((sum, value) => sum + (value - average!) ** 2, 0) /
            (deltas.length - 1) /
            deltas.length,
        )
      : null;
  return {
    matchedPairs: pairs.length,
    excluded,
    pairs,
    baselineMeanPlacement: mean(pairs.map((pair) => pair.baseline)),
    candidateMeanPlacement: mean(pairs.map((pair) => pair.candidate)),
    meanPlacementImprovement: average,
    standardError,
    candidateBetter: deltas.filter((delta) => delta > 0).length,
    tied: deltas.filter((delta) => delta === 0).length,
    candidateWorse: deltas.filter((delta) => delta < 0).length,
  };
}
