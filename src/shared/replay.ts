import type { Observer } from './evidence/types';
import { contentDigest, type ContentPin } from './contentPack';

export const MAX_REPLAY_SIZE = 2_000_000;
export interface Replay<C> {
  content?: readonly ContentPin[];
  mode?: 'practice';
  setup?: unknown;
  game: string;
  version: number;
  seed: string;
  commands: C[];
}
export interface Session<S, C> {
  state: S;
  replay: Replay<C>;
}
export interface Rules<S extends { seed: string }, C> {
  evidence?: Observer<S, C>;
  /** Explicit historical rule environments, retained by normal and practice codecs. */
  compatible?: readonly Rules<S, C>[];
  content?: readonly ContentPin[];
  createPractice?: (seed: string, setup: unknown) => S;
  game: string;
  version: number;
  create: (seed: string) => S;
  transition: (state: S, command: C) => { state: S; error?: string };
  isCommand: (value: unknown) => value is C;
}
/** Shared persistence envelope. Games retain independent state and transition semantics. */
export function replayCodec<S extends { seed: string }, C>(rules: Rules<S, C>, practice = false) {
  const rulesForVersion = (version: number): Rules<S, C> => {
    const selected = [rules, ...(rules.compatible ?? [])].find(
      (candidate) => candidate.version === version,
    );
    if (!selected || selected.game !== rules.game)
      throw new Error('Incompatible game or rules version.');
    return selected;
  };
  const create = (seed: string, setup?: unknown, version = rules.version): Session<S, C> => {
    const selected = rulesForVersion(version);
    if (setup !== undefined && (!practice || !selected.createPractice))
      throw new Error('Custom setup is only available in the practice lab.');
    const state =
      setup === undefined ? selected.create(seed) : selected.createPractice!(seed, setup);
    return {
      state,
      replay: {
        game: selected.game,
        version: selected.version,
        seed: state.seed,
        commands: [],
        ...(selected.content ? { content: structuredClone(selected.content) } : {}),
        ...(practice
          ? {
              mode: 'practice' as const,
              ...(setup === undefined ? {} : { setup: structuredClone(setup) }),
            }
          : {}),
      },
    };
  };
  const act = (session: Session<S, C>, command: C) => {
    const selected = rulesForVersion(session.replay.version);
    if (session.replay.game !== selected.game || !selected.isCommand(command))
      return { session, error: 'Invalid command for this rules version.' };
    const result = selected.transition(session.state, command);
    return result.error
      ? { session, error: result.error }
      : {
          session: {
            state: result.state,
            replay: { ...session.replay, commands: [...session.replay.commands, command] },
          },
        };
  };
  const decode = (text: string): Session<S, C> => {
    if (text.length > MAX_REPLAY_SIZE) throw new Error('Save is too large (maximum 2 MB).');
    const value = JSON.parse(text) as Partial<Replay<C>>;
    if (!value || value.game !== rules.game || typeof value.version !== 'number')
      throw new Error('Incompatible game or rules version.');
    const selected = rulesForVersion(value.version);
    if (JSON.stringify(value.content) !== JSON.stringify(selected.content))
      throw new Error(
        'Content pack mismatch. Restore the exact pack versions/data listed in this replay, or start a fresh run.',
      );
    if (
      (value.mode === 'practice') !== practice ||
      (value.mode !== undefined && value.mode !== 'practice') ||
      (!practice && value.setup !== undefined)
    )
      throw new Error(
        'Practice histories must be opened in the practice lab; normal saves remain separate.',
      );
    if (
      typeof value.seed !== 'string' ||
      value.seed.length > 64 ||
      !Array.isArray(value.commands) ||
      value.commands.length > 10_000
    )
      throw new Error('Invalid save envelope.');
    let state = create(value.seed, value.setup, selected.version).state;
    for (const [index, command] of value.commands.entries()) {
      if (!selected.isCommand(command)) throw new Error(`Invalid command at step ${index + 1}.`);
      const result = selected.transition(state, command);
      if (result.error) throw new Error(`Save step ${index + 1}: ${result.error}`);
      state = result.state;
    }
    return {
      state,
      replay: {
        game: selected.game,
        version: selected.version,
        seed: state.seed,
        commands: value.commands,
        ...(selected.content ? { content: structuredClone(selected.content) } : {}),
        ...(practice
          ? {
              mode: 'practice' as const,
              ...(value.setup === undefined ? {} : { setup: structuredClone(value.setup) }),
            }
          : {}),
      },
    };
  };
  return {
    rules,
    rulesForVersion,
    practice,
    create,
    act,
    decode,
    encode: (session: Session<S, C>) => JSON.stringify(session.replay, null, 2),
    at: (session: Session<S, C>, step: number): Session<S, C> => {
      if (!Number.isInteger(step) || step < 0 || step > session.replay.commands.length)
        throw new Error('Choose a valid replay step.');
      return decode(
        JSON.stringify({ ...session.replay, commands: session.replay.commands.slice(0, step) }),
      );
    },
    key: `card-workshop.${rules.game}.v${rules.version}${rules.content?.some((p) => p.id !== 'base') ? `.mods-${contentDigest(rules.content)}` : ''}${practice ? '.practice' : ''}`,
  };
}
