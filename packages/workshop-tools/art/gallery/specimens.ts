import { drawHero } from '../../../../packages/diablo2/src/ui/hero-art';
import { drawCryptMonster } from '../../../../packages/diablo2/src/ui/crypt-art';
import { createGame } from '../../../../src/games/night-passage/domain/game';
import { ARENA as NIGHT_ARENA } from '../../../../src/games/night-passage/domain/content';
import { drawArena } from '../../../../src/games/night-passage/ui/presentation/draw';
import { World } from '../../../../src/games/scrapyard/domain/world';
import { ENEMIES as SCRAP_ENEMIES } from '../../../../src/games/scrapyard/domain/content';
import { createRenderer } from '../../../../src/games/scrapyard/ui/renderer';

/** Fixed presentation specimens. No sessions, saves, clocks or animation loops. */
for (const canvas of document.querySelectorAll<HTMLCanvasElement>('canvas[data-specimen]')) {
  const context = canvas.getContext('2d');
  if (!context) {
    canvas.replaceWith(
      Object.assign(document.createElement('p'), { textContent: 'Canvas 2D is unavailable.' }),
    );
    continue;
  }
  try {
    const kind = canvas.dataset.specimen!;
    if (kind === 'night-passage') {
      context.scale(canvas.width / NIGHT_ARENA.width, canvas.height / NIGHT_ARENA.height);
      drawArena(context, createGame('asset-gallery-night-passage'));
    } else if (kind === 'scrapyard') {
      const world = new World('asset-gallery-scrapyard', 100);
      const state = world.snapshot();
      state.phase = 'combat';
      state.enemies = [0, 1, 2, 3].map((enemyKind) => ({
        id: enemyKind,
        kind: enemyKind,
        x: 250 + enemyKind * 140,
        y: 250,
        hp: 10,
        radius: SCRAP_ENEMIES[enemyKind].radius,
        aim: -Math.PI / 2,
        cooldown: 0,
      }));
      const renderer = createRenderer(canvas);
      renderer.draw(state);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      // Dispose clears its canvas; restore only the fixed specimen pixels.
      renderer.dispose();
      canvas.width = pixels.width;
      canvas.height = pixels.height;
      context.putImageData(pixels, 0, 0);
    } else {
      context.fillStyle = '#182b2d';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.translate(canvas.width / 2, canvas.height * 0.6);
      context.scale(4, 4);
      if (!drawHero(context, kind, '#ab9272', 0) && !drawCryptMonster(context, kind, '#89a29a', 0))
        throw new Error(`Unknown specimen: ${kind}`);
    }
    canvas.dataset.ready = 'true';
  } catch {
    canvas.dataset.ready = 'false';
    canvas.replaceWith(
      Object.assign(document.createElement('p'), {
        textContent: 'This specimen could not be rendered. Open the game to inspect it.',
      }),
    );
  }
}
