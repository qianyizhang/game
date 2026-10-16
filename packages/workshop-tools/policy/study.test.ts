import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { cohortSeeds, meanInterval } from './study.ts';
void test('development and reserved seed blocks stay disjoint and paired intervals preserve signed differences', () => {
  const dev = cohortSeeds('development'),
    evaluation = cohortSeeds('evaluation');
  assert.equal(dev.length, 10);
  assert.equal(evaluation.length, 20);
  assert.equal(new Set([...dev, ...evaluation]).size, 30);
  const result = meanInterval(Array.from({ length: 20 }, () => -2));
  assert.equal(result.mean, -2);
  assert.deepEqual(result.interval95, [-2, -2]);
});
