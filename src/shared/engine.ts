import type { replayCodec, Session } from './replay';

export type Outcome = 'active' | 'won' | 'lost';
export type CommandSource<S, C> = (state: S) => Iterable<C>;

/** A playing/search seam, not a rules engine. Every step belongs to the game. */
export interface Engine<P, C> {
  candidates: (position: P) => Iterable<C>;
  step: (position: P, command: C) => { position: P; error?: string };
  outcome: (position: P) => Outcome;
  /** Equal keys must have equivalent futures. Include RNG and all rule-relevant state. */
  key: (position: P) => string;
}

export function sessionEngine<S extends { seed: string; phase: string }, C>(
  codec: ReturnType<typeof replayCodec<S, C>>,
  candidates: CommandSource<S, C>,
): Engine<Session<S, C>, C> {
  return {
    candidates: ({ state }) => candidates(state),
    step: (position, command) => {
      if (!codec.rules.isCommand(command)) return { position, error: 'Invalid engine command.' };
      const result = codec.act(position, structuredClone(command));
      return { position: result.session, ...(result.error ? { error: result.error } : {}) };
    },
    outcome: ({ state }) =>
      state.phase === 'won' ? 'won' : state.phase === 'lost' ? 'lost' : 'active',
    key: ({ state }) => JSON.stringify(state),
  };
}

/** Candidates are proposals. Only the game's transition decides legality. */
export function* legalActions<P, C>(engine: Engine<P, C>, position: P): Generator<C> {
  if (engine.outcome(position) !== 'active') return;
  for (const command of engine.candidates(position))
    if (!engine.step(position, command).error) yield command;
}

export interface SearchBudget {
  maxDepth: number;
  maxNodes: number;
  maxTransitions: number;
}
export interface SearchStats {
  visited: number;
  expanded: number;
  transitions: number;
  rejected: number;
  duplicates: number;
  depth: number;
}
export type SearchResult<P, C> =
  | { status: 'solved'; position: P; commands: C[]; stats: SearchStats }
  | { status: 'exhausted' | 'aborted'; stats: SearchStats }
  | { status: 'limit'; reason: 'depth' | 'nodes' | 'transitions'; stats: SearchStats };

export const DEFAULT_SEARCH_BUDGET: Readonly<SearchBudget> = {
  maxDepth: 12,
  maxNodes: 10_000,
  maxTransitions: 50_000,
};

/** Deterministic breadth-first search; shortest accepted-command solution within this action set.
 * Full seeded state is available to the engine, including hidden draws. No fair-play claim.
 */
export function search<P, C>(
  engine: Engine<P, C>,
  initial: P,
  options: Partial<SearchBudget> & { signal?: AbortSignal } = {},
): SearchResult<P, C> {
  const budget = { ...DEFAULT_SEARCH_BUDGET, ...options };
  for (const name of ['maxDepth', 'maxNodes', 'maxTransitions'] as const)
    if (!Number.isSafeInteger(budget[name]) || budget[name] < (name === 'maxNodes' ? 1 : 0))
      throw new Error(`Invalid search budget: ${name}.`);
  const stats: SearchStats = {
    visited: 1,
    expanded: 0,
    transitions: 0,
    rejected: 0,
    duplicates: 0,
    depth: 0,
  };
  const queue: { position: P; commands: C[] }[] = [{ position: initial, commands: [] }];
  const seen = new Set([engine.key(initial)]);
  let depthLimited = false;
  for (let head = 0; head < queue.length; head++) {
    if (options.signal?.aborted) return { status: 'aborted', stats };
    const node = queue[head];
    const outcome = engine.outcome(node.position);
    if (outcome === 'won') return { status: 'solved', ...node, stats };
    if (outcome === 'lost') continue;
    if (node.commands.length >= budget.maxDepth) {
      depthLimited = true;
      continue;
    }
    stats.expanded++;
    for (const command of engine.candidates(node.position)) {
      if (options.signal?.aborted) return { status: 'aborted', stats };
      if (stats.transitions >= budget.maxTransitions)
        return { status: 'limit', reason: 'transitions', stats };
      stats.transitions++;
      const next = engine.step(node.position, command);
      if (next.error) {
        stats.rejected++;
        continue;
      }
      const commands = [...node.commands, structuredClone(command)];
      stats.depth = Math.max(stats.depth, commands.length);
      const outcome = engine.outcome(next.position);
      if (outcome === 'won') return { status: 'solved', position: next.position, commands, stats };
      if (outcome === 'lost') continue;
      const key = engine.key(next.position);
      if (seen.has(key)) {
        stats.duplicates++;
        continue;
      }
      if (seen.size >= budget.maxNodes) return { status: 'limit', reason: 'nodes', stats };
      seen.add(key);
      stats.visited++;
      queue.push({ position: next.position, commands });
    }
  }
  return depthLimited
    ? { status: 'limit', reason: 'depth', stats }
    : { status: 'exhausted', stats };
}

/** Small shared enumeration helpers; no scoring, resource or timing logic. */
export function* selections<T>(items: readonly T[], max: number): Generator<T[]> {
  function* choose(start: number, selected: T[]): Generator<T[]> {
    for (let index = start; index < items.length; index++) {
      const next = [...selected, items[index]];
      yield next;
      if (next.length < max) yield* choose(index + 1, next);
    }
  }
  if (max > 0) yield* choose(0, []);
}

export function* adjacentMoves(
  ids: readonly string[],
): Generator<{ id: string; direction: -1 | 1 }> {
  // Keep both directions: a challenge can restrict commands as well as resulting positions.
  for (let index = 0; index < ids.length; index++) {
    if (index > 0) yield { id: ids[index], direction: -1 };
    if (index + 1 < ids.length) yield { id: ids[index], direction: 1 };
  }
}
