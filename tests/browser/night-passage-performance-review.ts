import { DefaultLoadingManager } from 'three';
import { createSceneRenderer } from '../../src/games/night-passage/ui/presentation/scene';
import { createGame } from '../../src/games/night-passage/domain/game';
import { spawnEnemy } from '../../src/games/night-passage/domain/encounters';
import { ENEMY_PATTERNS } from '../../src/games/night-passage/domain/encounter-content';
import type { State } from '../../src/games/night-passage/domain/types';

const kinds = ['hunter', 'archer', 'brute', 'witch'] as const;
const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));
const sampleCount = 180;
const warmupCount = 45;

function summary(values: number[]) {
  const ordered = [...values].sort((a, b) => a - b);
  const percentile = (p: number) =>
    ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * p) - 1)];
  return {
    count: ordered.length,
    p50: percentile(0.5),
    p95: percentile(0.95),
    max: ordered.at(-1)!,
    mean: values.reduce((total, value) => total + value, 0) / values.length,
  };
}

/** Explicit fixture: five represents ordinary campaign density; 24 tests expansion headroom. */
function workload(count: number): State {
  const state = createGame(`performance-${count}`);
  state.phase = 'combat';
  state.region = 3;
  state.room.pillars = [{ x: 480, y: 285, radius: 38 }];
  state.player.x = 480;
  state.player.y = 470;
  for (let i = 0; i < count; i++) {
    spawnEnemy(state, kinds[i % kinds.length], {
      x: 130 + (i % 6) * 140,
      y: 110 + Math.floor(i / 6) * 100,
    });
  }
  return state;
}

function frame(base: State, tick: number): State {
  return {
    ...base,
    tick,
    player: { ...base.player, x: 480 + Math.sin(tick / 35) * 25, aim: tick / 90 },
    enemies: base.enemies.map((enemy, index) => {
      const kind = enemy.kind as (typeof kinds)[number];
      return {
        ...enemy,
        x: enemy.x + Math.sin(tick / 30 + index) * 16,
        y: enemy.y + Math.cos(tick / 32 + index) * 12,
        aim: Math.atan2(base.player.y - enemy.y, base.player.x - enemy.x),
        windup:
          index % 3 === 0 ? ENEMY_PATTERNS[kind].windup - (tick % ENEMY_PATTERNS[kind].windup) : 0,
        target: { x: base.player.x, y: base.player.y },
      };
    }),
  };
}

async function measure(count: number, round: number) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:960px;height:600px;z-index:9999';
  document.body.append(canvas);
  const manager = DefaultLoadingManager;
  const previousLoad = manager.onLoad;
  const previousError = manager.onError;
  let finish!: () => void;
  let fail!: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  manager.onLoad = () => {
    previousLoad?.();
    finish();
  };
  manager.onError = (url) => {
    previousError?.(url);
    fail(new Error(`Benchmark asset failed: ${url}`));
  };
  let surface: ReturnType<typeof createSceneRenderer> | null = null;
  const restores: (() => void)[] = [];
  let drawCalls = 0;
  let timeout = 0;
  let unavailable = false;
  try {
    surface = createSceneRenderer(canvas, () => {
      unavailable = true;
    });
    const gl = canvas.getContext('webgl2');
    if (!gl) throw new Error('Benchmark requires the production WebGL2 context');
    for (const name of [
      'drawElements',
      'drawArrays',
      'drawElementsInstanced',
      'drawArraysInstanced',
    ]) {
      const original = Reflect.get(gl, name) as (...args: number[]) => void;
      Reflect.set(gl, name, (...args: number[]) => {
        drawCalls++;
        original.apply(gl, args);
      });
      restores.push(() => {
        Reflect.set(gl, name, original);
      });
    }
    const base = workload(count);
    surface.draw(base);
    await Promise.race([
      ready,
      new Promise<void>((_, reject) => {
        timeout = window.setTimeout(
          () => reject(new Error('Benchmark asset loading timed out')),
          15000,
        );
      }),
    ]);
    for (let tick = 1; tick <= warmupCount; tick++) {
      await nextFrame();
      surface.draw(frame(base, tick));
    }
    const submission: number[] = [];
    const intervals: number[] = [];
    const calls: number[] = [];
    let pure = true;
    let previous = await nextFrame();
    const measurementStartMs = performance.now();
    for (let index = 1; index <= sampleCount; index++) {
      const now = await nextFrame();
      intervals.push(now - previous);
      previous = now;
      const snapshot = frame(base, warmupCount + index);
      const before = JSON.stringify(snapshot);
      drawCalls = 0;
      const start = performance.now();
      surface.draw(snapshot);
      submission.push(performance.now() - start);
      calls.push(drawCalls);
      pure &&= before === JSON.stringify(snapshot);
    }
    const measurementEndMs = performance.now();
    // Every round/workload uses the same final tick, rather than a timing-dependent image.
    const fixed = frame(base, warmupCount + sampleCount);
    surface.draw(fixed);
    const png = canvas.toDataURL('image/png');
    const before = JSON.stringify(fixed);
    drawCalls = 0;
    for (let index = 0; index < 10; index++) {
      await nextFrame();
      surface.draw(fixed);
    }
    const pausedDrawCalls = drawCalls;
    pure &&= before === JSON.stringify(fixed);
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      count,
      workload: count === 5 ? 'ordinary campaign density' : 'expansion headroom stress',
      round,
      warmupFrames: warmupCount,
      measuredFrames: sampleCount,
      measurementStartMs,
      measurementEndMs,
      submissionMs: summary(submission),
      rafIntervalMs: summary(intervals),
      drawCallsPerFrame: summary(calls),
      pausedFrames: 10,
      pausedDrawCalls,
      rulesUnchanged: pure,
      unavailable,
      backing: { width: canvas.width, height: canvas.height },
      gpu: debug
        ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
        : String(gl.getParameter(gl.RENDERER)),
      png,
    };
  } finally {
    clearTimeout(timeout);
    for (const restore of restores) restore();
    manager.onLoad = previousLoad;
    manager.onError = previousError;
    canvas.remove();
    surface?.dispose();
  }
}

/** CPU command submission and whole-frame cadence; neither measurement is a GPU timer. */
export async function benchmarkNightPassage(rounds = 3) {
  const results = [];
  for (let round = 1; round <= rounds; round++)
    for (const count of [5, 24]) results.push(await measure(count, round));
  return {
    schemaVersion: 1,
    timingScope:
      'draw() JavaScript CPU submission, not GPU execution; RAF includes browser scheduling and other page work',
    userAgent: navigator.userAgent,
    timeOrigin: performance.timeOrigin,
    viewport: { width: innerWidth, height: innerHeight },
    canvasCss: { width: 960, height: 600 },
    devicePixelRatio: window.devicePixelRatio,
    results,
  };
}
