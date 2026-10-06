import { hashSeed, shuffle } from '../../../shared/random';
import { HEROES } from '../content/minions';
import { isBGCommand } from './commands';
import { createBG, resolveLobbyCombat } from './game';
import { bgLog, recruitAction, startRecruitment } from './recruitment';
import type { BGCommand, BGState, Player } from './types';

export const ARENA_VERSION = 2;
export const RIVAL_STYLES = {
  'baseline-v1': { label: 'Classic', description: 'The original value and upgrade heuristic.' },
  'tempo-v1': { label: 'Tempo', description: 'Fill the board and buy immediate combat strength.' },
  'economy-v1': { label: 'Economy', description: 'Invest in tavern tiers while health allows.' },
  'composition-v1': {
    label: 'Composition',
    description: 'Prefer matching tribes and scaling engines.',
  },
} as const;
export type RivalStyle = keyof typeof RIVAL_STYLES;
export type StyleVisibility = 'hidden' | 'disclosed';
export interface ArenaConfig {
  visibility: StyleVisibility;
  firstSeat: number;
  /** null applies the visibility condition to every seat; an ID isolates one policy. */
  visibilitySeat: number | null;
  seats: { hero: string; style: RivalStyle }[];
}
export type RecruitCommand = Exclude<BGCommand, { type: 'chooseHero' | 'nextRound' }>;
export type ArenaCommand =
  | { type: 'configure'; config: ArenaConfig }
  | { type: 'seat'; seat: number; action: RecruitCommand }
  | { type: 'nextRound' };
export type PublicSeat = Pick<Player, 'id' | 'name' | 'hero' | 'hp' | 'tier' | 'placement'>;
export interface SeatCombat {
  winner: 0 | 1 | null;
  damage: [number, number];
  attacks: number;
  stalemate: boolean;
}
export interface ArenaState extends BGState {
  arena: {
    version: number;
    config: ArenaConfig | null;
    order: number[];
    cursor: number;
    turn: { actions: number; refreshes: number }[];
    publicLobby: PublicSeat[];
    combats: (SeatCombat | null)[];
  };
}
export const publicLobby = (state: BGState): PublicSeat[] =>
  state.players.map(({ id, name, hero, hp, tier, placement }) => ({
    id,
    name,
    hero,
    hp,
    tier,
    placement,
  }));

