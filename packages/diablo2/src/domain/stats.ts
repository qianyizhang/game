import type { Content, State } from './types';
export function stats(state: State, content: Content) {
  const p = state.player;
  const hero = content.heroes.find((h) => h.id === state.hero)!;
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
