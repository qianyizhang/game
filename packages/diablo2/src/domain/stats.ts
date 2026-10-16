import type { Content, State, Player, HeroDef, SkillDef } from './types';
export function stats(state: State, content: Content) {
  return playerStats(
    state.player,
    content.heroes.find((h) => h.id === state.hero)!,
  );
}
/** Derived player values require no world, seed or full content handle. */
export function playerStats(p: Player, hero: HeroDef) {
  const gear = Object.values(p.equipment);
  const vitality = p.attributes.vitality + gear.reduce((n, i) => n + i.vitality, 0);
  const energy = p.attributes.energy + gear.reduce((n, i) => n + i.energy, 0);
  return {
    maxHp: hero.hp + (vitality - hero.attributes.vitality) * 5 + (p.level - 1) * 12,
    maxMana: hero.mana + (energy - hero.attributes.energy) * 3 + (p.level - 1) * 6,
    damage: Math.round((p.equipment.weapon?.damage ?? 5) * (1 + p.attributes.strength / 65)),
    spell: 1 + energy / 65,
    armor: gear.reduce((n, i) => n + i.armor, 0) + Math.floor(p.attributes.dexterity / 8),
    resist: Math.min(
      65,
      gear.reduce((n, i) => n + i.resist, 0),
    ),
    leech: gear.reduce((n, i) => n + i.leech, 0),
    attackTicks: Math.max(4, 9 - Math.floor(p.attributes.dexterity / 20)),
    xpNext: 55 * p.level + 20 * p.level * p.level,
  };
}

/** Pure cast scaling, rounded once before resolving any target or level-up. */
export function skillDamage(
  skill: Pick<SkillDef, 'damage' | 'scaling'>,
  rank: number,
  strength: number,
  spell: number,
): number {
  return Math.round(
    skill.damage *
      (1 + (rank - 1) * 0.25) *
      (skill.scaling === 'strength' ? 1 + strength / 65 : spell),
  );
}
/** Native enemy resistance/curse order and minimum damage, with no world access. */
export function damageAfterResistance(
  damage: number,
  resistance: number | undefined,
  cursed: boolean,
): number {
  const resist = Math.max(-0.3, (resistance ?? 0) - (cursed ? 0.35 : 0));
  return Math.max(1, Math.round(damage * (1 - resist)));
}
