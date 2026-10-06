import {
  decideRecruitment,
  type RecruitmentDecision,
} from '../games/battlegrounds/ai/recruitment-policy';
import {
  arenaFrame,
  arenaSessionV1 as arenaSession,
  type ArenaFrame,
} from '../games/battlegrounds/application/arena';
import {
  activeSeat,
  type ArenaConfig,
  type ArenaCommand,
  type RivalStyle,
} from '../games/battlegrounds/domain/arena';
import { RECRUITS } from '../games/battlegrounds/content/minions';
import { supplyTotal } from '../games/battlegrounds/domain/game';
import { POOL_COPIES } from '../games/battlegrounds/domain/recruitment';

export interface ArenaTrace {
  step: number;
  input: ArenaFrame | null;
  decision: RecruitmentDecision | null;
  command: ArenaCommand;
  round: number;
  resolved: boolean;
  elapsedMs: number;
}
export interface ArenaReport {
  seed: string;
  focalSeat: number;
  config: ArenaConfig;
  status: 'complete' | 'limit' | 'error';
  error?: string;
  placements: (number | null)[];
  survivalRounds: number[];
  rounds: number;
  commands: number;
  decisionMs: number;
  replayVerified: boolean;
  replay: string;
}
export function runArenaEpisode(
  seed: string,
  config: ArenaConfig,
  focalSeat: number,
  options: {
    maxCommands?: number;
    onDecision?: (row: ArenaTrace) => void;
    /** Controller injection receives the same detached public frame as the default v1 policy. */
    decide?: (frame: ArenaFrame, style: RivalStyle) => RecruitmentDecision;
  } = {},
): ArenaReport {
  const budget = options.maxCommands ?? 6000;
  if (
    !Number.isInteger(budget) ||
    budget < 1 ||
    budget > 10000 ||
    !Number.isInteger(focalSeat) ||
    focalSeat < 0 ||
    focalSeat > 7
  )
    throw new Error('Invalid episode budget or focal seat.');
  let session = arenaSession.create(seed);
  let error: string | undefined,
    decisionMs = 0;
  try {
    const configured = arenaSession.act(session, { type: 'configure', config });
    if (configured.error) throw new Error(configured.error);
    session = configured.session;
    while (
      !['won', 'lost'].includes(session.state.phase) &&
      session.replay.commands.length < budget
    ) {
      const seat = activeSeat(session.state);
      const input = seat === null ? null : arenaFrame(session, seat);
      const started = performance.now();
      const decision = input
        ? (options.decide ?? decideRecruitment)(input, config.seats[seat!].style)
        : null;
      const elapsedMs = performance.now() - started;
      decisionMs += elapsedMs;
      if (
        decision &&
        !input!.actions.some((a) => JSON.stringify(a.command) === JSON.stringify(decision.command))
      )
        throw new Error(`Unavailable policy action: ${JSON.stringify(decision.command)}`);
      const command: ArenaCommand = decision
        ? { type: 'seat', seat: seat!, action: decision.command }
        : { type: 'nextRound' };
      const step = session.replay.commands.length;
      const result = arenaSession.act(session, command);
      if (result.error) throw new Error(result.error);
      session = result.session;
      for (const d of RECRUITS)
        if (
          session.state.pool[d.id] < 0 ||
          supplyTotal(session.state, d.id) !== POOL_COPIES[d.tier]
        )
          throw new Error(`Supply invariant failed: ${d.id}`);
      options.onDecision?.({
        step,
        input,
        decision,
        command,
        round: session.state.round,
        resolved: command.type === 'seat' && session.state.phase !== 'recruit',
        elapsedMs,
      });
    }
  } catch (failure) {
    error = String(failure);
  }
  const replay = arenaSession.encode(session);
  let replayVerified = false;
  try {
    replayVerified = JSON.stringify(arenaSession.decode(replay)) === JSON.stringify(session);
    if (!replayVerified) error ??= 'Replay did not reconstruct the exact final state.';
  } catch (failure) {
    error ??= String(failure);
  }
  const complete = ['won', 'lost'].includes(session.state.phase);
  if (complete && new Set(session.state.players.map((p) => p.placement)).size !== 8)
    error ??= 'Terminal lobby does not have eight distinct placements.';
  return {
    seed,
    focalSeat,
    config: structuredClone(config),
    status: error ? 'error' : complete ? 'complete' : 'limit',
    ...(error ? { error } : {}),
    placements: session.state.players.map((p) => p.placement),
    survivalRounds: session.state.players.map((p) => p.eliminatedRound ?? session.state.round),
    rounds: session.state.round,
    commands: session.replay.commands.length,
    decisionMs,
    replayVerified,
    replay,
  };
}

