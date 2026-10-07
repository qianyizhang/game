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
describe('Wild Amalgam living assembly', () => {
  it('closes the body, fitted chest plate and all eight wing membranes with outward faces', () => {
    const root = createStudy('amalgam');
    try {
      const names = ['Amalgam_ContinuousAnatomy', 'Amalgam_FittedChestPlate'];
      for (const side of [-1, 1])
        for (let i = 0; i < 4; i++) names.push(`Amalgam_Membrane_${side}_${i}`);
      for (const name of names) {
        const g = (root.getObjectByName(name) as T.Mesh).geometry;
        expect(openEdges(g), name).toBe(0);
        expect(volume(g), name).toBeGreaterThan(0);
        if (name === 'Amalgam_FittedChestPlate') {
          for (const row of [8, 16, 24])
            for (const angle of [8, 24, 40]) {
              const vertex = row * 49 + angle;
              expect(g.attributes.normal.getX(vertex)).toBeLessThan(0);
              expect(g.attributes.normal.getX(1617 + vertex)).toBeGreaterThan(0);
            }
        }
        expect(Array.from(g.attributes.position.array).every(Number.isFinite), name).toBe(true);
      }
      expect(
        components((root.getObjectByName('Amalgam_ContinuousAnatomy') as T.Mesh).geometry),
      ).toBe(1);
      let count = 0;
      root.traverse((o) => {
        if (!isSkinnedMesh(o)) return;
        count++;
        const w = o.geometry.attributes.skinWeight,
          j = o.geometry.attributes.skinIndex;
        let bad = 0;
        for (let i = 0; i < w.count; i++) {
          let sum = 0;
          for (let c = 0; c < 4; c++) {
            const value = w.getComponent(i, c);
            sum += value;
            if (
              !Number.isFinite(value) ||
              value < 0 ||
              value > 1 ||
              j.getComponent(i, c) >= o.skeleton.bones.length
            )
              bad++;
          }
          if (Math.abs(sum - 1) > 1e-6) bad++;
        }
        expect(bad, o.name).toBe(0);
      });
      expect(count).toBe(18);
    } finally {
      disposeObject(root);
    }
  }, 15000);
  it('keeps all four soles, twelve claws and both shoulder pivots fixed through the loop', () => {
    const root = createStudy('amalgam'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const skin = root.getObjectByName('Amalgam_ContinuousAnatomy') as T.SkinnedMesh,
        p = skin.geometry.attributes.position;
      const feet = [
        [-0.64, 0.16, 0.43],
        [-0.31, 0.16, -0.34],
        [0.41, 0.16, 0.49],
        [0.65, 0.16, -0.34],
      ];
      const groups = feet.map(([x, y, z]) =>
        Array.from({ length: p.count }, (_, i) => i).filter(
          (i) =>
            Math.abs(p.getX(i) - x) < 0.2 &&
            Math.abs(p.getY(i) - y) < 0.063 &&
            Math.abs(p.getZ(i) - z) < 0.14,
        ),
      );
      for (const ids of groups) {
        expect(ids.length).toBeGreaterThan(20);
        expect(Math.min(...ids.map((i) => p.getY(i)))).toBeCloseTo(0.105, 6);
      }
      const selected = groups.flat().filter((_, i) => i % 11 === 0),
        before = selected.map((i) => skin.getVertexPosition(i, new T.Vector3()));
      const claws: T.Mesh[] = [];
      root.traverse((o) => {
        if (isMesh(o) && o.name.startsWith('Amalgam_Claw_')) claws.push(o);
      });
      expect(claws).toHaveLength(12);
      const matrices = claws.map((o) => o.matrixWorld.clone());
      const wings = [-1, 1].map((side) => root.getObjectByName(`Amalgam_WingRoot_${side}`)!);
      const anchors = wings.map((o) => o.getWorldPosition(new T.Vector3()));
      mixer.clipAction(createStudyClip(root, 'amalgam')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        selected.forEach((i, j) =>
          expect(skin.getVertexPosition(i, new T.Vector3()).distanceTo(before[j])).toBeLessThan(
            1e-7,
          ),
        );
        claws.forEach((o, i) => expect(o.matrixWorld.elements).toEqual(matrices[i].elements));
        wings.forEach((o, i) =>
          expect(o.getWorldPosition(new T.Vector3()).distanceTo(anchors[i])).toBeLessThan(1e-7),
        );
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
  it('carries the horn and recessed eyes with the skull and keeps each membrane fitted to its finger', () => {
    const root = createStudy('amalgam'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Amalgam_ContinuousAnatomy') as T.SkinnedMesh,
        p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight,
        j = body.geometry.attributes.skinIndex;
      const vertex = Array.from({ length: p.count }, (_, i) => i).find(
        (i) => j.getX(i) === 2 && w.getX(i) === 1,
      )!;
      expect(vertex).toBeDefined();
      const objects = [
        'Amalgam_SweptHorn',
        'Amalgam_Eye_-1',
        'Amalgam_Eye_1',
        'Amalgam_Mouth_-1',
        'Amalgam_Mouth_1',
      ].map((n) => root.getObjectByName(n)!);
      const distance = objects.map((o) =>
        body
          .getVertexPosition(vertex, new T.Vector3())
          .distanceTo(o.getWorldPosition(new T.Vector3())),
      );
      const pairs: {
        mem: T.SkinnedMesh;
        finger: T.SkinnedMesh;
        m: number;
        f: number;
        gap: number;
      }[] = [];
      for (const side of [-1, 1])
        for (let patch = 0; patch < 3; patch++) {
          const mem = root.getObjectByName(`Amalgam_Membrane_${side}_${patch}`) as T.SkinnedMesh,
            finger = root.getObjectByName(`Amalgam_WingFinger_${side}_${patch}`) as T.SkinnedMesh;
          for (const row of [8, 16, 24, 32]) {
            const m = row * 17,
              a = mem.getVertexPosition(m, new T.Vector3());
            let f = 0,
              gap = Infinity;
            for (let i = 0; i < finger.geometry.attributes.position.count; i++) {
              const d = finger.getVertexPosition(i, new T.Vector3()).distanceTo(a);
              if (d < gap) {
                gap = d;
                f = i;
              }
            }
            expect(gap).toBeLessThan(0.035);
            pairs.push({ mem, finger, m, f, gap });
          }
        }
      const hornTip = () => objects[0].localToWorld(new T.Vector3(0, 0.69, -0.33));
      const start = hornTip();
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'amalgam')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        objects.forEach((o, i) =>
          expect(
            body
              .getVertexPosition(vertex, new T.Vector3())
              .distanceTo(o.getWorldPosition(new T.Vector3())),
          ).toBeCloseTo(distance[i], 6),
        );
        for (const pair of pairs) {
          const gap = pair.mem
            .getVertexPosition(pair.m, new T.Vector3())
            .distanceTo(pair.finger.getVertexPosition(pair.f, new T.Vector3()));
          expect(Math.abs(gap - pair.gap)).toBeLessThan(0.002);
        }
        travel = Math.max(travel, hornTip().distanceTo(start));
      }
      expect(travel).toBeGreaterThan(0.015);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
  it('keeps the fused wing wrists and surface-fitted chest plate attached while flexing', () => {
    const root = createStudy('amalgam'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Amalgam_ContinuousAnatomy') as T.SkinnedMesh;
      const p = body.geometry.attributes.position;
      const nearest = (point: T.Vector3) => {
        let index = 0,
          gap = Infinity;
        for (let i = 0; i < p.count; i++) {
          const d = body.getVertexPosition(i, new T.Vector3()).distanceTo(point);
          if (d < gap) {
            index = i;
            gap = d;
          }
        }
        return { index, gap };
      };
      const plate = root.getObjectByName('Amalgam_FittedChestPlate') as T.SkinnedMesh;
      const fittings: { mesh: T.SkinnedMesh; vertex: number; index: number; gap: number }[] = [];
      // Sample the full front of the plate, including rim and central regions.
      for (let vertex = 80; vertex < 1617; vertex += 107) {
        const match = nearest(plate.getVertexPosition(vertex, new T.Vector3()));
        expect(match.gap).toBeLessThan(0.03);
        fittings.push({ mesh: plate, vertex, ...match });
      }
      for (const side of [-1, 1]) {
        const arm = root.getObjectByName(`Amalgam_WingFinger_${side}_0`) as T.SkinnedMesh;
        const elbow = new T.Vector3(...(side > 0 ? [0.31, 1.65, 0.44] : [0.38, 1.38, -0.4]));
        let vertex = 0,
          distance = Infinity;
        for (let i = 0; i < arm.geometry.attributes.position.count; i++) {
          const d = arm.getVertexPosition(i, new T.Vector3()).distanceTo(elbow);
          if (d < distance) {
            vertex = i;
            distance = d;
          }
        }
        const match = nearest(arm.getVertexPosition(vertex, new T.Vector3()));
        expect(match.gap).toBeLessThan(0.035);
        fittings.push({ mesh: arm, vertex, ...match });
      }
      mixer.clipAction(createStudyClip(root, 'amalgam')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        for (const f of fittings) {
          const gap = f.mesh
            .getVertexPosition(f.vertex, new T.Vector3())
            .distanceTo(body.getVertexPosition(f.index, new T.Vector3()));
          expect(Math.abs(gap - f.gap), f.mesh.name).toBeLessThan(0.002);
        }
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
});
