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

describe('Nest Guardian support and fitted motion', () => {
  it('has closed body and tail skins with finite normalized weights', () => {
    const root = createStudy('guardian');
    try {
      for (const name of ['Guardian_ContinuousAnatomy', 'Guardian_TaperedTail']) {
        const skin = root.getObjectByName(name) as T.SkinnedMesh;
        expect(openEdges(skin.geometry)).toBe(0);
        const w = skin.geometry.attributes.skinWeight,
          joints = skin.geometry.attributes.skinIndex;
        let bad = 0;
        for (let i = 0; i < w.count; i++) {
          let sum = 0;
          for (let j = 0; j < 4; j++) {
            const v = w.getComponent(i, j);
            sum += v;
            if (
              !Number.isFinite(v) ||
              v < 0 ||
              v > 1 ||
              joints.getComponent(i, j) >= skin.skeleton.bones.length
            )
              bad++;
          }
          if (Math.abs(sum - 1) > 1e-6) bad++;
        }
        expect(bad).toBe(0);
      }
    } finally {
      disposeObject(root);
    }
  });
  it('anchors the hind feet and raised hands while the fitted head and whisker roots follow', () => {
    const root = createStudy('guardian'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Guardian_ContinuousAnatomy') as T.SkinnedMesh;
      const p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight;
      const supports = Array.from({ length: p.count }, (_, i) => i).filter((i) => p.getY(i) < 0.99);
      const rest = supports.map((i) => body.getVertexPosition(i, new T.Vector3()));
      expect(Math.min(...rest.map((p) => p.y))).toBeCloseTo(0.105, 6);
      for (const [x, z] of [
        [0.17, 0.29],
        [0.33, -0.25],
      ]) {
        const sole = rest.filter((p) => Math.abs(p.x - x) < 0.18 && Math.abs(p.z - z) < 0.1);
        expect(sole.length).toBeGreaterThan(20);
        expect(Math.min(...sole.map((p) => p.y))).toBeCloseTo(0.105, 6);
      }
      const fixed: T.Object3D[] = [];
      root.traverse((n) => {
        if (n.name.startsWith('Guardian_Claw_') || n.name.startsWith('Guardian_Paw_'))
          fixed.push(n);
      });
      expect(fixed).toHaveLength(22);
      const matrices = fixed.map((n) => n.matrixWorld.clone());
      const face = root.getObjectByName('Guardian_Face')!,
        head = root.getObjectByName('Guardian_Head')!;
      const fittings = [-1, 1].flatMap((side) =>
        ['Ear', 'Whiskers'].map((part) => root.getObjectByName(`Guardian_${part}_${side}`)!),
      );
      const attachment = fittings.map((n) =>
        face.worldToLocal(n.getWorldPosition(new T.Vector3())),
      );
      const vertex = Array.from({ length: p.count }, (_, i) => i).find((i) => w.getZ(i) === 1)!;
      expect(vertex).toBeDefined();
      const distance = body
        .getVertexPosition(vertex, new T.Vector3())
        .distanceTo(face.getWorldPosition(new T.Vector3()));
      const restHead = head.quaternion.clone();
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'guardian')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        expect(
          supports.reduce(
            (max, i, j) =>
              Math.max(max, body.getVertexPosition(i, new T.Vector3()).distanceTo(rest[j])),
            0,
          ),
        ).toBeLessThan(1e-7);
        fixed.forEach((n, j) =>
          n.matrixWorld.elements.forEach((x, i) =>
            expect(x).toBeCloseTo(matrices[j].elements[i], 7),
          ),
        );
        fittings.forEach((n, j) =>
          expect(
            face.worldToLocal(n.getWorldPosition(new T.Vector3())).distanceTo(attachment[j]),
          ).toBeLessThan(1e-7),
        );
        expect(
          body
            .getVertexPosition(vertex, new T.Vector3())
            .distanceTo(face.getWorldPosition(new T.Vector3())),
        ).toBeCloseTo(distance, 6);
        travel = Math.max(travel, head.quaternion.angleTo(restHead));
      }
      expect(travel).toBeGreaterThan(0.06);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
  it('keeps the tail base and floor height fixed while the closed tip moves', () => {
    const root = createStudy('guardian'),
      mixer = new T.AnimationMixer(root);
    try {
      const tail = root.getObjectByName('Guardian_TaperedTail') as T.SkinnedMesh;
      root.updateMatrixWorld(true);
      const p = tail.geometry.attributes.position,
        uv = tail.geometry.attributes.uv;
      const rest = Array.from({ length: p.count }, (_, i) =>
        tail.getVertexPosition(i, new T.Vector3()),
      );
      const base = Array.from({ length: p.count }, (_, i) => i).filter((i) => uv.getY(i) === 0);
      expect(base.length).toBeGreaterThan(16);
      expect(Math.min(...rest.map((p) => p.y))).toBeGreaterThanOrEqual(0.105 - 1e-7);
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'guardian')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        for (let i = 0; i < p.count; i++) {
          const posed = tail.getVertexPosition(i, new T.Vector3());
          expect(posed.y).toBeCloseTo(rest[i].y, 6);
          if (i === p.count - 1) travel = Math.max(travel, posed.distanceTo(rest[i]));
        }
        expect(
          base.reduce(
            (max, i) =>
              Math.max(max, tail.getVertexPosition(i, new T.Vector3()).distanceTo(rest[i])),
            0,
          ),
        ).toBeLessThan(1e-7);
      }
      expect(travel).toBeGreaterThan(0.01);
      expect(travel).toBeLessThan(0.07);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});
