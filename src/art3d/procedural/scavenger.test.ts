import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createStudy } from './factory';
import { disposeObject } from '../../shared/three/resources';
import { createStudyClip } from './animation';

describe('Briar Scavenger pose and fitted motion', () => {
  it('keeps the joined skin closed with finite normalized skin weights', () => {
    const root = createStudy('scavenger');
    try {
      const body = root.getObjectByName('Scavenger_ContinuousAnatomy') as T.SkinnedMesh;
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
      let bad = 0;
      const fringe = root.getObjectByName('Scavenger_ManeFringe') as T.SkinnedMesh;
      for (const skin of [body, fringe]) {
        const weights = skin.geometry.attributes.skinWeight,
          joints = skin.geometry.attributes.skinIndex;
        expect(skin.skeleton).toBe(body.skeleton);
        for (let i = 0; i < weights.count; i++) {
          let sum = 0;
          for (let c = 0; c < 4; c++) {
            const w = weights.getComponent(i, c);
            sum += w;
            if (
              !Number.isFinite(w) ||
              w < 0 ||
              w > 1 ||
              joints.getComponent(i, c) >= skin.skeleton.bones.length
            )
              bad++;
          }
          if (Math.abs(sum - 1) > 1e-6) bad++;
        }
      }
      expect(bad).toBe(0);
    } finally {
      disposeObject(root);
    }
  });
  it('keeps four paws and their claws fixed while the face, ears and brush tail move together', () => {
    const root = createStudy('scavenger'),
      mixer = new T.AnimationMixer(root);
    try {
      const body = root.getObjectByName('Scavenger_ContinuousAnatomy') as T.SkinnedMesh;
      const p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight,
        joints = body.geometry.attributes.skinIndex;
      root.updateMatrixWorld(true);
      const supports = Array.from({ length: p.count }, (_, i) => i).filter(
        (i) => p.getY(i) < 0.245,
      );
      const rest = supports.map((i) => body.getVertexPosition(i, new T.Vector3()));
      expect(Math.min(...rest.map((p) => p.y))).toBeCloseTo(0.105, 6);
      for (const [x, z] of [
        [-0.61, 0.31],
        [-0.24, -0.27],
        [0.66, 0.26],
        [0.42, -0.3],
      ]) {
        const sole = rest.filter((p) => Math.abs(p.x - x) < 0.18 && Math.abs(p.z - z) < 0.12);
        expect(sole.length).toBeGreaterThan(20);
        expect(Math.min(...sole.map((p) => p.y))).toBeCloseTo(0.105, 6);
      }
      const claws: T.Object3D[] = [];
      root.traverse((n) => {
        if (n.name.startsWith('Scavenger_Claw_')) claws.push(n);
      });
      expect(claws).toHaveLength(16);
      const clawFrames = claws.map((n) => n.matrixWorld.clone());
      const face = root.getObjectByName('Scavenger_Face')!,
        head = root.getObjectByName('Scavenger_Head')!;
      const ears = [-1, 1].map((side) => root.getObjectByName(`Scavenger_Ear_${side}`)!);
      const earRoots = ears.map((n) => face.worldToLocal(n.getWorldPosition(new T.Vector3())));
      const headVertex = Array.from({ length: p.count }, (_, i) => i).find(
        (i) => joints.getZ(i) === 2 && w.getZ(i) === 1,
      )!;
      expect(headVertex).toBeDefined();
      const faceDistance = body
        .getVertexPosition(headVertex, new T.Vector3())
        .distanceTo(face.getWorldPosition(new T.Vector3()));
      const tailVertex = Array.from({ length: p.count }, (_, i) => i).find(
        (i) => joints.getZ(i) === 4 && w.getZ(i) > 0.6,
      )!;
      expect(tailVertex).toBeDefined();
      const tailRest = body.getVertexPosition(tailVertex, new T.Vector3()),
        headRest = head.quaternion.clone();
      let headTravel = 0,
        tailTravel = 0;
      mixer.clipAction(createStudyClip(root, 'scavenger')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        const drift = supports.reduce(
          (max, i, j) =>
            Math.max(max, body.getVertexPosition(i, new T.Vector3()).distanceTo(rest[j])),
          0,
        );
        expect(drift).toBeLessThan(1e-7);
        claws.forEach((claw, j) =>
          claw.matrixWorld.elements.forEach((n, i) =>
            expect(n).toBeCloseTo(clawFrames[j].elements[i], 7),
          ),
        );
        ears.forEach((ear, j) =>
          expect(
            face.worldToLocal(ear.getWorldPosition(new T.Vector3())).distanceTo(earRoots[j]),
          ).toBeLessThan(1e-7),
        );
        expect(
          body
            .getVertexPosition(headVertex, new T.Vector3())
            .distanceTo(face.getWorldPosition(new T.Vector3())),
        ).toBeCloseTo(faceDistance, 6);
        headTravel = Math.max(headTravel, head.quaternion.angleTo(headRest));
        tailTravel = Math.max(
          tailTravel,
          body.getVertexPosition(tailVertex, new T.Vector3()).distanceTo(tailRest),
        );
      }
      expect(headTravel).toBeGreaterThan(0.05);
      expect(tailTravel).toBeGreaterThan(0.005);
      expect(tailTravel).toBeLessThan(0.06);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});
