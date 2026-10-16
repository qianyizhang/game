import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { binaryContrast, holm } from './calibration.ts';

void test('paired binary evidence retains uncertainty without discordance and exact tails with it', () => {
  assert.equal(
    binaryContrast([
      [0, 0],
      [1, 1],
    ]).exactP,
    1,
  );
  const result = binaryContrast(Array.from({ length: 10 }, () => [1, 0] as const));
  assert.equal(result.difference, 1);
  assert.equal(result.exactP, 2 / 1024);
  assert.equal(result.pairedInterval95, null);
  assert.equal(
    binaryContrast([
      [1, 0],
      [0, 1],
      [1, 1],
    ]).exactP,
    1,
  );
  assert.throws(() => binaryContrast([[2, 0]]), /binary/);
  assert.throws(
    () =>
      binaryContrast(
        Array.from({ length: 1100 }, (_, i) => (i < 550 ? ([1, 0] as const) : ([0, 1] as const))),
      ),
    /1–100/,
  );
});
void test('planned family adjustment preserves identities and step-down monotonicity', () => {
  assert.deepEqual(
    holm([
      { id: 'b', p: 0.02 },
      { id: 'a', p: 0.001 },
      { id: 'c', p: 0.9 },
    ]),
    [
      { id: 'b', p: 0.02, adjustedP: 0.04 },
      { id: 'a', p: 0.001, adjustedP: 0.003 },
      { id: 'c', p: 0.9, adjustedP: 0.9 },
    ],
  );
  assert.throws(
    () =>
      holm([
        { id: 'a', p: 0 },
        { id: 'a', p: 1 },
      ]),
    /family/,
  );
});
