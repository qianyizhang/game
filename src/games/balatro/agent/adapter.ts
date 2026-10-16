import type { EpisodeAdapter, Json } from '../../../shared/policy/types';
import type { Session } from '../../../shared/replay';
import { blindsideSession } from '../application/session';
import { validCommand } from '../domain/commands';
import { RULES_VERSION } from '../domain/game';
import { DIFFICULTIES, type Command, type Difficulty, type RunState } from '../domain/types';
import { observe, type Observation } from './observation';

export type EpisodeState = Session<RunState, Command>;
export const adapter: EpisodeAdapter<EpisodeState, Observation, Command> = {
  game: 'blindside',
  identity: {
    rules: RULES_VERSION,
    observation: 'blindside-observation-1',
    score: 'blindside-progress-1',
    content: JSON.parse(JSON.stringify(blindsideSession.rules.content)) as Json,
  },
  create(seed, setup) {
    const difficulty = setup.difficulty ?? 'standard';
    if (
      Object.keys(setup).some((key) => key !== 'difficulty') ||
      !DIFFICULTIES.includes(difficulty as Difficulty)
    )
      throw new Error('Blindside setup requires a supported difficulty only.');
    const created = blindsideSession.create(seed);
    const result = blindsideSession.act(created, {
      type: 'configure',
      difficulty: difficulty as Difficulty,
    });
    if (result.error) throw new Error(result.error);
    return result.session;
  },
  observe: (session) => observe(session.state),
  act(session, command) {
    if (command.type === 'configure')
      return { state: session, error: 'Episode setup is fixed by the evaluator.' };
    const result = blindsideSession.act(session, command);
    return { state: result.session, ...(result.error ? { error: result.error } : {}) };
  },
  isCommand: (value): value is Command => validCommand(value) && value.type !== 'configure',
  terminal: (session) => session.state.phase === 'won' || session.state.phase === 'lost',
  metrics(session) {
    const run = session.state;
    const won = run.phase === 'won';
    const afterClear =
      run.phase === 'shop' || (run.phase === 'pack' && run.pack?.returnTo === 'shop');
    const blindsPassed = won ? 24 : (run.ante - 1) * 3 + run.blind + Number(afterClear);
    const blindsSkipped = session.replay.commands.filter(
      (command) => command.type === 'skipBlind',
    ).length;
    const blindsCleared = blindsPassed - blindsSkipped;
    const fraction =
      run.phase === 'playing' || run.phase === 'lost'
        ? Math.min(1, run.roundScore / run.target)
        : 0;
    return {
      outcome: run.phase,
      won: Number(won),
      blindsCleared,
      blindsPassed,
      blindsSkipped,
      progress: blindsPassed + fraction,
      ante: run.ante,
      blind: run.blind,
      roundScore: run.roundScore,
      target: run.target,
      cash: run.cash,
      commands: session.replay.commands.length,
    };
  },
  cursor: (session) => session.replay.commands.length,
  marker: (session) =>
    `Ante ${session.state.ante} · ${['Small', 'Big', 'Boss'][session.state.blind]} · ${session.state.phase}`,
  replay: (session) => JSON.parse(blindsideSession.encode(session)) as Json,
  restore: (replay) => blindsideSession.decode(JSON.stringify(replay)),
};

export const at = (session: EpisodeState, cursor: number) => blindsideSession.at(session, cursor);
export { builtins } from './policy';
