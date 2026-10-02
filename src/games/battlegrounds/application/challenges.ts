import { replayCodec } from '../../../shared/replay';
import type { Challenge } from '../../../shared/challenges';
import { bgSession } from './session';
import { MINION_BY_ID } from '../content/minions';
import {
  createPositioning,
  transitionPositioning,
  isPositioningCommand,
  type PositioningCommand,
  type PositioningState,
} from '../domain/challenge';

export const positioningChallenge: Challenge<PositioningState, PositioningCommand> = {
  id: 'hearth-position',
  revision: 1,
  game: 'battlegrounds',
  gameName: 'Last Hearth',
  title: 'Make room for the Cub',
  objective: 'Win this battle by changing only your warband order. A tie does not clear the goal.',
  introduction:
    'Pack Caller, Briar Stray and Scrap Harvester face a fully revealed warband. Choose who attacks first and which effects need to survive.',
  constraints:
    'Reorder your three minions, then fight once. Both sides are tier 2. Every retry uses the same combat seed; this is one outcome, not a win-rate estimate.',
  seed: 'CHALLENGE-HEARTH',
  codec: replayCodec(
    {
      game: 'hearth-positioning',
      version: 1,
      content: bgSession.rules.content,
      create: createPositioning,
      transition: transitionPositioning,
      isCommand: isPositioningCommand,
    },
    true,
  ),
  hints: [
    'Attacks cycle from left to right, and the enemy Hearth Squire draws attacks with Taunt. Think about the first trade.',
    'A living Pack Caller buffs the Cub summoned by Briar Stray. Try letting a Deathrattle minion attack before the Caller.',
  ],
  explanation:
    'Briar Stray can summon a Cub; a surviving Pack Caller gives that Beast +2 Attack. Scrap Harvester supplies another body through its Deathrattle. Moving the fragile Caller out of the first attack changes the trades and which support survives. Inspect the combat events to see what happened in this fixed battle. A different opponent or random seed can change the result.',
  allowed: () => undefined,
  evaluate: (state) => ({
    status: !state.result ? 'active' : state.result.winner === 0 ? 'cleared' : 'not-yet',
    summary: !state.result
      ? 'Reorder the warband, then resolve the battle.'
      : state.result.winner === 0
        ? 'Your warband won this seeded battle.'
        : state.result.winner === 1
          ? 'The opposing warband won this seeded battle.'
          : 'Both warbands tied. Try a different attack order.',
    metrics: {
      'Battle result': !state.result
        ? '—'
        : state.result.winner === 0
          ? 'Win'
          : state.result.winner === 1
            ? 'Loss'
            : 'Tie',
      Survivors: state.result?.boards[0].length ?? '—',
      'Damage dealt': state.result?.damage[1] ?? '—',
    },
  }),
  describe: (before, command, after) =>
    command.type === 'move'
      ? {
          label: `Move ${MINION_BY_ID[before.board.find((unit) => unit.id === command.id)!.definitionId].name} ${command.direction < 0 ? 'left' : 'right'}`,
          events: [after.board.map((unit) => MINION_BY_ID[unit.definitionId].name).join(' → ')],
        }
      : {
          label: 'Fight · resolve the warbands',
          events: after.result?.frames.map((frame) => frame.text) ?? [],
        },
};
