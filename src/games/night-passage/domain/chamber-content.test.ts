import { expect, test } from 'vitest';
import { CHAMBER_LAYOUTS, chamberLayout } from './chamber-content';
import type { ChamberLayout } from './chamber-content';
import { ARENA } from './content';
import { createGame } from './game';
import { distance, headingTo, translate } from './geometry';
import type { Point } from './types';

const entry = { x: 480, y: 470 },
  playerRadius = 14,
  enemyRadius = 24;
// Test the larger void attraction envelope too, rather than only the 60-unit flame well.
const dangerRadius = 92,
  spawnDistance = 140;

function interior(point: Point, radius: number) {
  return (
    point.x >= ARENA.margin + radius &&
    point.x <= ARENA.width - ARENA.margin - radius &&
    point.y >= ARENA.margin + radius &&
    point.y <= ARENA.height - ARENA.margin - radius
  );
}
function free(layout: ChamberLayout, point: Point, radius: number) {
  return (
    interior(point, radius) &&
    layout.pillars.every((pillar) => distance(point, pillar) >= pillar.radius + radius)
  );
}
function segmentClear(layout: ChamberLayout, from: Point, to: Point, radius: number) {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    squared = dx * dx + dy * dy;
  return layout.pillars.every((pillar) => {
    const t =
      squared === 0
        ? 0
        : Math.max(0, Math.min(1, ((pillar.x - from.x) * dx + (pillar.y - from.y) * dy) / squared));
    return (
      Math.hypot(pillar.x - from.x - t * dx, pillar.y - from.y - t * dy) >= pillar.radius + radius
    );
  });
}

test('offers four distinct tactical arrangements and preserves the introductory twin pillars', () => {
  expect(CHAMBER_LAYOUTS.map((layout) => layout.id)).toEqual([
    'court',
    'gallery',
    'islands',
    'crossroads',
  ]);
  for (const layout of CHAMBER_LAYOUTS) expect(chamberLayout(layout.id)).toBe(layout);
  expect(chamberLayout('court').pillars).toEqual([
    { x: 330, y: 265, radius: 30 },
    { x: 630, y: 265, radius: 30 },
  ]);
  const gallery = chamberLayout('gallery'),
    islands = chamberLayout('islands'),
    crossing = chamberLayout('crossroads');
  expect(gallery.pillars).toHaveLength(3);
  expect(new Set(gallery.pillars.map((pillar) => pillar.y)).size).toBe(1);
  expect(new Set(islands.pillars.map((pillar) => pillar.y)).size).toBe(3);
  expect(new Set(islands.pillars.map((pillar) => pillar.x)).size).toBe(3);
  expect(crossing.pillars).toHaveLength(4);
  expect(segmentClear(crossing, { x: 480, y: 80 }, { x: 480, y: 520 }, enemyRadius)).toBe(true);
  expect(segmentClear(crossing, { x: 80, y: 280 }, { x: 880, y: 280 }, enemyRadius)).toBe(true);
});

test.each(CHAMBER_LAYOUTS)(
  '$id keeps entry, hazard and spawn clearance without narrow pillar gaps',
  (layout) => {
    expect(layout.pillars.length).toBeGreaterThanOrEqual(2);
    expect(layout.pillars.length).toBeLessThanOrEqual(4);
    expect(layout.hazards).toHaveLength(2);
    expect(layout.spawns).toHaveLength(8);
    expect(free(layout, entry, playerRadius)).toBe(true);
    for (const [i, pillar] of layout.pillars.entries()) {
      expect(
        Math.min(
          pillar.x - ARENA.margin,
          ARENA.width - ARENA.margin - pillar.x,
          pillar.y - ARENA.margin,
          ARENA.height - ARENA.margin - pillar.y,
        ) - pillar.radius,
      ).toBeGreaterThanOrEqual(100);
      for (const other of layout.pillars.slice(i + 1))
        expect(distance(pillar, other) - pillar.radius - other.radius).toBeGreaterThanOrEqual(100);
    }
    for (const hazard of layout.hazards) {
      expect(interior(hazard, dangerRadius)).toBe(true);
      expect(distance(hazard, entry)).toBeGreaterThan(dangerRadius + playerRadius);
      expect(hazard.offset).toBeGreaterThanOrEqual(0);
      expect(hazard.offset).toBeLessThan(300);
    }
    expect(layout.hazards[0].offset).not.toBe(layout.hazards[1].offset);
    for (const [i, spawn] of layout.spawns.entries()) {
      expect(free(layout, spawn, enemyRadius)).toBe(true);
      for (const hazard of layout.hazards)
        expect(distance(spawn, hazard)).toBeGreaterThan(dangerRadius + enemyRadius);
      for (const other of layout.spawns.slice(i + 1))
        expect(distance(spawn, other)).toBeGreaterThanOrEqual(180);
    }
  },
);

