import type { PolicyFactory, Proposal } from '../../../../src/shared/policy/types';
import { freeCell } from '../domain/loot';
import type { Item, Point } from '../domain/types';
import type { Observation, PolicyCommand } from './observation';

export const STRATEGIES = ['immediate', 'survival', 'growth'] as const;
export type Strategy = (typeof STRATEGIES)[number];
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const directions = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as const;
const cellKey = (at: Point, width: number) => Math.floor(at.y) * width + Math.floor(at.x);
interface RegionMemory {
  exhausted: Set<number>;
  frontier: number | null;
  goal: string | null;
  visits: Map<number, number>;
}
interface Memory {
  regions: Map<string, RegionMemory>;
  lastTick: number;
  previous: PolicyCommand | null;
  lastRefillTick: number;
  lastRefillAt: { region: string; at: Point } | null;
  refills: number;
  attributes: number;
}
function gearValue(item: Item, strategy: Strategy, melee: boolean): number {
  const damage = melee ? item.damage : item.damage * 0.65;
  if (strategy === 'survival')
    return damage + item.armor * 4 + item.vitality * 3 + item.resist * 1.8 + item.leech;
  if (strategy === 'growth')
    return (
      damage * 1.5 +
      item.armor * 2 +
      item.vitality * 1.5 +
      item.energy * 2 +
      item.sockets * 3 +
      item.resist
    );
  return damage * 3 + item.armor + item.vitality + item.energy + item.leech;
}
/** Public topology contains names and connections, never coordinates of undiscovered portals. */
function nextRegion(input: Observation): string | null {
  const chapter = input.atlas.acts[input.act];
  const region = input.atlas.regions.find((r) => r.id === input.region.id)!;
  const wards = chapter.wards.filter((id) => !input.atlas.regions.find((r) => r.id === id)!.ward);
  const destination = wards[0] ?? chapter.bossRegion;
  if (input.region.id === destination) return null;
  if (region.id === chapter.bossRegion && region.bossDefeated) {
    const onward = region.portals.find((p) => p.requires === 'boss');
    return onward?.target ?? null;
  }
  const queue = [input.region.id],
    previous = new Map<string, string | null>([[input.region.id, null]]);
  for (let i = 0; i < queue.length && !previous.has(destination); i++) {
    const current = input.atlas.regions.find((r) => r.id === queue[i])!;
    for (const portal of current.portals) {
      if (!portal.target || previous.has(portal.target)) continue;
      if (portal.requires === 'wards' && wards.length) continue;
      if (portal.requires === 'boss' && !current.bossDefeated) continue;
      previous.set(portal.target, current.id);
      queue.push(portal.target);
    }
  }
  if (!previous.has(destination)) return null;
  let result = destination;
  while (previous.get(result) !== input.region.id) result = previous.get(result)!;
  return result;
}
interface Navigation {
  move: PolicyCommand | null;
  reason: string;
  nodes: number;
  evaluations: number;
}
/** BFS is over the detached, masked terrain only. Unknown cells are impassable.
 * A route produces one offered adjacent step, never a distant engine waypoint. */
