import type { Observer, EvidenceEvent } from '../../../shared/evidence/types';
import type { BGState, BGCommand } from '../domain/types';
export const hearthEvidence: Observer<BGState, BGCommand> = {
  summary: (s) => ({
    outcome: s.phase === 'won' || s.phase === 'lost' ? s.phase : 'active',
    context: s.players[0].hero,
    metrics: {
      round: s.round,
      hp: s.players[0].hp,
      tier: s.players[0].tier,
      placement: s.players[0].placement ?? 0,
    },
  }),
  events: (before, command, after) => {
    const events: EvidenceEvent[] = [],
      player = before.players[0];
    if (command.type === 'buy' || command.type === 'discover') {
      const options = command.type === 'buy' ? player.shop : player.discover;
      events.push({
        kind: 'pick',
        name: command.type,
        offered: options.map((u) => u.definitionId),
        choice: options.find((u) => u.id === command.id)!.definitionId,
      });
    }
    if (command.type === 'refresh')
      events.push({
        kind: 'skip',
        name: 'Refresh shop',
        offered: player.shop.map((u) => u.definitionId),
      });
    if (command.type === 'buySpell')
      events.push({
        kind: 'pick',
        name: 'Tavern spell',
        offered: [player.tavern!.offer!.definitionId],
        choice: player.tavern!.offer!.definitionId,
      });
    if (command.type === 'castSpell')
      events.push({
        kind: 'action',
        name: `Cast ${player.tavern!.hand.find((s) => s.id === command.id)!.definitionId}`,
        metrics: { gold: after.players[0].gold },
      });
    if (command.type === 'endRecruit')
      events.push({
        kind: 'encounter',
        name: `Round ${before.round}`,
        metrics: {
          damage: after.lastCombat?.damage[0] ?? 0,
          dealt: after.lastCombat?.damage[1] ?? 0,
          won: Number(after.lastCombat?.winner === 0),
          tie: Number(after.lastCombat?.winner === null),
          tier: player.tier,
        },
      });
    if (['upgrade', 'freeze', 'power', 'sell'].includes(command.type))
      events.push({
        kind: 'action',
        name: command.type,
        metrics: { gold: after.players[0].gold, tier: after.players[0].tier },
      });
    return events;
  },
};
