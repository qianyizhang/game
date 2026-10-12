import { expect, test } from 'vitest';
import { CHAMBER_LAYOUTS } from './chamber-content';
import { applyCommand, createGame } from './game';
import { distance } from './geometry';
import type { Input } from './types';

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

test('forks announce distinct terrain, avoid the current layout and reject invalid travel atomically', () => {
  for (const layout of CHAMBER_LAYOUTS) {
    const state = applyCommand(createGame(`route-${layout.id}`), {
      type: 'start',
      weapon: 'sword',
      runes: [],
    }).state;
    // Controlled last-wave state exercises the actual clear/reward/route boundary.
    state.room.layout = layout.id;
    state.enemies = [];
    const cleared = applyCommand(state, { type: 'frame', input: idle, ticks: 1 }).state;
    const routed = applyCommand(cleared, { type: 'choose', id: cleared.offers[0] }).state;
    expect(routed.phase).toBe('route');
    const ids = routed.routes.map((route) => route.layout);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(layout.id);
    expect(ids).not.toContain(undefined);
    expect(applyCommand(routed, { type: 'travel', index: 99 }).state).toBe(routed);
    for (const [index, route] of routed.routes.entries()) {
      const definition = CHAMBER_LAYOUTS.find((item) => item.id === route.layout)!;
      expect(route.detail).toContain(definition.name);
      const traveled = applyCommand(routed, { type: 'travel', index }).state;
      expect(traveled.room.layout).toBe(definition.id);
      expect(traveled.room.pillars).toEqual(definition.pillars);
      expect(traveled.room.hazards.map(({ x, y, offset }) => ({ x, y, offset }))).toEqual(
        definition.hazards,
      );
      expect(traveled).toEqual(applyCommand(routed, { type: 'travel', index }).state);
    }
  }
});

test('reinforcements preserve terrain and enter away from the player in every layout', () => {
  for (const layout of CHAMBER_LAYOUTS) {
    const state = applyCommand(createGame(`waves-${layout.id}`), {
      type: 'start',
      weapon: 'bow',
      runes: [],
    }).state;
    state.region = 3;
    state.phase = 'route';
    state.routes = [{ reward: 'trial', layout: layout.id, label: 'Trial', detail: '' }];
    const room = applyCommand(state, { type: 'travel', index: 0 }).state;
    for (const position of layout.spawns) {
      const before = structuredClone(room);
      before.enemies = [];
      Object.assign(before.player, position);
      const after = applyCommand(before, { type: 'frame', input: idle, ticks: 1 }).state;
      expect(after.room).toEqual({ ...before.room, wave: before.room.wave + 1 });
      expect(after.enemies).toHaveLength(5);
      for (const enemy of after.enemies) {
        expect(distance(enemy, after.player)).toBeGreaterThanOrEqual(140);
        for (const pillar of after.room.pillars)
          expect(distance(enemy, pillar)).toBeGreaterThan(enemy.radius + pillar.radius);
      }
    }
  }
});

test('safe stops and guardian arenas do not inherit ordinary terrain', () => {
  for (const reward of ['shop', 'fountain', 'boon'] as const) {
    const state = applyCommand(createGame('special-room'), {
      type: 'start',
      weapon: 'sword',
      runes: [],
    }).state;
    state.phase = 'route';
    if (reward === 'boon') state.chamber = 6;
    state.routes = [{ reward, label: 'Next', detail: '' }];
    const next = applyCommand(state, { type: 'travel', index: 0 }).state;
    expect(next.room.layout).toBeUndefined();
    expect(next.room.pillars).toEqual([]);
    expect(next.room.boss).toBe(reward === 'boon');
    expect(next.room.hazards).toHaveLength(reward === 'boon' ? 2 : 0);
  }
});
