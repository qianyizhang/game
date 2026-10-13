import type { Observation } from '../application/agent';
import { angle, clearLine, distance, headingTo } from '../domain/geometry';
import { threatens } from '../domain/threats';
import type { Boon, Command, Point } from '../domain/types';

export const PLAYER_VERSION = 'night-passage-baseline-1';
export interface PlayerConfig {
  decisionTicks: number;
  bowDistance: number;
  meleeReachRatio: number;
}
export const DEFAULT_PLAYER_CONFIG: Readonly<PlayerConfig> = Object.freeze({
  decisionTicks: 6,
  bowDistance: 230,
  meleeReachRatio: 0.7,
});

/** These bounded knobs describe a candidate; changing them does not change the game. */
export function playerConfig(config: Partial<PlayerConfig> = {}): PlayerConfig {
  const result = { ...DEFAULT_PLAYER_CONFIG, ...config };
  if (
    !Number.isInteger(result.decisionTicks) ||
    result.decisionTicks < 1 ||
    result.decisionTicks > 30 ||
    !Number.isFinite(result.bowDistance) ||
    result.bowDistance < 100 ||
    result.bowDistance > 400 ||
    !Number.isFinite(result.meleeReachRatio) ||
    result.meleeReachRatio < 0.3 ||
    result.meleeReachRatio > 1
  )
    throw new Error(
      'Invalid player configuration: ticks 1–30, bow distance 100–400, melee ratio 0.3–1.',
    );
  return result;
}

/** A deterministic pilot. Its only game input is a detached, serializable observation. */
export function baselineCommand(
  observation: Observation,
  config: Partial<PlayerConfig> = DEFAULT_PLAYER_CONFIG,
): Command {
  const settings = playerConfig(config);
  const p = observation.player;
  if (observation.phase === 'reward') {
    const score = (b: Boon): number => {
      const existing = observation.catalog.boons.find((entry) => entry.slot === b.slot);
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
        (existing?.id === b.id ? 30 : existing ? -50 : 0) +
        (b.god === 'winter' ? 12 : b.god === 'cinder' ? 10 : 0)
      );
    };
    return [...observation.offers].sort((a, b) => score(b) - score(a))[0].command;
  }
  if (observation.phase === 'route') {
    const rank = {
      heart: 80,
      fountain: p.hp < p.maxHp - 25 ? 100 : 10,
      boon: 60,
      upgrade: 50,
      shop: observation.gold >= 80 ? 70 : 0,
      coin: 20,
      trial: 15,
    };
    return [...observation.routes].sort((a, b) => rank[b.reward] - rank[a.reward])[0].command;
  }
  if (observation.phase === 'shop') {
    for (const item of ['heal', 'heart', 'boon']) {
      if (item === 'heal' && p.hp >= p.maxHp - 25) continue;
      const command = observation.legalActions.find((c) => c.type === 'buy' && c.item === item);
      if (command) return command;
    }
    return { type: 'leave' };
  }
  if (observation.phase !== 'combat')
    throw new Error(
      `Baseline cannot act in ${observation.phase}; the episode owns start and termination.`,
    );
  if (!observation.frame) throw new Error('No legal frame remains in this chronicle.');
  const enemy = [...observation.enemies].sort((a, b) => distance(p, a) - distance(p, b))[0];
  const aim = enemy ? angle(p, enemy) : p.aim;
  const d = enemy ? distance(p, enemy) : 0;
  const weapon = observation.catalog.weapon;
  const desired =
    p.weapon === 'bow' ? settings.bowDistance : weapon.attack.reach * settings.meleeReachRatio;
  let direction = aim + (d < desired - 15 ? Math.PI : d > desired + 10 ? 0 : Math.PI / 2);
  if (enemy && !clearLine(observation, p, enemy, 8))
    direction = headingTo(observation, p, enemy, 14);
  let danger: Point | undefined;
  const threats = observation.threats
    .filter((threat) => threat.remainingWindupTicks > 0 && threat.remainingWindupTicks < 35)
    .flatMap((threat) => threat.shapes);
  if (threats.some((shape) => threatens(shape, p, 24))) {
    const escape = Array.from({ length: 16 }, (_, i) => (i * Math.PI) / 8)
      .map((a) => {
        const next = { x: p.x + Math.cos(a) * 125, y: p.y + Math.sin(a) * 125 };
        const score =
          threats.filter((shape) => threatens(shape, next, 24)).length * 1000 +
          (next.x < 60 ||
          next.x > observation.arena.width - 60 ||
          next.y < 60 ||
          next.y > observation.arena.height - 60
            ? 2000
            : 0) +
          observation.room.pillars.filter((pillar) => distance(next, pillar) < pillar.radius + 20)
            .length *
            1000 +
          Math.abs((enemy ? distance(enemy, next) : 0) - desired);
        return { a, score };
      })
      .sort((a, b) => a.score - b.score)[0];
    danger = { x: p.x - Math.cos(escape.a) * 50, y: p.y - Math.sin(escape.a) * 50 };
  }
  for (const hazard of observation.room.hazards)
    if ((hazard.warning || hazard.active) && distance(p, hazard) < hazard.radius + 30)
      danger = hazard;
  const projectile = observation.projectiles.find(
    (shot) =>
      shot.hostile &&
      distance(shot, p) < 70 &&
      (p.x - shot.x) * shot.vx + (p.y - shot.y) * shot.vy > 0,
  );
  if (projectile) direction = Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2;
  if (danger) direction = distance(p, danger) < 3 ? aim + Math.PI / 2 : angle(danger, p);
  const next = { x: p.x + Math.cos(direction) * 55, y: p.y + Math.sin(direction) * 55 };
  if (observation.room.pillars.some((pillar) => distance(next, pillar) < pillar.radius + 22))
    direction += Math.PI / 2;
  if (
    (p.x < 80 && Math.cos(direction) < 0) ||
    (p.x > observation.arena.width - 80 && Math.cos(direction) > 0) ||
    (p.y < 80 && Math.sin(direction) < 0) ||
    (p.y > observation.arena.height - 80 && Math.sin(direction) > 0)
  )
    direction = angle(p, { x: observation.arena.width / 2, y: observation.arena.height / 2 });
  return {
    type: 'frame',
    ticks: Math.min(settings.decisionTicks, observation.frame.ticks.max),
    input: {
      x: Math.cos(direction),
      y: Math.sin(direction),
      aim,
      attack: true,
      special: observation.tick % 180 < 24 && d < weapon.special.reach,
      dash: !!danger || !!projectile,
      cast: p.casts > 0 && d > 170 && observation.tick % 90 < 6,
      call: p.charge >= 100 && d < 240 && observation.catalog.boons.some((b) => b.slot === 'call'),
    },
  };
}
