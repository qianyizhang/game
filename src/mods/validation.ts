import { finite } from '../shared/contentPack';
import type {
  CardDefinition,
  EnemyDefinition,
  RelicDefinition,
  Effect,
} from '../games/spire/domain/types';
import type { JokerDefinition } from '../games/balatro/domain/types';
import type { HeroDefinition, MinionDefinition } from '../games/battlegrounds/domain/types';

const named = (d: { name: string }) => {
  if (!d.name.trim()) throw new Error('name is required.');
};
const effects = (items: readonly Effect[]) => {
  if (!Array.isArray(items) || items.length > 30)
    throw new Error('effects must have at most 30 entries.');
  for (const effect of items) {
    if ('amount' in effect) finite(effect.amount, 'effect amount', -99, 999);
    if ('hits' in effect && effect.hits !== undefined) finite(effect.hits, 'hits', 1, 20);
    if ('count' in effect && effect.count !== undefined) finite(effect.count, 'count', 1, 10);
  }
};
export function validateCard(d: CardDefinition) {
  named(d);
  finite(d.cost, 'cost', -2, 10);
  if (!Number.isInteger(d.cost)) throw new Error('cost must be an integer.');
  if (d.upgradedCost !== undefined) {
    finite(d.upgradedCost, 'upgraded cost', -2, 10);
    if (!Number.isInteger(d.upgradedCost)) throw new Error('upgraded cost must be an integer.');
  }
  effects(d.effects);
  if (d.upgradedEffects) effects(d.upgradedEffects);
  if (!d.text || !d.upgradeText) throw new Error('card and upgrade text are required.');
}
export function validateEnemy(d: EnemyDefinition) {
  named(d);
  finite(d.hp, 'HP', 1, 9999);
  if (!d.intents.length) throw new Error('enemy needs at least one move.');
  for (const i of d.intents) effects(i.effects.filter((e): e is Effect => e.type !== 'special'));
}
export function validateRelic(d: RelicDefinition) {
  named(d);
  if (d.startBlock !== undefined) finite(d.startBlock, 'startBlock', 0, 99);
  if (d.startStrength !== undefined) finite(d.startStrength, 'startStrength', 0, 20);
}
export function validateJoker(d: JokerDefinition) {
  named(d);
  finite(d.price, 'price', 0, 99);
  if (!d.description) throw new Error('description is required.');
}
export function validateMinion(d: MinionDefinition) {
  named(d);
  finite(d.tier, 'tier', 1, 6);
  finite(d.attack, 'attack', 0, 999);
  finite(d.health, 'health', 1, 999);
  if (!Number.isInteger(d.tier)) throw new Error('tier must be an integer.');
}
export function validateHero(d: HeroDefinition) {
  named(d);
  finite(d.cost, 'cost', 0, 10);
  if (d.boardBuff) {
    finite(d.boardBuff.attack, 'attack buff', 0, 20);
    finite(d.boardBuff.health, 'health buff', 0, 20);
  }
}
