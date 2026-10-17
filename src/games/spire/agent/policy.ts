import type { PolicyFactory, Proposal } from '../../../shared/policy/types';
import { CARD_BY_ID } from '../content/cards';
import { attackDamage } from '../domain/combat';
import type { Card, SpireCommand } from '../domain/types';
import { cardValue, incoming, turnLoss, blockBenefit, publicCardCost } from './forecast';
import type { Observation, PolicyCommand } from './observation';
import { planTurn } from './tactics';
import { collectionPlan } from './collection';

export const STRATEGIES = ['immediate', 'survival', 'growth'] as const;
export type Strategy = (typeof STRATEGIES)[number];

/** Static public-effect estimates; these are utility scores, never win probabilities. */
function collectionValue(view: Observation, card: Card, strategy: Strategy): number {
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
  // Collection value must include a way to finish long fights, not only prevent this turn's damage.
  const scaling = ['inflame', 'demonForm', 'noxiousFumes', 'footwork', 'afterImage'].includes(
    card.definitionId,
  )
    ? 18 / (1 + duplicate * 2)
    : 0;
  const efficient = [
    'shrugItOff',
    'battleTrance',
    'offering',
    'adrenaline',
    'backflip',
    'disarm',
    'legSweep',
    'shockwave',
    'reaper',
    'feed',
    'impervious',
  ].includes(card.definitionId)
    ? 7
    : 0;
  const situational = ['barricade', 'feelNoPain', 'darkEmbrace', 'rupture', 'corruption'].includes(
    card.definitionId,
  )
    ? 12
    : 0;
  return (
    value.damage * w[0] +
    value.defense * w[1] +
    value.growth * w[2] +
    value.draw * 4 +
    value.energy * 5 +
    value.health * 1.5 +
    synergy -
    situational +
    scaling +
    efficient -
    Math.max(0, def.cost) * 2 -
    duplicate * (def.kind === 'power' ? 14 : 6) -
    (def.starter ? 4 : 0) +
    (card.upgraded ? 2 : 0)
  );
}
/** A boss needs a damage plan even when the safest local route avoids fights. */
function readiness(view: Observation) {
  const attacks = view.deck.filter((card) => {
    const definition = CARD_BY_ID[card.definitionId];
    return definition.kind === 'attack' && !definition.starter;
  }).length;
  const scaling =
    view.deck.some((card) => ['inflame', 'demonForm'].includes(card.definitionId)) ||
    view.relics.includes('shuriken');
  return { attacks, scaling, needed: attacks < 3 || !scaling };
}

const instance = (definitionId: string): Card => ({
  id: 'public-offer',
  definitionId,
  upgraded: false,
});

