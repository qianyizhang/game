import { expect, test } from 'vitest';
import { applyCommand, createGame, offerBoons } from './game';
import { boon } from './content';
import { hit, rawHit } from './effects';
import { spawnEnemy } from './encounters';
import type { GodId, Input } from './types';

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
function scene() {
  const state = applyCommand(createGame('build-contracts'), {
    type: 'start',
    weapon: 'sword',
    runes: [],
  }).state;
  state.enemies = [];
  state.room.hazards = [];
  state.room.pillars = [];
  spawnEnemy(state, 'brute', { x: 540, y: 470 });
  state.enemies[0].cooldown = 1000;
  return state;
}

test('god rewards offer three unique eligible choices; capped duos cannot consume an upgrade reward', () => {
  const state = scene();
  for (let n = 0; n < 40; n++) {
    offerBoons(state);
    expect(new Set(state.offers).size).toBe(3);
    expect(state.offers.every((id) => boon(id).slot !== 'duo')).toBe(true);
  }
  state.player.boons = [
    { id: 'storm-attack', level: 5 },
    { id: 'winter-cast', level: 5 },
    { id: 'conductor', level: 1 },
  ];
  state.rewardReturn = 'shop';
  offerBoons(state, true);
  expect(state.phase).toBe('shop');
  expect(state.offers).toEqual([]);
  expect(state.gold).toBe(45);
});

test('replacing a patron removes a dependent duo; upgrading an occupied blessing preserves the other slots', () => {
  const state = scene();
  state.phase = 'reward';
  state.offers = ['tide-cast', 'storm-attack', 'veil-call'];
  state.player.boons = [
    { id: 'storm-attack', level: 1 },
    { id: 'winter-cast', level: 1 },
    { id: 'conductor', level: 1 },
  ];
  const replaced = applyCommand(state, { type: 'choose', id: 'tide-cast' }).state;
  expect(replaced.player.boons).toEqual([
    { id: 'storm-attack', level: 1 },
    { id: 'tide-cast', level: 1 },
  ]);
  const upgraded = applyCommand(state, { type: 'choose', id: 'storm-attack' }).state;
  expect(upgraded.player.boons).toEqual([
    { id: 'storm-attack', level: 2 },
    { id: 'winter-cast', level: 1 },
    { id: 'conductor', level: 1 },
  ]);
});

// Isolated hit ordering catches synergy failures that a winning campaign can conceal.
test('lightning chains on a killing blow; the conductor hits two chilled targets without recursive chains', () => {
  const state = scene();
  state.player.boons = [
    { id: 'storm-attack', level: 1 },
    { id: 'winter-cast', level: 1 },
    { id: 'conductor', level: 1 },
  ];
  state.enemies[0].hp = 1;
  spawnEnemy(state, 'brute', { x: 600, y: 430 });
  spawnEnemy(state, 'brute', { x: 600, y: 510 });
  state.enemies[1].chill = state.enemies[2].chill = 60;
  hit(state, state.enemies[0], 100, 'storm', 1, 0, state.player);
  expect(state.enemies.map((e) => e.hp)).toEqual([0, 119, 119]);
  expect(state.kills).toBe(1);
  expect(state.player.charge).toBeCloseTo(53 * 0.075);
});

test('tidal hits erupt on burning targets, while ordinary tidal damage and wall damage remain separate', () => {
  const state = scene();
  state.player.boons = [
    { id: 'tide-attack', level: 1 },
    { id: 'cinder-cast', level: 1 },
    { id: 'steam', level: 1 },
  ];
  state.enemies[0].burn = 100;
  hit(state, state.enemies[0], 20, 'tide', 1, 0, state.player);
  expect(state.enemies[0].hp).toBe(98); // 145 - 23 base - 24 steam, away from walls.
  expect(state.enemies[0].x).toBe(586);
  rawHit(state, state.enemies[0], 10000);
  expect(state.player.charge).toBeCloseTo(145 * 0.075); // Overkill cannot fill the meter.
});

test.each([
  { god: 'storm', shots: 1 },
  { god: 'tide', shots: 3 },
  { god: 'cinder', shots: 1 },
  { god: 'winter', shots: 5 },
  { god: 'veil', shots: 0 },
] satisfies { god: GodId; shots: number }[])(
  '$god cast has its own delivery and consumes exactly one charge',
  ({ god, shots }) => {
    const state = scene();
    state.enemies[0].x = 850;
    state.player.boons = [{ id: `${god}-cast`, level: 1 }];
    const next = applyCommand(state, {
      type: 'frame',
      input: { ...idle, cast: true },
      ticks: 15,
    }).state;
    expect(next.player.casts).toBe(2);
    expect(next.projectiles).toHaveLength(shots);
    if (god === 'veil') expect(next.player.x).toBeCloseTo(606);
    if (god === 'cinder') expect(next.projectiles[0].blast).toBe(90);
    if (god === 'storm') expect(next.projectiles[0].pierce).toBe(2);
  },
);

test('calls require both a boon and full charge; starting one spends the meter', () => {
  const state = scene();
  state.player.charge = 100;
  expect(
    applyCommand(state, { type: 'frame', input: { ...idle, call: true }, ticks: 1 }).state.player
      .charge,
  ).toBe(100);
  state.player.boons = [{ id: 'winter-call', level: 1 }];
  const next = applyCommand(state, {
    type: 'frame',
    input: { ...idle, call: true },
    ticks: 1,
  }).state;
  expect(next.player.charge).toBe(0);
  expect(next.player.strike?.action).toBe('call');
});

test('market purchases conserve gold, heal within the cap, and reject repeat or unaffordable purchases', () => {
  const state = scene();
  state.phase = 'shop';
  state.gold = 140;
  state.player.hp = 1;
  const healed = applyCommand(state, { type: 'buy', item: 'heal' }).state;
  expect(healed.gold).toBe(105);
  expect(healed.player.hp).toBe(41);
  expect(applyCommand(healed, { type: 'buy', item: 'heal' }).state).toBe(healed);
  const heart = applyCommand(healed, { type: 'buy', item: 'heart' }).state;
  expect(heart.gold).toBe(45);
  expect(heart.player.hp).toBe(61);
  expect(heart.player.maxHp).toBe(140);
  expect(applyCommand(heart, { type: 'buy', item: 'boon' }).state).toBe(heart);
});

test('eclipse doubles burn only while its target is exposed', () => {
  const state = scene();
  state.tick = 14;
  state.player.boons = [
    { id: 'cinder-attack', level: 1 },
    { id: 'veil-cast', level: 1 },
    { id: 'eclipse', level: 1 },
  ];
  state.enemies[0].burn = 60;
  state.enemies[0].exposed = 60;
  expect(applyCommand(state, { type: 'frame', input: idle, ticks: 1 }).state.enemies[0].hp).toBe(
    139,
  );
  state.enemies[0].exposed = 0;
  expect(applyCommand(state, { type: 'frame', input: idle, ticks: 1 }).state.enemies[0].hp).toBe(
    142,
  );
});
