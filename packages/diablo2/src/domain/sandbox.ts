import type { Content, State, World } from './types';
import { bodyFits } from './maps';
import { stats } from './stats';
export const SANDBOX_RULES_VERSION = 'emberwake-2-sandbox-1';
export function equipTestCharacter(state: State, content: Content): void {
  state.rulesVersion = SANDBOX_RULES_VERSION;
  state.sandbox = { god: true, reveal: true };
  state.unlocked = content.acts.length - 1;
  const p = state.player,
    hero = content.heroes.find((h) => h.id === state.hero)!;
  p.level = 20;
  p.xp = 0;
  p.statPoints = 0;
  p.skillPoints = 0;
  p.attributes = {
    strength: hero.attack === 'melee' ? 100 : 45,
    dexterity: 55,
    vitality: 100,
    energy: hero.attack === 'ranged' ? 100 : 45,
  };
  p.skills = Object.fromEntries(hero.skills.map((id) => [id, 10]));
  p.gold = 100000;
  p.runes = 20;
  p.healthPotions = 8;
  p.manaPotions = 8;
  for (const slot of ['weapon', 'armor', 'charm'] as const) {
    const base = content.items.find((i) =>
      slot === 'weapon' ? i.id === hero.weapon : i.slot === slot,
    );
    if (!base) continue;
    p.equipment[slot] = {
      uid: state.nextUid++,
      base: base.id,
      name: `Trial ${base.name}`,
      slot,
      rarity: 'unique',
      damage: base.damage + (slot === 'weapon' ? 20 : 0),
      armor: base.armor + (slot === 'armor' ? 20 : 0),
      vitality: 10,
      energy: 10,
      resist: 10,
      leech: 0,
      width: base.width,
      height: base.height,
      cell: 0,
      value: 0,
      requiredStrength: 0,
      sockets: 2,
      runes: 0,
    };
  }
  refill(state, content);
}
export function refill(state: State, content: Content): void {
  const p = state.player,
    s = stats(state, content);
  p.hp = s.maxHp;
  p.mana = s.maxMana;
  p.stamina = 100;
  p.slow = 0;
  p.cooldowns = {};
  p.attackCooldown = 0;
  p.healthPotions = 8;
  p.manaPotions = 8;
}
export function landingFor(
  content: Content,
  regionId: string,
  landing: 'entrance' | 'ward' | 'boss',
  world: World,
) {
  const region = content.regions.find((r) => r.id === regionId);
  if (!region) return null;
  const target =
    landing === 'ward' ? region.ward : landing === 'boss' ? region.bossPosition : region.start;
  if (!target) return null;
  // Boss/ward pads are offset so jumping in does not overlap an actor or objective.
  const candidates =
    landing === 'entrance'
      ? [target]
      : [
          { x: target.x - 4, y: target.y },
          { x: target.x + 4, y: target.y },
          { x: target.x, y: target.y + 4 },
          { x: target.x, y: target.y - 4 },
        ];
  return (
    candidates.find(
      (at) =>
        bodyFits(world, at) &&
        !world.enemies.some((e) => e.hp > 0 && Math.hypot(e.x - at.x, e.y - at.y) < 1.5),
    ) ?? null
  );
}
