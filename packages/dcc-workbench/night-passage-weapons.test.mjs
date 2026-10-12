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

await test('Night Passage armory pins editable authority, six grips and a nontrivial bow morph', () => {
  const receipt = record(JSON.parse(read('./assets/night-passage/weapons.json').toString()));
  const bytes = read('./assets/night-passage/weapons.glb');
  assert.equal(receipt.sourceSha256, hash('./subjects/night-passage/weapons/source.blend'));
  assert.equal(receipt.modelSha256, hash('./assets/night-passage/weapons.glb'));
  for (const name of ['weapon_delivery.py', 'weapon_form.py'])
    assert.equal(
      record(receipt.exportScripts)[name],
      hash(`./subjects/night-passage/authoring/${name}`),
    );
  assert.equal(
    receipt.sharedGeometrySha256,
    hash('./subjects/night-passage/authoring/hero_form.py'),
  );
  const gltf = readGlb(bytes);
  const values = gltf.accessors.map((_, index) => accessorValues(bytes, gltf, index));
  assert.ok(values.every((array) => array.every(Number.isFinite)));
  assert.equal(gltf.skins.length, 0);
  assert.equal(gltf.animations.length, 0);
  assert.ok(gltf.buffers.every((buffer) => !buffer.uri));
  let triangles = 0;
  for (const mesh of gltf.meshes)
    for (const primitive of mesh.primitives) {
      triangles += gltf.accessors[primitive.indices ?? primitive.attributes.POSITION].count / 3;
      const normals = values[primitive.attributes.NORMAL];
      for (let i = 0; i < normals.length; i += 3)
        assert.ok(Math.abs(Math.hypot(normals[i], normals[i + 1], normals[i + 2]) - 1) < 0.0005);
    }
  assert.ok(triangles > 100 && triangles < 5000 && bytes.length < 250_000);
  const document = record(JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString()));
  assert.ok(Array.isArray(document.nodes) && Array.isArray(document.meshes));
  const roots = [
    'weapon_sword',
    'weapon_spear',
    'weapon_shield',
    'weapon_bow',
    'weapon_fists_R',
    'weapon_fists_L',
  ];
  assert.deepEqual(receipt.roots, roots);
  /** @type {unknown[]} */
  const nativeNodes = document.nodes;
  for (const name of roots) {
    const nodes = nativeNodes.map(record).filter((node) => node.name === name);
    assert.equal(nodes.length, 1);
    const children = record(nodes[0]).children;
    assert.ok(Array.isArray(children) && children.length > 0);
  }
  const string = record(document.meshes.find((mesh) => record(mesh).name === 'bow_string'));
  assert.deepEqual(record(string.extras).targetNames, ['Draw']);
  assert.ok(Array.isArray(string.primitives));
  const targets = record(string.primitives[0]).targets;
  assert.ok(Array.isArray(targets));
  const morph = values[Number(record(targets[0]).POSITION)];
  assert.ok(Math.max(...morph.map(Math.abs)) > 10);
});
