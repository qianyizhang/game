import { isSkinnedMesh } from '../../shared/three/objects';
import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createStudy } from './factory';
import { disposeObject } from '../../shared/three/resources';
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
function components(g: T.BufferGeometry) {
  const p = g.attributes.position,
    ids = new Map<string, number>(),
    welded: number[] = [],
    parent: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const key = [p.getX(i), p.getY(i), p.getZ(i)].map((n) => Math.round(n * 1e6)).join(',');
    if (!ids.has(key)) {
      ids.set(key, ids.size);
      parent.push(parent.length);
    }
    welded.push(ids.get(key)!);
  }
  const find = (n: number): number => {
    while (parent[n] !== n) {
      parent[n] = parent[parent[n]];
      n = parent[n];
    }
    return n;
  };
  const used = new Set<number>();
  for (let i = 0; i < g.index!.count; i += 3) {
    const [a, b, c] = [0, 1, 2].map((k) => welded[g.index!.getX(i + k)]);
    if (new Set([a, b, c]).size < 3) continue;
    used.add(a);
    used.add(b);
    used.add(c);
    parent[find(a)] = find(b);
    parent[find(c)] = find(b);
  }
  return new Set([...used].map(find)).size;
}
describe('Imp Matron living assembly', () => {
  it('closes the sculpted anatomy and sewn garment pieces with outward faces and valid weights', () => {
    const root = createStudy('matron');
    try {
      const names = [
        'Matron_ContinuousFaceNeck',
        'Matron_Hair',
        'Matron_BodiceSleeves',
        'Matron_FoldedSkirt',
        'Matron_WaistSeam',
        'Matron_Crown',
        'Matron_HandSkin_0',
        'Matron_HandSkin_1',
        'Matron_Cuff_0',
        'Matron_Cuff_1',
        'Matron_Boot_0',
        'Matron_Boot_1',
      ];
      for (const name of names) {
        const g = (root.getObjectByName(name) as T.Mesh).geometry;
        expect(openEdges(g), name).toBe(0);
        expect(volume(g), name).toBeGreaterThan(0);
        expect(components(g), name).toBe(1);
        expect(Array.from(g.attributes.position.array).every(Number.isFinite), name).toBe(true);
      }
      const hair = root.getObjectByName('Matron_Hair') as T.Mesh;
      expect((hair.material as T.MeshStandardMaterial).vertexColors).toBe(false);
      expect(hair.geometry.getAttribute('color')).toBeUndefined();
      let count = 0;
      root.traverse((o) => {
        if (!isSkinnedMesh(o)) return;
        count++;
        const w = o.geometry.attributes.skinWeight,
          j = o.geometry.attributes.skinIndex;
        let invalid = 0;
        for (let i = 0; i < w.count; i++) {
          let sum = 0;
          for (let k = 0; k < 4; k++) {
            const a = w.getComponent(i, k);
            sum += a;
            if (
              !Number.isFinite(a) ||
              a < 0 ||
              a > 1 ||
              j.getComponent(i, k) >= o.skeleton.bones.length
            )
              invalid++;
          }
          if (Math.abs(sum - 1) > 1e-6) invalid++;
        }
        expect(invalid, o.name).toBe(0);
      });
      expect(count).toBe(2);
    } finally {
      disposeObject(root);
    }
  });
  it('keeps the boots planted and the garment and hands stationary through the loop', () => {
    const root = createStudy('matron'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const fixed = [
        'Matron_Boot_0',
        'Matron_Boot_1',
        'Matron_BodiceSleeves',
        'Matron_FoldedSkirt',
        'Matron_WaistSeam',
        'Matron_Hand_0',
        'Matron_Hand_1',
        'Matron_Pendant',
      ].map((n) => root.getObjectByName(n)!);
      for (const boot of fixed.slice(0, 2) as T.Mesh[]) {
        const p = boot.geometry.attributes.position;
        expect(Math.min(...Array.from({ length: p.count }, (_, i) => p.getY(i)))).toBeCloseTo(
          0.105,
          6,
        );
      }
      const matrices = fixed.map((o) => o.matrixWorld.clone());
      const body = root.getObjectByName('Matron_ContinuousFaceNeck') as T.SkinnedMesh,
        p = body.geometry.attributes.position;
      const ids = Array.from({ length: p.count }, (_, i) => i)
          .filter((i) => p.getY(i) < 1.61)
          .filter((_, i) => i % 41 === 0),
        before = ids.map((i) => body.getVertexPosition(i, new T.Vector3()));
      expect(ids.length).toBeGreaterThan(20);
      mixer.clipAction(createStudyClip(root, 'matron')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        fixed.forEach((o, i) => expect(o.matrixWorld.elements).toEqual(matrices[i].elements));
        ids.forEach((i, j) =>
          expect(body.getVertexPosition(i, new T.Vector3()).distanceTo(before[j])).toBeLessThan(
            1e-7,
          ),
        );
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
  it('carries horns, crown and eyes with the head while the hair tips respond separately', () => {
    const root = createStudy('matron'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Matron_ContinuousFaceNeck') as T.SkinnedMesh,
        hair = root.getObjectByName('Matron_Hair') as T.SkinnedMesh;
      const headVertex = (m: T.SkinnedMesh) =>
        Array.from({ length: m.geometry.attributes.position.count }, (_, i) => i).find(
          (i) =>
            m.geometry.attributes.skinIndex.getX(i) === 2 &&
            m.geometry.attributes.skinWeight.getX(i) === 1,
        )!;
      const a = headVertex(body),
        b = headVertex(hair);
      expect(a).toBeDefined();
      expect(b).toBeDefined();
      const objects = [
        'Matron_Horn_-1',
        'Matron_Horn_1',
        'Matron_Crown',
        'Matron_Eye_-1',
        'Matron_Eye_1',
        'Matron_Mouth',
      ].map((n) => root.getObjectByName(n)!);
      const distance = objects.map((o) =>
        body.getVertexPosition(a, new T.Vector3()).distanceTo(o.getWorldPosition(new T.Vector3())),
      );
      const gap = body
        .getVertexPosition(a, new T.Vector3())
        .distanceTo(hair.getVertexPosition(b, new T.Vector3()));
      const hp = hair.geometry.attributes.position,
        tip = Array.from({ length: hp.count }, (_, i) => i).reduce(
          (a, b) => (hp.getY(a) < hp.getY(b) ? a : b),
          0,
        ),
        tip0 = hair.getVertexPosition(tip, new T.Vector3());
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'matron')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        objects.forEach((o, i) =>
          expect(
            body
              .getVertexPosition(a, new T.Vector3())
              .distanceTo(o.getWorldPosition(new T.Vector3())),
          ).toBeCloseTo(distance[i], 6),
        );
        expect(
          body
            .getVertexPosition(a, new T.Vector3())
            .distanceTo(hair.getVertexPosition(b, new T.Vector3())),
        ).toBeCloseTo(gap, 6);
        travel = Math.max(travel, hair.getVertexPosition(tip, new T.Vector3()).distanceTo(tip0));
      }
      expect(travel).toBeGreaterThan(0.001);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
  it('fits wrists within the cuffs and closes the skirt waist beneath the seam', () => {
    const root = createStudy('matron');
    try {
      root.updateMatrixWorld(true);
      const bodice = root.getObjectByName('Matron_BodiceSleeves') as T.Mesh,
        p = bodice.geometry.attributes.position;
      const nearest = (point: T.Vector3) => {
        let gap = Infinity;
        for (let i = 0; i < p.count; i++)
          gap = Math.min(gap, new T.Vector3().fromBufferAttribute(p, i).distanceTo(point));
        return gap;
      };
      for (let h = 0; h < 2; h++) {
        const hand = root.getObjectByName(`Matron_HandSkin_${h}`) as T.Mesh,
          hp = hand.geometry.attributes.position;
        const ids = Array.from({ length: hp.count }, (_, i) => i)
          .filter((i) => hp.getY(i) > 0.09 && hp.getY(i) < 0.12)
          .filter((_, i) => i % 47 === 0);
        expect(ids.length).toBeGreaterThan(3);
        for (const i of ids)
          expect(
            nearest(new T.Vector3().fromBufferAttribute(hp, i).applyMatrix4(hand.matrixWorld)),
            hand.name,
          ).toBeLessThan(0.034);
      }
      const skirt = (root.getObjectByName('Matron_FoldedSkirt') as T.Mesh).geometry,
        sp = skirt.attributes.position;
      for (let col = 0; col <= 128; col += 8) {
        const point = new T.Vector3().fromBufferAttribute(sp, 80 * 129 + col);
        expect(point.y).toBeCloseTo(1.165, 6);
        expect(nearest(point)).toBeLessThan(0.037);
      }
      // A cuff near the waist must not remove the neighboring torso's front surface.
      for (const x of [0.07, 0.11, 0.15])
        for (const y of [1.19, 1.23]) {
          const ray = new T.Raycaster(new T.Vector3(x, y, 0.6), new T.Vector3(0, 0, -1));
          const hit = ray.intersectObject(bodice, false)[0];
          expect(hit, `front robe at ${x},${y}`).toBeDefined();
          expect(hit.point.z).toBeGreaterThan(0.075);
        }
      const chest = (root.getObjectByName('Matron_ContinuousFaceNeck') as T.Mesh).geometry
        .attributes.position;
      let samples = 0;
      for (let i = 0; i < chest.count; i++) {
        const x = chest.getX(i),
          y = chest.getY(i),
          z = chest.getZ(i);
        if (y > 1.48 && y < 1.67 && z > 0.05) {
          expect(Math.abs(x + 0.035)).toBeLessThanOrEqual((y - 1.455) * 0.65 + 0.001);
          samples++;
        }
      }
      expect(samples).toBeGreaterThan(100);
      // Outer/inner skirt normals and crown wall normals must point in opposite radial directions.
      for (const name of ['Matron_FoldedSkirt', 'Matron_Crown']) {
        const g = (root.getObjectByName(name) as T.Mesh).geometry;
        if (name === 'Matron_FoldedSkirt') {
          for (let row = 0; row < 162; row++) {
            const a = new T.Vector3().fromBufferAttribute(g.attributes.normal, row * 129);
            const b = new T.Vector3().fromBufferAttribute(g.attributes.normal, row * 129 + 128);
            expect(a.distanceTo(b)).toBeLessThan(1e-7);
          }
          const i = 40 * 129 + 32,
            n = (80 + 1) * 129;
          expect(g.attributes.normal.getX(i)).toBeGreaterThan(0.8);
          expect(g.attributes.normal.getX(n + i)).toBeLessThan(-0.8);
        } else {
          expect(g.attributes.normal.getZ(0)).toBeGreaterThan(0);
          expect(g.attributes.normal.getZ(2 * 129)).toBeLessThan(0);
        }
      }
    } finally {
      disposeObject(root);
    }
  });
});
