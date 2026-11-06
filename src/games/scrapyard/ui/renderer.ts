import { ARENA, RANGED } from '../domain/content';
import type { View } from '../domain/world';
import { createSprites } from './sprites';
import { createEffects } from './effects';

/** Canvas presentation consumes confirmed state; it never advances combat. */
export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D is unavailable.');
  const context = ctx;
  let disposed = false;
  const sprite = createSprites();
  const effects = createEffects();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const actors = ['drifter', 'runner', 'brute', 'spitter'] as const;
  for (const id of [
    'survivor',
    ...actors,
    'light-round',
    'heavy-round',
    'hostile-diamond',
    'scrap-pickup',
    'player-hit',
    'scrap-sparkle',
  ] as const)
    sprite(id);
  const floor = document.createElement('canvas');
  floor.width = ARENA.width * 2;
  floor.height = ARENA.height * 2;
  const floorContext = floor.getContext('2d')!;
  function paintFloor() {
    floorContext.setTransform(2, 0, 0, 2, 0, 0);
    floorContext.fillStyle = '#142622';
    floorContext.fillRect(0, 0, ARENA.width, ARENA.height);
    floorContext.globalAlpha = 0.35;
    for (let y = 0; y < ARENA.height; y += 40)
      for (let x = 0; x < ARENA.width; x += 40)
        floorContext.drawImage(sprite('floor-tile'), x, y, 40, 40);
    floorContext.globalAlpha = 1;
    // All edge materials stay in the non-playfield margin; the inset cue is drawn separately.
    for (let side = 0; side < 4; side++) {
      floorContext.save();
      floorContext.translate(side === 1 || side === 2 ? 960 : 0, side >= 2 ? 600 : 0);
      floorContext.rotate((side * Math.PI) / 2);
      const length = side % 2 ? 600 : 960;
      floorContext.drawImage(sprite('corner-join'), 0, 0, 10, 10);
      for (let x = 10; x < length - 10; x += 40)
        floorContext.drawImage(sprite('boundary-strip'), x, 0, Math.min(40, length - 10 - x), 10);
      floorContext.restore();
    }
  }
  paintFloor();
  const ready = sprite.ready()?.then(() => {
    if (!disposed) paintFloor();
  });
  function resize() {
    const box = canvas.getBoundingClientRect(),
      ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(box.width * ratio));
    const height = Math.max(1, Math.round((width * ARENA.height) / ARENA.width));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  return {
    ready,
    draw(s: View) {
      if (disposed) return;
      context.setTransform(canvas.width / 960, 0, 0, canvas.height / 600, 0, 0);
      context.drawImage(floor, 0, 0, 960, 600);
      context.strokeStyle = '#20372f';
      context.lineWidth = 1;
      context.beginPath();
      for (let x = 0; x <= 960; x += 40) {
        context.moveTo(x, 0);
        context.lineTo(x, 600);
      }
      for (let y = 0; y <= 600; y += 40) {
        context.moveTo(0, y);
        context.lineTo(960, y);
      }
      context.stroke();
      context.strokeStyle = '#57735a';
      context.lineWidth = 3;
      context.strokeRect(12, 12, 936, 576);
      for (const item of s.pickups)
        context.drawImage(sprite('scrap-pickup'), item.x - 4, item.y - 4, 8, 8);
      for (const enemy of s.enemies) {
        const size = enemy.radius * 2;
        context.drawImage(
          sprite(actors[enemy.kind]),
          enemy.x - enemy.radius,
          enemy.y - enemy.radius,
          size,
          size,
        );
      }
      // Spitters have a barrel and a windup ring; colour is not their only cue.
      context.strokeStyle = '#b6f2e1';
      context.lineWidth = 2;
      context.beginPath();
      for (const enemy of s.enemies)
        if (enemy.kind === RANGED.kind) {
          context.moveTo(enemy.x + Math.cos(enemy.aim) * 10, enemy.y + Math.sin(enemy.aim) * 10);
          context.lineTo(enemy.x + Math.cos(enemy.aim) * 20, enemy.y + Math.sin(enemy.aim) * 20);
          if (enemy.cooldown <= RANGED.windup) {
            const radius = enemy.radius + 4 + (1 - enemy.cooldown / RANGED.windup) * 5;
            context.moveTo(enemy.x + radius, enemy.y);
            context.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
          }
        }
      context.stroke();
      for (const shot of s.hostileShots) {
        const radius = shot.radius + 1;
        context.drawImage(
          sprite('hostile-diamond'),
          shot.x - radius,
          shot.y - radius,
          radius * 2,
          radius * 2,
        );
      }
      for (const shot of s.shots)
        context.drawImage(
          sprite(shot.radius > 3 ? 'heavy-round' : 'light-round'),
          shot.x - shot.radius,
          shot.y - shot.radius,
          shot.radius * 2,
          shot.radius * 2,
        );
      const p = s.player;
      context.strokeStyle = '#b5d7c7';
      context.lineWidth = 5;
      context.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + s.tick / 180;
        context.moveTo(p.x + Math.cos(angle) * 18, p.y + Math.sin(angle) * 18);
        context.lineTo(p.x + Math.cos(angle) * 27, p.y + Math.sin(angle) * 27);
      }
      context.stroke();
      if (p.invulnerable > 0 && s.tick % 12 < 6) {
        context.fillStyle = '#fff9db';
        context.beginPath();
        context.ellipse(p.x, p.y, 13, 16, -0.2, 0, Math.PI * 2);
        context.fill();
      } else {
        context.drawImage(sprite('survivor'), p.x - 13, p.y - 16, 26, 32);
      }
      context.strokeStyle = '#fff6d6';
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(p.x, p.y, 32, 0, Math.PI * 2);
      context.stroke();
      for (const cue of effects(s)) {
        if (reducedMotion.matches) continue; // Existing invulnerability flash remains the reduced-motion cue.
        const size = cue.kind === 'player-hit' ? 48 : 20;
        context.drawImage(sprite(cue.kind), cue.x - size / 2, cue.y - size / 2, size, size);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      floor.width = 0;
      floor.height = 0;
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
