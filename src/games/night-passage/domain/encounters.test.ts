import { expect, test } from 'vitest';
import { applyCommand, createGame } from './game';
import { spawnEnemy } from './encounters';
import { attackShapes, threatens } from './threats';
import type { Hazard, Input, Point } from './types';

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
function scene(region: number, pattern: number, player: Point) {
  const state = applyCommand(createGame('threat-contract'), {
    type: 'start',
    weapon: 'sword',
    runes: [],
  }).state;
  state.region = region;
  state.room.pillars = [];
  state.room.hazards = [];
  state.enemies = [];
  Object.assign(state.player, player, { hp: 500, maxHp: 500, invulnerable: 0 });
  spawnEnemy(state, 'boss', { x: 480, y: 200 });
  Object.assign(state.enemies[0], { aim: 0, pattern, windup: 1, target: { x: 480, y: 350 } });
  return state;
}

test.each([
  {
    name: 'Bellwarden facing sweep',
    region: 0,
    pattern: 0,
    hit: { x: 590, y: 200 },
    safe: { x: 360, y: 200 },
  },
  {
    name: 'Undertow charge lane',
    region: 1,
    pattern: 0,
    hit: { x: 650, y: 200 },
    safe: { x: 650, y: 290 },
  },
  {
    name: 'Undertow hollow tidal ring',
    region: 1,
    pattern: 2,
    hit: { x: 650, y: 200 },
    safe: { x: 480, y: 220 },
  },
  {
    name: 'Regent crossed fire lanes',
    region: 2,
    pattern: 0,
    hit: { x: 600, y: 350 },
    safe: { x: 600, y: 450 },
  },
  {
    name: 'Sovereign targeted starfall',
    region: 3,
    pattern: 1,
    hit: { x: 480, y: 350 },
    safe: { x: 100, y: 100 },
  },
])(
  '$name: announced geometry agrees with resolving damage and preserves its safe space',
  ({ region, pattern, hit, safe }) => {
    for (const [point, damage] of [
      [hit, 17 + region * 3],
      [safe, 0],
    ] as const) {
      const state = scene(region, pattern, point);
      expect(attackShapes(state.enemies[0], region).some((shape) => threatens(shape, point))).toBe(
        damage > 0,
      );
      const result = applyCommand(state, { type: 'frame', input: idle, ticks: 1 });
      expect(result.error).toBeNull();
      expect(result.state.player.hp).toBe(500 - damage);
      if (region === 1 && pattern === 0) expect(result.state.enemies[0].x).toBeCloseTo(820);
    }
  },
);

test('final guardian emits a full wheel, with no unannounced direct damage', () => {
  const state = scene(3, 3, { x: 800, y: 500 });
  const next = applyCommand(state, { type: 'frame', input: idle, ticks: 1 }).state;
  expect(next.projectiles).toHaveLength(16);
  expect(next.player.hp).toBe(500);
  expect(next.enemies[0].pattern).toBe(4);
});

test.each(['thorns', 'tide', 'flame', 'void'] as const)(
  '%s hazard has a warning interval, distinct consequence, and dodge escape',
  (kind) => {
    const state = scene(0, 0, { x: 500, y: 350 });
    state.enemies[0].windup = 0;
    state.enemies[0].cooldown = 1000;
    const hazard: Hazard = { x: 480, y: 350, radius: 46, offset: 0, kind };
    state.room.hazards = [hazard];
    state.tick = 200;
    expect(applyCommand(state, { type: 'frame', input: idle, ticks: 1 }).state.player.hp).toBe(500);
    state.tick = kind === 'flame' ? 259 : 239;
    const next = applyCommand(state, { type: 'frame', input: idle, ticks: 1 }).state;
    expect(next.player.hp).toBe(500 - (kind === 'flame' ? 17 : kind === 'tide' ? 7 : 10));
    if (kind === 'thorns') expect(next.player.hindered).toBe(45);
    if (kind === 'tide') expect(next.player.x).toBe(505);
    if (kind === 'void') expect(next.player.x).toBe(498.5);
    expect(
      applyCommand(state, { type: 'frame', input: { ...idle, dash: true }, ticks: 1 }).state.player
        .hp,
    ).toBe(500);
  },
);
