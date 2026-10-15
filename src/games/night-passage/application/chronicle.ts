import { isList, isRecord } from '../../../shared/json';
import { contentVersion, supportedContract, type RulesVersion } from '../domain/contracts';
import { applyCommand, createGame, RULES_VERSION, validCommand } from '../domain/game';
import type { Command, State, StateView, ReadonlyValue } from '../domain/types';
import {
  controlConfig,
  CONTROL_VERSION,
  type ControlConfig,
  type ControlPreset,
} from './control-settings';

const MAX_COMMANDS = 300_000;
const MAX_TICKS = 864_000;
interface Journal {
  readonly command: Command;
  readonly previous: Journal | null;
  readonly length: number;
}
export interface ControllerIdentity {
  version: typeof CONTROL_VERSION;
  preset: ControlPreset;
  config: ControlConfig;
}
interface History {
  journal: Journal | null;
  ticks: number;
  controller?: ReadonlyValue<ControllerIdentity>;
}
const histories = new WeakMap<Chronicle, History>();
const chronicleIdentity: unique symbol = Symbol('Chronicle');
export interface Chronicle {
  readonly [chronicleIdentity]: true;
  readonly state: StateView;
  /** Maximum legal next frame request, including phase and both replay limits. */
  readonly frameTicks: number;
}

/** Publish plain state graphs once; callers cannot alter authoritative nested values. */
export function immutable<T>(value: T): ReadonlyValue<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) immutable(child);
    Object.freeze(value);
  }
  return value as ReadonlyValue<T>;
}
function history(chronicle: Chronicle): History {
  const value = histories.get(chronicle);
  if (!value) throw new Error('Unknown chronicle.');
  return value;
}
function publish(state: State, value: History): Chronicle {
  const chronicle: Chronicle = Object.freeze({
    [chronicleIdentity]: true as const,
    state: immutable(state),
    frameTicks:
      state.phase === 'combat' && (value.journal?.length ?? 0) < MAX_COMMANDS
        ? Math.min(120, MAX_TICKS - value.ticks)
        : 0,
  });
  histories.set(chronicle, value);
  return chronicle;
}
function controllerIdentity(value: unknown): ReadonlyValue<ControllerIdentity> {
  if (
    !isRecord(value) ||
    value.version !== CONTROL_VERSION ||
    !['light', 'standard', 'heavy'].includes(String(value.preset)) ||
    !isRecord(value.config)
  )
    throw new Error('Malformed controller identity.');
  const config = value.config;
  const number = (key: keyof ControlConfig): number => {
    if (typeof config[key] !== 'number') throw new Error('Malformed controller configuration.');
    return config[key];
  };
  const preset = value.preset as ControlPreset;
  return immutable({
    version: CONTROL_VERSION,
    preset,
    config: controlConfig(preset, {
      observationTicks: number('observationTicks'),
      reactionTicks: number('reactionTicks'),
      workPerTick: number('workPerTick'),
      holdTicks: number('holdTicks'),
      switchTicks: number('switchTicks'),
      aimRadiansPerTick: number('aimRadiansPerTick'),
    }),
  });
}
export function createChronicle(
  seed = 'a-light-in-the-dark',
  rules: RulesVersion = RULES_VERSION,
  controller?: ControllerIdentity,
): Chronicle {
  if (!seed || seed.length > 120) throw new Error('Seed must contain 1–120 characters.');
  return publish(createGame(seed, rules), {
    journal: null,
    ticks: 0,
    ...(controller ? { controller: controllerIdentity(controller) } : {}),
  });
}
function append(chronicle: Chronicle, command: Command, state: State): Chronicle {
  const previous = history(chronicle);
  const last = previous.journal;
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
  return publish(state, {
    ...(previous.controller ? { controller: previous.controller } : {}),
    ticks: previous.ticks + (command.type === 'frame' ? command.ticks : 0),
    journal: {
      command: packed,
      previous: merge ? last.previous : last,
      length: (last?.length ?? 0) + (merge ? 0 : 1),
    },
  });
}
export function dispatch(
  chronicle: Chronicle,
  command: unknown,
): { chronicle: Chronicle; error: string | null } {
  const previous = history(chronicle);
  if (!validCommand(command)) return { chronicle, error: 'Malformed action.' };
  if (
    (previous.journal?.length ?? 0) >= MAX_COMMANDS ||
    previous.ticks + (command.type === 'frame' ? command.ticks : 0) > MAX_TICKS
  )
    return {
      chronicle,
      error: 'This chronicle reached its replay limit. Export it and begin a new chronicle.',
    };
  const next = applyCommand(chronicle.state, command);
  return next.error !== null
    ? { chronicle, error: next.error }
    : { chronicle: append(chronicle, command, next.state), error: null };
}
export function exportChronicle(chronicle: Chronicle): string {
  const previous = history(chronicle);
  const commands: (Command | number[])[] = [];
  for (let node = previous.journal; node; node = node.previous) {
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
    rules: chronicle.state.rulesVersion,
    content: contentVersion(chronicle.state.rulesVersion),
    seed: chronicle.state.seed,
    commands,
    ...(chronicle.state.rulesVersion !== 'night-passage-4'
      ? { score: 'night-passage-score-2' }
      : {}),
    ...(previous.controller ? { controller: previous.controller } : {}),
  });
}
export function restoreChronicle(text: string): Chronicle {
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
  let chronicle = createChronicle(
    value.seed,
    value.rules,
    value.controller === undefined ? undefined : controllerIdentity(value.controller),
  );
  if (
    value.score !== undefined &&
    value.score !==
      (value.rules === 'night-passage-4' ? 'night-passage-score-1' : 'night-passage-score-2')
  )
    throw new Error('Unsupported score identity.');
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
    const next = dispatch(chronicle, command);
    if (next.error) throw new Error(`Invalid chronicle: ${next.error}`);
    chronicle = next.chronicle;
  }
  return chronicle;
}

/** Ordered accepted commands for isolated playback; linked journal nodes never escape. */
export function recordedCommands(chronicle: Chronicle): readonly ReadonlyValue<Command>[] {
  const commands: Command[] = [];
  for (let node = history(chronicle).journal; node; node = node.previous)
    commands.push(structuredClone(node.command));
  return immutable(commands.reverse());
}
