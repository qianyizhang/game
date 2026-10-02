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
