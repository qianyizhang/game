import { MINION_BY_ID } from '../content/minions';
import type { Tribe, Unit } from './types';
export const matchesTribe = (unit: Unit, tribe?: Tribe) =>
  !tribe ||
  MINION_BY_ID[unit.definitionId].tribe === tribe ||
  MINION_BY_ID[unit.definitionId].tribe === 'all';
export function makeUnit(definitionId: string, id: string, golden = false, copies?: number): Unit {
  const definition = MINION_BY_ID[definitionId];
  const multiplier = golden ? 2 : 1;
  return {
    id,
    definitionId,
    attack: definition.attack * multiplier,
    health: definition.health * multiplier,
    maxHealth: definition.health * multiplier,
    golden,
    keywords: [...(definition.keywords ?? [])],
    copies: copies ?? (definition.token ? 0 : golden ? 3 : 1),
    tripleReward: false,
  };
}
export function buff(unit: Unit, attack: number, health: number) {
  unit.attack = Math.max(0, unit.attack + attack);
  unit.health += health;
  unit.maxHealth += health;
}
/** Recruitment and combat both use summon hooks, on their own separate boards. */
export function summonHooks(board: Unit[], summoned: Unit) {
  for (const other of board) {
    if (other.id === summoned.id || other.health <= 0) continue;
    const definition = MINION_BY_ID[other.definitionId];
    const scale = other.golden ? 2 : 1;
    if (definition.summonBuff && matchesTribe(summoned, definition.summonBuff.tribe))
      buff(summoned, definition.summonBuff.attack * scale, definition.summonBuff.health * scale);
    if (
      definition.regainShield &&
      matchesTribe(summoned, definition.regainShield) &&
      !other.keywords.includes('shield')
    )
      other.keywords.push('shield');
  }
}