function combatValue(view: Observation, command: SpireCommand, strategy: Strategy): number {
  const c = view.combat!;
  const danger = turnLoss(view),
    blockDanger = blockBenefit(view, 999);
  const defenseWeight =
    strategy === 'survival'
      ? view.hp < view.maxHp * 0.4
        ? 3.5
        : 2.1
      : strategy === 'growth'
        ? 1.65
        : 0.65;
  const growthWeight = strategy === 'growth' ? 1.3 : strategy === 'survival' ? 0.9 : 0.6;
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
    const defend = blockBenefit(view, Math.max(0, v.defense));
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
      Math.max(0, cost) * 0.5 +
      (cost === 0 && v.draw > 0 && c.energy > 0 && c.hand.length <= 8 && !c.noDraw ? 100 : 0) +
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
        return blockBenefit(view, 12) * defenseWeight - reserve;
      case 'weak':
        return target && !target.status.artifact && !target.status.weak
          ? Math.min(
              blockDanger,
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
        return c.turn <= 2 && blockDanger > 0 ? 10 - reserve : -1;
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
      const plan = readiness(view);
      const build =
        strategy === 'survival' && view.character === 'ironclad' && plan.needed && healthy > 0.5;
      const priorities = {
        fight: build ? 9 : 4,
        elite: build
          ? healthy > 0.85 && plan.attacks >= 2
            ? 10
            : -8
          : healthy > 0.8 && view.deck.length >= 13
            ? strategy === 'growth'
              ? 9
              : 5
            : -8,
        rest: healthy < (strategy === 'survival' ? 0.85 : 0.6) ? 14 : strategy === 'growth' ? 8 : 4,
        shop: view.gold >= 150 ? 10 : 0,
        event: build ? 5 : strategy === 'survival' ? 8 : 6,
        treasure: 15,
        boss: 15,
      };
      const future = (id: string, depth: number): number => {
        const n = view.map.find((entry) => entry.id === id)!;
        return (
          priorities[n.kind] +
          (depth && n.next.length
            ? 0.65 * Math.max(...n.next.map((next) => future(next, depth - 1)))
            : 0)
        );
      };
      return future(node.id, 3);
    }
    case 'takeReward': {
      if (!command.card) return 0;
      return (
        collectionValue(
          view,
          { ...instance(command.card), upgraded: view.rewardUpgrades.includes(command.card) },
          strategy,
        ) - (view.deck.length < 16 ? 5 : 10 + (view.deck.length - 16) * 2)
      );
    }
    case 'bossRelic': {
      if (!command.id) return -10;
      const priorities =
        strategy === 'survival'
          ? ['cursedKey', 'fusionHammer', 'sozu', 'blackBlood', 'coffeeDripper', 'bustedCrown']
          : strategy === 'growth'
            ? ['cursedKey', 'sozu', 'fusionHammer', 'blackBlood', 'coffeeDripper', 'bustedCrown']
            : ['cursedKey', 'fusionHammer', 'sozu', 'coffeeDripper', 'blackBlood', 'bustedCrown'];
      return 20 - priorities.indexOf(command.id) * 2;
    }
    case 'rest': {
      if (command.choice === 'leave') return 0;
      if (command.choice === 'heal')
        return (
          (view.hp <
          view.maxHp * (strategy === 'survival' ? 0.8 : strategy === 'growth' ? 0.65 : 0.5)
            ? 100
            : 0) +
          Math.min(
            view.maxHp - view.hp,
            Math.floor(view.maxHp * 0.3) + (view.relics.includes('regalPillow') ? 15 : 0),
          ) *
            (strategy === 'survival' ? 1.5 : 1)
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
        (strategy === 'growth' ? 7 : 3) +
        (CARD_BY_ID[view.deck.find((entry) => entry.id === command.id)!.definitionId].starter
          ? 20
          : 0) -
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
  return (input): Proposal<PolicyCommand> => {
    if (!input.actions.length) throw new Error(`No permitted action in ${input.phase}.`);
    const collection =
      strategy === 'survival' && input.character === 'ironclad' ? collectionPlan(input) : null;
    if (collection)
      return {
        command: collection.command,
        work: collection.work,
        diagnostics: { strategy, decisions: ++decisions, reason: collection.reason },
      };
    const ranked = input.actions
      .map((command, index) => ({ command, index, score: value(input, command, strategy) }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    const plan =
      input.combat && !input.combat.choice && strategy !== 'immediate'
        ? planTurn(input, strategy, (view, command) => combatValue(view, command, strategy))
        : null;
    return {
      command: plan?.command ?? ranked[0].command,
      work: ranked.length + (plan?.work ?? 0),
      diagnostics: {
        strategy,
        decisions: ++decisions,
        model: 'Public effect estimates; no seeded transition, unknown draws or future intents.',
        incoming: incoming(input),
        endTurnHpRisk: turnLoss(input),
        ...(plan
          ? {
              planner: {
                score: plan.score,
                candidates: plan.work,
                depth: 5,
                width: 12,
                scope: 'Approximate visible-hand sequences; uncertain effects stop the branch.',
              },
            }
          : {}),
        alternatives: ranked.slice(0, 4).map(({ command, score }) => ({ command, score })),
      },
    };
  };
}

const factory = (strategy: Strategy): PolicyFactory<Observation, PolicyCommand> => ({
  id: strategy,
  version: 'spire-policy-4',
  create: () => createPolicy(strategy),
});
export const builtins = {
  immediate: factory('immediate'),
  survival: factory('survival'),
  growth: factory('growth'),
};
