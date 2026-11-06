import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyCanid } from './canid.ts';
import { record } from './contracts.ts';
import { hashFile } from './motion-delivery.ts';

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

await test('canid checks reject altered exporter identities and malformed models with character context', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'canid-delivery-failures-'));
  t.after(() => rmSync(directory, { recursive: true }));
  for (const name of ['ash.glb', 'ash.json', 'ash.motions.json'])
    copyFileSync(new URL(`./assets/canid/refined/${name}`, import.meta.url), join(directory, name));
  const path = join(directory, 'ash.json');
  const original = record(JSON.parse(readFileSync(path, 'utf8')));
  const check = () => verifyCanid({ directory, characters: ['ash'] });
  for (const change of ['missing', 'extra', 'stale']) {
    const receipt = structuredClone(original);
    const exporters = record(receipt.exportScripts);
    const first = Object.keys(exporters)[0];
    if (change === 'missing') delete exporters[first];
    else if (change === 'extra') exporters['unexpected.py'] = '0'.repeat(64);
    else exporters[first] = '0'.repeat(64);
    writeFileSync(path, JSON.stringify(receipt));
    assert.throws(
      check,
      change === 'stale'
        ? /Canid delivery ash: Stale exporter:/
        : /Canid delivery ash: Incomplete exporter identity/,
    );
  }
  writeFileSync(join(directory, 'ash.glb'), 'Malformed model');
  original.modelSha256 = hashFile(join(directory, 'ash.glb'));
  writeFileSync(path, JSON.stringify(original));
  assert.throws(check, /Canid delivery ash: Invalid or truncated GLB/);
});

await test('fox delivery keeps five saved clips, source identity and articulated support', () => {
  const result = verifyCanid({
    characters: ['fox'],
    sources: new URL('./subjects/fox', import.meta.url).pathname,
    directory: new URL('./assets/fox', import.meta.url).pathname,
  });
  assert.deepEqual(result[0].clips, ['idle', 'look', 'sniff', 'trot', 'walk']);
});
