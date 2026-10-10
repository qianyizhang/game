import { expect, it } from 'vitest';
import { BASE_CONTENT } from './content';
import { stats } from './stats';
import { bodyFits, lineOfSight } from './maps';
import { currentWorld } from './world';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  saveKey,
  SAVE_KEY,
  SANDBOX_SAVE_KEY,
} from '../application/session';
import type { Command } from './types';

it('sandbox journeys jump through all regions and objective pads, cast all hero skills, and reconstruct exactly', () => {
  for (const hero of BASE_CONTENT.heroes) {
    let session = newSession('sandbox-journey', hero.id, BASE_CONTENT, true);
    const act = (command: Command) => {
      const result = dispatch(session, command);
      expect(result.error).toBeNull();
      session = result.session;
    };
    expect(saveKey(session)).toBe(SANDBOX_SAVE_KEY);
    expect(session.state.player.level).toBe(20);
    expect(Object.values(session.state.player.skills)).toEqual([10, 10, 10]);
    for (const region of BASE_CONTENT.regions) {
      for (const landing of [
        'entrance',
        ...(region.ward ? ['ward'] : []),
        ...(region.boss ? ['boss'] : []),
      ] as ('entrance' | 'ward' | 'boss')[]) {
        act({ type: 'dev-jump', region: region.id, landing, reset: true });
        expect(session.state.region).toBe(region.id);
        expect(bodyFits(currentWorld(session.state), session.state.player)).toBe(true);
      }
    }
    act({ type: 'dev-jump', region: 'fen-1', landing: 'entrance', reset: true });
    act({ type: 'dev-corpses' });
    for (const id of hero.skills) {
      const p = session.state.player,
        world = currentWorld(session.state);
      const target = [
        { x: p.x + 2, y: p.y },
        { x: p.x - 2, y: p.y },
        { x: p.x, y: p.y + 2 },
      ].find((at) => bodyFits(world, at) && lineOfSight(world, p, at))!;
      act({ type: 'cast', skill: id, target });
      act({ type: 'dev-refill' });
    }
    act({ type: 'run', enabled: true });
    act({ type: 'steer', direction: { x: 1, y: 0 } });
    act({ type: 'advance', ticks: 50 });
    expect(session.state.player.hp).toBe(stats(session.state, BASE_CONTENT).maxHp);
    expect(session.state.player.mana).toBe(stats(session.state, BASE_CONTENT).maxMana);
    expect(session.state.player.stamina).toBe(100);
    act({ type: 'dev-options', god: false, reveal: false });
    expect(session.state.sandbox).toEqual({ god: false, reveal: false });
    act({ type: 'dev-jump', region: 'furnace-5', landing: 'boss', reset: true });
    act({ type: 'advance', ticks: 50 });
    act({ type: 'advance', ticks: 50 });
    expect(session.state.player.hp).toBeLessThan(stats(session.state, BASE_CONTENT).maxHp);
    expect(importSession(exportSession(session))).toEqual(session);
  }
});

it('campaigns reject developer commands and forged sandbox histories without changing resources or RNG', () => {
  const normal = newSession('campaign', 'barbarian');
  expect(saveKey(normal)).toBe(SAVE_KEY);
  for (const command of [
    { type: 'dev-jump', region: 'furnace-5', landing: 'boss', reset: true },
    { type: 'dev-refill' },
    { type: 'dev-corpses' },
    { type: 'dev-options', god: true, reveal: true },
  ] as const) {
    const before = structuredClone(normal);
    expect(dispatch(normal, command).session).toBe(normal);
    expect(normal).toEqual(before);
  }
  const sandbox = newSession('campaign', 'barbarian', BASE_CONTENT, true);
  const forged = { ...sandbox.replay, mode: undefined };
  expect(() => importSession(JSON.stringify(forged))).toThrow(/rules version/);
  const bad = dispatch(sandbox, {
    type: 'dev-jump',
    region: 'fen-1',
    landing: 'boss',
    reset: true,
  });
  expect(bad.error).toMatch(/arrival pad/);
  expect(bad.session).toBe(sandbox);
});
