import { replayCodec } from '../../../shared/replay';
import type { Challenge } from '../../../shared/challenges';
import { spireSession } from './session';
import { spireScenario } from './scenario';
import { transitionSpire } from '../domain/game';
import { CARD_BY_ID } from '../content/cards';
import type { SpireCommand, SpireState } from '../domain/types';

export const poisonChallenge: Challenge<SpireState, SpireCommand> = {
  id: 'spire-artifact',
  revision: 2,
  game: 'spire',
  gameName: 'Slay the Spire',
  title: 'One layer of protection',
  objective:
    'Survive the next enemy turn at 70 HP, with at least 14 Poison remaining on the Sentry.',
  introduction:
    'The Sentry has one Artifact and intends to deal 9 damage. You have three Energy, five cards, and Oddly Smooth Stone (+1 Dexterity). Make this turn count.',
  constraints:
    'A prepared second turn: the Sentry has already added Dazed. Play this turn, then resolve its Beam. No potions.',
  seed: 'CHALLENGE-SPIRE-5',
  codec: replayCodec(
    {
      ...spireSession.rules,
      game: 'slay-the-spire-artifact',
      createPractice: undefined,
      create: (seed) => {
        const initial = spireScenario(seed, {
          character: 'silent',
          deck: ['neutralize', 'deadlyPoison', 'catalyst', 'defend', 'strike'],
          upgrades: ['catalyst', 'defend'],
          relics: ['oddlySmoothStone'],
          enemies: ['sentry'],
          hp: 70,
        });
        // Reconstruct the visible Beam turn through a legal transition; do not overwrite enemy intent.
        const prepared = transitionSpire(initial, { type: 'endTurn' });
        if (prepared.error) throw new Error(prepared.error);
        return prepared.state;
      },
    },
    true,
  ),
  hints: [
    'Artifact consumes the first debuff application. Which card can remove it without spending Energy?',
    'Poison needs to land before Catalyst+ triples it. Defend+ and your Dexterity provide exactly 9 Block for the Beam.',
  ],
  explanation:
    'Neutralize removes Artifact with its Weak application for 0 Energy. Deadly Poison then applies 5 Poison; Catalyst+ triples it to 15. Defend+ gives 8 + 1 = 9 Block. At the start of the enemy turn Poison deals 15 damage and drops to 14, then Block absorbs the Beam. Spending Poison on Artifact or multiplying before applying Poison breaks the sequence.',
  allowed: (_, command) =>
    ['playCard', 'chooseCard', 'endTurn'].includes(command.type)
      ? undefined
      : 'Use the cards in hand, then end this turn.',
  evaluate: (state) => {
    const poison = state.combat?.enemies[0]?.status.poison ?? 0;
    const resolved = state.phase !== 'combat' || (state.combat?.turn ?? 2) > 2;
    return {
      status: !resolved ? 'active' : state.hp === 70 && poison >= 14 ? 'cleared' : 'not-yet',
      summary: resolved
        ? `${state.hp} HP and ${poison} Poison remain after the enemy response.`
        : 'The goal is checked after the Sentry takes its turn.',
      metrics: { 'HP remaining': state.hp, 'Poison remaining': poison, 'HP lost': 70 - state.hp },
    };
  },
  describe: (before, command, after) => ({
    label:
      command.type === 'playCard'
        ? `Play ${CARD_BY_ID[before.combat!.cards[command.id].definitionId].name}${before.combat!.cards[command.id].upgraded ? '+' : ''}`
        : command.type === 'endTurn'
          ? 'End turn · resolve the Sentry'
          : 'Choose a card',
    events: after.resolution.frames.map(
      (frame) => `${frame.source}: ${frame.detail}${frame.formula ? ` · ${frame.formula}` : ''}`,
    ),
  }),
};
