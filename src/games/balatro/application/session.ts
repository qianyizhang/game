import { validCommand } from '../domain/commands';
export { validCommand } from '../domain/commands';
import { blindsideEvidence } from './evidence';
import { replayCodec } from '../../../shared/replay';
import { createRun, RULES_VERSION, transition } from '../domain/game';
import { blindsideScenario } from './scenario';
import { pins } from '../../../shared/contentPack';
import { blindsidePacks } from '../../../mods/blindside';
import { JOKERS } from '../content/jokers';
import { CONSUMABLES } from '../content/consumables';
import { PACKS, VOUCHERS, TAGS } from '../content/shop';
import { BOSSES } from '../content/blinds';

export const blindsideSession = replayCodec({
  evidence: blindsideEvidence,
  game: 'blindside',
  version: RULES_VERSION,
  content: pins(
    {
      jokers: JOKERS,
      consumables: CONSUMABLES,
      bosses: BOSSES,
      packs: PACKS,
      vouchers: VOUCHERS,
      tags: TAGS,
    },
    blindsidePacks,
    RULES_VERSION,
  ),
  create: createRun,
  createPractice: blindsideScenario,
  transition,
  isCommand: validCommand,
});
