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
describe('Infernal Herald living assembly', () => {
  it('closes the head, coat, robe, hands and lids with outward faces and valid skin weights', () => {
    const root = createStudy('herald');
    try {
      const names = [
        'Herald_FaceNeck',
        'Herald_CoatSleeves',
        'Herald_FoldedRobe',
        'Herald_HandSkin_1',
        'Herald_StaffHand',
        'Herald_Lapel_-1',
        'Herald_Lapel_1',
      ];
      for (const s of [-1, 1]) for (const l of [-1, 1]) names.push(`Herald_LidSkin_${s}_${l}`);
      for (const name of names) {
        const g = (root.getObjectByName(name) as T.Mesh).geometry;
        expect(openEdges(g), name).toBe(0);
        expect(volume(g), name).toBeGreaterThan(0);
        expect(Array.from(g.attributes.position.array).every(Number.isFinite), name).toBe(true);
        expect(components(g), name).toBe(1);
      }
      const mesh = root.getObjectByName('Herald_FaceNeck') as T.SkinnedMesh;
      const w = mesh.geometry.attributes.skinWeight,
        j = mesh.geometry.attributes.skinIndex;
      for (let i = 0; i < w.count; i++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          const n = w.getComponent(i, k);
          sum += n;
          expect(Number.isFinite(n) && n >= 0 && n <= 1).toBe(true);
          expect(j.getComponent(i, k)).toBeLessThan(3);
        }
        expect(sum).toBeCloseTo(1, 6);
      }
    } finally {
      disposeObject(root);
    }
  });
  it('keeps boots, gripping hand and staff in contact throughout the loop', () => {
    const root = createStudy('herald'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      for (let i = 0; i < 2; i++)
        expect(
          new T.Box3().setFromObject(root.getObjectByName(`Herald_Boot_${i}`)!, true).min.y,
        ).toBeCloseTo(0.105, 6);
      expect(
        new T.Box3().setFromObject(root.getObjectByName('Herald_StaffFerrule')!, true).min.y,
      ).toBeCloseTo(0.105, 6);
      const grip = root.getObjectByName('Herald_StaffHand') as T.Mesh,
        p = grip.geometry.attributes.position;
      // Each digit surrounds the shaft and reaches its radius, rather than merely overlapping in projection.
      for (let digit = 0; digit < 4; digit++) {
        const y = 1.226 + digit * 0.028,
          points = Array.from({ length: p.count }, (_, i) =>
            new T.Vector3().fromBufferAttribute(p, i),
          ).filter((q) => Math.abs(q.y - y) < 0.011);
        expect(points.some((q) => q.x < -0.616)).toBe(true);
        expect(points.some((q) => q.z < 0.196)).toBe(true);
        expect(points.some((q) => q.z > 0.239)).toBe(true);
        const gap = Math.min(
          ...points.map((q) => Math.abs(Math.hypot(q.x + 0.6, q.z - 0.215) - 0.019)),
        );
        expect(gap).toBeLessThan(0.0045);
      }
      const fixed: T.Object3D[] = [];
      root.traverse((o) => {
        if (
          o.name.startsWith('Herald_Staff') ||
          o.name.startsWith('Herald_Boot') ||
          o.name.startsWith('Herald_Hand')
        )
          fixed.push(o);
      });
      const matrices = fixed.map((o) => o.matrixWorld.clone());
      mixer.clipAction(createStudyClip(root, 'herald')).play();
      for (let f = 0; f <= 144; f++) {
        mixer.setTime(f / 24);
        root.updateMatrixWorld(true);
        fixed.forEach((o, i) => expect(o.matrixWorld.elements).toEqual(matrices[i].elements));
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
  it('carries facial fittings and curled horns with the deforming head', () => {
    const root = createStudy('herald'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Herald_FaceNeck') as T.SkinnedMesh,
        p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight,
        j = body.geometry.attributes.skinIndex;
      const id = Array.from({ length: p.count }, (_, i) => i).find(
        (i) => j.getX(i) === 2 && w.getX(i) === 1,
      )!;
      expect(id).toBeDefined();
      const parts = [
        'Herald_CurledHorn_-1',
        'Herald_CurledHorn_1',
        'Herald_Eye_-1',
        'Herald_Eye_1',
        'Herald_Mouth',
        'Herald_Fang_-1',
        'Herald_Fang_1',
      ].map((n) => root.getObjectByName(n)!);
      const distance = parts.map((o) =>
        body.getVertexPosition(id, new T.Vector3()).distanceTo(o.getWorldPosition(new T.Vector3())),
      );
      const initial = parts[0].localToWorld(new T.Vector3(-0.425, 0.358, -0.052));
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'herald')).play();
      for (let f = 0; f <= 144; f++) {
        mixer.setTime(f / 24);
        root.updateMatrixWorld(true);
        parts.forEach((o, i) =>
          expect(
            body
              .getVertexPosition(id, new T.Vector3())
              .distanceTo(o.getWorldPosition(new T.Vector3())),
          ).toBeCloseTo(distance[i], 6),
        );
        travel = Math.max(
          travel,
          parts[0].localToWorld(new T.Vector3(-0.425, 0.358, -0.052)).distanceTo(initial),
        );
      }
      expect(travel).toBeGreaterThan(0.012);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
  it('keeps both eyes clear when open and closes real skin lids over them', () => {
    const root = createStudy('herald'),
      mixer = new T.AnimationMixer(root);
    try {
      const body = root.getObjectByName('Herald_FaceNeck') as T.SkinnedMesh;
      mixer.clipAction(createStudyClip(root, 'herald')).play();
      for (const time of [0, 0.75, 2.25, 3.7, 4.5]) {
        mixer.setTime(time);
        root.updateMatrixWorld(true);
        for (const s of [-1, 1]) {
          const eye = root.getObjectByName(`Herald_Eye_${s}`)!,
            globe = root.getObjectByName(`Herald_Eyeball_${s}`)!;
          const origin = eye.localToWorld(new T.Vector3(0, 0, 0.15)),
            direction = eye
              .localToWorld(new T.Vector3(0, 0, 0))
              .sub(origin)
              .normalize();
          const ray = new T.Raycaster(origin, direction, 0, 0.25),
            hit = ray.intersectObject(globe, false)[0];
          expect(hit).toBeDefined();
          const skinHit = ray.intersectObject(body, false)[0];
          expect(!skinHit || skinHit.distance > hit.distance).toBe(true);
          const lids = [-1, 1].map((l) => root.getObjectByName(`Herald_LidSkin_${s}_${l}`)!);
          const lidHit = ray.intersectObjects(lids, false)[0];
          if (time === 3.7) {
            expect(lidHit).toBeDefined();
            expect(lidHit.distance).toBeLessThan(hit.distance);
            for (const l of [-1, 1])
              expect(
                Math.abs(root.getObjectByName(`Herald_LidPivot_${s}_${l}`)!.rotation.x),
              ).toBeLessThan(1e-6);
          } else expect(!lidHit || lidHit.distance > hit.distance).toBe(true);
        }
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
  it('keeps the chest inside its opening and the lapels fitted over the coat', () => {
    const root = createStudy('herald');
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Herald_FaceNeck') as T.Mesh,
        coat = root.getObjectByName('Herald_CoatSleeves') as T.Mesh;
      for (const side of [-1, 1]) {
        const lapel = root.getObjectByName(`Herald_Lapel_${side}`) as T.Mesh,
          p = lapel.geometry.attributes.position;
        for (const t of [0.2, 0.5, 0.8]) {
          const y = 1.475 + t * 0.18,
            x = -0.065 + side * ((y - 1.455) * 0.62 + 0.038),
            ray = new T.Raycaster(new T.Vector3(x, y, 0.4), new T.Vector3(0, 0, -1), 0, 0.6);
          const clothHit = ray.intersectObject(coat, false)[0],
            trimHit = ray.intersectObject(lapel, false)[0],
            skinHit = ray.intersectObject(body, false)[0];
          expect(clothHit).toBeDefined();
          expect(trimHit).toBeDefined();
          expect(clothHit.distance - trimHit.distance).toBeGreaterThan(0);
          expect(clothHit.distance - trimHit.distance).toBeLessThan(0.014);
          expect(!skinHit || skinHit.distance > trimHit.distance).toBe(true);
        }
        expect(Math.min(...Array.from({ length: p.count }, (_, i) => p.getZ(i)))).toBeGreaterThan(
          -0.01,
        );
      }
    } finally {
      disposeObject(root);
    }
  });
});
