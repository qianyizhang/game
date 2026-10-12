import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { isMesh } from '../../src/shared/three/objects.ts';
import { readGlb, accessorValues } from './glb.ts';
import { record } from './contracts.ts';

/** @param {string} path */
const read = (path) => readFileSync(new URL(path, import.meta.url));
/** @param {string} path */
const hash = (path) => createHash('sha256').update(read(path)).digest('hex');
const roots = ['Floor', 'Boundary', 'Lantern', 'Pillar'];

for (const kind of ['sepulcher', 'archive', 'cinder'])
  await test(`${kind} pins its saved static kit and keeps its surfaces inside the rules footprint contract`, async () => {
    const receipt = record(
      JSON.parse(read(`./assets/night-passage/environment-${kind}.json`).toString()),
    );
    const bytes = read(`./assets/night-passage/environment-${kind}.glb`);
    assert.equal(receipt.kind, kind);
    assert.equal(
      receipt.sourceSha256,
      hash(`./subjects/night-passage/environments/${kind}/source.blend`),
    );
    assert.equal(receipt.modelSha256, hash(`./assets/night-passage/environment-${kind}.glb`));
    assert.deepEqual(receipt.roots, roots);
    const scripts = record(receipt.exportScripts);
    const directory = new URL('./subjects/night-passage/authoring/', import.meta.url);
    for (const name of readdirSync(directory).filter((name) =>
      /^environment_[a-z]+\.py$/.test(name),
    ))
      assert.ok(name in scripts);
    assert.ok(Object.keys(scripts).length > 0);
    for (const [name, pin] of Object.entries(scripts)) {
      assert.match(name, /^environment_[a-z]+\.py$/);
      assert.equal(pin, hash(`./subjects/night-passage/authoring/${name}`));
    }
    for (const name of ['hero_form.py', 'enemy_form.py'])
      assert.equal(
        record(receipt.helperScripts)[name],
        hash(`./subjects/night-passage/authoring/${name}`),
      );
    const gltf = readGlb(bytes),
      values = gltf.accessors.map((_, i) => accessorValues(bytes, gltf, i));
    assert.equal(gltf.animations.length, 0);
    assert.equal(gltf.skins.length, 0);
    assert.equal(gltf.meshes.length, receipt.meshCount);
    assert.ok(values.every((array) => array.every(Number.isFinite)));
    assert.ok(gltf.buffers.every((buffer) => !buffer.uri));
    for (const mesh of gltf.meshes)
      for (const primitive of mesh.primitives) {
        const count = gltf.accessors[primitive.attributes.POSITION].count;
        assert.ok(count >= 3);
        assert.equal(primitive.attributes.JOINTS_0, undefined);
        assert.equal(primitive.attributes.WEIGHTS_0, undefined);
        assert.ok(primitive.indices !== undefined);
        assert.equal(values[primitive.indices].length % 3, 0);
        assert.ok(
          values[primitive.indices].every(
            (index) => Number.isInteger(index) && index >= 0 && index < count,
          ),
        );
        const normals = values[primitive.attributes.NORMAL];
        assert.equal(normals.length, count * 3);
        for (let i = 0; i < normals.length; i += 3)
          assert.ok(Math.abs(Math.hypot(normals[i], normals[i + 1], normals[i + 2]) - 1) < 0.0005);
      }
    // Use the consumer's hierarchy, including native export-axis transforms.
    const loaded = await new GLTFLoader().parseAsync(Uint8Array.from(bytes).buffer, '');
    loaded.scene.updateMatrixWorld(true);
    if (kind === 'cinder') {
      // Each seal is a closed solid. Signed volume detects inward face winding,
      // which unit-length normals and positional agreement cannot detect.
      const seals = loaded.scene.getObjectByName('Pillar_aged_copper');
      assert.ok(seals && isMesh(seals));
      const indices = seals.geometry.index;
      assert.ok(indices);
      const volumes = [0, 0, 0],
        counts = [0, 0, 0];
      for (let i = 0; i < indices.count; i += 3) {
        const vertices = [0, 1, 2].map((offset) =>
          seals
            .getVertexPosition(indices.getX(i + offset), new T.Vector3())
            .applyMatrix4(seals.matrixWorld),
        );
        if (!vertices.every((point) => point.y > 30 && point.y < 49)) continue;
        const center = vertices.reduce((sum, point) => sum.add(point), new T.Vector3());
        const directions = volumes.map((_, index) => {
          const angle = Math.PI / 6 + (index * Math.PI * 2) / 3;
          return center.x * Math.cos(angle) - center.z * Math.sin(angle);
        });
        const seal = directions.indexOf(Math.max(...directions));
        volumes[seal] += vertices[0].dot(vertices[1].clone().cross(vertices[2])) / 6;
        counts[seal]++;
      }
      assert.ok(counts.every((count) => count > 0));
      assert.ok(
        volumes.every((volume) => volume > 1),
        `Outward seal volumes: ${volumes.join(', ')}`,
      );
    }
    /** @type {Set<T.Mesh>} */
    const covered = new Set();
    try {
      for (const name of roots) {
        const part = loaded.scene.getObjectByName(name);
        assert.ok(part && !isMesh(part) && part.children.length > 0);
        const matches = [];
        loaded.scene.traverse((object) => {
          if (object.name === name) matches.push(object);
        });
        assert.equal(matches.length, 1);
        /** @type {T.Vector3[]} */
        const points = [];
        part.traverse((object) => {
          if (!isMesh(object)) return;
          covered.add(object);
          for (let i = 0; i < object.geometry.attributes.position.count; i++)
            points.push(
              object.getVertexPosition(i, new T.Vector3()).applyMatrix4(object.matrixWorld),
            );
        });
        assert.ok(points.length > 0);
        const bounds = new T.Box3().setFromPoints(points),
          expected = record(record(receipt.bounds)[name]);
        assert.ok(Array.isArray(expected.min) && Array.isArray(expected.max));
        for (const [actual, target] of [
          [bounds.min.toArray(), expected.min],
          [bounds.max.toArray(), expected.max],
        ]) {
          assert.equal(target.length, 3);
          assert.ok(actual.every((value, i) => Math.abs(value - Number(target[i])) < 0.001));
        }
        if (name === 'Floor') {
          assert.ok(bounds.max.y <= 0.001);
          assert.ok(
            bounds.min.x <= -438 &&
              bounds.max.x >= 438 &&
              bounds.min.z <= -258 &&
              bounds.max.z >= 258,
          );
        } else if (name === 'Boundary') {
          assert.ok(bounds.max.y <= 75 + 0.001);
          assert.ok(
            points.every(
              (point) =>
                point.y <= 0.001 ||
                Math.abs(point.x) >= 448 - 0.001 ||
                Math.abs(point.z) >= 268 - 0.001,
            ),
          );
        } else {
          assert.ok(Math.abs(bounds.min.y) < 0.001);
          const radius = name === 'Lantern' ? 8 : 30,
            height = name === 'Lantern' ? 44 : 81;
          assert.ok(points.every((point) => Math.hypot(point.x, point.z) <= radius + 0.001));
          assert.ok(Math.abs(bounds.max.y - height) < 0.001);
        }
      }
      loaded.scene.traverse((object) => {
        if (isMesh(object)) assert.ok(covered.has(object));
      });
    } finally {
      /** @type {Set<T.BufferGeometry>} */
      const geometries = new Set();
      /** @type {Set<T.Material>} */
      const materials = new Set();
      loaded.scene.traverse((object) => {
        if (!isMesh(object)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material])
          materials.add(material);
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    }
  });
