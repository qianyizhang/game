import { BASE_CONTENT } from '../domain/content';
import {
  applyCommand,
  createGame,
  RULES_VERSION,
  validCommand,
  validateContent,
} from '../domain/game';
import type { Command, Content, Replay, State } from '../domain/types';
export const SAVE_KEY = 'card-workshop.emberwake.v1';
export interface Session {
  state: State;
  replay: Replay;
}
export function newSession(seed: string, hero: string, content: Content = BASE_CONTENT): Session {
  const pack = validateContent(content);
  return {
    state: createGame(seed, hero, pack),
    replay: {
      format: 'emberwake-replay-v1',
      rulesVersion: RULES_VERSION,
      content: pack,
      seed,
      hero,
      commands: [],
    },
  };
}
export function dispatch(
  session: Session,
  command: Command,
): { session: Session; error: string | null } {
  const result = applyCommand(session.state, command, session.replay.content);
  if (!result.accepted) return { session, error: result.error };
  const commands = [...session.replay.commands];
  const previous = commands.at(-1);
  if (
    command.type === 'advance' &&
    previous?.type === 'advance' &&
    previous.ticks + command.ticks <= 50
  )
    commands[commands.length - 1] = { type: 'advance', ticks: previous.ticks + command.ticks };
  else {
    const clean =
      command.type === 'move' || command.type === 'cast'
        ? { ...command, target: { x: command.target.x, y: command.target.y } }
        : command.type === 'steer'
          ? { ...command, direction: { x: command.direction.x, y: command.direction.y } }
          : command;
    commands.push(structuredClone(clean));
  }
  return { session: { state: result.state, replay: { ...session.replay, commands } }, error: null };
}
export function exportSession(session: Session): string {
  return JSON.stringify(session.replay);
}
/** Saves contain accepted commands, never trusted mutable snapshots. */
export function importSession(text: string): Session {
  if (text.length > 16_000_000) throw new Error('Save exceeds the 16 MB limit.');
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object') throw new Error('Invalid save.');
  const r = value as Record<string, unknown>;
  if (r.format !== 'emberwake-replay-v1' || r.rulesVersion !== RULES_VERSION)
    throw new Error('Unsupported save or rules version.');
  if (typeof r.seed !== 'string' || r.seed.length > 100 || typeof r.hero !== 'string')
    throw new Error('Invalid hero or seed.');
  if (!Array.isArray(r.commands) || r.commands.length > 50000)
    throw new Error('Invalid command history.');
  const content = validateContent(r.content);
  let session = newSession(r.seed, r.hero, content);
  let ticks = 0;
  for (const command of r.commands as unknown[]) {
    if (!validCommand(command)) throw new Error('Malformed replay command.');
    if (command.type === 'advance') ticks += command.ticks;
    if (ticks > 100000) throw new Error('Save exceeds the simulation limit.');
    const next = dispatch(session, command);
    if (next.error) throw new Error(`Rejected replay command: ${next.error}`);
    session = next.session;
  }
  return session;
}
