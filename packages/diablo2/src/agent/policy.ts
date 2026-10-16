import type { PolicyFactory, Proposal } from '../../../../src/shared/policy/types';
import { freeCell } from '../domain/loot';
import { lineOfSight } from '../domain/maps';
import { skillDamage, damageAfterResistance } from '../domain/stats';
import { STEP_SCALE } from '../domain/timing';
import type { Item, Point } from '../domain/types';
import { terrainRows, type Observation, type PolicyCommand } from './observation';

export const STRATEGIES = ['immediate', 'survival', 'growth'] as const;
export type Strategy = (typeof STRATEGIES)[number];
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const MOVEMENT_HORIZON_TICKS = 5;
const directions = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as const;
const cellKey = (at: Point, width: number) => Math.floor(at.y) * width + Math.floor(at.x);
/** Distance between two disclosed swept segments; intersections are conservative
 * even if the two objects would reach that point at different instants. */
function segmentDistance(a: Point, b: Point, c: Point, d: Point): number {
  const cross = (p: Point, q: Point, r: Point) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const pointSegment = (p: Point, q: Point, r: Point) => {
    const dx = r.x - q.x,
      dy = r.y - q.y,
      length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((p.x - q.x) * dx + (p.y - q.y) * dy) / length)) : 0;
    return distance(p, { x: q.x + t * dx, y: q.y + t * dy });
  };
  if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return 0;
  return Math.min(
    pointSegment(a, c, d),
    pointSegment(b, c, d),
    pointSegment(c, a, b),
    pointSegment(d, a, b),
  );
}
function compareRank(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}
interface RegionMemory {
  exhausted: Set<number>;
  frontier: number | null;
  goal: string | null;
  visits: Map<number, number>;
}
interface CombatProgress {
  region: string;
  uid: number;
  hp: number;
  changedAt: number;
  casts: number;
  at: Point;
  origin: number | null;
  failedOrigins: Set<number>;
}
interface Memory {
  regions: Map<string, RegionMemory>;
  lastTick: number;
  previous: PolicyCommand | null;
  lastRefillTick: number;
  lastRefillAt: { region: string; at: Point } | null;
  refills: number;
  attributes: number;
  combat: CombatProgress | null;
  combatRegion: string | null;
  targets: Map<number, CombatProgress>;
  recovering: boolean;
  pursuit: { region: string; uid: number; at: { x: number; y: number } } | null;
}
function navigationMemory(memory: Memory, region: string): RegionMemory {
  let result = memory.regions.get(region);
  if (!result) {
    result = { exhausted: new Set(), frontier: null, goal: null, visits: new Map() };
    memory.regions.set(region, result);
  }
  return result;
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
  const wards = chapter.wards.filter((id) => !input.atlas.progress.wards.includes(id));
  const destination = wards[0] ?? chapter.bossRegion;
  if (input.region.id === destination) return null;
  if (region.id === chapter.bossRegion && input.atlas.progress.bosses.includes(region.id)) {
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
      if (portal.requires === 'boss' && !input.atlas.progress.bosses.includes(current.id)) continue;
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
 * A route selects the furthest offered straight prefix, stopping at each turn. */
function navigate(
  input: Observation,
  memory: RegionMemory,
  strategy: Strategy,
  combatTarget?: Point,
  excludedAttackCells: ReadonlySet<number> = new Set(),
): Navigation {
  const { player: p } = input;
  const r = { ...input.region, tiles: terrainRows(input.region) };
  const width = r.width,
    start = cellKey(p, width),
    queue = [start];
  const parent = new Map<number, number>([[start, -1]]),
    steps = new Map<number, number>([[start, 0]]);
  const walkable = (x: number, y: number) => '.,:;='.includes(r.tiles[y]?.[x] ?? '#');
  // Fractional footprint restrictions belong in the search, not after it.
  const firstSteps = new Set(
    input.actions.flatMap((command) =>
      command.type === 'move' ? [cellKey(command.target, width)] : [],
    ),
  );
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
        (cell === start && !firstSteps.has(next)) ||
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
  const wardNeeded = chapter.wards.includes(r.id) && !input.atlas.progress.wards.includes(r.id);
  const bossDone = input.atlas.progress.bosses.includes(r.id);
  const goals: { id: string; at: Point; priority: number; reason: string; reach: number }[] = [];
  if (combatTarget)
    goals.push({
      id: 'visible-foe',
      at: combatTarget,
      priority: 200,
      reason: 'route around known terrain to the visible foe',
      reach:
        input.definitions.heroes.find((hero) => hero.id === input.hero)!.attack === 'melee'
          ? 1.6
          : 5.9,
    });
  for (const marker of combatTarget ? [] : input.markers) {
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
  for (const drop of combatTarget ? [] : input.drops) {
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
      // The current node is an actual fractional position, not an ideal center.
      // Otherwise a goal can appear reached while native pickup is still out of range.
      const at =
        cell === start ? p : { x: (cell % width) + 0.5, y: Math.floor(cell / width) + 0.5 };
      if (
        distance(at, goal.at) > goal.reach ||
        (combatTarget && (excludedAttackCells.has(cell) || !lineOfSight(r, at, goal.at)))
      )
        continue;
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
    !combatTarget &&
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
      // Unknown walls remain uncertain: optimistic discovery only ranks
      // scouting positions; movement itself never crosses unknown terrain.
      const at = { x: x + 0.5, y: y + 0.5 };
      let discovery = 0;
      for (let ny = Math.max(0, y - 7); ny <= Math.min(r.height - 1, y + 7); ny++)
        for (let nx = Math.max(0, x - 7); nx <= Math.min(r.width - 1, x + 7); nx++) {
          if (r.tiles[ny][nx] !== '?') continue;
          const unseen = { x: nx + 0.5, y: ny + 0.5 };
          evaluations++;
          if (distance(at, unseen) <= 7 && lineOfSight(r, at, unseen)) discovery++;
        }
      const value = discovery - steps.get(cell)! * 0.5 - (memory.visits.get(cell) ?? 0) * 2;
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
  const route: number[] = [];
  for (let cell = target; cell !== start; cell = parent.get(cell)!) route.unshift(cell);
  const firstDirection = route[0] - start;
  let move: PolicyCommand | null = null;
  for (let i = 0; i < Math.min(4, route.length); i++) {
    if (route[i] - (i ? route[i - 1] : start) !== firstDirection) break;
    const at = { x: (route[i] % width) + 0.5, y: Math.floor(route[i] / width) + 0.5 };
    const offered = input.actions.find((c) => c.type === 'move' && distance(c.target, at) < 0.01);
    if (!offered) break;
    move = offered;
  }
  return { move, reason, nodes: queue.length, evaluations };
}

function factory(strategy: Strategy): PolicyFactory<Observation, PolicyCommand> {
  return {
    id: strategy,
    version: 'emberwake-policy-8',
    create() {
      const memory: Memory = {
        regions: new Map(),
        lastTick: -1,
        previous: null,
        lastRefillTick: -1000,
        lastRefillAt: null,
        refills: 0,
        attributes: 0,
        pursuit: null,
        combat: null,
        combatRegion: null,
        targets: new Map(),
        recovering: false,
      };
      return (input): Proposal<PolicyCommand> => {
        const p = input.player,
          actions = input.actions;
        let work = actions.length,
          pathNodes = 0;
        const melee =
          input.definitions.heroes.find((hero) => hero.id === input.hero)!.attack === 'melee';
        const choose = (command: PolicyCommand, reason: string): Proposal<PolicyCommand> => {
          if (
            command.type === 'cast' &&
            memory.combat &&
            input.enemies.some(
              (foe) => foe.uid === memory.combat!.uid && distance(foe, command.target) < 0.05,
            ) &&
            input.definitions.skills.some(
              (skill) => skill.id === command.skill && skill.effect === 'projectile',
            )
          ) {
            const origin = cellKey(p, input.region.width);
            if (memory.combat.origin !== origin) {
              memory.combat.origin = origin;
              memory.combat.casts = 0;
              memory.combat.changedAt = input.tick;
            }
            memory.combat.casts++;
          }
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
              lastSeenFoe: memory.pursuit,
              recovering: memory.recovering,
              combatProgress: memory.combat
                ? {
                    uid: memory.combat.uid,
                    hp: memory.combat.hp,
                    casts: memory.combat.casts,
                    failedOrigins: memory.combat.failedOrigins.size,
                    unchangedTicks: input.tick - memory.combat.changedAt,
                  }
                : null,
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
          return choose(
            advance(
              memory.previous.type === 'move' &&
                !memory.pursuit &&
                !input.enemies.some((e) => e.hp > 0 && !e.warded) &&
                !input.hazards.length &&
                !input.projectiles.some((v) => !v.friendly)
                ? 10
                : 5,
            ),
            'execute the selected control',
          );
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
        if (memory.combatRegion !== input.region.id) {
          memory.targets.clear();
          memory.combat = null;
          memory.combatRegion = input.region.id;
        }
        for (const foe of input.enemies) {
          if (foe.hp <= 0) {
            memory.targets.delete(foe.uid);
            if (memory.combat?.uid === foe.uid) memory.combat = null;
            continue;
          }
          let progress = memory.targets.get(foe.uid);
          if (!progress) {
            progress = {
              region: input.region.id,
              uid: foe.uid,
              hp: foe.hp,
              at: { x: foe.x, y: foe.y },
              changedAt: input.tick,
              casts: 0,
              origin: null,
              failedOrigins: new Set(),
            };
            memory.targets.set(foe.uid, progress);
          } else {
            if (foe.hp < progress.hp) {
              progress.failedOrigins.clear();
              progress.casts = 0;
              progress.origin = null;
              progress.changedAt = input.tick;
            }
            progress.hp = foe.hp;
            progress.at = { x: foe.x, y: foe.y };
          }
        }
        // Sensor loss is not evidence of damage or death. Retain disclosed feedback.
        if (enemy) memory.combat = memory.targets.get(enemy.uid)!;
        if (p.hp >= input.stats.maxHp * 0.7 || heal || input.location !== 'field')
          memory.recovering = false;
        const healthRecoveryPending =
          p.healthPotions > 0 && (p.cooldowns['@health-potion'] ?? 0) > 0;
        if (strategy === 'survival' && !heal && enemy && p.hp < input.stats.maxHp * 0.6)
          memory.recovering = true;
        const timedRecovery = strategy === 'survival' && memory.recovering && healthRecoveryPending;
        if (enemy)
          memory.pursuit = {
            region: input.region.id,
            uid: enemy.uid,
            at: { x: enemy.x, y: enemy.y },
          };
        else if (
          memory.pursuit &&
          (memory.pursuit.region !== input.region.id ||
            input.enemies.some((foe) => foe.uid === memory.pursuit!.uid && foe.hp === 0))
        )
          memory.pursuit = null;
        const moves = actions.filter((c) => c.type === 'move');
        const warnings = input.hazards.filter((h) => h.delay > 0);
        const hostileShots = input.projectiles.filter((shot) => !shot.friendly);
        const hazard = warnings.some((h) => distance(p, h) < h.radius + 0.5);
        // Once warning/projectile danger is tied, a healthy melee escape should
        // preserve attack reach instead of repeatedly retreating and pursuing back.
        // Recovery retains its existing maximum-foe-clearance objective.
        const engagementTarget =
          hazard && melee && !memory.recovering && p.hp >= input.stats.maxHp * 0.7
            ? (enemy ?? memory.pursuit?.at)
            : undefined;
        // Only stocked pending Survival recovery looks two five-tick decisions ahead.
        // Relative straight motion is a public ranking heuristic, not a collision
        // prediction: no wall response, future shots or foe motion is simulated.
        // Its allowance covers initial center alignment and running-to-walking/slow
        // speed shortfall. Other modes retain their original five-tick envelope.
        const horizon = timedRecovery ? 10 : MOVEMENT_HORIZON_TICKS;
        const speed = (p.running ? 0.52 : 0.34) * STEP_SCALE;
        const movementAllowance = timedRecovery
          ? Math.SQRT1_2 +
            Math.max(0, speed - 0.34 * STEP_SCALE * (p.slow > 0 ? 0.55 : 1)) * horizon
          : 0.5;
        const safety = (at: Point, teleport = false) => {
          // Deterministic public-work units: pending recovery additionally evaluates
          // relative shot motion and the public speed/alignment allowance.
          work +=
            warnings.length +
            hostileShots.length * (timedRecovery ? 2 : 1) +
            enemies.length +
            Number(!!engagementTarget) +
            (timedRecovery ? 2 : 0);
          const length = distance(p, at);
          const travel = Math.min(length, speed * horizon);
          const end =
            teleport || !length
              ? at
              : {
                  x: p.x + ((at.x - p.x) * travel) / length,
                  y: p.y + ((at.y - p.y) * travel) / length,
                };
          const warning = Math.min(2, ...warnings.map((h) => distance(at, h) - h.radius - 0.4));
          const projectile = Math.min(
            2,
            ...hostileShots.map(
              (shot) =>
                (timedRecovery && !teleport
                  ? segmentDistance(
                      { x: p.x - shot.x, y: p.y - shot.y },
                      {
                        x: end.x - shot.x - shot.dx * STEP_SCALE * horizon,
                        y: end.y - shot.y - shot.dy * STEP_SCALE * horizon,
                      },
                      { x: 0, y: 0 },
                      { x: 0, y: 0 },
                    )
                  : segmentDistance(teleport ? at : p, end, shot, {
                      x: shot.x + shot.dx * STEP_SCALE * horizon,
                      y: shot.y + shot.dy * STEP_SCALE * horizon,
                    })) -
                shot.radius -
                0.35 -
                (teleport ? 0 : movementAllowance),
            ),
          );
          const foes = Math.min(8, ...enemies.map((foe) => distance(at, foe)));
          return [
            Number(warning >= 0 && projectile >= 0),
            Math.min(projectile, 0),
            Math.min(warning, 0),
            engagementTarget ? -Math.max(0, distance(at, engagementTarget) - 1.6) : foes,
            warning,
            projectile,
          ];
        };
        const rankedMoves = moves
          .map((command) => ({ command, rank: safety(command.target) }))
          .sort((a, b) => compareRank(b.rank, a.rank));
        if (hazard && strategy !== 'immediate') {
          const current = safety(p);
          const blink = actions
            .filter((c) => c.type === 'cast')
            .filter((c) =>
              input.definitions.skills.some(
                (skill) => skill.id === c.skill && skill.effect === 'leap' && skill.damage === 0,
              ),
            )
            .map((command) => ({ command, rank: safety(command.target, true) }))
            .sort((a, b) => compareRank(b.rank, a.rank))[0];
          if (blink && compareRank(blink.rank, current) > 0)
            return choose(blink.command, 'blink to an offered known landing outside the warning');
          const escape = rankedMoves[0];
          if (escape && compareRank(escape.rank, current) > 0)
            return choose(escape.command, 'leave the visible hazard warning');
        }
        const refill = find('portal');
        const healthLow = p.hp < input.stats.maxHp * (strategy === 'survival' ? 0.6 : 0.3);
        const manaLow = p.mana < input.stats.maxMana * 0.18;
        const packFull =
          p.inventory.length > 0 &&
          input.definitions.items.some((item) => freeCell(p.inventory, item) === null);
        if (
          refill &&
          (packFull || (strategy !== 'immediate' && (healthLow || manaLow))) &&
          input.tick - memory.lastRefillTick >= 80 &&
          (!memory.lastRefillAt ||
            memory.lastRefillAt.region !== input.region.id ||
            distance(memory.lastRefillAt.at, p) > 4)
        ) {
          memory.lastRefillTick = input.tick;
          memory.lastRefillAt = { region: input.region.id, at: { x: p.x, y: p.y } };
          memory.refills++;
          return choose(
            refill,
            packFull
              ? 'sell carried gear to free public inventory space'
              : 'legal refuge heal; return is limited by executed ticks',
          );
        }
        // Recovery is owned public state. Do not keep trading damage merely because
        // an offensive spell is ready while the health potion is still unavailable.
        // Keep the best disclosed danger class for route roots; foe clearance then
        // ranks direct retreat without overriding warnings or incoming shot motion.
        const safeMoves = rankedMoves
          .filter(
            (move) => compareRank(move.rank.slice(0, 3), rankedMoves[0].rank.slice(0, 3)) === 0,
          )
          .map((move) => move.command);
        if (strategy === 'survival' && memory.recovering) {
          if (healthRecoveryPending) {
            const escape = rankedMoves[0],
              currentDanger = safety(p).slice(0, 3);
            if (escape && compareRank(escape.rank.slice(0, 3), currentDanger) > 0)
              return choose(
                escape.command,
                'escape disclosed danger while awaiting health recovery',
              );
          }
          if (healthRecoveryPending && enemy && !input.hazards.length && !hostileShots.length) {
            // Offered melee/nova casts resolve now without moving or advancing time.
            // Require every disclosed attacker to be covered and killed; a distant
            // second foe makes an otherwise lethal local cast insufficient.
            const terrain = { tiles: terrainRows(input.region) };
            for (const command of actions) {
              if (command.type !== 'cast') continue;
              const skill = input.definitions.skills.find((value) => value.id === command.skill);
              work += input.definitions.skills.length;
              if (!skill || !['melee', 'nova'].includes(skill.effect) || skill.damage <= 0)
                continue;
              const damage = skillDamage(
                skill,
                p.skills[skill.id] ?? 0,
                p.attributes.strength,
                input.stats.spell,
              );
              const finishes = enemies.every((foe) => {
                work += input.definitions.monsters.length + Math.ceil(distance(p, foe) * 5) + 1;
                const definition = input.definitions.monsters.find(
                  (value) => value.id === foe.kind,
                );
                return (
                  definition &&
                  distance(p, foe) <= skill.radius &&
                  lineOfSight(terrain, p, foe) &&
                  damageAfterResistance(damage, definition.resist[skill.element], foe.cursed > 0) >=
                    foe.hp
                );
              });
              if (finishes)
                return choose(command, 'finish every disclosed attacker before recovery');
            }
          }
          if (enemy) {
            const clearance = (at: { x: number; y: number }) =>
              Math.min(...enemies.map((foe) => distance(at, foe)));
            work += enemies.length;
            const retreat = safeMoves[0];
            if (retreat && clearance(retreat.target) > clearance(p) + 0.5)
              return choose(retreat, 'retreat while health recovery is unavailable');
            if (healthRecoveryPending) {
              // No improving retreat is not permission to chase or leap back into combat.
              // Warning escape already ran; retreat keeps the disclosed shot ranking.
              const stop = find('steer');
              if (stop && (p.target !== null || p.destination))
                return choose(stop, 'stop offensive control while awaiting health recovery');
              return choose(advance(), 'await health recovery without offensive pursuit');
            }
            // An empty belt or elapsed cooldown cannot justify indefinite recovery waits.
            memory.recovering = false;
          } else if (healthRecoveryPending) {
            const stop = find('steer');
            if (stop && (p.target !== null || p.destination))
              return choose(stop, 'stop chasing while health recovery is unavailable');
            // Losing sight while retreating must not immediately chase the same foe.
            return choose(advance(), 'hold the known safe position for health recovery');
          } else memory.recovering = false;
        }
        const progress = memory.combat;
        if (
          progress &&
          progress.casts >= 3 &&
          input.tick - progress.changedAt >= 80 &&
          progress.origin !== null
        ) {
          progress.failedOrigins.add(progress.origin);
          progress.casts = 0;
        }
        if (
          progress?.failedOrigins.size &&
          p.destination &&
          progress.failedOrigins.has(cellKey(p.destination, input.region.width))
        ) {
          const stop = find('steer');
          if (stop) return choose(stop, 'cancel pursuit of a disclosed failed firing origin');
        }
        if (
          progress?.failedOrigins.size &&
          (!enemy || progress.failedOrigins.has(cellKey(p, input.region.width)))
        ) {
          const navigation = navigate(
            {
              ...input,
              actions: actions.filter(
                (command) => command.type !== 'move' || safeMoves.includes(command),
              ),
            },
            navigationMemory(memory, input.region.id),
            strategy,
            progress.at,
            progress.failedOrigins,
          );
          pathNodes = navigation.nodes;
          work += pathNodes + navigation.evaluations;
          if (navigation.move) {
            if (
              p.destination &&
              navigation.move.type === 'move' &&
              distance(p.destination, navigation.move.target) < 0.01
            )
              return choose(advance(), 'complete the known combat reposition');
            return choose(navigation.move, 'change known firing angle after stalled damage');
          }
          if (progress.failedOrigins.has(cellKey(p, input.region.width)))
            return choose(advance(), 'no alternative disclosed firing route is currently offered');
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
            const retreat = safeMoves[0];
            if (retreat && distance(retreat.target, enemy) > distance(p, enemy) + 0.5)
              return choose(retreat, 'ranged spacing while wounded');
          }
          const attack = actions.find((c) => c.type === 'attack' && c.target === enemy.uid);
          if (attack && p.target !== enemy.uid)
            return choose(attack, 'focus the nearest visible foe');
          if (!attack && p.target === null && !p.destination) {
            let regionMemory = memory.regions.get(input.region.id);
            if (!regionMemory) {
              regionMemory = {
                exhausted: new Set(),
                frontier: null,
                goal: null,
                visits: new Map(),
              };
              memory.regions.set(input.region.id, regionMemory);
            }
            const navigation = navigate(input, regionMemory, strategy, enemy);
            pathNodes = navigation.nodes;
            work += pathNodes + navigation.evaluations;
            if (navigation.move) return choose(navigation.move, navigation.reason);
          }
          return choose(advance(), 'resolve combat and cooldowns');
        }
        if (p.target !== null)
          return choose(find('steer')!, 'stop chasing a target outside the current sensor');
        if (memory.pursuit) {
          if (
            distance(p, memory.pursuit.at) <= (melee ? 1.6 : 5.9) &&
            lineOfSight({ tiles: terrainRows(input.region) }, p, memory.pursuit.at)
          )
            memory.pursuit = null;
          else {
            if (p.destination)
              return choose(advance(), 'follow the known route toward the last visible foe');
            let regionMemory = memory.regions.get(input.region.id);
            if (!regionMemory) {
              regionMemory = {
                exhausted: new Set(),
                frontier: null,
                goal: null,
                visits: new Map(),
              };
              memory.regions.set(input.region.id, regionMemory);
            }
            const navigation = navigate(
              input,
              regionMemory,
              strategy,
              memory.pursuit.at,
              memory.targets.get(memory.pursuit.uid)?.failedOrigins,
            );
            pathNodes = navigation.nodes;
            work += pathNodes + navigation.evaluations;
            if (navigation.move)
              return choose(navigation.move, 'pursue the last visible foe through known terrain');
            memory.pursuit = null;
          }
        }
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
            (m.target === wanted ||
              (input.atlas.progress.bosses.includes(local.id) && m.requires === 'boss')),
        );
        const use = portal && actions.find((c) => c.type === 'use-portal' && c.id === portal.id);
        if (use) return choose(use, 'follow public atlas topology');
        if (p.destination && distance(p, p.destination) > 0.15)
          return choose(
            advance(input.hazards.length || input.projectiles.some((v) => !v.friendly) ? 5 : 10),
            'complete the known straight route segment',
          );
        const regionMemory = navigationMemory(memory, input.region.id);
        const current = cellKey(p, input.region.width);
        regionMemory.visits.set(current, (regionMemory.visits.get(current) ?? 0) + 1);
        const navigation = navigate(input, regionMemory, strategy);
        pathNodes = navigation.nodes;
        work += pathNodes + navigation.evaluations;
        if (navigation.move) return choose(navigation.move, navigation.reason);
        return choose(advance(10), navigation.reason);
      };
    },
  };
}
export const builtins = Object.fromEntries(
  STRATEGIES.map((strategy) => [strategy, factory(strategy)]),
) as Record<Strategy, PolicyFactory<Observation, PolicyCommand>>;
