import type { Observer, EvidenceEvent } from '../../../shared/evidence/types';
import type { SpireState, SpireCommand } from '../domain/types';
export const spireEvidence: Observer<SpireState, SpireCommand> = {
  summary: (s) => ({
    outcome: s.phase === 'won' || s.phase === 'lost' ? s.phase : 'active',
    context: `${s.character} · A${s.ascension}`,
    metrics: {
      act: s.act,
      floor: (s.act - 1) * 17 + s.row + 1,
      hp: s.hp,
      gold: s.gold,
      cards: s.deck.length,
      relics: s.relics.length,
    },
  }),
  events: (before, command, after) => {
    const events: EvidenceEvent[] = [];
    if (command.type === 'takeReward')
      events.push({
        kind: command.card ? 'pick' : 'skip',
        name: 'Card reward',
        offered: before.reward,
        choice: command.card ?? undefined,
      });
    if (command.type === 'bossRelic')
      events.push({
        kind: command.id ? 'pick' : 'skip',
        name: 'Boss relic',
        offered: before.bossRelics,
        choice: command.id ?? undefined,
      });
    if (before.phase === 'combat' && after.phase !== 'combat')
      events.push({
        kind: 'encounter',
        name: before.combat!.enemies.map((e) => e.definitionId).join(' + '),
        metrics: {
          damage: after.combat!.damageTaken,
          turns: after.combat!.turn,
          won: Number(after.phase !== 'lost'),
          act: after.act,
          ascension: after.ascension,
        },
      });
    if (command.type === 'chooseNode')
      events.push({
        kind: 'action',
        name: `Room: ${after.phase}`,
        metrics: { hp: after.hp, gold: after.gold },
      });
    if (['buy', 'rest', 'event', 'removeCard', 'potion', 'discardPotion'].includes(command.type))
      events.push({
        kind: 'action',
        name: JSON.stringify(command),
        metrics: { hp: after.hp, gold: after.gold },
      });
    return events;
  },
};
