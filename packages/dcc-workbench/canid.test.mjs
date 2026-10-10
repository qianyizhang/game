import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyCanid } from './canid.ts';

await test('canid deliveries retain source identity, complete clips, contact, and valid skinning', () => {
  const result = verifyCanid();
  assert.equal(result.length, 3);
  assert.deepEqual(
    result.map((r) => r.id),
    ['ash', 'russet', 'moss'],
  );
});

await test('the initial canid baseline remains valid alongside the refined delivery', () => {
  const baseline = verifyCanid({ baseline: true });
  assert.equal(baseline.length, 3);
  for (const character of baseline) assert.deepEqual(character.clips, ['idle', 'look', 'walk']);
});
