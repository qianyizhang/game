import { hashSeed, shuffle } from '../random';

export const GENERATOR_VERSION = 'rooms-1';
export const ROOM_SIZE = 9;
export type Direction = 'north' | 'east' | 'south' | 'west';
export type Rotation = 0 | 1 | 2 | 3;
export interface Cell {
  x: number;
  y: number;
}
export interface RoomTemplate {
  id: string;
  /** Nine square rows; # wall, . floor, ~ water. The central cross must be clear. */
  tiles: string[];
  doors: Direction[];
}
export interface PlacedRoom extends Cell {
  id: string;
  template: string;
  rotation: Rotation;
  tiles: string[];
  doors: Direction[];
}
export interface Layout {
  columns: number;
  rows: number;
  rooms: PlacedRoom[];
}
export interface Frontier extends Cell {
  room: string;
  direction: Direction;
}
export const DIRECTIONS: Direction[] = ['north', 'east', 'south', 'west'];
export const DELTA: Record<Direction, Cell> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};
export const opposite = (d: Direction): Direction => DIRECTIONS[(DIRECTIONS.indexOf(d) + 2) % 4];
export const sameCell = (a: Cell, b: Cell): boolean => a.x === b.x && a.y === b.y;
export const roomId = (p: Cell): string => `${p.x},${p.y}`;
export function seededOrder<T>(seed: string, stream: string, values: readonly T[]): T[] {
  return shuffle(values, hashSeed(`${GENERATOR_VERSION}:${seed}:${stream}`))[0];
}
export function emptyLayout(columns = 5, rows = 5): Layout {
  if (![columns, rows].every((n) => Number.isInteger(n) && n >= 1 && n <= 12))
    throw new Error('Layout dimensions must be between 1 and 12 rooms.');
  return { columns, rows, rooms: [] };
}
export function rotated(template: RoomTemplate, rotation: Rotation): RoomTemplate {
  if (
    ![0, 1, 2, 3].includes(rotation) ||
    template.tiles.length !== ROOM_SIZE ||
    template.tiles.some((row) => row.length !== ROOM_SIZE || /[^#.~]/.test(row)) ||
    !template.doors.length ||
    template.doors.some((d) => !DIRECTIONS.includes(d))
  )
    throw new Error('Invalid room template or rotation.');
  // A reserved cross connects every doorway and center, including wide ARPG passages.
  for (let y = 1; y < ROOM_SIZE - 1; y++)
    for (let x = 1; x < ROOM_SIZE - 1; x++)
      if ((Math.abs(x - 4) <= 1 || Math.abs(y - 4) <= 1) && template.tiles[y][x] !== '.')
        throw new Error('Room template blocks its reserved passages.');
  let tiles = template.tiles;
  for (let i = 0; i < rotation; i++)
    tiles = Array.from({ length: ROOM_SIZE }, (_, y) =>
      Array.from({ length: ROOM_SIZE }, (_, x) => tiles[ROOM_SIZE - 1 - x][y]).join(''),
    );
  return {
    ...template,
    tiles,
    doors: template.doors.map((d) => DIRECTIONS[(DIRECTIONS.indexOf(d) + rotation) % 4]),
  };
}
export function frontiers(layout: Layout): Frontier[] {
  return layout.rooms.flatMap((room) =>
    room.doors.flatMap((direction) => {
      const { x, y } = { x: room.x + DELTA[direction].x, y: room.y + DELTA[direction].y };
      return x >= 0 &&
        y >= 0 &&
        x < layout.columns &&
        y < layout.rows &&
        !layout.rooms.some((r) => r.x === x && r.y === y)
        ? [{ x, y, room: room.id, direction }]
        : [];
    }),
  );
}
export function placeRoom(
  layout: Layout,
  template: RoomTemplate,
  at: Cell,
  rotation: Rotation = 0,
): Layout {
  if (
    ![at.x, at.y].every(Number.isInteger) ||
    at.x < 0 ||
    at.y < 0 ||
    at.x >= layout.columns ||
    at.y >= layout.rows ||
    layout.rooms.some((r) => sameCell(r, at))
  )
    throw new Error('Room is outside the board or overlaps an existing room.');
  const room = rotated(template, rotation);
  const connections = layout.rooms.filter((r) =>
    DIRECTIONS.some(
      (d) =>
        r.x + DELTA[d].x === at.x &&
        r.y + DELTA[d].y === at.y &&
        r.doors.includes(d) &&
        room.doors.includes(opposite(d)),
    ),
  );
  if (layout.rooms.length && !connections.length) throw new Error('Room needs a matching doorway.');
  return {
    ...layout,
    rooms: [...layout.rooms, { ...room, ...at, template: template.id, id: roomId(at), rotation }],
  };
}
/** Both consumers use the same attachment rules; the caller supplies room content. */
export function generateLayout(seed: string, templates: RoomTemplate[], count: number): Layout {
  if (!templates.length || !Number.isInteger(count) || count < 1 || count > 20)
    throw new Error('Choose templates and 1–20 rooms.');
  let layout = placeRoom(emptyLayout(), templates[0], { x: 2, y: 2 });
  while (layout.rooms.length < count) {
    let next: Layout | undefined;
    const n = layout.rooms.length;
    for (const frontier of seededOrder(seed, `frontier:${n}`, frontiers(layout))) {
      for (const template of seededOrder(seed, `template:${n}`, templates)) {
        for (const rotation of seededOrder<Rotation>(seed, `rotation:${n}`, [0, 1, 2, 3])) {
          try {
            next = placeRoom(layout, template, frontier, rotation);
            break;
          } catch {
            /* Another orientation may fit this frontier. */
          }
        }
        if (next) break;
      }
      if (next) break;
    }
    if (!next) throw new Error('Room kit cannot extend this layout.');
    layout = next;
  }
  return layout;
}
export const center = (room: Cell): Cell => ({
  x: room.x * ROOM_SIZE + 4,
  y: room.y * ROOM_SIZE + 4,
});
export const threshold = (room: Cell, direction: Direction): Cell => ({
  x: center(room).x + DELTA[direction].x * 3,
  y: center(room).y + DELTA[direction].y * 3,
});
export function renderLayout(layout: Layout, passageWidth: 1 | 3 = 1): string[] {
  if (passageWidth !== 1 && passageWidth !== 3) throw new Error('Unsupported passage width.');
  const tiles = Array.from({ length: layout.rows * ROOM_SIZE }, () =>
    Array<string>(layout.columns * ROOM_SIZE).fill('#'),
  );
  for (const room of layout.rooms) {
    for (let y = 1; y < ROOM_SIZE - 1; y++)
      for (let x = 1; x < ROOM_SIZE - 1; x++)
        tiles[room.y * ROOM_SIZE + y][room.x * ROOM_SIZE + x] = room.tiles[y][x];
    for (const d of room.doors) {
      const other = layout.rooms.find(
        (r) => r.x === room.x + DELTA[d].x && r.y === room.y + DELTA[d].y,
      );
      if (!other?.doors.includes(opposite(d))) continue;
      const c = center(room),
        delta = DELTA[d];
      for (
        let offset = -Math.floor(passageWidth / 2);
        offset <= Math.floor(passageWidth / 2);
        offset++
      )
        tiles[c.y + delta.y * 4 + (delta.x ? offset : 0)][
          c.x + delta.x * 4 + (delta.y ? offset : 0)
        ] = '.';
    }
  }
  return tiles.map((row) => row.join(''));
}
/** Generic floor reachability, independent of either game's movement or combat. */
export function reachable(tiles: string[], start: Cell): Set<string> {
  const seen = new Set<string>();
  if (tiles[start.y]?.[start.x] !== '.') return seen;
  const queue = [start];
  seen.add(roomId(start));
  for (let i = 0; i < queue.length; i++)
    for (const d of DIRECTIONS) {
      const p = { x: queue[i].x + DELTA[d].x, y: queue[i].y + DELTA[d].y };
      if (tiles[p.y]?.[p.x] === '.' && !seen.has(roomId(p))) {
        seen.add(roomId(p));
        queue.push(p);
      }
    }
  return seen;
}
