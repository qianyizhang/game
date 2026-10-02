import type { ContentPack } from '../shared/contentPack';
import type { JokerDefinition } from '../games/balatro/domain/types';

export const blindsidePacks: ContentPack<{ jokers: JokerDefinition[] }>[] = [
  {
    id: 'workshop.poker-examples',
    name: 'Deliberate discards',
    version: '1.0.0',
    enabled: false,
    description:
      'Experiment with rewarding conserved discards. Reorder the Joker and inspect the score trace.',
    source: 'src/mods/blindside.ts',
    content: {
      jokers: [
        {
          id: 'workshop:patience',
          name: 'Patience',
          description: '+3 Mult per remaining discard.',
          family: 'Resources',
          rarity: 'common',
          price: 5,
          symbol: '◷',
          onHand: ({ run }) => ({ mult: 3 * run.discardsLeft }),
        },
      ],
    },
  },
];
