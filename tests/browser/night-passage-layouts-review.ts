import { DefaultLoadingManager as manager } from 'three';
import { createSceneRenderer } from '../../src/games/night-passage/ui/presentation/scene';
import { CHAMBER_LAYOUTS } from '../../src/games/night-passage/domain/chamber-content';
import { applyCommand, createGame } from '../../src/games/night-passage/domain/game';

/** Controlled presentation views; imports are resolved by the browser's Vite module pipeline. */
export async function reviewLayouts() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:960px;height:600px;z-index:9999';
  document.body.append(canvas);
  const base = applyCommand(createGame('controlled-layout-comparison'), {
    type: 'start',
    weapon: 'bow',
    runes: [],
  }).state;
  const previousLoad = manager.onLoad,
    previousError = manager.onError;
  let finish!: () => void, fail!: (error: Error) => void;
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
    fail(new Error(`Layout scene asset failed: ${url}`));
  };
  let surface: ReturnType<typeof createSceneRenderer> | null = null;
  let timeout = 0;
  let unavailable = false;
  try {
    surface = createSceneRenderer(canvas, () => {
      unavailable = true;
    });
    surface.draw(base);
    await Promise.race([
      ready,
      new Promise<void>((_, reject) => {
        timeout = window.setTimeout(
          () => reject(new Error('Layout scene loading timed out')),
          10000,
        );
      }),
    ]);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const images = [];
    for (const layout of CHAMBER_LAYOUTS) {
      // Same actors/player/region across all four views; these are presentation fixtures, not legal routes.
      const state = {
        ...base,
        room: {
          ...base.room,
          layout: layout.id,
          name: `Controlled layout · ${layout.name}`,
          pillars: layout.pillars.map((pillar) => ({ ...pillar })),
          hazards: layout.hazards.map((hazard) => ({
            ...hazard,
            radius: 46,
            kind: 'thorns' as const,
          })),
        },
      };
      const before = JSON.stringify(state);
      surface.draw(state);
      images.push({
        id: layout.id,
        name: layout.name,
        png: canvas.toDataURL('image/png'),
        rulesUnchanged: before === JSON.stringify(state),
        unavailable,
      });
    }
    return images;
  } finally {
    clearTimeout(timeout);
    manager.onLoad = previousLoad;
    manager.onError = previousError;
    canvas.remove();
    surface?.dispose();
  }
}
