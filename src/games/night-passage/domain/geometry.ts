import { ARENA } from './content';
import type { Point, State } from './types';
export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
export const angle = (a: Point, b: Point): number => Math.atan2(b.y - a.y, b.x - a.x);
export const angleDelta = (a: number, b: number): number =>
  Math.atan2(Math.sin(a - b), Math.cos(a - b));
export function clearLine(state: State, from: Point, to: Point, clearance = 0): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const squared = dx * dx + dy * dy;
  return state.room.pillars.every((pillar) => {
    const t = squared
      ? Math.max(0, Math.min(1, ((pillar.x - from.x) * dx + (pillar.y - from.y) * dy) / squared))
      : 0;
    return (
      distance(pillar, { x: from.x + dx * t, y: from.y + dy * t }) >= pillar.radius + clearance
    );
  });
}

/** Choose a visible detour around the first circular obstacle on a direct approach. */
export function headingTo(state: State, from: Point, target: Point, radius: number): number {
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const squared = dx * dx + dy * dy;
  const blockers = state.room.pillars
    .filter((pillar) => {
      const t = squared
        ? Math.max(0, Math.min(1, ((pillar.x - from.x) * dx + (pillar.y - from.y) * dy) / squared))
        : 0;
      return (
        distance(pillar, { x: from.x + t * dx, y: from.y + t * dy }) < pillar.radius + radius + 8
      );
    })
    .sort((a, b) => distance(from, a) - distance(from, b));
  const pillar = blockers[0];
  if (!pillar) return angle(from, target);
  const a = angle(pillar, from);
  const waypoints = [-1, 1].map((sign) => ({
    x: pillar.x + Math.cos(a + (sign * Math.PI) / 3) * (pillar.radius + radius + 28),
    y: pillar.y + Math.sin(a + (sign * Math.PI) / 3) * (pillar.radius + radius + 28),
  }));
  waypoints.sort((a, b) => distance(a, target) - distance(b, target));
  return angle(from, waypoints[0]);
}
export function translate(
  state: State,
  actor: Point,
  dx: number,
  dy: number,
  radius: number,
): boolean {
  const before = { ...actor };
  actor.x = Math.max(
    ARENA.margin + radius,
    Math.min(ARENA.width - ARENA.margin - radius, actor.x + dx),
  );
  actor.y = Math.max(
    ARENA.margin + radius,
    Math.min(ARENA.height - ARENA.margin - radius, actor.y + dy),
  );
  for (const pillar of state.room.pillars) {
    const d = distance(actor, pillar);
    if (d < radius + pillar.radius) {
      const a = d > 0 ? angle(pillar, actor) : 0;
      actor.x = pillar.x + Math.cos(a) * (radius + pillar.radius);
      actor.y = pillar.y + Math.sin(a) * (radius + pillar.radius);
    }
  }
  return Math.abs(actor.x - before.x - dx) > 0.1 || Math.abs(actor.y - before.y - dy) > 0.1;
}
