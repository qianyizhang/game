import { boon, GODS } from './content';
import { angle, angleDelta, distance, translate } from './geometry';
import type { Cue, Enemy, GodId, Point, Slot, State } from './types';

export function cue(
  state: State,
  point: Point,
  kind: Cue['kind'],
  radius: number,
  color: string,
  aim = 0,
  arc = Math.PI * 2,
): void {
  state.cues.push({ ...point, kind, radius, color, aim, arc, life: 16, total: 16 });
  if (state.cues.length > 100) state.cues.shift();
}
export function power(state: State, slot: Slot): { god: GodId | null; level: number } {
  const entry = state.player.boons.find((b) => boon(b.id).slot === slot);
  return { god: entry ? boon(entry.id).god : null, level: entry?.level ?? 0 };
}
export const has = (state: State, id: string): boolean =>
  state.player.boons.some((b) => b.id === id);
export function rawHit(state: State, enemy: Enemy, damage: number): void {
  if (enemy.hp <= 0) return;
  const dealt = Math.min(enemy.hp, damage);
  enemy.hp = Math.max(0, enemy.hp - damage);
  enemy.flash = 8;
  state.player.charge = Math.min(100, state.player.charge + dealt * 0.075);
  if (enemy.hp === 0) {
    state.kills++;
    state.gold += enemy.kind === 'boss' ? 40 : 5;
    cue(state, enemy, 'burst', enemy.radius * 2.2, '#f6dda4');
  }
}
export function hit(
  state: State,
  enemy: Enemy,
  damage: number,
  god: GodId | null,
  level: number,
  push: number,
  origin: Point,
): void {
  if (enemy.hp <= 0) return;
  const p = state.player;
  const fury = p.runes.includes('fury') && p.hp < p.maxHp / 2 ? 1.35 : 1;
  rawHit(state, enemy, damage * fury * (enemy.exposed > 0 ? 1.2 : 1) * (1 + level * 0.15));
  enemy.stagger = enemy.kind === 'boss' ? 0 : Math.max(enemy.stagger, 9);
  const direction = angle(origin, enemy);
  const amount = (push + (god === 'tide' ? 38 + level * 8 : 0)) * (enemy.kind === 'boss' ? 0.2 : 1);
  const wall = translate(
    state,
    enemy,
    Math.cos(direction) * amount,
    Math.sin(direction) * amount,
    enemy.radius,
  );
  if (god === 'tide' && wall) rawHit(state, enemy, 12 + level * 6);
  if (god === 'cinder') enemy.burn = Math.max(enemy.burn, 150 + level * 30);
  if (god === 'winter') {
    if (enemy.chill > 0) rawHit(state, enemy, 5 + level * 2);
    enemy.chill = 120;
  }
  if (god === 'veil') enemy.exposed = 180;
  if (god === 'storm') {
    const chain = state.enemies
      .filter((e) => e.id !== enemy.id && e.hp > 0 && distance(enemy, e) < 190)
      .sort((a, b) => distance(enemy, a) - distance(enemy, b))
      .slice(0, has(state, 'conductor') ? 2 : 1);
    for (const target of chain) {
      rawHit(
        state,
        target,
        (9 + level * 4) * (has(state, 'conductor') && target.chill > 0 ? 2 : 1),
      );
      cue(state, target, 'hit', 24, '#f4dc77');
    }
  }
  if (god === 'tide' && enemy.burn > 0 && has(state, 'steam')) rawHit(state, enemy, 24);
  cue(state, enemy, 'hit', 14, god ? GODS.find((g) => g.id === god)!.color : '#fff1cf');
}
export function hurtPlayer(state: State, damage: number, origin: Point): void {
  const p = state.player;
  if (p.invulnerable > 0 || p.hp <= 0) return;
  // Shield special guards the facing half-plane during its announced windup.
  if (
    p.weapon === 'shield' &&
    p.strike?.action === 'special' &&
    Math.abs(angleDelta(angle(p, origin), p.strike.aim)) < Math.PI / 2
  ) {
    cue(state, p, 'hit', 30, '#e4c7ff');
    return;
  }
  p.hp = Math.max(0, p.hp - damage);
  p.invulnerable = 36;
  p.charge = Math.min(100, p.charge + damage * 0.5);
  cue(state, p, 'hit', 30, '#ff6b80');
}
export function projectile(
  state: State,
  point: Point,
  aim: number,
  damage: number,
  speed: number,
  life: number,
  hostile: boolean,
  god: GodId | null,
  level: number,
  source: Slot,
  pierce = 0,
  blast = 0,
  knockback = 14,
): void {
  state.projectiles.push({
    id: state.nextId++,
    x: point.x,
    y: point.y,
    vx: Math.cos(aim) * speed,
    vy: Math.sin(aim) * speed,
    damage,
    radius: hostile ? 8 : 6,
    life,
    hostile,
    god,
    power: level,
    source,
    pierce,
    hit: [],
    blast,
    knockback,
  });
}
