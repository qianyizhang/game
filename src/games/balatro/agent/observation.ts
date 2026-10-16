import { currentBoss } from '../content/blinds';
import type { RunState } from '../domain/types';

/** Structured public information. Draw order, RNG, seed and later bosses are withheld. */
export function observe(run: RunState) {
  const cards = new Map(run.deck.map((card) => [card.id, card]));
  return structuredClone({
    schema: 'blindside-observation-1' as const,
    rulesVersion: run.version,
    difficulty: run.difficulty ?? 'standard',
    phase: run.phase,
    ante: run.ante,
    blind: run.blind,
    boss: currentBoss(run).id,
    target: run.target,
    roundScore: run.roundScore,
    cash: run.cash,
    handsLeft: run.handsLeft,
    discardsLeft: run.discardsLeft,
    handsPlayed: run.handsPlayed,
    deck: [...run.deck].sort((a, b) => a.id.localeCompare(b.id)),
    hand: run.hand.map((id) => cards.get(id)!),
    remainingRanks: Array.from({ length: 13 }, (_, i) => ({
      rank: i + 2,
      count: run.draw.filter((id) => cards.get(id)?.rank === i + 2).length,
    })),
    drawCount: run.draw.length,
    jokers: run.jokers,
    consumables: run.consumables,
    levels: run.levels,
    shop: run.shop,
    packs: run.packs,
    pack: run.pack,
    vouchers: run.vouchers,
    voucherOffer: run.voucherOffer,
    skipTags: run.skipTags,
    tags: run.tags,
    rerolls: run.rerolls,
    firstHandType: run.firstHandType,
    lastScore: run.lastScore,
    actions: {
      play: run.phase === 'playing' && run.handsLeft > 0,
      playMinimum: run.blind === 2 && currentBoss(run).id === 'five' ? 5 : 1,
      cardsMaximum: 5,
      discard: run.phase === 'playing' && run.discardsLeft > 0,
      start: run.phase === 'ready',
      skip: run.phase === 'ready' && run.blind < 2,
      configure: false,
    },
  });
}

export type Observation = ReturnType<typeof observe>;
