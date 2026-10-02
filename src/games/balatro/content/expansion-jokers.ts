import type { JokerDefinition } from '../domain/types';

type Draft = Omit<JokerDefinition, 'rarity' | 'price'> &
  Partial<Pick<JokerDefinition, 'rarity' | 'price'>>;
const joker = (definition: Draft): JokerDefinition => ({
  rarity: 'common',
  price: 5,
  ...definition,
});

/** More build paths using the existing scoring hooks; no additional rule machinery. */
export const EXPANSION_JOKERS: JokerDefinition[] = [
  joker({
    id: 'observatory',
    name: 'Observatory',
    symbol: '☾',
    family: 'Held cards',
    rarity: 'uncommon',
    price: 7,
    description: 'Each Ace held in hand gives ×1.3 mult.',
    onHeld: (_, card) => (card.rank === 14 ? { factor: 1.3 } : undefined),
  }),
  joker({
    id: 'locket',
    name: 'Royal Locket',
    symbol: '♔',
    family: 'Held cards',
    description: 'Each King held in hand gives +5 mult.',
    onHeld: (_, card) => (card.rank === 13 ? { mult: 5 } : undefined),
  }),
  joker({
    id: 'harlequin',
    name: 'Harlequin',
    symbol: '◈',
    family: 'Suits',
    description:
      '+16 mult if scored cards show at least three different printed suits. Wild cards count as their printed suit.',
    onHand: (c) =>
      new Set(c.scored.map((card) => card.suit)).size >= 3 ? { mult: 16 } : undefined,
  }),
  joker({
    id: 'undertow',
    name: 'Undertow',
    symbol: '⚓',
    family: 'Held cards',
    description: '+60 chips while at least four cards remain held in hand.',
    onHand: (c) => (c.held.length >= 4 ? { chips: 60 } : undefined),
  }),
  joker({
    id: 'hourglass',
    name: 'Hourglass',
    symbol: '⌛',
    family: 'Resources',
    rarity: 'uncommon',
    price: 7,
    description: '×2.5 mult when no discards remain.',
    onHand: (c) => (c.run.discardsLeft === 0 ? { factor: 2.5 } : undefined),
  }),
  joker({
    id: 'sundial',
    name: 'Sundial',
    symbol: '☀',
    family: 'Resources',
    description: '+100 chips on the first hand played in each blind.',
    onHand: (c) => (c.run.handsPlayed === 0 ? { chips: 100 } : undefined),
  }),
  joker({
    id: 'mosaic',
    name: 'Mosaic',
    symbol: '▧',
    family: 'Deck shaping',
    description: 'Each scored enhanced card gives +4 mult.',
    onCard: (_, card) => (card.enhancement !== 'plain' ? { mult: 4 } : undefined),
  }),
  joker({
    id: 'glassblower',
    name: 'Glassblower',
    symbol: '♧',
    family: 'Deck shaping',
    rarity: 'rare',
    price: 8,
    description: '×1 mult, plus ×0.25 per Glass card in your deck.',
    onHand: (c) => ({
      factor: 1 + c.run.deck.filter((card) => card.enhancement === 'glass').length / 4,
    }),
  }),
  joker({
    id: 'orchard',
    name: 'Orchard',
    symbol: '❦',
    family: 'Economy',
    description: 'Each scored 7 gives +10 chips and earns $1.',
    onCard: (_, card) => (card.rank === 7 ? { chips: 10, cash: 1 } : undefined),
  }),
  joker({
    id: 'compass',
    name: 'Compass',
    symbol: '✥',
    family: 'Ranks',
    description: '+14 mult when at least three cards are played and every played card is a 2–10.',
    onHand: (c) =>
      c.played.length >= 3 && c.played.every((card) => card.rank <= 10) ? { mult: 14 } : undefined,
  }),
  joker({
    id: 'encore',
    name: 'Encore',
    symbol: '↶',
    family: 'Resources',
    description: '+1 discard at the start of each blind.',
    rule: 'extraDiscard',
  }),
  joker({
    id: 'palimpsest',
    name: 'Palimpsest',
    symbol: '✒',
    family: 'Small hands',
    rarity: 'uncommon',
    price: 6,
    description: 'Starts at +20 chips. Gains +20 chips after each scoring High Card hand.',
    onHand: (_, j) => ({ chips: 20 + j.growth }),
    grow: (c) => (c.poker.type === 'high' ? 20 : 0),
  }),
];
