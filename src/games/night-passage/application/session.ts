import { isList, isRecord } from '../../../shared/json';
import { contentVersion, supportedContract, type RulesVersion } from '../domain/contracts';
import { applyCommand, createGame, RULES_VERSION, validCommand } from '../domain/game';
import type { Command, State } from '../domain/types';
import {
  controlConfig,
  CONTROL_VERSION,
  type ControlConfig,
  type ControlPreset,
} from './control-settings';

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
  controller?: { version: typeof CONTROL_VERSION; preset: ControlPreset; config: ControlConfig };
}
export function newSession(
  seed = 'a-light-in-the-dark',
  rules: RulesVersion = RULES_VERSION,
): Session {
  if (!seed || seed.length > 120) throw new Error('Seed must contain 1–120 characters.');
  return { state: createGame(seed, rules), journal: null, ticks: 0 };
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
    ...(session.controller ? { controller: session.controller } : {}),
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
    rules: session.state.rulesVersion,
    content: contentVersion(session.state.rulesVersion),
    seed: session.state.seed,
    commands,
    ...(session.state.rulesVersion !== 'night-passage-4' ? { score: 'night-passage-score-2' } : {}),
    ...(session.controller ? { controller: session.controller } : {}),
  });
}
export function importSession(text: string): Session {
  if (text.length > 24_000_000) throw new Error('Replay exceeds 24 MB.');
  const value: unknown = JSON.parse(text);
  if (
    !isRecord(value) ||
    value.format !== 'night-passage-replay-v2' ||
    !supportedContract(value.rules, value.content) ||
    typeof value.seed !== 'string' ||
    !isList(value.commands) ||
    value.commands.length > MAX_COMMANDS
  )
    throw new Error('Unsupported or malformed Night Passage chronicle.');
  let session = newSession(value.seed, value.rules);
  if (
    value.score !== undefined &&
    value.score !==
      (value.rules === 'night-passage-4' ? 'night-passage-score-1' : 'night-passage-score-2')
  )
    throw new Error('Unsupported score identity.');
  if (value.controller !== undefined) {
    const c = value.controller;
    if (
      !isRecord(c) ||
      c.version !== CONTROL_VERSION ||
      !['light', 'standard', 'heavy'].includes(String(c.preset)) ||
      !isRecord(c.config)
    )
      throw new Error('Malformed controller identity.');
    const configValue = c.config;
    const number = (key: keyof ControlConfig): number => {
      const value = configValue[key];
      if (typeof value !== 'number') throw new Error('Malformed controller configuration.');
      return value;
    };
    session.controller = {
      version: CONTROL_VERSION,
      preset: c.preset as ControlPreset,
      config: controlConfig(c.preset as ControlPreset, {
        observationTicks: number('observationTicks'),
        reactionTicks: number('reactionTicks'),
        workPerTick: number('workPerTick'),
        holdTicks: number('holdTicks'),
        switchTicks: number('switchTicks'),
        aimRadiansPerTick: number('aimRadiansPerTick'),
      }),
    };
  }
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
