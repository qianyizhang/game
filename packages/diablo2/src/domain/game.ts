import { BASE_CONTENT } from './content';
import { validateContent } from './validate';
import type { Command, Content, Point, State, World } from './types';
import { findPath, tilesFor, distance, reveal, lineOfSight, walkable } from './maps';
import { hashSeed, choose, note, random } from './random';
import { carry, rollItem, freeCell } from './loot';
import { cast, spawnEnemy, tick } from './combat';
import { stats } from './stats';
import { currentRegion, currentWorld, wardsLit, portalOpen } from './world';
export { stats } from './stats';
export { validateContent } from './validate';
export type { Command, State, Content } from './types';
export const RULES_VERSION = 'emberwake-2';
function stop(state: State): void {
  state.player.direction = { x: 0, y: 0 };
  state.player.destination = null;
  state.player.path = [];
  state.player.target = null;
}
function cloneWorld(world: World): World {
  return {
    ...structuredClone({ ...world, tiles: [], seen: [] }),
    tiles: world.tiles,
    seen: world.seen,
  };
}
function enter(state: State, content: Content, regionId: string, position?: Point): void {
  const region = content.regions.find((r) => r.id === regionId)!;
  state.act = content.acts.findIndex((a) => a.id === region.act);
  state.region = regionId;
  state.worlds[regionId] = cloneWorld(state.worlds[regionId]);
  state.location = 'field';
  stop(state);
  const p = position ?? region.start;
  state.player.x = p.x;
  state.player.y = p.y;
  const world = currentWorld(state);
  if (!world.visited) note(state, region.description);
  world.visited = true;
  reveal(world, p);
}
function usePortal(state: State, content: Content, id: string): string | null {
  if (state.location !== 'field') return 'Leave the refuge first.';
  const portal = currentRegion(state, content).portals.find((p) => p.id === id);
  if (!portal || distance(state.player, portal.at) >= 2)
    return 'Stand beside that portal or staircase.';
  if (!portalOpen(state, content, portal))
    return portal.requires === 'wards'
      ? 'Light both act wards before descending to the boss.'
      : 'Defeat the final boss before taking this road.';
  if (!portal.target) {
    state.status = 'victory';
    stop(state);
    note(state, content.acts[state.act].conclusion);
    return null;
  }
  const target = content.regions.find((r) => r.id === portal.target)!;
  const position = portal.arrival
    ? target.portals.find((p) => p.id === portal.arrival)!.at
    : target.start;
  const previousAct = state.act;
  enter(state, content, target.id, position);
  if (state.act !== previousAct) {
    state.portal = null;
    note(state, content.acts[state.act].introduction);
  }
  return null;
}
export function createGame(seed: string, heroId: string, pack: Content = BASE_CONTENT): State {
  const content = validateContent(pack);
  const hero = content.heroes.find((h) => h.id === heroId);
  if (!hero) throw new Error('Unknown hero');
  if (typeof seed !== 'string' || seed.length > 100) throw new Error('Invalid seed');
  const state: State = {
    rulesVersion: RULES_VERSION,
    contentId: content.id,
    contentVersion: content.version,
    hero: heroId,
    seed,
    rng: hashSeed(seed),
    nextUid: 1,
    tick: 0,
    status: 'playing',
    location: 'town',
    act: 0,
    unlocked: 0,
    region: content.acts[0].entry,
    worlds: {},
    portal: null,
    log: ['Warden Elian: The first lantern has gone dark. Take the east road into Briarfen.'],
    player: {
      x: 4,
      y: 5,
      hp: hero.hp,
      mana: hero.mana,
      stamina: 100,
      level: 1,
      xp: 0,
      gold: 45,
      attributes: { ...hero.attributes },
      statPoints: 0,
      skillPoints: 0,
      skills: Object.fromEntries(hero.skills.map((id, i) => [id, i === 0 ? 1 : 0])),
      inventory: [],
      equipment: {},
      stash: [],
      healthPotions: 5,
      manaPotions: 4,
      runes: 0,
      cooldowns: {},
      attackCooldown: 0,
      slow: 0,
      destination: null,
      path: [],
      direction: { x: 0, y: 0 },
      target: null,
      running: false,
      corpse: null,
    },
  };
  const starter = rollItem(state, content, false, hero.weapon);
  starter.rarity = 'normal';
  starter.name = content.items.find((i) => i.id === hero.weapon)!.name;
  starter.damage = content.items.find((i) => i.id === hero.weapon)!.damage;
  starter.vitality = 0;
  starter.energy = 0;
  starter.resist = 0;
  starter.leech = 0;
  state.player.equipment.weapon = starter;
  for (const map of content.regions) {
    const act = content.acts.findIndex((a) => a.id === map.act);
    state.act = act;
    const world: World = {
      tiles: tilesFor(map),
      seen: [],
      enemies: [],
      drops: [],
      hazards: [],
      projectiles: [],
      allies: [],
      ward: false,
      visited: false,
      revealOrigin: -1,
      chests: map.chests.map(() => false),
      bossDefeated: false,
      waypoint: false,
    };
    state.worlds[map.id] = world;
    const reserved = [
      map.start,
      map.waypoint,
      map.bossPosition,
      map.ward,
      ...map.portals.map((p) => p.at),
      ...map.chests,
    ].filter((p) => p !== null);
    const candidates: Point[] = [];
    for (let y = 2; y < map.height - 2; y += 3)
      for (let x = 2; x < map.width - 2; x += 3)
        if (
          walkable(world, { x: x + 0.5, y: y + 0.5 }) &&
          reserved.every((p) => distance(p, { x, y }) > 3) &&
          distance(map.start, { x, y }) > 7
        )
          candidates.push({ x: x + 0.5, y: y + 0.5 });
    for (let i = 0; i < map.encounters && candidates.length; i++) {
      // Put the first patrol along the approach; scatter the remaining encounters with the seed.
      if (i === 0) candidates.sort((a, b) => distance(map.start, a) - distance(map.start, b));
      const index = i === 0 ? 0 : Math.floor(random(state) * candidates.length);
      const point = candidates.splice(index, 1)[0];
      spawnEnemy(state, content, world, choose(state, map.monsters), point, false, i % 8 === 7);
    }
    if (map.ward)
      spawnEnemy(
        state,
        content,
        world,
        choose(state, map.monsters),
        { x: map.ward.x + 1, y: map.ward.y + 1 },
        false,
        true,
      );
    if (map.boss && map.bossPosition)
      spawnEnemy(state, content, world, map.boss, map.bossPosition, true);
  }
  state.act = 0;
  return state;
}
function execute(state: State, content: Content, command: Command): string | null {
  const p = state.player;
  const world = currentWorld(state);
  const map = currentRegion(state, content);
  if (command.type === 'respawn') {
    if (state.status !== 'dead') return 'You are still alive.';
    state.status = 'playing';
    state.location = 'town';
    stop(state);
    p.hp = stats(state, content).maxHp;
    p.mana = stats(state, content).maxMana;
    return null;
  }
  if (state.status !== 'playing') return 'This journey has ended.';
  switch (command.type) {
    case 'advance':
      for (let n = 0; n < command.ticks && state.status === 'playing'; n++) tick(state, content);
      return null;
    case 'run':
      p.running = command.enabled;
      return null;
    case 'attribute':
      if (p.statPoints < 1) return 'No attribute points available.';
      p.attributes[command.attribute]++;
      p.statPoints--;
      return null;
    case 'learn': {
      const hero = content.heroes.find((h) => h.id === state.hero)!;
      const skill = content.skills.find((s) => s.id === command.skill);
      if (!hero.skills.includes(command.skill) || !skill)
        return 'This skill belongs to another hero.';
      if (p.level < skill.level) return `Requires level ${skill.level}.`;
      if (p.skillPoints < 1) return 'No skill points available.';
      if ((p.skills[skill.id] ?? 0) >= 10) return 'Maximum skill rank reached.';
      p.skills[skill.id] = (p.skills[skill.id] ?? 0) + 1;
      p.skillPoints--;
      return null;
    }
    case 'travel': {
      if (state.location !== 'town') return 'Use a waypoint from the refuge.';
      const act = content.acts[command.act];
      if (command.act > state.unlocked || !act) return 'That route is still sealed.';
      const region = content.regions.find((r) => r.id === (command.region ?? act.entry));
      if (!region || region.act !== act.id) return 'Unknown route for this act.';
      const world = state.worlds[region.id];
      if (region.id !== act.entry && !world.waypoint) return 'Attune that region’s waypoint first.';
      enter(state, content, region.id, world.waypoint ? region.waypoint! : region.start);
      return null;
    }
    case 'use-portal':
      return usePortal(state, content, command.id);
    case 'return':
      if (state.location !== 'town' || !state.portal) return 'No return portal is open.';
      enter(state, content, state.portal.region, state.portal.position);
      return null;
    case 'portal':
      if (state.location !== 'field') return 'You are already at the refuge.';
      if (
        world.enemies.some(
          (e) => e.hp > 0 && (!e.boss || wardsLit(state, content)) && distance(p, e) < 3,
        )
      )
        return 'Clear the enemies within three paces before opening a portal.';
      state.portal = { act: state.act, region: state.region, position: { x: p.x, y: p.y } };
      state.location = 'town';
      stop(state);
      p.hp = stats(state, content).maxHp;
      p.mana = stats(state, content).maxMana;
      note(state, 'Elian tends your wounds. Your return portal remains open.');
      return null;
    case 'buy': {
      if (state.location !== 'town') return 'The quartermaster is at the refuge.';
      const cost = command.kind === 'gear' ? 65 + state.act * 20 : 12;
      if (p.gold < cost) return 'Not enough gold.';
      if (command.kind === 'gear') {
        const item = rollItem(state, content);
        if (!carry(p.inventory, item)) return 'Inventory is full.';
        note(state, `Purchased ${item.name}.`);
      } else {
        const key = command.kind === 'health' ? 'healthPotions' : 'manaPotions';
        if (p[key] >= 8) return 'Your belt is full.';
        p[key]++;
      }
      p.gold -= cost;
      return null;
    }
    case 'equip':
    case 'sell':
    case 'stash':
    case 'withdraw':
    case 'socket':
    case 'drop': {
      if (
        ['sell', 'stash', 'withdraw', 'socket'].includes(command.type) &&
        state.location !== 'town'
      )
        return 'Use the quartermaster or stash at the refuge.';
      if (command.type === 'socket') {
        const item = Object.values(p.equipment).find((i) => i.uid === command.uid);
        if (!item) return 'Equip the item first.';
        if (!p.runes) return 'No ember runes available.';
        if (item.runes >= item.sockets) return 'All sockets are filled.';
        item.runes++;
        p.runes--;
        item.damage += item.slot === 'weapon' ? 4 : 0;
        item.armor += item.slot === 'armor' ? 3 : 0;
        item.resist += 4;
        note(state, `${item.name} holds an ember rune.`);
        return null;
      }
      const source = command.type === 'withdraw' ? p.stash : p.inventory;
      const index = source.findIndex((i) => i.uid === command.uid);
      if (index < 0) return 'Item not found.';
      const item = source[index];
      if (command.type === 'equip') {
        if (p.attributes.strength < item.requiredStrength)
          return `Requires ${item.requiredStrength} strength.`;
        const old = p.equipment[item.slot];
        const inventory = p.inventory.filter((i) => i.uid !== item.uid);
        if (old && freeCell(inventory, old) === null) return 'No room for your old equipment.';
        p.inventory = inventory;
        if (old) carry(p.inventory, old);
        p.equipment[item.slot] = item;
        p.hp = Math.min(p.hp, stats(state, content).maxHp);
        p.mana = Math.min(p.mana, stats(state, content).maxMana);
        note(state, `${item.name} equipped.`);
        return null;
      }
      if (command.type === 'withdraw' && !carry(p.inventory, item)) return 'Inventory is full.';
      if (command.type === 'stash') {
        if (p.stash.length >= 64) return 'Stash is full.';
        p.stash.push(item);
      }
      if (command.type === 'sell') p.gold += item.value;
      if (command.type === 'drop') {
        if (state.location !== 'field') return 'Sell or stash items at the refuge.';
        const landing = [
          [1.6, 0],
          [-1.6, 0],
          [0, 1.6],
          [0, -1.6],
        ]
          .map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
          .find((at) => walkable(world, at) && lineOfSight(world, p, at));
        if (!landing) return 'No clear ground to drop this item.';
        world.drops.push({
          ...landing,
          uid: state.nextUid++,
          kind: 'item',
          amount: 1,
          item,
        });
      }
      source.splice(index, 1);
      return null;
    }
    case 'potion': {
      const s = stats(state, content);
      const key = command.kind === 'health' ? 'healthPotions' : 'manaPotions';
      const resource = command.kind === 'health' ? 'hp' : 'mana';
      const max = command.kind === 'health' ? s.maxHp : s.maxMana;
      if (p[key] < 1) return 'No potion in that belt slot.';
      if (p[resource] >= max) return `Your ${command.kind === 'health' ? 'life' : 'mana'} is full.`;
      p[key]--;
      p[resource] = Math.min(max, p[resource] + max * 0.6);
      return null;
    }
    case 'move':
      if (state.location !== 'field') return 'Leave the refuge first.';
      if (!walkable(world, command.target) || !findPath(world, p, command.target).length)
        return 'That ground cannot be reached.';
      stop(state);
      p.destination = command.target;
      p.path = findPath(world, p, command.target);
      return null;
    case 'steer':
      if (state.location !== 'field') return 'Leave the refuge first.';
      stop(state);
      p.direction = command.direction;
      return null;
    case 'attack': {
      if (state.location !== 'field') return 'No enemies at the refuge.';
      const enemy = world.enemies.find((e) => e.uid === command.target && e.hp > 0);
      if (!enemy) return 'Choose a living enemy.';
      if (
        !world.seen.includes(Math.floor(enemy.y) * map.width + Math.floor(enemy.x)) ||
        !lineOfSight(world, p, enemy)
      )
        return 'That enemy is not visible.';
      if (enemy.boss && !wardsLit(state, content))
        return 'The boss is warded. Activate both ward stones first.';
      stop(state);
      p.target = enemy.uid;
      return null;
    }
    case 'cast':
      if (state.location !== 'field') return 'No spell targets at the refuge.';
      return cast(state, content, command.skill, command.target);
    case 'interact': {
      if (state.location !== 'field') return 'Select a route to leave the refuge.';
      if (p.corpse && p.corpse.region === state.region && distance(p, p.corpse.position) < 2) {
        p.gold += p.corpse.gold;
        p.corpse = null;
        note(state, 'Your grave is recovered. Lost experience remains lost.');
        return null;
      }
      if (map.ward && !world.ward && distance(p, map.ward) < 2) {
        if (world.enemies.some((e) => e.hp > 0 && !e.boss && distance(e, map.ward!) < 3))
          return 'Defeat the ward’s nearby guards first.';
        world.ward = true;
        p.gold += 20;
        note(
          state,
          wardsLit(state, content)
            ? 'The last ward ignites. The deepest stair opens; the boss is vulnerable.'
            : 'A ward awakens. Find the other ward in this act.',
        );
        return null;
      }
      for (let i = 0; i < map.chests.length; i++)
        if (!world.chests[i] && distance(p, map.chests[i]) < 2) {
          world.chests[i] = true;
          world.drops.push(
            {
              ...map.chests[i],
              uid: state.nextUid++,
              kind: 'item',
              amount: 1,
              item: rollItem(state, content),
            },
            { ...map.chests[i], uid: state.nextUid++, kind: 'gold', amount: 25 + state.act * 15 },
          );
          note(state, 'A forgotten cache opens. Walk over its loot to collect it.');
          return null;
        }
      const portal = map.portals.find((portal) => distance(p, portal.at) < 2);
      if (portal) return usePortal(state, content, portal.id);
      if (map.waypoint && distance(p, map.waypoint) < 2) {
        world.waypoint = true;
        state.location = 'town';
        stop(state);
        p.hp = stats(state, content).maxHp;
        p.mana = stats(state, content).maxMana;
        note(state, 'The waypoint returns you to the refuge.');
        return null;
      }
      return 'Stand beside a ward, chest, waypoint, grave, portal, or stairs and interact.';
    }
  }
}
export function validCommand(value: unknown): value is Command {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const c = value as Record<string, unknown>;
  const num = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
  const point = (v: unknown, dir = false) => {
    if (!v || typeof v !== 'object') return false;
    const p = v as Record<string, unknown>;
    return num(p.x, dir ? -1 : 0, dir ? 1 : 128) && num(p.y, dir ? -1 : 0, dir ? 1 : 128);
  };
  switch (c.type) {
    case 'advance':
      return num(c.ticks, 1, 50) && Number.isInteger(c.ticks);
    case 'move':
      return point(c.target);
    case 'steer':
      return point(c.direction, true);
    case 'cast':
      return typeof c.skill === 'string' && point(c.target);
    case 'attack':
      return num(c.target, 1, Number.MAX_SAFE_INTEGER) && Number.isInteger(c.target);
    case 'equip':
    case 'sell':
    case 'stash':
    case 'withdraw':
    case 'socket':
    case 'drop':
      return num(c.uid, 1, Number.MAX_SAFE_INTEGER) && Number.isInteger(c.uid);
    case 'potion':
      return c.kind === 'health' || c.kind === 'mana';
    case 'buy':
      return ['health', 'mana', 'gear'].includes(String(c.kind));
    case 'travel':
      return (
        num(c.act, 0, 11) &&
        Number.isInteger(c.act) &&
        (c.region === undefined || (typeof c.region === 'string' && c.region.length <= 64))
      );
    case 'use-portal':
      return typeof c.id === 'string' && c.id.length <= 64;
    case 'learn':
      return typeof c.skill === 'string' && c.skill.length <= 64;
    case 'attribute':
      return ['strength', 'dexterity', 'vitality', 'energy'].includes(String(c.attribute));
    case 'run':
      return typeof c.enabled === 'boolean';
    case 'interact':
    case 'portal':
    case 'return':
    case 'respawn':
      return true;
    default:
      return false;
  }
}
/** Rejections preserve the original state, including RNG and resource accounting. */
export function applyCommand(
  state: State,
  command: Command,
  content: Content = BASE_CONTENT,
): { state: State; accepted: boolean; error: string | null } {
  if (!validCommand(command)) return { state, accepted: false, error: 'Malformed command.' };
  if (
    state.rulesVersion !== RULES_VERSION ||
    state.contentId !== content.id ||
    state.contentVersion !== content.version
  )
    return { state, accepted: false, error: 'Content or rules version mismatch.' };
  // Immutable snapshots share inactive regions and terrain; only touched worlds are cloned.
  const next: State = {
    ...state,
    player: structuredClone(state.player),
    log: [...state.log],
    worlds: { ...state.worlds },
    portal: state.portal ? structuredClone(state.portal) : null,
  };
  next.worlds[state.region] = cloneWorld(currentWorld(state));
  const error = execute(next, content, command);
  return error ? { state, accepted: false, error } : { state: next, accepted: true, error: null };
}
