import { ARENA, CHAMBERS_PER_REGION, GODS, REGIONS, weapon } from '../../domain/content';
import { hazardPhase, hazardTiming } from '../../domain/encounters';
import { attackPattern, attackShapes, projectileAngles } from '../../domain/threats';
import { drawThreat } from './threats';
import type { State } from '../../domain/types';

function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  stroke?: string,
): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
export function drawArena(ctx: CanvasRenderingContext2D, state: State): void {
  const { width, height } = ARENA;
  const region = REGIONS[state.region];
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#10171f';
  ctx.fillRect(0, 0, width, height);
  const floor = ctx.createRadialGradient(480, 260, 60, 480, 280, 560);
  floor.addColorStop(0, region.floor);
  floor.addColorStop(1, '#111a21');
  ctx.fillStyle = floor;
  ctx.fillRect(34, 34, width - 68, height - 68);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#ffffff08';
  for (let x = 50; x < width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 35);
    ctx.lineTo(x, height - 35);
    ctx.stroke();
  }
  for (let y = 50; y < height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(width - 35, y);
    ctx.stroke();
  }
  ctx.strokeStyle = region.color + '60';
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, width - 68, height - 68);
  ctx.strokeStyle = region.color + '18';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(480, 300, 270, 200, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Lanterns frame the playable boundary; their quiet pools do not mask threats.
  for (const x of [58, 902])
    for (const y of [80, 300, 520]) {
      const light = ctx.createRadialGradient(x, y, 2, x, y, 65);
      light.addColorStop(0, '#efc88930');
      light.addColorStop(1, '#efc88900');
      ctx.fillStyle = light;
      ctx.fillRect(x - 65, y - 65, 130, 130);
      circle(ctx, x, y, 4, '#f5d19b');
    }
  for (const hazard of state.room.hazards) {
    const phase = hazardPhase(state.tick, hazard.offset);
    const timing = hazardTiming(hazard);
    circle(
      ctx,
      hazard.x,
      hazard.y,
      hazard.radius,
      phase >= timing.active ? '#f0786655' : phase > timing.warning ? '#eaa56825' : '#00000012',
      phase > timing.warning ? '#edac76' : '#ffffff12',
    );
    if (phase > timing.warning && phase < timing.active)
      circle(
        ctx,
        hazard.x,
        hazard.y,
        (hazard.radius * (phase - timing.warning)) / (timing.active - timing.warning),
        '#eaa56835',
      );
    if (hazard.kind === 'void')
      circle(
        ctx,
        hazard.x,
        hazard.y,
        hazard.radius * 2,
        '#00000000',
        phase >= timing.active ? '#c8a6e477' : '#c8a6e422',
      );
    ctx.fillStyle = '#cec9b199';
    ctx.font = '15px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(
      { thorns: '⋀', tide: '≈', flame: '♨', void: '◎' }[hazard.kind],
      hazard.x,
      hazard.y + 5,
    );
    ctx.textAlign = 'left';
  }
  for (const pillar of state.room.pillars) {
    circle(ctx, pillar.x + 5, pillar.y + 10, pillar.radius + 4, '#060d1680');
    circle(ctx, pillar.x, pillar.y, pillar.radius, '#344347', '#6c777466');
    circle(ctx, pillar.x - 2, pillar.y - 5, pillar.radius - 5, '#435153', '#93aaa133');
    ctx.fillStyle = region.color + '80';
    ctx.fillRect(pillar.x - 2, pillar.y - 14, 4, 16);
  }
  for (const enemy of state.enemies)
    if (enemy.windup > 0) {
      for (const shape of attackShapes(enemy, state.region)) drawThreat(ctx, shape);
      ctx.strokeStyle = '#ffb18c88';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      for (const aim of projectileAngles(enemy, state.region)) {
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y);
        ctx.lineTo(enemy.x + Math.cos(aim) * 550, enemy.y + Math.sin(aim) * 550);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      if (enemy.kind === 'boss') {
        ctx.font = '13px system-ui';
        ctx.fillStyle = '#ffe2be';
        ctx.textAlign = 'center';
        ctx.fillText(attackPattern(enemy, state.region).name, enemy.x, enemy.y - enemy.radius - 25);
        ctx.textAlign = 'left';
      }
    }
  for (const enemy of [...state.enemies].sort((a, b) => a.y - b.y)) {
    const r = enemy.radius;
    circle(ctx, enemy.x + 3, enemy.y + r * 0.6, r, '#05091470');
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.aim + Math.PI / 2);
    ctx.fillStyle = enemy.flash
      ? '#fff3db'
      : enemy.chill
        ? '#8ac1d6'
        : enemy.kind === 'boss'
          ? '#b38cbd'
          : enemy.kind === 'brute'
            ? '#af7f75'
            : enemy.kind === 'archer'
              ? '#b0ae86'
              : enemy.kind === 'witch'
                ? '#a293cc'
                : '#a67e8a';
    ctx.beginPath();
    if (enemy.kind === 'archer') {
      ctx.moveTo(0, -r);
      ctx.lineTo(r, r);
      ctx.lineTo(0, r * 0.5);
      ctx.lineTo(-r, r);
    } else if (enemy.kind === 'witch') {
      ctx.moveTo(0, -r * 1.2);
      ctx.lineTo(r, 0);
      ctx.lineTo(r * 0.6, r);
      ctx.lineTo(-r * 0.6, r);
      ctx.lineTo(-r, 0);
    } else {
      ctx.moveTo(-r * 0.6, -r);
      ctx.lineTo(r * 0.6, -r);
      ctx.lineTo(r, r * 0.4);
      ctx.lineTo(r * 0.35, r);
      ctx.lineTo(-r, r * 0.4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#221e32';
    ctx.fillRect(-r * 0.45, -r * 0.55, r * 0.9, 5);
    if (enemy.kind === 'boss') {
      ctx.strokeStyle = '#edd7a2';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-r, -r);
      ctx.lineTo(-r * 0.5, -r * 1.45);
      ctx.lineTo(0, -r);
      ctx.lineTo(r * 0.5, -r * 1.45);
      ctx.lineTo(r, -r);
      ctx.stroke();
    }
    ctx.restore();
    if (enemy.burn) circle(ctx, enemy.x, enemy.y, r + 3, '#00000000', '#ff9276');
    if (enemy.exposed) {
      ctx.fillStyle = '#d0a7ff';
      ctx.fillText('✦', enemy.x - 5, enemy.y - r - 15);
    }
    ctx.fillStyle = '#070b15';
    ctx.fillRect(enemy.x - r, enemy.y - r - 10, r * 2, 4);
    ctx.fillStyle = '#eb9991';
    ctx.fillRect(enemy.x - r, enemy.y - r - 10, (r * 2 * enemy.hp) / enemy.maxHp, 4);
  }
  for (const shot of state.projectiles) {
    const color = shot.hostile
      ? '#fa9a88'
      : shot.god
        ? GODS.find((g) => g.id === shot.god)!.color
        : '#f5d8a1';
    ctx.strokeStyle = color + '60';
    ctx.lineWidth = shot.radius;
    ctx.beginPath();
    ctx.moveTo(shot.x - shot.vx * 2, shot.y - shot.vy * 2);
    ctx.lineTo(shot.x, shot.y);
    ctx.stroke();
    circle(ctx, shot.x, shot.y, shot.radius * 0.7, color);
  }
  const p = state.player;
  if (p.hp > 0) {
    circle(ctx, p.x + 2, p.y + 12, 17, '#050b1780');
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.aim + Math.PI / 2);
    ctx.globalAlpha = p.invulnerable > 0 && state.tick % 6 < 3 ? 0.65 : 1;
    ctx.fillStyle = '#70c1b9';
    ctx.beginPath();
    ctx.moveTo(-9, -9);
    ctx.lineTo(9, -9);
    ctx.lineTo(17, 20);
    ctx.lineTo(-4, 14);
    ctx.lineTo(-13, 22);
    ctx.closePath();
    ctx.fill();
    circle(ctx, 0, -9, 8, '#e6d7b5');
    ctx.fillStyle = '#243743';
    ctx.fillRect(-8, -12, 16, 5);
    ctx.strokeStyle = weapon(p.weapon).color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(13, p.weapon === 'spear' ? -44 : -25);
    ctx.stroke();
    if (p.weapon === 'shield') circle(ctx, -16, -2, 11, '#8994ad', '#eee0bb');
    if (p.weapon === 'bow') {
      ctx.beginPath();
      ctx.arc(12, -10, 17, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }
    if (p.weapon === 'fists') {
      circle(ctx, -14, -13, 6, '#ffb999');
      circle(ctx, 14, -16, 6, '#ffb999');
    }
    ctx.restore();
    if (p.strike) {
      ctx.strokeStyle = '#f9e5bd66';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 29, p.strike.aim - 0.6, p.strike.aim + 0.6);
      ctx.stroke();
    }
  }
  for (const effect of state.cues) {
    ctx.save();
    ctx.globalAlpha = effect.life / effect.total;
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = effect.kind === 'slash' ? 7 : 3;
    const progress = 1 - effect.life / effect.total;
    ctx.beginPath();
    ctx.arc(
      effect.x,
      effect.y,
      effect.radius * (0.6 + progress * 0.4),
      effect.aim - effect.arc / 2,
      effect.aim + effect.arc / 2,
    );
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#b6c4c180';
  ctx.font = '12px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(
    state.room.boss
      ? 'GUARDIAN CHAMBER'
      : `CHAMBER ${state.chamber + 1}  /  ${CHAMBERS_PER_REGION}`,
    480,
    22,
  );
  ctx.textAlign = 'left';
}
