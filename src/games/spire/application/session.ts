import { isSpireCommand } from '../domain/commands';
export { isSpireCommand } from '../domain/commands';
import { spireEvidence } from './evidence';
import { replayCodec } from '../../../shared/replay';
import { createSpire, SPIRE_VERSION, transitionSpire } from '../domain/game';
import { spireScenario } from './scenario';
import { pins } from '../../../shared/contentPack';
import { spirePacks } from '../../../mods/spire';
import { CARDS } from '../content/cards';
import { ENEMIES, RELICS, POTIONS } from '../content/world';

export const spireSession = replayCodec({
  evidence: spireEvidence,
  game: 'slay-the-spire',
  version: SPIRE_VERSION,
  content: pins(
    { cards: CARDS, enemies: ENEMIES, relics: RELICS, potions: POTIONS },
    spirePacks,
    SPIRE_VERSION,
  ),
  create: createSpire,
  createPractice: spireScenario,
  transition: transitionSpire,
  isCommand: isSpireCommand,
});
