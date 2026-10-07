import { publishCandidate } from './pipeline.ts';
import { createHash } from 'node:crypto';
import { readBrief, readManifest } from './contracts.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { root, verify, inspectGlb, readGlb } from './pipeline.mjs';
const brief = readBrief(readFileSync(join(root, 'briefs/briar-hydra.json'), 'utf8'));
const bytes = () => readFileSync(join(root, 'assets/briar-hydra.glb'));
await test('published source, brief, recipe and GLB hashes match the receipt', () => {
  const stats = verify();
  assert.equal(stats.animations.length, 1);
  assert.equal(stats.animations[0].name, 'Marsh Vigil');
  assert.equal(stats.joints, 22);
  assert.ok(stats.textures > 0, 'native pigment bake must reach the GLB');
});
await test('a changed source invalidates its previously published receipt', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dcc-receipt-'));
  try {
    const manifest = readManifest(readFileSync(join(root, 'assets/manifest.json'), 'utf8'));
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
await test('delivery refuses geometry and transfer-size budget overruns', () => {
  assert.throws(
    () => inspectGlb(bytes(), { ...brief, budgets: { ...brief.budgets, maxBytes: 10 } }),
    /exceeds/,
  );
  assert.throws(
    () => inspectGlb(bytes(), { ...brief, budgets: { ...brief.budgets, maxTriangles: 1 } }),
    /exceeds/,
  );
});
await test('delivery refuses truncation and inconsistent animation duration', () => {
  assert.throws(() => readGlb(bytes().subarray(0, 100)), /truncated/);
  assert.throws(
    () => inspectGlb(bytes(), { ...brief, animation: { ...brief.animation, seconds: 2 } }),
    /duration/,
  );
});

await test('non-finite geometry and broken skin weights cannot be published', () => {
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

/** @param {string} directory */
function publicationFixture(directory) {
  const delivery = join(directory, 'package');
  const candidate = join(directory, 'candidate');
  mkdirSync(candidate);
  const manifest = readManifest(readFileSync(join(root, 'assets/manifest.json'), 'utf8'));
  const files = new Set([
    ...Object.keys(manifest.sha256),
    'assets/manifest.json',
    'pipeline.ts',
    'contracts.ts',
    'blender/native_types.py',
    'blender/authoring_plan.py',
  ]);
  for (const file of files) {
    mkdirSync(dirname(join(delivery, file)), { recursive: true });
    copyFileSync(join(root, file), join(delivery, file));
  }
  for (const [from, to] of [
    ['briar-hydra.glb', 'briar-hydra.pending.glb'],
    ['authoring.json', 'authoring.json'],
    ['pose-samples.json', 'pose-samples.json'],
  ])
    copyFileSync(join(root, 'assets', from), join(candidate, to));
  return { delivery, candidate, history: join(directory, 'history') };
}

await test('invalid metadata or missing inputs cannot replace the current delivery', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'dcc-publication-'));
  try {
    const { delivery, candidate, history } = publicationFixture(temporary);
    const names = ['manifest.json', 'briar-hydra.glb', 'authoring.json', 'pose-samples.json'];
    const original = names.map((name) => readFileSync(join(delivery, 'assets', name)));
    const poses = readFileSync(join(candidate, 'pose-samples.json'));
    writeFileSync(
      join(candidate, 'pose-samples.json'),
      '{"space":"glTF world, Y up","samples":[]}',
    );
    assert.throws(() => publishCandidate(delivery, candidate, history), /Incomplete native pose/);
    writeFileSync(join(candidate, 'pose-samples.json'), poses);
    rmSync(join(delivery, 'blender/native_types.py'));
    assert.throws(() => publishCandidate(delivery, candidate, history), /ENOENT/);
    names.forEach((name, i) =>
      assert.deepEqual(readFileSync(join(delivery, 'assets', name)), original[i]),
    );
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

await test('publication preserves the artist bytes and chains the exact previous receipt', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'dcc-publication-'));
  try {
    const { delivery, candidate, history } = publicationFixture(temporary);
    const previous = readFileSync(join(delivery, 'assets/manifest.json'));
    const artist = readFileSync(join(delivery, 'sources/briar-hydra.blend'));
    const digest = createHash('sha256').update(previous).digest('hex');
    publishCandidate(delivery, candidate, history);
    assert.deepEqual(readFileSync(join(delivery, 'sources/briar-hydra.blend')), artist);
    assert.deepEqual(readFileSync(join(delivery, 'assets/receipts', digest + '.json')), previous);
    assert.deepEqual(readFileSync(join(history, digest, 'manifest.json')), previous);
    const receipt = readManifest(readFileSync(join(delivery, 'assets/manifest.json'), 'utf8'));
    assert.equal(receipt.sha256['assets/receipts/' + digest + '.json'], digest);
    assert.equal(verify(delivery).joints, 22);
    writeFileSync(join(delivery, 'assets/receipts', digest + '.json'), 'changed history');
    assert.throws(() => verify(delivery), /Stale delivery/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
