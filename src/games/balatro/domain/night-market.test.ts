import { describe, expect, it } from 'vitest';
import { blindsideSession } from '../application/session';
import { createRun, RULES_VERSION, transition } from './game';
import { scoreHand } from './scoring';
import type { Card, RunState } from './types';

function table(ids: string[]): RunState {
  const run = transition(createRun('NIGHT-MARKET'), { type: 'startBlind' }).state;
  run.deck = [
    { id: 'seven', rank: 7, suit: 'hearts', enhancement: 'bonus' },
    { id: 'eight', rank: 8, suit: 'clubs', enhancement: 'mult' },
    { id: 'nine', rank: 9, suit: 'diamonds', enhancement: 'wild' },
    { id: 'king', rank: 13, suit: 'spades', enhancement: 'steel' },
    { id: 'ace', rank: 14, suit: 'hearts', enhancement: 'gold' },
  ] satisfies Card[];
  run.hand = run.deck.map((c) => c.id);
  run.draw = [];
  run.jokers = ids.map((definitionId, i) => ({
    definitionId,
    id: `joker-${i}`,
    paid: 5,
    growth: 0,
  }));
  run.target = 1e9;
  return run;
}
const fired = (run: RunState, cards: string[], name: string) =>
  scoreHand(run, cards).steps.some((s) => s.source === name);

describe('Night Market Joker decisions', () => {
  it('applies filigree after held Steel and stops held bonuses on played or debuffed cards', () => {
    const run = table(['filigree', 'velvetpurse', 'nightjar']);
    const before = structuredClone(run);
    const score = scoreHand(run, ['seven']);
    expect(score.mult).toBe(11); // (1 × 1.5 + 4) × 2
    expect(score.chips).toBe(67); // 5 + 7 + 30 + 25
    expect(run).toEqual(before);
    expect(fired(run, ['king'], 'Nightjar')).toBe(false);
    expect(fired(run, ['ace'], 'Velvet Purse')).toBe(false);
    run.blind = 2;
    run.bossIds[0] = 'mask';
    expect(fired(run, ['seven'], 'Silver Filigree')).toBe(false);
  });
  it('requires three distinct scored enhancements, and counts the whole permanent deck for the loom', () => {
    const run = table(['prism', 'gildedloom']);
    expect(fired(run, ['seven', 'eight', 'nine'], 'Prism Cabinet')).toBe(false);
    run.jokers.push({ id: 'splash', definitionId: 'splash', paid: 5, growth: 0 });
    expect(fired(run, ['seven', 'eight', 'nine'], 'Prism Cabinet')).toBe(true);
    run.deck[2].enhancement = 'mult';
    expect(fired(run, ['seven', 'eight', 'nine'], 'Prism Cabinet')).toBe(false);
    run.deck.push(...Array.from({ length: 6 }, (_, i) => ({ ...run.deck[0], id: `reserve-${i}` })));
    expect(fired(run, ['seven'], 'Gilded Loom')).toBe(false);
    run.deck.push({ ...run.deck[0], id: 'twelfth' });
    expect(fired(run, ['seven'], 'Gilded Loom')).toBe(true);
  });
  it('checks current cash after card income and uses actual paid prices of currently owned Jokers', () => {
    const run = table(['orchard', 'emptypockets', 'receiptribbon']);
    run.cash = 5;
    expect(fired(run, ['seven'], 'Empty Pockets')).toBe(false); // Orchard earns $1 first.
    run.cash = 4;
    expect(fired(run, ['seven'], 'Empty Pockets')).toBe(true);
    const steps = scoreHand(run, ['seven']).steps;
    const ribbon = steps.findIndex((s) => s.source === 'Receipt Ribbon');
    expect(steps[ribbon].chips - steps[ribbon - 1].chips).toBe(30);
    run.jokers[0].paid = 0;
    const discounted = scoreHand(run, ['seven']);
    expect(discounted.chips).toBe(steps.at(-1)!.chips - 10);
    run.jokers[0].paid = 100;
    const capped = scoreHand(run, ['seven']).steps;
    const index = capped.findIndex((s) => s.source === 'Receipt Ribbon');
    expect(capped[index].chips - capped[index - 1].chips).toBe(100);
  });
  it('calculates ledger income before adding spare hands, interest, and held Gold income', () => {
    const run = table(['moonledger']);
    run.cash = 59;
    run.target = 1;
    const result = transition(run, { type: 'play', cards: ['seven'] });
    expect(result.error).toBeUndefined();
    expect(result.state.cash).toBe(59 + 3 + 3 + 5 + 5 + 3);
    run.cash = 100;
    expect(transition(run, { type: 'play', cards: ['seven'] }).state.cash).toBe(
      100 + 3 + 3 + 5 + 6 + 3,
    );
  });
  it('rejects pre-market replay meaning while round-tripping the current content manifest', () => {
    expect(RULES_VERSION).toBe(4);
    const session = blindsideSession.create('MARKET-REPLAY');
    expect(blindsideSession.decode(blindsideSession.encode(session))).toEqual(session);
    expect(() =>
      blindsideSession.decode(JSON.stringify({ ...session.replay, version: 3 })),
    ).toThrow(/version/i);
  });
});
