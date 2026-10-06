import type { AgentChoice, AgentFrame } from '../../../shared/agent';
import type { ContentPin } from '../../../shared/contentPack';
import type { Session } from '../../../shared/replay';
import { HEROES, MINIONS } from '../content/minions';
import { recruitAction } from '../domain/recruitment';
import type { BGCommand, BGState, Player, Unit } from '../domain/types';
import { hearthCommands } from './engine';
import { bgSession } from './session';
import { TAVERN_SPELLS } from '../content/spells';

export type HearthSession = Session<BGState, BGCommand>;
export interface HearthObservation {
  schema: 'hearth.observation.v1';
  rulesVersion: number;
  content: readonly ContentPin[];
  phase: BGState['phase'];
  round: number;
  self: Player;
  lobby: Pick<Player, 'id' | 'name' | 'hero' | 'hp' | 'tier' | 'placement'>[];
  opponent: {
    playerId: number | null;
    source: 'last-seen' | 'ghost' | 'unseen';
    seenRound: number | null;
    tier: number | null;
    board: Unit[] | null;
  } | null;
  lastCombat: {
    winner: 0 | 1 | null;
    damage: [number, number];
    attacks: number;
    stalemate: boolean;
  } | null;
}
export type HearthFrame = AgentFrame<HearthObservation, BGCommand>;
export type HearthEvent =
  | { type: 'tavern'; before: Player['tavern']; after: Player['tavern'] }
  | { type: 'resource'; name: 'gold' | 'hp' | 'tier'; before: number; after: number; delta: number }
  | { type: 'phase'; before: BGState['phase']; after: BGState['phase']; round: number }
  | {
      type: 'unit';
      id: string;
      before: { zone: string; index: number; unit: Unit } | null;
      after: { zone: string; index: number; unit: Unit } | null;
    }
  | { type: 'combat'; result: NonNullable<HearthObservation['lastCombat']> };

/** Explicit allowlist. Never spread environment state into a policy observation. */
export function observeHearth(session: HearthSession): HearthObservation {
  const state = session.state;
  const index = state.pairings.indexOf(0);
  const playerId = state.pairings[index % 2 ? index - 1 : index + 1];
  const seen = state.scouting.find((row) => row.playerId === playerId);
  return structuredClone({
    schema: 'hearth.observation.v1',
    rulesVersion: state.version,
    content: session.replay.content ?? [],
    phase: state.phase,
    round: state.round,
    self: state.players[0],
    lobby: state.players.map(({ id, name, hero, hp, tier, placement }) => ({
      id,
      name,
      hero,
      hp,
      tier,
      placement,
    })),
    opponent:
      index < 0
        ? null
        : {
            playerId: playerId ?? null,
            source: playerId === undefined ? 'ghost' : seen ? 'last-seen' : 'unseen',
            seenRound: playerId === undefined ? null : (seen?.round ?? null),
            tier: playerId === undefined ? state.ghostTier : (seen?.tier ?? null),
            board: playerId === undefined ? state.ghost : (seen?.board ?? null),
          },
    lastCombat: state.lastCombat
      ? {
          winner: state.lastCombat.winner,
          damage: state.lastCombat.damage,
          attacks: state.lastCombat.attacks,
          stalemate: state.lastCombat.stalemate,
        }
      : null,
  });
}

/** Check recruitment with native rules, without resolving hypothetical lobby combats. */
export function legalHearthCommands(state: BGState, seat = 0): BGCommand[] {
  const commands: BGCommand[] = [];
  for (const command of hearthCommands(state, seat)) {
    if (state.phase !== 'recruit') commands.push(command);
    else if (command.type === 'endRecruit') {
      if (!state.players[seat].discover.length) commands.push(command);
    } else {
      // Recruitment touches only the actor, supply, RNG, IDs and log. Avoid copying combat frames.
      const copy = { ...state, pool: { ...state.pool }, log: [...state.log] };
      const player = structuredClone(state.players[seat]);
      if (!recruitAction(copy, player, command)) commands.push(command);
    }
  }
  return commands;
}

export function hearthFrame(session: HearthSession): HearthFrame {
  return {
    protocol: 'card-workshop.agent.v1',
    game: 'last-hearth',
    step: session.replay.commands.length,
    observation: observeHearth(session),
    actions: legalHearthCommands(session.state).map((command, index) => ({
      id: `a${index}`,
      command,
    })),
  };
}

export function hearthEvents(
  before: Pick<HearthObservation, 'self' | 'phase' | 'round' | 'lastCombat'>,
  after: Pick<HearthObservation, 'self' | 'phase' | 'round' | 'lastCombat'>,
  command: BGCommand,
  combatResolved = command.type === 'endRecruit',
): HearthEvent[] {
  const events: HearthEvent[] = [];
  if (JSON.stringify(before.self.tavern) !== JSON.stringify(after.self.tavern))
    events.push({
      type: 'tavern',
      before: structuredClone(before.self.tavern),
      after: structuredClone(after.self.tavern),
    });
  for (const name of ['gold', 'hp', 'tier'] as const) {
    const a = before.self[name],
      b = after.self[name];
    if (a !== b) events.push({ type: 'resource', name, before: a, after: b, delta: b - a });
  }
  if (before.phase !== after.phase || before.round !== after.round)
    events.push({ type: 'phase', before: before.phase, after: after.phase, round: after.round });
  const units = (player: Player) =>
    new Map(
      ['board', 'hand', 'shop', 'discover'].flatMap((zone) =>
        player[zone as 'board' | 'hand' | 'shop' | 'discover'].map(
          (unit, index) => [unit.id, { zone, index, unit }] as const,
        ),
      ),
    );
  const a = units(before.self),
    b = units(after.self);
  for (const id of new Set([...a.keys(), ...b.keys()])) {
    const previous = a.get(id) ?? null,
      next = b.get(id) ?? null;
    if (JSON.stringify(previous) !== JSON.stringify(next))
      events.push({ type: 'unit', id, before: previous, after: next });
  }
  if (combatResolved && after.lastCombat) events.push({ type: 'combat', result: after.lastCombat });
  return events;
}

export function actHearthAgent(session: HearthSession, choice: AgentChoice) {
  const frame = hearthFrame(session);
  const reject = (error: string) => ({ session, frame, events: [] as HearthEvent[], error });
  if (!Number.isSafeInteger(choice.step) || choice.step !== frame.step)
    return reject('Stale or invalid step. Observe the current position before acting.');
  // Match the replay codec's accepted-command limit so even a freeze loop remains exportable.
  if (frame.step >= 10000)
    return reject(
      'Agent command budget reached (10000). Close this episode and preserve its replay.',
    );
  const action = frame.actions.find((entry) => entry.id === choice.action);
  if (!action) return reject('Unknown action for this step.');
  const result = bgSession.act(session, structuredClone(action.command));
  if (result.error) return reject(result.error);
  const next = hearthFrame(result.session);
  return {
    session: result.session,
    frame: next,
    events: hearthEvents(frame.observation, next.observation, action.command),
  };
}

export function hearthCatalogue() {
  return structuredClone({
    schema: 'hearth.catalogue.v1',
    content: bgSession.rules.content,
    heroes: HEROES,
    minions: MINIONS,
    spells: TAVERN_SPELLS,
  });
}
