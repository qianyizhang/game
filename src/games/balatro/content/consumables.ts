import { HANDS } from '../domain/poker';
import type { ConsumableDefinition, HandType } from '../domain/types';

const planets: [HandType, string, string][] = [
  ['high', 'Mercury', '☿'],
  ['pair', 'Venus', '♀'],
  ['twoPair', 'Earth', '⊕'],
  ['three', 'Mars', '♂'],
  ['straight', 'Jupiter', '♃'],
  ['flush', 'Saturn', '♄'],
  ['fullHouse', 'Uranus', '♅'],
  ['four', 'Neptune', '♆'],
  ['straightFlush', 'Pluto', '♇'],
];

export const CONSUMABLES: ConsumableDefinition[] = [
  ...planets.map(([hand, name, symbol]): ConsumableDefinition => ({
    id: `planet-${hand}`,
    name,
    symbol,
    price: 3,
    targets: 0,
    effect: { type: 'level', hand },
    description: `Level up ${HANDS[hand].name}: +${HANDS[hand].chipGain} chips, +${HANDS[hand].multGain} mult.`,
  })),
  {
    id: 'bonus',
    name: 'The Artisan',
    symbol: '✦',
    price: 4,
    targets: 1,
    effect: { type: 'enhance', enhancement: 'bonus' },
    description: 'Enhance one selected card: +30 chips when scored.',
  },
  {
    id: 'mult',
    name: 'The Lantern',
    symbol: '☀',
    price: 4,
    targets: 1,
    effect: { type: 'enhance', enhancement: 'mult' },
    description: 'Enhance one selected card: +4 mult when scored.',
  },
  {
    id: 'glass',
    name: 'The Mirror',
    symbol: '◈',
    price: 4,
    targets: 1,
    effect: { type: 'enhance', enhancement: 'glass' },
    description:
      'Enhance one selected card: ×2 mult when scored; 25% chance to break after the hand.',
  },
  {
    id: 'steel',
    name: 'The Anvil',
    symbol: '⚒',
    price: 4,
    targets: 1,
    effect: { type: 'enhance', enhancement: 'steel' },
    description: 'Enhance one selected card: ×1.5 mult while held, not played.',
  },
  {
    id: 'garden',
    name: 'The Garden',
    symbol: '♥',
    price: 4,
    targets: 2,
    effect: { type: 'suit', suit: 'hearts' },
    description: 'Change one or two selected cards to hearts.',
  },
  {
    id: 'rank',
    name: 'The Ladder',
    symbol: '↑',
    price: 4,
    targets: 2,
    effect: { type: 'rank' },
    description: 'Increase one or two selected ranks by one. Ace wraps to 2.',
  },
  {
    id: 'destroy',
    name: 'The Eraser',
    symbol: '⌫',
    price: 4,
    targets: 2,
    effect: { type: 'destroy' },
    description: 'Permanently remove one or two selected cards. Keep at least five in the deck.',
  },
  {
    id: 'copy',
    name: 'The Twin',
    symbol: '⧉',
    price: 5,
    targets: 1,
    effect: { type: 'copy' },
    description: 'Create a permanent copy of one selected card. It joins the next blind.',
  },
  {
    id: 'wild',
    name: 'The Rainbow',
    symbol: '◌',
    price: 4,
    targets: 1,
    effect: { type: 'enhance', enhancement: 'wild' },
    description: 'Enhance one selected card to count as every suit.',
  },
];

export const CONSUMABLE_BY_ID = Object.fromEntries(
  CONSUMABLES.map((item) => [item.id, item]),
) as Record<string, ConsumableDefinition>;
