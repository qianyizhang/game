import { sessionEngine } from '../../../shared/engine';
import { CARD_BY_ID } from '../content/cards';
import { POTIONS } from '../content/world';
import { availableNodes } from '../domain/game';
import type { SpireCommand, SpireState } from '../domain/types';
import { spireSession } from './session';

const eventChoices: Record<string, readonly string[]> = {
  bigFish: ['banana', 'donut', 'box'],
  cleric: ['heal', 'purify'],
  shiningLight: ['enter'],
  goldenIdol: ['injury', 'damage', 'maxHp'],
  goldenShrine: ['pray', 'desecrate'],
  ancientWriting: ['simplicity', 'elegance'],
  womanInBlue: ['one', 'three'],
  moaiHead: ['jump', 'idol'],
};

export function* spireCommands(state: SpireState): Generator<SpireCommand> {
  if (state.phase === 'won' || state.phase === 'lost') return;
  const combat = state.combat;
  if (state.phase === 'combat' && combat?.choice) {
    for (const id of combat.choice.options) yield { type: 'chooseCard', id };
    return;
  }
  for (let index = 0; index < state.potions.length; index++) yield { type: 'discardPotion', index };
  switch (state.phase) {
    case 'neow':
      for (const character of ['ironclad', 'silent'] as const)
        for (let ascension = 0; ascension <= 5; ascension++)
          if (character !== state.character || ascension !== state.ascension)
            yield { type: 'configure', character, ascension };
      for (const choice of ['maxHp', 'lament', 'gold', 'bossSwap'] as const)
        yield { type: 'neow', choice };
      break;
    case 'map':
      for (const node of availableNodes(state)) yield { type: 'chooseNode', id: node.id };
      break;
    case 'combat': {
      if (!combat) return;
      const targets = combat.enemies.filter((enemy) => enemy.hp > 0).map((enemy) => enemy.id);
      for (const id of combat.hand) {
        if (CARD_BY_ID[combat.cards[id].definitionId].target)
          for (const target of targets) yield { type: 'playCard', id, target };
        else yield { type: 'playCard', id };
      }
      for (const [index, potion] of state.potions.entries()) {
        if (POTIONS[potion].target)
          for (const target of targets) yield { type: 'potion', index, target };
        else yield { type: 'potion', index };
      }
      yield { type: 'endTurn' };
      break;
    }
    case 'reward':
      for (const card of state.reward) yield { type: 'takeReward', card };
      yield { type: 'takeReward', card: null };
      break;
    case 'bossRelic':
      for (const id of state.bossRelics) yield { type: 'bossRelic', id };
      yield { type: 'bossRelic', id: null };
      break;
    case 'rest':
      yield { type: 'rest', choice: 'heal' };
      for (const card of state.deck) yield { type: 'rest', choice: 'upgrade', card: card.id };
      yield { type: 'rest', choice: 'leave' };
      break;
    case 'shop':
      for (const offer of state.shop) yield { type: 'buy', id: offer.id };
      for (const card of state.deck) yield { type: 'removeCard', id: card.id };
      yield { type: 'leaveShop' };
      break;
    case 'event':
      for (const choice of eventChoices[state.event] ?? []) {
        if (choice === 'purify' || choice === 'simplicity')
          for (const card of state.deck) yield { type: 'event', choice, card: card.id };
        else yield { type: 'event', choice };
      }
      yield { type: 'event', choice: 'leave' };
      break;
    case 'treasure':
      yield { type: 'takeTreasure' };
      yield { type: 'takeTreasure', skip: true };
      break;
  }
}

export const spireEngine = sessionEngine(spireSession, spireCommands);
