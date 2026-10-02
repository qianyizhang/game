import { createRun, RULES_VERSION, transition } from '../domain/game';
import type { Command, RunState } from '../domain/types';

export const SAVE_KEY = 'card-workshop.blindside.v2';
export interface Replay {
  game: 'blindside';
  version: number;
  seed: string;
  commands: Command[];
}
export interface Session {
  run: RunState;
  replay: Replay;
}
export function newSession(seed: string): Session {
  const run = createRun(seed);
  return {
    run,
    replay: { game: 'blindside', version: RULES_VERSION, seed: run.seed, commands: [] },
  };
}
export function act(session: Session, command: Command): { session: Session; error?: string } {
  const result = transition(session.run, command);
  if (result.error) return { session, error: result.error };
  return {
    session: {
      run: result.state,
      replay: { ...session.replay, commands: [...session.replay.commands, command] },
    },
  };
}

function validCommand(value: unknown): value is Command {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  const ids = (v: unknown) =>
    Array.isArray(v) && v.length <= 5 && v.every((id) => typeof id === 'string' && id.length < 80);
  switch (c.type) {
    case 'startBlind':
    case 'reroll':
    case 'leaveShop':
      return true;
    case 'play':
    case 'discard':
      return ids(c.cards);
    case 'buy':
      return typeof c.offerId === 'string';
    case 'sellJoker':
    case 'sellConsumable':
      return typeof c.id === 'string';
    case 'moveJoker':
    case 'moveCard':
      return typeof c.id === 'string' && (c.direction === -1 || c.direction === 1);
    case 'sortHand':
      return c.by === 'rank' || c.by === 'suit';
    case 'useConsumable':
      return typeof c.id === 'string' && ids(c.cards);
    default:
      return false;
  }
}

/** Validate by rebuilding through legal commands, never trusting serialized state. */
export function importReplay(text: string): Session {
  if (text.length > 2_000_000) throw new Error('Save is too large (maximum 2 MB).');
  const value = JSON.parse(text) as Partial<Replay>;
  if (!value || value.game !== 'blindside' || value.version !== RULES_VERSION)
    throw new Error('This save belongs to another game or rules version.');
  if (
    typeof value.seed !== 'string' ||
    value.seed.length > 64 ||
    !Array.isArray(value.commands) ||
    value.commands.length > 10_000
  )
    throw new Error('Invalid save format.');
  let session = newSession(value.seed);
  for (const [index, command] of value.commands.entries()) {
    if (!validCommand(command)) throw new Error(`Invalid command at step ${index + 1}.`);
    const result = act(session, command);
    if (result.error) throw new Error(`Save step ${index + 1}: ${result.error}`);
    session = result.session;
  }
  return session;
}

export const exportReplay = (session: Session): string => JSON.stringify(session.replay, null, 2);
