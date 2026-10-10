import type { Content, Element, Enemy, Point, State, World } from './types';
import { distance, lineOfSight, reveal, slide, toward, bodyFits } from './maps';
import { note, random } from './random';
import { rollItem, carry } from './loot';
import { stats } from './stats';
import { currentRegion, currentWorld, wardsLit } from './world';
import { STEP_SCALE as dt } from './timing';

export function spawnEnemy(
  state: State,
  content: Content,
  world: World,
  kind: string,
  position: Point,
  boss = false,
  elite = false,
): Enemy {
  const def = content.monsters.find((m) => m.id === kind)!;
  const hp = Math.round(def.hp * (boss ? 1 : 1 + state.act * 0.35) * (elite ? 1.8 : 1));
  const enemy = {
    x: position.x,
    y: position.y,
    uid: state.nextUid++,
    kind,
    hp,
    maxHp: hp,
    boss,
    elite,
    cooldown: 10,
    slow: 0,
    cursed: 0,
    windup: 0,
    phase: 0,
  };
  world.enemies.push(enemy);
  return enemy;
}
export function hitEnemy(
  state: State,
  content: Content,
  enemy: Enemy,
  damage: number,
  element: Element,
): void {
  if (enemy.hp <= 0) return;
  const world = currentWorld(state);
  if (enemy.boss && !wardsLit(state, content)) return;
  const def = content.monsters.find((m) => m.id === enemy.kind)!;
  const resist = Math.max(-0.3, (def.resist[element] ?? 0) - (enemy.cursed > 0 ? 0.35 : 0));
  const dealt = Math.max(1, Math.round(damage * (1 - resist)));
  enemy.hp = Math.max(0, enemy.hp - dealt);
  if (element === 'cold') enemy.slow = Math.max(enemy.slow, 25);
  if (enemy.hp > 0) return;
  const p = state.player;
  p.xp += enemy.boss ? 100 + state.act * 40 : enemy.elite ? 30 : 14 + state.act * 5;
  world.drops.push({
    x: enemy.x,
    y: enemy.y,
    uid: state.nextUid++,
    kind: 'gold',
    amount: enemy.boss ? 90 : 5 + Math.floor(random(state) * 12),
  });
  if (enemy.boss || random(state) < 0.28)
    world.drops.push({
      x: enemy.x,
      y: enemy.y,
      uid: state.nextUid++,
      kind: 'item',
      amount: 1,
      item: rollItem(state, content, enemy.boss),
    });
  if (random(state) < 0.3)
    world.drops.push({
      x: enemy.x,
      y: enemy.y,
      uid: state.nextUid++,
      kind: random(state) < 0.65 ? 'health' : 'mana',
      amount: 1,
    });
  if (enemy.elite || enemy.boss)
    world.drops.push({ x: enemy.x, y: enemy.y, uid: state.nextUid++, kind: 'rune', amount: 1 });
  if (enemy.boss) {
    world.bossDefeated = true;
    state.unlocked = Math.max(state.unlocked, Math.min(content.acts.length - 1, state.act + 1));
    note(state, content.acts[state.act].conclusion);
  }
  while (p.xp >= stats(state, content).xpNext && p.level < 20) {
    p.xp -= stats(state, content).xpNext;
    p.level++;
    p.statPoints += 5;
    p.skillPoints++;
    const s = stats(state, content);
    p.hp = s.maxHp;
    p.mana = s.maxMana;
    note(state, `Level ${p.level}: +5 attribute points, +1 skill point. Life and mana restored.`);
  }
}
function hurt(state: State, content: Content, damage: number, element: Element): void {
  const p = state.player;
  const s = stats(state, content);
  const mitigation = element === 'physical' ? s.armor / (s.armor + 70) : s.resist / 100;
  p.hp = Math.max(0, p.hp - Math.max(1, Math.round(damage * (1 - mitigation))));
  if (element === 'cold') p.slow = 15;
  if (p.hp === 0) {
    const lost = Math.floor(p.gold * 0.25);
    p.gold -= lost;
    p.xp = Math.max(0, p.xp - Math.floor(s.xpNext * 0.1));
    if (p.corpse) p.corpse.gold += lost;
    else
      p.corpse = { act: state.act, region: state.region, position: { x: p.x, y: p.y }, gold: lost };
    state.status = 'dead';
    p.destination = null;
    p.target = null;
    p.direction = { x: 0, y: 0 };
    currentWorld(state).allies = [];
    note(
      state,
      `You fell. ${lost} gold remains at your grave; 10% of this level’s experience was lost. Return from the refuge to recover it.`,
    );
  }
}
export function projectile(
  state: State,
  world: World,
  from: Point,
  to: Point,
  damage: number,
  element: Element,
  friendly: boolean,
  pierce = false,
  radius = 0.2,
  slow = 0,
): void {
  const d = distance(from, to);
  if (d < 0.01) return;
  world.projectiles.push({
    x: from.x,
    y: from.y,
    uid: state.nextUid++,
    dx: ((to.x - from.x) / d) * 0.85,
    dy: ((to.y - from.y) / d) * 0.85,
    damage,
    element,
    friendly,
    pierce,
    radius,
    life: 14,
    hits: [],
    slow,
  });
}
export function basicAttack(state: State, content: Content, enemy: Enemy): void {
  const p = state.player;
  const s = stats(state, content);
  const ranged = content.heroes.find((h) => h.id === state.hero)!.attack === 'ranged';
  if (p.attackCooldown > 0) return;
  if (ranged) projectile(state, currentWorld(state), p, enemy, s.damage, 'physical', true);
  else {
    hitEnemy(state, content, enemy, s.damage, 'physical');
    p.hp = Math.min(s.maxHp, p.hp + (s.damage * s.leech) / 100);
  }
  p.attackCooldown = s.attackTicks;
}
function bossSpell(state: State, content: Content, enemy: Enemy): void {
  const world = currentWorld(state);
  const p = state.player;
  const def = content.monsters.find((m) => m.id === enemy.kind)!;
  enemy.windup = 12;
  enemy.cooldown = enemy.hp < enemy.maxHp * 0.5 ? 28 : 40;
  const hazard = (at: Point, radius: number, delay: number) =>
    world.hazards.push({
      ...at,
      uid: state.nextUid++,
      radius,
      delay,
      damage: def.damage * 1.6,
      element: def.element,
      life: delay + 3,
    });
  if (def.pattern === 'ranged') {
    for (const offset of [-1.4, 0, 1.4])
      projectile(state, world, enemy, { x: p.x + offset, y: p.y }, def.damage, def.element, false);
    hazard({ x: p.x, y: p.y }, 1.5, 12);
  } else if (def.pattern === 'summoner') {
    hazard({ x: p.x, y: p.y }, 2, 14);
    const phase = enemy.hp < enemy.maxHp * 0.5 ? 2 : 1;
    if (enemy.phase < phase) {
      enemy.phase = phase;
      for (const dx of [-1.5, 1.5])
        spawnEnemy(state, content, world, currentRegion(state, content).monsters[0], {
          x: enemy.x + dx,
          y: enemy.y,
        });
      note(state, `${def.name} calls the unburied.`);
    }
  } else {
    hazard({ x: p.x, y: p.y }, def.hazardRadius, 13);
    hazard({ x: enemy.x, y: enemy.y }, 3, 17);
    if (enemy.hp < enemy.maxHp * 0.5) hazard({ x: p.x + 2, y: p.y - 1 }, 1.8, 19);
  }
}
/** One authoritative 50 ms simulation tick. Rendering never calculates damage or movement. */
export function tick(state: State, content: Content): void {
  state.tick++;
  const p = state.player;
  const s = stats(state, content);
  p.attackCooldown = Math.max(0, p.attackCooldown - dt);
  p.slow = Math.max(0, p.slow - dt);
  for (const key of Object.keys(p.cooldowns)) p.cooldowns[key] = Math.max(0, p.cooldowns[key] - dt);
  if (state.location === 'town') {
    p.hp = s.maxHp;
    p.mana = s.maxMana;
    p.stamina = 100;
    return;
  }
  const world = currentWorld(state);
  p.mana = Math.min(s.maxMana, p.mana + (0.16 + p.attributes.energy * 0.008) * dt);
  if (p.target !== null) {
    const enemy = world.enemies.find((e) => e.uid === p.target && e.hp > 0);
    if (!enemy) p.target = null;
    else {
      const ranged = content.heroes.find((h) => h.id === state.hero)!.attack === 'ranged';
      const reach = ranged ? 6 : 1.65;
      if (distance(p, enemy) > reach || !lineOfSight(world, p, enemy))
        toward(world, p, enemy, 0.36 * dt);
      else basicAttack(state, content, enemy);
    }
  }
  const moving = Math.hypot(p.direction.x, p.direction.y) > 0 || p.destination !== null;
  const speed = (p.running && p.stamina > 0 ? 0.52 : 0.34) * (p.slow > 0 ? 0.55 : 1) * dt;
  if (moving) {
    if (p.running && p.stamina > 0) p.stamina = Math.max(0, p.stamina - 1.1 * dt);
    else p.stamina = Math.min(100, p.stamina + 0.35 * dt);
    if (p.direction.x || p.direction.y) {
      const d = Math.hypot(p.direction.x, p.direction.y);
      slide(world, p, (p.direction.x / d) * speed, (p.direction.y / d) * speed);
    } else if (p.destination) {
      while (p.path.length && distance(p, p.path[0]) < 0.15) p.path.shift();
      const target = p.path[0] ?? p.destination;
      toward(world, p, target, speed);
      if (distance(p, p.destination) < 0.15) {
        p.destination = null;
        p.path = [];
      }
    }
  } else p.stamina = Math.min(100, p.stamina + 0.65 * dt);
  reveal(world, p);
  for (const enemy of [...world.enemies]) {
    if (enemy.hp <= 0) continue;
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);
    enemy.slow = Math.max(0, enemy.slow - dt);
    enemy.cursed = Math.max(0, enemy.cursed - dt);
    enemy.windup = Math.max(0, enemy.windup - dt);
    if (enemy.boss && !wardsLit(state, content)) continue;
    const def = content.monsters.find((m) => m.id === enemy.kind)!;
    const ally = world.allies.find(
      (a) => a.hp > 0 && distance(a, enemy) < distance(p, enemy) && distance(a, enemy) < 4,
    );
    const target = ally ?? p;
    const d = distance(enemy, target);
    if (d > 9 || !lineOfSight(world, enemy, target)) continue;
    if (enemy.boss && d < 8 && enemy.cooldown === 0) {
      bossSpell(state, content, enemy);
      continue;
    }
    if (enemy.windup > 0) continue;
    if (d > def.range)
      toward(world, enemy, target, def.speed * 0.1 * dt * (enemy.slow > 0 ? 0.45 : 1));
    else if (enemy.cooldown === 0) {
      const damage = def.damage * (1 + state.act * 0.15) * (enemy.elite ? 1.35 : 1);
      if (def.pattern === 'ranged')
        projectile(state, world, enemy, target, damage, def.element, false);
      else if (ally) ally.hp -= damage;
      else hurt(state, content, damage, def.element);
      enemy.cooldown = enemy.elite ? 12 : 18;
    }
    if (state.status === 'dead') return;
  }
  for (const ally of world.allies) {
    ally.cooldown = Math.max(0, ally.cooldown - dt);
    const enemy = world.enemies
      .filter(
        (e) =>
          e.hp > 0 &&
          (!e.boss || wardsLit(state, content)) &&
          distance(ally, e) < 8 &&
          lineOfSight(world, ally, e),
      )
      .sort((a, b) => distance(ally, a) - distance(ally, b))[0];
    if (enemy) {
      if (distance(ally, enemy) > 1.3) toward(world, ally, enemy, 0.4 * dt);
      else if (!ally.cooldown) {
        hitEnemy(state, content, enemy, ally.damage, 'physical');
        ally.cooldown = 9;
      }
    } else if (distance(ally, p) > 2) toward(world, ally, p, 0.4 * dt);
  }
  world.allies = world.allies.filter((a) => a.hp > 0);
  for (const shot of world.projectiles) {
    const previous = { x: shot.x, y: shot.y };
    shot.x += shot.dx * dt;
    shot.y += shot.dy * dt;
    shot.life -= dt;
    if (!lineOfSight(world, previous, shot)) {
      shot.life = 0;
      continue;
    }
    const segmentDistance = (point: Point) => {
      const vx = shot.x - previous.x,
        vy = shot.y - previous.y;
      const t = Math.max(
        0,
        Math.min(
          1,
          ((point.x - previous.x) * vx + (point.y - previous.y) * vy) / (vx * vx + vy * vy),
        ),
      );
      return distance(point, { x: previous.x + vx * t, y: previous.y + vy * t });
    };
    if (shot.friendly) {
      for (const enemy of world.enemies)
        if (
          enemy.hp > 0 &&
          !shot.hits.includes(enemy.uid) &&
          segmentDistance(enemy) < 0.5 + shot.radius
        ) {
          shot.hits.push(enemy.uid);
          enemy.slow = Math.max(enemy.slow, shot.slow);
          hitEnemy(state, content, enemy, shot.damage, shot.element);
          if (!shot.pierce) {
            shot.life = 0;
            break;
          }
        }
    } else {
      const ally = world.allies.find((a) => a.hp > 0 && segmentDistance(a) < 0.4 + shot.radius);
      if (ally) {
        ally.hp -= shot.damage;
        shot.life = 0;
      } else if (segmentDistance(p) < 0.35 + shot.radius) {
        hurt(state, content, shot.damage, shot.element);
        shot.life = 0;
      }
    }
    if (state.status === 'dead') return;
  }
  world.projectiles = world.projectiles.filter((shot) => shot.life > 0);
  for (const h of world.hazards) {
    const due = h.delay > 0 && h.delay <= dt;
    h.delay -= dt;
    h.life -= dt;
    if (due && distance(p, h) < h.radius) hurt(state, content, h.damage, h.element);
    if (state.status === 'dead') return;
  }
  world.hazards = world.hazards.filter((h) => h.life > 0);
  for (const drop of world.drops)
    if (distance(p, drop) < 1.35) {
      if (drop.kind === 'gold') {
        p.gold += drop.amount;
        drop.amount = 0;
      } else if (drop.kind === 'rune') {
        p.runes += drop.amount;
        drop.amount = 0;
        note(state, 'Ember rune found. Socket it into equipped gear at the refuge.');
      } else if (drop.kind === 'health' && p.healthPotions < 8) {
        p.healthPotions++;
        drop.amount = 0;
      } else if (drop.kind === 'mana' && p.manaPotions < 8) {
        p.manaPotions++;
        drop.amount = 0;
      } else if (drop.item && carry(p.inventory, drop.item)) {
        note(state, `${drop.item.name} collected.`);
        drop.amount = 0;
      }
    }
  world.drops = world.drops.filter((drop) => drop.amount > 0);
  const map = currentRegion(state, content);
  if (map.waypoint && !world.waypoint && distance(p, map.waypoint) < 2) {
    world.waypoint = true;
    note(state, `${map.name} waypoint attuned. It remains available from the refuge.`);
  }
}
export function cast(
  state: State,
  content: Content,
  skillId: string,
  target: Point,
): string | null {
  const p = state.player;
  const world = currentWorld(state);
  const skill = content.skills.find((s) => s.id === skillId);
  const rank = p.skills[skillId] ?? 0;
  if (!skill || !rank) return 'Learn this skill first.';
  if (p.cooldowns[skillId] > 0) return 'That skill is still recovering.';
  if (p.mana < skill.mana) return 'Not enough mana.';
  if (skill.range > 0 && (distance(p, target) > skill.range || !lineOfSight(world, p, target)))
    return 'Target is out of range or behind a wall.';
  if (skill.effect === 'leap' && (!bodyFits(world, target) || !lineOfSight(world, p, target)))
    return 'Choose a clear landing.';
  if (skill.effect === 'summon') {
    const body = world.enemies.find((e) => e.hp === 0 && !e.boss && distance(p, e) < 5);
    if (!body) return 'A slain enemy body must be within five paces.';
    if (world.allies.length >= Math.min(5, rank + 1)) return 'Your army is at its current limit.';
    body.hp = -1;
    world.allies.push({
      x: body.x,
      y: body.y,
      uid: state.nextUid++,
      hp: 80 + p.level * 15,
      damage: 12 + p.level * 3 + rank * 4,
      cooldown: 0,
    });
  }
  p.mana -= skill.mana;
  p.cooldowns[skillId] = skill.cooldown;
  const damage = Math.round(
    skill.damage *
      (1 + (rank - 1) * 0.25) *
      (skill.scaling === 'strength' ? 1 + p.attributes.strength / 65 : stats(state, content).spell),
  );
  if (skill.effect === 'projectile')
    projectile(
      state,
      world,
      p,
      target,
      damage,
      skill.element,
      true,
      skill.pierce,
      skill.radius,
      skill.slow,
    );
  else {
    if (skill.effect === 'leap') {
      p.x = target.x;
      p.y = target.y;
      p.destination = null;
      p.path = [];
      p.target = null;
    }
    const center = skill.effect === 'curse' ? target : p;
    for (const enemy of world.enemies)
      if (
        enemy.hp > 0 &&
        distance(center, enemy) <= skill.radius &&
        lineOfSight(world, center, enemy)
      ) {
        if (skill.effect === 'curse') enemy.cursed = 60;
        hitEnemy(state, content, enemy, damage, skill.element);
        enemy.slow = Math.max(enemy.slow, skill.slow);
      }
  }
  return null;
}
