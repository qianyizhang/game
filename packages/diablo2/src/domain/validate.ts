import type { Content } from './types';
import { findPath, tilesFor, walkable } from './maps';
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
function point(value: unknown, width = 128, height = 128): void {
  const p = object(value);
  number(p.x, 1, width - 2);
  number(p.y, 1, height - 2);
}
const elements = ['physical', 'fire', 'cold', 'poison'];
/** Parse JSON-only definitions. Mods replace this pack; identity/version pin replay meaning. */
export function validateContent(value: unknown): Content {
  const c = object(value);
  string(c.id);
  string(c.version);
  for (const key of ['heroes', 'skills', 'items', 'monsters', 'acts', 'regions', 'dungeons']) {
    const ids = new Set<string>();
    for (const entry of list(c[key], key === 'acts' ? 12 : 100)) {
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
  const array = (v: unknown, max: number): unknown[] => {
    if (!Array.isArray(v) || v.length > max) throw new Error('Invalid world content list');
    return v;
  };
  for (const entry of list(c.acts, 12)) {
    const v = object(entry);
    for (const k of ['subtitle', 'introduction', 'conclusion', 'objective', 'entry', 'bossRegion'])
      string(v[k]);
    for (const id of list(v.wards, 8)) string(id);
  }
  for (const entry of list(c.dungeons)) {
    const v = object(entry);
    string(v.act);
    for (const id of list(v.floors, 12)) string(id);
  }
  for (const entry of list(c.regions)) {
    const v = object(entry);
    string(v.act);
    string(v.description);
    one(v.theme, ['marsh', 'desert', 'crypt', 'inferno']);
    number(v.width, 32, 128);
    number(v.height, 24, 128);
    if (!Number.isInteger(v.width) || !Number.isInteger(v.height))
      throw new Error('Region dimensions must be integers');
    const width = v.width,
      height = v.height;
    const at = (p: unknown) => point(p, width, height);
    at(v.start);
    for (const k of ['waypoint', 'ward', 'bossPosition']) if (v[k] !== null) at(v[k]);
    if (v.boss !== null) string(v.boss);
    if ((v.boss === null) !== (v.bossPosition === null))
      throw new Error('Boss requires a position');
    if (v.dungeon !== null) {
      string(v.dungeon);
      number(v.floor, 1, 12);
      if (!Number.isInteger(v.floor)) throw new Error('Invalid dungeon floor');
    } else if (v.floor !== null) throw new Error('Outdoor region cannot have a floor');
    number(v.encounters, 0, 60);
    if (!Number.isInteger(v.encounters)) throw new Error('Invalid encounter count');
    for (const p of array(v.chests, 8)) at(p);
    for (const m of list(v.monsters)) string(m);
    const rect = (r: unknown) => {
      if (!Array.isArray(r) || r.length !== 4) throw new Error('Invalid terrain rectangle');
      number(r[0], 1, width - 2);
      number(r[2], 1, width - 2);
      number(r[1], 1, height - 2);
      number(r[3], 1, height - 2);
      if (!r.every(Number.isInteger) || r[0] > r[2] || r[1] > r[3])
        throw new Error('Invalid terrain bounds');
    };
    for (const room of list(v.rooms, 40)) rect(room);
    for (const path of array(v.paths, 40)) {
      for (const p of list(path, 20)) at(p);
      if ((path as unknown[]).length < 2) throw new Error('Path needs two points');
    }
    for (const patch of array(v.terrain, 80)) {
      const t = object(patch);
      one(t.kind, ['water', 'lava', 'rock', 'road', 'grass', 'sand', 'moss', 'floor']);
      rect(t.bounds);
    }
    for (const landmark of array(v.landmarks, 80)) {
      const l = object(landmark);
      string(l.name);
      one(l.kind, ['tree', 'ruin', 'pillar', 'bones', 'altar', 'bridge', 'camp']);
      at(l.at);
    }
    const portalIds = new Set<string>();
    for (const entry of list(v.portals, 12)) {
      const p = object(entry);
      string(p.id);
      string(p.name);
      at(p.at);
      if (portalIds.has(p.id)) throw new Error('Duplicate portal ID');
      portalIds.add(p.id);
      if (p.target !== null) string(p.target);
      if (p.arrival !== null) string(p.arrival);
      one(p.requires, ['none', 'wards', 'boss']);
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
  const regionIds = new Set(content.regions.map((r) => r.id));
  const actIds = new Set(content.acts.map((a) => a.id));
  const dungeonIds = new Set(content.dungeons.map((d) => d.id));
  for (const r of content.regions) {
    if (!actIds.has(r.act) || (r.dungeon && !dungeonIds.has(r.dungeon)))
      throw new Error('Unknown region owner');
    if (
      (r.boss && !ids('monsters').has(r.boss)) ||
      r.monsters.some((id) => !ids('monsters').has(id))
    )
      throw new Error('Unknown region monster');
    const world = { tiles: tilesFor(r) };
    for (const p of [
      r.start,
      r.waypoint,
      r.ward,
      r.bossPosition,
      ...r.chests,
      ...r.portals.map((p) => p.at),
    ].filter((p) => p !== null))
      if (
        !walkable(world, r.start) ||
        !walkable(world, p) ||
        (p !== r.start && !findPath(world, r.start, p).length)
      )
        throw new Error(`Unreachable objective in ${r.id}`);
    for (const p of r.portals) {
      if (p.target === null) {
        if (p.arrival !== null || p.requires !== 'boss' || r.id !== content.acts.at(-1)?.bossRegion)
          throw new Error('Only the final boss can end the campaign');
        continue;
      }
      if (!regionIds.has(p.target)) throw new Error('Unknown portal destination');
      const target = content.regions.find((t) => t.id === p.target)!;
      if (p.arrival !== null) {
        const arrival = target.portals.find((a) => a.id === p.arrival);
        if (!arrival || arrival.target !== r.id || arrival.arrival !== p.id)
          throw new Error('Portal arrivals must be reciprocal');
      }
      if (target.act !== r.act) {
        const act = content.acts.findIndex((a) => a.id === r.act);
        if (
          target.id !== content.acts[act + 1]?.entry ||
          r.id !== content.acts[act].bossRegion ||
          p.requires !== 'boss' ||
          p.arrival !== null
        )
          throw new Error('Act crossings require the final boss');
      } else if (p.arrival === null) throw new Error('Local portals need an arrival');
    }
  }
  for (const d of content.dungeons) {
    if (!actIds.has(d.act) || new Set(d.floors).size !== d.floors.length)
      throw new Error('Invalid dungeon owner or floors');
    d.floors.forEach((id, i) => {
      const r = content.regions.find((r) => r.id === id);
      if (!r || r.act !== d.act || r.dungeon !== d.id || r.floor !== i + 1)
        throw new Error('Dungeon floors must be contiguous and owned');
    });
    if (content.regions.filter((r) => r.dungeon === d.id).length !== d.floors.length)
      throw new Error('Unlisted dungeon floor');
    for (let i = 1; i < d.floors.length; i++) {
      const lower = content.regions.find((r) => r.id === d.floors[i])!;
      if (!lower.portals.some((p) => p.target === d.floors[i - 1]))
        throw new Error('Dungeon floors need connecting stairs');
    }
  }
  for (const a of content.acts) {
    const owned = content.regions.filter((r) => r.act === a.id);
    const entry = owned.find((r) => r.id === a.entry),
      boss = owned.find((r) => r.id === a.bossRegion);
    if (
      !entry ||
      !boss?.boss ||
      new Set(a.wards).size !== a.wards.length ||
      a.wards.some((id) => !owned.find((r) => r.id === id)?.ward)
    )
      throw new Error('Invalid act objectives');
    if (
      owned.filter((r) => r.boss).length !== 1 ||
      owned.filter((r) => r.ward).length !== a.wards.length
    )
      throw new Error('Act must own one boss and its declared wards');
    const reach = (gated: boolean) => {
      const seen = new Set([a.entry]);
      const queue = [a.entry];
      for (const id of queue)
        for (const p of owned.find((r) => r.id === id)!.portals)
          if (
            p.target &&
            owned.some((r) => r.id === p.target) &&
            !seen.has(p.target) &&
            (!gated || p.requires === 'none')
          ) {
            seen.add(p.target);
            queue.push(p.target);
          }
      return seen;
    };
    if (owned.some((r) => !reach(false).has(r.id)) || a.wards.some((id) => !reach(true).has(id)))
      throw new Error('Unreachable region or ward behind its own gate');
    if (
      !boss.portals.some(
        (p) =>
          p.requires === 'boss' &&
          (p.target === null || content.regions.find((r) => r.id === p.target)?.act !== a.id),
      )
    )
      throw new Error('Boss region needs a campaign exit');
  }
  return content;
}