function navigate(input: Observation, memory: RegionMemory, strategy: Strategy): Navigation {
  const { player: p, region: r } = input;
  const width = r.width,
    start = cellKey(p, width),
    queue = [start];
  const parent = new Map<number, number>([[start, -1]]),
    steps = new Map<number, number>([[start, 0]]);
  const walkable = (x: number, y: number) => '.,:;='.includes(r.tiles[y]?.[x] ?? '#');
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i],
      x = cell % width,
      y = Math.floor(cell / width);
    for (const [dx, dy] of directions) {
      const nx = x + dx,
        ny = y + dy,
        next = ny * width + nx;
      if (
        nx < 0 ||
        ny < 0 ||
        nx >= width ||
        ny >= r.height ||
        parent.has(next) ||
        !walkable(nx, ny)
      )
        continue;
      parent.set(next, cell);
      steps.set(next, steps.get(cell)! + 1);
      queue.push(next);
    }
  }
  // Reaching a floor cell reveals its line of sight. Fog beside walls can remain
  // forever; discovering terrain elsewhere must not reactivate an exhausted cell.
  memory.exhausted.add(start);
  const wanted = nextRegion(input);
  const chapter = input.atlas.acts[input.act];
  const wardNeeded =
    chapter.wards.includes(r.id) && !input.atlas.regions.find((region) => region.id === r.id)!.ward;
  const bossDone = input.atlas.regions.find((region) => region.id === r.id)!.bossDefeated;
  const goals: { id: string; at: Point; priority: number; reason: string; reach: number }[] = [];
  for (const marker of input.markers) {
    if (marker.kind === 'ward' && !marker.active)
      goals.push({ id: marker.id, at: marker.at, priority: 120, reason: 'known ward', reach: 1.5 });
    if (
      marker.kind === 'portal' &&
      marker.active &&
      (marker.target === wanted || (bossDone && marker.requires === 'boss'))
    )
      goals.push({
        id: marker.id,
        at: marker.at,
        priority: 110,
        reason: 'public route',
        reach: 1.5,
      });
    if (
      marker.kind === 'chest' &&
      !marker.active &&
      (strategy === 'growth' || distance(p, marker.at) < 3)
    )
      goals.push({
        id: marker.id,
        at: marker.at,
        priority: strategy === 'growth' ? 100 : 35,
        reason: 'known cache',
        reach: 1.5,
      });
  }
  for (const drop of input.drops) {
    if (
      (drop.kind === 'health' && p.healthPotions >= 8) ||
      (drop.kind === 'mana' && p.manaPotions >= 8)
    )
      continue;
    if (drop.item && freeCell(p.inventory, drop.item) === null) continue;
    // A valid path may initially move away from loot around a wall. The radius
    // gates acquisition, not retention, of a still-known collectible target.
    const nearby =
      memory.goal === `drop-${drop.uid}` || distance(p, drop) < (strategy === 'growth' ? 8 : 4);
    if (nearby)
      goals.push({
        id: `drop-${drop.uid}`,
        at: drop,
        priority: strategy === 'growth' ? 90 : 25,
        reason: `known ${drop.kind} loot`,
        reach: 1,
      });
  }
  let evaluations = 0;
  let target: number | null = null,
    best = -Infinity,
    reason = 'explore known frontier';
  const remembered = goals.find((goal) => goal.id === memory.goal);
  const candidates =
    remembered && goals.every((goal) => goal.priority <= remembered.priority)
      ? [remembered]
      : goals;
  let chosenGoal: string | null = null;
  for (const goal of candidates) {
    for (const cell of queue) {
      evaluations++;
      const at = { x: (cell % width) + 0.5, y: Math.floor(cell / width) + 0.5 };
      if (distance(at, goal.at) > goal.reach) continue;
      const value = goal.priority - steps.get(cell)! * 0.8 - distance(at, goal.at) * 0.1;
      if (value > best) {
        best = value;
        target = cell;
        reason = goal.reason;
        chosenGoal = goal.id;
      }
    }
  }
  if (
    target === null &&
    memory.frontier !== null &&
    parent.has(memory.frontier) &&
    !memory.exhausted.has(memory.frontier)
  ) {
    target = memory.frontier;
  }
  if (target === null) {
    for (const cell of queue) {
      evaluations++;
      const x = cell % width,
        y = Math.floor(cell / width);
      const fog = directions.filter(([dx, dy]) => r.tiles[y + dy]?.[x + dx] === '?').length;
      if (!fog || memory.exhausted.has(cell)) continue;
      const value = fog * 2 - steps.get(cell)! - (memory.visits.get(cell) ?? 0) * 2;
      if (value > best) {
        best = value;
        target = cell;
      }
    }
  }
  memory.goal = chosenGoal;
  if (reason === 'explore known frontier') memory.frontier = target;
  // A completed local objective must route onward; no repeatedly selected exhausted goal.
  if (target === start) return { move: null, reason, nodes: queue.length, evaluations };
  if (target === null)
    return {
      move: null,
      reason: wardNeeded
        ? 'no reachable revealed ward or frontier'
        : 'no reachable revealed objective or frontier',
      nodes: queue.length,
      evaluations,
    };
  while (parent.get(target) !== start) target = parent.get(target)!;
  const at = { x: (target % width) + 0.5, y: Math.floor(target / width) + 0.5 };
  const move =
    input.actions.find((c) => c.type === 'move' && distance(c.target, at) < 0.01) ?? null;
  return { move, reason, nodes: queue.length, evaluations };
}

