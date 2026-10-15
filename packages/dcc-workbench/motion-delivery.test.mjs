import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { accessorValues, readGlb } from './glb.ts';
import { record } from './contracts.ts';
import { readMotions } from './motion-contract.ts';
import { inspectMotionGlb, verifyFileDigests } from './motion-delivery.ts';

const original = readFileSync(new URL('./assets/boar/boar.glb', import.meta.url));
const gltf = readGlb(original);
const motions = readMotions(
  JSON.parse(readFileSync(new URL('./assets/boar/boar.motions.json', import.meta.url), 'utf8')),
);
const limits = { maxBytes: 5_000_000, maxTriangles: 110_000, maxJoints: 24 };

/** Mutate metadata while retaining the real delivered binary and valid GLB framing.
 * @param {(document: import('./contracts.ts').Gltf) => void} change
 */
function editDocument(change) {
  const document = /** @type {import('./contracts.ts').Gltf} */ (
    /** @type {unknown} */ (
      record(JSON.parse(original.subarray(20, 20 + original.readUInt32LE(12)).toString()))
    )
  );
  change(document);
  const encoded = Buffer.from(JSON.stringify(document));
  const json = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20);
  encoded.copy(json);
  const binaryChunk = original.subarray(20 + original.readUInt32LE(12));
  const result = Buffer.concat([original.subarray(0, 20), json, binaryChunk]);
  result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(json.length, 12);
  return result;
}

/** Change one scalar in the real accessor, honoring its stride and component width.
 * @param {Buffer} bytes
 * @param {number} index
 * @param {number} scalar
 * @param {number} value
 */
function writeScalar(bytes, index, scalar, value) {
  const accessor = gltf.accessors[index];
  const view = gltf.bufferViews[accessor.bufferView];
  const components = /** @type {Record<string, number>} */ ({ SCALAR: 1, VEC3: 3, VEC4: 4 })[
    accessor.type
  ];
  assert.ok(components);
  const width = accessor.componentType === 5126 ? 4 : accessor.componentType === 5123 ? 2 : 1;
  const offset =
    28 +
    original.readUInt32LE(12) +
    (view.byteOffset ?? 0) +
    (accessor.byteOffset ?? 0) +
    Math.floor(scalar / components) * (view.byteStride ?? components * width) +
    (scalar % components) * width;
  if (accessor.componentType === 5126) bytes.writeFloatLE(value, offset);
  else if (accessor.componentType === 5123) bytes.writeUInt16LE(value, offset);
  else {
    assert.equal(accessor.componentType, 5121);
    bytes.writeUInt8(value, offset);
  }
}

await test('motion delivery rejects missing clips and incorrect or non-increasing sample times', () => {
  assert.throws(
    () =>
      inspectMotionGlb(
        editDocument((doc) => {
          doc.animations.pop();
        }),
        motions,
        limits,
      ),
    /Incomplete motion clips/,
  );
  const input = gltf.animations[0].samplers[0].input;
  for (const [scalar, value] of [
    [0, 0.1],
    [1, 0],
    [gltf.accessors[input].count - 1, 99],
  ]) {
    const bytes = Buffer.from(original);
    writeScalar(bytes, input, scalar, value);
    assert.throws(() => inspectMotionGlb(bytes, motions, limits), /Invalid clip timing/);
  }
});

await test('loops must close while one-shot endpoints and opposite quaternion signs remain valid', () => {
  const animation = gltf.animations.find((item) => item.name === 'idle');
  assert.ok(animation);
  const translation = animation.samplers.find(
    (sampler) =>
      gltf.accessors[sampler.output].type === 'VEC3' &&
      gltf.animations
        .flatMap((item) => item.samplers)
        .filter((item) => item.output === sampler.output).length === 1,
  );
  assert.ok(translation);
  const moved = Buffer.from(original);
  const values = accessorValues(original, gltf, translation.output);
  writeScalar(moved, translation.output, values.length - 3, values[0] + 0.1);
  assert.throws(() => inspectMotionGlb(moved, motions, limits), /Open loop: idle/);
  inspectMotionGlb(moved, { ...motions, idle: { ...motions.idle, playback: 'once' } }, limits);

  const rotation = animation.samplers.find(
    (sampler) => gltf.accessors[sampler.output].type === 'VEC4',
  );
  assert.ok(rotation);
  const opposite = Buffer.from(original);
  const quaternion = accessorValues(original, gltf, rotation.output);
  for (let i = 0; i < 4; i++)
    writeScalar(opposite, rotation.output, quaternion.length - 4 + i, -quaternion[i]);
  inspectMotionGlb(opposite, motions, limits);
});

