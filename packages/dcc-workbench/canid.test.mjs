import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyCanid } from './canid.ts';
import { record } from './contracts.ts';

await test('canid deliveries retain source identity, complete clips, contact, and valid skinning', () => {
  const result = verifyCanid();
  assert.equal(result.length, 3);
  assert.deepEqual(
    result.map((r) => r.id),
    ['ash', 'russet', 'moss'],
  );
  for (const character of result)
    assert.deepEqual(character.clips, [
      'bite',
      'flee',
      'idle',
      'look',
      'lunge',
      'roll',
      'run',
      'swipe',
      'trot',
      'walk',
    ]);
});

await test('the initial canid baseline remains valid alongside the refined delivery', () => {
  const baseline = verifyCanid({ baseline: true });
  assert.equal(baseline.length, 3);
  for (const character of baseline) assert.deepEqual(character.clips, ['idle', 'look', 'walk']);
});

await test('delivery validation rejects accidentally committed pose fixtures', () => {
  const directory = mkdtempSync(join(tmpdir(), 'canid-fixture-guard-'));
  try {
    for (const name of ['ash.glb', 'ash.json', 'ash.motions.json'])
      copyFileSync(
        new URL(`./assets/canid/refined/${name}`, import.meta.url),
        join(directory, name),
      );
    const receipt = record(JSON.parse(readFileSync(join(directory, 'ash.json'), 'utf8')));
    record(record(receipt.clips).bite).samples = [{ seconds: 0, objects: [] }];
    writeFileSync(join(directory, 'ash.json'), JSON.stringify(receipt));
    assert.throws(() => verifyCanid({ directory }), /temporary pose fixtures/);
  } finally {
    rmSync(directory, { recursive: true });
  }
});
