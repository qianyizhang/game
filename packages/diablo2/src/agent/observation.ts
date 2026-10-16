import { HEALTH_POTION_COOLDOWN, usesPressureRules, hasVisiblePortalGuard } from '../domain/game';
import type { Session } from '../application/session';
import {
  knownCell,
  visibleActor,
  distance,
  walkable,
  lineOfSight,
  bodyFits,
  BODY_RADIUS,
} from '../domain/maps';
import { freeCell } from '../domain/loot';
import { playerStats } from '../domain/stats';
import { currentRegion, currentWorld, portalOpen, wardsLit } from '../domain/world';
import type { Command, Item, Player, Point } from '../domain/types';

export type PolicyCommand = Exclude<Command, { type: 'respawn' } | { type: `dev-${string}` }>;
export interface Aliases {
  ids: Record<string, number>;
  next: number;
}
export const emptyAliases = (): Aliases => ({ ids: {}, next: 1 });
/** Allocated only when an entity becomes permitted knowledge, never from native allocation order. */
function alias(memory: Aliases, uid: number): number {
  return memory.ids[String(uid)] ?? (memory.ids[String(uid)] = memory.next++);
}
const point = ({ x, y }: Point): Point => ({ x, y });
const spatial = <T extends Point>(values: T[]): T[] =>
  [...values].sort((a, b) => a.y - b.y || a.x - b.x);