await test('motion delivery refuses missing skin, invalid weights or joints, normals and non-finite data', () => {
  const attributes = gltf.meshes[0].primitives[0].attributes;
  assert.throws(
    () =>
      inspectMotionGlb(
        editDocument((doc) => {
          delete doc.meshes[0].primitives[0].attributes.WEIGHTS_0;
        }),
        motions,
        limits,
      ),
    /Incomplete skin/,
  );
  for (const weights of [
    [0, 0, 0, 0],
    [-1, 2, 0, 0],
  ]) {
    const bytes = Buffer.from(original);
    weights.forEach((value, i) => writeScalar(bytes, attributes.WEIGHTS_0, i, value));
    assert.throws(() => inspectMotionGlb(bytes, motions, limits), /Invalid skin weights/);
  }
  const invalidJoint = Buffer.from(original);
  writeScalar(invalidJoint, attributes.JOINTS_0, 0, gltf.skins[0].joints.length);
  assert.throws(() => inspectMotionGlb(invalidJoint, motions, limits), /Invalid joint binding/);
  const invalidNormal = Buffer.from(original);
  for (let i = 0; i < 3; i++) writeScalar(invalidNormal, attributes.NORMAL, i, 0);
  assert.throws(() => inspectMotionGlb(invalidNormal, motions, limits), /Invalid normal/);
  const nonfinite = Buffer.from(original);
  writeScalar(nonfinite, attributes.POSITION, 0, Number.NaN);
  assert.throws(() => inspectMotionGlb(nonfinite, motions, limits), /Non-finite/);
});

await test('delivery budgets are inclusive and assets must embed their dependencies', () => {
  const stats = inspectMotionGlb(original, motions, limits);
  const exact = { maxBytes: stats.bytes, maxTriangles: stats.triangles, maxJoints: stats.joints };
  inspectMotionGlb(original, motions, exact);
  for (const key of /** @type {const} */ (['maxBytes', 'maxTriangles', 'maxJoints'])) {
    assert.throws(
      () => inspectMotionGlb(original, motions, { ...exact, [key]: exact[key] - 1 }),
      /budget exceeded/,
    );
  }
  assert.throws(
    () =>
      inspectMotionGlb(
        editDocument((doc) => {
          doc.buffers[0].uri = 'external.bin';
        }),
        motions,
        limits,
      ),
    /External dependency/,
  );
  assert.throws(
    () =>
      inspectMotionGlb(
        editDocument((doc) => {
          doc.images = [{ uri: 'external.png' }];
        }),
        motions,
        limits,
      ),
    /External dependency/,
  );
});

await test('exporter identity requires the exact declared file set and current file hashes', () => {
  const root = dirname(fileURLToPath(import.meta.url));
  const receipt = record(
    JSON.parse(readFileSync(new URL('./assets/boar/boar.json', import.meta.url), 'utf8')),
  );
  const digests = record(receipt.exportScripts);
  const expected = [
    'subjects/boar/authoring/boar_delivery.py',
    'subjects/boar/authoring/boar_rig.py',
    'subjects/boar/authoring/boar_motion.py',
    'blender/native_types.py',
  ];
  verifyFileDigests(root, expected, digests);
  const missing = { ...digests };
  delete missing[expected[0]];
  assert.throws(() => verifyFileDigests(root, expected, missing), /Incomplete exporter identity/);
  assert.throws(
    () => verifyFileDigests(root, expected, { ...digests, 'unexpected.py': 'hash' }),
    /Incomplete exporter identity/,
  );
  assert.throws(
    () => verifyFileDigests(root, expected, { ...digests, [expected[0]]: '0'.repeat(64) }),
    /Stale exporter/,
  );
});
