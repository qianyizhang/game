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
  const create = (seed: string, setup?: unknown): Session<S, C> => {
    if (setup !== undefined && (!practice || !rules.createPractice))
      throw new Error('Custom setup is only available in the practice lab.');
    const state = setup === undefined ? rules.create(seed) : rules.createPractice!(seed, setup);
    return {
      state,
      replay: {
        game: rules.game,
        version: rules.version,
        seed: state.seed,
        commands: [],
        ...(rules.content ? { content: structuredClone(rules.content) } : {}),
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
    const result = rules.transition(session.state, command);
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
    if (!value || value.game !== rules.game || value.version !== rules.version)
      throw new Error('Incompatible game or rules version.');
    if (JSON.stringify(value.content) !== JSON.stringify(rules.content))
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
    let state = create(value.seed, value.setup).state;
    for (const [index, command] of value.commands.entries()) {
      if (!rules.isCommand(command)) throw new Error(`Invalid command at step ${index + 1}.`);
      const result = rules.transition(state, command);
      if (result.error) throw new Error(`Save step ${index + 1}: ${result.error}`);
      state = result.state;
    }
    return {
      state,
      replay: {
        game: rules.game,
        version: rules.version,
        seed: state.seed,
        commands: value.commands,
        ...(rules.content ? { content: structuredClone(rules.content) } : {}),
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
