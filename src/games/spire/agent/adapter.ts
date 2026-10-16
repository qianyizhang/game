import type {
  EpisodeAdapter,
  Json,
  StudyDefinition,
  StudySetup,
} from '../../../shared/policy/types';
import type { Session } from '../../../shared/replay';
import { spireSession } from '../application/session';
import { isSpireCommand } from '../domain/commands';
import { SPIRE_VERSION } from '../domain/game';
import type { SpireCommand, SpireState } from '../domain/types';
import { observe, type Observation, type PolicyCommand } from './observation';

export type EpisodeState = Session<SpireState, SpireCommand>;
const isPolicyCommand = (value: unknown): value is PolicyCommand =>
  isSpireCommand(value) && value.type !== 'configure';
export const adapter: EpisodeAdapter<EpisodeState, Observation, PolicyCommand> = {
  game: 'slay-the-spire',
  identity: {
    rules: SPIRE_VERSION,
    observation: 'spire-observation-1',
    score: 'spire-progress-1',
    content: JSON.parse(JSON.stringify(spireSession.rules.content)) as Json,
  },
  create(seed, setup) {
    const character = setup.character ?? 'ironclad';
    const ascension = setup.ascension ?? 0;
    if (
      Object.keys(setup).some((key) => !['character', 'ascension'].includes(key)) ||
      (character !== 'ironclad' && character !== 'silent') ||
      ![0, 2, 5].includes(Number(ascension)) ||
      typeof ascension !== 'number'
    )
      throw new Error('Spire setup requires Ironclad or Silent and Ascension 0, 2 or 5.');
    const result = spireSession.act(spireSession.create(seed), {
      type: 'configure',
      character,
      ascension,
    });
    if (result.error) throw new Error(result.error);
    return result.session;
  },
  observe: (session) => observe(session.state),
  act(session, command) {
    if (!isPolicyCommand(command))
      return {
        state: session,
        error: 'Episode setup is fixed; choose a permitted gameplay command.',
      };
    const result = spireSession.act(session, command);
    return { state: result.session, ...(result.error ? { error: result.error } : {}) };
  },
  isCommand: isPolicyCommand,
  terminal: (session) => session.state.phase === 'won' || session.state.phase === 'lost',
  metrics(session) {
    const s = session.state;
    return {
      outcome: s.phase,
      won: Number(s.phase === 'won'),
      progress: 16 * (s.act - 1) + Math.max(0, s.row + 1),
      hp: s.hp,
      maxHp: s.maxHp,
      gold: s.gold,
      relics: s.relics.length,
      deck: s.deck.length,
    };
  },
  cursor: (session) => session.replay.commands.length,
  marker: (session) =>
    `Act ${session.state.act} · Room ${Math.max(0, session.state.row + 1)} · ${session.state.phase}${session.state.combat ? ` · Turn ${session.state.combat.turn}` : ''}`,
  replay: (session) => JSON.parse(spireSession.encode(session)) as Json,
  restore: (replay) => spireSession.decode(JSON.stringify(replay)),
};
export const at = (session: EpisodeState, cursor: number) => spireSession.at(session, cursor);
export { builtins } from './policy';
export const studySetups: StudySetup[] = (['ironclad', 'silent'] as const).flatMap((character) =>
  [0, 2, 5].map((ascension) => ({
    id: `${character}-a${ascension}`,
    difficulty: `ascension-${ascension}`,
    stratum: character,
    setup: { character, ascension },
  })),
);
export const study: StudyDefinition = {
  setups: studySetups,
  defaultSetup: { character: 'ironclad', ascension: 0 },
  ranking: 'win, then rooms reached, then HP, then gold',
  reviewPath: '/?game=spire&review=policy',
};
