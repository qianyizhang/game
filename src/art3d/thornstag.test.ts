import { isSkinnedMesh } from './objects';
import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createStudy, disposeObject } from './models';
import { createStudyClip } from './animation';

describe('living Thornstag support and skin', () => {
  it('keeps a closed skin, normalized weights, and fitted features through its loop', () => {
    const root = createStudy('thornstag');
    const body = root.getObjectByName('Thornstag_ContinuousAnatomy') as T.SkinnedMesh;
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
      const supports = Array.from({ length: p.count }, (_, i) => i).filter((i) => p.getY(i) < 0.75);
      const rest = supports.map((i) => body.getVertexPosition(i, new T.Vector3()));
      expect(Math.min(...rest.map((p) => p.y))).toBeGreaterThan(0.105);
      // A facial landmark in the joined head must follow the same frame as its fitted nose.
      const nose = root.getObjectByName('Thornstag_LeatherNose')!;
      const head = root.getObjectByName('Thornstag_Head')!;
      const headVertex = Array.from({ length: p.count }, (_, i) => i).find(
        (i) => body.geometry.attributes.skinWeight.getZ(i) === 1,
      )!;
      expect(headVertex).toBeDefined();
      const landmark = body.getVertexPosition(headVertex, new T.Vector3());
      const noseRestDistance = landmark.distanceTo(nose.getWorldPosition(new T.Vector3()));
      const hooves = [0, 1, 2, 3].map((i) => root.getObjectByName(`Thornstag_Hoof_${i}`)!);
      const hoofFrames = hooves.map((hoof) => hoof.matrixWorld.clone());
      hooves.forEach((hoof, i) =>
        expect(new T.Box3().setFromObject(hoof).min.y).toBeCloseTo(i === 0 ? 0.42 : 0.105, 6),
      );
      const crown = root.getObjectByName('Thornstag_ThornCrown')!;
      const crownFrame = head.matrixWorld.clone().invert().multiply(crown.matrixWorld);
      const tail = root.getObjectByName('Thornstag_Tail')!;
      const tailRest = tail.quaternion.clone();
      let tailTravel = 0;
      const headRest = head.getWorldQuaternion(new T.Quaternion());
      let headTravel = 0;
      mixer.clipAction(createStudyClip(root, 'thornstag')).play();
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
        hooves.forEach((hoof, j) =>
          hoof.matrixWorld.elements.forEach((value, i) =>
            expect(value).toBeCloseTo(hoofFrames[j].elements[i], 7),
          ),
        );
        const currentCrown = head.matrixWorld.clone().invert().multiply(crown.matrixWorld);
        currentCrown.elements.forEach((value, i) =>
          expect(value).toBeCloseTo(crownFrame.elements[i], 7),
        );
        tailTravel = Math.max(tailTravel, tail.quaternion.angleTo(tailRest));
        headTravel = Math.max(
          headTravel,
          head.getWorldQuaternion(new T.Quaternion()).angleTo(headRest),
        );
      }
      expect(headTravel).toBeGreaterThan(0.05);
      expect(tailTravel).toBeGreaterThan(0.05);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});
