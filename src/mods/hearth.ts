import type { ContentPack } from '../shared/contentPack';
import type { HeroDefinition, MinionDefinition } from '../games/battlegrounds/domain/types';

export const hearthPacks: ContentPack<{ minions: MinionDefinition[]; heroes: HeroDefinition[] }>[] =
  [
    {
      id: 'workshop.hearth-examples',
      name: 'A growing warband',
      version: '2.0.0',
      enabled: false,
      description: 'A tier-two Beast and a hero whose power strengthens the whole board.',
      source: 'src/mods/hearth.ts',
      content: {
        minions: [
          {
            id: 'workshop:groveCub',
            name: 'Grove Cub',
            symbol: '♧',
            tier: 2,
            tribe: 'beast',
            attack: 2,
            health: 3,
            text: 'At the end of recruitment, gain +1/+1.',
            endTurn: { type: 'self', attack: 1, health: 1 },
          },
        ],
        heroes: [
          {
            id: 'workshop:gardener',
            name: 'The Gardener',
            symbol: '❦',
            text: '2 gold: give your warband +1 Health. Once per round.',
            cost: 2,
            ability: { type: 'buff', target: 'board', attack: 0, health: 1 },
          },
        ],
      },
    },
  ];
