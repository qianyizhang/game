import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyOtter } from './otter.ts';
import { record } from './contracts.ts';

await test('otter delivery retains saved source identity, five baked motions and valid five-toed paw support', () => {
  assert.deepEqual(verifyOtter().clips, ['bound', 'groom', 'idle', 'scent', 'walk']);
});

await test('otter delivery refuses a planted digit that slides through its support interval', () => {
  const directory = mkdtempSync(join(tmpdir(), 'otter-support-'));
  try {
    for (const name of ['otter.glb', 'otter.json', 'otter.motions.json'])
      copyFileSync(new URL(`./assets/otter/${name}`, import.meta.url), join(directory, name));
    const receipt = record(JSON.parse(readFileSync(join(directory, 'otter.json'), 'utf8')));
    record(record(receipt.support).walk).maximumPlantedDigitDisplacement = 0.02;
    writeFileSync(join(directory, 'otter.json'), JSON.stringify(receipt));
    assert.throws(() => verifyOtter(directory), /support failure/);
  } finally {
    rmSync(directory, { recursive: true });
  }
});
