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

await test('four enemy deliveries pin saved masters and preserve finite weighted surfaces and bounded looping motions', () => {
  for (const kind of ['hunter', 'archer', 'brute', 'witch']) {
    const receipt = record(
      JSON.parse(read(`./assets/night-passage/enemy-${kind}.json`).toString()),
    );
    const bytes = read(`./assets/night-passage/enemy-${kind}.glb`);
    assert.equal(
      receipt.sourceSha256,
      hash(`./subjects/night-passage/enemies/${kind}/source.blend`),
    );
    assert.equal(receipt.modelSha256, hash(`./assets/night-passage/enemy-${kind}.glb`));
    const scripts = record(receipt.exportScripts);
    assert.ok(Object.keys(scripts).length > 0);
    for (const [name, pin] of Object.entries(scripts)) {
      assert.match(name, /^(enemy|hero)_[a-z]+\.py$/);
      assert.equal(pin, hash(`./subjects/night-passage/authoring/${name}`));
    }
    const gltf = readGlb(bytes);
    const values = gltf.accessors.map((_, index) => accessorValues(bytes, gltf, index));
    assert.ok(values.every((array) => array.every(Number.isFinite)));
    const names = ['attack', 'idle', 'run', 'stagger'];
    assert.deepEqual(gltf.animations.map((clip) => clip.name).sort(), names);
    assert.deepEqual(Object.keys(record(receipt.clips)).sort(), names);
    assert.ok(gltf.skins.length > 0);
    assert.ok(gltf.buffers.every((buffer) => !buffer.uri));
    for (const mesh of gltf.meshes)
      for (const primitive of mesh.primitives) {
        const weights = values[primitive.attributes.WEIGHTS_0];
        assert.equal(weights.length, gltf.accessors[primitive.attributes.POSITION].count * 4);
        for (let i = 0; i < weights.length; i += 4)
          assert.ok(Math.abs(weights.slice(i, i + 4).reduce((a, b) => a + b, 0) - 1) < 0.0001);
        const normals = values[primitive.attributes.NORMAL];
        for (let i = 0; i < normals.length; i += 3)
          assert.ok(Math.abs(Math.hypot(normals[i], normals[i + 1], normals[i + 2]) - 1) < 0.0005);
      }
    for (const animation of gltf.animations) {
      assert.ok(animation.name);
      const motion = record(record(receipt.clips)[animation.name]);
      const audit = record(record(receipt.support)[animation.name]);
      assert.equal(typeof motion.seconds, 'number');
      assert.equal(motion.contactPhase, 0.45);
      assert.equal(audit.frames, Math.round(Number(motion.seconds) * 30) + 1);
      assert.ok(Number(audit.minimumSurfaceHeight) >= -0.03);
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
              (count === 4 &&
                first.every((value, index) => Math.abs(value + last[index]) < 0.0001)),
          );
        }
      }
    }
  }
});
