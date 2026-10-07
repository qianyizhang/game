import { isSkinnedMesh } from './objects';
import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createStudy, disposeObject } from './models';
import { createStudyClip } from './animation';
import { taperedSpineField } from './wolf';

describe('living Wolf support and skin', () => {
  it('keeps a closed skin, normalized weights, and fitted features through its loop', () => {
    const root = createStudy('wolf');
    const body = root.getObjectByName('Wolf_ContinuousAnatomy') as T.SkinnedMesh;
    const tail = root.getObjectByName('Wolf_LivingTail') as T.SkinnedMesh;
    const mixer = new T.AnimationMixer(root);
    try {
      const edges = new Map<string, number>();
      // UV seams may duplicate vertices. Closure is tested after welding equal positions.
      const skinPositions = body.geometry.attributes.position;
      const keys = new Map<string, number>();
      const welded = Array.from({ length: skinPositions.count }, (_, i) => {
        const key = [skinPositions.getX(i), skinPositions.getY(i), skinPositions.getZ(i)]
          .map((n) => Math.round(n * 1e6))
          .join(',');
        if (!keys.has(key)) keys.set(key, keys.size);
        return keys.get(key)!;
      });
      const indices = Array.from(body.geometry.index!.array, (i) => welded[i]);
      for (let i = 0; i < indices.length; i += 3) {
        const triangle = Array.from(indices.slice(i, i + 3));
        if (new Set(triangle).size !== 3) continue;
        for (let j = 0; j < 3; j++) {
          const a = triangle[j],
            b = triangle[(j + 1) % 3];
          const key = a < b ? `${a}:${b}` : `${b}:${a}`;
          edges.set(key, (edges.get(key) ?? 0) + 1);
        }
      }
      expect([...edges.values()].filter((count) => count !== 2)).toHaveLength(0);
      const skins: T.SkinnedMesh[] = [];
      root.traverse((node) => {
        if (isSkinnedMesh(node)) skins.push(node);
      });
      for (const skin of skins) {
        const weights = skin.geometry.getAttribute('skinWeight');
        const joints = skin.geometry.getAttribute('skinIndex');
        const invalid: number[] = [];
        for (let i = 0; i < weights.count; i++) {
          let sum = 0;
          for (let c = 0; c < 4; c++) {
            const w = weights.getComponent(i, c);
            if (
              !Number.isFinite(w) ||
              w < 0 ||
              w > 1 ||
              joints.getComponent(i, c) >= skin.skeleton.bones.length
            )
              invalid.push(i);
            sum += w;
          }
          if (Math.abs(sum - 1) > 1e-6) invalid.push(i);
        }
        expect(invalid, skin.name).toEqual([]);
      }
      root.updateMatrixWorld(true);
      const p = body.geometry.attributes.position;
      const supports = Array.from({ length: p.count }, (_, i) => i).filter((i) => p.getY(i) < 0.24);
      const rest = supports.map((i) => body.getVertexPosition(i, new T.Vector3()));
      expect(Math.min(...rest.map((p) => p.y))).toBeCloseTo(0.105, 6);
      // A facial landmark in the joined head must follow the same frame as its fitted nose.
      const nose = root.getObjectByName('Wolf_LeatherNose')!;
      const head = root.getObjectByName('Wolf_Head')!;
      const antlers = root.getObjectByName('Wolf_BranchingAntlers')!;
      const antlerSocket = head.matrixWorld.clone().invert().multiply(antlers.matrixWorld);
      const headVertex = Array.from({ length: p.count }, (_, i) => i).find(
        (i) => body.geometry.attributes.skinWeight.getZ(i) === 1,
      )!;
      expect(headVertex).toBeDefined();
      const landmark = body.getVertexPosition(headVertex, new T.Vector3());
      const noseRestDistance = landmark.distanceTo(nose.getWorldPosition(new T.Vector3()));
      const tailTipIndex = tail.geometry.attributes.position.count - 1;
      const tailRest = tail.getVertexPosition(tailTipIndex, new T.Vector3());
      const headRest = head.getWorldPosition(new T.Vector3());
      let headTravel = 0,
        tailTravel = 0;
      mixer.clipAction(createStudyClip(root, 'wolf')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        const drift = supports.reduce(
          (max, i, index) =>
            Math.max(max, body.getVertexPosition(i, new T.Vector3()).distanceTo(rest[index])),
          0,
        );
        expect(drift).toBeLessThan(1e-7);
        expect(
          body
            .getVertexPosition(headVertex, new T.Vector3())
            .distanceTo(nose.getWorldPosition(new T.Vector3())),
        ).toBeCloseTo(noseRestDistance, 6);
        const relativeAntlers = head.matrixWorld.clone().invert().multiply(antlers.matrixWorld);
        relativeAntlers.elements.forEach((value, i) =>
          expect(value).toBeCloseTo(antlerSocket.elements[i], 6),
        );
        headTravel = Math.max(
          headTravel,
          head.getWorldPosition(new T.Vector3()).distanceTo(headRest),
        );
        tailTravel = Math.max(
          tailTravel,
          tail.getVertexPosition(tailTipIndex, new T.Vector3()).distanceTo(tailRest),
        );
      }
      expect(headTravel).toBeGreaterThan(0.006);
      expect(tailTravel).toBeGreaterThan(0.01);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});

// Regression for the neck ridges observed under neutral lighting in the first construction.
it('keeps a linearly tapered spine smooth across sample joins', () => {
  const field = taperedSpineField(
    [
      [0, 0, 0],
      [0, 1, 0],
      [0, 2, 0],
    ],
    [0.3, 0.2, 0.1],
  );
  for (let i = 0; i < 40; i++) {
    const y = 0.25 + (i * 1.5) / 39,
      radius = (0.3 - 0.1 * y) / Math.sqrt(0.99);
    expect(Math.abs(field(radius, y, 0))).toBeLessThan(1e-7);
    const e = 1e-5,
      dx = (field(radius + e, y, 0) - field(radius - e, y, 0)) / (2 * e),
      dy = (field(radius, y + e, 0) - field(radius, y - e, 0)) / (2 * e);
    expect(dx).toBeCloseTo(Math.sqrt(0.99), 5);
    expect(dy).toBeCloseTo(0.1, 5);
  }
});
