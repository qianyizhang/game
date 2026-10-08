import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectGlb } from './glb.ts';

/** A real triangle GLB, optionally with a three-key rigid loop; no artificial skeleton.
 * @param {boolean} animated
 */
function triangle(animated = false) {
  const data = new Float32Array([
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    ...(animated ? [0, 1, 2, 0, 0, 0, 0, 0.25, 0, 0, 0, 0] : []),
  ]);
  const binary = Buffer.from(data.buffer);
  const document = {
    asset: { version: '2.0' },
    buffers: [{ byteLength: binary.length }],
    bufferViews: [
      { buffer: 0, byteLength: 36 },
      ...(animated
        ? [
            { buffer: 0, byteOffset: 36, byteLength: 12 },
            { buffer: 0, byteOffset: 48, byteLength: 36 },
          ]
        : []),
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
      ...(animated
        ? [
            { bufferView: 1, componentType: 5126, count: 3, type: 'SCALAR', min: [0], max: [2] },
            { bufferView: 2, componentType: 5126, count: 3, type: 'VEC3' },
          ]
        : []),
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    nodes: [{ mesh: 0 }],
    scenes: [{ nodes: [0] }],
    scene: 0,
    ...(animated
      ? {
          animations: [
            {
              name: 'Turn',
              samplers: [{ input: 1, output: 2 }],
              channels: [{ sampler: 0, target: { node: 0, path: 'translation' } }],
            },
          ],
        }
      : {}),
  };
  const encoded = Buffer.from(JSON.stringify(document));
  const json = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20);
  encoded.copy(json);
  const bytes = Buffer.alloc(28 + json.length + binary.length);
  bytes.writeUInt32LE(0x46546c67, 0);
  bytes.writeUInt32LE(2, 4);
  bytes.writeUInt32LE(bytes.length, 8);
  bytes.writeUInt32LE(json.length, 12);
  bytes.writeUInt32LE(0x4e4f534a, 16);
  json.copy(bytes, 20);
  bytes.writeUInt32LE(binary.length, 20 + json.length);
  bytes.writeUInt32LE(0x004e4942, 24 + json.length);
  binary.copy(bytes, 28 + json.length);
  return bytes;
}
const base = {
  id: 'fixture',
  animation: undefined,
  budgets: { maxBytes: 10000, maxTriangles: 10, maxJoints: 0 },
};

await test('static delivery has real geometry without inventing bones or motion', () => {
  const result = inspectGlb(triangle(), base, 'static');
  assert.equal(result.triangles, 1);
  assert.equal(result.joints, 0);
  assert.equal(result.animations.length, 0);
  assert.throws(() => inspectGlb(triangle(), base, 'skinned'), /Animation brief/);
});

await test('rigid delivery carries a bounded loop without skin weights', () => {
  const brief = { ...base, animation: { seconds: 2 } };
  const result = inspectGlb(triangle(true), brief, 'rigid');
  assert.equal(result.animations[0].name, 'Turn');
  assert.equal(result.joints, 0);
  assert.throws(() => inspectGlb(triangle(), brief, 'rigid'), /Animation count/);
  assert.throws(() => inspectGlb(triangle(true), base, 'static'), /duration/);
  assert.throws(() => inspectGlb(triangle(true), brief, 'skinned'), /rigged animated/);
});

await test('a malformed triangle accessor cannot pass because its total count looks plausible', () => {
  const bytes = triangle();
  const text = bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString();
  // Same-length mutation preserves GLB structure and specifically attacks vertex arity.
  bytes.write(text.replace('"type":"VEC3"', '"type":"VEC2"'), 20);
  assert.throws(() => inspectGlb(bytes, base, 'static'), /triangle positions/);
});
