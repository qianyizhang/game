import { contentDigest } from './contentPack';
import type { replayCodec, Session } from './replay';

export const MAX_CHALLENGE_ACTIONS = 200;
export const MAX_CHALLENGE_BYTES = 2_000_000;

export interface ChallengeResult {
  status: 'active' | 'cleared' | 'not-yet';
  summary: string;
  metrics: Record<string, string | number>;
}
export interface ChallengeDecision {
  label: string;
  events: string[];
}
export interface Challenge<S extends { seed: string }, C> {
  id: string;
  revision: number;
  game: 'balatro' | 'spire' | 'battlegrounds';
  gameName: string;
  title: string;
  objective: string;
  introduction: string;
  constraints: string;
  hints: readonly string[];
  explanation: string;
  seed: string;
  setup?: unknown;
  codec: ReturnType<typeof replayCodec<S, C>>;
  allowed: (state: S, command: C) => string | undefined;
  evaluate: (state: S) => ChallengeResult;
  describe: (before: S, command: C, after: S) => ChallengeDecision;
}
export interface Attempt<S, C> {
  challenge: { id: string; revision: number };
  session: Session<S, C>;
  hints: number;
  ended: boolean;
}
export interface ChallengeProgress<S, C> {
  current: Attempt<S, C>;
  previous?: Attempt<S, C>;
  cleared?: Attempt<S, C>;
}
export function challengeKey<S extends { seed: string }, C>(definition: Challenge<S, C>) {
  return `card-workshop.challenge.${definition.id}.r${definition.revision}.v${definition.codec.rules.version}.${contentDigest(definition.codec.rules.content ?? [])}`;
}
export function beginChallenge<S extends { seed: string }, C>(
  definition: Challenge<S, C>,
): Attempt<S, C> {
  return {
    challenge: { id: definition.id, revision: definition.revision },
    session: definition.codec.create(definition.seed, definition.setup),
    hints: 0,
    ended: false,
  };
}
export function attemptResult<S extends { seed: string }, C>(
  definition: Challenge<S, C>,
  attempt: Attempt<S, C>,
): ChallengeResult {
  const result = definition.evaluate(attempt.session.state);
  return result.status === 'active' && attempt.ended
    ? { ...result, status: 'not-yet', summary: 'Attempt ended before the goal was resolved.' }
    : result;
}
/** Puzzle constraints are checked before the independent game's authoritative transition. */
export function actChallenge<S extends { seed: string }, C>(
  definition: Challenge<S, C>,
  attempt: Attempt<S, C>,
  command: C,
) {
  if (attemptResult(definition, attempt).status !== 'active')
    return { attempt, error: 'This attempt is finished. Try another choice or retry.' };
  if (!definition.codec.rules.isCommand(command))
    return { attempt, error: 'Invalid challenge action.' };
  if (attempt.session.replay.commands.length >= MAX_CHALLENGE_ACTIONS)
    return { attempt, error: 'Attempt limit reached. Review this attempt or retry.' };
  const error = definition.allowed(attempt.session.state, command);
  if (error) return { attempt, error };
  const next = definition.codec.act(attempt.session, command);
  return next.error
    ? { attempt, error: next.error }
    : { attempt: { ...attempt, session: next.session } };
}
export function retryChallenge<S extends { seed: string }, C>(
  definition: Challenge<S, C>,
  progress: ChallengeProgress<S, C>,
  step = 0,
): ChallengeProgress<S, C> {
  const prior = { ...progress.current, ended: true };
  const session = definition.codec.at(prior.session, step);
  if (definition.evaluate(session.state).status !== 'active')
    throw new Error('Choose a decision before the attempt finished.');
  const cleared = attemptResult(definition, prior).status === 'cleared' ? prior : progress.cleared;
  return {
    current: {
      challenge: { id: definition.id, revision: definition.revision },
      session,
      hints: 0,
      ended: false,
    },
    previous: prior,
    ...(cleared ? { cleared } : {}),
  };
}
export function challengeDecisions<S extends { seed: string }, C>(
  definition: Challenge<S, C>,
  attempt: Attempt<S, C>,
) {
  let session = definition.codec.create(definition.seed, definition.setup);
  return attempt.session.replay.commands.map((command, step) => {
    const next = definition.codec.act(session, command);
    if (next.error) throw new Error(next.error);
    const decision = { ...definition.describe(session.state, command, next.session.state), step };
    session = next.session;
    return decision;
  });
}
export function encodeChallenge<S, C>(progress: ChallengeProgress<S, C>) {
  const encode = (attempt: Attempt<S, C>) => ({
    challenge: attempt.challenge,
    replay: attempt.session.replay,
    hints: attempt.hints,
    ended: attempt.ended,
  });
  return JSON.stringify({
    current: encode(progress.current),
    ...(progress.previous ? { previous: encode(progress.previous) } : {}),
    ...(progress.cleared ? { cleared: encode(progress.cleared) } : {}),
  });
}
/** Persist replay commands only. Revalidate the fixed setup, restrictions and stopping point on load. */
export function decodeChallenge<S extends { seed: string }, C>(
  definition: Challenge<S, C>,
  text: string,
): ChallengeProgress<S, C> {
  if (text.length > MAX_CHALLENGE_BYTES) throw new Error('Challenge save is too large.');
  const value = JSON.parse(text);
  const decode = (raw: unknown): Attempt<S, C> => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid challenge attempt.');
    const data = raw as Record<string, unknown>;
    // Early workshop exports had no pin. Reconstruct those against today's full constraints.
    if (data.challenge !== undefined) {
      const pin = data.challenge as Partial<Attempt<S, C>['challenge']> | null;
      if (!pin || pin.id !== definition.id || pin.revision !== definition.revision)
        throw new Error('This attempt belongs to a different challenge or puzzle revision.');
    }
    const replay = data.replay as { commands?: unknown } | undefined;
    if (
      !replay ||
      !Array.isArray(replay.commands) ||
      replay.commands.length > MAX_CHALLENGE_ACTIONS
    )
      throw new Error(
        `Invalid challenge command history (maximum ${MAX_CHALLENGE_ACTIONS} actions).`,
      );
    if (
      !Number.isInteger(data.hints) ||
      Number(data.hints) < 0 ||
      Number(data.hints) > definition.hints.length ||
      typeof data.ended !== 'boolean'
    )
      throw new Error('Invalid challenge progress.');
    const saved = definition.codec.decode(JSON.stringify(data.replay));
    const initial = beginChallenge(definition);
    if (
      saved.replay.seed !== initial.session.replay.seed ||
      JSON.stringify(saved.replay.setup) !== JSON.stringify(initial.session.replay.setup)
    )
      throw new Error('This save uses a different challenge position.');
    let attempt = initial;
    for (const command of saved.replay.commands) {
      const next = actChallenge(definition, attempt, command);
      if (next.error) throw new Error(next.error);
      attempt = next.attempt;
    }
    return { ...attempt, hints: Number(data.hints), ended: data.ended };
  };
  if (!value || typeof value !== 'object') throw new Error('Invalid challenge save.');
  const cleared = value.cleared ? decode(value.cleared) : undefined;
  if (cleared && attemptResult(definition, cleared).status !== 'cleared')
    throw new Error('The saved completion does not meet this challenge goal.');
  return {
    current: decode(value.current),
    ...(value.previous ? { previous: decode(value.previous) } : {}),
    ...(cleared ? { cleared } : {}),
  };
}
