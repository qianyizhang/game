import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyRaven } from './raven.ts';
import { record } from './contracts.ts';

await test('raven delivery retains saved source identity, five baked motions and valid avian support', () => {
  assert.deepEqual(verifyRaven().clips, ['idle', 'look', 'preen', 'spread', 'walk']);
});

await test('raven delivery refuses a planted digit that slides through its support interval', () => {
  const directory = mkdtempSync(join(tmpdir(), 'raven-support-'));
  try {
    for (const name of ['raven.glb', 'raven.json', 'raven.motions.json'])
      copyFileSync(new URL(`./assets/raven/${name}`, import.meta.url), join(directory, name));
    const receipt = record(JSON.parse(readFileSync(join(directory, 'raven.json'), 'utf8')));
    record(record(receipt.support).walk).maximumPlantedDigitDisplacement = 0.02;
    writeFileSync(join(directory, 'raven.json'), JSON.stringify(receipt));
    assert.throws(() => verifyRaven(directory), /support failure/);
  } finally {
    rmSync(directory, { recursive: true });
  }
});
