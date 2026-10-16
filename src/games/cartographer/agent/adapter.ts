import type {
  EpisodeAdapter,
  Json,
  StudyDefinition,
  StudySetup,
} from '../../../shared/policy/types';
import { GENERATOR_VERSION } from '../../../shared/layout/layout';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  validCommand,
  type Session,
} from '../application/session';
import { RULES_VERSION, type Difficulty } from '../domain/game';
import {
  emptyAliases,
  observe,
  type Aliases,
  type Observation,
  type PolicyCommand,
} from './observation';
export interface EpisodeState {
  session: Session;
  aliases: Aliases;
  input: Observation;
}
function snapshot(session: Session, original: Aliases): EpisodeState {
  const aliases = structuredClone(original);
  return { session, aliases, input: observe(session.state, aliases) };
}
const key = (command: PolicyCommand): string =>
  JSON.stringify(command, Object.keys(command).sort());
export const adapter: EpisodeAdapter<EpisodeState, Observation, PolicyCommand> = {
  game: 'dungeon-cartographer',
  identity: {
    rules: RULES_VERSION,
    generator: GENERATOR_VERSION,
    observation: 'cartographer-observation-2',
    score: 'cartographer-performance-2',
  },
  create(seed, setup) {
    const difficulty = setup.difficulty ?? 'standard';
    if (
      Object.keys(setup).some((k) => k !== 'difficulty') ||
      typeof difficulty !== 'string' ||
      !['relaxed', 'standard', 'severe'].includes(difficulty)
    )
      throw new Error('Cartographer setup requires relaxed, standard or severe difficulty.');
    return snapshot(newSession(seed, difficulty as Difficulty), emptyAliases());
  },
  observe: (state) => structuredClone(state.input),
  act(state, command) {
    if (
      !validCommand(command) ||
      !state.input.actions.some((candidate) => key(candidate) === key(command))
    )
      return { state, error: 'Command is outside the current public action menu.' };
    let native = command;
    if ('target' in command) {
      const found = Object.entries(state.aliases.ids).find(([, alias]) => alias === command.target);
      if (!found) return { state, error: 'Command is outside the current public action menu.' };
      native = { ...command, target: Number(found[0]) };
    }
    const result = dispatch(state.session, native);
    if (result.error) return { state, error: result.error };
    return { state: snapshot(result.session, state.aliases) };
  },
  isCommand: validCommand,
  terminal: (state) => state.session.state.status !== 'playing',
  metrics({ session: { state: s, replay } }) {
    const won = Number(s.status === 'won');
    return {
      outcome: s.status,
      won,
      score: [
        won,
        s.cleared.length,
        won ? s.player.hp / s.player.maxHp : 0,
        won ? replay.commands.length : 0,
      ],
      progress: s.cleared.length,
      roomsCleared: s.cleared.length,
      roomsDrafted: s.layout.rooms.length,
      hp: s.player.hp,
      maxHp: s.player.maxHp,
      attack: s.player.attack,
      focus: s.player.focus,
      relics: s.relics.length,
      threat: s.threat,
      turns: s.turn,
    };
  },
  cursor: (state) => state.session.replay.commands.length,
  marker: ({ input: s }) =>
    `Room ${s.layout.rooms.findIndex((r) => r.id === s.room.id) + 1} · Turn ${s.turn} · ${s.phase}`,
  replay: (state) => JSON.parse(exportSession(state.session)) as Json,
  restore: (replay) => snapshot(importSession(JSON.stringify(replay)), emptyAliases()),
};
/** Native accepted-command seeking requires no policy or heuristic execution.
 * Reconstructed aliases are presentation only; original decision inputs remain in the rollout. */
export function at(state: EpisodeState, cursor: number): EpisodeState {
  if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor > state.session.replay.commands.length)
    throw new Error('Invalid Cartographer replay cursor.');
  return snapshot(
    importSession(
      JSON.stringify({
        ...state.session.replay,
        commands: state.session.replay.commands.slice(0, cursor),
      }),
    ),
    emptyAliases(),
  );
}
export const studySetups: StudySetup[] = (['relaxed', 'standard', 'severe'] as const).map(
  (difficulty) => ({
    id: difficulty,
    difficulty,
    stratum: 'lantern-keeper',
    setup: { difficulty },
  }),
);
export const study: StudyDefinition = {
  setups: studySetups,
  defaultSetup: { difficulty: 'standard' },
  ranking:
    'victory, then rooms cleared including the entrance, then victorious health fraction, then fewer victorious accepted commands',
  score: {
    components: [
      { name: 'victory', direction: 'maximize' },
      { name: 'rooms cleared', direction: 'maximize' },
      { name: 'victorious health fraction', direction: 'maximize' },
      { name: 'victorious accepted commands', direction: 'minimize' },
    ],
  },
  reviewPath: '/?game=cartographer&review=policy',
};
export { builtins } from './policy';
