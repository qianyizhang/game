import type { PolicyFactory, Proposal } from '../../../shared/policy/types';
import { CARD_BY_ID } from '../content/cards';
import { attackDamage } from '../domain/combat';
import type { Card, SpireCommand } from '../domain/types';
import { cardValue, incoming, publicCardCost } from './forecast';
import type { Observation, PolicyCommand } from './observation';

export const STRATEGIES = ['immediate', 'survival', 'growth'] as const;
export type Strategy = (typeof STRATEGIES)[number];

/** Static public-effect estimates; these are utility scores, never win probabilities. */
export function collectionValue(view: Observation, card: Card, strategy: Strategy): number {
  const def = CARD_BY_ID[card.definitionId],
    value = cardValue(view, card);
  if (def.kind === 'curse' || def.kind === 'status') return -30;
  const w =
    strategy === 'immediate'
      ? [1.3, 0.5, 0.7]
      : strategy === 'survival'
        ? [0.8, 1.2, 1]
        : [0.85, 0.8, 1.6];
  const duplicate = view.deck.filter((entry) => entry.definitionId === card.definitionId).length;
  const poison = view.deck.some((entry) =>
    CARD_BY_ID[entry.definitionId].effects.some(
      (effect) =>
        (effect.type === 'status' && effect.status === 'poison') ||
        (effect.type === 'power' && effect.power === 'noxiousFumes'),
    ),
  );
  const shivs = view.deck.some((entry) =>
    CARD_BY_ID[entry.definitionId].effects.some(
      (effect) => effect.type === 'generate' && effect.card === 'shiv',
    ),
  );
  const synergy =
    (card.definitionId === 'catalyst' ? (poison ? 15 : -12) : 0) +
    (card.definitionId === 'accuracy' ? (shivs ? 10 : -10) : 0) +
    (card.definitionId === 'limitBreak'
      ? view.deck.some((entry) =>
          ['inflame', 'demonForm', 'spotWeakness'].includes(entry.definitionId),
        )
        ? 10
        : -10
      : 0);
  return (
    value.damage * w[0] +
    value.defense * w[1] +
    value.growth * w[2] +
    value.draw * 4 +
    value.energy * 5 +
    value.health * 1.5 +
    synergy -
    Math.max(0, def.cost) * 2 -
    duplicate * (def.kind === 'power' ? 10 : 3) -
    (def.starter ? 4 : 0) +
    (card.upgraded ? 2 : 0)
  );
}
const instance = (definitionId: string): Card => ({
  id: 'public-offer',
  definitionId,
  upgraded: false,
});

