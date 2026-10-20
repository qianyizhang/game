import type {
  EpisodeAdapter,
  Json,
  StudyDefinition,
  StudySetup,
} from '../../../shared/policy/types';
import type { Replay } from '../../../shared/replay';
import { decideSpellRecruitment } from '../ai/spell-policy';
import { arenaFrame, arenaSession, type ArenaSession } from '../application/arena';
import {
  activeSeat,
  ARENA_VERSION,
  DIFFICULTIES,
  mixedRivalsConfig,
  type ArenaCommand,
  type Difficulty,
} from '../domain/arena';
import { isBGCommand } from '../domain/commands';
import { emptyAliases, type AliasMemory } from './aliases';
import { observe, type Observation, type PolicyCommand } from './observation';

export interface EpisodeState {
  session: ArenaSession;
  /** Evaluator-only native-to-public bindings; never supplied to policies. */
  aliases: AliasMemory;
  input: Observation;
}
export const HEROES = [
  'forgekeeper',
  'quartermaster',
  'wildspeaker',
  'archivist',
  'oathkeeper',
] as const;
const complete = (session: ArenaSession) => ['won', 'lost'].includes(session.state.phase);
const focalBoundary = (session: ArenaSession) =>
  activeSeat(session.state) === 0 || complete(session);
const sync = (session: ArenaSession, aliases: AliasMemory): EpisodeState => ({
  session,
  ...observe(session, aliases),
});
const isCommand = (value: unknown): value is PolicyCommand =>
  isBGCommand(value) && value.type !== 'chooseHero' && value.type !== 'nextRound';
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const commandKey = (command: PolicyCommand) => JSON.stringify(command, Object.keys(command).sort());

function nativeChoice(state: EpisodeState, command: PolicyCommand) {
  const index = state.input.actions.findIndex(
    (entry) => commandKey(entry.command) === commandKey(command),
  );
  return index < 0 ? null : (arenaFrame(state.session, 0).actions[index]?.command ?? null);
}
function nativeAct(session: ArenaSession, command: ArenaCommand) {
  if (session.replay.commands.length >= 10000)
    throw new Error('Arena command budget reached (10000).');
  const result = arenaSession.act(session, command);
  if (result.error) throw new Error(result.error);
  return result.session;
}
/** Only fresh execution invokes rivals. The resulting replay journals every actor. */
function continueToFocal(initial: ArenaSession) {
  let session = initial;
  while (!focalBoundary(session)) {
    if (session.state.phase === 'combat') session = nativeAct(session, { type: 'nextRound' });
    else {
      const seat = activeSeat(session.state);
      if (seat === null || seat === 0) throw new Error('Rival controller made no progress.');
      const action = decideSpellRecruitment(
        arenaFrame(session, seat),
        session.state.arena.config!.seats[seat].style,
      ).command;
      session = nativeAct(session, { type: 'seat', seat, action });
    }
  }
  return session;
}

/** Rebuild observed alias history using accepted native commands, without any policy execution. */
function reconstruct(replay: Replay<ArenaCommand>, cursor = replay.commands.length): EpisodeState {
  if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor > replay.commands.length)
    throw new Error('Choose a valid all-actor replay cursor.');
  // The codec validates envelope/content/version and every accepted native transition.
  const validated = arenaSession.decode(
    JSON.stringify({ ...replay, commands: replay.commands.slice(0, cursor) }),
  );
  if (validated.replay.version !== ARENA_VERSION)
    throw new Error('Policy review requires the current v6 arena envelope.');
  let session = arenaSession.create(replay.seed);
  let aliases = emptyAliases();
  for (const command of validated.replay.commands) {
    if (activeSeat(session.state) === 0) aliases = sync(session, aliases).aliases;
    session = nativeAct(session, command);
  }
  return sync(session, aliases);
}

