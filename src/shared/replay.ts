export interface Replay<C> {
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
  game: string;
  version: number;
  create: (seed: string) => S;
  transition: (state: S, command: C) => { state: S; error?: string };
  isCommand: (value: unknown) => value is C;
}
/** Shared persistence envelope. Games retain independent state and transition semantics. */
export function replayCodec<S extends { seed: string }, C>(rules: Rules<S, C>) {
  const create = (seed: string): Session<S, C> => {
    const state = rules.create(seed);
    return {
      state,
      replay: { game: rules.game, version: rules.version, seed: state.seed, commands: [] },
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
    if (text.length > 2_000_000) throw new Error('Save exceeds 2 MB.');
    const value = JSON.parse(text) as Partial<Replay<C>>;
    if (!value || value.game !== rules.game || value.version !== rules.version)
      throw new Error('Incompatible game or rules version.');
    if (
      typeof value.seed !== 'string' ||
      value.seed.length > 64 ||
      !Array.isArray(value.commands) ||
      value.commands.length > 10_000
    )
      throw new Error('Invalid save envelope.');
    let state = rules.create(value.seed);
    for (const [index, command] of value.commands.entries()) {
      if (!rules.isCommand(command)) throw new Error(`Invalid command at step ${index + 1}.`);
      const result = rules.transition(state, command);
      if (result.error) throw new Error(`Step ${index + 1}: ${result.error}`);
      state = result.state;
    }
    return {
      state,
      replay: {
        game: rules.game,
        version: rules.version,
        seed: state.seed,
        commands: value.commands,
      },
    };
  };
  return {
    create,
    act,
    decode,
    encode: (session: Session<S, C>) => JSON.stringify(session.replay, null, 2),
    key: `card-workshop.${rules.game}.v${rules.version}`,
  };
}
