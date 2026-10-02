import { describe, expect, it } from 'vitest';
import { legalActions, search, type Engine } from './engine';

const graph: Engine<number, number> = {
  candidates: (position) => (position === 0 ? [-1, 0, 1, 2] : position === 2 ? [3] : [0, 4]),
  step: (position, command) =>
    command < 0 ? { position, error: 'Rejected' } : { position: command },
  outcome: (position) => (position === 3 ? 'won' : position === 4 ? 'lost' : 'active'),
  key: String,
};

describe('bounded deterministic search', () => {
  it('finds a shortest legal line, handles cycles and rejects invalid candidates', () => {
    expect([...legalActions(graph, 0)]).toEqual([0, 1, 2]);
    const result = search(graph, 0);
    expect(result).toMatchObject({ status: 'solved', position: 3, commands: [2, 3] });
    expect(result.stats.rejected).toBe(1);
    expect(result.stats.duplicates).toBe(2);
    expect(search(graph, 0)).toEqual(result);
  });
  it('distinguishes exhaustive failure from each search limit and cancellation', () => {
    expect(search({ ...graph, outcome: () => 'active' }, 0).status).toBe('exhausted');
    expect(search(graph, 0, { maxDepth: 1 })).toMatchObject({ status: 'limit', reason: 'depth' });
    expect(search(graph, 0, { maxNodes: 1 })).toMatchObject({
      status: 'limit',
      reason: 'nodes',
      stats: { visited: 1 },
    });
    expect(search(graph, 0, { maxTransitions: 1 })).toMatchObject({
      status: 'limit',
      reason: 'transitions',
      stats: { transitions: 1 },
    });
    const controller = new AbortController();
    controller.abort();
    expect(search(graph, 0, { signal: controller.signal }).status).toBe('aborted');
    const second = new AbortController();
    expect(
      search(
        {
          ...graph,
          step: (p: number, c: number) => {
            second.abort();
            return graph.step(p, c);
          },
        },
        0,
        { signal: second.signal },
      ),
    ).toMatchObject({ status: 'aborted', stats: { transitions: 1 } });
  });
  it('recognizes finished positions without making another move and validates bounds', () => {
    expect(search(graph, 3, { maxDepth: 0, maxTransitions: 0 })).toMatchObject({
      status: 'solved',
      commands: [],
      stats: { transitions: 0 },
    });
    expect(search(graph, 4).status).toBe('exhausted');
    expect([...legalActions(graph, 3)]).toEqual([]);
    for (const options of [
      { maxDepth: -1 },
      { maxNodes: 0 },
      { maxTransitions: NaN },
      { maxDepth: 1.5 },
    ])
      expect(() => search(graph, 0, options)).toThrow('Invalid search budget');
  });
});