function factory(strategy: Strategy): PolicyFactory<Observation, PolicyCommand> {
  return {
    id: strategy,
    version: 'emberwake-policy-1',
    create() {
      const memory: Memory = {
        regions: new Map(),
        lastTick: -1,
        previous: null,
        lastRefillTick: -1000,
        lastRefillAt: null,
        refills: 0,
        attributes: 0,
      };
      return (input): Proposal<PolicyCommand> => {
        const p = input.player,
          actions = input.actions;
        let work = actions.length,
          pathNodes = 0;
        const melee =
          input.definitions.heroes.find((hero) => hero.id === input.hero)!.attack === 'melee';
        const choose = (command: PolicyCommand, reason: string): Proposal<PolicyCommand> => {
          memory.lastTick = input.tick;
          memory.previous = command;
          return {
            command,
            work,
            diagnostics: {
              strategy,
              reason,
              candidates: actions.length,
              pathNodes,
              portalRefills: memory.refills,
            },
          };
        };
        const find = <T extends PolicyCommand['type']>(type: T) =>
          actions.find((c): c is Extract<PolicyCommand, { type: T }> => c.type === type);
        const advance = (ticks = 5): PolicyCommand => {
          const available = actions
            .filter((c) => c.type === 'advance')
            .sort((a, b) => a.ticks - b.ticks);
          const command = available.filter((c) => c.ticks <= ticks).at(-1) ?? available[0];
          if (!command)
            throw new Error('Native requested-tick budget exhausted; no time can advance.');
          return command;
        };
        const healthThreshold = strategy === 'survival' ? 0.7 : strategy === 'growth' ? 0.5 : 0.35;
        const heal = actions.find((c) => c.type === 'potion' && c.kind === 'health');
        if (heal && p.hp < input.stats.maxHp * healthThreshold) return choose(heal, 'life reserve');
        if (
          input.tick === memory.lastTick &&
          memory.previous &&
          ['move', 'steer', 'attack', 'cast'].includes(memory.previous.type)
        )
          return choose(advance(), 'execute the selected control');
        const attribute = actions.filter((c) => c.type === 'attribute');
        if (attribute.length) {
          const offense = melee ? 'strength' : 'energy';
          const desired =
            strategy === 'immediate'
              ? memory.attributes % 3
                ? offense
                : 'vitality'
              : strategy === 'survival'
                ? memory.attributes % 4
                  ? 'vitality'
                  : offense
                : memory.attributes % 2
                  ? offense
                  : 'vitality';
          memory.attributes++;
          return choose(
            attribute.find((c) => c.attribute === desired)!,
            'allocate earned attributes',
          );
        }
        const learn = actions.filter((c) => c.type === 'learn');
        if (learn.length) {
          const hero = input.definitions.heroes.find((h) => h.id === input.hero)!;
          const novel = learn.find((c) => !p.skills[c.skill]);
          const command =
            novel ??
            learn.find(
              (c) =>
                c.skill ===
                hero.skills[strategy === 'growth' && input.hero === 'necromancer' ? 1 : 0],
            ) ??
            learn[0];
          return choose(command, novel ? 'unlock a hero mechanic' : 'increase a trained skill');
        }
        const upgrades = actions
          .filter((c): c is PolicyCommand & { type: 'equip'; uid: number } => c.type === 'equip')
          .map((command) => {
            const item = p.inventory.find((i) => i.uid === command.uid)!,
              old = p.equipment[item.slot];
            return {
              command,
              improvement:
                gearValue(item, strategy, melee) - (old ? gearValue(old, strategy, melee) : 0),
            };
          })
          .sort((a, b) => b.improvement - a.improvement);
        work += upgrades.length;
        if (upgrades[0]?.improvement > 0.01)
          return choose(upgrades[0].command, 'equip a public inventory upgrade');
        if (input.location === 'town') {
          const socket = find('socket');
          if (socket) return choose(socket, 'socket earned runes');
          const sell = actions.find((c) => c.type === 'sell');
          if (sell) return choose(sell, 'sell unequipped gear');
          const buy = actions.find(
            (c) =>
              c.type === 'buy' &&
              c.kind === (p.healthPotions < (strategy === 'survival' ? 7 : 5) ? 'health' : 'mana'),
          );
          if (buy && (p.healthPotions < (strategy === 'survival' ? 7 : 5) || p.manaPotions < 4))
            return choose(buy, 'restock the finite potion belt');
          const gear = actions.find((c) => c.type === 'buy' && c.kind === 'gear');
          if (strategy === 'growth' && gear && p.gold >= 130 + input.act * 20)
            return choose(gear, 'invest surplus gold in gear');
          const back = find('return');
          if (back) return choose(back, 'return to the recorded public portal');
          const travel = actions.filter((c) => c.type === 'travel');
          return choose(
            travel.find((c) => c.region === input.region.id) ?? travel.at(-1) ?? advance(),
            'enter the campaign',
          );
        }
        const run = actions.find((c) => c.type === 'run' && c.enabled);
        if (run) return choose(run, 'enable the ordinary running control');
        const enemies = input.enemies
          .filter((e) => e.hp > 0 && !e.warded)
          .sort((a, b) => distance(p, a) - distance(p, b));
        work += input.enemies.length;
        const enemy = enemies[0];
        const moves = actions.filter((c) => c.type === 'move');
        const hazard = input.hazards.find((h) => h.delay > 0 && distance(p, h) < h.radius + 0.5);
        if (hazard && strategy !== 'immediate') {
          const blink = actions
            .filter((c) => c.type === 'cast')
            .filter((c) =>
              input.definitions.skills.some(
                (skill) => skill.id === c.skill && skill.effect === 'leap' && skill.damage === 0,
              ),
            )
            .sort((a, b) => distance(b.target, hazard) - distance(a.target, hazard))[0];
          if (blink && distance(blink.target, hazard) > distance(p, hazard) + 0.5)
            return choose(blink, 'blink to an offered known landing outside the warning');
          const escape = [...moves].sort(
            (a, b) => distance(b.target, hazard) - distance(a.target, hazard),
          )[0];
          if (escape && distance(escape.target, hazard) > distance(p, hazard) + 0.15)
            return choose(escape, 'leave the visible hazard warning');
        }
        const refill = find('portal');
        const healthLow = p.hp < input.stats.maxHp * (strategy === 'survival' ? 0.6 : 0.3);
        const manaLow = p.mana < input.stats.maxMana * 0.18;
        if (
          refill &&
          strategy !== 'immediate' &&
          (healthLow || manaLow) &&
          input.tick - memory.lastRefillTick >= 80 &&
          (!memory.lastRefillAt ||
            memory.lastRefillAt.region !== input.region.id ||
            distance(memory.lastRefillAt.at, p) > 4)
        ) {
          memory.lastRefillTick = input.tick;
          memory.lastRefillAt = { region: input.region.id, at: { x: p.x, y: p.y } };
          memory.refills++;
          return choose(refill, 'legal refuge heal; return is limited by executed ticks');
        }
        const mana = actions.find((c) => c.type === 'potion' && c.kind === 'mana');
        if (mana && enemy && p.mana < input.stats.maxMana * (strategy === 'immediate' ? 0.15 : 0.3))
          return choose(mana, 'restore combat mana');
        if (enemy) {
          const casts = actions.filter((c) => c.type === 'cast');
          const scored = casts
            .map((command) => {
              const def = input.definitions.skills.find((s) => s.id === command.skill)!;
              const center = def.effect === 'leap' || def.effect === 'curse' ? command.target : p;
              let value = 0;
              if (def.effect === 'summon') value = strategy === 'immediate' ? 25 : 100;
              else if (def.effect === 'projectile') {
                const target = enemies.find((e) => distance(e, command.target) < 0.05);
                if (target)
                  value =
                    def.damage *
                      (1 -
                        (input.definitions.monsters.find((m) => m.id === target.kind)!.resist[
                          def.element
                        ] ?? 0)) +
                    (def.pierce ? 4 : 0);
              } else if (def.damage) {
                value = enemies.reduce(
                  (n, e) =>
                    n +
                    (distance(center, e) <= def.radius
                      ? def.damage + (def.slow && strategy === 'survival' ? 15 : 0)
                      : 0),
                  0,
                );
                if (
                  def.effect === 'curse' &&
                  enemies.every((e) => e.cursed > 0 || distance(center, e) > def.radius)
                )
                  value = 0;
              }
              return { command, value };
            })
            .sort((a, b) => b.value - a.value);
          work += casts.length;
          if (scored[0]?.value > 0)
            return choose(scored[0].command, 'use an offered hero combat skill');
          if (
            strategy === 'survival' &&
            !melee &&
            distance(p, enemy) < 2.6 &&
            p.hp < input.stats.maxHp * 0.8
          ) {
            const retreat = [...moves].sort(
              (a, b) => distance(b.target, enemy) - distance(a.target, enemy),
            )[0];
            if (retreat && distance(retreat.target, enemy) > distance(p, enemy) + 0.5)
              return choose(retreat, 'ranged spacing while wounded');
          }
          const attack = actions.find((c) => c.type === 'attack' && c.target === enemy.uid);
          if (attack && p.target !== enemy.uid)
            return choose(attack, 'focus the nearest visible foe');
          if (!attack && p.target === null && !p.destination) {
            const approach = [...moves].sort(
              (a, b) => distance(a.target, enemy) - distance(b.target, enemy),
            )[0];
            if (approach && distance(approach.target, enemy) < distance(p, enemy) - 0.1)
              return choose(approach, 'approach the visible foe through offered known terrain');
          }
          return choose(advance(), 'resolve combat and cooldowns');
        }
        if (p.target !== null)
          return choose(find('steer')!, 'stop chasing a target outside the current sensor');
        const nearby = input.markers.filter((m) => distance(p, m.at) < 2);
        const interaction = find('interact');
        if (
          interaction &&
          nearby.some((m) => (m.kind === 'ward' && !m.active) || (m.kind === 'chest' && !m.active))
        )
          return choose(interaction, 'activate the known local objective');
        const wanted = nextRegion(input),
          local = input.atlas.regions.find((r) => r.id === input.region.id)!;
        const portal = nearby.find(
          (m) =>
            m.kind === 'portal' &&
            m.active &&
            (m.target === wanted || (local.bossDefeated && m.requires === 'boss')),
        );
        const use = portal && actions.find((c) => c.type === 'use-portal' && c.id === portal.id);
        if (use) return choose(use, 'follow public atlas topology');
        if (p.destination && distance(p, p.destination) > 0.15)
          return choose(advance(), 'complete the adjacent known-cell step');
        let regionMemory = memory.regions.get(input.region.id);
        if (!regionMemory) {
          regionMemory = { exhausted: new Set(), frontier: null, goal: null, visits: new Map() };
          memory.regions.set(input.region.id, regionMemory);
        }
        const current = cellKey(p, input.region.width);
        regionMemory.visits.set(current, (regionMemory.visits.get(current) ?? 0) + 1);
        const navigation = navigate(input, regionMemory, strategy);
        pathNodes = navigation.nodes;
        work += pathNodes + navigation.evaluations;
        if (navigation.move) return choose(navigation.move, navigation.reason);
        return choose(advance(20), navigation.reason);
      };
    },
  };
}
export const builtins = Object.fromEntries(
  STRATEGIES.map((strategy) => [strategy, factory(strategy)]),
) as Record<Strategy, PolicyFactory<Observation, PolicyCommand>>;
