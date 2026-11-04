import { describe, expect, it } from 'vitest';
import { World, restore } from './world';
import { DENSITIES, WAVE_TICKS, LIMITS, RANGED } from './content';

// Deliberate movement commands through the public rules interface, not a strength evaluation.
function lap(world: World, ticks: number) {
  const hostileCounts: number[] = [];
  const corners = [
    [780, 120],
    [780, 480],
    [180, 480],
    [180, 120],
  ];
  let corner = 0;
  for (let i = 0; i < ticks && world.view.phase === 'combat'; i++) {
    const p = world.view.player,
      target = corners[corner];
    if (Math.hypot(p.x - target[0], p.y - target[1]) < 7) corner = (corner + 1) % 4;
    const next = corners[corner];
    expect(
      world.dispatch({
        type: 'frame',
        x: Math.abs(next[0] - p.x) < 3 ? 0 : Math.sign(next[0] - p.x),
        y: Math.abs(next[1] - p.y) < 3 ? 0 : Math.sign(next[1] - p.y),
        ticks: 1,
      }),
    ).toBeNull();
    if (world.view.waveTick > 120) hostileCounts.push(world.view.hostileShots.length);
  }
  return hostileCounts;
}
describe('Scrapyard run contract', () => {
  it.each(DENSITIES)(
    'maintains %i enemies while weapons kill and pickups conserve scrap',
    (density) => {
      const world = new World('scrapyard-performance-1', density);
      expect(world.dispatch({ type: 'start' })).toBeNull();
      const counts = lap(world, 720).sort((a, b) => a - b);
      expect(world.view.tick).toBe(720);
      expect(world.view.phase).toBe('combat');
      expect(world.view.enemies).toHaveLength(density);
      expect(world.view.kills).toBeGreaterThan(0);
      expect(world.view.scrap + world.view.pickups.reduce((sum, p) => sum + p.value, 0)).toBe(
        world.view.kills,
      );
      expect(world.view.shots.length).toBeLessThanOrEqual(LIMITS.friendlyShots);
      expect(world.view.hostileShots.length).toBeLessThan(LIMITS.hostileShots);
      expect(counts[Math.floor(counts.length / 2)]).toBeGreaterThanOrEqual(200);
      expect(restore(world.export()).snapshot()).toEqual(world.snapshot());
    },
  );
  it('completes waves, charges purchases once and reconstructs a complete run', () => {
    const world = new World('lifecycle', 100);
    expect(world.dispatch({ type: 'start' })).toBeNull();
    for (let wave = 1; wave <= 3; wave++) {
      lap(world, WAVE_TICKS);
      expect(world.view.waveTick, `wave ${wave}, kills ${world.view.kills}`).toBe(WAVE_TICKS);
      expect(world.view.phase).toBe(wave === 3 ? 'won' : 'shop');
      expect(world.view.hostileShots).toHaveLength(0);
      if (wave === 3) break;
      if (world.view.player.hp < 100)
        expect(world.dispatch({ type: 'buy', item: 'repair' })).toBeNull();
      expect(world.dispatch({ type: 'buy', item: 'damage' })).toBeNull();
      const before = world.view.scrap;
      expect(world.dispatch({ type: 'buy', item: 'speed' })).toBeNull();
      expect(world.view.scrap).toBe(before - 10);
      const saved = world.export();
      expect(world.dispatch({ type: 'buy', item: 'speed' })).toBeTruthy();
      expect(world.export()).toBe(saved);
      expect(world.dispatch({ type: 'next' })).toBeNull();
    }
    expect(restore(world.export()).snapshot()).toEqual(world.snapshot());
    expect(world.dispatch({ type: 'frame', x: 1, y: 0, ticks: 1 })).toBeTruthy();
  });
  it('rejects malformed actions and imports atomically; held inputs stay compact', () => {
    const world = new World();
    for (const command of [
      null,
      { type: 'frame', x: NaN, y: 0, ticks: 1 },
      { type: 'frame', x: 1, y: 0, ticks: 121 },
      { type: 'buy', item: '__proto__' },
      { type: 'next' },
    ]) {
      const before = world.snapshot(),
        replay = world.export();
      expect(world.dispatch(command)).toBeTruthy();
      expect(world.snapshot()).toEqual(before);
      expect(world.export()).toBe(replay);
    }
    world.dispatch({ type: 'start' });
    for (let i = 0; i < 60; i++) world.dispatch({ type: 'frame', x: 1, y: 0, ticks: 1 });
    const replay = JSON.parse(world.export()) as { commands: unknown[]; version: string };
    expect(replay.commands).toHaveLength(2);
    expect(() => restore(JSON.stringify({ ...replay, version: 'future' }))).toThrow();
    expect(() =>
      restore(
        JSON.stringify({ ...(JSON.parse(world.export()) as object), version: 'scrapyard-1' }),
      ),
    ).toThrow('Unsupported replay');
    expect(() =>
      restore(
        JSON.stringify({
          ...(JSON.parse(world.export()) as object),
          commands: [{ type: 'buy', item: 'speed' }],
        }),
      ),
    ).toThrow();
  });
  it('separates crowded spawn positions while keeping enemies inside the arena', () => {
    const world = new World('separation', 500);
    world.dispatch({ type: 'start' });
    const overlap = () => {
      let penetration = 0;
      const enemies = world.view.enemies;
      for (let i = 0; i < enemies.length; i++)
        for (let j = i + 1; j < enemies.length; j++) {
          const a = enemies[i],
            b = enemies[j];
          penetration += Math.max(0, a.radius + b.radius - Math.hypot(a.x - b.x, a.y - b.y));
        }
      return penetration;
    };
    const initial = overlap();
    world.dispatch({ type: 'frame', x: 0, y: 0, ticks: 120 });
    expect(overlap()).toBeLessThan(initial * 0.1);
    for (const enemy of world.view.enemies) {
      expect(enemy.x).toBeGreaterThanOrEqual(enemy.radius + 12);
      expect(enemy.x).toBeLessThanOrEqual(960 - enemy.radius - 12);
      expect(enemy.y).toBeGreaterThanOrEqual(enemy.radius + 12);
      expect(enemy.y).toBeLessThanOrEqual(600 - enemy.radius - 12);
    }
  });
  it('ranged volleys deal damage before enemies reach contact range', () => {
    const world = new World('ranged-hit', 500);
    world.dispatch({ type: 'start' });
    for (let tick = 0; tick < 400 && world.view.player.hp === 100; tick++)
      world.dispatch({ type: 'frame', x: 0, y: 0, ticks: 1 });
    expect(world.view.player.hp).toBe(100 - RANGED.damage);
    const player = world.view.player;
    expect(
      world.view.enemies.every(
        (enemy) => Math.hypot(player.x - enemy.x, player.y - enemy.y) > enemy.radius + 12,
      ),
    ).toBe(true);
  });
  it('contact damage ends a stationary run and forbids further combat', () => {
    const world = new World('stand-still', 500);
    world.dispatch({ type: 'start' });
    for (let i = 0; i < 15 && world.view.phase === 'combat'; i++)
      world.dispatch({ type: 'frame', x: 0, y: 0, ticks: 120 });
    expect(world.view.phase).toBe('lost');
    expect(world.view.player.hp).toBe(0);
    const before = world.snapshot();
    expect(world.dispatch({ type: 'next' })).toBeTruthy();
    expect(world.snapshot()).toEqual(before);
  });
});
