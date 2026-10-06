import { HEROES } from '../content/minions';
import type { BGCommand } from './types';

export function isBGCommand(value: unknown): value is BGCommand {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  const id = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length < 100;
  switch (c.type) {
    case 'chooseHero':
      return HEROES.some((h) => h.id === c.hero);
    case 'buy':
    case 'buySpell':
    case 'sell':
    case 'discover':
      return id(c.id);
    case 'play':
      return (
        id(c.id) &&
        Number.isInteger(c.position) &&
        Number(c.position) >= 0 &&
        Number(c.position) <= 6 &&
        (c.target === undefined || id(c.target))
      );
    case 'move':
      return id(c.id) && (c.direction === -1 || c.direction === 1);
    case 'power':
      return c.target === undefined || id(c.target);
    case 'castSpell':
      return id(c.id) && (c.target === undefined || id(c.target));
    case 'refresh':
    case 'freeze':
    case 'upgrade':
    case 'endRecruit':
    case 'nextRound':
      return true;
    default:
      return false;
  }
}
