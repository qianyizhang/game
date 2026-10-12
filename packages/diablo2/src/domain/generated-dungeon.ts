import {
  center,
  DELTA,
  DIRECTIONS,
  generateLayout,
  GENERATOR_VERSION,
  opposite,
  ROOM_SIZE,
  type RoomTemplate,
} from '../../../../src/shared/layout/layout';
import { hashSeed } from '../../../../src/shared/random';
import { BASE_CONTENT } from './content';
import type { Content, Point, RegionDef } from './types';
import { validateContent } from './validate';

const kit: RoomTemplate[] = [
  {
    id: 'hall',
    doors: [...DIRECTIONS],
    tiles: [
      '#########',
      '#.......#',
      '#.......#',
      '#.......#',
      '#.......#',
      '#.......#',
      '#.......#',
      '#.......#',
      '#########',
    ],
  },
  {
    id: 'flooded',
    doors: ['north', 'east', 'south'],
    tiles: [
      '#########',
      '#~~.....#',
      '#~~.....#',
      '#.......#',
      '#.......#',
      '#.......#',
      '#.....###',
      '#.....###',
      '#########',
    ],
  },
  {
    id: 'crypt',
    doors: ['north', 'south', 'west'],
    tiles: [
      '#########',
      '###.....#',
      '###.....#',
      '#.......#',
      '#.......#',
      '#.......#',
      '#.....~~#',
      '#.....~~#',
      '#########',
    ],
  },
];
/** Expand generated geometry into the existing JSON content contract before journaling.
 * Old campaigns and their RNG sequence remain unchanged; replay stores the exact new pack.
 */
export function generatedDungeonContent(seed: string, source: Content = BASE_CONTENT): Content {
  if (typeof seed !== 'string' || seed.length > 100) throw new Error('Invalid dungeon seed.');
  const pack = structuredClone(source);
  const entrance = pack.regions.find((r) => r.id === 'fen-1');
  if (!entrance || pack.regions.some((r) => r.id === 'charted-vault'))
    throw new Error('The generated side dungeon requires the original Briarfen content pack.');
  const layout = generateLayout(seed, kit, 9);
  const at = (p: { x: number; y: number }): Point => ({ x: p.x + 0.5, y: p.y + 0.5 });
  const start = at(center(layout.rooms[0]));
  const region: RegionDef = {
    id: 'charted-vault',
    act: entrance.act,
    name: 'The Charted Vault',
    description:
      'A seeded nine-chamber side dungeon. Recover its caches and survive the elite patrols; return to the road whenever you choose.',
    theme: 'crypt',
    width: layout.columns * ROOM_SIZE,
    height: layout.rows * ROOM_SIZE,
    dungeon: 'charted-depths',
    floor: 1,
    rooms: layout.rooms.map((r) => [
      r.x * ROOM_SIZE + 1,
      r.y * ROOM_SIZE + 1,
      r.x * ROOM_SIZE + 7,
      r.y * ROOM_SIZE + 7,
    ]),
    paths: [],
    terrain: [],
    landmarks: [],
    start,
    waypoint: null,
    ward: null,
    boss: null,
    bossPosition: null,
    monsters: ['hound', 'archer'],
    encounters: 12,
    chests: [at(center(layout.rooms[2])), at(center(layout.rooms[5]))],
    portals: [
      {
        id: 'return',
        name: 'Return to Lantern Approach',
        at: start,
        target: entrance.id,
        arrival: 'charted-vault',
        requires: 'none',
      },
    ],
  };
  for (const room of layout.rooms) {
    for (const direction of room.doors) {
      const other = layout.rooms.find(
        (r) => r.x === room.x + DELTA[direction].x && r.y === room.y + DELTA[direction].y,
      );
      if (other && other.doors.includes(opposite(direction)) && room.id < other.id)
        region.paths.push([at(center(room)), at(center(other))]);
    }
    for (let y = 1; y < 8; y++) {
      for (let x = 1; x < 8; x++) {
        const tile = room.tiles[y][x];
        if (tile === '.') continue;
        const startX = x;
        while (x + 1 < 8 && room.tiles[y][x + 1] === tile) x++;
        region.terrain.push({
          kind: tile === '~' ? 'water' : 'rock',
          bounds: [
            room.x * ROOM_SIZE + startX,
            room.y * ROOM_SIZE + y,
            room.x * ROOM_SIZE + x,
            room.y * ROOM_SIZE + y,
          ],
        });
      }
    }
  }
  entrance.portals.push({
    id: 'charted-vault',
    name: 'The Charted Vault · seeded dungeon',
    at: { x: entrance.chests[0].x + 3, y: entrance.chests[0].y },
    target: region.id,
    arrival: 'return',
    requires: 'none',
  });
  pack.regions.push(region);
  pack.dungeons.push({
    id: 'charted-depths',
    name: 'The Charted Vault',
    act: entrance.act,
    floors: [region.id],
  });
  pack.id = `emberwake-charted-${hashSeed(seed).toString(16)}`;
  pack.version = `${source.version}-${GENERATOR_VERSION}`;
  return validateContent(pack);
}
