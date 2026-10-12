import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { readGlb, accessorValues } from './glb.ts';
import { record } from './contracts.ts';

/** @param {string} path */
const read = (path) => readFileSync(new URL(path, import.meta.url));
/** @param {string} path */
const hash = (path) => createHash('sha256').update(read(path)).digest('hex');

for (const { kind, names, expectedFrames } of [
  {
    kind: 'bellwarden',
    names: ['idle', 'rain', 'run', 'stagger', 'sweep', 'wheel'],
    expectedFrames: 237,
  },
  {
    kind: 'undertow',
    names: ['charge', 'idle', 'pulse', 'run', 'stagger', 'volley'],
    expectedFrames: 237,
  },
  {
    kind: 'ashregent',
    names: ['cross', 'idle', 'rain', 'run', 'stagger', 'volley'],
    expectedFrames: 237,
  },
  {
    kind: 'sovereign',
    names: ['cross', 'idle', 'pulse', 'rain', 'run', 'stagger', 'wheel'],
    expectedFrames: 280,
  },
]) {
  await test(`${kind} pins its saved source and exports finite weighted surfaces with ${names.length} bounded clips`, () => {
    const receipt = record(
      JSON.parse(read(`./assets/night-passage/guardian-${kind}.json`).toString()),
    );
    assert.equal(
      receipt.sourceSha256,
      hash(`./subjects/night-passage/guardians/${kind}/source.blend`),
    );
    assert.equal(receipt.modelSha256, hash(`./assets/night-passage/guardian-${kind}.glb`));
    const scripts = record(receipt.exportScripts);
    const authoring = new URL('./subjects/night-passage/authoring/', import.meta.url);
    for (const name of readdirSync(authoring).filter((name) => /^guardian_[a-z]+\.py$/.test(name)))
      assert.ok(name in scripts);
    assert.ok(Object.keys(scripts).some((name) => name.startsWith('guardian_')));
    for (const [name, pin] of Object.entries(scripts)) {
      assert.match(name, /^(guardian_[a-z]+|enemy_form|enemy_rig|hero_form|hero_rig)\.py$/);
      assert.equal(pin, hash(`./subjects/night-passage/authoring/${name}`));
    }
    const bytes = read(`./assets/night-passage/guardian-${kind}.glb`),
      gltf = readGlb(bytes);
    const values = gltf.accessors.map((_, index) => accessorValues(bytes, gltf, index));
    assert.ok(values.every((array) => array.every(Number.isFinite)));
    assert.deepEqual(gltf.animations.map((clip) => clip.name).sort(), names);
    assert.deepEqual(Object.keys(record(receipt.clips)).sort(), names);
    assert.ok(gltf.skins.length > 0);
    assert.ok(gltf.buffers.every((buffer) => !buffer.uri));
    for (const mesh of gltf.meshes)
      for (const primitive of mesh.primitives) {
        const count = gltf.accessors[primitive.attributes.POSITION].count;
        const weights = values[primitive.attributes.WEIGHTS_0],
          joints = values[primitive.attributes.JOINTS_0];
        assert.equal(weights.length, count * 4);
        assert.equal(joints.length, weights.length);
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
        assert.ok(primitive.indices !== undefined);
        assert.ok(
          values[primitive.indices].every(
            (index) => Number.isInteger(index) && index >= 0 && index < count,
          ),
        );
      }
    for (const animation of gltf.animations) {
      assert.ok(animation.name);
      const motion = record(record(receipt.clips)[animation.name]),
        audit = record(record(receipt.support)[animation.name]);
      assert.equal(typeof motion.seconds, 'number');
      assert.ok(Number(motion.seconds) > 0);
      assert.equal(motion.contactPhase, 0.45);
      assert.equal(motion.loop, animation.name === 'idle' || animation.name === 'run');
      assert.equal(audit.frames, Math.round(Number(motion.seconds) * 30) + 1);
      assert.ok(Number(audit.minimumSurfaceHeight) >= -0.03);
      assert.ok(Number(audit.maximumFootTargetError) < 0.02);
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
    let frames = 0;
    for (const audit of Object.values(record(receipt.support)))
      frames += Number(record(audit).frames);
    assert.equal(frames, expectedFrames);
  });
}
