import { World } from '../../src/games/scrapyard/domain/world';
import {
  DENSITIES,
  RULES_VERSION,
  LIMITS,
  RANGED,
  type Density,
} from '../../src/games/scrapyard/domain/content';
import { createRenderer } from '../../src/games/scrapyard/ui/renderer';
import { createClock } from '../../src/games/scrapyard/ui/clock';

function summary(samples: number[]) {
  const ordered = [...samples].sort((a, b) => a - b);
  const percentile = (fraction: number) =>
    ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * fraction))];
  return {
    count: samples.length,
    min: ordered[0] ?? 0,
    median: percentile(0.5),
    p95: percentile(0.95),
    max: ordered.at(-1) ?? 0,
  };
}
async function workload(canvas: HTMLCanvasElement, density: Density, round: number) {
  const world = new World('scrapyard-performance-1', density);
  world.dispatch({ type: 'start' });
  const renderer = createRenderer(canvas),
    clock = createClock();
  const simulation: number[] = [],
    draw: number[] = [],
    work: number[] = [],
    intervals: number[] = [],
    hostileCounts: number[] = [],
    totalCounts: number[] = [];
  let previous = 0,
    corner = 0,
    maxShots = 0,
    maxPickups = 0,
    steps = 0;
  const corners = [
    [780, 120],
    [780, 480],
    [180, 480],
    [180, 120],
  ];
  const frame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));
  try {
    while (world.view.tick < 720) {
      const now = await frame();
      const ticks = Math.min(clock(now, true), 720 - world.view.tick);
      const begin = performance.now();
      for (let i = 0; i < ticks; i++) {
        const p = world.view.player,
          target = corners[corner];
        if (Math.hypot(p.x - target[0], p.y - target[1]) < 7) corner = (corner + 1) % 4;
        const next = corners[corner];
        const error = world.dispatch({
          type: 'frame',
          x: Math.abs(next[0] - p.x) < 3 ? 0 : Math.sign(next[0] - p.x),
          y: Math.abs(next[1] - p.y) < 3 ? 0 : Math.sign(next[1] - p.y),
          ticks: 1,
        });
        if (error) throw new Error(error);
      }
      const simulated = performance.now();
      renderer.draw(world.view);
      const drawn = performance.now();
      if (world.view.tick > 120) {
        simulation.push(simulated - begin);
        draw.push(drawn - simulated);
        work.push(drawn - begin);
        if (previous) intervals.push(now - previous);
        steps += ticks;
        maxShots = Math.max(maxShots, world.view.shots.length);
        maxPickups = Math.max(maxPickups, world.view.pickups.length);
        hostileCounts.push(world.view.hostileShots.length);
        totalCounts.push(world.view.hostileShots.length + world.view.shots.length);
      }
      previous = now;
    }
    return {
      density,
      round,
      simulationMs: summary(simulation),
      drawSubmissionMs: summary(draw),
      combinedMs: summary(work),
      rafMs: summary(intervals),
      intervalsOver25ms: intervals.filter((v) => v > 25).length,
      intervalsOver50ms: intervals.filter((v) => v > 50).length,
      sampledTicks: steps,
      kills: world.view.kills,
      hp: world.view.player.hp,
      maxShots,
      maxPickups,
      hostileShots: summary(hostileCounts),
      totalShots: summary(totalCounts),
      framesWithHundreds: hostileCounts.filter((count) => count >= 200).length,
      hostileCapacityFrames: hostileCounts.filter((count) => count >= LIMITS.hostileShots).length,
      rangedEnemies: world.view.enemies.filter((enemy) => enemy.kind === RANGED.kind).length,
      activeEnemies: world.view.enemies.length,
    };
  } finally {
    renderer.dispose();
  }
}
export async function benchmarkScrapyard() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:960px;height:600px;display:block';
  document.body.replaceChildren(canvas);
  const results = [];
  for (let round = 0; round < 3; round++)
    for (let i = 0; i < 3; i++)
      results.push(await workload(canvas, DENSITIES[(i + round) % 3], round + 1));
  return {
    version: RULES_VERSION,
    userAgent: navigator.userAgent,
    devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency,
    viewport: { width: innerWidth, height: innerHeight },
    protocol:
      'Rules-2 production World with local separation and ranged volleys + Canvas renderer + fixed-step clock. 120 warmup ticks, 600 measured ticks per workload; 3 rounds with rotated density order; fixed seed and waypoint inputs. Normal damage and health. Hostile and total projectile distributions are measured. Excludes React HUD, GPU timing and human input latency.',
    results,
  };
}
