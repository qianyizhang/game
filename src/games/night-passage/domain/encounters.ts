import type { Enemy, Hazard, Point, State } from './types';
import { DIFFICULTY } from './contracts';
import { ENEMIES } from './encounter-content';
import { angle, clearLine, distance, headingTo, translate } from './geometry';
import { cue, has, hurtPlayer, projectile, rawHit } from './effects';
import { attackPattern, attackShapes, projectileAngles, threatens } from './threats';

export function spawnEnemy(state: State, kind: Enemy['kind'], point: Point): void {
  const base = ENEMIES[kind].health;
  const maxHp = Math.round(
    base * (1 + state.region * 0.4) * (state.room.reward === 'trial' ? 1.3 : 1),
  );
  state.enemies.push({
    ...point,
    ...(state.difficulty !== 'standard' ? { difficulty: state.difficulty } : {}),
    id: state.nextId++,
    kind,
    maxHp,
    hp: maxHp,
    radius: ENEMIES[kind].radius,
    aim: 0,
    cooldown: 45,
    windup: 0,
    pattern: 0,
    target: { ...point },
    stagger: 0,
    burn: 0,
    chill: 0,
    exposed: 0,
    flash: 0,
  });
}

function enemyAttack(state: State, enemy: Enemy): void {
  const pattern = attackPattern(enemy, state.region);
  const damage =
    (ENEMIES[enemy.kind].damage + state.region * 3) * DIFFICULTY[state.difficulty].damage;
  const shapes = attackShapes(enemy, state.region);
  if (shapes.some((shape) => threatens(shape, state.player))) hurtPlayer(state, damage, enemy);
  for (const shape of shapes) {
    if (shape.kind === 'line')
      cue(
        state,
        shape.from,
        'slash',
        distance(shape.from, shape.to),
        '#ef776f',
        angle(shape.from, shape.to),
        0.06,
      );
    else cue(state, shape.center, 'burst', shape.radius, '#ef776f');
  }
  for (const aim of projectileAngles(enemy, state.region))
    projectile(state, enemy, aim, damage, 3.8 + state.region * 0.35, 170, true, null, 0, 'attack');
  if (pattern.kind === 'charge') {
    for (let i = 0; i < 30; i++)
      translate(
        state,
        enemy,
        (Math.cos(enemy.aim) * pattern.range) / 30,
        (Math.sin(enemy.aim) * pattern.range) / 30,
        enemy.radius,
      );
    cue(state, enemy, 'burst', 50, '#77cdd4');
  }
  if (
    enemy.kind === 'boss' &&
    enemy.hp < enemy.maxHp / 2 &&
    enemy.pattern % 4 === 3 &&
    state.enemies.filter((e) => e.hp > 0).length < 6
  )
    spawnEnemy(state, state.region === 2 ? 'witch' : 'hunter', {
      x: 180 + state.region * 90,
      y: 120,
    });
  enemy.pattern++;
  enemy.cooldown = Math.round(
    (enemy.hp < enemy.maxHp / 2 && enemy.kind === 'boss'
      ? Math.round(pattern.recovery * 0.72)
      : pattern.recovery) * DIFFICULTY[state.difficulty].recovery,
  );
}
export function enemyStep(state: State, enemy: Enemy): void {
  if (enemy.hp <= 0) return;
  enemy.flash = Math.max(0, enemy.flash - 1);
  if (enemy.burn > 0) {
    enemy.burn--;
    if (state.tick % 15 === 0)
      rawHit(state, enemy, 3 * (has(state, 'eclipse') && enemy.exposed > 0 ? 2 : 1));
  }
  enemy.chill = Math.max(0, enemy.chill - 1);
  enemy.exposed = Math.max(0, enemy.exposed - 1);
  if (enemy.hp <= 0) return;
  if (enemy.stagger > 0) {
    enemy.stagger--;
    return;
  }
  if (enemy.windup > 0) {
    if (--enemy.windup === 0) enemyAttack(state, enemy);
    return;
  }
  enemy.cooldown = Math.max(0, enemy.cooldown - 1);
  const p = state.player;
  const d = distance(enemy, p);
  const pattern = attackPattern(enemy, state.region);
  const ranged = enemy.kind === 'archer' || enemy.kind === 'witch';
  const covered = enemy.kind === 'archer' && !clearLine(state, enemy, p, 8);
  const targetRange = ranged
    ? 250
    : enemy.kind === 'boss'
      ? Math.min(260, pattern.range * 0.7)
      : 60;
  enemy.aim = angle(enemy, p);
  if (covered || d > targetRange || (ranged && d < 145)) {
    const sign = !covered && ranged && d < 145 ? -1 : 1;
    const tuning = DIFFICULTY[state.difficulty];
    const speed = ENEMIES[enemy.kind].speed * tuning.speed * (enemy.chill > 0 ? 0.55 : 1) * sign;
    const flank = enemy.kind === 'hunter' && d > 160 ? tuning.flank * (enemy.id % 2 ? 1 : -1) : 0;
    const target = {
      x: p.x + Math.cos(enemy.aim + Math.PI / 2) * flank,
      y: p.y + Math.sin(enemy.aim + Math.PI / 2) * flank,
    };
    const heading = sign > 0 ? headingTo(state, enemy, target, enemy.radius) : enemy.aim;
    translate(state, enemy, Math.cos(heading) * speed, Math.sin(heading) * speed, enemy.radius);
  }
  if (enemy.cooldown === 0 && d < pattern.range && !covered) {
    enemy.windup =
      enemy.kind === 'boss' && enemy.hp < enemy.maxHp / 2
        ? Math.round(pattern.windup * 0.8)
        : pattern.windup;
    enemy.target = { x: p.x, y: p.y };
  }
}
export function hazardPhase(tick: number, offset: number): number {
  return (tick + offset) % 300;
}
export function hazardTiming(hazard: Hazard): { warning: number; active: number } {
  return {
    warning: hazard.kind === 'void' ? 150 : 185,
    active: hazard.kind === 'flame' ? 260 : 240,
  };
}
export function stepHazards(state: State): void {
  const p = state.player;
  for (const h of state.room.hazards) {
    const phase = hazardPhase(state.tick, h.offset);
    const timing = hazardTiming(h);
    if (phase < timing.active || p.dashLeft > 0) continue;
    const d = distance(p, h);
    if (h.kind === 'void' && d < h.radius * 2 && d > 1) {
      const a = angle(p, h);
      translate(state, p, Math.cos(a) * 1.5, Math.sin(a) * 1.5, 14);
    }
    if (d >= h.radius + 14) continue;
    hurtPlayer(state, h.kind === 'flame' ? 17 : h.kind === 'tide' ? 7 : 10, h);
    if (h.kind === 'thorns') p.hindered = 45;
    if (h.kind === 'tide') {
      const a = angle(h, p);
      translate(state, p, Math.cos(a) * 5, Math.sin(a) * 5, 14);
    }
  }
}
