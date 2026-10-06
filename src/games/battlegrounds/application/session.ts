import { hearthEvidence } from './evidence';
import { replayCodec } from '../../../shared/replay';
import { BG_VERSION, createBG, transitionBG } from '../domain/game';
import { isBGCommand } from '../domain/commands';
export { isBGCommand } from '../domain/commands';
import { hearthScenario } from './scenario';
import { pins } from '../../../shared/contentPack';
import { hearthPacks } from '../../../mods/hearth';
import { MINIONS, HEROES } from '../content/minions';
import { TAVERN_SPELLS } from '../content/spells';

export const bgSession = replayCodec({
  evidence: hearthEvidence,
  game: 'last-hearth',
  version: BG_VERSION,
  content: pins(
    { minions: MINIONS, heroes: HEROES, spells: TAVERN_SPELLS },
    hearthPacks,
    BG_VERSION,
  ),
  create: (seed) => createBG(seed),
  createPractice: hearthScenario,
  transition: transitionBG,
  isCommand: isBGCommand,
});

/** Explicit historical study codec. Current UI never selects or migrates this save key. */
export const bgSessionV5 = replayCodec({
  game: 'last-hearth',
  version: 5,
  content: pins({ minions: MINIONS, heroes: HEROES }, hearthPacks, 5),
  create: (seed) => createBG(seed, 5),
  transition: transitionBG,
  isCommand: isBGCommand,
});