export function observe(session: Session, memory: Aliases) {
  const {
    state: s,
    replay: { content },
  } = session;
  const p = s.player;
  const map = currentRegion(s, content);
  const world = currentWorld(s);
  const field = s.location === 'field';
  const known = new Set(world.seen);
  const requestedTicks = session.replay.commands.reduce(
    (n, command) => n + (command.type === 'advance' ? command.ticks : 0),
    0,
  );
  // Unknown terrain is blocked for collision probes. Native footprint checks can
  // otherwise reveal an unseen neighbor beside a visible actor's fractional position.
  const publicTerrain = {
    tiles: world.tiles.map((row, y) =>
      [...row].map((tile, x) => (known.has(y * map.width + x) ? tile : '#')).join(''),
    ),
  };
  const item = (value: Item): Item => ({ ...value, uid: alias(memory, value.uid) });
  const equipment = Object.fromEntries(
    (['weapon', 'armor', 'charm'] as const)
      .flatMap((slot) => (p.equipment[slot] ? [[slot, p.equipment[slot]] as const] : []))
      .map(([slot, value]) => [slot, item(value)]),
  ) as Player['equipment'];
  const inventory = p.inventory.map(item);
  const stash = p.stash.map(item);
  const enemies = field
    ? spatial(world.enemies.filter((e) => e.hp >= 0 && visibleActor(world, p, e))).map((e) => ({
        ...point(e),
        uid: alias(memory, e.uid),
        kind: e.kind,
        hp: e.hp,
        maxHp: e.maxHp,
        boss: e.boss,
        elite: e.elite,
        slow: e.slow,
        cursed: e.cursed,
        windup: e.windup,
        warded: e.boss && !wardsLit(s, content),
      }))
    : [];
  const drops = field
    ? spatial(world.drops.filter((d) => knownCell(world, d))).map((d) => ({
        ...point(d),
        uid: alias(memory, d.uid),
        kind: d.kind,
        amount: d.amount,
        ...(d.item ? { item: item(d.item) } : {}),
      }))
    : [];
  const hazards = field
    ? spatial(world.hazards.filter((h) => visibleActor(world, p, h))).map((h) => ({
        ...point(h),
        uid: alias(memory, h.uid),
        radius: h.radius,
        delay: h.delay,
        damage: h.damage,
        element: h.element,
        life: h.life,
      }))
    : [];
  const projectiles = field
    ? spatial(world.projectiles.filter((v) => visibleActor(world, p, v))).map((v) => ({
        ...point(v),
        uid: alias(memory, v.uid),
        dx: v.dx,
        dy: v.dy,
        friendly: v.friendly,
        radius: v.radius,
        element: v.element,
      }))
    : [];
  const allies = field
    ? spatial(world.allies.filter((a) => visibleActor(world, p, a))).map((a) => ({
        ...point(a),
        uid: alias(memory, a.uid),
        hp: a.hp,
      }))
    : [];
  const player = {
    ...point(p),
    hp: p.hp,
    mana: p.mana,
    stamina: p.stamina,
    level: p.level,
    xp: p.xp,
    gold: p.gold,
    attributes: { ...p.attributes },
    statPoints: p.statPoints,
    skillPoints: p.skillPoints,
    skills: { ...p.skills },
    inventory,
    equipment,
    stash,
    healthPotions: p.healthPotions,
    manaPotions: p.manaPotions,
    runes: p.runes,
    cooldowns: { ...p.cooldowns },
    attackCooldown: p.attackCooldown,
    slow: p.slow,
    destination: p.destination ? point(p.destination) : null,
    direction: { ...p.direction },
    target: p.target === null ? null : (memory.ids[String(p.target)] ?? null),
    running: p.running,
  };
  const markers: {
    kind: 'ward' | 'chest' | 'waypoint' | 'portal';
    id: string;
    at: Point;
    active: boolean;
    target?: string | null;
    requires?: string;
  }[] = [];
  if (field) {
    if (map.ward && knownCell(world, map.ward))
      markers.push({ kind: 'ward', id: 'ward', at: point(map.ward), active: world.ward });
    map.chests.forEach((at, index) => {
      if (knownCell(world, at))
        markers.push({
          kind: 'chest',
          id: `chest-${at.x}-${at.y}`,
          at: point(at),
          active: world.chests[index],
        });
    });
    if (map.waypoint && knownCell(world, map.waypoint))
      markers.push({
        kind: 'waypoint',
        id: 'waypoint',
        at: point(map.waypoint),
        active: world.waypoint,
      });
    for (const portal of map.portals)
      if (knownCell(world, portal.at))
        markers.push({
          kind: 'portal',
          id: portal.id,
          at: point(portal.at),
          active: portalOpen(s, content, portal),
          target: portal.target,
          requires: portal.requires,
        });
  }
  const input = {
    schema: 'emberwake-observation-3' as const,
    requestedTicks,
    requestedTickLimit: 100000,
    hero: s.hero,
    tick: s.tick,
    status: s.status,
    location: s.location,
    act: s.act,
    unlocked: s.unlocked,
    player,
    stats: playerStats(
      p,
      content.heroes.find((h) => h.id === s.hero)!,
    ),
    region: {
      id: map.id,
      name: map.name,
      theme: map.theme,
      width: map.width,
      height: map.height,
      terrain: terrainRuns(
        world.tiles.map((row, y) =>
          [...row].map((tile, x) => (field && known.has(y * map.width + x) ? tile : '?')).join(''),
        ),
      ),
    },
    enemies,
    drops,
    hazards,
    projectiles,
    allies,
    armySize: field ? world.allies.length : 0,
    markers,
    portal: s.portal
      ? { act: s.portal.act, region: s.portal.region, position: point(s.portal.position) }
      : null,
    atlas: {
      acts: content.acts.map((a) => ({
        id: a.id,
        name: a.name,
        entry: a.entry,
        wards: [...a.wards],
        bossRegion: a.bossRegion,
      })),
      dungeons: content.dungeons.map((d) => ({ ...d, floors: [...d.floors] })),
      progress: {
        visited: content.regions.filter((r) => s.worlds[r.id].visited).map((r) => r.id),
        wards: content.regions.filter((r) => s.worlds[r.id].ward).map((r) => r.id),
        bosses: content.regions.filter((r) => s.worlds[r.id].bossDefeated).map((r) => r.id),
        waypoints: content.regions.filter((r) => s.worlds[r.id].waypoint).map((r) => r.id),
      },
      regions: content.regions.map((r) => ({
        id: r.id,
        act: r.act,
        portals: r.portals.map((v) => ({
          id: v.id,
          target: v.target,
          requires: v.requires,
        })),
      })),
    },
    definitions: structuredClone({
      heroes: content.heroes.filter((hero) => hero.id === s.hero),
      skills: content.skills.filter((skill) =>
        content.heroes.find((hero) => hero.id === s.hero)!.skills.includes(skill.id),
      ),
      items: content.items,
      monsters: content.monsters,
    }),
    actions: [] as PolicyCommand[],
  };
  if (s.status !== 'playing') return input;
  const actions = input.actions;
  for (const ticks of [1, 5, 10, 20, 50])
    if (requestedTicks + ticks <= input.requestedTickLimit)
      actions.push({ type: 'advance', ticks });
  if (!p.running) actions.push({ type: 'run', enabled: true });
  if (p.running) actions.push({ type: 'run', enabled: false });
  if (p.statPoints)
    for (const attribute of ['strength', 'dexterity', 'vitality', 'energy'] as const)
      actions.push({ type: 'attribute', attribute });
  if (p.skillPoints)
    for (const skill of content.skills)
      if (
        content.heroes.find((h) => h.id === s.hero)!.skills.includes(skill.id) &&
        p.level >= skill.level &&
        (p.skills[skill.id] ?? 0) < 10
      )
        actions.push({ type: 'learn', skill: skill.id });
  if (
    p.healthPotions &&
    p.hp < input.stats.maxHp &&
    !(usesPressureRules(s.rulesVersion) && p.cooldowns[HEALTH_POTION_COOLDOWN] > 0)
  )
    actions.push({ type: 'potion', kind: 'health' });
  if (p.manaPotions && p.mana < input.stats.maxMana) actions.push({ type: 'potion', kind: 'mana' });
  // Item transfer capacity is checked by the ordinary command boundary, not sampled RNG.
  for (const value of inventory) {
    if (
      p.attributes.strength >= value.requiredStrength &&
      (!equipment[value.slot] ||
        freeCell(
          inventory.filter((i) => i.uid !== value.uid),
          equipment[value.slot]!,
        ) !== null)
    )
      actions.push({ type: 'equip', uid: value.uid });
    if (!field) {
      actions.push({ type: 'sell', uid: value.uid });
      if (stash.length < 64) actions.push({ type: 'stash', uid: value.uid });
    }
  }
  if (!field) {
    for (const value of stash)
      if (freeCell(inventory, value) !== null) actions.push({ type: 'withdraw', uid: value.uid });
    for (const value of Object.values(equipment))
      if (p.runes && value.runes < value.sockets) actions.push({ type: 'socket', uid: value.uid });
    if (p.gold >= 12) {
      if (p.healthPotions < 8) actions.push({ type: 'buy', kind: 'health' });
      if (p.manaPotions < 8) actions.push({ type: 'buy', kind: 'mana' });
    }
    if (p.gold >= 65 + s.act * 20 && content.items.every((i) => freeCell(inventory, i) !== null))
      actions.push({ type: 'buy', kind: 'gear' });
    for (let act = 0; act <= s.unlocked; act++)
      for (const r of content.regions)
        if (
          r.act === content.acts[act].id &&
          (r.id === content.acts[act].entry || s.worlds[r.id].waypoint)
        )
          actions.push({ type: 'travel', act, region: r.id });
    if (s.portal) actions.push({ type: 'return' });
  } else {
    const steps = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of steps) {
      let from = point(p);
      // A straight cardinal cell route is the unique shortest native grid path.
      // Check every footprint along it against masked terrain, so neither the
      // action menu nor native pathfinding can consult an undiscovered detour.
      for (let length = 1; length <= 4; length++) {
        const target = {
          x: Math.floor(p.x) + dx * length + 0.5,
          y: Math.floor(p.y) + dy * length + 0.5,
        };
        // Native slide applies x then y. The complete swept bounding box
        // includes both that alignment and every intermediate body footprint;
        // point sampling can miss a tiny unknown corner of a fractional start.
        let clear = true;
        const left = Math.floor(Math.min(from.x, target.x) - BODY_RADIUS);
        const right = Math.floor(Math.max(from.x, target.x) + BODY_RADIUS);
        const top = Math.floor(Math.min(from.y, target.y) - BODY_RADIUS);
        const bottom = Math.floor(Math.max(from.y, target.y) + BODY_RADIUS);
        for (let y = top; y <= bottom; y++)
          for (let x = left; x <= right; x++) if (!walkable(publicTerrain, { x, y })) clear = false;
        if (!clear) break;
        actions.push({ type: 'move', target });
        from = target;
      }
    }
    // Stopping is permitted; directional movement is restricted to the known-cell move menu.
    actions.push({ type: 'steer', direction: { x: 0, y: 0 } });
    for (const e of enemies)
      if (
        e.hp > 0 &&
        !e.warded &&
        knownCell(world, e) &&
        distance(p, e) <=
          (content.heroes.find((h) => h.id === s.hero)!.attack === 'ranged' ? 6 : 1.65)
      )
        actions.push({ type: 'attack', target: e.uid });
    const guards = enemies.filter((e) => e.hp > 0 && !e.warded);
    if (
      usesPressureRules(s.rulesVersion)
        ? !hasVisiblePortalGuard(s, content)
        : !guards.some((e) => distance(p, e) < 3)
    )
      actions.push({ type: 'portal' });
    const nearby = markers.filter((m) => distance(p, m.at) < 2);
    if (
      nearby.some(
        (m) =>
          (m.kind === 'ward' &&
            !m.active &&
            !guards.some((e) => !e.boss && distance(e, m.at) < 3)) ||
          (m.kind === 'chest' && !m.active) ||
          (m.kind === 'portal' && m.active) ||
          m.kind === 'waypoint',
      )
    )
      actions.push({ type: 'interact' });
    for (const m of nearby)
      if (m.kind === 'portal' && m.active) actions.push({ type: 'use-portal', id: m.id });
    for (const skill of content.skills) {
      if (!(p.skills[skill.id] > 0) || p.cooldowns[skill.id] > 0 || p.mana < skill.mana) continue;
      if (
        skill.effect === 'summon' &&
        (!enemies.some((e) => e.hp === 0 && !e.boss && distance(p, e) < 5) ||
          world.allies.length >= Math.min(5, p.skills[skill.id] + 1))
      )
        continue;
      const targets =
        skill.range === 0 || skill.effect === 'summon'
          ? [point(p)]
          : [
              ...enemies.filter((e) => e.hp > 0 && !e.warded),
              ...actions.flatMap((c) => (c.type === 'move' ? [c.target] : [])),
            ];
      for (const target of targets)
        if (
          (skill.range === 0 || distance(p, target) <= skill.range) &&
          lineOfSight(world, p, target) &&
          (skill.effect !== 'leap' || bodyFits(publicTerrain, target))
        )
          actions.push({ type: 'cast', skill: skill.id, target: point(target) });
    }
  }
  return structuredClone(input);
}
export type Observation = ReturnType<typeof observe>;

/** Lossless row runs keep full original knowledge affordable in long campaigns.
 * Each pair is [consecutive cell count, native terrain glyph], including unknown '?'. */
export function terrainRuns(rows: readonly string[]): [number, string][][] {
  return rows.map((row) => {
    const runs: [number, string][] = [];
    for (const glyph of row) {
      const previous = runs.at(-1);
      if (previous?.[1] === glyph) previous[0]++;
      else runs.push([1, glyph]);
    }
    return runs;
  });
}
/** Extension policies can recover the ordinary row-string grid without private state. */
export function terrainRows(region: Pick<Observation['region'], 'terrain'>): string[] {
  return region.terrain.map((row) => row.map(([count, glyph]) => glyph.repeat(count)).join(''));
}
