import type { SpellDefinition } from '../domain/types';

/** Local workshop content: purchase once, then cast for free during recruitment. */
export const TAVERN_SPELLS: readonly SpellDefinition[] = [
  {
    id: 'pocket-change',
    name: 'Pocket Change',
    tier: 1,
    cost: 1,
    text: 'Gain 2 gold this round.',
    effect: { type: 'gold', amount: 2 },
  },
  {
    id: 'promissory-note',
    name: 'Promissory Note',
    tier: 1,
    cost: 1,
    text: 'Gain 3 extra gold at the start of your next recruitment. Surviving heroes only.',
    effect: { type: 'nextGold', amount: 3 },
  },
  {
    id: 'whetstone',
    name: 'Whetstone',
    tier: 1,
    cost: 1,
    text: 'Give a friendly minion +3 Attack permanently.',
    effect: { type: 'buff', zone: 'friendly', attack: 3, health: 0 },
  },
  {
    id: 'hearth-bread',
    name: 'Hearth Bread',
    tier: 1,
    cost: 1,
    text: 'Give a friendly minion +3 Health permanently.',
    effect: { type: 'buff', zone: 'friendly', attack: 0, health: 3 },
  },
  {
    id: 'guard-oath',
    name: 'Guard Oath',
    tier: 2,
    cost: 2,
    text: 'Give a friendly minion +1/+2 and Taunt permanently.',
    effect: { type: 'buff', zone: 'friendly', attack: 1, health: 2, keyword: 'taunt' },
  },
  {
    id: 'market-polish',
    name: 'Market Polish',
    tier: 2,
    cost: 2,
    text: 'Give every minion currently in your tavern +2/+2. Buffs stay on purchase or freeze; refreshing replaces them.',
    effect: { type: 'buff', zone: 'shop', attack: 2, health: 2 },
  },
  {
    id: 'recruit-coupon',
    name: 'Recruit Coupon',
    tier: 2,
    cost: 1,
    text: 'Your next minion purchase this round costs 1 gold. Coupons do not stack.',
    effect: { type: 'discount', amount: 2 },
  },
  {
    id: 'warband-banner',
    name: 'Warband Banner',
    tier: 3,
    cost: 3,
    text: 'Give your current warband +1/+1 permanently.',
    effect: { type: 'buff', zone: 'board', attack: 1, health: 1 },
  },
];
export const SPELL_BY_ID = Object.fromEntries(TAVERN_SPELLS.map((spell) => [spell.id, spell]));
