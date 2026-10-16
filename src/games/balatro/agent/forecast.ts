import { contextFor, scoreHand } from '../domain/scoring';
import { JOKER_BY_ID } from '../content/jokers';
import type { RunState } from '../domain/types';
import type { Observation } from './observation';

/** Public scoring model, never an evaluator-state copy or seeded transition. */
export function forecastState(view: Observation): RunState {
  return {
    version: view.rulesVersion,
    difficulty: view.difficulty,
    setupLocked: true,
    seed: 'PUBLIC-FORECAST',
    rng: 1,
    nextId: 1,
    phase: view.phase,
    ante: view.ante,
    blind: view.blind,
    bossIds: Array.from({ length: 8 }, () => view.boss),
    target: view.target,
    roundScore: view.roundScore,
    cash: view.cash,
    handsLeft: view.handsLeft,
    discardsLeft: view.discardsLeft,
    handsPlayed: view.handsPlayed,
    deck: structuredClone(view.deck),
    hand: view.hand.map((card) => card.id),
    draw: [],
    discard: [],
    jokers: structuredClone(view.jokers),
    consumables: structuredClone(view.consumables),
    levels: { ...view.levels },
    shop: structuredClone(view.shop),
    packs: structuredClone(view.packs),
    pack: structuredClone(view.pack),
    vouchers: [...view.vouchers],
    voucherOffer: view.voucherOffer,
    voucherAnte: view.ante,
    skipTags: structuredClone(view.skipTags),
    tags: [...view.tags],
    rerolls: view.rerolls,
    firstHandType: view.firstHandType,
    lastScore: structuredClone(view.lastScore),
    notice: '',
    history: [],
  };
}

export function bestHand(run: RunState, growthWeight = 0) {
  let best = { cards: [] as string[], total: -1, value: -1, hand: 'high', growth: 0 };
  let work = 0;
  for (let bits = 1; bits < 2 ** run.hand.length; bits++) {
    const cards = run.hand.filter((_, i) => (bits & (1 << i)) !== 0);
    if (
      cards.length > 5 ||
      (run.blind === 2 && run.bossIds[run.ante - 1] === 'five' && cards.length !== 5)
    )
      continue;
    const result = scoreHand(run, cards);
    work++;
    const context = growthWeight ? contextFor(run, cards) : undefined;
    const growth =
      context && !result.blocked
        ? run.jokers.reduce(
            (sum, owned) => sum + (JOKER_BY_ID[owned.definitionId].grow?.(context) ?? 0),
            0,
          )
        : 0;
    const value = result.total + growth * growthWeight;
    if (value > best.value || (value === best.value && cards.length < best.cards.length))
      best = { cards, total: result.total, value, hand: result.poker.type, growth };
  }
  return { ...best, work };
}
