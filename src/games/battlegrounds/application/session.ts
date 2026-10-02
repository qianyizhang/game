import { hearthEvidence } from './evidence';
import { replayCodec } from '../../../shared/replay';
import { BG_VERSION, createBG, transitionBG } from '../domain/game';
import type { BGCommand } from '../domain/types';
import { hearthScenario } from './scenario';
import { pins } from '../../../shared/contentPack';
import { hearthPacks } from '../../../mods/hearth';
import { MINIONS, HEROES } from '../content/minions';

export function isBGCommand(value: unknown): value is BGCommand {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  const id = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length < 100;
  switch (c.type) {
    case 'chooseHero':
      return HEROES.some((h) => h.id === c.hero);
    case 'buy':
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
export const bgSession = replayCodec({
  evidence: hearthEvidence,
  game: 'last-hearth',
  version: BG_VERSION,
  content: pins({ minions: MINIONS, heroes: HEROES }, hearthPacks, BG_VERSION),
  create: createBG,
  createPractice: hearthScenario,
  transition: transitionBG,
  isCommand: isBGCommand,
});
