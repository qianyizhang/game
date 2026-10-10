import type { SpireCommand } from './types';

export function isSpireCommand(value: unknown): value is SpireCommand {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  const id = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length < 100;
  switch (c.type) {
    case 'configure':
      return (
        ['ironclad', 'silent'].includes(String(c.character)) &&
        Number.isInteger(c.ascension) &&
        Number(c.ascension) >= 0 &&
        Number(c.ascension) <= 5
      );
    case 'neow':
      return ['maxHp', 'lament', 'gold', 'bossSwap'].includes(String(c.choice));
    case 'chooseNode':
    case 'buy':
    case 'removeCard':
    case 'chooseCard':
      return id(c.id);
    case 'playCard':
      return id(c.id) && (c.target === undefined || id(c.target));
    case 'endTurn':
    case 'leaveShop':
      return true;
    case 'takeReward':
      return c.card === null || id(c.card);
    case 'bossRelic':
      return c.id === null || id(c.id);
    case 'takeTreasure':
      return c.skip === undefined || typeof c.skip === 'boolean';
    case 'rest':
      return ['heal', 'leave'].includes(String(c.choice)) || (c.choice === 'upgrade' && id(c.card));
    case 'event':
      return id(c.choice) && (c.card === undefined || id(c.card));
    case 'potion':
      return (
        Number.isInteger(c.index) &&
        Number(c.index) >= 0 &&
        Number(c.index) < 3 &&
        (c.target === undefined || id(c.target))
      );
    case 'discardPotion':
      return Number.isInteger(c.index) && Number(c.index) >= 0 && Number(c.index) < 3;
    default:
      return false;
  }
}
