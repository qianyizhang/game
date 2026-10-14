import { expect, test } from 'vitest';
import { applyCommand, createGame } from './game';
import { passageScore } from './score';

test('only combat clears and escape score; kills, safe stops and waiting cannot farm points', () => {
  const state = applyCommand(createGame('score-contract', 'night-passage-4'), {
    type: 'start',
    weapon: 'sword',
    runes: [],
  }).state;
  // Explicit score scenarios isolate accounting from combat tactics and procedural generation.
  state.roomsCleared = 3;
  expect(passageScore(state)).toEqual({
    version: 'night-passage-score-1',
    value: 300,
    combatClears: 3,
    escaped: false,
  });
  state.chamber = 5;
  state.kills = 900;
  state.gold = 500;
  state.tick = 800_000;
  state.phase = 'shop';
  expect(passageScore(state).value).toBe(300);
  state.phase = 'won';
  expect(passageScore(state)).toMatchObject({ value: 10_300, escaped: true });
  state.phase = 'lost';
  expect(passageScore(state)).toMatchObject({ value: 300, escaped: false });
});

test('returning and starting again cannot carry a previous passage score forward', () => {
  const ended = createGame('score-lifecycle', 'night-passage-4');
  ended.phase = 'won';
  ended.roomsCleared = 26;
  expect(passageScore(ended).value).toBe(12_600);
  const hub = applyCommand(ended, { type: 'return' }).state;
  expect(passageScore(hub)).toMatchObject({ value: 0, combatClears: 0, escaped: false });
  const restarted = applyCommand(hub, { type: 'start', weapon: 'bow', runes: [] }).state;
  expect(passageScore(restarted).value).toBe(0);
});

test('new escape score rewards executed finishing time without rewarding a quick failure', () => {
  const state = createGame('speed-score');
  state.phase = 'won';
  state.roomsCleared = 20;
  state.tick = 18000;
  expect(passageScore(state)).toMatchObject({
    value: 13333,
    speedBonus: 1333,
    finishingTicks: 18000,
  });
  state.tick = 36000;
  expect(passageScore(state)).toMatchObject({ value: 13000, speedBonus: 1000 });
  state.tick = 72000;
  expect(passageScore(state)).toMatchObject({ value: 12666, speedBonus: 666 });
  state.phase = 'lost';
  state.tick = 0;
  expect(passageScore(state)).toMatchObject({ value: 2000, speedBonus: 0 });
});
