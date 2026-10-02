import { hashSeed } from '../../../shared/random';
import { resolveCombat } from './combat';
import { makeUnit } from './units';
import type { CombatResult, Unit } from './types';

/** A fixed practice battle uses the same combat resolver as a normal lobby. */
export interface PositioningState {
  seed: string;
  board: Unit[];
  opponent: Unit[];
  result: CombatResult | null;
}
export type PositioningCommand =
  { type: 'move'; id: string; direction: -1 | 1 } | { type: 'fight' };
export function createPositioning(seed: string): PositioningState {
  return {
    seed,
    board: ['leader', 'stray', 'harvester'].map((id, i) => makeUnit(id, `friendly-${i}`)),
    opponent: ['squire', 'harvester', 'imp'].map((id, i) => makeUnit(id, `opponent-${i}`)),
    result: null,
  };
}
export function transitionPositioning(previous: PositioningState, command: PositioningCommand) {
  const reject = (error: string) => ({ state: previous, error });
  if (previous.result) return reject('This battle is finished.');
  const state = structuredClone(previous);
  if (command.type === 'fight') {
    state.result = resolveCombat(state.board, state.opponent, [2, 2], hashSeed(state.seed));
    return { state };
  }
  const index = state.board.findIndex((unit) => unit.id === command.id);
  const target = index + command.direction;
  if (index < 0 || target < 0 || target >= state.board.length)
    return reject('Choose a minion that can move in that direction.');
  [state.board[index], state.board[target]] = [state.board[target], state.board[index]];
  return { state };
}
export function isPositioningCommand(value: unknown): value is PositioningCommand {
  if (!value || typeof value !== 'object') return false;
  const command = value as Record<string, unknown>;
  return (
    command.type === 'fight' ||
    (command.type === 'move' &&
      typeof command.id === 'string' &&
      (command.direction === -1 || command.direction === 1))
  );
}
