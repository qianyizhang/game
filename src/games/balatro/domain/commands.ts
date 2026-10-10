import type { Command } from './types';

export function validCommand(value: unknown): value is Command {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  const ids = (v: unknown) =>
    Array.isArray(v) && v.length <= 5 && v.every((id) => typeof id === 'string' && id.length < 80);
  switch (c.type) {
    case 'skipBlind':
    case 'skipPack':
    case 'buyVoucher':
    case 'startBlind':
    case 'reroll':
    case 'leaveShop':
      return true;
    case 'play':
    case 'discard':
      return ids(c.cards);
    case 'buy':
      return typeof c.offerId === 'string';
    case 'buyPack':
    case 'choosePack':
    case 'sellJoker':
    case 'sellConsumable':
      return typeof c.id === 'string';
    case 'moveJoker':
    case 'moveCard':
      return typeof c.id === 'string' && (c.direction === -1 || c.direction === 1);
    case 'sortHand':
      return c.by === 'rank' || c.by === 'suit';
    case 'useConsumable':
      return typeof c.id === 'string' && ids(c.cards);
    default:
      return false;
  }
}