export function createArena(seed: string, version: 1 | 2 = ARENA_VERSION): ArenaState {
  const state = createBG(seed, version === 1 ? 5 : 6);
  return {
    ...state,
    arena: {
      version,
      config: null,
      order: [],
      cursor: 0,
      turn: [],
      publicLobby: publicLobby(state),
      combats: Array(8).fill(null),
    },
  };
}
export function mixedRivalsConfig(
  seed: string,
  hero: string,
  visibility: StyleVisibility = 'disclosed',
): ArenaConfig {
  // Setup randomness is separate from shop/combat randomness. Neither stream reaches policies.
  const [styles] = shuffle<RivalStyle>(
    [
      'tempo-v1',
      'tempo-v1',
      'economy-v1',
      'economy-v1',
      'composition-v1',
      'composition-v1',
      'baseline-v1',
    ],
    hashSeed(`${seed}:styles`),
  );
  const [heroes] = shuffle([...HEROES, ...HEROES], hashSeed(`${seed}:heroes`));
  return {
    visibility,
    visibilitySeat: null,
    firstSeat: 0,
    seats: [
      { hero, style: 'baseline-v1' },
      ...styles.map((style, i) => ({ style, hero: heroes[i].id })),
    ],
  };
}
export function isArenaConfig(value: unknown): value is ArenaConfig {
  if (!value || typeof value !== 'object') return false;
  const c = value as ArenaConfig;
  return (
    (c.visibility === 'hidden' || c.visibility === 'disclosed') &&
    (c.visibilitySeat === null ||
      (Number.isInteger(c.visibilitySeat) && c.visibilitySeat >= 0 && c.visibilitySeat < 8)) &&
    Number.isInteger(c.firstSeat) &&
    c.firstSeat >= 0 &&
    c.firstSeat < 8 &&
    Array.isArray(c.seats) &&
    c.seats.length === 8 &&
    c.seats.every(
      (seat) =>
        seat && HEROES.some((h) => h.id === seat.hero) && Object.hasOwn(RIVAL_STYLES, seat.style),
    )
  );
}
export function isArenaCommand(value: unknown): value is ArenaCommand {
  if (!value || typeof value !== 'object') return false;
  const c = value as ArenaCommand;
  if (c.type === 'configure') return isArenaConfig(c.config);
  if (c.type === 'nextRound') return true;
  const action: unknown = (value as { action?: unknown }).action;
  return (
    c.type === 'seat' &&
    Number.isInteger(c.seat) &&
    c.seat >= 0 &&
    c.seat < 8 &&
    isBGCommand(action) &&
    action.type !== 'chooseHero' &&
    action.type !== 'nextRound'
  );
}
export function activeSeat(state: ArenaState): number | null {
  return state.phase === 'recruit' ? (state.arena.order[state.arena.cursor] ?? null) : null;
}
function beginRound(state: ArenaState) {
  const first = (state.arena.config!.firstSeat + state.round - 1) % 8;
  state.arena.order = Array.from({ length: 8 }, (_, offset) => (first + offset) % 8).filter(
    (seat) => state.players[seat].hp > 0,
  );
  state.arena.cursor = 0;
  state.arena.turn = Array.from({ length: 8 }, () => ({ actions: 0, refreshes: 0 }));
  // Both initial shop reservations and complete recruitment turns use this order.
  startRecruitment(state, state.arena.order);
  state.arena.publicLobby = publicLobby(state);
}
/** Pure rules only: replaying these commands never executes a rival policy. */
export function transitionArena(
  previous: ArenaState,
  command: ArenaCommand,
): { state: ArenaState; error?: string } {
  const reject = (error: string) => ({ state: previous, error });
  if (!isArenaCommand(command)) return reject('Invalid arena command.');
  const state = structuredClone(previous);
  if (command.type === 'configure') {
    if (state.phase !== 'hero' || state.arena.config)
      return reject('This lobby is already configured.');
    state.arena.config = structuredClone(command.config);
    command.config.seats.forEach((seat, id) => {
      state.players[id].hero = seat.hero;
    });
    beginRound(state);
  } else if (command.type === 'nextRound') {
    if (state.phase !== 'combat') return reject('Resolve this round before advancing.');
    state.round++;
    beginRound(state);
  } else {
    if (activeSeat(state) !== command.seat) return reject('Only the active seat can recruit.');
    const player = state.players[command.seat];
    if (command.action.type === 'endRecruit') {
      if (player.discover.length)
        return reject('Choose the Discover reward before ending recruitment.');
      state.arena.cursor++;
      if (state.arena.cursor === state.arena.order.length) {
        resolveLobbyCombat(state, {
          completeLobby: true,
          onCombat: (left, right, result) => {
            const { winner, damage, attacks, stalemate } = result;
            state.arena.combats[left] = { winner, damage: [...damage], attacks, stalemate };
            if (right !== null)
              state.arena.combats[right] = {
                winner: winner === null ? null : winner === 0 ? 1 : 0,
                damage: [damage[1], damage[0]],
                attacks,
                stalemate,
              };
          },
        });
        state.arena.publicLobby = publicLobby(state);
      }
    } else {
      if (state.arena.turn[command.seat].actions >= 120 && command.action.type !== 'discover')
        return reject('Recruitment budget reached; end this seat’s turn.');
      const error = recruitAction(state, player, command.action);
      if (error) return reject(error);
      bgLog(state, `${player.name}: ${command.action.type}.`);
      if (command.action.type === 'refresh') state.arena.turn[command.seat].refreshes++;
    }
    state.arena.turn[command.seat].actions++;
  }
  return { state };
}
