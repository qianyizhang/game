import type { JokerDefinition } from '../domain/types';

/** Night Market: held enhancements, varied decks, and two ways to spend your money. */
export const NIGHT_MARKET_JOKERS: JokerDefinition[] = [
  {
    id: 'velvetpurse',
    name: 'Velvet Purse',
    symbol: '◈',
    family: 'Held cards',
    rarity: 'common',
    price: 5,
    description: 'Each Gold card held in hand gives +25 chips.',
    onHeld: (_, card) => (card.enhancement === 'gold' ? { chips: 25 } : undefined),
  },
  {
    id: 'filigree',
    name: 'Silver Filigree',
    symbol: '❧',
    family: 'Held cards',
    rarity: 'uncommon',
    price: 6,
    description: 'Each Steel card held in hand gives +4 mult after its own multiplier.',
    onHeld: (_, card) => (card.enhancement === 'steel' ? { mult: 4 } : undefined),
  },
  {
    id: 'nightjar',
    name: 'Nightjar',
    symbol: '☾',
    family: 'Held cards',
    rarity: 'uncommon',
    price: 7,
    description: '×2 mult if exactly one face card remains held in hand.',
    onHand: (c) =>
      c.held.filter((card) => card.rank >= 11 && card.rank <= 13).length === 1
        ? { factor: 2 }
        : undefined,
  },
  {
    id: 'prism',
    name: 'Prism Cabinet',
    symbol: '◇',
    family: 'Deck shaping',
    rarity: 'rare',
    price: 8,
    description:
      '×2 mult if scored cards have at least three different enhancements. Plain does not count.',
    onHand: (c) =>
      new Set(
        c.scored.filter((card) => card.enhancement !== 'plain').map((card) => card.enhancement),
      ).size >= 3
        ? { factor: 2 }
        : undefined,
  },
  {
    id: 'gildedloom',
    name: 'Gilded Loom',
    symbol: '▥',
    family: 'Deck shaping',
    rarity: 'common',
    price: 6,
    description: '+90 chips if your deck contains at least 12 enhanced cards.',
    onHand: (c) =>
      c.run.deck.filter((card) => card.enhancement !== 'plain').length >= 12
        ? { chips: 90 }
        : undefined,
  },
  {
    id: 'emptypockets',
    name: 'Empty Pockets',
    symbol: '♧',
    family: 'Economy',
    rarity: 'common',
    price: 5,
    description: '+24 mult while you have $5 or less.',
    onHand: (c) => (c.run.cash <= 5 ? { mult: 24 } : undefined),
  },
  {
    id: 'moonledger',
    name: 'Moon Ledger',
    symbol: '☽',
    family: 'Economy',
    rarity: 'uncommon',
    price: 6,
    description:
      'At blind payout, earn $1 per $10 held, up to $6. Calculated before payout and interest.',
    income: (run) => Math.min(6, Math.floor(run.cash / 10)),
  },
  {
    id: 'receiptribbon',
    name: 'Receipt Ribbon',
    symbol: '〰',
    family: 'Economy',
    rarity: 'common',
    price: 5,
    description: '+2 chips per dollar paid for your currently owned Jokers, up to +100 chips.',
    onHand: (c) => ({
      chips: Math.min(100, 2 * c.run.jokers.reduce((sum, joker) => sum + joker.paid, 0)),
    }),
  },
];
