import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readGlb, accessorValues } from './glb.ts';
import { record } from './contracts.ts';

/** @param {string} path */
const read = (path) => readFileSync(new URL(path, import.meta.url));
/** @param {string} path */
const hash = (path) => createHash('sha256').update(read(path)).digest('hex');

await test('Night Passage hero pins its saved master and has finite weighted geometry, two sockets and sixteen bounded clips', () => {
  const receipt = record(JSON.parse(read('./assets/night-passage/hero.json').toString()));
  const bytes = read('./assets/night-passage/hero.glb');
  assert.equal(receipt.sourceSha256, hash('./subjects/night-passage/hero/source.blend'));
  assert.equal(receipt.modelSha256, hash('./assets/night-passage/hero.glb'));
  const scripts = ['hero_delivery.py', 'hero_form.py', 'hero_review.py', 'hero_rig.py'];
  assert.deepEqual(Object.keys(record(receipt.exportScripts)).sort(), scripts);
  for (const name of scripts)
    assert.equal(
      record(receipt.exportScripts)[name],
      hash(`./subjects/night-passage/authoring/${name}`),
    );
  const gltf = readGlb(bytes);
  const values = gltf.accessors.map((_, index) => accessorValues(bytes, gltf, index));
  assert.ok(values.every((array) => array.every(Number.isFinite)));
  const names = [
    'bow_special',
    'cast',
    'death',
    'dodge',
    'fists_special',
    'guard',
    'idle',
    'punch',
    'punch_left',
    'run',
    'shield_special',
    'shoot',
    'slash',
    'spear_special',
    'sword_special',
    'thrust',
  ];
  assert.deepEqual(gltf.animations.map((clip) => clip.name).sort(), names);
  assert.deepEqual(Object.keys(record(receipt.clips)).sort(), names);
  assert.deepEqual(Object.keys(record(receipt.support)).sort(), names);
  // The shared delivery reader intentionally exposes only its validated contract fields.
  const document = record(JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString()));
  assert.ok(Array.isArray(document.nodes));
  assert.equal(document.nodes.filter((node) => record(node).name === 'weapon_socket').length, 1);
  assert.equal(document.nodes.filter((node) => record(node).name === 'weapon_socket_L').length, 1);
  assert.ok(gltf.skins.length > 0 && gltf.skins.every((skin) => skin.joints.length <= 20));
  let triangles = 0;
  for (const mesh of gltf.meshes)
    for (const primitive of mesh.primitives) {
      triangles += gltf.accessors[primitive.indices ?? primitive.attributes.POSITION].count / 3;
      const weights = values[primitive.attributes.WEIGHTS_0];
      const joints = values[primitive.attributes.JOINTS_0];
      assert.equal(weights.length, gltf.accessors[primitive.attributes.POSITION].count * 4);
      assert.ok(
        joints.every(
          (joint) => Number.isInteger(joint) && joint >= 0 && joint < gltf.skins[0].joints.length,
        ),
      );
      for (let i = 0; i < weights.length; i += 4)
        assert.ok(Math.abs(weights.slice(i, i + 4).reduce((a, b) => a + b, 0) - 1) < 0.0001);
      const normals = values[primitive.attributes.NORMAL];
      for (let i = 0; i < normals.length; i += 3)
        assert.ok(Math.abs(Math.hypot(normals[i], normals[i + 1], normals[i + 2]) - 1) < 0.0005);
    }
  assert.ok(triangles < 5000 && bytes.length < 1_000_000);
  assert.ok(gltf.buffers.every((buffer) => !buffer.uri));
  for (const animation of gltf.animations) {
    assert.ok(animation.name);
    const motion = record(record(receipt.clips)[animation.name]);
    const audit = record(record(receipt.support)[animation.name]);
    assert.equal(typeof motion.seconds, 'number');
    assert.equal(motion.contactPhase, 0.45);
    assert.equal(audit.frames, Math.round(Number(motion.seconds) * 30) + 1);
    assert.ok(Number(audit.minimumSurfaceHeight) >= -0.03);
    assert.ok(Number(audit.maximumFootTargetError) <= 0.02);
    if (motion.loop) assert.ok(Number(audit.loopMatrixError) < 0.001);
    for (const sampler of animation.samplers) {
      const times = values[sampler.input];
      assert.equal(times[0], 0);
      assert.ok(Math.abs(Number(times.at(-1)) - Number(motion.seconds)) < 0.00001);
      assert.ok(times.every((time, index) => !index || time > times[index - 1]));
      if (motion.loop) {
        const count = gltf.accessors[sampler.output].type === 'VEC4' ? 4 : 3;
        const first = values[sampler.output].slice(0, count),
          last = values[sampler.output].slice(-count);
        assert.ok(
          first.every((value, index) => Math.abs(value - last[index]) < 0.0001) ||
            (count === 4 && first.every((value, index) => Math.abs(value + last[index]) < 0.0001)),
        );
      }
    }
  }
});
