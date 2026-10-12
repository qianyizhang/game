import { boon, GODS } from '../../../domain/content';
import type { Cue, GodId, Projectile, State } from '../../../domain/types';

const ink = '#10232c';
const colorOf = (id: GodId) => GODS.find((god) => god.id === id)!.color;

/** Small symbolic light marks; dimensions are cosmetic, never collision geometry. */
function patron(ctx: CanvasRenderingContext2D, god: GodId, size: number) {
  ctx.save();
  ctx.scale(size, size);
  ctx.beginPath();
  switch (god) {
    case 'storm':
      ctx.moveTo(-0.9, -0.5);
      ctx.lineTo(0.15, -0.5);
      ctx.lineTo(-0.2, 0);
      ctx.lineTo(0.95, 0);
      ctx.lineTo(-0.2, 0.65);
      break;
    case 'tide':
      for (const y of [-0.4, 0.4]) {
        ctx.moveTo(-0.9, y);
        ctx.bezierCurveTo(-0.3, y - 0.8, 0.3, y + 0.8, 0.9, y);
      }
      break;
    case 'cinder':
      ctx.moveTo(0.95, 0);
      ctx.quadraticCurveTo(0.1, -0.1, -0.5, -0.85);
      ctx.quadraticCurveTo(-1.3, 0, -0.5, 0.85);
      ctx.quadraticCurveTo(0.1, 0.1, 0.95, 0);
      ctx.closePath();
      break;
    case 'winter':
      ctx.moveTo(1, 0);
      ctx.lineTo(-0.15, -0.75);
      ctx.lineTo(-0.8, 0);
      ctx.lineTo(-0.15, 0.75);
      ctx.closePath();
      ctx.moveTo(-0.8, 0);
      ctx.lineTo(1, 0);
      break;
    case 'veil':
      ctx.moveTo(-1, 0);
      ctx.quadraticCurveTo(0, -1.2, 1, 0);
      ctx.quadraticCurveTo(0, 1.2, -1, 0);
      ctx.moveTo(0, -0.4);
      ctx.lineTo(0, 0.4);
      break;
  }
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 5 / size;
  ctx.stroke();
  ctx.strokeStyle = colorOf(god);
  ctx.lineWidth = 2 / size;
  ctx.stroke();
  ctx.restore();
}

export function drawProjectile(ctx: CanvasRenderingContext2D, shot: Projectile) {
  ctx.save();
  ctx.translate(shot.x, shot.y);
  ctx.rotate(Math.atan2(shot.vy, shot.vx));
  const color = shot.hostile ? '#ff907c' : shot.god ? colorOf(shot.god) : '#fff0b8';
  // Short tails communicate direction without implying a beam damage footprint.
  ctx.beginPath();
  ctx.moveTo(-Math.min(26, Math.hypot(shot.vx, shot.vy) * 2), 0);
  ctx.lineTo(-shot.radius, 0);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (!shot.hostile && shot.god) patron(ctx, shot.god, shot.radius * 1.5);
  else {
    ctx.beginPath();
    ctx.moveTo(shot.radius, 0);
    ctx.lineTo(0, -shot.radius * 0.7);
    ctx.lineTo(-shot.radius, 0);
    ctx.lineTo(0, shot.radius * 0.7);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    if (shot.hostile) {
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff6df';
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawCue(ctx: CanvasRenderingContext2D, cue: Cue) {
  ctx.save();
  ctx.translate(cue.x, cue.y);
  ctx.rotate(cue.aim);
  const remaining = cue.life / cue.total;
  const radius = cue.radius * (1 - remaining * 0.35);
  ctx.globalAlpha = remaining;
  ctx.strokeStyle = cue.color;
  ctx.lineWidth = cue.kind === 'slash' ? 5 : 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  switch (cue.kind) {
    case 'slash':
      ctx.arc(0, 0, radius, -cue.arc / 2, cue.arc / 2);
      break;
    case 'burst':
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.moveTo(radius * 0.78, 0);
      ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
      break;
    case 'hit':
      for (let n = 0; n < 4; n++) {
        const a = (n * Math.PI) / 2 + Math.PI / 4;
        ctx.moveTo(Math.cos(a) * radius * 0.3, Math.sin(a) * radius * 0.3);
        ctx.lineTo(Math.cos(a) * radius * 0.8, Math.sin(a) * radius * 0.8);
      }
      break;
    case 'dash':
      for (let n = 0; n < 3; n++) {
        const x = radius * (0.5 - n * 0.6);
        ctx.moveTo(x - 7, -9);
        ctx.lineTo(x, 0);
        ctx.lineTo(x - 7, 9);
      }
      break;
    case 'heal':
      ctx.moveTo(-radius * 0.45, 0);
      ctx.lineTo(radius * 0.45, 0);
      ctx.moveTo(0, -radius * 0.45);
      ctx.lineTo(0, radius * 0.45);
      break;
  }
  ctx.stroke();
  ctx.restore();
}

/** Read concurrent statuses independently; actor flash/tint must not hide the build's effects. */
export function drawCombatStatus(ctx: CanvasRenderingContext2D, state: State) {
  ctx.save();
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    const statuses = [
      ['cinder', enemy.burn],
      ['winter', enemy.chill],
      ['veil', enemy.exposed],
    ] as const;
    statuses.forEach(([god, duration], index) => {
      if (duration <= 0) return;
      const a = (index * Math.PI * 2) / 3;
      const r = enemy.radius + 8;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, r, a - 0.6, a + 0.6);
      ctx.strokeStyle = colorOf(god);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.save();
      ctx.translate(enemy.x + Math.cos(a) * (r + 8), enemy.y + Math.sin(a) * (r + 8));
      patron(ctx, god, 6);
      ctx.restore();
    });
  }
  const player = state.player;
  if (player.invulnerable > 0) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, 21, 0, Math.PI * 2);
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#e1fff1';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const action = player.strike?.action;
  if (action === 'cast' || action === 'call') {
    const entry = player.boons.find((b) => boon(b.id).slot === action);
    if (entry) {
      const god = boon(entry.id).god;
      ctx.translate(player.x, player.y);
      ctx.beginPath();
      ctx.arc(0, 0, action === 'call' ? 29 : 25, 0, Math.PI * 2);
      ctx.strokeStyle = colorOf(god);
      ctx.lineWidth = action === 'call' ? 4 : 2;
      ctx.stroke();
      ctx.translate(-31, 24);
      patron(ctx, god, action === 'call' ? 12 : 9);
    }
  }
  ctx.restore();
}
