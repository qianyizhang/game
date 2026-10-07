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

describe('Ancient Tortoise shell, support and fittings', () => {
  it('keeps the skin and shell pieces closed, outward and finite', () => {
    const root = createStudy('tortoise');
    try {
      for (const name of [
        'Tortoise_ContinuousAnatomy',
        'Tortoise_Carapace',
        'Tortoise_Plastron',
        'Tortoise_Bridge_-1',
        'Tortoise_Bridge_1',
      ]) {
        const mesh = root.getObjectByName(name) as T.Mesh,
          g = mesh.geometry,
          p = g.attributes.position,
          idx = g.index!;
        expect(openEdges(g), name).toBe(0);
        expect(Array.from(p.array).every(Number.isFinite), name).toBe(true);
        let volume = 0;
        const a = new T.Vector3(),
          b = new T.Vector3(),
          c = new T.Vector3();
        for (let i = 0; i < idx.count; i += 3) {
          a.fromBufferAttribute(p, idx.getX(i));
          b.fromBufferAttribute(p, idx.getX(i + 1));
          c.fromBufferAttribute(p, idx.getX(i + 2));
          volume += a.dot(b.cross(c)) / 6;
        }
        expect(volume, name).toBeGreaterThan(0);
      }
      const skin = root.getObjectByName('Tortoise_ContinuousAnatomy') as T.SkinnedMesh;
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
      expect(bad).toBe(0);
    } finally {
      disposeObject(root);
    }
  });
  it('anchors four feet, claws and shell while the fitted face turns', () => {
    const root = createStudy('tortoise'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const skin = root.getObjectByName('Tortoise_ContinuousAnatomy') as T.SkinnedMesh;
      const p = skin.geometry.attributes.position,
        w = skin.geometry.attributes.skinWeight;
      const supports = Array.from({ length: p.count }, (_, i) => i).filter((i) => p.getY(i) < 0.28),
        rest = supports.map((i) => skin.getVertexPosition(i, new T.Vector3()));
      for (const [x, z] of [
        [-0.66, 0.49],
        [-0.39, -0.48],
        [0.61, 0.46],
        [0.64, -0.43],
      ]) {
        const sole = rest.filter((p) => Math.abs(p.x - x) < 0.16 && Math.abs(p.z - z) < 0.13);
        expect(sole.length).toBeGreaterThan(20);
        expect(Math.min(...sole.map((p) => p.y))).toBeCloseTo(0.105, 6);
      }
      const fixed: T.Mesh[] = [],
        claws: T.Object3D[] = [];
      root.traverse((n) => {
        if (
          n instanceof T.Mesh &&
          !(n instanceof T.SkinnedMesh) &&
          !n.name.startsWith('Tortoise_Orbit') &&
          !n.name.startsWith('Tortoise_Iris') &&
          !n.name.startsWith('Tortoise_Pupil') &&
          !n.name.startsWith('Tortoise_Glint') &&
          !n.name.startsWith('Tortoise_Lip') &&
          !n.name.startsWith('Tortoise_Nostril')
        )
          fixed.push(n);
        if (n.name.startsWith('Tortoise_Claw_')) claws.push(n);
      });
      expect(claws).toHaveLength(18);
      const matrices = fixed.map((n) => n.matrixWorld.clone());
      const face = root.getObjectByName('Tortoise_Face')!,
        head = root.getObjectByName('Tortoise_Head')!,
        eye = root.getObjectByName('Tortoise_Eye_1')!;
      const vertex = Array.from({ length: p.count }, (_, i) => i).find((i) => w.getZ(i) === 1)!;
      expect(vertex).toBeDefined();
      const distance = skin
          .getVertexPosition(vertex, new T.Vector3())
          .distanceTo(face.getWorldPosition(new T.Vector3())),
        eyeRoot = face.worldToLocal(eye.getWorldPosition(new T.Vector3())),
        headRest = head.quaternion.clone();
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'tortoise')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        expect(
          supports.reduce(
            (max, i, j) =>
              Math.max(max, skin.getVertexPosition(i, new T.Vector3()).distanceTo(rest[j])),
            0,
          ),
        ).toBeLessThan(1e-7);
        fixed.forEach((n, j) =>
          n.matrixWorld.elements.forEach((x, i) =>
            expect(x).toBeCloseTo(matrices[j].elements[i], 7),
          ),
        );
        expect(
          skin
            .getVertexPosition(vertex, new T.Vector3())
            .distanceTo(face.getWorldPosition(new T.Vector3())),
        ).toBeCloseTo(distance, 6);
        expect(
          face.worldToLocal(eye.getWorldPosition(new T.Vector3())).distanceTo(eyeRoot),
        ).toBeLessThan(1e-7);
        travel = Math.max(travel, head.quaternion.angleTo(headRest));
      }
      expect(travel).toBeGreaterThan(0.045);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
  it('fits projected foreleg plates and plants to actual supporting surfaces', () => {
    const root = createStudy('tortoise');
    try {
      root.updateMatrixWorld(true);
      const plates: T.Mesh[] = [];
      root.traverse((n) => {
        if (n instanceof T.Mesh && n.name.startsWith('Tortoise_ForelegScute_')) plates.push(n);
      });
      expect(plates).toHaveLength(14);
      for (const plate of plates) {
        const p = plate.geometry.attributes.position;
        expect(Array.from(p.array).every(Number.isFinite)).toBe(true);
        expect(openEdges(plate.geometry)).toBe(0);
        for (let i = 0; i < p.count; i++) {
          expect(p.getY(i)).toBeGreaterThan(0.17);
          expect(p.getY(i)).toBeLessThan(0.47);
        }
      }
      const shell = root.getObjectByName('Tortoise_Carapace') as T.Mesh;
      for (let patch = 0; patch < 2; patch++) {
        const stem = root.getObjectByName(`Tortoise_ShellStem_${patch}`) as T.Mesh,
          p = stem.geometry.attributes.position;
        const base = new T.Vector3().fromBufferAttribute(p, p.count - 2);
        const ray = new T.Raycaster(
          base.clone().add(new T.Vector3(0, 0.1, 0)),
          new T.Vector3(0, -1, 0),
        );
        const hits = ray.intersectObject(shell, false);
        expect(hits.length).toBeGreaterThan(0);
        expect(base.distanceTo(hits[0].point)).toBeLessThan(0.008);
        for (let leaf = 0; leaf < 3; leaf++) {
          const g = (root.getObjectByName(`Tortoise_ShellLeaf_${patch}_${leaf}`) as T.Mesh)
              .geometry,
            l = g.attributes.position,
            rootPoint = new T.Vector3().fromBufferAttribute(l, l.count - 2);
          let gap = Infinity;
          for (let i = 0; i < p.count; i++)
            gap = Math.min(gap, rootPoint.distanceTo(new T.Vector3().fromBufferAttribute(p, i)));
          expect(gap).toBeLessThan(0.009);
        }
      }
    } finally {
      disposeObject(root);
    }
  });
});
