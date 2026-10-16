import { CARD_BY_ID, cardCost } from '../content/cards';
import { attackDamage } from '../domain/combat';
import type { Card, Effect } from '../domain/types';
import type { Observation } from './observation';

export interface Value {
  damage: number;
  defense: number;
  growth: number;
  draw: number;
  energy: number;
  health: number;
  kills: number;
}
const empty = (): Value => ({
  damage: 0,
  defense: 0,
  growth: 0,
  draw: 0,
  energy: 0,
  health: 0,
  kills: 0,
});

/** Public intent damage only. Special effects and future turns are not simulated. */
export function incoming(view: Observation): number {
  const c = view.combat;
  if (!c) return 0;
  return c.enemies
    .filter((e) => e.targetable)
    .reduce(
      (sum, e) =>
        sum +
        e.intent.effects.reduce(
          (total, effect) =>
            total +
            (effect.type === 'damage'
              ? attackDamage(effect.amount, e, c.player) * (effect.hits ?? 1)
              : 0),
          0,
        ),
      0,
    );
}

/** Effect estimates are deliberately approximate; no seeded transitions or ordered draw access. */
export function cardValue(view: Observation, card: Card, target?: string, inCombat = false): Value {
  const definition = CARD_BY_ID[card.definitionId];
  const effects = card.upgraded
    ? (definition.upgradedEffects ?? definition.effects)
    : definition.effects;
  const value = empty(),
    c = inCombat ? view.combat : null;
  const enemies = c?.enemies.filter((e) => e.targetable) ?? [];
  const selected = enemies.find((e) => e.id === target) ?? enemies[0];
  const damageByEnemy = new Map<string, number>();
  for (const effect of effects) {
    switch (effect.type) {
      case 'damage': {
        const hits = effect.xHits
          ? (c?.energy ?? 3)
          : (effect.hits ?? (effect.poisonedTwice && selected?.status.poison ? 2 : 1));
        const strikes = (c ? Object.values(c.cards) : view.deck).filter((entry) =>
          CARD_BY_ID[entry.definitionId].name.includes('Strike'),
        ).length;
        const base =
          (effect.fromBlock ? (c?.player.block ?? 10) : effect.amount) +
          (effect.strikeScale ?? 0) * strikes +
          (c?.attackBonus ?? 0) +
          (card.definitionId === 'shiv' ? (c?.powers.accuracy ?? 0) : 0);
        const targets = effect.all || effect.random ? enemies : selected ? [selected] : [];
        if (!c) {
          const damage = base * hits * (effect.all ? 1.5 : 1);
          value.damage += damage;
          if (effect.heal) value.health += damage;
        }
        for (const enemy of targets) {
          let damage = attackDamage(
            base,
            c!.player,
            enemy,
            effect.strengthScale ?? 1,
            c!.attackMultiplier * (enemy.powers.slow ? 1 + c!.cardsPlayed * 0.1 : 1),
          );
          if (enemy.powers.intangible) damage = Math.min(damage, 1);
          const total = (damage * hits) / (effect.random ? enemies.length : 1);
          damageByEnemy.set(enemy.id, (damageByEnemy.get(enemy.id) ?? 0) + total);
          value.health -= (enemy.powers.thorns * hits) / (effect.random ? enemies.length : 1) || 0;
          if (effect.heal) value.health += Math.min(enemy.hp, Math.max(0, total - enemy.block));
          if (effect.fatalMaxHp && total >= enemy.hp + enemy.block)
            value.growth += effect.fatalMaxHp * 3;
        }
        break;
      }
      case 'block':
        value.defense += c
          ? Math.max(
              0,
              Math.floor(
                (effect.amount + c.player.status.dexterity) *
                  (c.player.status.frail > 0 ? 0.75 : 1),
              ),
            )
          : effect.amount;
        break;
      case 'heal':
        value.health += c ? Math.min(effect.amount, view.maxHp - view.hp) : effect.amount;
        break;
      case 'loseHp':
        value.health -= effect.amount;
        break;
      case 'draw':
        value.draw += c?.noDraw ? 0 : effect.amount;
        break;
      case 'energy':
        value.energy += effect.amount;
        break;
      case 'power':
        value.growth += effect.amount * powerValue(effect.power);
        break;
      case 'status': {
        if (effect.target === 'self') {
          if (effect.status === 'strength' || effect.status === 'dexterity')
            value.growth += effect.amount * 5;
        } else {
          const targets = effect.target === 'all' ? enemies : selected ? [selected] : [];
          const count = c
            ? targets.filter((e) => !e.status.artifact).length
            : effect.target === 'all'
              ? 1.5
              : 1;
          if (effect.status === 'poison') value.damage += Math.max(0, effect.amount) * count * 2.5;
          if (effect.status === 'vulnerable')
            value.damage += Math.max(0, effect.amount) * count * 2;
          if (effect.status === 'weak')
            value.defense += c
              ? targets.reduce(
                  (n, e) =>
                    n +
                    (!e.status.artifact && !e.status.weak
                      ? e.intent.effects.reduce(
                          (s, f) =>
                            s +
                            (f.type === 'damage'
                              ? (attackDamage(f.amount, e, c.player) -
                                  attackDamage(
                                    f.amount,
                                    { ...e, status: { ...e.status, weak: 1 } },
                                    c.player,
                                  )) *
                                (f.hits ?? 1)
                              : 0),
                          0,
                        )
                      : 0),
                  0,
                )
              : effect.amount * 3;
          if (effect.status === 'strength' && effect.amount < 0)
            value.defense -= effect.amount * count * 3;
        }
        break;
      }
      case 'generate': {
        const generated = CARD_BY_ID[effect.card];
        if (generated?.kind === 'attack')
          value.damage += effect.amount * (effect.zone === 'hand' ? 4.5 : 2);
        else if (generated?.kind === 'status' || generated?.kind === 'curse')
          value.growth -= effect.amount * 2;
        else value.draw += effect.amount;
        break;
      }
      case 'multiplyPoison':
        value.damage += c ? (selected?.status.poison ?? 0) * (effect.amount - 1) * 2.5 : 5;
        break;
      case 'randomPoison':
        value.damage += effect.amount * effect.hits * 2;
        break;
      case 'nextTurn':
        value.growth += effect.amount * (effect.stat === 'block' ? 0.7 : 3);
        break;
      case 'temporary':
        if (effect.stat === 'strength') value.damage += effect.amount * 2;
        else value.defense += effect.amount * (effect.stat === 'flameBarrier' ? 1 : 2);
        break;
      case 'doubleStrength':
        value.growth += Math.max(0, c?.player.status.strength ?? 3) * 5;
        break;
      case 'doubleBlock':
        value.defense += c?.player.block ?? 10;
        break;
      case 'blur':
        value.growth += effect.amount * 3;
        break;
      case 'choose':
        value.draw += effect.action === 'exhaust' || effect.action === 'discard' ? 0.5 : 1.5;
        break;
      case 'discardHand':
        value.draw += effect.draw ? (c?.hand.length ?? 4) * 0.5 : 0;
        value.growth -= effect.draw ? 0 : 2;
        break;
      case 'exhaustHand': {
        const count = c
          ? c.hand.filter(
              (id) =>
                id !== card.id &&
                (!effect.nonAttacks || CARD_BY_ID[c.cards[id].definitionId].kind !== 'attack'),
            ).length
          : 3;
        value.defense += count * (effect.blockEach ?? 0);
        value.damage += count * (effect.damageEach ?? 0);
        value.growth += count * ((c?.powers.feelNoPain ?? 0) + (c?.powers.darkEmbrace ?? 0) * 3);
        break;
      }
      case 'noDraw':
        value.draw -= c && c.energy > 0 ? 0.5 : 0;
        break;
    }
  }
  for (const [id, damage] of damageByEnemy) {
    const enemy = enemies.find((entry) => entry.id === id)!;
    value.damage +=
      Math.min(enemy.hp, Math.max(0, damage - enemy.block)) + Math.min(enemy.block, damage) * 0.25;
    if (damage >= enemy.hp + enemy.block) {
      value.kills++;
      value.defense += enemy.intent.effects.reduce(
        (n, effect) =>
          n +
          (effect.type === 'damage'
            ? attackDamage(effect.amount, enemy, c!.player) * (effect.hits ?? 1)
            : 0),
        0,
      );
    }
  }
  if (c) {
    value.health = Math.min(value.health, view.maxHp - view.hp);
    value.draw = Math.min(value.draw, 10 - c.hand.length + 1, c.draw.length + c.discard.length);
    if (definition.kind === 'skill')
      value.defense -= enemies.reduce((sum, e) => sum + (e.powers.enrage ?? 0), 0);
    value.defense += c.powers.afterImage;
    value.damage += c.powers.thousandCuts * enemies.length;
  }
  return value;
}

export function powerValue(power: Extract<Effect, { type: 'power' }>['power']): number {
  return {
    demonForm: 12,
    noxiousFumes: 8,
    afterImage: 8,
    metallicize: 4,
    infiniteBlades: 7,
    accuracy: 4,
    envenom: 8,
    thousandCuts: 6,
    feelNoPain: 3,
    darkEmbrace: 4,
    corruption: 8,
    barricade: 9,
    rupture: 3,
    fireBreathing: 3,
    combust: 2,
    combustHp: -3,
  }[power];
}

export function publicCardCost(view: Observation, card: Card): number {
  return view.combat?.powers.corruption && CARD_BY_ID[card.definitionId].kind === 'skill'
    ? 0
    : cardCost(card.definitionId, card.upgraded);
}
