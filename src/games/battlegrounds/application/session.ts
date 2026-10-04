import { hearthEvidence } from './evidence';
import { replayCodec } from '../../../shared/replay';
import { BG_VERSION, createBG, transitionBG } from '../domain/game';
import { isBGCommand } from '../domain/commands';
export { isBGCommand } from '../domain/commands';
import { hearthScenario } from './scenario';
import { pins } from '../../../shared/contentPack';
import { hearthPacks } from '../../../mods/hearth';
import { MINIONS, HEROES } from '../content/minions';

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