export const ARENA_CONDITIONS = [
  'baseline-v1/hidden',
  'baseline-v1/disclosed',
  'tempo-v1/hidden',
  'tempo-v1/disclosed',
] as const;
const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
function estimate(values: number[]) {
  const average = mean(values);
  const se =
    values.length > 1
      ? Math.sqrt(
          values.reduce((sum, value) => sum + (value - average!) ** 2, 0) /
            (values.length - 1) /
            values.length,
        )
      : null;
  return { mean: average, standardErrorAcrossSeedBlocks: se, seedBlocks: values.length };
}
/** Exclude whole seed blocks if any rotation/condition is missing, failed or mismatched. */
export function compareArenaEpisodes(reports: readonly ArenaReport[]) {
  const groups = new Map<string, ArenaReport[]>();
  for (const row of reports) groups.set(row.seed, [...(groups.get(row.seed) ?? []), row]);
  const included: ArenaReport[] = [],
    excluded: { seed: string; reason: string }[] = [];
  const blocks: {
    seed: string;
    hiddenImprovement: number;
    disclosedImprovement: number;
    tempoDisclosureImprovement: number;
    baselineDisclosureImprovement: number;
  }[] = [];
  for (const [seed, rows] of groups) {
    let reason = '';
    try {
      for (const row of rows) {
        const replay = JSON.parse(row.replay);
        if (
          !Array.isArray(replay.commands) ||
          replay.commands[0]?.type !== 'configure' ||
          JSON.stringify(replay.commands[0].config) !== JSON.stringify(row.config)
        )
          reason = 'Replay and receipt configuration mismatch.';
      }
    } catch {
      reason = 'Malformed replay.';
    }
    if (reason) {
      excluded.push({ seed, reason });
      continue;
    }
    const key = (r: ArenaReport) => `${r.config.seats[r.focalSeat].style}/${r.config.visibility}`;
    const at = (seat: number, condition: string) =>
      rows.filter((r) => r.focalSeat === seat && key(r) === condition);
    if (
      rows.length !== 32 ||
      Array.from({ length: 8 }, (_, seat) =>
        ARENA_CONDITIONS.some((condition) => at(seat, condition).length !== 1),
      ).some(Boolean)
    )
      reason = 'Missing or duplicate seat/condition.';
    else if (
      rows.some(
        (r) =>
          r.status !== 'complete' ||
          !r.replayVerified ||
          r.placements.some((p) => p === null || p < 1 || p > 8) ||
          new Set(r.placements).size !== 8,
      )
    )
      reason = 'Incomplete, failed or unverified lobby.';
    else
      for (let seat = 0; seat < 8; seat++) {
        const quartet = ARENA_CONDITIONS.map((condition) => at(seat, condition)[0]);
        const normalized = quartet.map((r) =>
          JSON.stringify({
            config: {
              ...r.config,
              visibility: 'hidden',
              seats: r.config.seats.map((s, i) =>
                i === seat ? { ...s, style: 'baseline-v1' } : s,
              ),
            },
            content: JSON.parse(r.replay).content,
          }),
        );
        if (new Set(normalized).size !== 1 || quartet.some((r) => r.config.visibilitySeat !== seat))
          reason = 'Opponent, visibility scope or content mismatch.';
        // The baseline ignores labels; disclosure must not alter anyone else's information.
        if (
          JSON.stringify(JSON.parse(quartet[0].replay).commands.slice(1)) !==
          JSON.stringify(JSON.parse(quartet[1].replay).commands.slice(1))
        )
          reason = 'Baseline disclosure negative control changed gameplay.';
      }
    if (reason) {
      excluded.push({ seed, reason });
      continue;
    }
    included.push(...rows);
    const average = (condition: string) =>
      mean(Array.from({ length: 8 }, (_, seat) => at(seat, condition)[0].placements[seat]!))!;
    blocks.push({
      seed,
      hiddenImprovement: average('baseline-v1/hidden') - average('tempo-v1/hidden'),
      disclosedImprovement: average('baseline-v1/disclosed') - average('tempo-v1/disclosed'),
      tempoDisclosureImprovement: average('tempo-v1/hidden') - average('tempo-v1/disclosed'),
      baselineDisclosureImprovement:
        average('baseline-v1/hidden') - average('baseline-v1/disclosed'),
    });
  }
  return {
    includedLobbies: included.length,
    excluded,
    blocks,
    conditions: ARENA_CONDITIONS.map((condition) => {
      const rows = included.filter(
        (r) => `${r.config.seats[r.focalSeat].style}/${r.config.visibility}` === condition,
      );
      const placements = rows.map((r) => r.placements[r.focalSeat]!);
      return {
        condition,
        lobbies: rows.length,
        meanPlacement: mean(placements),
        firstPlaces: placements.filter((p) => p === 1).length,
        topFour: placements.filter((p) => p <= 4).length,
        meanSurvivalRounds: mean(rows.map((r) => r.survivalRounds[r.focalSeat])),
      };
    }),
    hiddenImprovement: estimate(blocks.map((b) => b.hiddenImprovement)),
    disclosedImprovement: estimate(blocks.map((b) => b.disclosedImprovement)),
    tempoDisclosureImprovement: estimate(blocks.map((b) => b.tempoDisclosureImprovement)),
    baselineDisclosureImprovement: estimate(blocks.map((b) => b.baselineDisclosureImprovement)),
  };
}
