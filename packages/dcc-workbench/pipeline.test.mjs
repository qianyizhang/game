import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { root, verify, inspectGlb, readGlb } from './pipeline.mjs';
const brief = JSON.parse(readFileSync(join(root, 'briefs/briar-hydra.json')));
const bytes = () => readFileSync(join(root, 'assets/briar-hydra.glb'));
test('published source, brief, recipe and GLB hashes match the receipt', () => {
  const stats = verify();
  assert.equal(stats.animations.length, 1);
  assert.equal(stats.animations[0].name, 'Marsh Vigil');
  assert.equal(stats.joints, 22);
  assert.ok(stats.textures > 0, 'native pigment bake must reach the GLB');
});
test('a changed source invalidates its previously published receipt', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dcc-receipt-'));
  try {
    const manifest = JSON.parse(readFileSync(join(root, 'assets/manifest.json')));
    for (const file of ['assets/manifest.json', ...Object.keys(manifest.sha256)]) {
      mkdirSync(dirname(join(dir, file)), { recursive: true });
      copyFileSync(join(root, file), join(dir, file));
    }
    writeFileSync(join(dir, 'sources/briar-hydra.blend'), 'changed by artist');
    assert.throws(() => verify(dir), /Stale delivery: sources\/briar-hydra.blend/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test('delivery refuses geometry and transfer-size budget overruns', () => {
  assert.throws(
    () => inspectGlb(bytes(), { ...brief, budgets: { ...brief.budgets, maxBytes: 10 } }),
    /exceeds/,
  );
  assert.throws(
    () => inspectGlb(bytes(), { ...brief, budgets: { ...brief.budgets, maxTriangles: 1 } }),
    /exceeds/,
  );
});
test('delivery refuses truncation and inconsistent animation duration', () => {
  assert.throws(() => readGlb(bytes().subarray(0, 100)), /truncated/);
  assert.throws(
    () => inspectGlb(bytes(), { ...brief, animation: { ...brief.animation, seconds: 2 } }),
    /duration/,
  );
});

test('non-finite geometry and broken skin weights cannot be published', () => {
  const corrupted = bytes();
  const gltf = readGlb(corrupted);
  const bin = 20 + corrupted.readUInt32LE(12) + 8;
  const position = gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];
  corrupted.writeFloatLE(
    NaN,
    bin + (gltf.bufferViews[position.bufferView].byteOffset ?? 0) + (position.byteOffset ?? 0),
  );
  assert.throws(() => inspectGlb(corrupted, brief), /Non-finite/);
  const badWeights = bytes();
  const weight = gltf.accessors[gltf.meshes[0].primitives[0].attributes.WEIGHTS_0];
  const start =
    bin + (gltf.bufferViews[weight.bufferView].byteOffset ?? 0) + (weight.byteOffset ?? 0);
  for (let i = 0; i < 4; i++) badWeights.writeFloatLE(0, start + i * 4);
  assert.throws(() => inspectGlb(badWeights, brief), /not normalized/);
});
