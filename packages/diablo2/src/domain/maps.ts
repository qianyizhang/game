import type { RegionDef, Point, World } from './types';
export function dimensions(world: Pick<World, 'tiles'>): { width: number; height: number } {
  return { width: world.tiles[0].length, height: world.tiles.length };
}
const glyphs = {
  water: '~',
  lava: '!',
  rock: '^',
  road: '=',
  grass: ',',
  sand: ':',
  moss: ';',
  floor: '.',
};
export function tilesFor(map: RegionDef): string[] {
  const tiles = Array.from({ length: map.height }, () => Array<string>(map.width).fill('#'));
  const paint = (bounds: number[], glyph: string) => {
    const [left, top, right, bottom] = bounds;
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) tiles[y][x] = glyph;
  };
  for (const room of map.rooms) paint(room, '.');
  for (const patch of map.terrain) paint(patch.bounds, glyphs[patch.kind]);
  // Carve paths last: bridges and corridor connections remain navigable over terrain.
  for (const path of map.paths)
    for (let n = 1; n < path.length; n++) {
      const a = path[n - 1],
        b = path[n];
      const steps = Math.ceil(distance(a, b) * 2);
      for (let k = 0; k <= steps; k++) {
        const x = Math.floor(a.x + ((b.x - a.x) * k) / steps);
        const y = Math.floor(a.y + ((b.y - a.y) * k) / steps);
        paint(
          [
            Math.max(1, x - 1),
            Math.max(1, y - 1),
            Math.min(map.width - 2, x + 1),
            Math.min(map.height - 2, y + 1),
          ],
          '=',
        );
      }
    }
  return tiles.map((row) => row.join(''));
}
export function walkable(world: Pick<World, 'tiles'>, point: Point): boolean {
  return '.,:;='.includes(world.tiles[Math.floor(point.y)]?.[Math.floor(point.x)] ?? '#');
}
export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
export function lineOfSight(world: Pick<World, 'tiles'>, a: Point, b: Point): boolean {
  const steps = Math.ceil(distance(a, b) * 5);
  for (let n = 0; n <= steps; n++) {
    const t = steps ? n / steps : 0;
    const tile =
      world.tiles[Math.floor(a.y + (b.y - a.y) * t)]?.[Math.floor(a.x + (b.x - a.x) * t)];
    if (!tile || tile === '#' || tile === '^') return false;
  }
  return true;
}
export function findPath(world: Pick<World, 'tiles'>, from: Point, to: Point): Point[] {
  const { width: WIDTH, height: HEIGHT } = dimensions(world);
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
        walkable(world, { x: nx, y: ny })
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
export function bodyFits(world: Pick<World, 'tiles'>, point: Point): boolean {
  return [
    [-0.22, -0.22],
    [0.22, -0.22],
    [-0.22, 0.22],
    [0.22, 0.22],
  ].every(([x, y]) => walkable(world, { x: point.x + x, y: point.y + y }));
}
export function slide(world: World, entity: Point, dx: number, dy: number): void {
  const fits = (x: number, y: number) => bodyFits(world, { x, y });
  if (fits(entity.x + dx, entity.y)) entity.x += dx;
  if (fits(entity.x, entity.y + dy)) entity.y += dy;
}
export function toward(world: World, entity: Point, target: Point, step: number): void {
  let point = target;
  const steps = Math.ceil(distance(entity, target) * 3);
  const clear = Array.from({ length: steps + 1 }, (_, n) => n).every((n) =>
    walkable(world, {
      x: entity.x + ((target.x - entity.x) * n) / (steps || 1),
      y: entity.y + ((target.y - entity.y) * n) / (steps || 1),
    }),
  );
  if (!clear) point = findPath(world, entity, target)[0] ?? entity;
  const d = distance(entity, point);
  if (d === 0) return;
  const amount = Math.min(step, d);
  slide(world, entity, ((point.x - entity.x) / d) * amount, ((point.y - entity.y) / d) * amount);
}
export function reveal(world: World, point: Point): void {
  const { width: WIDTH, height: HEIGHT } = dimensions(world);
  const origin = Math.floor(point.y) * WIDTH + Math.floor(point.x);
  if (world.revealOrigin === origin) return;
  world.revealOrigin = origin;
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
