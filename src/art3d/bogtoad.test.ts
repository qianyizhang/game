import { isMesh } from './objects';
import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createStudy, disposeObject } from './models';
import { createStudyClip } from './animation';

describe('Bog Toad crouch and breathing', () => {
  it('keeps the joined skin closed with finite normalized skin weights', () => {
    const root = createStudy('bogtoad');
    try {
      const body = root.getObjectByName('Bogtoad_ContinuousAnatomy') as T.SkinnedMesh;
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
  it('keeps the crouch and toes planted while the throat moves and the face stays fitted', () => {
    const root = createStudy('bogtoad'),
      mixer = new T.AnimationMixer(root);
    try {
      const body = root.getObjectByName('Bogtoad_ContinuousAnatomy') as T.SkinnedMesh;
      root.updateMatrixWorld(true);
      const p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight;
      const supports = Array.from({ length: p.count }, (_, i) => i).filter((i) => p.getY(i) < 0.3);
      const rest = supports.map((i) => body.getVertexPosition(i, new T.Vector3()));
      expect(Math.min(...rest.map((p) => p.y))).toBeCloseTo(0.105, 6);
      const toes: T.Mesh[] = [];
      root.traverse((n) => {
        if (isMesh(n) && n.name.startsWith('Bogtoad_Toe_')) toes.push(n);
      });
      expect(toes).toHaveLength(18);
      const toeFrames = toes.map((n) => n.matrixWorld.clone());
      for (const toe of toes) {
        const sole = new T.Box3().setFromObject(toe).min.y;
        expect(sole).toBeGreaterThanOrEqual(0.105 - 1e-6);
        expect(sole).toBeLessThan(0.11);
      }
      const face = root.getObjectByName('Bogtoad_Face')!,
        head = root.getObjectByName('Bogtoad_Head')!;
      const headVertex = Array.from({ length: p.count }, (_, i) => i).find((i) => w.getY(i) === 1)!;
      expect(headVertex).toBeDefined();
      const headDistance = body
        .getVertexPosition(headVertex, new T.Vector3())
        .distanceTo(face.getWorldPosition(new T.Vector3()));
      let throatVertex = 0;
      for (let i = 1; i < p.count; i++) if (w.getZ(i) > w.getZ(throatVertex)) throatVertex = i;
      expect(w.getZ(throatVertex)).toBeGreaterThan(0.75);
      const throatRest = body.getVertexPosition(throatVertex, new T.Vector3()),
        headRest = head.quaternion.clone();
      let throatTravel = 0,
        headTravel = 0;
      mixer.clipAction(createStudyClip(root, 'bogtoad')).play();
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
        ).toBeCloseTo(headDistance, 6);
        throatTravel = Math.max(
          throatTravel,
          body.getVertexPosition(throatVertex, new T.Vector3()).distanceTo(throatRest),
        );
        headTravel = Math.max(headTravel, head.quaternion.angleTo(headRest));
      }
      expect(throatTravel).toBeGreaterThan(0.001);
      expect(throatTravel).toBeLessThan(0.02);
      expect(headTravel).toBeGreaterThan(0.015);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});
