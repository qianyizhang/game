import type { PolicyFactory, Proposal } from '../../../shared/policy/types';
import { HEROES, MINION_BY_ID } from '../content/minions';
import { SPELL_BY_ID } from '../content/spells';
import { baselineOrder } from '../domain/bots';
import type { Unit } from '../domain/types';
import { matchesTribe } from '../domain/units';
import type { Observation, PolicyCommand } from './observation';

export const STRATEGIES = ['immediate', 'survival', 'growth'] as const;
export type Strategy = (typeof STRATEGIES)[number];

/** Public combat/scaling estimates only; these utilities are not outcome predictions. */
export function createPolicy(strategy: Strategy): (input: Observation) => Proposal<PolicyCommand> {
  let decisions = 0;
  return (input) => {
    const o = input.observation,
      p = o.self;
    if (!input.actions.length) throw new Error('No permitted Hearth recruitment action.');
    let work = 0;
    const healthWeight = strategy === 'survival' ? 1.35 : strategy === 'immediate' ? 0.65 : 0.85;
    const attackWeight = strategy === 'immediate' ? 1.3 : 1;
    const stats = (attack: number, health: number) => attack * attackWeight + health * healthWeight;
    const value = (unit: Unit) => {
      work++;
      const d = MINION_BY_ID[unit.definitionId];
      const friends = p.board.filter(
        (ally) => d.tribe !== 'neutral' && matchesTribe(ally, d.tribe),
      ).length;
      const growth =
        (d.endTurn ? 4 + (d.endTurn.type === 'self' ? 2 : friends * 2) : 0) +
        (d.summonBuff || d.deathGrowth || d.deathDamage || d.buyBuff ? friends * 3 : 0) +
        (d.extraDeathrattle
          ? p.board.filter((ally) => MINION_BY_ID[ally.definitionId].deathrattle).length * 4
          : 0);
      return (
        stats(unit.attack, unit.health) +
        (unit.keywords.includes('shield')
          ? (unit.attack + unit.health) * (strategy === 'survival' ? 0.8 : 0.55)
          : 0) +
        (unit.keywords.includes('poison') ? 14 : 0) +
        (unit.keywords.includes('windfury') ? unit.attack * 0.5 : 0) +
        (unit.keywords.includes('cleave') ? unit.attack * 0.8 : 0) +
        (unit.keywords.includes('reborn') ? 4 : 0) +
        (d.deathrattle ? 4 : 0) +
        growth * (strategy === 'growth' ? 1.7 : 0.5) +
        friends * (strategy === 'growth' ? 1.5 : 0.25)
      );
    };
    const units = [...p.board, ...p.hand, ...p.shop, ...p.discover];
    const values = new Map(units.map((unit) => [unit.id, value(unit)]));
    const worth = (unit: Unit) => values.get(unit.id)!;
    const best = (entries: Unit[]) => [...entries].sort((a, b) => worth(b) - worth(a))[0];
    const worst = [...p.board].sort((a, b) => worth(a) - worth(b))[0];
    const hand = best(p.hand);
    const replacement = hand && worst && worth(hand) > worth(worst) + 2;
    const triple = (unit: Unit) =>
      !unit.golden &&
      [...p.board, ...p.hand].filter((own) => !own.golden && own.definitionId === unit.definitionId)
        .length === 2;
    const combatPurchase = (unit: Unit) =>
      p.board.length + p.hand.length < 7 || (worst && worth(unit) > worth(worst) + 2);
    const reserve = strategy === 'survival' ? 28 : strategy === 'immediate' ? 20 : 12;
    const minimumBoard = Math.min(strategy === 'growth' ? 4 : 7, o.round + 1);
    const investment =
      p.upgradeCost === 0 ||
      (p.hp > reserve &&
        ((strategy === 'growth' &&
          o.round >= p.tier * 2 &&
          (p.board.length >= minimumBoard || o.round === 2)) ||
          (p.board.length >= minimumBoard &&
            p.gold - p.upgradeCost >= (strategy === 'survival' ? 3 : 0))));
    const ordered = baselineOrder(p.board).map((unit) => unit.id);
    const mismatch = p.board.findIndex((unit, index) => unit.id !== ordered[index]);
    const desiredMove = mismatch >= 0 ? ordered[mismatch] : undefined;
    const hero = HEROES.find((entry) => entry.id === p.hero)!;
    const reasonScore = (command: PolicyCommand): { score: number; reason: string } => {
      work++;
      switch (command.type) {
        case 'discover':
          return {
            score: 200 + worth(p.discover.find((unit) => unit.id === command.id)!),
            reason: 'public-discover-value',
          };
        case 'play': {
          const unit = p.hand.find((entry) => entry.id === command.id)!;
          const target = p.board.find((entry) => entry.id === command.target);
          return {
            score:
              150 +
              worth(unit) +
              (target ? worth(target) * 0.02 : 0) +
              (command.position === p.board.length ? 0.01 : 0),
            reason: 'deploy-owned-strength',
          };
        }
        case 'sell':
          return {
            score: replacement && command.id === worst?.id ? 130 : -1000,
            reason: 'replace-with-stronger-hand',
          };
        case 'buy': {
          const unit = p.shop.find((entry) => entry.id === command.id)!;
          return {
            score: triple(unit)
              ? 125 + worth(unit) * 0.1
              : combatPurchase(unit)
                ? 30 + worth(unit) * 0.3
                : -1000,
            reason: triple(unit) ? 'complete-public-triple' : 'buy-current-strength',
          };
        }
        case 'upgrade':
          return {
            score: investment ? (strategy === 'growth' ? 85 : 25) : -1000,
            reason: 'tier-investment-with-health-reserve',
          };
        case 'power': {
          const target = p.board.find((unit) => unit.id === command.target);
          const useful =
            hero.ability.type === 'recall'
              ? target && MINION_BY_ID[target.definitionId].battlecry
              : p.board.length > 0;
          return {
            score: useful ? 24 + (target ? worth(target) * 0.01 : 0) : -1000,
            reason: 'hero-combat-value',
          };
        }
        case 'buySpell':
        case 'castSpell': {
          const casting = command.type === 'castSpell';
          const spell = casting
            ? p.tavern?.hand.find((entry) => entry.id === command.id)
            : p.tavern?.offer;
          if (!spell) return { score: -1000, reason: 'unavailable-spell' };
          const definition = SPELL_BY_ID[spell.definitionId],
            effect = definition.effect;
          let utility = 0;
          if (effect.type === 'gold') utility = effect.amount * 5;
          if (effect.type === 'nextGold')
            utility =
              effect.amount *
              (strategy === 'growth' ? 5 : strategy === 'survival' && p.hp <= reserve ? 0.5 : 2.5);
          if (effect.type === 'discount')
            utility =
              !p.tavern?.discount &&
              p.shop.some(combatPurchase) &&
              p.gold >= (casting ? 1 : definition.cost + 1)
                ? effect.amount * 4
                : 0;
          if (effect.type === 'buff') {
            const target =
              command.type === 'castSpell'
                ? p.board.find((unit) => unit.id === command.target)
                : undefined;
            const count =
              effect.zone === 'board'
                ? p.board.length
                : effect.zone === 'shop'
                  ? p.gold >= (casting ? 3 : definition.cost + 3)
                    ? 1
                    : 0
                  : casting
                    ? Number(!!target)
                    : Number(p.board.length > 0);
            utility =
              stats(effect.attack, effect.health) * count + (target ? worth(target) * 0.01 : 0);
          }
          return {
            score:
              utility > 0
                ? (casting ? 110 : effect.type === 'gold' ? 95 : 8) +
                  utility -
                  (casting ? 0 : definition.cost * 3)
                : -1000,
            reason: casting ? 'cast-public-spell-effect' : 'invest-in-public-spell-effect',
          };
        }
        case 'refresh':
          return {
            score: p.gold >= 4 && o.turn.refreshes < (strategy === 'growth' ? 4 : 5) ? 3 : -1000,
            reason: 'search-affordable-strength',
          };
        case 'freeze':
          return {
            score:
              !p.frozen && p.shop.some(triple) && p.gold < (p.tavern?.discount ? 1 : 3) ? 5 : -1000,
            reason: 'retain-unaffordable-triple',
          };
        case 'move':
          return {
            score: command.id === desiredMove && command.direction === -1 ? 1 : -1000,
            reason: 'public-combat-order',
          };
        case 'endRecruit':
          return { score: 0, reason: 'finish-recruitment' };
      }
    };
    const ranked = input.actions
      .map(({ command }, index) => ({ command, index, ...reasonScore(command) }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    return {
      command: ranked[0].command,
      work,
      diagnostics: {
        strategy,
        decisions: ++decisions,
        reason: ranked[0].reason,
        model: 'Public minion/spell estimates; no seeded transitions or private rivals.',
        reserve,
        minimumBoard,
        alternatives: ranked
          .slice(0, 4)
          .map(({ command, score, reason }) => ({ command, score, reason })),
      },
    };
  };
}

const factory = (strategy: Strategy): PolicyFactory<Observation, PolicyCommand> => ({
  id: strategy,
  version: 'hearth-policy-1',
  create: () => createPolicy(strategy),
});
export const builtins = {
  immediate: factory('immediate'),
  survival: factory('survival'),
  growth: factory('growth'),
};
