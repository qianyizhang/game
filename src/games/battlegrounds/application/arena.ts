import type { AgentChoice, AgentFrame } from '../../../shared/agent';
import { replayCodec, type Session } from '../../../shared/replay';
import { HEROES, MINIONS } from '../content/minions';
import {
  activeSeat,
  ARENA_VERSION,
  createArena,
  isArenaCommand,
  RIVAL_STYLES,
  transitionArena,
  type ArenaCommand,
  type ArenaState,
  type PublicSeat,
  type RecruitCommand,
  type RivalStyle,
  type SeatCombat,
} from '../domain/arena';
import type { Player } from '../domain/types';
import { hearthEvents, legalHearthCommands, type HearthObservation } from './agent';
import { bgSession, bgSessionV5 } from './session';
import { TAVERN_SPELLS } from '../content/spells';

export const arenaSession = replayCodec({
  game: 'last-hearth-arena',
  version: ARENA_VERSION,
  content: bgSession.rules.content,
  create: (seed) => createArena(seed),
  transition: transitionArena,
  isCommand: isArenaCommand,
});
export const arenaSessionV1 = replayCodec({
  game: 'last-hearth-arena',
  version: 1,
  content: bgSessionV5.rules.content,
  create: (seed) => createArena(seed, 1),
  transition: transitionArena,
  isCommand: isArenaCommand,
});
export type ArenaSession = Session<ArenaState, ArenaCommand>;
export interface ArenaObservation {
  schema: 'hearth.arena-observation.v1';
  rulesVersion: number;
  arenaVersion: number;
  content: HearthObservation['content'];
  phase: ArenaState['phase'];
  round: number;
  self: Player;
  lobby: (PublicSeat & { style?: RivalStyle })[];
  opponent: HearthObservation['opponent'];
  lastCombat: SeatCombat | null;
  activeSeat: number | null;
  recruitmentOrder: number[];
  turn: { actions: number; refreshes: number };
}
export type ArenaFrame = AgentFrame<ArenaObservation, RecruitCommand>;

/** Separate evaluator/inspector surface. Never attach this result to a policy frame. */
export function inspectArena(state: ArenaState) {
  return structuredClone({
    version: state.arena.version,
    config: state.arena.config,
    styles: RIVAL_STYLES,
    order: state.arena.order,
    activeSeat: activeSeat(state),
  });
}
export function arenaFrame(session: ArenaSession, seat: number): ArenaFrame {
  if (!Number.isInteger(seat) || seat < 0 || seat > 7) throw new Error('Choose seat 0–7.');
  const state = session.state;
  const index = state.pairings.indexOf(seat);
  const opponentId = state.pairings[index % 2 ? index - 1 : index + 1];
  const seen = state.scouting.find((row) => row.playerId === opponentId);
  const actor = activeSeat(state);
  const commands =
    actor === seat
      ? (legalHearthCommands(state, seat).filter(
          (command) =>
            command.type === 'endRecruit' ||
            command.type === 'discover' ||
            (state.arena.turn[seat].actions < 120 &&
              command.type !== 'chooseHero' &&
              command.type !== 'nextRound'),
        ) as RecruitCommand[])
      : [];
  return structuredClone({
    protocol: 'card-workshop.agent.v1',
    game: 'last-hearth-arena',
    step: session.replay.commands.length,
    observation: {
      schema: 'hearth.arena-observation.v1',
      rulesVersion: state.version,
      arenaVersion: state.arena.version,
      content: session.replay.content ?? [],
      phase: ['won', 'lost'].includes(state.phase)
        ? state.players[seat].placement === 1
          ? 'won'
          : 'lost'
        : state.phase,
      round: state.round,
      self: state.players[seat],
      // Round-opening public snapshot avoids leaking earlier seats' same-round purchases/upgrades.
      lobby: state.arena.publicLobby.map((row) => ({
        ...row,
        ...(state.arena.config?.visibility === 'disclosed' &&
        (state.arena.config.visibilitySeat === null || state.arena.config.visibilitySeat === seat)
          ? { style: state.arena.config.seats[row.id].style }
          : {}),
      })),
      opponent:
        index < 0
          ? null
          : {
              playerId: opponentId ?? null,
              source: opponentId === undefined ? 'ghost' : seen ? 'last-seen' : 'unseen',
              seenRound: opponentId === undefined ? null : (seen?.round ?? null),
              tier: opponentId === undefined ? state.ghostTier : (seen?.tier ?? null),
              board: opponentId === undefined ? state.ghost : (seen?.board ?? null),
            },
      lastCombat: state.arena.combats[seat],
      activeSeat: actor,
      recruitmentOrder: state.arena.order,
      turn: state.arena.turn[seat] ?? { actions: 0, refreshes: 0 },
    },
    actions: commands.map((command, i) => ({ id: `a${i}`, command })),
  });
}
export function actArenaAgent(session: ArenaSession, seat: number, choice: AgentChoice) {
  const frame = arenaFrame(session, seat);
  const reject = (error: string) => ({ session, frame, events: [], error });
  if (!Number.isSafeInteger(choice.step) || choice.step !== frame.step)
    return reject('Stale or invalid step.');
  if (frame.step >= 10000) return reject('Arena replay command budget reached (10000).');
  const selected = frame.actions.find((action) => action.id === choice.action);
  if (!selected) return reject('Unknown action or inactive seat.');
  const result = arenaSession.act(session, { type: 'seat', seat, action: selected.command });
  if (result.error) return reject(result.error);
  const next = arenaFrame(result.session, seat);
  return {
    session: result.session,
    frame: next,
    events: hearthEvents(
      frame.observation,
      next.observation,
      selected.command,
      session.state.phase === 'recruit' && result.session.state.phase !== 'recruit',
    ),
  };
}
export function arenaCatalogue() {
  return structuredClone({
    schema: 'hearth.arena-catalogue.v1',
    content: arenaSession.rules.content,
    heroes: HEROES,
    minions: MINIONS,
    spells: TAVERN_SPELLS,
    styles: RIVAL_STYLES,
  });
}
