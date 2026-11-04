import { ARENA, ENEMIES, RANGED } from '../domain/content';
import type { View } from '../domain/world';

/** Canvas presentation consumes confirmed state; it never advances combat. */
export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D is unavailable.');
  const context = ctx;
  let disposed = false;
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
    draw(s: View) {
      if (disposed) return;
      context.setTransform(canvas.width / 960, 0, 0, canvas.height / 600, 0, 0);
      context.fillStyle = '#142622';
      context.fillRect(0, 0, 960, 600);
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
      context.fillStyle = '#a9e177';
      context.beginPath();
      for (const item of s.pickups) {
        context.moveTo(item.x, item.y - 4);
        context.lineTo(item.x + 4, item.y);
        context.lineTo(item.x, item.y + 4);
        context.lineTo(item.x - 4, item.y);
        context.closePath();
      }
      context.fill();
      for (let kind = 0; kind < ENEMIES.length; kind++) {
        context.fillStyle = ['#e6a674', '#da7c70', '#ad93c6', '#8acbbd'][kind];
        context.beginPath();
        for (const enemy of s.enemies)
          if (enemy.kind === kind) {
            context.moveTo(enemy.x + enemy.radius, enemy.y);
            context.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
          }
        context.fill();
      }
      context.fillStyle = '#26362c';
      context.beginPath();
      for (const enemy of s.enemies) {
        context.rect(enemy.x - 5, enemy.y - 3, 3, 4);
        context.rect(enemy.x + 2, enemy.y - 3, 3, 4);
      }
      context.fill();
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
      context.fillStyle = '#ff927e';
      context.beginPath();
      for (const shot of s.hostileShots) {
        context.moveTo(shot.x, shot.y - shot.radius - 1);
        context.lineTo(shot.x + shot.radius + 1, shot.y);
        context.lineTo(shot.x, shot.y + shot.radius + 1);
        context.lineTo(shot.x - shot.radius - 1, shot.y);
        context.closePath();
      }
      context.fill();
      context.fillStyle = '#fff0a8';
      context.beginPath();
      for (const shot of s.shots) {
        context.moveTo(shot.x + shot.radius, shot.y);
        context.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
      }
      context.fill();
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
      context.fillStyle = p.invulnerable > 0 && s.tick % 12 < 6 ? '#fff9db' : '#f4cf74';
      context.beginPath();
      context.ellipse(p.x, p.y, 13, 16, -0.2, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#20372f';
      context.fillRect(p.x - 5, p.y - 4, 3, 4);
      context.fillRect(p.x + 3, p.y - 4, 3, 4);
      context.strokeStyle = '#fff6d6';
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(p.x, p.y, 32, 0, Math.PI * 2);
      context.stroke();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
