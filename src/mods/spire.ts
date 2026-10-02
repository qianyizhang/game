import type { ContentPack } from '../shared/contentPack';
import type { CardDefinition, EnemyDefinition, RelicDefinition } from '../games/spire/domain/types';

/** Edit here, enable the pack, then start a fresh run. Content checksums pin every replay. */
export const spirePacks: ContentPack<{
  cards: CardDefinition[];
  enemies: EnemyDefinition[];
  relics: RelicDefinition[];
}>[] = [
  {
    id: 'workshop.spire-examples',
    name: 'Spire experiments',
    version: '1.0.0',
    enabled: false,
    description:
      'A defensive attack, a small starter shield, and a readable two-move practice enemy.',
    source: 'src/mods/spire.ts',
    content: {
      cards: [
        {
          id: 'workshop:riposte',
          name: 'Measured Riposte',
          character: 'ironclad',
          kind: 'attack',
          cost: 1,
          rarity: 'common',
          symbol: '†',
          family: 'Defense',
          target: true,
          text: 'Gain 4 Block. Deal 5 damage.',
          upgradeText: 'Gain 6 Block. Deal 8 damage.',
          effects: [
            { type: 'block', amount: 4 },
            { type: 'damage', amount: 5 },
          ],
          upgradedEffects: [
            { type: 'block', amount: 6 },
            { type: 'damage', amount: 8 },
          ],
        },
      ],
      relics: [
        {
          id: 'workshop:practiceShield',
          name: 'Practice Shield',
          symbol: '⬡',
          rarity: 'common',
          text: 'Start each combat with 3 Block.',
          startBlock: 3,
        },
      ],
      enemies: [
        {
          id: 'workshop:sparringPartner',
          name: 'Sparring Partner',
          symbol: '♙',
          hp: 50,
          act: 1,
          kind: 'normal',
          description: 'Alternates a 6-damage strike with 5 Block. Use its quiet turn to prepare.',
          intents: [
            { name: 'Measured Strike', effects: [{ type: 'damage', amount: 6 }] },
            { name: 'Guard', effects: [{ type: 'block', amount: 5 }] },
          ],
        },
      ],
    },
  },
];
