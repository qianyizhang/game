import * as T from 'three';
import { ARENA, GODS } from '../../../domain/content';
import { hazardPhase, hazardTiming } from '../../../domain/encounters';
import { attackShapes, projectileAngles } from '../../../domain/threats';
import type { State } from '../../../domain/types';
import { drawThreat } from '../threats';

/** One transparent ground decal uses the exact same threat paths as the baseline view. */
export function createGroundEffects(parent: T.Group) {
  const canvas = document.createElement('canvas');
  canvas.width = ARENA.width * 2;
  canvas.height = ARENA.height * 2;
  const ctx = canvas.getContext('2d')!;
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const material = new T.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const geometry = new T.PlaneGeometry(ARENA.width, ARENA.height);
  const mesh = new T.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(480, 0.8, 300);
  mesh.renderOrder = 1;
  parent.add(mesh);
  const circle = (x: number, y: number, radius: number, fill: string, stroke: string) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  return {
    sync(state: State) {
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      ctx.clearRect(0, 0, ARENA.width, ARENA.height);
      for (const hazard of state.room.hazards) {
        const phase = hazardPhase(state.tick, hazard.offset);
        const timing = hazardTiming(hazard);
        const active = phase >= timing.active;
        const warning = phase > timing.warning;
        circle(
          hazard.x,
          hazard.y,
          hazard.radius,
          active ? '#fc805d99' : warning ? '#ffb85e40' : '#16262270',
          warning ? '#ffd19a' : '#719d8560',
        );
        if (hazard.kind === 'void')
          circle(
            hazard.x,
            hazard.y,
            hazard.radius * 2,
            '#00000000',
            active ? '#c8a6e499' : '#c8a6e444',
          );
        ctx.fillStyle = '#e5d7ab';
        ctx.font = '18px serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          { thorns: '⋀', tide: '≈', flame: '♨', void: '◎' }[hazard.kind],
          hazard.x,
          hazard.y + 6,
        );
      }
      for (const enemy of state.enemies)
        if (enemy.windup > 0) {
          for (const shape of attackShapes(enemy, state.region)) drawThreat(ctx, shape);
          ctx.strokeStyle = '#ffb18caa';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          for (const aim of projectileAngles(enemy, state.region)) {
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y);
            ctx.lineTo(enemy.x + Math.cos(aim) * 700, enemy.y + Math.sin(aim) * 700);
            ctx.stroke();
          }
          ctx.setLineDash([]);
        }
      // A ground ring keeps exact player position visible beneath the standing silhouette.
      circle(state.player.x, state.player.y, 15, '#7de3d622', '#b6fff0');
      const aim = state.player.aim;
      ctx.beginPath();
      ctx.moveTo(state.player.x + Math.cos(aim) * 21, state.player.y + Math.sin(aim) * 21);
      ctx.lineTo(state.player.x + Math.cos(aim) * 36, state.player.y + Math.sin(aim) * 36);
      ctx.strokeStyle = '#efffe4';
      ctx.lineWidth = 3;
      ctx.stroke();
      for (const shot of state.projectiles) {
        const color = shot.hostile
          ? '#ff907c'
          : shot.god
            ? GODS.find((god) => god.id === shot.god)!.color
            : '#fff0b8';
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(3, shot.radius);
        ctx.beginPath();
        ctx.moveTo(shot.x - shot.vx * 2, shot.y - shot.vy * 2);
        ctx.lineTo(shot.x, shot.y);
        ctx.stroke();
        circle(shot.x, shot.y, shot.radius, color, '#fff2dd');
      }
      for (const effect of state.cues) {
        ctx.globalAlpha = effect.life / effect.total;
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = effect.kind === 'slash' ? 7 : 3;
        ctx.beginPath();
        ctx.arc(
          effect.x,
          effect.y,
          effect.radius * (1 - (effect.life / effect.total) * 0.4),
          effect.aim - effect.arc / 2,
          effect.aim + effect.arc / 2,
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      texture.needsUpdate = true;
    },
    dispose() {
      mesh.removeFromParent();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
