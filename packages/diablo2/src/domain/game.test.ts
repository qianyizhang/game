import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, stats, validateContent } from './game';
import { BASE_CONTENT } from './content';
import { newSession, dispatch, exportSession, importSession } from '../application/session';
import type { State } from './types';
function field(hero = 'barbarian'): State {
  return applyCommand(createGame('regressions', hero), { type: 'travel', act: 0 }).state;
}
describe('resource and failure contracts', () => {
  it('rejects sealed travel, malformed movement, unaffordable shop rolls, and unknown spells atomically', () => {
    const town = createGame('same-rng', 'sorceress');
    for (const command of [
      { type: 'travel', act: 3 },
      { type: 'buy', kind: 'gear' },
      { type: 'cast', skill: 'cleave', target: { x: 4, y: 5 } },
      { type: 'move', target: { x: NaN, y: 5 } },
    ] as const) {
      const before = structuredClone(town);
      const result = applyCommand(town, command);
      expect(result.accepted).toBe(false);
      expect(result.state).toBe(town);
      expect(town).toEqual(before);
    }
  });
  it('a piercing spear hits each body once, and a warded boss takes no damage', () => {
    const state = field('necromancer'),
      world = state.worlds[0];
    const enemy = world.enemies.find((e) => !e.boss)!;
    world.enemies = [enemy, world.enemies.find((e) => e.boss)!];
    enemy.x = 6;
    enemy.y = 5;
    enemy.hp = 200;
    enemy.maxHp = 200;
    enemy.cooldown = 100;
    state.player.x = 4;
    state.player.y = 5;
    const damage = Math.round(25 * stats(state, BASE_CONTENT).spell);
    let next = applyCommand(state, {
      type: 'cast',
      skill: 'bonespear',
      target: { x: 8, y: 5 },
    }).state;
    next = applyCommand(next, { type: 'advance', ticks: 8 }).state;
    expect(next.worlds[0].enemies[0].hp).toBe(200 - damage);
    const boss = world.enemies[1];
    state.player.x = boss.x - 2;
    state.player.y = boss.y;
    const cast = applyCommand(state, { type: 'cast', skill: 'bonespear', target: boss });
    expect(cast.accepted).toBe(true);
    next = applyCommand(cast.state, { type: 'advance', ticks: 8 }).state;
    expect(next.worlds[0].enemies[1].hp).toBe(boss.maxHp);
  });
  it('death stops a multi-tick advance, respawns safely, and permits grave recovery', () => {
    let state = field();
    state.player.gold = 100;
    state.player.hp = 1;
    state.player.x = 5;
    state.player.y = 5;
    state.worlds[0].enemies = [];
    state.worlds[0].hazards = [
      { uid: 999, x: 5, y: 5, radius: 2, delay: 1, damage: 1000, element: 'fire', life: 4 },
    ];
    state = applyCommand(state, { type: 'advance', ticks: 50 }).state;
    expect(state.status).toBe('dead');
    expect(state.tick).toBe(1);
    expect(state.player.gold).toBe(75);
    state = applyCommand(state, { type: 'respawn' }).state;
    expect(state.location).toBe('town');
    expect(state.player.hp).toBe(stats(state, BASE_CONTENT).maxHp);
    state = applyCommand(state, { type: 'travel', act: 0 }).state;
    state = applyCommand(state, { type: 'interact' }).state;
    expect(state.player.corpse).toBeNull();
    expect(state.player.gold).toBe(100);
  });
  it('equipping and stashing retain exactly one copy; socketing consumes one rune', () => {
    let state = createGame('inventory', 'barbarian');
    state.player.gold = 1000;
    state = applyCommand(state, { type: 'buy', kind: 'gear' }).state;
    const item = state.player.inventory[0];
    state = applyCommand(state, { type: 'stash', uid: item.uid }).state;
    expect(state.player.inventory).toHaveLength(0);
    expect(state.player.stash.map((i) => i.uid)).toEqual([item.uid]);
    state = applyCommand(state, { type: 'withdraw', uid: item.uid }).state;
    state = applyCommand(state, { type: 'equip', uid: item.uid }).state;
    const owned = [
      ...state.player.inventory,
      ...state.player.stash,
      ...Object.values(state.player.equipment),
    ];
    expect(new Set(owned.map((i) => i.uid)).size).toBe(owned.length);
    state.player.runes = 1;
    const uid = state.player.equipment.weapon!.uid;
    const damage = state.player.equipment.weapon!.damage;
    state = applyCommand(state, { type: 'socket', uid }).state;
    expect(state.player.runes).toBe(0);
    expect(state.player.equipment.weapon!.damage).toBe(damage + 4);
    expect(applyCommand(state, { type: 'socket', uid }).accepted).toBe(false);
  });
});
describe('mod and save boundaries', () => {
  it('loads a new hero and spell definition, pins the pack, and rejects impossible maps', () => {
    const pack = structuredClone(BASE_CONTENT);
    pack.id = 'test-mod';
    pack.version = '2';
    const h = structuredClone(pack.heroes[1]);
    h.id = 'stormcaller';
    h.name = 'Iona';
    const spell = structuredClone(pack.skills[3]);
    spell.id = 'storm-dart';
    spell.name = 'Storm dart';
    spell.damage = 45;
    spell.element = 'cold';
    spell.mana = 4;
    spell.slow = 40;
    spell.pierce = true;
    pack.skills.push(spell);
    h.skills[0] = spell.id;
    pack.heroes.push(h);
    const boss = structuredClone(pack.monsters.find((m) => m.id === 'briar')!);
    boss.id = 'mod-guardian';
    boss.name = 'The Thorn Herald';
    boss.pattern = 'ranged';
    pack.monsters.push(boss);
    pack.maps[0].boss = boss.id;
    const content = validateContent(pack);
    let session = newSession('mod-seed', 'stormcaller', content);
    session = dispatch(session, { type: 'travel', act: 0 }).session;
    session = dispatch(session, {
      type: 'cast',
      skill: 'storm-dart',
      target: { x: 8, y: 5 },
    }).session;
    expect(session.state.player.mana).toBe(106);
    expect(session.state.worlds[0].projectiles[0].pierce).toBe(true);
    expect(session.state.worlds[0].projectiles[0].slow).toBe(40);
    expect(session.state.worlds[0].enemies.find((e) => e.boss)?.kind).toBe('mod-guardian');
    expect(session.state.hero).toBe('stormcaller');
    expect(importSession(exportSession(session)).state).toEqual(session.state);
    pack.maps[0].seals[0] = { x: 40, y: 28 };
    expect(() => validateContent(pack)).toThrow();
  });
  it('rejects tampered replay decisions and unknown versions without accepting a supplied snapshot', () => {
    let session = newSession('save', 'barbarian');
    session = dispatch(session, { type: 'travel', act: 0 }).session;
    session = dispatch(session, { type: 'move', target: { x: 8, y: 5 } }).session;
    session = dispatch(session, { type: 'advance', ticks: 5 }).session;
    expect(importSession(exportSession(session)).state).toEqual(session.state);
    const bad = structuredClone(session.replay);
    bad.commands.push({ type: 'travel', act: 3 });
    expect(() => importSession(JSON.stringify(bad))).toThrow('Rejected replay');
    bad.rulesVersion = 'future';
    expect(() => importSession(JSON.stringify(bad))).toThrow('Unsupported');
  });
});
