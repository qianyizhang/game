import { validCommand } from '../domain/commands';
export { validCommand } from '../domain/commands';
import { blindsideEvidence } from './evidence';
import { replayCodec, type Rules } from '../../../shared/replay';
import { createRun, RULES_VERSION, transition } from '../domain/game';
import { blindsideScenario } from './scenario';
import { pins } from '../../../shared/contentPack';
import { blindsidePacks } from '../../../mods/blindside';
import { JOKERS } from '../content/jokers';
import { CONSUMABLES } from '../content/consumables';
import { PACKS, VOUCHERS, TAGS } from '../content/shop';
import { BOSSES } from '../content/blinds';
import type { RunState, Command } from '../domain/types';

const rules = (version: number): Rules<RunState, Command> => ({
  evidence: blindsideEvidence,
  game: 'blindside',
  version,
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
    version,
  ),
  create: (seed) => createRun(seed, version),
  createPractice: (seed, setup) => blindsideScenario(seed, setup, version),
  transition,
  isCommand: (value): value is Command =>
    validCommand(value) && (version >= 5 || value.type !== 'configure'),
});

export const blindsideSession = replayCodec({ ...rules(RULES_VERSION), compatible: [rules(4)] });
