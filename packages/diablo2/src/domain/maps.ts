import type { MapDef, Point, World } from './types';
export const WIDTH = 41;
export const HEIGHT = 29;
export function tilesFor(map: MapDef): string[] {
  const tiles = Array.from({ length: HEIGHT }, () => Array<string>(WIDTH).fill('#'));
  for (const [left, top, right, bottom] of map.rooms)
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) tiles[y][x] = '.';
  return tiles.map((row) => row.join(''));
}
export function walkable(world: Pick<World, 'tiles'>, point: Point): boolean {
  return world.tiles[Math.floor(point.y)]?.[Math.floor(point.x)] === '.';
}
export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
export function lineOfSight(world: Pick<World, 'tiles'>, a: Point, b: Point): boolean {
  const steps = Math.ceil(distance(a, b) * 5);
  for (let n = 0; n <= steps; n++) {
    const t = steps ? n / steps : 0;
    if (!walkable(world, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return false;
  }
  return true;
}
export function findPath(world: Pick<World, 'tiles'>, from: Point, to: Point): Point[] {
  const start = Math.floor(from.y) * WIDTH + Math.floor(from.x);
  const end = Math.floor(to.y) * WIDTH + Math.floor(to.x);
  if (!walkable(world, from) || !walkable(world, to)) return [];
  const queue = [start];
  const parents = new Map<number, number>([[start, -1]]);
  for (let i = 0; i < queue.length && !parents.has(end); i++) {
    const cell = queue[i];
    const x = cell % WIDTH;
    const y = Math.floor(cell / WIDTH);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      const next = ny * WIDTH + nx;
      if (
        nx >= 0 &&
        nx < WIDTH &&
        ny >= 0 &&
        ny < HEIGHT &&
        !parents.has(next) &&
        world.tiles[ny]?.[nx] === '.'
      ) {
        parents.set(next, cell);
        queue.push(next);
      }
    }
  }
  if (!parents.has(end)) return [];
  const path: Point[] = [];
  for (let cell = end; cell !== start; cell = parents.get(cell)!)
    path.push({ x: (cell % WIDTH) + 0.5, y: Math.floor(cell / WIDTH) + 0.5 });
  path.reverse();
  path.push(to);
  return path;
}
export function slide(world: World, entity: Point, dx: number, dy: number): void {
  const fits = (x: number, y: number) =>
    [
      [-0.22, -0.22],
      [0.22, -0.22],
      [-0.22, 0.22],
      [0.22, 0.22],
    ].every(([ox, oy]) => walkable(world, { x: x + ox, y: y + oy }));
  if (fits(entity.x + dx, entity.y)) entity.x += dx;
  if (fits(entity.x, entity.y + dy)) entity.y += dy;
}
export function toward(world: World, entity: Point, target: Point, step: number): void {
  let point = target;
  if (!lineOfSight(world, entity, target)) point = findPath(world, entity, target)[0] ?? entity;
  const d = distance(entity, point);
  if (d === 0) return;
  const amount = Math.min(step, d);
  slide(world, entity, ((point.x - entity.x) / d) * amount, ((point.y - entity.y) / d) * amount);
}
export function reveal(world: World, point: Point): void {
  const known = new Set(world.seen);
  for (let y = Math.max(0, Math.floor(point.y) - 7); y < Math.min(HEIGHT, point.y + 7); y++)
    for (let x = Math.max(0, Math.floor(point.x) - 7); x < Math.min(WIDTH, point.x + 7); x++)
      if (
        distance(point, { x: x + 0.5, y: y + 0.5 }) <= 7 &&
        lineOfSight(world, point, { x: x + 0.5, y: y + 0.5 })
      )
        known.add(y * WIDTH + x);
  world.seen = [...known];
}
