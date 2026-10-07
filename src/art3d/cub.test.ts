import { isMesh, isSkinnedMesh } from './objects';
import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createStudy, disposeObject } from './models';
import { createStudyClip } from './animation';

function openEdges(g: T.BufferGeometry) {
  const p = g.attributes.position,
    index = g.index!.array;
  const keys = new Map<string, number>(),
    welded: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const key = [p.getX(i), p.getY(i), p.getZ(i)].map((v) => Math.round(v * 1e6)).join(',');
    if (!keys.has(key)) keys.set(key, keys.size);
    welded.push(keys.get(key)!);
  }
  const edges = new Map<string, number>();
  for (let i = 0; i < index.length; i += 3) {
    const triangle = Array.from(index.slice(i, i + 3), (v) => welded[v]);
    if (new Set(triangle).size < 3) continue;
    for (let j = 0; j < 3; j++) {
      const a = triangle[j],
        b = triangle[(j + 1) % 3],
        key = a < b ? `${a}:${b}` : `${b}:${a}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  return [...edges.values()].filter((count) => count !== 2).length;
}

function volume(g: T.BufferGeometry) {
  const p = g.attributes.position,
    idx = g.index!,
    a = new T.Vector3(),
    b = new T.Vector3(),
    c = new T.Vector3();
  let result = 0;
  for (let i = 0; i < idx.count; i += 3) {
    a.fromBufferAttribute(p, idx.getX(i));
    b.fromBufferAttribute(p, idx.getX(i + 1));
    c.fromBufferAttribute(p, idx.getX(i + 2));
    result += a.dot(b.cross(c)) / 6;
  }
  return result;
}
describe('Briar Cub anatomy, support and fittings', () => {
  it('closes the body, skin and ear cups with finite weights and outward faces', () => {
    const root = createStudy('cub');
    try {
      for (const name of ['Cub_ContinuousAnatomy', 'Cub_RoundedPinna_-1', 'Cub_RoundedPinna_1']) {
        const m = root.getObjectByName(name) as T.Mesh,
          g = m.geometry;
        expect(openEdges(g), name).toBe(0);
        expect(volume(g), name).toBeGreaterThan(0);
        expect(Array.from(g.attributes.position.array).every(Number.isFinite), name).toBe(true);
      }
      const skins: T.SkinnedMesh[] = [];
      root.traverse((o) => {
        if (isSkinnedMesh(o)) skins.push(o);
      });
      expect(skins).toHaveLength(1);
      for (const skin of skins) {
        const w = skin.geometry.attributes.skinWeight,
          j = skin.geometry.attributes.skinIndex;
        let bad = 0;
        for (let i = 0; i < w.count; i++) {
          let sum = 0;
          for (let c = 0; c < 4; c++) {
            const n = w.getComponent(i, c);
            sum += n;
            if (
              !Number.isFinite(n) ||
              n < 0 ||
              n > 1 ||
              j.getComponent(i, c) >= skin.skeleton.bones.length
            )
              bad++;
          }
          if (Math.abs(sum - 1) > 1e-6) bad++;
        }
        expect(bad, skin.name).toBe(0);
      }
    } finally {
      disposeObject(root);
    }
  });
  it('keeps four soles and twenty short claws fixed through the loop', () => {
    const root = createStudy('cub'),
      mixer = new T.AnimationMixer(root);
    root.updateMatrixWorld(true);
    try {
      const skin = root.getObjectByName('Cub_ContinuousAnatomy') as T.SkinnedMesh,
        p = skin.geometry.attributes.position;
      const paws = [
        [-0.72, 0.172, 0.35],
        [-0.46, 0.172, -0.2],
        [0.28, 0.172, 0.34],
        [0.48, 0.172, -0.25],
      ];
      const sampleGroups = paws.map(([x, y, z]) =>
        Array.from({ length: p.count }, (_, i) => i).filter(
          (i) =>
            Math.abs(p.getX(i) - x) < 0.17 &&
            Math.abs(p.getY(i) - y) < 0.09 &&
            Math.abs(p.getZ(i) - z) < 0.09,
        ),
      );
      sampleGroups.forEach((ids) => {
        expect(ids.length).toBeGreaterThan(20);
        const min = Math.min(...ids.map((i) => p.getY(i)));
        expect(min).toBeCloseTo(0.105, 6);
      });
      const selected = sampleGroups.flat().filter((_, i) => i % 9 === 0),
        before = selected.map((i) => skin.getVertexPosition(i, new T.Vector3()));
      const claws: T.Mesh[] = [];
      root.traverse((o) => {
        if (isMesh(o) && o.name.startsWith('Cub_Claw_')) claws.push(o);
      });
      expect(claws).toHaveLength(20);
      const matrices = claws.map((o) => o.matrixWorld.clone());
      mixer.clipAction(createStudyClip(root, 'cub')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        selected.forEach((i, j) =>
          expect(skin.getVertexPosition(i, new T.Vector3()).distanceTo(before[j])).toBeLessThan(
            1e-7,
          ),
        );
        claws.forEach((o, i) => expect(o.matrixWorld.elements).toEqual(matrices[i].elements));
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
  it('keeps the short muzzle fitted to the turning skull through the scenting loop', () => {
    const root = createStudy('cub'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Cub_ContinuousAnatomy') as T.SkinnedMesh;
      const p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight;
      const vertex = Array.from({ length: p.count }, (_, i) => i).find((i) => w.getZ(i) === 1)!;
      expect(vertex).toBeDefined();
      const names = ['Cub_LeatherNose', 'Cub_Eye_-1', 'Cub_Eye_1', 'Cub_Ear_-1', 'Cub_Ear_1'];
      const objects = names.map((n) => root.getObjectByName(n)!);
      const distances = objects.map((o) =>
        body
          .getVertexPosition(vertex, new T.Vector3())
          .distanceTo(o.getWorldPosition(new T.Vector3())),
      );
      const start = objects[0].getWorldPosition(new T.Vector3());
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'cub')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        objects.forEach((o, i) =>
          expect(
            body
              .getVertexPosition(vertex, new T.Vector3())
              .distanceTo(o.getWorldPosition(new T.Vector3())),
          ).toBeCloseTo(distances[i], 6),
        );
        travel = Math.max(travel, objects[0].getWorldPosition(new T.Vector3()).distanceTo(start));
      }
      expect(travel).toBeGreaterThan(0.015);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});
