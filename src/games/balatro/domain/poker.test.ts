import { describe, expect, it } from 'vitest';
import { evaluateHand } from './poker';
import type { Card, HandType, Suit } from './types';

const cards = (ranks: number[], suits?: Suit[]): Card[] =>
  ranks.map((rank, i) => ({
    id: String(i),
    rank,
    suit: suits?.[i] ?? (i % 2 ? 'hearts' : 'spades'),
    enhancement: 'plain',
  }));
describe('poker recognition', () => {
  it.each<[number[], HandType, boolean]>([
    [[14, 10, 7, 5, 2], 'high', false],
    [[9, 9, 14, 7, 2], 'pair', false],
    [[9, 9, 3, 3, 14], 'twoPair', false],
    [[7, 7, 7, 14, 2], 'three', false],
    [[14, 2, 3, 4, 5], 'straight', false],
    [[2, 4, 7, 9, 13], 'flush', true],
    [[7, 7, 7, 2, 2], 'fullHouse', false],
    [[9, 9, 9, 9, 2], 'four', false],
    [[10, 11, 12, 13, 14], 'straightFlush', true],
    [[6, 6, 6, 6, 6], 'five', false],
    [[8, 8, 8, 5, 5], 'flushHouse', true],
    [[9, 9, 9, 9, 9], 'flushFive', true],
  ])('recognizes %j as %s', (ranks, type, flush) => {
    expect(evaluateHand(cards(ranks, flush ? ranks.map(() => 'hearts') : undefined)).type).toBe(
      type,
    );
  });
  it('does not wrap a straight through Q K A 2 3 or count duplicate ranks', () => {
    expect(evaluateHand(cards([12, 13, 14, 2, 3])).type).toBe('high');
    expect(evaluateHand(cards([2, 3, 4, 5, 5])).type).toBe('pair');
  });
  it('excludes kickers while preserving visual scoring order', () => {
    expect(evaluateHand(cards([9, 14, 9, 2])).scoringIds).toEqual(['0', '2']);
    expect(evaluateHand(cards([9, 14, 7])).scoringIds).toEqual(['1']);
  });
  it('wild cards complete a flush only when enabled', () => {
    const hand = cards([2, 4, 6, 8, 10], ['hearts', 'hearts', 'hearts', 'hearts', 'spades']);
    hand[4].enhancement = 'wild';
    expect(evaluateHand(hand).type).toBe('flush');
    expect(evaluateHand(hand, true).type).toBe('high');
  });
  it('rejects empty and oversized hands', () => {
    expect(() => evaluateHand([])).toThrow();
    expect(() => evaluateHand(cards([2, 3, 4, 5, 6, 7]))).toThrow();
  });
});
