import { validCommand } from '../domain/commands';
export { validCommand } from '../domain/commands';
import { blindsideEvidence } from './evidence';
import { replayCodec } from '../../../shared/replay';
import type { Replay as Envelope } from '../../../shared/replay';
import { createRun, RULES_VERSION, transition } from '../domain/game';
import type { Command, RunState } from '../domain/types';
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
export const SAVE_KEY = blindsideSession.key;
export type Replay = Envelope<Command>;
export interface Session {
  run: RunState;
  replay: Replay;
}
export function newSession(seed: string): Session {
  const { state, replay } = blindsideSession.create(seed);
  return { run: state, replay };
}
export function act(session: Session, command: Command): { session: Session; error?: string } {
  const result = blindsideSession.act({ state: session.run, replay: session.replay }, command);
  return result.error
    ? { session, error: result.error }
    : { session: { run: result.session.state, replay: result.session.replay } };
}
export function importReplay(text: string): Session {
  const { state, replay } = blindsideSession.decode(text);
  return { run: state, replay };
}
export const exportReplay = (session: Session) =>
  blindsideSession.encode({ state: session.run, replay: session.replay });