function combatValue(view: Observation, command: SpireCommand, strategy: Strategy): number {
  const c = view.combat!;
  const danger = Math.max(
    0,
    incoming(view) -
      c.player.block -
      (view.relics.includes('orichalcum') && !c.player.block ? 6 : 0),
  );
  const defenseWeight =
    strategy === 'survival'
      ? view.hp < view.maxHp * 0.4
        ? 3.5
        : 2.1
      : strategy === 'growth'
        ? 1.25
        : 0.65;
  const growthWeight = strategy === 'growth' ? 1.7 : strategy === 'survival' ? 0.7 : 0.45;
  if (command.type === 'endTurn') return 0;
  if (command.type === 'playCard') {
    const card = c.cards[command.id],
      def = CARD_BY_ID[card.definitionId];
    const v = cardValue(view, card, command.target, true);
    if (v.health <= -view.hp) return -1000;
    const cost = publicCardCost(view, card);
    // Do not spend a turn drawing when every remaining public card is unplayable this turn.
    const canUseDraw =
      c.energy > Math.max(0, cost) ||
      Object.values(c.cards).some(
        (entry) =>
          !c.exhaust.includes(entry.id) &&
          !c.powersPlayed.includes(entry.id) &&
          publicCardCost(view, entry) === 0,
      );
    const defend = Math.min(danger, Math.max(0, v.defense));
    const lifeWeight = danger >= view.hp ? 5 : strategy === 'survival' ? 3 : 2;
    return (
      v.damage * (strategy === 'immediate' ? 1.35 : 1) +
      v.kills * 18 +
      defend * defenseWeight +
      Math.min(0, v.defense) * defenseWeight +
      v.growth * growthWeight +
      v.draw * (canUseDraw ? 4 : 0.2) +
      v.energy * (c.hand.length > 1 ? 4 : 0.1) +
      v.health * lifeWeight -
      Math.max(0, cost) * 1.1 +
      (def.kind === 'attack' && view.relics.includes('shuriken') ? 1.5 : 0)
    );
  }
  if (command.type === 'chooseCard') {
    const card = c.cards[command.id],
      action = c.choice!.action;
    const rank = collectionValue(view, card, strategy);
    if (action === 'exhaust' || action === 'discard') {
      const hook = CARD_BY_ID[card.definitionId].onDiscard;
      return -rank + (action === 'discard' && hook ? 15 : 0);
    }
    if (action === 'upgrade')
      return collectionValue(view, { ...card, upgraded: true }, strategy) - rank;
    return rank;
  }
  if (command.type === 'potion') {
    const potion = view.potions[command.index];
    const target = c.enemies.find((entry) => entry.id === command.target);
    const kill = target && target.hp + target.block <= 20;
    const reserve = strategy === 'immediate' ? 2 : 6;
    switch (potion) {
      case 'blood':
        return Math.min(view.maxHp - view.hp, Math.floor(view.maxHp * 0.2)) * 2 - reserve;
      case 'block':
        return Math.min(danger, 12) * defenseWeight - reserve;
      case 'weak':
        return target && !target.status.artifact && !target.status.weak
          ? Math.min(
              danger,
              target.intent.effects.reduce(
                (sum, effect) =>
                  sum +
                  (effect.type === 'damage'
                    ? (attackDamage(effect.amount, target, c.player) -
                        attackDamage(
                          effect.amount,
                          { status: { ...target.status, weak: 1 } },
                          c.player,
                        )) *
                      (effect.hits ?? 1)
                    : 0),
                0,
              ),
            ) *
              defenseWeight -
              reserve
          : -1;
      case 'fire':
        return target
          ? Math.min(target.hp, Math.max(0, 20 - target.block)) + (kill ? 18 : 0) - reserve
          : -1;
      case 'explosive':
        return (
          c.enemies
            .filter((e) => e.targetable)
            .reduce(
              (sum, e) =>
                sum + Math.min(e.hp, Math.max(0, 10 - e.block)) + (e.hp + e.block <= 10 ? 18 : 0),
              0,
            ) - reserve
        );
      case 'strength':
        return c.turn <= 2 ? 10 - reserve : 4 - reserve;
      case 'dexterity':
        return c.turn <= 2 && danger > 0 ? 10 - reserve : -1;
      case 'energy':
        return c.hand.some((id) => publicCardCost(view, c.cards[id]) > c.energy) && c.energy <= 1
          ? 12 - reserve
          : -1;
    }
  }
  return -1000;
}

function eventValue(
  view: Observation,
  choice: string,
  card: string | undefined,
  strategy: Strategy,
): number {
  const missing = view.maxHp - view.hp,
    healthy = view.hp / view.maxHp;
  const health = strategy === 'survival' ? 2 : 1;
  const remove = card
    ? -collectionValue(
        view,
        view.deck.find((entry) => entry.id === card)!,
        strategy,
      )
    : 0;
  if (choice === 'leave') return 0;
  switch (view.event) {
    case 'bigFish':
      return choice === 'banana'
        ? Math.min(missing, view.maxHp / 3) * health
        : choice === 'donut'
          ? 10
          : strategy === 'growth'
            ? 5
            : -5;
    case 'cleric':
      return choice === 'heal' ? Math.min(missing, view.maxHp / 4) * health - 8 : remove - 8;
    case 'shiningLight':
      return choice === 'enter'
        ? 18 * (strategy === 'growth' ? 1.5 : 1) -
            view.maxHp * 0.2 * health -
            (healthy < 0.6 ? 20 : 0)
        : 0;
    case 'goldenIdol':
      return choice === 'maxHp' ? 10 : choice === 'injury' ? -10 : -view.maxHp * 0.25;
    case 'goldenShrine':
      return choice === 'pray' ? 20 : 8;
    case 'ancientWriting':
      return choice === 'elegance'
        ? view.deck.filter(
            (entry) => ['strike', 'defend'].includes(entry.definitionId) && !entry.upgraded,
          ).length * 5
        : remove;
    case 'womanInBlue':
      return view.potions.length < 2 ? (choice === 'one' ? 7 : 8) : -1;
    case 'moaiHead':
      return choice === 'idol' ? 25 : missing * health - view.maxHp * 0.125 * 2;
    default:
      return -1;
  }
}

