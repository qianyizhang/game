import { CARD_BY_ID } from '../content/cards';
import { POTIONS } from '../content/world';
import { cardPlayError } from '../domain/combat';
import type { PolicyCommand, PublicState } from './observation';

/** Enumerate public preconditions only. Never probe the seeded transition for legality. */
export function legalActions(s: PublicState): PolicyCommand[] {
  if (s.phase === 'won' || s.phase === 'lost') return [];
  const c = s.combat;
  if (s.phase === 'combat' && c?.choice)
    return c.choice.options.map((id) => ({ type: 'chooseCard', id }));
  const actions: PolicyCommand[] = s.potions.map((_, index) => ({ type: 'discardPotion', index }));
  switch (s.phase) {
    case 'neow':
      for (const choice of ['maxHp', 'lament', 'gold', 'bossSwap'] as const)
        actions.push({ type: 'neow', choice });
      break;
    case 'map': {
      const next = s.currentNode ? s.map.find((n) => n.id === s.currentNode)?.next : null;
      for (const n of s.map)
        if (next ? next.includes(n.id) : n.row === 0)
          actions.push({ type: 'chooseNode', id: n.id });
      break;
    }
    case 'combat': {
      if (!c) break;
      const playable = { ...c, enemies: c.enemies.filter((enemy) => enemy.targetable) };
      for (const id of c.hand) {
        const targets = CARD_BY_ID[c.cards[id].definitionId].target
          ? c.enemies.filter((e) => e.targetable).map((e) => e.id)
          : [undefined];
        for (const target of targets)
          if (!cardPlayError(playable, id, target))
            actions.push({ type: 'playCard', id, ...(target ? { target } : {}) });
      }
      for (const [index, potion] of s.potions.entries()) {
        const targets = POTIONS[potion].target
          ? c.enemies.filter((e) => e.targetable).map((e) => e.id)
          : [undefined];
        for (const target of targets)
          actions.push({ type: 'potion', index, ...(target ? { target } : {}) });
      }
      actions.push({ type: 'endTurn' });
      break;
    }
    case 'reward':
      for (const card of [...s.reward, null]) actions.push({ type: 'takeReward', card });
      break;
    case 'bossRelic':
      for (const id of [...s.bossRelics, null]) actions.push({ type: 'bossRelic', id });
      break;
    case 'rest':
      if (!s.relics.includes('coffeeDripper')) actions.push({ type: 'rest', choice: 'heal' });
      if (!s.relics.includes('fusionHammer'))
        for (const card of s.deck)
          if (!card.upgraded && !CARD_BY_ID[card.definitionId].token)
            actions.push({ type: 'rest', choice: 'upgrade', card: card.id });
      actions.push({ type: 'rest', choice: 'leave' });
      break;
    case 'shop':
      for (const offer of s.shop)
        if (
          s.gold >= offer.price &&
          (offer.kind !== 'potion' || (s.potions.length < 3 && !s.relics.includes('sozu')))
        )
          actions.push({ type: 'buy', id: offer.id });
      if (!s.removalUsed && s.gold >= s.removalCost)
        for (const card of s.deck) actions.push({ type: 'removeCard', id: card.id });
      actions.push({ type: 'leaveShop' });
      break;
    case 'event': {
      const choices: Record<string, string[]> = {
        bigFish: ['banana', 'donut', 'box'],
        cleric: ['heal', 'purify'],
        shiningLight: ['enter'],
        goldenIdol: ['injury', 'damage', 'maxHp'],
        goldenShrine: ['pray', 'desecrate'],
        ancientWriting: ['simplicity', 'elegance'],
        womanInBlue: ['one', 'three'],
        moaiHead: ['jump', 'idol'],
      };
      for (const choice of choices[s.event] ?? []) {
        if (s.event === 'cleric' && s.gold < (choice === 'heal' ? 35 : 50)) continue;
        if (s.event === 'shiningLight' && s.hp <= Math.floor(s.maxHp * 0.2)) continue;
        if (s.event === 'goldenIdol' && choice === 'damage' && s.hp <= Math.floor(s.maxHp * 0.25))
          continue;
        if (
          s.event === 'womanInBlue' &&
          (s.relics.includes('sozu') || s.gold < (choice === 'one' ? 20 : 50))
        )
          continue;
        if (s.event === 'moaiHead' && choice === 'idol' && !s.relics.includes('goldenIdol'))
          continue;
        if (choice === 'purify' || choice === 'simplicity')
          for (const card of s.deck) actions.push({ type: 'event', choice, card: card.id });
        else actions.push({ type: 'event', choice });
      }
      actions.push({ type: 'event', choice: 'leave' });
      break;
    }
    case 'treasure':
      actions.push({ type: 'takeTreasure' }, { type: 'takeTreasure', skip: true });
      break;
  }
  return actions;
}
