import { expect, test } from 'vitest';
import { createChronicle, dispatch, exportChronicle, restoreChronicle } from './chronicle';
import { openLiveChronicle, type ChronicleStore } from './live-chronicle';
import type { Command, Input } from '../domain/types';

const start: Command = { type: 'start', weapon: 'bow', runes: ['vigor'] };
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
function storage(initial: string | null = null) {
  let bytes = initial;
  let readsFail = false,
    writesFail = false;
  const writes: string[] = [];
  const store: ChronicleStore = {
    read() {
      if (readsFail) throw new Error('read denied');
      return bytes;
    },
    write(text) {
      if (writesFail) throw new Error('write denied');
      bytes = text;
      writes.push(text);
    },
  };
  return {
    store,
    writes,
    bytes: () => bytes,
    denyRead: () => {
      readsFail = true;
    },
    denyWrite: (fail: boolean) => {
      writesFail = fail;
    },
  };
}

test('unreadable bytes survive play and failed imports; replacement retains recovery until persistence succeeds', () => {
  const disk = storage('unreadable\noriginal bytes');
  const live = openLiveChronicle(disk.store);
  expect(live.snapshot()).toMatchObject({
    status: 'protected',
    protection: 'unreadable',
    original: disk.bytes(),
  });
  live.dispatch(start, 0);
  live.dispatch({ type: 'frame', ticks: 12, input: idle }, 4000);
  live.flush();
  const before = live.snapshot();
  expect(live.importReplay('{bad').error).not.toBeNull();
  expect(live.snapshot()).toEqual(before);
  expect(disk.writes).toHaveLength(0);
  const replacement = exportChronicle(createChronicle('valid-replacement'));
  disk.denyWrite(true);
  expect(live.importReplay(replacement).error).toBeNull();
  expect(live.snapshot()).toMatchObject({
    status: 'write-failed',
    protection: null,
    original: 'unreadable\noriginal bytes',
  });
  expect(live.exportReplay()).toBe(replacement);
  expect(disk.bytes()).toBe('unreadable\noriginal bytes');
  disk.denyWrite(false);
  expect(live.flush()).toMatchObject({ status: 'saved', original: null });
  expect(disk.bytes()).toBe(replacement);
});

test('a denied read cannot authorize overwriting an unknown save; explicit replacement can', () => {
  const disk = storage('unseen bytes');
  disk.denyRead();
  const live = openLiveChronicle(disk.store);
  expect(live.snapshot()).toMatchObject({ protection: 'read-failed', original: null });
  live.dispatch(start, 10);
  live.flush();
  expect(disk.bytes()).toBe('unseen bytes');
  expect(live.replaceUnreadable().error).toBeNull();
  expect(restoreChronicle(disk.bytes()!).state.phase).toBe('hub');
  expect(live.snapshot()).toMatchObject({ status: 'saved', protection: null });
});

test('reset validates first, requests original/current backups before replacement, and aborts on request failure', () => {
  const disk = storage('original');
  const live = openLiveChronicle(disk.store);
  live.dispatch(start, 0);
  const before = live.exportReplay();
  const backups: { text: string; name: string }[] = [];
  const download = (text: string, name: string) => {
    expect(live.exportReplay()).toBe(before);
    expect(disk.bytes()).toBe('original');
    backups.push({ text, name });
  };
  expect(live.reset('', download).error).toContain('Seed');
  expect(backups).toHaveLength(0);
  expect(
    live.reset('new', () => {
      throw new Error('request failed');
    }).error,
  ).toBe('request failed');
  expect(live.exportReplay()).toBe(before);
  expect(live.snapshot().protection).toBe('unreadable');
  expect(live.reset('new', download).error).toBeNull();
  expect(backups).toEqual([
    { text: 'original', name: 'night-passage-unreadable.json' },
    { text: before, name: 'night-passage.json' },
  ]);
  expect(restoreChronicle(disk.bytes()!).state.seed).toBe('new');
});

test('live cadence saves decisions, elapsed combat, phase transitions and explicit flush without committing rejected commands', () => {
  const disk = storage();
  const live = openLiveChronicle(disk.store);
  live.dispatch(start, 0);
  expect(disk.writes).toHaveLength(1);
  live.dispatch({ type: 'frame', ticks: 1, input: idle }, 3000);
  expect(disk.writes).toHaveLength(1);
  expect(live.snapshot().status).toBe('unsaved');
  live.dispatch({ type: 'frame', ticks: 1, input: idle }, 3001);
  expect(disk.writes).toHaveLength(2);
  const saved = disk.bytes();
  expect(live.dispatch({ type: 'return' }, 4000).error).not.toBeNull();
  expect(disk.bytes()).toBe(saved);
  expect(live.snapshot().status).toBe('saved');
  live.dispatch({ type: 'frame', ticks: 1, input: idle }, 4000);
  live.flush();
  expect(restoreChronicle(disk.bytes()!).state.tick).toBe(3);
  live.flush();
  expect(disk.writes).toHaveLength(3);
  // The first frame that ends combat must save even inside the interval.
  let prior = live.snapshot().state.phase;
  for (let n = 0; n < 100 && prior === 'combat'; n++) {
    live.dispatch({ type: 'frame', ticks: 120, input: idle }, 4001);
    const phase = live.snapshot().state.phase;
    if (phase !== prior)
      expect(restoreChronicle(disk.bytes()!).state).toEqual(live.snapshot().state);
    prior = phase;
  }
  expect(prior).toBe('lost');
});

test('failed ordinary writes preserve accepted progress and retry through the same flush path', () => {
  const initial = exportChronicle(createChronicle('write-failure'));
  const disk = storage(initial);
  const live = openLiveChronicle(disk.store);
  disk.denyWrite(true);
  live.dispatch(start, 0);
  expect(live.snapshot().status).toBe('write-failed');
  expect(disk.bytes()).toBe(initial);
  const frame: Command = { type: 'frame', ticks: 1, input: idle };
  live.dispatch(frame, 10);
  expect(live.snapshot().status).toBe('write-failed');
  const expected = exportChronicle(
    dispatch(dispatch(restoreChronicle(initial), start).chronicle, frame).chronicle,
  );
  expect(live.exportReplay()).toBe(expected);
  disk.denyWrite(false);
  live.flush();
  expect(disk.bytes()).toBe(expected);
  expect(live.snapshot().status).toBe('saved');
});
