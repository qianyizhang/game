import { ARENA } from '../../domain/content';
import type { State } from '../../domain/types';
import { drawArena } from './draw';
import type { Renderer } from './renderer';

/** The baseline view; all coordinates inside drawArena remain in combat-plane units. */
export function createCanvasRenderer(canvas: HTMLCanvasElement): Renderer {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Night Passage could not create its Canvas renderer.');
  let disposed = false;
  let lastState: State | null = null;
  let pixelRatio = 0;
  const paint = () => {
    if (disposed || !lastState || !canvas.width || !canvas.height) return;
    context.setTransform(canvas.width / ARENA.width, 0, 0, canvas.height / ARENA.height, 0, 0);
    drawArena(context, lastState);
  };
  const resize = () => {
    if (disposed) return;
    const box = canvas.getBoundingClientRect();
    pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(box.width * pixelRatio);
    const height = Math.round(box.height * pixelRatio);
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    paint();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  return {
    draw(state) {
      if (disposed) return;
      lastState = state;
      // Moving between displays can change density without changing the CSS viewport.
      if (pixelRatio !== Math.min(2, window.devicePixelRatio || 1)) resize();
      paint();
    },
    groundPoint(client) {
      if (disposed) return null;
      const box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) return null;
      return {
        x: ((client.x - box.left) * ARENA.width) / box.width,
        y: ((client.y - box.top) * ARENA.height) / box.height,
      };
    },
    groundDirection(screen) {
      return screen;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      lastState = null;
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