export const adapter: EpisodeAdapter<EpisodeState, Observation, PolicyCommand> = {
  game: 'last-hearth-arena',
  identity: {
    rules: 6,
    arena: ARENA_VERSION,
    observation: 'hearth-policy-observation-1',
    score: 'hearth-placement-1',
    population: 'mixed-rivals-v6-hidden-1',
    content: JSON.parse(JSON.stringify(arenaSession.rules.content)) as Json,
  },
  create(seed, setup) {
    const hero = setup.hero ?? 'forgekeeper';
    const difficulty = setup.difficulty ?? 'standard';
    if (
      Object.keys(setup).some((key) => !['hero', 'difficulty'].includes(key)) ||
      typeof hero !== 'string' ||
      !HEROES.includes(hero as (typeof HEROES)[number]) ||
      typeof difficulty !== 'string' ||
      !Object.hasOwn(DIFFICULTIES, difficulty)
    )
      throw new Error(
        'Hearth setup requires one of five heroes and relaxed, standard or severe difficulty.',
      );
    const session = nativeAct(arenaSession.create(seed), {
      type: 'configure',
      config: mixedRivalsConfig(seed, hero, 'hidden', difficulty as Difficulty, 0),
    });
    return sync(continueToFocal(session), emptyAliases());
  },
  observe: (state) => structuredClone(state.input),
  act(state, command) {
    const native = isCommand(command) && nativeChoice(state, command);
    if (!native) return { state, error: 'Choose a command from the current permitted focal menu.' };
    try {
      return {
        state: sync(
          continueToFocal(nativeAct(state.session, { type: 'seat', seat: 0, action: native })),
          state.aliases,
        ),
      };
    } catch (error) {
      return { state, error: error instanceof Error ? error.message : 'Arena controller failed.' };
    }
  },
  replayDecision(state, command, replay, after) {
    const reject = (error: string) => ({ state, error });
    const native = nativeChoice(state, command);
    if (!native) return reject('Choose a command from the current permitted focal menu.');
    const journal = replay as unknown as Replay<ArenaCommand>;
    const before = state.session.replay.commands.length;
    if (
      !journal ||
      !Array.isArray(journal.commands) ||
      !Number.isSafeInteger(after) ||
      after <= before ||
      after > journal.commands.length ||
      !same({ ...journal, commands: journal.commands.slice(0, before) }, state.session.replay)
    )
      return reject('Recorded all-actor span does not extend this replay prefix.');
    if (!same(journal.commands[before], { type: 'seat', seat: 0, action: native }))
      return reject('Recorded focal command does not match the policy proposal.');
    let session = state.session;
    try {
      for (let index = before; index < after; index++) {
        if (index > before && focalBoundary(session))
          return reject('Recorded span crosses an unrecorded focal decision or terminal boundary.');
        session = nativeAct(session, journal.commands[index]);
      }
      if (!focalBoundary(session))
        return reject('Recorded span stops before the next focal decision or terminal result.');
      return { state: sync(session, state.aliases) };
    } catch (error) {
      return reject(error instanceof Error ? error.message : 'Invalid all-actor replay span.');
    }
  },
  isCommand,
  terminal: (state) => complete(state.session),
  metrics({ session }) {
    const s = session.state,
      p = s.players[0];
    const placement = p.placement;
    return {
      outcome: complete(session) ? (placement === 1 ? 'won' : 'lost') : s.phase,
      won: Number(placement === 1),
      progress: placement === null ? 0 : 8 - placement,
      placement,
      topFour: Number(placement !== null && placement <= 4),
      survivalRounds: p.eliminatedRound ?? s.round,
      hp: p.hp,
      gold: p.gold,
      tier: p.tier,
      board: p.board.length,
      round: s.round,
    };
  },
  cursor: ({ session }) => session.replay.commands.length,
  marker: ({ session }) =>
    `Round ${session.state.round} · Seat ${activeSeat(session.state) ?? 'none'} · ${session.state.phase}`,
  replay: ({ session }) => JSON.parse(arenaSession.encode(session)) as Json,
  restore: (replay) => reconstruct(replay as unknown as Replay<ArenaCommand>),
};
export const at = (state: EpisodeState, cursor: number) =>
  reconstruct(state.session.replay, cursor);

/** Review-only checkpoints retain native state and observed alias history. The
 * complete journal is validated before indexing; no rival policy is rerun. */
export function createReviewSeeker() {
  let cached: {
    original: string;
    replay: Replay<ArenaCommand>;
    checkpoints: { cursor: number; session: ArenaSession; aliases: AliasMemory }[];
  } | null = null;
  return (value: Json, cursor: number): EpisodeState => {
    const original = JSON.stringify(value);
    if (!cached || cached.original !== original) {
      // Invalidate before decoding so a failed import cannot reuse stale state.
      cached = null;
      const validated = arenaSession.decode(original);
      if (validated.replay.version !== ARENA_VERSION)
        throw new Error('Policy review requires the current v6 arena envelope.');
      const replay = validated.replay;
      let session = arenaSession.create(replay.seed);
      let aliases = emptyAliases();
      const checkpoints = [{ cursor: 0, session, aliases }];
      for (const [index, command] of replay.commands.entries()) {
        if (activeSeat(session.state) === 0) aliases = sync(session, aliases).aliases;
        session = nativeAct(session, command);
        if ((index + 1) % 32 === 0) checkpoints.push({ cursor: index + 1, session, aliases });
      }
      cached = { original, replay, checkpoints };
    }
    if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor > cached.replay.commands.length)
      throw new Error('Choose a valid all-actor replay cursor.');
    const checkpoint = cached.checkpoints[Math.floor(cursor / 32)];
    let { session, aliases } = checkpoint;
    for (let index = checkpoint.cursor; index < cursor; index++) {
      if (activeSeat(session.state) === 0) aliases = sync(session, aliases).aliases;
      session = nativeAct(session, cached.replay.commands[index]);
    }
    // Detach the exposed state so callers cannot mutate stored checkpoints.
    return structuredClone(sync(session, aliases));
  };
}
const studySetups: StudySetup[] = HEROES.flatMap((hero) =>
  (['relaxed', 'standard', 'severe'] as const).map((difficulty) => ({
    id: `${hero}-${difficulty}`,
    difficulty,
    stratum: hero,
    setup: { hero, difficulty },
  })),
);
export const study: StudyDefinition = {
  setups: studySetups,
  defaultSetup: { hero: 'forgekeeper', difficulty: 'standard' },
  ranking:
    'lower placement first; first-place and top-four rates secondary; all eight placements resolved',
  reviewPath: '/?game=hearth&review=policy',
};
