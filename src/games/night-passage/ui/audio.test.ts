import { afterEach, expect, test, vi } from 'vitest';
import { applyCommand, createGame } from '../domain/game';
import { combatSounds, PassageAudio } from './audio';

function scene() {
  return applyCommand(createGame('audio-feedback'), { type: 'start', weapon: 'sword', runes: [] })
    .state;
}
function damage() {
  const before = scene(),
    after = structuredClone(before);
  after.tick++;
  after.enemies[0].hp -= 5;
  return { before, after };
}

test('confirmed damage prioritizes danger while coalescing impacts, preserving snapshots and rejecting restore noise', () => {
  const { before, after } = damage();
  after.player.hp -= 10;
  after.enemies[1].hp -= 10;
  after.player.dashCooldown = 48;
  const saved = JSON.stringify([before, after]);
  expect(combatSounds(before, after)).toEqual([{ kind: 'hurt' }, { kind: 'hit', weapon: 'sword' }]);
  expect(JSON.stringify([before, after])).toBe(saved);
  after.kills++;
  expect(combatSounds(before, after)).toEqual([
    { kind: 'hurt' },
    { kind: 'kill', weapon: 'sword' },
  ]);
  after.phase = 'reward';
  expect(combatSounds(before, after)).toEqual([{ kind: 'hurt' }, { kind: 'clear' }]);
  after.phase = 'lost';
  after.player.hp = 0;
  expect(combatSounds(before, after)).toEqual([{ kind: 'down' }]);
  expect(combatSounds(after, structuredClone(after))).toEqual([]);
  for (const changed of [{ seed: 'other' }, { runNumber: 99 }, { region: 1 }, { chamber: 2 }])
    expect(combatSounds(before, { ...after, ...changed })).toEqual([]);
  expect(combatSounds({ ...before, phase: 'hub' }, after)).toEqual([]);
});

test('blocked damage and idle frames are silent; dash remains distinct without an impact', () => {
  const before = scene(),
    after = structuredClone(before);
  after.tick++;
  expect(combatSounds(before, after)).toEqual([]);
  after.player.dashCooldown = 48;
  expect(combatSounds(before, after)).toEqual([{ kind: 'dash' }]);
});

function audioDevice() {
  const parameter = () => ({
    value: 0,
    setValueAtTime: vi.fn<(value: number, time: number) => void>(),
    linearRampToValueAtTime: vi.fn<(value: number, time: number) => void>(),
    exponentialRampToValueAtTime: vi.fn<(value: number, time: number) => void>(),
  });
  const gainNode = () => ({ gain: parameter(), connect: vi.fn(), disconnect: vi.fn() });
  class Oscillator {
    type = 'sine';
    frequency = parameter();
    onended: (() => void) | null = null;
    connect = vi.fn();
    disconnect = vi.fn();
    start = vi.fn();
    stop = vi.fn();
  }
  class Context {
    static instances: Context[] = [];
    currentTime = 0;
    state = 'running';
    destination = {};
    oscillators: Oscillator[] = [];
    gains: ReturnType<typeof gainNode>[] = [];
    resume = vi.fn(() => Promise.resolve());
    close = vi.fn(() => {
      this.state = 'closed';
      return Promise.resolve();
    });
    constructor() {
      Context.instances.push(this);
    }
    createGain() {
      const gain = gainNode();
      this.gains.push(gain);
      return gain;
    }
    createOscillator() {
      const node = new Oscillator();
      this.oscillators.push(node);
      return node;
    }
  }
  vi.stubGlobal('AudioContext', Context);
  return Context;
}
afterEach(() => {
  vi.unstubAllGlobals();
});

test('incoming damage bypasses rapid-hit throttling; repeated snapshots stay silent and mute cancels live voices', async () => {
  const Context = audioDevice(),
    audio = new PassageAudio();
  await audio.start();
  const context = Context.instances[0],
    { before, after } = damage();
  audio.update(before, after);
  expect(context.oscillators).toHaveLength(2);
  audio.update(before, after);
  expect(context.oscillators).toHaveLength(2);
  context.currentTime = 0.01;
  const hurt = structuredClone(after);
  hurt.tick++;
  hurt.enemies[0].hp--;
  hurt.player.hp -= 10;
  audio.update(after, hurt);
  expect(context.oscillators).toHaveLength(4); // Danger plays, the second rapid impact does not.
  audio.mute();
  expect(context.gains[0].gain.value).toBe(0);
  for (const node of context.oscillators) {
    expect(node.stop).toHaveBeenLastCalledWith(0.01);
    expect(node.disconnect).toHaveBeenCalledOnce();
  }
  audio.update(after, structuredClone(hurt));
  expect(context.oscillators).toHaveLength(4);
  await audio.start();
  const resumed = structuredClone(hurt);
  resumed.tick++;
  resumed.enemies[0].hp--;
  audio.update(hurt, resumed);
  expect(context.oscillators).toHaveLength(6);
  audio.close();
  audio.close();
  expect(context.close).toHaveBeenCalledOnce();
  expect(context.gains[0].disconnect).toHaveBeenCalledOnce();
});

test('voice budget evicts lower priority sounds and close prevents a pending resume from reviving audio', async () => {
  const Context = audioDevice(),
    audio = new PassageAudio();
  await audio.start();
  const context = Context.instances[0];
  for (let i = 0; i < 10; i++) {
    context.currentTime = i * 0.05;
    const { before, after } = damage();
    after.tick += i;
    audio.update(before, after);
  }
  const live = () => context.oscillators.filter((node) => node.disconnect.mock.calls.length === 0);
  expect(live()).toHaveLength(12); // Six two-tone impact voices; stale callbacks have not fired yet.
  const { before, after } = damage();
  after.player.hp -= 5;
  audio.update(before, after);
  expect(live()).toHaveLength(12);
  expect(
    live()
      .slice(-2)
      .map((node) => node.frequency.setValueAtTime.mock.calls[0][0]),
  ).toEqual([130, 65]);
  let resume!: () => void;
  context.resume.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        resume = resolve;
      }),
  );
  const pending = audio.start();
  audio.close();
  resume();
  await pending;
  audio.update(before, structuredClone(after));
  expect(live()).toHaveLength(0);
});

test('unavailable audio remains inert without mutating combat state', async () => {
  vi.stubGlobal(
    'AudioContext',
    class {
      constructor() {
        throw new Error('No audio device');
      }
    },
  );
  const audio = new PassageAudio(),
    { before, after } = damage();
  const saved = JSON.stringify([before, after]);
  await audio.start();
  expect(() => {
    audio.update(before, after);
    audio.mute();
    audio.close();
  }).not.toThrow();
  expect(JSON.stringify([before, after])).toBe(saved);
});
