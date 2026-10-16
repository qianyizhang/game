import { BASE_CONTENT } from '../domain/content';
import {
  applyCommand,
  createGame,
  RULES_VERSION,
  PREVIOUS_RULES_VERSION,
  LEGACY_RULES_VERSION,
  DIFFICULTIES,
  validCommand,
  validateContent,
} from '../domain/game';
import type { Command, Content, Difficulty, Replay, State } from '../domain/types';
import { SANDBOX_RULES_VERSION } from '../domain/sandbox';
export const SANDBOX_SAVE_KEY = 'card-workshop.emberwake.sandbox.v1';
export const ACTIVE_MODE_KEY = 'card-workshop.emberwake.active-mode';
export const saveKey = (session: Session): string =>
  session.replay.mode === 'sandbox'
    ? SANDBOX_SAVE_KEY
    : session.replay.rulesVersion === LEGACY_RULES_VERSION
      ? LEGACY_SAVE_KEY
      : session.replay.rulesVersion === PREVIOUS_RULES_VERSION
        ? PREVIOUS_SAVE_KEY
        : SAVE_KEY;
export const LEGACY_SAVE_KEY = 'card-workshop.emberwake.v2';
export const PREVIOUS_SAVE_KEY = 'card-workshop.emberwake.v3';
export const SAVE_KEY = 'card-workshop.emberwake.v4';
export interface Session {
  state: State;
  replay: Replay;
}
export function newSession(
  seed: string,
  hero: string,
  content: Content = BASE_CONTENT,
  sandbox = false,
  difficulty: Difficulty = 'standard',
  rulesVersion = RULES_VERSION,
): Session {
  const pack = validateContent(content);
  return {
    state: createGame(seed, hero, pack, sandbox, difficulty, rulesVersion),
    replay: {
      format:
        sandbox || rulesVersion === LEGACY_RULES_VERSION
          ? 'emberwake-replay-v2'
          : rulesVersion === PREVIOUS_RULES_VERSION
            ? 'emberwake-replay-v3'
            : 'emberwake-replay-v4',
      ...(!sandbox && rulesVersion !== LEGACY_RULES_VERSION ? { difficulty } : {}),
      rulesVersion: sandbox ? SANDBOX_RULES_VERSION : rulesVersion,
      ...(sandbox ? { mode: 'sandbox' as const } : {}),
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
  recordCommand(commands, command);
  return { session: { state: result.state, replay: { ...session.replay, commands } }, error: null };
}
/** Own nested payloads and pack adjacent ticks for both live and reconstructed journals. */
function recordCommand(commands: Command[], command: Command): void {
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
  const sandbox = r.mode === 'sandbox';
  const legacy = !sandbox && r.rulesVersion === LEGACY_RULES_VERSION;
  const previous = !sandbox && r.rulesVersion === PREVIOUS_RULES_VERSION;
  if (
    (r.mode !== undefined && !sandbox) ||
    (sandbox
      ? r.format !== 'emberwake-replay-v2' || r.rulesVersion !== SANDBOX_RULES_VERSION
      : legacy
        ? r.format !== 'emberwake-replay-v2'
        : r.format !== (previous ? 'emberwake-replay-v3' : 'emberwake-replay-v4') ||
          (!previous && r.rulesVersion !== RULES_VERSION) ||
          typeof r.difficulty !== 'string' ||
          !Object.hasOwn(DIFFICULTIES, r.difficulty))
  )
    throw new Error('Unsupported save or rules version.');
  if (typeof r.seed !== 'string' || r.seed.length > 100 || typeof r.hero !== 'string')
    throw new Error('Invalid hero or seed.');
  if (!Array.isArray(r.commands) || r.commands.length > 50000)
    throw new Error('Invalid command history.');
  const content = validateContent(r.content);
  const session = newSession(
    r.seed,
    r.hero,
    content,
    sandbox,
    legacy || sandbox ? 'standard' : (r.difficulty as Difficulty),
    legacy ? LEGACY_RULES_VERSION : previous ? PREVIOUS_RULES_VERSION : RULES_VERSION,
  );
  let state = session.state;
  const commands: Command[] = [];
  let ticks = 0;
  for (const command of r.commands as unknown[]) {
    if (!validCommand(command)) throw new Error('Malformed replay command.');
    if (command.type === 'advance') ticks += command.ticks;
    if (ticks > 100000) throw new Error('Save exceeds the simulation limit.');
    const next = applyCommand(state, command, session.replay.content);
    if (!next.accepted) throw new Error(`Rejected replay command: ${next.error}`);
    state = next.state;
    recordCommand(commands, command);
  }
  return { state, replay: { ...session.replay, commands } };
}
