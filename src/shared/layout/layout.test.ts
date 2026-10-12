import { expect, it } from 'vitest';
import { CHAMBERS } from '../../games/cartographer/domain/content';
import {
  center,
  emptyLayout,
  generateLayout,
  placeRoom,
  reachable,
  renderLayout,
  roomId,
} from './layout';

it('generates varied, connected boards with reachable room centers at both passage widths', () => {
  const boards = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const layout = generateLayout(`board-${i}`, CHAMBERS, 9);
    expect(generateLayout(`board-${i}`, CHAMBERS, 9)).toEqual(layout);
    boards.add(JSON.stringify(layout));
    expect(new Set(layout.rooms.map((r) => r.id)).size).toBe(9);
    for (const width of [1, 3] as const) {
      const tiles = renderLayout(layout, width),
        reached = reachable(tiles, center(layout.rooms[0]));
      for (const room of layout.rooms) expect(reached.has(roomId(center(room)))).toBe(true);
    }
  }
  expect(boards.size).toBe(30);
});
it('rejects overlaps, disconnected placement, and a room that blocks its reserved passages', () => {
  const layout = placeRoom(emptyLayout(), CHAMBERS[0], { x: 2, y: 2 });
  expect(() => placeRoom(layout, CHAMBERS[0], { x: 2, y: 2 })).toThrow('overlaps');
  expect(() => placeRoom(layout, CHAMBERS[0], { x: 0, y: 0 })).toThrow('matching doorway');
  const blocked = structuredClone(CHAMBERS[0]);
  blocked.tiles[4] = '#########';
  expect(() => placeRoom(layout, blocked, { x: 2, y: 1 })).toThrow('reserved passages');
  expect(layout.rooms).toHaveLength(1);
});
