import type {
  EpisodeAdapter,
  Json,
  StudyDefinition,
  StudySetup,
} from '../../../../src/shared/policy/types';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  type Session,
} from '../application/session';
import { BASE_CONTENT } from '../domain/content';
import { RULES_VERSION, validCommand } from '../domain/game';
import type { Command, Difficulty } from '../domain/types';
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
function snapshot(session: Session, aliases: Aliases): EpisodeState {
  const memory = structuredClone(aliases);
  return { session, aliases: memory, input: observe(session, memory) };
}
const units = (command: Command): number => (command.type === 'advance' ? command.ticks : 1);
export const cursor = (session: Session): number =>
  session.replay.commands.reduce((n, c) => n + units(c), 0);
const key = (command: PolicyCommand): string =>
  JSON.stringify(command, Object.keys(command).sort().concat(['x', 'y']));
export function isPolicyCommand(value: unknown): value is PolicyCommand {
  return validCommand(value) && value.type !== 'respawn' && !value.type.startsWith('dev-');
}
function nativeCommand(state: EpisodeState, command: PolicyCommand): Command | null {
  if (!state.input.actions.some((candidate) => key(candidate) === key(command))) return null;
  const native = (id: number): number | undefined => {
    const found = Object.entries(state.aliases.ids).find(([, value]) => value === id);
    return found ? Number(found[0]) : undefined;
  };
  if (command.type === 'attack') {
    const target = native(command.target);
    return target === undefined ? null : { ...command, target };
  }
  if ('uid' in command) {
    const uid = native(command.uid);
    return uid === undefined ? null : { ...command, uid };
  }
  return command;
}
export const adapter: EpisodeAdapter<EpisodeState, Observation, PolicyCommand> = {
  game: 'emberwake',
  identity: {
    rules: RULES_VERSION,
    observation: 'emberwake-observation-3',
    score: 'emberwake-performance-2',
    content: { id: BASE_CONTENT.id, version: BASE_CONTENT.version },
  },
  create(seed, setup) {
    const hero = setup.hero ?? 'barbarian';
    const difficulty = setup.difficulty ?? 'standard';
    if (
      Object.keys(setup).some((k) => !['hero', 'difficulty'].includes(k)) ||
      typeof hero !== 'string' ||
      typeof difficulty !== 'string' ||
      !BASE_CONTENT.heroes.some((h) => h.id === hero) ||
      !['relaxed', 'standard', 'severe'].includes(difficulty)
    )
      throw new Error(
        'Emberwake setup requires a campaign hero and relaxed, standard or severe difficulty.',
      );
    return snapshot(
      newSession(seed, hero, BASE_CONTENT, false, difficulty as Difficulty),
      emptyAliases(),
    );
  },
  observe: (state) => structuredClone(state.input),
  act(state, command) {
    if (!isPolicyCommand(command) || state.session.state.status !== 'playing')
      return { state, error: 'Choose a permitted command in a living campaign attempt.' };
    const bound = nativeCommand(state, command);
    if (!bound) return { state, error: 'Command is outside the current public action menu.' };
    const result = dispatch(state.session, bound);
    if (result.error)
      return { state, error: 'The current gameplay command could not be accepted.' };
    return { state: snapshot(result.session, state.aliases) };
  },
  isCommand: isPolicyCommand,
  terminal: (s) => s.session.state.status !== 'playing',
  metrics({ session: { state: s } }) {
    const worlds = Object.values(s.worlds);
    const bosses = worlds.filter((w) => w.bossDefeated).length;
    const wards = worlds.filter((w) => w.ward).length;
    const regions = worlds.filter((w) => w.visited).length;
    return {
      outcome: s.status,
      won: Number(s.status === 'victory'),
      score: [
        Number(s.status === 'victory'),
        bosses,
        wards,
        regions,
        s.status === 'victory' ? s.tick : 0,
      ],
      progress: bosses * 10000 + wards * 100 + regions,
      bosses,
      wards,
      regions,
      level: s.player.level,
      xp: s.player.xp,
      hp: s.player.hp,
      gold: s.player.gold,
      executedTicks: s.tick,
    };
  },
  cursor: (s) => cursor(s.session),
  marker: ({ session: { state: s } }) =>
    `Act ${s.act + 1} · ${s.region} · Tick ${s.tick} · ${s.status}`,
  replay: (s) => JSON.parse(exportSession(s.session)) as Json,
  restore(replay) {
    const session = importSession(JSON.stringify(replay));
    if (session.replay.mode === 'sandbox')
      throw new Error('Sandbox replays are outside the campaign policy contract.');
    return snapshot(session, emptyAliases());
  },
};
/** Requested-tick cursor, independent of native adjacent-advance packing. A seek may
 * end inside a packed command, including terminal padding. This reconstructed view
 * is evaluator presentation; the review keeps each recorded original policy input. */
function atSession(session: Session, requested: number): EpisodeState {
  const limit = cursor(session);
  if (!Number.isSafeInteger(requested) || requested < 0 || requested > limit)
    throw new Error('Invalid Emberwake replay cursor.');
  const commands: Command[] = [];
  let remaining = requested;
  for (const command of session.replay.commands) {
    if (!remaining) break;
    const count = Math.min(units(command), remaining);
    commands.push(command.type === 'advance' ? { type: 'advance', ticks: count } : command);
    remaining -= count;
  }
  return snapshot(importSession(JSON.stringify({ ...session.replay, commands })), emptyAliases());
}
export const at = (state: EpisodeState, requested: number): EpisodeState =>
  atSession(state.session, requested);
export const studySetups: StudySetup[] = BASE_CONTENT.heroes.flatMap((hero) =>
  (['relaxed', 'standard', 'severe'] as const).map((difficulty) => ({
    id: `${hero.id}-${difficulty}`,
    difficulty,
    stratum: hero.id,
    setup: { hero: hero.id, difficulty },
  })),
);
export const study: StudyDefinition = {
  setups: studySetups,
  defaultSetup: { hero: 'barbarian', difficulty: 'standard' },
  ranking:
    'victory, then bosses defeated, then wards lit, then distinct regions visited; among victories minimize executed ticks. HP, level, XP and gold remain descriptive.',
  score: {
    components: [
      { name: 'won', direction: 'maximize' },
      { name: 'bosses', direction: 'maximize' },
      { name: 'wards', direction: 'maximize' },
      { name: 'regions', direction: 'maximize' },
      { name: 'victoryTicks', direction: 'minimize' },
    ],
  },
  reviewPath: '/?game=diablo2&review=policy',
};

export { builtins } from './policy';
