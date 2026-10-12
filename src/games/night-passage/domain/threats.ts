import { REGIONS } from './content';
import { ENEMY_PATTERNS, GUARDIANS, type AttackPattern } from './encounter-content';
import { angleDelta, distance } from './geometry';
import type { Enemy, Point } from './types';

export type ThreatShape =
  | { kind: 'circle'; center: Point; radius: number }
  | { kind: 'sector'; center: Point; radius: number; aim: number; arc: number }
  | { kind: 'annulus'; center: Point; radius: number; inner: number }
  | { kind: 'line'; from: Point; to: Point; radius: number };
export function attackPattern(enemy: Enemy, region: number): AttackPattern {
  if (enemy.kind === 'boss') {
    const patterns = GUARDIANS[REGIONS[region].guardian];
    return patterns[enemy.pattern % patterns.length];
  }
  return ENEMY_PATTERNS[enemy.kind];
}
const along = (origin: Point, aim: number, length: number): Point => ({
  x: origin.x + Math.cos(aim) * length,
  y: origin.y + Math.sin(aim) * length,
});
export function attackShapes(enemy: Enemy, region: number): ThreatShape[] {
  const pattern = attackPattern(enemy, region);
  const center = { x: enemy.x, y: enemy.y };
  switch (pattern.kind) {
    case 'sweep':
      return [
        { kind: 'sector', center, radius: pattern.radius, aim: enemy.aim, arc: Math.PI * 1.25 },
      ];
    case 'burst':
      return [{ kind: 'circle', center: enemy.target, radius: pattern.radius }];
    case 'charge':
      return [
        {
          kind: 'line',
          from: center,
          to: along(center, enemy.aim, pattern.range),
          radius: pattern.radius,
        },
      ];
    case 'cross':
      return [0, Math.PI / 2].map((rotation) => ({
        kind: 'line',
        from: along(enemy.target, rotation, -pattern.range),
        to: along(enemy.target, rotation, pattern.range),
        radius: pattern.radius,
      }));
    case 'pulse':
      return [{ kind: 'annulus', center, radius: pattern.radius, inner: 90 }];
    case 'rain':
      return Array.from({ length: pattern.count }, (_, i) => ({
        kind: 'circle',
        center:
          i === 0
            ? enemy.target
            : along(
                enemy.target,
                ((i - 1) * Math.PI * 2) / (pattern.count - 1) + enemy.pattern * 0.4,
                150,
              ),
        radius: pattern.radius,
      }));
    case 'volley':
    case 'wheel':
      return [];
  }
}
export function projectileAngles(enemy: Enemy, region: number): number[] {
  const pattern = attackPattern(enemy, region);
  if (pattern.kind === 'wheel')
    return Array.from(
      { length: pattern.count },
      (_, i) => (i * Math.PI * 2) / pattern.count + enemy.pattern * 0.25,
    );
  if (pattern.kind === 'volley')
    return Array.from(
      { length: pattern.count },
      (_, i) => enemy.aim + (i - (pattern.count - 1) / 2) * 0.15,
    );
  return [];
}
export function threatens(shape: ThreatShape, point: Point, radius = 14): boolean {
  if (shape.kind === 'line') {
    const dx = shape.to.x - shape.from.x;
    const dy = shape.to.y - shape.from.y;
    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - shape.from.x) * dx + (point.y - shape.from.y) * dy) / (dx * dx + dy * dy || 1),
      ),
    );
    return (
      distance(point, { x: shape.from.x + t * dx, y: shape.from.y + t * dy }) <=
      radius + shape.radius
    );
  }
  const d = distance(shape.center, point);
  if (d > shape.radius + radius) return false;
  if (shape.kind === 'annulus') return d + radius >= shape.inner;
  if (shape.kind === 'sector')
    return (
      d <= radius ||
      Math.abs(
        angleDelta(Math.atan2(point.y - shape.center.y, point.x - shape.center.x), shape.aim),
      ) <=
        shape.arc / 2 + Math.asin(Math.min(1, radius / d))
    );
  return true;
}
