import { ARENA, BASE_CAST, GODS, SPELLS, weapon } from './content';
import { angle, angleDelta, clearLine, distance, translate } from './geometry';
import type { Action, Input, Move, State } from './types';
import { cue, hit, hurtPlayer, power, projectile } from './effects';
import { enemyStep, stepHazards } from './encounters';

function actionMove(state: State, action: Action, dashed: boolean): Move {
  if (action === 'cast' || action === 'call') {
    const god = power(state, action).god;
    return god ? SPELLS[god][action] : BASE_CAST;
  }
  return action === 'attack' && dashed
    ? weapon(state.player.weapon).dash
    : weapon(state.player.weapon)[action];
}
function strike(state: State, action: Action, aim: number, dashed: boolean): void {
  const p = state.player;
  const w = weapon(p.weapon);
  const slot = action;
  const divine = power(state, slot);
  const move = actionMove(state, action, dashed);
  let damage = move.damage;
  if (action === 'attack' && dashed && p.runes.includes('echo')) damage *= 1.3;
  if (action === 'attack') {
    p.combo = (p.combo + 1) % 3;
    if (p.combo === 0 && p.weapon === 'sword') damage *= 1.6;
  }
  const color = divine.god ? GODS.find((g) => g.id === divine.god)!.color : w.color;
  if (move.kind === 'shot' || move.kind === 'fan') {
    const count = move.shots ?? (move.kind === 'fan' ? 5 : 1);
    const speed = move.speed ?? 12;
    for (let i = 0; i < count; i++) {
      const offset = count === 1 ? 0 : (i / (count - 1) - 0.5) * move.arc;
      projectile(
        state,
        p,
        aim + offset,
        damage,
        speed,
        Math.ceil(move.reach / speed),
        false,
        divine.god,
        divine.level,
        slot,
        move.pierce ??
          (action === 'cast'
            ? 0
            : p.weapon === 'spear' || (p.weapon === 'bow' && action === 'attack')
              ? 3
              : 0),
        move.blast ?? 0,
        move.knockback,
      );
    }
  } else {
    const origin = { x: p.x, y: p.y };
    // Rush sweeps the complete travel segment, then resolves terrain for the landing.
    for (const enemy of state.enemies) {
      if (
        distance(origin, enemy) <= move.reach + enemy.radius &&
        Math.abs(angleDelta(angle(origin, enemy), aim)) <= move.arc / 2 &&
        clearLine(state, origin, enemy)
      )
        hit(state, enemy, damage, divine.god, divine.level, move.knockback, origin);
    }
    if (move.kind === 'rush') {
      for (let n = 0; n < 10; n++)
        translate(
          state,
          p,
          Math.cos(aim) * move.reach * 0.07,
          Math.sin(aim) * move.reach * 0.07,
          14,
        );
      p.invulnerable = Math.max(p.invulnerable, 10);
    }
    cue(state, origin, move.kind === 'nova' ? 'burst' : 'slash', move.reach, color, aim, move.arc);
  }
  if (action === 'call') p.invulnerable = Math.max(p.invulnerable, 70);
}
function beginAction(state: State, action: Action, aim: number): boolean {
  const p = state.player;
  if (p.strike || p.recovery > 0) return false;
  if (
    (action === 'cast' && p.casts === 0) ||
    (action === 'call' && (p.charge < 100 || !power(state, 'call').god))
  )
    return false;
  if (action === 'cast') p.casts--;
  if (action === 'call') p.charge = 0;
  const dashed = p.dashLeft > 0;
  const move = actionMove(state, action, dashed);
  p.strike = { action, aim, left: move.windup, recovery: move.recovery, dashed };
  return true;
}
function playerStep(state: State, input: Input): void {
  const p = state.player;
  p.aim = input.aim;
  p.hindered = Math.max(0, p.hindered - 1);
  p.invulnerable = Math.max(0, p.invulnerable - 1);
  p.dashCooldown = Math.max(0, p.dashCooldown - 1);
  p.recovery = Math.max(0, p.recovery - 1);
  if (p.casts < 3 && ++p.castClock >= (p.runes.includes('focus') ? 180 : 240)) {
    p.casts++;
    p.castClock = 0;
  }
  if (p.casts === 3) p.castClock = 0;
  if (input.dash && p.dashCooldown === 0) {
    p.dashLeft = 12;
    p.dashAim = input.x || input.y ? Math.atan2(input.y, input.x) : input.aim;
    p.dashCooldown = p.runes.includes('fleet') ? 36 : 48;
    p.invulnerable = Math.max(p.invulnerable, 14);
    p.strike = null;
    p.recovery = 0;
    const divine = power(state, 'dash');
    if (divine.god)
      for (const enemy of state.enemies)
        if (distance(p, enemy) < 95) hit(state, enemy, 18, divine.god, divine.level, 12, p);
    cue(state, p, 'dash', 28, '#a9e4d0', p.dashAim);
  }
  if (p.dashLeft > 0) {
    translate(state, p, Math.cos(p.dashAim) * 12, Math.sin(p.dashAim) * 12, 14);
    p.dashLeft--;
  } else {
    const magnitude = Math.max(1, Math.hypot(input.x, input.y));
    const speed = (p.strike ? 2.2 : 3.8) * (p.hindered > 0 ? 0.65 : 1);
    translate(state, p, (input.x / magnitude) * speed, (input.y / magnitude) * speed, 14);
  }
  const action = input.call
    ? 'call'
    : input.cast
      ? 'cast'
      : input.special
        ? 'special'
        : input.attack
          ? 'attack'
          : null;
  if (action) p.buffer = { action, aim: input.aim, expires: state.tick + 9 };
  if (p.buffer && p.buffer.expires < state.tick) p.buffer = null;
  if (p.buffer && beginAction(state, p.buffer.action, p.buffer.aim)) p.buffer = null;
  // Ranged windups track the live aim. Melee swings retain their committed direction.
  if (
    p.strike &&
    (p.weapon === 'bow' ||
      p.strike.action === 'cast' ||
      (p.weapon === 'spear' && p.strike.action === 'special'))
  )
    p.strike.aim = input.aim;
  if (p.strike && --p.strike.left <= 0) {
    const current = p.strike;
    strike(state, current.action, current.aim, current.dashed);
    p.recovery = current.recovery;
    p.strike = null;
  }
}
function projectileStep(state: State): void {
  for (const shot of state.projectiles) {
    if (shot.life <= 0) continue;
    shot.life--;
    // Substeps prevent small fast projectiles from tunnelling through actors or cover.
    for (let n = 0; n < 3 && shot.life > 0; n++) {
      shot.x += shot.vx / 3;
      shot.y += shot.vy / 3;
      if (
        shot.x < ARENA.margin ||
        shot.x > ARENA.width - ARENA.margin ||
        shot.y < ARENA.margin ||
        shot.y > ARENA.height - ARENA.margin ||
        state.room.pillars.some((p) => distance(p, shot) < p.radius + shot.radius)
      ) {
        shot.life = 0;
        break;
      }
      if (shot.hostile) {
        if (distance(shot, state.player) < 14 + shot.radius) {
          hurtPlayer(state, shot.damage, shot);
          shot.life = 0;
        }
      } else {
        for (const enemy of state.enemies)
          if (
            enemy.hp > 0 &&
            !shot.hit.includes(enemy.id) &&
            distance(shot, enemy) < enemy.radius + shot.radius
          ) {
            hit(state, enemy, shot.damage, shot.god, shot.power, shot.knockback, {
              x: shot.x - shot.vx,
              y: shot.y - shot.vy,
            });
            shot.hit.push(enemy.id);
            if (shot.blast > 0) {
              cue(state, shot, 'burst', shot.blast, '#ff9276');
              for (const nearby of state.enemies)
                if (
                  !shot.hit.includes(nearby.id) &&
                  distance(nearby, shot) < shot.blast + nearby.radius &&
                  clearLine(state, shot, nearby)
                ) {
                  hit(state, nearby, shot.damage * 0.6, shot.god, shot.power, 15, shot);
                  shot.hit.push(nearby.id);
                }
            }
            if (shot.pierce-- <= 0) {
              shot.life = 0;
              break;
            }
          }
      }
    }
  }
  state.projectiles = state.projectiles.filter((p) => p.life > 0);
}
export function stepCombat(state: State, input: Input): void {
  state.tick++;
  state.cues = state.cues.filter((c) => --c.life > 0);
  playerStep(state, input);
  for (const enemy of [...state.enemies]) enemyStep(state, enemy);
  projectileStep(state);
  stepHazards(state);
  state.enemies = state.enemies.filter((e) => e.hp > 0);
}
