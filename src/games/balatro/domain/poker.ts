import type { Card, HandType, PokerHand } from './types';

export const HANDS: Record<
  HandType,
  { name: string; chips: number; mult: number; chipGain: number; multGain: number }
> = {
  high: { name: 'High Card', chips: 5, mult: 1, chipGain: 10, multGain: 1 },
  pair: { name: 'Pair', chips: 10, mult: 2, chipGain: 15, multGain: 1 },
  twoPair: { name: 'Two Pair', chips: 20, mult: 2, chipGain: 20, multGain: 1 },
  three: { name: 'Three of a Kind', chips: 30, mult: 3, chipGain: 20, multGain: 2 },
  straight: { name: 'Straight', chips: 30, mult: 4, chipGain: 30, multGain: 3 },
  flush: { name: 'Flush', chips: 35, mult: 4, chipGain: 15, multGain: 2 },
  fullHouse: { name: 'Full House', chips: 40, mult: 4, chipGain: 25, multGain: 2 },
  four: { name: 'Four of a Kind', chips: 60, mult: 7, chipGain: 30, multGain: 3 },
  straightFlush: { name: 'Straight Flush', chips: 100, mult: 8, chipGain: 40, multGain: 4 },
  five: { name: 'Five of a Kind', chips: 120, mult: 12, chipGain: 35, multGain: 3 },
  flushHouse: { name: 'Flush House', chips: 140, mult: 14, chipGain: 40, multGain: 4 },
  flushFive: { name: 'Flush Five', chips: 160, mult: 16, chipGain: 50, multGain: 4 },
};

export const rankLabel = (rank: number): string =>
  ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' })[rank] ?? String(rank);
export const cardChips = (card: Card): number => (card.rank === 14 ? 11 : Math.min(card.rank, 10));
export const isFace = (card: Card): boolean => card.rank >= 11 && card.rank <= 13;

/** At most five cards are selected. Return scoring IDs in presentation order. */
export function evaluateHand(cards: readonly Card[], wildDisabled = false): PokerHand {
  if (!cards.length || cards.length > 5) throw new Error('Choose between one and five cards.');
  const groups = new Map<number, Card[]>();
  cards.forEach((card) => groups.set(card.rank, [...(groups.get(card.rank) ?? []), card]));
  const bySize = [...groups.values()].sort((a, b) => b.length - a.length || b[0].rank - a[0].rank);
  const ranks = [...groups.keys()].sort((a, b) => a - b);
  const normalSuits = cards
    .filter((card) => wildDisabled || card.enhancement !== 'wild')
    .map((card) => card.suit);
  const hasFlush = cards.length === 5 && new Set(normalSuits).size <= 1;
  const hasStraight =
    ranks.length === 5 && (ranks[4] - ranks[0] === 4 || ranks.join(',') === '2,3,4,5,14');
  const sizes = bySize.map((group) => group.length);
  const hasPair = sizes[0] >= 2;
  const hasThree = sizes[0] >= 3;
  const hasFour = sizes[0] >= 4;
  let type: HandType;
  let scoring: readonly Card[] = cards;
  if (sizes[0] === 5 && hasFlush) type = 'flushFive';
  else if (sizes[0] === 3 && sizes[1] === 2 && hasFlush) type = 'flushHouse';
  else if (sizes[0] === 5) type = 'five';
  else if (hasFlush && hasStraight) type = 'straightFlush';
  else if (hasFour) {
    type = 'four';
    scoring = bySize[0];
  } else if (sizes[0] === 3 && sizes[1] === 2) type = 'fullHouse';
  else if (hasFlush) type = 'flush';
  else if (hasStraight) type = 'straight';
  else if (hasThree) {
    type = 'three';
    scoring = bySize[0];
  } else if (sizes[0] === 2 && sizes[1] === 2) {
    type = 'twoPair';
    scoring = [...bySize[0], ...bySize[1]];
  } else if (hasPair) {
    type = 'pair';
    scoring = bySize[0];
  } else {
    type = 'high';
    scoring = [bySize[0][0]];
  }
  const scoringSet = new Set(scoring.map((card) => card.id));
  return {
    type,
    hasPair,
    hasThree,
    hasFour,
    hasStraight,
    hasFlush,
    scoringIds: cards.filter((card) => scoringSet.has(card.id)).map((card) => card.id),
  };
}
