import { adjacentMoves, selections, sessionEngine } from '../../../shared/engine';
import { CONSUMABLE_BY_ID } from '../content/consumables';
import type { Command, RunState } from '../domain/types';
import { blindsideSession } from './session';

export function* blindsideCommands(state: RunState): Generator<Command> {
  if (state.phase === 'won' || state.phase === 'lost') return;
  for (const move of adjacentMoves(state.jokers.map((joker) => joker.id)))
    yield { type: 'moveJoker', ...move };
  for (const joker of state.jokers) yield { type: 'sellJoker', id: joker.id };
  for (const consumable of state.consumables) yield { type: 'sellConsumable', id: consumable.id };
  if (state.phase === 'pack') {
    for (const choice of state.pack?.choices ?? []) yield { type: 'choosePack', id: choice.id };
    yield { type: 'skipPack' };
    return;
  }
  for (const item of state.consumables) {
    const targets = CONSUMABLE_BY_ID[item.definitionId].targets;
    if (!targets) yield { type: 'useConsumable', id: item.id, cards: [] };
    else if (state.phase === 'playing')
      for (const cards of selections(state.hand, targets))
        yield { type: 'useConsumable', id: item.id, cards };
  }
  if (state.phase === 'ready') {
    yield { type: 'startBlind' };
    yield { type: 'skipBlind' };
  } else if (state.phase === 'playing') {
    for (const cards of selections(state.hand, 5)) {
      yield { type: 'play', cards };
      yield { type: 'discard', cards };
    }
    for (const move of adjacentMoves(state.hand)) yield { type: 'moveCard', ...move };
    yield { type: 'sortHand', by: 'rank' };
    yield { type: 'sortHand', by: 'suit' };
  } else if (state.phase === 'shop') {
    for (const offer of state.shop) yield { type: 'buy', offerId: offer.id };
    for (const pack of state.packs) yield { type: 'buyPack', id: pack.id };
    yield { type: 'buyVoucher' };
    yield { type: 'reroll' };
    yield { type: 'leaveShop' };
  }
}

export const blindsideEngine = sessionEngine(blindsideSession, blindsideCommands);
