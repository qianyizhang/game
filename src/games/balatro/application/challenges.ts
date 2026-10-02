import { replayCodec } from '../../../shared/replay';
import type { Challenge } from '../../../shared/challenges';
import { blindsideSession } from './session';
import { JOKER_BY_ID } from '../content/jokers';
import { rankLabel } from '../domain/poker';
import type { Command, RunState } from '../domain/types';

export const jokerOrderChallenge: Challenge<RunState, Command> = {
  id: 'blindside-order',
  revision: 1,
  game: 'balatro',
  gameName: 'Blindside',
  title: 'The last multiplier',
  objective: 'Score at least 200 points by playing exactly one card.',
  introduction:
    'Eight cards, two Jokers, one hand. Choose your card and arrange the Jokers before you commit.',
  constraints:
    'You may reorder Jokers and play one card. No discards, sales or purchases. Cash stays at $25.',
  seed: 'CHALLENGE-ORDER',
  setup: {
    cash: 25,
    jokers: ['bankroll', 'spark'],
    deck: [2, 4, 6, 8, 10, 11, 12, 14].map((rank, i) => ({
      rank,
      suit: ['hearts', 'clubs', 'diamonds', 'spades'][i % 4],
    })),
  },
  codec: replayCodec(blindsideSession.rules, true),
  hints: [
    'Jokers resolve from left to right. Adding Mult before multiplying it changes the final total.',
    'An Ace contributes 11 chips. High Card starts at 5 chips × 1 Mult. Spark adds 4 Mult; Nest Egg multiplies it by 2.5.',
  ],
  explanation:
    'With an Ace, High Card gives 5 + 11 = 16 chips. Spark then Nest Egg makes (1 + 4) × 2.5 = 12.5 Mult, scoring 200. Reversing those Jokers makes 1 × 2.5 + 4 = 6.5 Mult, scoring 104. The ordering lesson applies whenever an addition and a multiplier share a scoring stage.',
  allowed: (_, command) =>
    command.type === 'moveJoker' || (command.type === 'play' && command.cards.length === 1)
      ? undefined
      : 'This puzzle allows Joker reordering and a single-card play only.',
  evaluate: (state) => ({
    status: state.lastScore ? (state.lastScore.total >= 200 ? 'cleared' : 'not-yet') : 'active',
    summary: state.lastScore
      ? `${state.lastScore.total} points from your one-card hand. Goal: 200.`
      : 'Arrange your Jokers, select one card, then play.',
    metrics: {
      'Score (points)': state.lastScore?.total ?? '—',
      Chips: state.lastScore?.chips ?? '—',
      Mult: state.lastScore?.mult ?? '—',
    },
  }),
  describe: (before, command, after) =>
    command.type === 'moveJoker'
      ? {
          label: `Move ${JOKER_BY_ID[before.jokers.find((j) => j.id === command.id)!.definitionId].name} ${command.direction < 0 ? 'left' : 'right'}`,
          events: [after.jokers.map((j) => JOKER_BY_ID[j.definitionId].name).join(' → ')],
        }
      : {
          label:
            command.type === 'play'
              ? `Play ${command.cards
                  .map((id) => {
                    const card = before.deck.find((c) => c.id === id)!;
                    return `${rankLabel(card.rank)} of ${card.suit}`;
                  })
                  .join(', ')}`
              : command.type,
          events:
            after.lastScore?.steps.map(
              (step) => `${step.source}: ${step.detail} · ${step.chips} chips × ${step.mult} Mult`,
            ) ?? [],
        },
};
