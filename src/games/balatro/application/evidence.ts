import type { Observer, EvidenceEvent } from '../../../shared/evidence/types';
import type { RunState, Command, PackChoice } from '../domain/types';
const label = (c: PackChoice) =>
  c.kind === 'card' ? `${c.card.rank}-${c.card.suit}-${c.card.enhancement}` : c.definitionId;
export const blindsideEvidence: Observer<RunState, Command> = {
  summary: (s) => ({
    outcome: s.phase === 'won' || s.phase === 'lost' ? s.phase : 'active',
    context: 'Eight antes',
    metrics: {
      ante: s.ante,
      blind: s.blind,
      cash: s.cash,
      cards: s.deck.length,
      jokers: s.jokers.length,
      score: s.lastScore?.total ?? 0,
    },
  }),
  events: (before, command, after) => {
    const events: EvidenceEvent[] = [];
    if (command.type === 'choosePack' || command.type === 'skipPack')
      events.push({
        kind: command.type === 'choosePack' ? 'pick' : 'skip',
        name: 'Pack choice',
        offered: before.pack!.choices.map(label),
        choice:
          command.type === 'choosePack'
            ? label(before.pack!.choices.find((c) => c.id === command.id)!)
            : undefined,
      });
    if (command.type === 'buy')
      events.push({
        kind: 'pick',
        name: 'Shop purchase',
        offered: before.shop.map((o) => o.definitionId),
        choice: before.shop.find((o) => o.id === command.offerId)!.definitionId,
      });
    if (command.type === 'leaveShop')
      events.push({
        kind: 'skip',
        name: 'Leave shop',
        offered: before.shop.map((o) => o.definitionId),
      });
    if (command.type === 'play' && after.phase !== 'playing')
      events.push({
        kind: 'encounter',
        name: `Ante ${before.ante} · ${before.blind === 2 ? before.bossIds[before.ante - 1] : ['Small', 'Big'][before.blind]}`,
        metrics: {
          score: after.roundScore,
          target: after.target,
          hands: after.handsPlayed,
          won: Number(after.phase !== 'lost'),
        },
      });
    if (['skipBlind', 'buyVoucher', 'buyPack', 'reroll', 'discard'].includes(command.type))
      events.push({
        kind: 'action',
        name: command.type,
        metrics: { cash: after.cash, ante: after.ante },
      });
    return events;
  },
};
