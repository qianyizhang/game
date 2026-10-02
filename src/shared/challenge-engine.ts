import { actChallenge, attemptResult, type Attempt, type Challenge } from './challenges';
import type { CommandSource, Engine } from './engine';

/** Uses the same restrictions, terminal checks and replay recorder as human attempts. */
export function challengeEngine<S extends { seed: string }, C>(
  definition: Challenge<S, C>,
  candidates: CommandSource<S, C>,
): Engine<Attempt<S, C>, C> {
  return {
    *candidates(attempt) {
      if (attemptResult(definition, attempt).status !== 'active') return;
      for (const command of candidates(attempt.session.state))
        if (!definition.allowed(attempt.session.state, command)) yield command;
    },
    step: (position, command) => {
      const next = actChallenge(definition, position, structuredClone(command));
      return { position: next.attempt, ...(next.error ? { error: next.error } : {}) };
    },
    outcome: (attempt) => {
      const status = attemptResult(definition, attempt).status;
      return status === 'cleared' ? 'won' : status === 'not-yet' ? 'lost' : 'active';
    },
    // Shorter histories have at least as much of the attempt's action allowance remaining.
    key: (attempt) => JSON.stringify([attempt.ended, attempt.session.state]),
  };
}
