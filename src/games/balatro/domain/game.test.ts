import { describe, expect, it } from 'vitest';
import { JOKERS } from '../content/jokers';
import { CONSUMABLES } from '../content/consumables';
import { createRun, transition } from './game';
import type { Command, RunState } from './types';

const apply = (run: RunState, command: Command) => {
  const result = transition(run, command);
  expect(result.error).toBeUndefined();
  return result.state;
};
function shop(): RunState {
  let run = apply(createRun('SHOP'), { type: 'startBlind' });
  run.target = 1;
  run = apply(run, { type: 'play', cards: [run.hand[0]] });
  return run;
}

describe('run resources and lifecycle', () => {
  it('has the agreed unique, purchasable content pool', () => {
    expect(JOKERS).toHaveLength(40);
    expect(CONSUMABLES).toHaveLength(18);
    expect(new Set([...JOKERS, ...CONSUMABLES].map((c) => c.id)).size).toBe(58);
  });
  it('is seed-deterministic and conserves card zones', () => {
    let run = apply(createRun('SAME'), { type: 'startBlind' });
    expect(run).toEqual(apply(createRun('SAME'), { type: 'startBlind' }));
    const first = [...run.hand];
    run = apply(run, { type: 'discard', cards: first.slice(0, 5) });
    expect(run.handsLeft).toBe(4);
    expect(run.discardsLeft).toBe(2);
    expect(run.hand).toHaveLength(8);
    expect(run.discard).toEqual(first.slice(0, 5));
    const zones = [...run.hand, ...run.draw, ...run.discard];
    expect(new Set(zones).size).toBe(52);
    expect(zones).toHaveLength(52);
  });
  it('rejects invalid commands atomically, including RNG', () => {
    const run = apply(createRun('INVALID'), { type: 'startBlind' });
    for (const command of [
      { type: 'play', cards: [] },
      { type: 'play', cards: [run.hand[0], run.hand[0]] },
      { type: 'play', cards: ['foreign'] },
      { type: 'buy', offerId: 'missing' },
      { type: 'leaveShop' },
    ] as Command[]) {
      const result = transition(run, command);
      expect(result.error).toBeTruthy();
      expect(result.state).toBe(run);
    }
  });
  it('pays interest on pre-payout money and gives victory priority over exhausted hands', () => {
    let run = apply(createRun('PAYOUT'), { type: 'startBlind' });
    run.cash = 25;
    run.target = 1;
    run.handsLeft = 1;
    run = apply(run, { type: 'play', cards: [run.hand[0]] });
    expect(run.phase).toBe('shop');
    expect(run.cash).toBe(33); // 25 + 3 reward + 0 spare + 5 interest
    expect(run.shop).toHaveLength(7);
  });
  it('purchases and sells only once, enforces slots and increases reroll price', () => {
    let run = shop();
    run.cash = 100;
    const offer = run.shop.find((c) => c.kind === 'joker')!;
    run = apply(run, { type: 'buy', offerId: offer.id });
    expect(run.cash).toBe(100 - offer.price);
    expect(transition(run, { type: 'buy', offerId: offer.id }).error).toBeTruthy();
    const previous = run.cash;
    run = apply(run, { type: 'reroll' });
    expect(run.cash).toBe(previous - 5);
    run = apply(run, { type: 'reroll' });
    expect(run.cash).toBe(previous - 11);
    const owned = run.jokers[0];
    run = apply(run, { type: 'sellJoker', id: owned.id });
    expect(transition(run, { type: 'sellJoker', id: owned.id }).error).toBeTruthy();
    run.jokers = JOKERS.slice(0, 5).map((j, i) => ({
      id: String(i),
      definitionId: j.id,
      growth: 0,
      paid: 5,
    }));
    expect(
      transition(run, { type: 'buy', offerId: run.shop.find((c) => c.kind === 'joker')!.id }).error,
    ).toContain('five');
  });
  it('consumables permanently edit cards, clones use fresh IDs and wait until next blind', () => {
    let run = apply(createRun('MODS'), { type: 'startBlind' });
    const id = run.hand[0];
    run.consumables = [
      { id: 'c1', definitionId: 'copy', paid: 5 },
      { id: 'c2', definitionId: 'destroy', paid: 4 },
    ];
    run = apply(run, { type: 'useConsumable', id: 'c1', cards: [id] });
    expect(run.deck).toHaveLength(53);
    const clone = run.deck.at(-1)!;
    expect(clone.id).not.toBe(id);
    expect([...run.hand, ...run.draw, ...run.discard]).not.toContain(clone.id);
    run = apply(run, { type: 'useConsumable', id: 'c2', cards: [id] });
    expect(run.deck).toHaveLength(52);
    expect(run.deck.some((c) => c.id === id)).toBe(false);
    expect(run.hand).toHaveLength(8);
  });
  it('bosses impose their explicit resource and legality rules', () => {
    for (const [boss, expectedDiscards, expectedHand] of [
      ['pinch', 1, 8],
      ['narrow', 3, 6],
    ] as const) {
      let run = createRun(boss);
      run.blind = 2;
      run.bossIds[0] = boss;
      run = apply(run, { type: 'startBlind' });
      expect(run.discardsLeft).toBe(expectedDiscards);
      expect(run.hand).toHaveLength(expectedHand);
    }
    let run = createRun('FIVE');
    run.blind = 2;
    run.bossIds[0] = 'five';
    run = apply(run, { type: 'startBlind' });
    expect(transition(run, { type: 'play', cards: run.hand.slice(0, 4) }).error).toContain(
      'exactly five',
    );
  });
  it('advances all 24 blinds and ends after the eighth boss', () => {
    // Lower only the fixture target to isolate progression from balance.
    let run = createRun('LIFECYCLE');
    for (let round = 0; round < 24; round++) {
      expect(run.ante).toBe(Math.floor(round / 3) + 1);
      expect(run.blind).toBe(round % 3);
      run = apply(run, { type: 'startBlind' });
      run.target = 1;
      run = apply(run, { type: 'play', cards: run.hand.slice(0, 5) });
      if (round < 23) {
        expect(run.phase).toBe('shop');
        run = apply(run, { type: 'leaveShop' });
      }
    }
    expect(run.phase).toBe('won');
    expect(transition(run, { type: 'startBlind' }).error).toBeTruthy();
  });
  it('ends a failed blind without opening a shop', () => {
    let run = apply(createRun('LOSS'), { type: 'startBlind' });
    run.target = 1e9;
    for (let i = 0; i < 4; i++) run = apply(run, { type: 'play', cards: [run.hand[0]] });
    expect(run.phase).toBe('lost');
    expect(run.shop).toHaveLength(0);
  });
  it('ends a forced-five blind when the depleted draw cannot supply five cards', () => {
    let run = createRun('DEPLETED');
    run.deck = run.deck.slice(0, 7);
    run.blind = 2;
    run.bossIds[0] = 'five';
    run = apply(run, { type: 'startBlind' });
    run.target = 1e9;
    run = apply(run, { type: 'play', cards: run.hand.slice(0, 5) });
    expect(run.handsLeft).toBe(3);
    expect(run.hand).toHaveLength(2);
    expect(run.phase).toBe('lost');
  });
});
