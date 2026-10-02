import { jokerOrderChallenge } from '../games/balatro/application/challenges';
import { blindsideCommands } from '../games/balatro/application/engine';
import { poisonChallenge } from '../games/spire/application/challenges';
import { spireCommands } from '../games/spire/application/engine';
import { positioningChallenge } from '../games/battlegrounds/application/challenges';
import { positioningCommands } from '../games/battlegrounds/application/engine';
import {
  attemptResult,
  beginChallenge,
  challengeDecisions,
  challengeKey,
  decodeChallenge,
  encodeChallenge,
  type Challenge,
} from '../shared/challenges';
import { challengeEngine } from '../shared/challenge-engine';
import {
  DEFAULT_SEARCH_BUDGET,
  search,
  type CommandSource,
  type SearchBudget,
} from '../shared/engine';

/** Only the live objective is used as a goal; hints, explanations and known solutions are not inputs. */
export function solveChallenge<S extends { seed: string }, C>(
  definition: Challenge<S, C>,
  candidates: CommandSource<S, C>,
  options: Partial<SearchBudget> = {},
) {
  const initial = beginChallenge(definition);
  const result = search(challengeEngine(definition, candidates), initial, options);
  const report = {
    id: definition.id,
    title: definition.title,
    revision: definition.revision,
    challengeKey: challengeKey(definition),
    source: 'automated' as const,
    information: 'full-seeded-state' as const,
    algorithm: 'breadth-first-v1',
    budget: { ...DEFAULT_SEARCH_BUDGET, ...options },
    status: result.status,
    ...(result.status === 'limit' ? { reason: result.reason } : {}),
    stats: result.stats,
  };
  if (result.status !== 'solved') return { ...report, solution: null };
  const attempt = result.position;
  const archive = encodeChallenge({ current: attempt, cleared: attempt });
  const restored = decodeChallenge(definition, archive).current;
  if (
    JSON.stringify(restored.session) !== JSON.stringify(attempt.session) ||
    attemptResult(definition, restored).status !== 'cleared'
  )
    throw new Error(`Engine solution failed replay verification: ${definition.id}.`);
  return {
    ...report,
    solution: {
      commands: result.commands,
      result: attemptResult(definition, restored),
      decisions: challengeDecisions(definition, restored),
      replay: restored.session.replay,
      archive,
    },
  };
}

export function solveWorkshopChallenges(options: Partial<SearchBudget> = {}) {
  return [
    solveChallenge(jokerOrderChallenge, blindsideCommands, options),
    solveChallenge(poisonChallenge, spireCommands, options),
    solveChallenge(positioningChallenge, positioningCommands, options),
  ];
}
