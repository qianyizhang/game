import { describe, expect, it } from 'vitest';
import { BASE_CONTENT } from './content';
import { applyCommand, createGame, validateContent } from './game';
import { currentWorld } from './world';
import { findPath, walkable } from './maps';
import { dispatch, exportSession, importSession, newSession } from '../application/session';

const portal = (region: string, id: string) =>
  BASE_CONTENT.regions.find((r) => r.id === region)!.portals.find((p) => p.id === id)!;
describe('persistent regions and dungeon stairs', () => {
  it('retains floor loot, enemies, wards and exploration through stairs, waypoints and return portals', () => {
    let state = applyCommand(createGame('stairs', 'barbarian'), { type: 'travel', act: 0 }).state;
    state.player = { ...state.player, ...portal('fen-1', 'descent').at };
    const before = structuredClone(state);
    state = applyCommand(state, { type: 'use-portal', id: 'descent' }).state;
    expect(state.region).toBe('fen-3');
    expect(before.worlds['fen-3'].visited).toBe(false);
    expect(state.worlds['fen-3'].visited).toBe(true);
    expect(state.worlds['fen-2']).toEqual(before.worlds['fen-2']);
    const world = currentWorld(state);
    world.enemies[0].hp = 0;
    world.chests[0] = true;
    world.drops.push({ uid: 99999, kind: 'gold', amount: 23, x: 27, y: 8 });
    const persistent = structuredClone(world);
    state.player = { ...state.player, ...portal('fen-3', 'down').at };
    state = applyCommand(state, { type: 'interact' }).state;
    expect(state.region).toBe('fen-4');
    expect(applyCommand(state, { type: 'use-portal', id: 'down' }).accepted).toBe(false);
    state.player = { ...state.player, ...portal('fen-4', 'down').at };
    expect(applyCommand(state, { type: 'interact' }).error).toContain('wards');
    state.player = { ...state.player, ...portal('fen-4', 'up').at };
    state = applyCommand(state, { type: 'interact' }).state;
    expect(state.region).toBe('fen-3');
    expect({ ...currentWorld(state), seen: [], revealOrigin: 0 }).toEqual({
      ...persistent,
      seen: [],
      revealOrigin: 0,
    });
    expect(currentWorld(state).seen).toEqual(expect.arrayContaining(persistent.seen));
    currentWorld(state).enemies = [];
    state = applyCommand(state, { type: 'portal' }).state;
    expect(state.portal?.region).toBe('fen-3');
    const at = { x: state.player.x, y: state.player.y };
    state = applyCommand(state, { type: 'return' }).state;
    expect(state.region).toBe('fen-3');
    expect(state.player.x).toBe(at.x);
    state.player = { ...state.player, ...BASE_CONTENT.regions[2].waypoint! };
    state = applyCommand(state, { type: 'interact' }).state;
    expect(state.location).toBe('town');
    state = applyCommand(state, { type: 'travel', act: 0, region: 'fen-3' }).state;
    expect(state.region).toBe('fen-3');
    expect(currentWorld(state).chests[0]).toBe(true);
  });
  it('uses dynamic dimensions and preserves earlier snapshots without copying inactive regions', () => {
    const before = applyCommand(createGame('isolation', 'barbarian'), {
      type: 'travel',
      act: 0,
    }).state;
    const snapshot = structuredClone(before);
    const next = applyCommand(before, { type: 'advance', ticks: 2 }).state;
    expect(before).toEqual(snapshot);
    expect(next.worlds['salt-1']).toBe(before.worlds['salt-1']);
    expect(currentWorld(next)).not.toBe(currentWorld(before));
    expect(currentWorld(next).tiles).toBe(currentWorld(before).tiles);
    expect(currentWorld(next).tiles).toHaveLength(48);
    expect(currentWorld(next).tiles[0]).toHaveLength(72);
    const destination = portal('fen-1', 'grove').at;
    expect(destination.x).toBeGreaterThan(41);
    expect(findPath(currentWorld(next), next.player, destination).length).toBeGreaterThan(40);
    expect(walkable(currentWorld(next), { x: 22.5, y: 21.5 })).toBe(false);
  });
  it('rejects broken connections, circular ward gates and missing dungeon floors before play', () => {
    for (const damage of [
      (c: typeof BASE_CONTENT) => {
        c.regions[0].portals[0].arrival = 'missing';
      },
      (c: typeof BASE_CONTENT) => {
        c.regions[0].portals[0].requires = 'wards';
      },
      (c: typeof BASE_CONTENT) => {
        c.dungeons[0].floors.reverse();
      },
      (c: typeof BASE_CONTENT) => {
        c.regions[0].portals[0].target = 'salt-1';
      },
      (c: typeof BASE_CONTENT) => {
        c.regions[0].width = 999;
      },
    ]) {
      const pack = structuredClone(BASE_CONTENT);
      damage(pack);
      expect(() => validateContent(pack)).toThrow();
    }
  });
  it('keeps 100 ms content cooldown semantics with 50 ms ticks and rejects demo histories', () => {
    let session = newSession('clock', 'sorceress');
    session = dispatch(session, { type: 'travel', act: 0 }).session;
    session = dispatch(session, {
      type: 'cast',
      skill: 'firebolt',
      target: { x: 12.5, y: 23.5 },
    }).session;
    const cooldown = session.state.player.cooldowns.firebolt;
    session = dispatch(session, { type: 'advance', ticks: 2 }).session;
    expect(session.state.player.cooldowns.firebolt).toBe(cooldown - 1);
    expect(importSession(exportSession(session)).state).toEqual(session.state);
    const demo = { ...session.replay, format: 'emberwake-replay-v1', rulesVersion: 'emberwake-1' };
    expect(() => importSession(JSON.stringify(demo))).toThrow('Unsupported');
  });
});
