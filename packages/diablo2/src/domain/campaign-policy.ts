/** Verification policy: only accepted player commands, no injected state or test-only powers. */
import { newSession, dispatch, type Session } from '../application/session';
import { stats } from './game';
import { freeCell } from './loot';
import { distance, findPath, lineOfSight, walkable } from './maps';
import type { Command, Point } from './types';
export function playCampaign(
  hero: string,
  seed = 'campaign-baseline',
): { session: Session; deaths: number } {
  let session = newSession(seed, hero);
  let deaths = 0;
  const act = (command: Command) => {
    const result = dispatch(session, command);
    if (!result.error) session = result.session;
    return !result.error;
  };
  let stuck = 0;
  let lootTarget: number | null = null;
  let last = { x: 0, y: 0 };
  for (let turn = 0; turn < 16000 && session.state.status !== 'victory'; turn++) {
    const state = session.state,
      content = session.replay.content,
      p = state.player,
      world = state.worlds[state.act],
      map = content.maps[state.act],
      s = stats(state, content),
      h = content.heroes.find((h) => h.id === hero)!;
    if (state.status === 'dead') {
      deaths++;
      if (deaths > 12) throw new Error(`${hero}: too many deaths in act ${state.act + 1}`);
      act({ type: 'respawn' });
      continue;
    }
    if (state.location === 'town') {
      for (let n = 0; n < 8; n++) {
        if (session.state.player.healthPotions < 6) act({ type: 'buy', kind: 'health' });
        if (session.state.player.manaPotions < 5) act({ type: 'buy', kind: 'mana' });
      }
      act({ type: 'travel', act: state.act });
      continue;
    }
    for (let n = 0; n < p.statPoints; n++)
      act({
        type: 'attribute',
        attribute: n % 3 === 0 ? (hero === 'barbarian' ? 'strength' : 'energy') : 'vitality',
      });
    if (p.skillPoints) {
      const unlearned = h.skills.find(
        (id) => !p.skills[id] && content.skills.find((s) => s.id === id)!.level <= p.level,
      );
      act({ type: 'learn', skill: unlearned ?? h.skills[0] });
    }
    for (const item of p.inventory) {
      const old = p.equipment[item.slot];
      if (
        !old ||
        item.damage + item.armor * 2 + item.vitality + item.energy >
          old.damage + old.armor * 2 + old.vitality + old.energy
      )
        act({ type: 'equip', uid: item.uid });
    }
    if (p.hp < s.maxHp * 0.48 && p.healthPotions) act({ type: 'potion', kind: 'health' });
    if (p.mana < s.maxMana * 0.25 && p.manaPotions) act({ type: 'potion', kind: 'mana' });
    const visible = world.enemies
      .filter(
        (e) =>
          e.hp > 0 &&
          (!e.boss || world.seals.every(Boolean)) &&
          distance(p, e) < 7 &&
          lineOfSight(world, p, e),
      )
      .sort((a, b) => distance(p, a) - distance(p, b));
    const enemy = visible[0];
    const danger = world.hazards.find((h) => h.delay > 0 && distance(p, h) < h.radius + 0.65);
    if (danger) {
      const options: Point[] = [];
      for (let angle = 0; angle < 8; angle++) {
        const at = {
          x: p.x + Math.cos((angle * Math.PI) / 4) * 2,
          y: p.y + Math.sin((angle * Math.PI) / 4) * 2,
        };
        if (walkable(world, at) && lineOfSight(world, p, at)) options.push(at);
      }
      options.sort((a, b) => distance(b, danger) - distance(a, danger));
      if (options[0]) act({ type: 'move', target: options[0] });
    } else if (enemy) {
      for (const id of h.skills) {
        const skill = content.skills.find((s) => s.id === id)!;
        if (!(p.skills[id] ?? 0) || (p.cooldowns[id] ?? 0) > 0) continue;
        if (skill.effect === 'summon') {
          if (world.allies.length < Math.min(5, (p.skills[id] ?? 1) + 1))
            act({ type: 'cast', skill: id, target: p });
        } else if (
          skill.damage > 0 &&
          (skill.range > 0 ? distance(p, enemy) < skill.range : distance(p, enemy) < skill.radius)
        )
          act({ type: 'cast', skill: id, target: enemy });
      }
      if (p.target !== enemy.uid) act({ type: 'attack', target: enemy.uid });
    } else {
      const corpse = p.corpse?.act === state.act ? p.corpse.position : null;
      const collectible = world.drops
        .filter(
          (d) =>
            (d.uid === lootTarget || (distance(p, d) < 5 && lineOfSight(world, p, d))) &&
            (d.kind === 'health'
              ? p.healthPotions < 8
              : d.kind === 'mana'
                ? p.manaPotions < 8
                : d.item
                  ? freeCell(p.inventory, d.item) !== null
                  : true),
        )
        .sort((a, b) => distance(p, a) - distance(p, b));
      const loot = collectible.find((d) => d.uid === lootTarget) ?? collectible[0];
      lootTarget = loot?.uid ?? null;
      const wardIndex = world.seals.findIndex((lit) => !lit);
      const boss = world.enemies.find((e) => e.boss)!;
      const objective =
        corpse ??
        loot ??
        (wardIndex >= 0 ? map.seals[wardIndex] : !world.bossDefeated ? boss : map.exit);
      if (distance(p, objective) < (loot ? 1.2 : 1.5)) {
        if (loot) act({ type: 'advance', ticks: 1 });
        else act({ type: 'interact' });
      } else if (!p.destination || distance(p.destination, objective) > 0.2 || stuck > 20) {
        const path = findPath(world, p, objective);
        if (!path.length) throw new Error(`Unreachable objective ${map.id}`);
        act({ type: 'move', target: objective });
      }
    }
    if (session.state.status === 'playing' && session.state.location === 'field')
      act({ type: 'advance', ticks: 1 });
    if (distance(last, session.state.player) < 0.02) stuck++;
    else stuck = 0;
    last = { x: session.state.player.x, y: session.state.player.y };
    if (stuck > 200 && !enemy)
      throw new Error(`${hero} stuck in ${map.id} at ${p.x},${p.y}: ${session.state.log.at(-1)}`);
  }
  if (session.state.status !== 'victory')
    throw new Error(
      `${hero}: unfinished after ${session.state.tick} ticks in act ${session.state.act + 1}; position ${session.state.player.x},${session.state.player.y}; last commands ${JSON.stringify(session.replay.commands.slice(-6))}`,
    );
  return { session, deaths };
}
