import type { Command, Content, Element, Point, SkillDef, State } from '../domain/types';
import { currentWorld } from '../domain/world';
import { STEP_MS } from '../domain/timing';

export interface VisualCue {
  kind: 'cast' | 'impact';
  skill: string;
  effect: SkillDef['effect'];
  element: Element;
  from: Point;
  target: Point;
  radius: number;
  region: string;
  started: number;
  duration: number;
}
const point = (p: Point): Point => ({ x: p.x, y: p.y });
/** Ephemeral presentation receipts. Rejected commands never enter this timeline or the replay. */
export class SkillEffects {
  private cues: VisualCue[] = [];
  clear(): void {
    this.cues = [];
  }
  record(before: State, after: State, command: Command, content: Content): void {
    if (before.region !== after.region || command.type === 'dev-jump') {
      this.clear();
      return;
    }
    const started = (after.tick * STEP_MS) / 1000;
    if (command.type === 'cast') {
      const skill = content.skills.find((s) => s.id === command.skill)!;
      const ally =
        skill.effect === 'summon'
          ? currentWorld(after).allies.find(
              (a) => !currentWorld(before).allies.some((old) => old.uid === a.uid),
            )
          : null;
      this.cues.push({
        kind: 'cast',
        skill: skill.id,
        effect: skill.effect,
        element: skill.element,
        from: point(before.player),
        target: point(ally ?? (skill.range === 0 ? before.player : command.target)),
        radius: skill.radius,
        region: after.region,
        started,
        duration: skill.effect === 'projectile' ? 0.4 : skill.effect === 'melee' ? 0.5 : 0.9,
      });
    }
    const world = currentWorld(after);
    for (const enemy of currentWorld(before).enemies) {
      const next = world.enemies.find((e) => e.uid === enemy.uid);
      if (next && enemy.hp > 0 && next.hp < enemy.hp)
        this.cues.push({
          kind: 'impact',
          skill: 'impact',
          effect: 'melee',
          element:
            command.type === 'cast'
              ? content.skills.find((s) => s.id === command.skill)!.element
              : 'physical',
          from: point(next),
          target: point(next),
          radius: next.hp === 0 ? 0.8 : 0.4,
          region: after.region,
          started,
          duration: 0.4,
        });
    }
    this.cues = this.cues.slice(-80);
  }
  visible(region: string, time: number): VisualCue[] {
    this.cues = this.cues.filter((c) => time < c.started + c.duration);
    return this.cues.filter((c) => c.region === region && time >= c.started);
  }
}
const colors: Record<Element, string> = {
  physical: '#ffd394',
  fire: '#ff9952',
  cold: '#99eaff',
  poison: '#b8e87d',
};
/** Draw accepted skill cues in world space, beneath the minimap and above actors. */
export function drawSkillEffects(
  ctx: CanvasRenderingContext2D,
  cues: VisualCue[],
  camera: Point,
  tile: number,
  time: number,
): string[] {
  const drawn: string[] = [];
  for (const cue of cues) {
    const age = Math.max(0, Math.min(1, (time - cue.started) / cue.duration)),
      fade = 1 - age;
    const x = (cue.target.x - camera.x) * tile,
      y = (cue.target.y - camera.y) * tile;
    const fx = (cue.from.x - camera.x) * tile,
      fy = (cue.from.y - camera.y) * tile;
    const color =
      cue.effect === 'curse'
        ? '#d297ee'
        : cue.effect === 'summon'
          ? '#b8e87d'
          : colors[cue.element];
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    const ring = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
      ctx.stroke();
    };
    if (cue.kind === 'impact') {
      for (let n = 0; n < 8; n++) {
        const angle = (n * Math.PI) / 4,
          inner = 4 + age * 8,
          outer = inner + cue.radius * tile * fade;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
        ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
        ctx.stroke();
      }
    } else if (cue.effect === 'nova') {
      const radius = cue.radius * tile * (0.15 + age * 0.85);
      ring(fx, fy, radius);
      ctx.lineWidth = 1;
      ring(fx, fy, radius * 0.8);
      ctx.globalAlpha = fade * 0.12;
      ctx.beginPath();
      ctx.arc(fx, fy, radius, 0, 7);
      ctx.fill();
      ctx.globalAlpha = fade;
      for (let n = 0; n < 12; n++) {
        const angle = (n * Math.PI) / 6 + age * 0.3;
        ctx.beginPath();
        ctx.moveTo(fx + Math.cos(angle) * radius * 0.75, fy + Math.sin(angle) * radius * 0.75);
        ctx.lineTo(fx + Math.cos(angle) * (radius + 9), fy + Math.sin(angle) * (radius + 9));
        ctx.stroke();
      }
    } else if (cue.effect === 'melee') {
      const angle = Math.atan2(cue.target.y - cue.from.y, cue.target.x - cue.from.x),
        radius = cue.radius * tile * (0.65 + age * 0.35);
      ctx.lineWidth = 7 * fade + 1;
      ctx.beginPath();
      ctx.arc(fx, fy, radius, angle - 1.3 + age * 0.5, angle + 0.7 + age * 0.5);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fx, fy, radius * 0.75, angle - 1.2, angle + 0.6);
      ctx.stroke();
    } else if (cue.effect === 'leap') {
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo((fx + x) / 2, (fy + y) / 2 - 45, x, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ring(fx, fy, (1 - age) * 24);
      ring(x, y, 12 + age * cue.radius * tile + age * 20);
      const glow = ctx.createRadialGradient(x, y, 1, x, y, 25 + age * 20);
      glow.addColorStop(0, color + '99');
      glow.addColorStop(1, color + '00');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 50, y - 50, 100, 100);
    } else if (cue.effect === 'summon') {
      ring(x, y, 20 + age * 12);
      ctx.lineWidth = 1;
      ring(x, y, 14 + age * 8);
      for (let n = 0; n < 6; n++) {
        const a = (n * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 15, y + Math.sin(a) * 15);
        ctx.lineTo(x + Math.cos(a) * 27, y + Math.sin(a) * 27);
        ctx.stroke();
      }
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x, y - 55 * Math.sin(age * Math.PI));
      ctx.stroke();
    } else if (cue.effect === 'curse') {
      const radius = cue.radius * tile * (0.6 + age * 0.4);
      ctx.setLineDash([6, 4]);
      ring(x, y, radius);
      ctx.setLineDash([]);
      ctx.globalAlpha = fade * 0.1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 7);
      ctx.fill();
      ctx.globalAlpha = fade;
      for (let n = 0; n < 5; n++) {
        const angle = (n * Math.PI * 2) / 5 + age;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
        const next = angle + (Math.PI * 4) / 5;
        ctx.lineTo(x + Math.cos(next) * radius, y + Math.sin(next) * radius);
        ctx.stroke();
      }
    } else {
      ring(fx, fy, 5 + age * 18);
      const angle = Math.atan2(cue.target.y - cue.from.y, cue.target.x - cue.from.x);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.cos(angle) * 25 * fade, fy + Math.sin(angle) * 25 * fade);
      ctx.stroke();
    }
    ctx.restore();
    drawn.push(cue.skill);
  }
  return drawn;
}
