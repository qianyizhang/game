import { isList, isRecord } from '../../../shared/json';
import { CONTENT_VERSION } from '../domain/content';
import { applyCommand, createGame, RULES_VERSION, validCommand } from '../domain/game';
import type { Command, State } from '../domain/types';

export const SAVE_KEY = 'card-workshop.night-passage.v1';
export const MAX_COMMANDS = 300_000;
export const MAX_TICKS = 864_000;
interface Journal {
  command: Command;
  previous: Journal | null;
  length: number;
}
export interface Session {
  state: State;
  journal: Journal | null;
  ticks: number;
}
export function newSession(seed = 'a-light-in-the-dark'): Session {
  if (!seed || seed.length > 120) throw new Error('Seed must contain 1–120 characters.');
  return { state: createGame(seed), journal: null, ticks: 0 };
}
function append(session: Session, command: Command, state: State): Session {
  const last = session.journal;
  // Persistent linked entries avoid copying an entire realtime input history every frame.
  // Adjacent identical inputs are packed into at most two-second commands.
  const merge =
    last?.command.type === 'frame' &&
    command.type === 'frame' &&
    last.command.ticks + command.ticks <= 120 &&
    JSON.stringify(last.command.input) === JSON.stringify(command.input);
  const packed: Command =
    merge && last?.command.type === 'frame' && command.type === 'frame'
      ? structuredClone({ ...command, ticks: last.command.ticks + command.ticks })
      : structuredClone(command);
  return {
    state,
    ticks: session.ticks + (command.type === 'frame' ? command.ticks : 0),
    journal: {
      command: packed,
      previous: merge ? last.previous : last,
      length: (last?.length ?? 0) + (merge ? 0 : 1),
    },
  };
}
export function dispatch(
  session: Session,
  command: Command,
): { session: Session; error: string | null } {
  if (!validCommand(command)) return { session, error: 'Malformed action.' };
  if (
    (session.journal?.length ?? 0) >= MAX_COMMANDS ||
    session.ticks + (command.type === 'frame' ? command.ticks : 0) > MAX_TICKS
  )
    return {
      session,
      error: 'This chronicle reached its replay limit. Export it and begin a new chronicle.',
    };
  const next = applyCommand(session.state, command);
  return next.error
    ? { session, error: next.error }
    : { session: append(session, command, next.state), error: null };
}
export function exportSession(session: Session): string {
  const commands: (Command | number[])[] = [];
  for (let node = session.journal; node; node = node.previous) {
    const c = node.command;
    if (c.type === 'frame') {
      const i = c.input;
      const buttons =
        Number(i.attack) |
        (Number(i.special) << 1) |
        (Number(i.dash) << 2) |
        (Number(i.cast) << 3) |
        (Number(i.call) << 4);
      commands.push([c.ticks, i.x, i.y, i.aim, buttons]);
    } else commands.push(c);
  }
  commands.reverse();
  return JSON.stringify({
    format: 'night-passage-replay-v2',
    rules: RULES_VERSION,
    content: CONTENT_VERSION,
    seed: session.state.seed,
    commands,
  });
}
export function importSession(text: string): Session {
  if (text.length > 24_000_000) throw new Error('Replay exceeds 24 MB.');
  const value: unknown = JSON.parse(text);
  if (
    !isRecord(value) ||
    value.format !== 'night-passage-replay-v2' ||
    value.rules !== RULES_VERSION ||
    value.content !== CONTENT_VERSION ||
    typeof value.seed !== 'string' ||
    !isList(value.commands) ||
    value.commands.length > MAX_COMMANDS
  )
    throw new Error('Unsupported or malformed Night Passage chronicle.');
  let session = newSession(value.seed);
  for (const encoded of value.commands) {
    let command: unknown = encoded;
    if (isList(encoded)) {
      if (
        encoded.length !== 5 ||
        !encoded.every((n) => typeof n === 'number' && Number.isFinite(n))
      )
        throw new Error('Malformed packed input.');
      const [ticks, x, y, aim, mask] = encoded as number[];
      if (!Number.isInteger(mask) || mask < 0 || mask > 31)
        throw new Error('Malformed input buttons.');
      command = {
        type: 'frame',
        ticks,
        input: {
          x,
          y,
          aim,
          attack: !!(mask & 1),
          special: !!(mask & 2),
          dash: !!(mask & 4),
          cast: !!(mask & 8),
          call: !!(mask & 16),
        },
      };
    }
    if (!validCommand(command)) throw new Error('Malformed replay action.');
    const next = dispatch(session, command);
    if (next.error) throw new Error(`Invalid chronicle: ${next.error}`);
    session = next.session;
  }
  return session;
}
