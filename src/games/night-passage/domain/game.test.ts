import { expect, test } from 'vitest';
import { dispatch, exportSession, importSession, newSession } from '../application/session';
import { spawnEnemy } from './encounters';
import { applyCommand, createGame } from './game';
import type { Command, Input } from './types';

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
test('rejected actions preserve identity, resources and randomness; death banks earned ash only once', () => {
  const hub = createGame('accounting');
  expect(applyCommand(hub, { type: 'start', weapon: 'sword', runes: ['fury'] }).state).toBe(hub);
  const active = applyCommand(hub, { type: 'start', weapon: 'sword', runes: ['vigor'] }).state;
  for (const command of [
    { type: 'choose', id: 'storm-attack' },
    { type: 'buy', item: 'heart' },
    { type: 'return' },
  ] satisfies Command[])
    expect(applyCommand(active, command).state).toBe(active);
  expect(applyCommand(active, { type: 'frame', input: { ...idle, x: NaN }, ticks: 1 }).state).toBe(
    active,
  );
  active.earnedAsh = 18;
  const lost = applyCommand(active, { type: 'retire' }).state;
  const banked = applyCommand(lost, { type: 'return' }).state;
  expect(banked.profile).toMatchObject({ ash: 18, runs: 1, wins: 0 });
  expect(applyCommand(banked, { type: 'return' }).state).toBe(banked);
  const trained = applyCommand(banked, { type: 'train' }).state;
  expect(trained.profile).toMatchObject({ ash: 3, vitality: 1 });
});

test('dodge avoids a resolving strike, and cast recovery follows simulation time', () => {
  const state = applyCommand(createGame('dodge'), {
    type: 'start',
    weapon: 'sword',
    runes: ['focus'],
  }).state;
  state.enemies = [];
  state.room.pillars = [];
  state.room.hazards = [];
  spawnEnemy(state, 'brute', { x: state.player.x + 60, y: state.player.y });
  state.enemies[0].windup = 1;
  state.enemies[0].target = { x: state.player.x, y: state.player.y };
  state.player.invulnerable = 0;
  const hit = applyCommand(state, { type: 'frame', input: idle, ticks: 1 }).state;
  const dodged = applyCommand(state, {
    type: 'frame',
    input: { ...idle, dash: true },
    ticks: 1,
  }).state;
  expect(hit.player.hp).toBe(state.player.hp - 14);
  expect(dodged.player.hp).toBe(state.player.hp);
  const casting = applyCommand(state, {
    type: 'frame',
    input: { ...idle, aim: Math.PI, cast: true },
    ticks: 1,
  }).state;
  expect(casting.player.casts).toBe(2);
  casting.enemies[0].cooldown = 1000;
  const after120 = applyCommand(casting, { type: 'frame', input: idle, ticks: 120 }).state;
  const after179 = applyCommand(after120, { type: 'frame', input: idle, ticks: 59 }).state;
  expect(after179.player.casts).toBe(2);
  expect(applyCommand(after179, { type: 'frame', input: idle, ticks: 1 }).state.player.casts).toBe(
    3,
  );
});

test('a buffered attack fires after recovery without holding the button', () => {
  let state = applyCommand(createGame('buffer'), {
    type: 'start',
    weapon: 'fists',
    runes: [],
  }).state;
  state.enemies = [];
  state.room.pillars = [];
  state.room.hazards = [];
  spawnEnemy(state, 'brute', { x: state.player.x + 50, y: state.player.y });
  state.enemies[0].cooldown = 1000;
  state.player.recovery = 5;
  state = applyCommand(state, { type: 'frame', input: { ...idle, attack: true }, ticks: 1 }).state;
  state = applyCommand(state, { type: 'frame', input: idle, ticks: 10 }).state;
  expect(state.enemies[0].hp).toBe(132);
});

test('lethal combat ends the passage, freezes further frames, and returns earned ash to the quay', () => {
  const state = applyCommand(createGame('death'), {
    type: 'start',
    weapon: 'sword',
    runes: [],
  }).state;
  state.enemies = [];
  state.room.pillars = [];
  state.room.hazards = [];
  state.player.hp = 1;
  state.player.invulnerable = 0;
  state.earnedAsh = 8;
  spawnEnemy(state, 'brute', { x: state.player.x + 60, y: state.player.y });
  state.enemies[0].windup = 1;
  state.enemies[0].target = { x: state.player.x, y: state.player.y };
  const lost = applyCommand(state, { type: 'frame', input: idle, ticks: 30 }).state;
  expect(lost.phase).toBe('lost');
  expect(lost.tick).toBe(1);
  expect(lost.player.hp).toBe(0);
  expect(applyCommand(lost, { type: 'frame', input: idle, ticks: 1 }).state).toBe(lost);
  const home = applyCommand(lost, { type: 'return' }).state;
  expect(home.profile).toMatchObject({ ash: 8, runs: 1, wins: 0 });
  const next = applyCommand(home, { type: 'start', weapon: 'bow', runes: [] }).state;
  expect(next.player.hp).toBe(120);
  expect(next.player.boons).toEqual([]);
  expect(next.runNumber).toBe(2);
});

test('chronicles reconstruct timing, loadout, retirement and progression; malformed histories fail', () => {
  let session = newSession('replay');
  const commands: Command[] = [
    { type: 'start', weapon: 'bow', runes: ['focus', 'vigor'] },
    ...Array.from({ length: 100 }, (): Command => ({
      type: 'frame',
      input: { ...idle, aim: -Math.PI / 2, attack: true },
      ticks: 2,
    })),
    { type: 'retire' },
    { type: 'return' },
    { type: 'start', weapon: 'shield', runes: ['fleet'] },
  ];
  for (const command of commands) {
    const next = dispatch(session, command);
    expect(next.error).toBeNull();
    session = next.session;
  }
  expect(session.journal!.length).toBeLessThan(10);
  expect(importSession(exportSession(session)).state).toEqual(session.state);
  expect(() =>
    importSession(exportSession(session).replace('night-passage-3', 'night-passage-2')),
  ).toThrow('Unsupported');
  expect(() => importSession(exportSession(session).replace('[120,', '[999999999,'))).toThrow();
  const rejected = dispatch(session, { type: 'choose', id: 'winter-call' });
  expect(rejected.session).toBe(session);
});
