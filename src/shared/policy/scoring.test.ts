import { expect, it } from 'vitest';
import { compareScores, scoreVector } from './scoring';
import type { ScoreDefinition } from './types';

const definition: ScoreDefinition = {
  components: [
    { name: 'victory', direction: 'maximize' },
    { name: 'progress', direction: 'maximize' },
    { name: 'victorious ticks', direction: 'minimize' },
  ],
};

it('preserves outcome precedence while comparing faster completed runs', () => {
  expect(compareScores(definition, [1, 4, 90000], [0, 4, 0])).toBe(1);
  expect(compareScores(definition, [0, 3, 0], [0, 2, 0])).toBe(1);
  expect(compareScores(definition, [1, 4, 1000], [1, 4, 2000])).toBe(1);
  expect(compareScores(definition, [1, 4, 2000], [1, 4, 1000])).toBe(-1);
  expect(compareScores(definition, [0, 3, 0], [0, 3, 0])).toBe(0);
});

it('rejects historical missing scores, malformed vectors and ambiguous definitions', () => {
  for (const score of [undefined, null, [1, 2], [1, 2, '3'], [1, 2, Infinity]])
    expect(() => scoreVector(definition, score)).toThrow(/declared/);
  expect(() => compareScores(definition, [1, 2], [1, 2, 3])).toThrow(/declared/);
  expect(() => scoreVector({ components: [] }, [])).toThrow(/declared/);
  expect(() =>
    scoreVector({ components: [definition.components[0], definition.components[0]] }, [1, 2]),
  ).toThrow(/declared/);
});
