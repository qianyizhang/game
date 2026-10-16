/** Public deterministic formulas only. These helpers never simulate hidden draws or intents. */
import { cardPlayError as ruleCardPlayError } from '../domain/combat';
import type { PublicCombat } from './observation';
export { combatCardCost, attackDamage } from '../domain/combat';

export function cardPlayError(combat: PublicCombat, id: string, target?: string) {
  return ruleCardPlayError(
    { ...combat, enemies: combat.enemies.filter((e) => e.targetable) },
    id,
    target,
  );
}
