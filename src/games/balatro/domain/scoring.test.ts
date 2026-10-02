import { describe, expect, it } from 'vitest';
import { createRun, transition } from './game';
import { scoreHand } from './scoring';
import type { Card, RunState } from './types';

function fixture(jokers: string[] = []): RunState {
  const run = transition(createRun('SCORING'), { type: 'startBlind' }).state;
  const cards: Card[] = [
    { id: 'a', rank: 2, suit: 'hearts', enhancement: 'plain' },
    { id: 'b', rank: 2, suit: 'spades', enhancement: 'plain' },
    { id: 'c', rank: 13, suit: 'clubs', enhancement: 'plain' },
  ];
  run.deck = cards;
  run.hand = cards.map((c) => c.id);
  run.draw = [];
  run.cash = 30;
  run.jokers = jokers.map((definitionId, i) => ({ id: `j${i}`, definitionId, growth: 0, paid: 5 }));
  return run;
}

describe('ordered scoring', () => {
  it('resolves additive and multiplicative Jokers in slot order', () => {
    expect(scoreHand(fixture(['spark', 'bankroll']), ['a', 'b']).total).toBe(210);
    expect(scoreHand(fixture(['bankroll', 'spark']), ['a', 'b']).total).toBe(126);
  });
  it('later money-dependent Jokers see cash earned earlier in the score', () => {
    const run = fixture(['toll', 'bankroll']);
    run.cash = 23;
    expect(scoreHand(run, ['a', 'b']).total).toBe(70);
    run.jokers.reverse();
    expect(scoreHand(run, ['a', 'b']).total).toBe(28);
    expect(run.cash).toBe(23);
  });
  it('resolves glass, held steel, then whole-hand Jokers', () => {
    const run = fixture(['spark']);
    run.deck[0].enhancement = 'glass';
    run.deck[2].enhancement = 'steel';
    const result = scoreHand(run, ['a', 'b']);
    expect(result.total).toBe(140);
    expect(result.steps.map((s) => s.source)).toEqual([
      'Pair · level 1',
      '2 hearts',
      'Glass card',
      '2 spades',
      'Held steel K',
      'Spark',
    ]);
  });
  it('retrigger repeats chips, enhancement and card effects', () => {
    const run = fixture(['echo', 'spark']);
    run.deck[0].enhancement = 'glass';
    run.deck[2].enhancement = 'steel';
    expect(scoreHand(run, ['a', 'b']).total).toBe(288);
  });
  it('card order matters but click-selection order does not', () => {
    const run = fixture();
    run.deck[0].enhancement = 'glass';
    run.deck[1].enhancement = 'mult';
    expect(scoreHand(run, ['a', 'b']).total).toBe(112);
    expect(scoreHand(run, ['b', 'a']).total).toBe(112);
    run.hand = ['b', 'a', 'c'];
    expect(scoreHand(run, ['a', 'b']).total).toBe(168);
  });
  it('debuffs remove card triggers without removing hand membership', () => {
    const run = fixture(['portrait']);
    run.deck[0].rank = 12;
    run.deck[1].rank = 12;
    run.deck[0].enhancement = 'glass';
    run.blind = 2;
    run.bossIds[0] = 'mask';
    const result = scoreHand(run, ['a', 'b']);
    expect(result.poker.type).toBe('pair');
    expect(result.total).toBe(20);
  });
  it('splash scores kickers and the lock suppresses all score/money hooks', () => {
    const run = fixture(['splash', 'toll']);
    expect(scoreHand(run, ['a', 'b', 'c']).total).toBe(48);
    run.blind = 2;
    run.bossIds[0] = 'lock';
    run.firstHandType = 'flush';
    const result = scoreHand(run, ['a', 'b']);
    expect(result.blocked).toBe(true);
    expect(result.total).toBe(0);
    expect(result.cash).toBe(0);
  });
  it('preview does not change RNG, growth, cards, or cash', () => {
    const run = fixture(['vine', 'toll']);
    run.deck[0].enhancement = 'glass';
    const before = structuredClone(run);
    expect(scoreHand(run, ['a', 'b'])).toEqual(scoreHand(run, ['a', 'b']));
    expect(run).toEqual(before);
    const after = transition(run, { type: 'play', cards: ['a', 'b'] }).state;
    expect(after.jokers[0].growth).toBe(2);
    expect(after.cash).toBe(32);
    expect(after.lastScore?.total).toBe(84);
  });
});
