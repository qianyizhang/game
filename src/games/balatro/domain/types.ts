export const SUITS = ['spades', 'hearts', 'clubs', 'diamonds'] as const;
export type Suit = (typeof SUITS)[number];
export type Enhancement = 'plain' | 'bonus' | 'mult' | 'glass' | 'steel' | 'gold' | 'wild';
export interface Card {
  id: string;
  rank: number;
  suit: Suit;
  enhancement: Enhancement;
}
export type HandType =
  | 'high'
  | 'pair'
  | 'twoPair'
  | 'three'
  | 'straight'
  | 'flush'
  | 'fullHouse'
  | 'four'
  | 'straightFlush'
  | 'five'
  | 'flushHouse'
  | 'flushFive';
export interface PokerHand {
  type: HandType;
  scoringIds: string[];
  hasPair: boolean;
  hasThree: boolean;
  hasFour: boolean;
  hasStraight: boolean;
  hasFlush: boolean;
}
export interface OwnedJoker {
  id: string;
  definitionId: string;
  growth: number;
  paid: number;
}
export interface OwnedConsumable {
  id: string;
  definitionId: string;
  paid: number;
}
export interface Offer {
  id: string;
  kind: 'joker' | 'consumable';
  definitionId: string;
  price: number;
}
export interface ScoreEffect {
  chips?: number;
  mult?: number;
  factor?: number;
  cash?: number;
}
export interface ScoreStep {
  source: string;
  detail: string;
  chips: number;
  mult: number;
  cash: number;
}
export interface ScoreResult {
  poker: PokerHand;
  chips: number;
  mult: number;
  total: number;
  cash: number;
  steps: ScoreStep[];
  scoredIds: string[];
  blocked: boolean;
}
export interface ScoreContext {
  run: Readonly<RunState>;
  played: Card[];
  scored: Card[];
  held: Card[];
  poker: PokerHand;
}
export interface JokerDefinition {
  id: string;
  name: string;
  description: string;
  family: string;
  rarity: 'common' | 'uncommon' | 'rare';
  price: number;
  symbol: string;
  onCard?: (context: ScoreContext, card: Card, joker: OwnedJoker) => ScoreEffect | undefined;
  onHeld?: (context: ScoreContext, card: Card, joker: OwnedJoker) => ScoreEffect | undefined;
  onHand?: (context: ScoreContext, joker: OwnedJoker) => ScoreEffect | undefined;
  grow?: (context: ScoreContext) => number;
  income?: (run: Readonly<RunState>, joker: OwnedJoker) => number;
  rule?: 'allScore' | 'repeatLow' | 'extraHand' | 'extraDiscard' | 'extraCard';
}
export interface ConsumableDefinition {
  id: string;
  name: string;
  description: string;
  symbol: string;
  price: number;
  effect:
    | { type: 'level'; hand: HandType }
    | { type: 'enhance'; enhancement: Enhancement }
    | { type: 'suit'; suit: Suit }
    | { type: 'rank' }
    | { type: 'destroy' }
    | { type: 'copy' };
  targets: number;
}
export interface BossDefinition {
  id: string;
  name: string;
  description: string;
  symbol: string;
}
export type Phase = 'ready' | 'playing' | 'shop' | 'pack' | 'won' | 'lost';
export type PackChoice =
  | { id: string; kind: 'joker' | 'planet'; definitionId: string }
  | { id: string; kind: 'card'; card: Card };
export interface OpenPack {
  definitionId: string;
  choices: PackChoice[];
  remaining: number;
  returnTo: 'ready' | 'shop';
  paid: number;
}
export interface SkipTag {
  id: 'investment' | 'economy' | 'orbital' | 'buffoon';
  hand: HandType;
}
export interface RunState {
  version: number;
  seed: string;
  rng: number;
  nextId: number;
  phase: Phase;
  ante: number;
  blind: number;
  bossIds: string[];
  target: number;
  roundScore: number;
  cash: number;
  handsLeft: number;
  discardsLeft: number;
  handsPlayed: number;
  deck: Card[];
  hand: string[];
  draw: string[];
  discard: string[];
  jokers: OwnedJoker[];
  consumables: OwnedConsumable[];
  levels: Record<HandType, number>;
  shop: Offer[];
  packs: { id: string; definitionId: string; price: number }[];
  pack: OpenPack | null;
  vouchers: string[];
  voucherOffer: string | null;
  voucherAnte: number;
  skipTags: SkipTag[];
  tags: string[];
  rerolls: number;
  firstHandType: HandType | null;
  lastScore: ScoreResult | null;
  notice: string;
  history: string[];
}
export type Command =
  | { type: 'skipBlind' }
  | { type: 'buyPack'; id: string }
  | { type: 'choosePack'; id: string }
  | { type: 'skipPack' }
  | { type: 'buyVoucher' }
  | { type: 'startBlind' }
  | { type: 'play'; cards: string[] }
  | { type: 'discard'; cards: string[] }
  | { type: 'buy'; offerId: string }
  | { type: 'sellJoker'; id: string }
  | { type: 'sellConsumable'; id: string }
  | { type: 'moveJoker'; id: string; direction: -1 | 1 }
  | { type: 'moveCard'; id: string; direction: -1 | 1 }
  | { type: 'sortHand'; by: 'rank' | 'suit' }
  | { type: 'reroll' }
  | { type: 'leaveShop' }
  | { type: 'useConsumable'; id: string; cards: string[] };
export interface Transition {
  state: RunState;
  error?: string;
}
