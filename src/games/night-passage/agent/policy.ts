import type { Sight } from '../application/control';
import type { Command, Point } from '../domain/types';
import { angle, distance } from '../domain/geometry';
import { threatens } from '../domain/threats';
import { playerConfig, type PlayerConfig } from './player';

export const POLICY_VERSION = 'night-passage-policy-1';
export type Policy = 'quick' | 'balanced' | 'deliberate';
export const POLICIES: readonly Policy[] = ['quick', 'balanced', 'deliberate'];
export const POLICY_CONFIG = {
  quick: { directions: 4, checkPath: false },
  balanced: { directions: 8, checkPath: false },
  deliberate: { directions: 8, checkPath: true },
} as const;
export interface Work {
  entities: number;
  candidates: number;
  geometry: number;
  total: number;
}
export interface Decision {
  command: Command;
  work: Work;
}
function choice(o: Sight): Command {
  if (o.phase === 'reward') {
    const rank = (b: Sight['offers'][number]) => {
      const existing = o.catalog.boons.find((e) => e.slot === b.slot);
      return (
        { attack: 80, special: 60, call: 50, cast: 45, dash: 30, duo: 30 }[b.slot] +
        (existing?.id === b.id ? 30 : existing ? -50 : 0) +
        (b.god === 'winter' ? 12 : b.god === 'cinder' ? 10 : 0)
      );
    };
    return [...o.offers].sort((a, b) => rank(b) - rank(a))[0].command;
  }
  if (o.phase === 'route') {
    const rank = {
      heart: 80,
      fountain: o.player.hp < o.player.maxHp - 25 ? 100 : 10,
      boon: 60,
      upgrade: 50,
      shop: o.gold >= 80 ? 70 : 0,
      coin: 20,
      trial: 15,
    };
    return [...o.routes].sort((a, b) => rank[b.reward] - rank[a.reward])[0].command;
  }
  if (o.phase === 'shop') {
    for (const item of ['heal', 'heart', 'boon']) {
      if (item === 'heal' && o.player.hp >= o.player.maxHp - 25) continue;
      const c = o.legalActions.find((c) => c.type === 'buy' && c.item === item);
      if (c) return c;
    }
    return { type: 'leave' };
  }
  throw new Error(`Policy cannot act in ${o.phase}.`);
}
/** Work is a deterministic proxy: marked scans, escape candidates and geometry helpers. */
export function createPolicy(policy: Policy = 'balanced', parameters: Partial<PlayerConfig> = {}) {
  const settings = playerConfig({ decisionTicks: 1, ...parameters });
  if (!POLICIES.includes(policy)) throw new Error('Unknown policy.');
  const config = POLICY_CONFIG[policy];
  return (o: Sight): Decision => {
    const work: Work = { entities: 0, candidates: 0, geometry: 0, total: 0 };
    const finish = (command: Command): Decision => {
      work.total = work.entities + work.candidates + work.geometry;
      return { command, work };
    };
    if (o.phase !== 'combat') return finish(choice(o));
    const p = o.player;
    const dist = (a: Point, b: Point) => {
      work.geometry++;
      return distance(a, b);
    };
    const hits = (shape: Parameters<typeof threatens>[0], point: Point, r = 24) => {
      work.geometry++;
      return threatens(shape, point, r);
    };
    const clearLine = (_o: Sight, from: Point, to: Point, clearance = 0) => {
      const dx = to.x - from.x,
        dy = to.y - from.y,
        squared = dx * dx + dy * dy;
      return o.room.pillars.every((pillar) => {
        work.entities++;
        work.geometry++;
        const t = squared
          ? Math.max(
              0,
              Math.min(1, ((pillar.x - from.x) * dx + (pillar.y - from.y) * dy) / squared),
            )
          : 0;
        return (
          dist(pillar, { x: from.x + t * dx, y: from.y + t * dy }) >= pillar.radius + clearance
        );
      });
    };
    const headingTo = (_o: Sight, from: Point, target: Point, radius: number) => {
      const dx = target.x - from.x,
        dy = target.y - from.y,
        squared = dx * dx + dy * dy;
      const blockers = o.room.pillars
        .filter((pillar) => {
          work.entities++;
          work.geometry++;
          const t = squared
            ? Math.max(
                0,
                Math.min(1, ((pillar.x - from.x) * dx + (pillar.y - from.y) * dy) / squared),
              )
            : 0;
          return (
            dist(pillar, { x: from.x + t * dx, y: from.y + t * dy }) < pillar.radius + radius + 8
          );
        })
        .sort((a, b) => dist(from, a) - dist(from, b));
      const pillar = blockers[0];
      if (!pillar) return angle(from, target);
      const a = angle(pillar, from);
      const points = [-1, 1].map((sign) => ({
        x: pillar.x + Math.cos(a + (sign * Math.PI) / 3) * (pillar.radius + radius + 28),
        y: pillar.y + Math.sin(a + (sign * Math.PI) / 3) * (pillar.radius + radius + 28),
      }));
      points.sort((a, b) => dist(a, target) - dist(b, target));
      return angle(from, points[0]);
    };
    let enemy: Sight['enemies'][number] | undefined;
    let closest = Infinity;
    for (const e of o.enemies) {
      work.entities++;
      const d = dist(p, e);
      if (d < closest) {
        closest = d;
        enemy = e;
      }
    }
    const aim = enemy ? angle(p, enemy) : p.aim;
    const d = enemy ? dist(p, enemy) : 0;
    const weapon = o.catalog.weapon;
    const desired =
      p.weapon === 'bow' ? settings.bowDistance : weapon.attack.reach * settings.meleeReachRatio;
    let direction = aim + (d < desired - 15 ? Math.PI : d > desired + 10 ? 0 : Math.PI / 2);
    if (enemy && !clearLine(o, p, enemy, 8)) direction = headingTo(o, p, enemy, 14);
    let danger: Point | undefined;
    const threats = o.threats
      .filter((threat) => {
        work.entities++;
        return threat.stage === 'late';
      })
      .flatMap((threat) => threat.shapes);
    if (threats.some((shape) => hits(shape, p, 24))) {
      const escape = Array.from(
        { length: config.directions },
        (_, i) => (i * Math.PI * 2) / config.directions,
      )
        .map((a) => {
          work.candidates++;
          const next = { x: p.x + Math.cos(a) * 125, y: p.y + Math.sin(a) * 125 };
          const mid = { x: p.x + Math.cos(a) * 55, y: p.y + Math.sin(a) * 55 };
          let pathCost = 0;
          if (policy === 'deliberate') {
            work.candidates++;
            pathCost =
              threats.filter((shape) => hits(shape, mid, 24)).length * 250 +
              o.room.pillars.filter((pillar) => dist(mid, pillar) < pillar.radius + 20).length *
                1000;
          }
          const score =
            pathCost +
            threats.filter((shape) => hits(shape, next, 24)).length * 1000 +
            (next.x < 60 ||
            next.x > o.arena.width - 60 ||
            next.y < 60 ||
            next.y > o.arena.height - 60
              ? 2000
              : 0) +
            o.room.pillars.filter((pillar) => dist(next, pillar) < pillar.radius + 20).length *
              1000 +
            Math.abs((enemy ? dist(enemy, next) : 0) - desired);
          return { a, score };
        })
        .sort((a, b) => a.score - b.score)[0];
      danger = { x: p.x - Math.cos(escape.a) * 50, y: p.y - Math.sin(escape.a) * 50 };
    }
    for (const hazard of o.room.hazards) {
      work.entities++;
      if ((hazard.warning || hazard.active) && dist(p, hazard) < hazard.radius + 30)
        danger = hazard;
    }
    const projectile = o.projectiles.find(
      (shot) =>
        shot.hostile &&
        dist(shot, p) < 70 &&
        (!shot.velocity || (p.x - shot.x) * shot.velocity.x + (p.y - shot.y) * shot.velocity.y > 0),
    );
    if (projectile)
      direction = projectile.velocity
        ? Math.atan2(projectile.velocity.y, projectile.velocity.x) + Math.PI / 2
        : angle(projectile, p);
    if (danger) direction = dist(p, danger) < 3 ? aim + Math.PI / 2 : angle(danger, p);
    const next = { x: p.x + Math.cos(direction) * 55, y: p.y + Math.sin(direction) * 55 };
    if (o.room.pillars.some((pillar) => dist(next, pillar) < pillar.radius + 22))
      direction += Math.PI / 2;
    if (
      (p.x < 80 && Math.cos(direction) < 0) ||
      (p.x > o.arena.width - 80 && Math.cos(direction) > 0) ||
      (p.y < 80 && Math.sin(direction) < 0) ||
      (p.y > o.arena.height - 80 && Math.sin(direction) > 0)
    )
      direction = angle(p, { x: o.arena.width / 2, y: o.arena.height / 2 });
    return finish({
      type: 'frame',
      ticks: settings.decisionTicks,
      input: {
        x: Math.cos(direction),
        y: Math.sin(direction),
        aim,
        attack: true,
        special: o.tick % 180 < 24 && d < weapon.special.reach,
        dash: !!danger || !!projectile,
        cast: p.casts > 0 && d > 170 && o.tick % 90 < 6,
        call: p.charge >= 100 && d < 240 && o.catalog.boons.some((b) => b.slot === 'call'),
      },
    });
  };
}