function value(view: Observation, command: SpireCommand, strategy: Strategy): number {
  if (view.phase === 'combat') return combatValue(view, command, strategy);
  switch (command.type) {
    case 'neow':
      return command.choice ===
        (strategy === 'immediate' ? 'lament' : strategy === 'growth' ? 'gold' : 'maxHp')
        ? 10
        : 0;
    case 'chooseNode': {
      const node = view.map.find((entry) => entry.id === command.id)!;
      const healthy = view.hp / view.maxHp;
      const priorities = {
        fight: 4,
        elite: healthy > 0.8 && view.deck.length >= 13 ? (strategy === 'growth' ? 9 : 5) : -8,
        rest: healthy < (strategy === 'survival' ? 0.85 : 0.6) ? 14 : strategy === 'growth' ? 8 : 4,
        shop: view.gold >= 150 ? 10 : 0,
        event: strategy === 'survival' ? 8 : 6,
        treasure: 15,
        boss: 15,
      };
      return priorities[node.kind];
    }
    case 'takeReward': {
      if (!command.card) return 0;
      return (
        collectionValue(
          view,
          { ...instance(command.card), upgraded: view.rewardUpgrades.includes(command.card) },
          strategy,
        ) - (view.deck.length < 16 ? 5 : 10 + (view.deck.length - 16) * 1.3)
      );
    }
    case 'bossRelic': {
      if (!command.id) return -10;
      const priorities =
        strategy === 'survival'
          ? ['blackBlood', 'cursedKey', 'fusionHammer', 'sozu', 'coffeeDripper', 'bustedCrown']
          : strategy === 'growth'
            ? ['cursedKey', 'sozu', 'coffeeDripper', 'blackBlood', 'fusionHammer', 'bustedCrown']
            : ['fusionHammer', 'cursedKey', 'sozu', 'coffeeDripper', 'blackBlood', 'bustedCrown'];
      return 20 - priorities.indexOf(command.id) * 2;
    }
    case 'rest': {
      if (command.choice === 'leave') return 0;
      if (command.choice === 'heal')
        return (
          Math.min(
            view.maxHp - view.hp,
            Math.floor(view.maxHp * 0.3) + (view.relics.includes('regalPillow') ? 15 : 0),
          ) * (strategy === 'survival' ? 1.5 : 1)
        );
      const card = view.deck.find((entry) => entry.id === command.card)!;
      return (
        5 +
        (collectionValue(view, { ...card, upgraded: true }, strategy) -
          collectionValue(view, card, strategy)) *
          (strategy === 'growth' ? 2 : 1)
      );
    }
    case 'buy': {
      const offer = view.shop.find((entry) => entry.id === command.id)!;
      const worth =
        offer.kind === 'card'
          ? collectionValue(view, instance(offer.definitionId), strategy) -
            (view.deck.length < 16 ? 4 : 10)
          : offer.kind === 'relic'
            ? [
                'vajra',
                'oddlySmoothStone',
                'anchor',
                'bagOfPreparation',
                'shuriken',
                'kunai',
                'orichalcum',
                'meatOnTheBone',
              ].includes(offer.definitionId)
              ? 24
              : 14
            : view.potions.length < 2
              ? 6
              : 0;
      return worth - offer.price * (strategy === 'growth' ? 0.07 : 0.1);
    }
    case 'removeCard':
      return (
        -collectionValue(
          view,
          view.deck.find((entry) => entry.id === command.id)!,
          strategy,
        ) +
        (strategy === 'growth' ? 7 : 3) -
        view.removalCost * 0.06
      );
    case 'event':
      return eventValue(view, command.choice, command.card, strategy);
    case 'takeTreasure':
      return command.skip ? 0 : view.relics.includes('cursedKey') ? -2 : 10;
    case 'leaveShop':
      return 0;
    case 'discardPotion':
      return -1000;
    default:
      return -1000;
  }
}

export function createPolicy(strategy: Strategy): (input: Observation) => Proposal<PolicyCommand> {
  let decisions = 0;
  return (input) => {
    if (!input.actions.length) throw new Error(`No permitted action in ${input.phase}.`);
    const ranked = input.actions
      .map((command, index) => ({ command, index, score: value(input, command, strategy) }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    return {
      command: ranked[0].command,
      work: ranked.length,
      diagnostics: {
        strategy,
        decisions: ++decisions,
        model: 'Public effect estimates; no seeded transition, unknown draws or future intents.',
        incoming: incoming(input),
        alternatives: ranked.slice(0, 4).map(({ command, score }) => ({ command, score })),
      },
    };
  };
}

const factory = (strategy: Strategy): PolicyFactory<Observation, PolicyCommand> => ({
  id: strategy,
  version: 'spire-policy-1',
  create: () => createPolicy(strategy),
});
export const builtins = {
  immediate: factory('immediate'),
  survival: factory('survival'),
  growth: factory('growth'),
};
