import { expect, test } from 'vitest';
import {
  createChronicle,
  dispatch,
  exportChronicle,
  recordedCommands,
  restoreChronicle,
  type ControllerIdentity,
} from './chronicle';
import { controlConfig, CONTROL_VERSION } from './control-settings';
import { observeChronicle } from './agent';
import type { Command, Input } from '../domain/types';

const idle: Input = {
  x: 0,
  y: 0,
  aim: 0,
  attack: false,
  special: false,
  dash: false,
  cast: false,
  call: false,
};
const start: Command = { type: 'start', weapon: 'bow', runes: [] };

test('chronicles own nested state, accepted payloads and controller identity; trials cannot commit', () => {
  const controller: ControllerIdentity = {
    version: CONTROL_VERSION,
    preset: 'standard' as const,
    config: controlConfig('standard'),
  };
  const before = createChronicle('ownership', undefined, controller);
  const command: Command = { type: 'start', weapon: 'bow', runes: ['vigor'] };
  const initial = exportChronicle(before);
  const next = dispatch(before, command).chronicle;
  const encoded = exportChronicle(next);
  command.runes.push('fleet');
  controller.config.holdTicks++;
  expect(Reflect.set(next.state.player, 'hp', 1_000_000)).toBe(false);
  expect(Reflect.set(next.state.profile.unlockedRunes, '0', 'fury')).toBe(false);
  expect(Reflect.set(next, 'frameTicks', 0)).toBe(false);
  const replay = recordedCommands(next);
  expect(Reflect.set(replay[0], 'weapon', 'sword')).toBe(false);
  expect(exportChronicle(next)).toBe(encoded);
  expect(exportChronicle(before)).toBe(initial);
  const snapshot = structuredClone(next.state);
  observeChronicle(next);
  dispatch(next, { type: 'frame', input: idle, ticks: 1 });
  expect(next.state).toEqual(snapshot);
  expect(exportChronicle(next)).toBe(encoded);
  expect(dispatch(next, { type: 'travel', index: 0 }).chronicle).toBe(next);
  expect(restoreChronicle(encoded).state).toEqual(next.state);
  expect(exportChronicle(restoreChronicle(encoded))).toBe(encoded);
});

test.each(['night-passage-4', 'night-passage-5'] as const)(
  'canonical %s bytes survive restoration and input packing',
  (rules) => {
    const legacy = rules === 'night-passage-4';
    const commands = [start, [120, 0, 0, 0, 0], [1, 0, 0, 0, 0]];
    const text = JSON.stringify({
      format: 'night-passage-replay-v2',
      rules,
      content: legacy ? 'night-passage-content-3' : 'night-passage-content-4',
      seed: 'compatibility',
      commands,
      ...(!legacy ? { score: 'night-passage-score-2' } : {}),
    });
    const restored = restoreChronicle(text);
    expect(exportChronicle(restored)).toBe(text);
    let current = dispatch(createChronicle('compatibility', rules), start).chronicle;
    for (let n = 0; n < 121; n++)
      current = dispatch(current, { type: 'frame', ticks: 1, input: idle }).chronicle;
    expect(exportChronicle(current)).toBe(text);
  },
);

// Exercise the actual production limits with generated legal histories, not writable internals
// or a public arbitrary-state constructor. No large replay fixture is committed.
test('full journal rejects even a mergeable frame and advertises no legal actions', () => {
  let current = createChronicle('journal-capacity');
  for (let n = 0; n < 99_999; n++) {
    current = dispatch(current, start).chronicle;
    current = dispatch(current, { type: 'retire' }).chronicle;
    current = dispatch(current, { type: 'return' }).chronicle;
  }
  current = dispatch(current, start).chronicle;
  current = dispatch(current, { type: 'frame', input: idle, ticks: 1 }).chronicle;
  const frame: Command = { type: 'frame', input: { ...idle, aim: 1 }, ticks: 1 };
  current = dispatch(current, frame).chronicle;
  expect(current.state.phase).toBe('combat');
  expect(current.frameTicks).toBe(0);
  const rejected = dispatch(current, frame);
  expect(rejected.chronicle).toBe(current);
  expect(rejected.error).toContain('replay limit');
  const observation = observeChronicle(current);
  expect(observation.frame).toBeNull();
  expect(observation.legalActions).toEqual([]);
}, 30_000);

test('requested ticks cap the next frame even when earlier frames ended combat early', () => {
  let current = createChronicle('tick-capacity');
  let requested = 0;
  const combat = () => {
    if (current.state.phase !== 'hub' && current.state.phase !== 'combat') {
      if (current.state.phase !== 'lost' && current.state.phase !== 'won')
        current = dispatch(current, { type: 'retire' }).chronicle;
      current = dispatch(current, { type: 'return' }).chronicle;
    }
    if (current.state.phase === 'hub') current = dispatch(current, start).chronicle;
  };
  while (requested < 864_000 - 3) {
    combat();
    const ticks = Math.min(120, 864_000 - 3 - requested);
    const next = dispatch(current, { type: 'frame', ticks, input: idle });
    if (next.error) throw new Error(next.error);
    current = next.chronicle;
    requested += ticks;
  }
  combat();
  expect(current.frameTicks).toBe(3);
  expect(observeChronicle(current).frame?.ticks.max).toBe(3);
  expect(dispatch(current, { type: 'frame', ticks: 4, input: idle }).chronicle).toBe(current);
  current = dispatch(current, { type: 'frame', ticks: 3, input: idle }).chronicle;
  expect(current.frameTicks).toBe(0);
  expect(dispatch(current, { type: 'frame', ticks: 1, input: idle }).error).toContain(
    'replay limit',
  );
}, 30_000);
