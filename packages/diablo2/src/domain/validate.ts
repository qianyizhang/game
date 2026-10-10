import type { Content } from './types';
import { findPath, tilesFor, walkable, WIDTH, HEIGHT } from './maps';
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected an object');
  return value as Record<string, unknown>;
}
function list(value: unknown, max = 100): unknown[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > max)
    throw new Error('Invalid content list');
  return value as unknown[];
}
function string(value: unknown): asserts value is string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 2000)
    throw new Error('Invalid content text');
}
function number(value: unknown, min = 0, max = 10000): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new Error('Invalid content number');
}
function one(value: unknown, choices: string[]): void {
  if (typeof value !== 'string' || !choices.includes(value))
    throw new Error('Unknown content kind');
}
function point(value: unknown): void {
  const p = object(value);
  number(p.x, 1, WIDTH - 2);
  number(p.y, 1, HEIGHT - 2);
}
const elements = ['physical', 'fire', 'cold', 'poison'];
/** Parse JSON-only definitions. Mods replace this pack; identity/version pin replay meaning. */
export function validateContent(value: unknown): Content {
  const c = object(value);
  string(c.id);
  string(c.version);
  for (const key of ['heroes', 'skills', 'items', 'monsters', 'maps']) {
    const ids = new Set<string>();
    for (const entry of list(c[key], key === 'maps' ? 12 : 100)) {
      const v = object(entry);
      string(v.id);
      if (
        !/^[a-z][a-z0-9-]{0,63}$/.test(v.id) ||
        ['constructor', 'prototype'].includes(v.id) ||
        ids.has(v.id)
      )
        throw new Error(`Duplicate or invalid ${key} ID`);
      ids.add(v.id);
      string(v.name);
    }
  }
  for (const entry of list(c.skills)) {
    const v = object(entry);
    string(v.description);
    one(v.effect, ['projectile', 'nova', 'melee', 'leap', 'summon', 'curse']);
    one(v.element, elements);
    one(v.scaling, ['strength', 'energy']);
    if (typeof v.pierce !== 'boolean') throw new Error('Invalid piercing flag');
    number(v.slow, 0, 100);
    for (const k of ['damage', 'mana', 'range', 'radius'])
      number(v[k], 0, k === 'range' || k === 'radius' ? 15 : 1000);
    number(v.cooldown, 1, 1000);
    number(v.level, 1, 20);
  }
  for (const entry of list(c.heroes)) {
    const v = object(entry);
    string(v.className);
    one(v.attack, ['melee', 'ranged']);
    string(v.description);
    string(v.weapon);
    string(v.color);
    if (!/^#[a-f\d]{6}$/i.test(v.color)) throw new Error('Use hex colors');
    number(v.hp, 1, 2000);
    number(v.mana, 1, 2000);
    const a = object(v.attributes);
    for (const k of ['strength', 'dexterity', 'vitality', 'energy']) number(a[k], 1, 100);
    for (const id of list(v.skills, 3)) string(id);
  }
  for (const entry of list(c.items)) {
    const v = object(entry);
    one(v.slot, ['weapon', 'armor', 'charm']);
    for (const k of ['damage', 'armor']) number(v[k], 0, 100);
    number(v.width, 1, 8);
    number(v.height, 1, 4);
    if (!Number.isInteger(v.width) || !Number.isInteger(v.height))
      throw new Error('Item dimensions must be integers');
  }
  for (const entry of list(c.monsters)) {
    const v = object(entry);
    number(v.hp, 1, 10000);
    number(v.damage, 1, 1000);
    number(v.speed, 0.1, 5);
    number(v.range, 0.5, 10);
    one(v.element, elements);
    one(v.shape, ['beast', 'skeleton', 'cultist', 'demon']);
    one(v.pattern, ['melee', 'ranged', 'nova', 'summoner']);
    number(v.hazardRadius, 0.5, 5);
    string(v.color);
    if (!/^#[a-f\d]{6}$/i.test(v.color)) throw new Error('Use hex colors');
    const resist = object(v.resist);
    for (const [k, n] of Object.entries(resist)) {
      one(k, elements);
      number(n, 0, 0.75);
    }
  }
  for (const entry of list(c.maps, 12)) {
    const v = object(entry);
    for (const k of ['subtitle', 'introduction', 'conclusion', 'objective', 'boss']) string(v[k]);
    one(v.theme, ['marsh', 'desert', 'crypt', 'inferno']);
    for (const k of ['start', 'waypoint', 'exit', 'bossPosition']) point(v[k]);
    for (const k of ['seals', 'chests']) for (const p of list(v[k], 8)) point(p);
    for (const m of list(v.monsters)) string(m);
    for (const room of list(v.rooms, 30)) {
      if (!Array.isArray(room) || room.length !== 4) throw new Error('Invalid room rectangle');
      const r = room as unknown[];
      number(r[0], 1, WIDTH - 2);
      number(r[1], 1, HEIGHT - 2);
      number(r[2], 1, WIDTH - 2);
      number(r[3], 1, HEIGHT - 2);
      if (!r.every(Number.isInteger) || r[0] > r[2] || r[1] > r[3])
        throw new Error('Invalid room bounds');
    }
  }
  const content = JSON.parse(JSON.stringify(value)) as Content;
  const ids = (key: 'skills' | 'items' | 'monsters') => new Set(content[key].map((v) => v.id));
  for (const h of content.heroes) {
    if (
      h.skills.length !== 3 ||
      new Set(h.skills).size !== 3 ||
      h.skills.some((id) => !ids('skills').has(id)) ||
      !ids('items').has(h.weapon) ||
      content.items.find((i) => i.id === h.weapon)?.slot !== 'weapon'
    )
      throw new Error('Hero needs three valid skills and a weapon');
    if (content.skills.find((s) => s.id === h.skills[0])?.level !== 1)
      throw new Error('First skill must unlock at level 1');
  }
  for (const m of content.maps) {
    if (!ids('monsters').has(m.boss) || m.monsters.some((id) => !ids('monsters').has(id)))
      throw new Error('Unknown map monster');
    const world = { tiles: tilesFor(m) };
    for (const p of [m.waypoint, m.exit, m.bossPosition, ...m.seals, ...m.chests])
      if (
        !walkable(world, m.start) ||
        !walkable(world, p) ||
        findPath(world, m.start, p).length === 0
      )
        throw new Error(`Unreachable objective in ${m.id}`);
  }
  return content;
}
