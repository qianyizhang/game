import { boon, weapon } from '../../src/games/night-passage/domain/content';
import { hazardPhase, hazardTiming } from '../../src/games/night-passage/domain/encounters';
import { attackShapes, threatens } from '../../src/games/night-passage/domain/threats';
import {
  angle,
  clearLine,
  distance,
  headingTo,
} from '../../src/games/night-passage/domain/geometry';
import type { Command, Point, State } from '../../src/games/night-passage/domain/types';

/** A legal-command verification pilot. It receives the same visible arena information as a player. */
export function passageCommand(state: State): Command {
  const p = state.player;
  if (state.phase === 'reward') {
    const score = (id: string): number => {
      const b = boon(id);
      const existing = p.boons.find((entry) => boon(entry.id).slot === b.slot);
      return (
        (b.slot === 'attack'
          ? 80
          : b.slot === 'special'
            ? 60
            : b.slot === 'call'
              ? 50
              : b.slot === 'cast'
                ? 45
                : 30) +
        (existing?.id === id ? 30 : existing ? -50 : 0) +
        (b.god === 'winter' ? 12 : b.god === 'cinder' ? 10 : 0)
      );
    };
    return { type: 'choose', id: [...state.offers].sort((a, b) => score(b) - score(a))[0] };
  }
  if (state.phase === 'route') {
    const rank = {
      heart: 80,
      fountain: p.hp < p.maxHp - 25 ? 100 : 10,
      boon: 60,
      upgrade: 50,
      shop: state.gold >= 80 ? 70 : 0,
      coin: 20,
      trial: 15,
    };
    return {
      type: 'travel',
      index: state.routes
        .map((r, index) => ({ index, score: rank[r.reward] }))
        .sort((a, b) => b.score - a.score)[0].index,
    };
  }
  if (state.phase === 'shop') {
    if (p.hp < p.maxHp - 25 && state.gold >= 35 && !state.purchases.includes('heal'))
      return { type: 'buy', item: 'heal' };
    if (state.gold >= 60 && !state.purchases.includes('heart'))
      return { type: 'buy', item: 'heart' };
    if (state.gold >= 80 && !state.purchases.includes('boon')) return { type: 'buy', item: 'boon' };
    return { type: 'leave' };
  }
  if (state.phase !== 'combat') throw new Error(`Pilot cannot act in ${state.phase}`);
  const enemy = [...state.enemies].sort((a, b) => distance(p, a) - distance(p, b))[0];
  const aim = enemy ? angle(p, enemy) : p.aim;
  const d = enemy ? distance(p, enemy) : 0;
  const bow = p.weapon === 'bow';
  const desired = bow ? 230 : weapon(p.weapon).attack.reach * 0.7;
  let direction = aim + (d < desired - 15 ? Math.PI : d > desired + 10 ? 0 : Math.PI / 2);
  if (enemy && !clearLine(state, p, enemy, 8)) direction = headingTo(state, p, enemy, 14);
  let danger: Point | undefined;
  const threats = state.enemies
    .filter((e) => e.windup > 0 && e.windup < 35)
    .flatMap((foe) => attackShapes(foe, state.region));
  if (threats.some((shape) => threatens(shape, p, 24))) {
    const escape = Array.from({ length: 16 }, (_, i) => (i * Math.PI) / 8)
      .map((a) => {
        const next = { x: p.x + Math.cos(a) * 125, y: p.y + Math.sin(a) * 125 };
        const score =
          threats.filter((shape) => threatens(shape, next, 24)).length * 1000 +
          (next.x < 60 || next.x > 900 || next.y < 60 || next.y > 540 ? 2000 : 0) +
          state.room.pillars.filter((pillar) => distance(next, pillar) < pillar.radius + 20)
            .length *
            1000 +
          Math.abs((enemy ? distance(enemy, next) : 0) - desired);
        return { a, score };
      })
      .sort((a, b) => a.score - b.score)[0];
    danger = { x: p.x - Math.cos(escape.a) * 50, y: p.y - Math.sin(escape.a) * 50 };
  }
  for (const h of state.room.hazards)
    if (
      hazardPhase(state.tick, h.offset) > hazardTiming(h).warning &&
      distance(p, h) < h.radius + 30
    )
      danger = h;
  const projectile = state.projectiles.find(
    (shot) =>
      shot.hostile &&
      distance(shot, p) < 70 &&
      (p.x - shot.x) * shot.vx + (p.y - shot.y) * shot.vy > 0,
  );
  if (projectile) direction = Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2;
  if (danger) direction = distance(p, danger) < 3 ? aim + Math.PI / 2 : angle(danger, p);
  // Steer around solid pillars and away from boundary corners.
  const next = { x: p.x + Math.cos(direction) * 55, y: p.y + Math.sin(direction) * 55 };
  if (state.room.pillars.some((pillar) => distance(next, pillar) < pillar.radius + 22))
    direction += Math.PI / 2;
  if (
    (p.x < 80 && Math.cos(direction) < 0) ||
    (p.x > 880 && Math.cos(direction) > 0) ||
    (p.y < 80 && Math.sin(direction) < 0) ||
    (p.y > 520 && Math.sin(direction) > 0)
  )
    direction = angle(p, { x: 480, y: 300 });
  return {
    type: 'frame',
    ticks: 6,
    input: {
      x: Math.cos(direction),
      y: Math.sin(direction),
      aim,
      attack: true,
      special: state.tick % 180 < 24 && d < weapon(p.weapon).special.reach,
      dash: !!danger || !!projectile,
      cast: p.casts > 0 && d > 170 && state.tick % 90 < 6,
      call: p.charge >= 100 && d < 240 && p.boons.some((b) => boon(b.id).slot === 'call'),
    },
  };
}