test.each(CHAMBER_LAYOUTS)(
  '$id has one connected movement region for the largest ordinary enemy',
  (layout) => {
    const step = 18,
      width = Math.floor((ARENA.width - 2 * (ARENA.margin + enemyRadius)) / step) + 1;
    const height = Math.floor((ARENA.height - 2 * (ARENA.margin + enemyRadius)) / step) + 1;
    const points = Array.from({ length: width * height }, (_, i) => ({
      x: ARENA.margin + enemyRadius + (i % width) * step,
      y: ARENA.margin + enemyRadius + Math.floor(i / width) * step,
    }));
    const safe = points.map((point) => free(layout, point, enemyRadius));
    const start = safe.indexOf(true),
      queue = [start],
      visited = new Set(queue);
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head],
        x = index % width,
        y = Math.floor(index / width);
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const next = ny * width + nx;
        if (
          !safe[next] ||
          visited.has(next) ||
          !segmentClear(layout, points[index], points[next], enemyRadius)
        )
          continue;
        visited.add(next);
        queue.push(next);
      }
    }
    expect(visited.size).toBe(safe.filter(Boolean).length);
  },
);

function spawnProbes(layout: ChamberLayout) {
  const probes: Point[] = [...layout.spawns, entry];
  // Equal-radius circle intersections locate overlap changes that a regular grid can miss.
  for (const [i, a] of layout.spawns.entries())
    for (const b of layout.spawns.slice(i + 1)) {
      const d = distance(a, b);
      if (d === 0 || d > spawnDistance * 2) continue;
      const h = Math.sqrt(spawnDistance ** 2 - (d / 2) ** 2);
      for (const sign of [-1, 1]) {
        const center = {
          x: (a.x + b.x) / 2 - (sign * h * (b.y - a.y)) / d,
          y: (a.y + b.y) / 2 + (sign * h * (b.x - a.x)) / d,
        };
        for (const dx of [-0.001, 0, 0.001])
          for (const dy of [-0.001, 0, 0.001]) probes.push({ x: center.x + dx, y: center.y + dy });
      }
    }
  for (let x = ARENA.margin + playerRadius; x <= ARENA.width - ARENA.margin - playerRadius; x += 16)
    for (
      let y = ARENA.margin + playerRadius;
      y <= ARENA.height - ARENA.margin - playerRadius;
      y += 16
    )
      probes.push({ x, y });
  return probes;
}

test.each(CHAMBER_LAYOUTS)(
  '$id always provides five spawn sites outside the player exclusion disk',
  (layout) => {
    for (const point of spawnProbes(layout)) {
      if (!free(layout, point, playerRadius)) continue;
      expect(
        layout.spawns.filter((spawn) => distance(point, spawn) >= spawnDistance).length,
      ).toBeGreaterThanOrEqual(5);
    }
    // A stronger independent bound: every triple has a pair farther than a disk's
    // diameter, so no radius-140 disk anywhere can contain even three of these sites.
    for (let a = 0; a < layout.spawns.length; a++)
      for (let b = a + 1; b < layout.spawns.length; b++)
        for (let c = b + 1; c < layout.spawns.length; c++)
          expect(
            Math.max(
              distance(layout.spawns[a], layout.spawns[b]),
              distance(layout.spawns[a], layout.spawns[c]),
              distance(layout.spawns[b], layout.spawns[c]),
            ),
          ).toBeGreaterThan(2 * spawnDistance);
  },
);

test.each(CHAMBER_LAYOUTS)(
  '$id permits actual headingTo movement between its entry and all spawn sites',
  (layout) => {
    const state = createGame('layout-navigation');
    state.room.pillars = layout.pillars.map((pillar) => ({ ...pillar }));
    const endpoints = [entry, ...layout.spawns];
    for (const from of endpoints)
      for (const target of endpoints) {
        const actor = { ...from };
        for (let i = 0; i < 700 && distance(actor, target) > 6; i++) {
          const heading = headingTo(state, actor, target, enemyRadius);
          translate(state, actor, Math.cos(heading) * 3, Math.sin(heading) * 3, enemyRadius);
        }
        expect(
          distance(actor, target),
          `${layout.id}: ${from.x},${from.y} to ${target.x},${target.y}`,
        ).toBeLessThanOrEqual(6);
      }
  },
);
