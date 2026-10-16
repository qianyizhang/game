import { isRecord, isList } from '../../../shared/json';
import { DIRECTIONS, GENERATOR_VERSION } from '../../../shared/layout/layout';
import { RELICS } from '../domain/content';
import {
  applyCommand,
  createGame,
  DIFFICULTIES,
  RULES_VERSION,
  LEGACY_RULES_VERSION,
  type Difficulty,
  type Command,
  type State,
} from '../domain/game';

export const SAVE_KEY = 'card-workshop.cartographer.v2';
export const LEGACY_SAVE_KEY = 'card-workshop.cartographer.v1';
export const ACTIVE_SAVE_KEY = 'card-workshop.cartographer.active-save';
export const saveKey = (session: Session): string =>
  session.replay.rules === LEGACY_RULES_VERSION ? LEGACY_SAVE_KEY : SAVE_KEY;
export interface Replay {
  format: 'cartographer-replay-v1' | 'cartographer-replay-v2';
  rules: typeof RULES_VERSION | typeof LEGACY_RULES_VERSION;
  difficulty?: Difficulty;
  generator: typeof GENERATOR_VERSION;
  seed: string;
  commands: Command[];
}
export interface Session {
  state: State;
  replay: Replay;
}
export function newSession(
  seed: string,
  difficulty: Difficulty = 'standard',
  rulesVersion: typeof RULES_VERSION | typeof LEGACY_RULES_VERSION = RULES_VERSION,
): Session {
  return {
    state: createGame(seed, difficulty, rulesVersion),
    replay: {
      format:
        rulesVersion === LEGACY_RULES_VERSION ? 'cartographer-replay-v1' : 'cartographer-replay-v2',
      rules: rulesVersion,
      ...(rulesVersion === RULES_VERSION ? { difficulty } : {}),
      generator: GENERATOR_VERSION,
      seed,
      commands: [],
    },
  };
}
export function validCommand(v: unknown): v is Command {
  if (!isRecord(v)) return false;
  switch (v.type) {
    case 'move':
    case 'explore':
      return DIRECTIONS.some((d) => d === v.direction);
    case 'strike':
    case 'shove':
    case 'flare':
      return typeof v.target === 'number' && Number.isInteger(v.target) && v.target > 0;
    case 'draft':
      return (
        typeof v.offer === 'number' &&
        Number.isInteger(v.offer) &&
        v.offer >= 0 &&
        v.offer < 4 &&
        [0, 1, 2, 3].some((r) => r === v.rotation)
      );
    case 'relic':
      return RELICS.some((r) => r.id === v.id);
    case 'brace':
    case 'cancel-draft':
      return true;
    default:
      return false;
  }
}
export function dispatch(
  session: Session,
  command: Command,
): { session: Session; error: string | null } {
  if (!validCommand(command)) return { session, error: 'Malformed action.' };
  if (session.replay.commands.length >= 12000)
    return {
      session,
      error: 'This expedition reached its 12,000-action limit. Export it or start a new run.',
    };
  const result = applyCommand(session.state, command);
  return result.error
    ? { session, error: result.error }
    : {
        session: {
          state: result.state,
          replay: {
            ...session.replay,
            commands: [...session.replay.commands, structuredClone(command)],
          },
        },
        error: null,
      };
}
export const exportSession = (session: Session): string => JSON.stringify(session.replay);
export function importSession(text: string): Session {
  if (text.length > 1_000_000) throw new Error('Replay exceeds 1 MB.');
  const r: unknown = JSON.parse(text);
  if (
    !isRecord(r) ||
    (r.rules === LEGACY_RULES_VERSION
      ? r.format !== 'cartographer-replay-v1'
      : r.rules !== RULES_VERSION ||
        r.format !== 'cartographer-replay-v2' ||
        typeof r.difficulty !== 'string' ||
        !Object.hasOwn(DIFFICULTIES, r.difficulty)) ||
    r.generator !== GENERATOR_VERSION ||
    typeof r.seed !== 'string' ||
    !isList(r.commands) ||
    r.commands.length > 12000
  )
    throw new Error('Unsupported or malformed Cartographer replay.');
  let session = newSession(
    r.seed,
    r.rules === LEGACY_RULES_VERSION ? 'standard' : (r.difficulty as Difficulty),
    r.rules as typeof RULES_VERSION | typeof LEGACY_RULES_VERSION,
  );
  // Reconstruct directly to avoid repeatedly copying the growing journal.
  const commands: Command[] = [];
  for (const command of r.commands) {
    if (!validCommand(command)) throw new Error('Malformed replay command.');
    const next = applyCommand(session.state, command);
    if (next.error) throw new Error(`Rejected replay command: ${next.error}`);
    session = { ...session, state: next.state };
    commands.push(structuredClone(command));
  }
  session.replay.commands = commands;
  return session;
}
