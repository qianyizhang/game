import { object, integer, ids } from '../../../shared/scenario';
import { JOKER_BY_ID } from '../content/jokers';
import { createRun, transition } from '../domain/game';
import { SUITS, type Suit } from '../domain/types';

export function blindsideScenario(seed: string, value: unknown) {
  const setup = object(value, ['ante', 'blind', 'cash', 'jokers', 'deck']),
    run = createRun(seed);
  run.ante = integer(setup.ante, 'ante', 1, 8, 1);
  run.blind = integer(setup.blind, 'blind', 0, 2, 0);
  run.cash = integer(setup.cash, 'cash', 0, 999, 20);
  run.jokers = ids(setup.jokers ?? [], 'jokers', JOKER_BY_ID, 0, 5).map((definitionId) => ({
    id: `joker-${run.nextId++}`,
    definitionId,
    growth: 0,
    paid: JOKER_BY_ID[definitionId].price,
  }));
  if (setup.deck !== undefined) {
    if (!Array.isArray(setup.deck) || setup.deck.length < 8 || setup.deck.length > 104)
      throw new Error('deck: expected 8–104 cards.');
    run.deck = setup.deck.map((value, i) => {
      const card = object(value, ['rank', 'suit']);
      if (!SUITS.includes(card.suit as Suit))
        throw new Error(`deck[${i}].suit: choose spades, hearts, clubs or diamonds.`);
      return {
        id: `card-${run.nextId++}`,
        rank: integer(card.rank, `deck[${i}].rank`, 2, 14),
        suit: card.suit as Suit,
        enhancement: 'plain' as const,
      };
    });
  }
  return transition(run, { type: 'startBlind' }).state;
}
export const BLINDSIDE_SCENARIOS = [
  {
    name: 'Ordered Joker effects',
    setup: {
      ante: 1,
      blind: 0,
      cash: 20,
      jokers: ['spark'],
      deck: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((rank) => ({ rank, suit: 'hearts' })),
    },
  },
  { name: 'Boss practice', setup: { ante: 3, blind: 2, cash: 25, jokers: [] } },
];
