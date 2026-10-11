import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyBoar } from './boar.ts';
import { record } from './contracts.ts';

await test('boar delivery retains saved source identity, five baked motions and valid cloven support', () => {
  assert.deepEqual(verifyBoar().clips, ['charge', 'idle', 'root', 'trot', 'walk']);
});

await test('boar delivery refuses a planted digit that slides through its support interval', () => {
  const directory = mkdtempSync(join(tmpdir(), 'boar-support-'));
  try {
    for (const name of ['boar.glb', 'boar.json', 'boar.motions.json'])
      copyFileSync(new URL(`./assets/boar/${name}`, import.meta.url), join(directory, name));
    const receipt = record(JSON.parse(readFileSync(join(directory, 'boar.json'), 'utf8')));
    record(record(receipt.support).walk).maximumPlantedDigitDisplacement = 0.02;
    writeFileSync(join(directory, 'boar.json'), JSON.stringify(receipt));
    assert.throws(() => verifyBoar(directory), /support failure/);
  } finally {
    rmSync(directory, { recursive: true });
  }
});
