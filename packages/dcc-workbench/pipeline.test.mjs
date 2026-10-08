import { createHash } from 'node:crypto';
import { readBrief } from './contracts.ts';
import { loadRegistry } from './registry.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, verify, inspectGlb, readGlb } from './pipeline.mjs';
import baseline from './references/comparison/baseline.json' with { type: 'json' };
import qualityBaseline from './references/comparison/quality-baseline.json' with { type: 'json' };
const brief = readBrief(readFileSync(join(root, 'briefs/briar-hydra.json'), 'utf8'));
const bytes = () => readFileSync(join(root, 'assets/briar-hydra.glb'));
await test('every published subject retains its declared rig, motion and embedded materials', () => {
  for (const asset of Object.values(loadRegistry(root).assets)) {
    const stats = verify(root, asset.id);
    assert.equal(stats.animations.length, asset.delivery.animation ? 1 : 0);
    assert.equal(stats.animations[0]?.name, asset.delivery.animation?.name);
    assert.equal(stats.joints > 0, asset.delivery.profile === 'skinned');
    assert.ok(stats.materials > 0, `${asset.id} must retain authored materials`);
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

await test('comparison baselines retain their pinned bytes and distinct identities', () => {
  assert.equal(
    createHash('sha256')
      .update(readFileSync(join(root, qualityBaseline.asset)))
      .digest('hex'),
    qualityBaseline.sha256,
  );
  for (const file of /** @type {const} */ ([
    'references/comparison/accepted-hydra.glb',
    'references/comparison/blender-before.glb',
  ])) {
    const content = readFileSync(join(root, file));
    assert.equal(createHash('sha256').update(content).digest('hex'), baseline.sha256[file]);
    assert.equal(readGlb(content).animations.length, 1);
  }
  assert.notEqual(
    createHash('sha256').update(bytes()).digest('hex'),
    baseline.sha256['references/comparison/blender-before.glb'],
    'The before/after comparison must contain the gesture revision',
  );
});
