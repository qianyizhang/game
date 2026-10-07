import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createStudy, disposeObject } from './models';
import { createStudyClip } from './animation';

describe('Ancient Crocolisk structure and fitted motion', () => {
  it('keeps the joined skin closed with finite normalized skin weights', () => {
    const root = createStudy('crocolisk');
    try {
      const body = root.getObjectByName('Crocolisk_ContinuousAnatomy') as T.SkinnedMesh;
      const g = body.geometry,
        p = g.attributes.position,
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
      expect([...edges.values()].filter((count) => count !== 2)).toHaveLength(0);
      const weights = g.attributes.skinWeight,
        joints = g.attributes.skinIndex;
      let bad = 0;
      for (let i = 0; i < p.count; i++) {
        let sum = 0;
        for (let c = 0; c < 4; c++) {
          const w = weights.getComponent(i, c);
          sum += w;
          if (
            !Number.isFinite(w) ||
            w < 0 ||
            w > 1 ||
            joints.getComponent(i, c) >= body.skeleton.bones.length
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
  it('anchors feet and the tail sole while keeping the jaw, face and armor fitted', () => {
    const root = createStudy('crocolisk'),
      mixer = new T.AnimationMixer(root);
    try {
      const body = root.getObjectByName('Crocolisk_ContinuousAnatomy') as T.SkinnedMesh;
      const p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight;
      const supports = Array.from({ length: p.count }, (_, i) => i).filter((i) => p.getY(i) < 0.14);
      root.updateMatrixWorld(true);
      const rest = supports.map((i) => body.getVertexPosition(i, new T.Vector3()));
      expect(supports.length).toBeGreaterThan(50);
      expect(Math.min(...rest.map((p) => p.y))).toBeCloseTo(0.105, 6);
      const toes: T.Mesh[] = [],
        armor: T.SkinnedMesh[] = [];
      root.traverse((node) => {
        if (node instanceof T.Mesh && node.name.startsWith('Crocolisk_Toe_')) toes.push(node);
        if (node instanceof T.SkinnedMesh && node.name.includes('Scute_')) armor.push(node);
      });
      expect(toes).toHaveLength(18);
      expect(armor.length).toBeGreaterThan(30);
      const toeFrames = toes.map((n) => n.matrixWorld.clone());
      for (const toe of toes) {
        const sole = new T.Box3().setFromObject(toe).min.y;
        expect(sole).toBeGreaterThanOrEqual(0.105 - 1e-6);
        expect(sole).toBeLessThan(0.125);
      }
      for (const plate of armor) {
        expect(plate.skeleton).toBe(body.skeleton);
        const q = plate.geometry.attributes.position;
        // A missed vertical surface projection once made a scute extend to the floor.
        expect(new T.Box3().setFromObject(plate).min.y).toBeGreaterThan(0.2);
        for (let i = 0; i < q.count; i++) {
          expect(Number.isFinite(q.getX(i) + q.getY(i) + q.getZ(i))).toBe(true);
        }
        for (let i = 0; i < q.count; i += 29) {
          expect(
            plate
              .getVertexPosition(i, new T.Vector3())
              .distanceTo(new T.Vector3().fromBufferAttribute(q, i)),
          ).toBeLessThan(1e-6);
        }
      }
      const face = root.getObjectByName('Crocolisk_Face')!,
        jaw = root.getObjectByName('Crocolisk_Jaw')!,
        tail = root.getObjectByName('Crocolisk_Tail_2')!;
      const tooth = root.getObjectByName('Crocolisk_LowerTooth_1_1')!;
      const toothRelative = new T.Matrix4()
        .copy(jaw.matrixWorld)
        .invert()
        .multiply(tooth.matrixWorld);
      const jawRest = jaw.quaternion.clone(),
        tailRest = tail.quaternion.clone();
      const headVertex = Array.from({ length: p.count }, (_, i) => i).find(
        (i) => w.getY(i) === 1 && body.geometry.attributes.skinIndex.getY(i) === 1,
      )!;
      expect(headVertex).toBeDefined();
      const faceDistance = body
        .getVertexPosition(headVertex, new T.Vector3())
        .distanceTo(face.getWorldPosition(new T.Vector3()));
      let jawTravel = 0,
        tailTravel = 0;
      mixer.clipAction(createStudyClip(root, 'crocolisk')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        const drift = supports.reduce(
          (max, i, j) =>
            Math.max(max, body.getVertexPosition(i, new T.Vector3()).distanceTo(rest[j])),
          0,
        );
        expect(drift).toBeLessThan(1e-7);
        toes.forEach((toe, j) =>
          toe.matrixWorld.elements.forEach((n, i) =>
            expect(n).toBeCloseTo(toeFrames[j].elements[i], 7),
          ),
        );
        expect(
          body
            .getVertexPosition(headVertex, new T.Vector3())
            .distanceTo(face.getWorldPosition(new T.Vector3())),
        ).toBeCloseTo(faceDistance, 6);
        const local = new T.Matrix4().copy(jaw.matrixWorld).invert().multiply(tooth.matrixWorld);
        local.elements.forEach((n, i) => expect(n).toBeCloseTo(toothRelative.elements[i], 7));
        jawTravel = Math.max(jawTravel, jaw.quaternion.angleTo(jawRest));
        tailTravel = Math.max(tailTravel, tail.quaternion.angleTo(tailRest));
      }
      expect(jawTravel).toBeGreaterThan(0.04);
      expect(tailTravel).toBeGreaterThan(0.025);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});
