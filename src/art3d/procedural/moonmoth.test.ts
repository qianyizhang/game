import { isSkinnedMesh } from '../../shared/three/objects';
import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createStudy } from './factory';
import { disposeObject } from '../../shared/three/resources';
import { createStudyClip } from './animation';

describe('Moon Moth wing construction and resting motion', () => {
  it('has four closed outward-facing thin wings with valid skin weights', () => {
    const root = createStudy('moonmoth');
    try {
      const wings: T.SkinnedMesh[] = [];
      root.traverse((node) => {
        if (isSkinnedMesh(node)) wings.push(node);
      });
      expect(wings).toHaveLength(4);
      for (const wing of wings) {
        const g = wing.geometry,
          p = g.attributes.position,
          index = g.index!.array;
        const edges = new Map<string, number>();
        let volume = 0;
        for (let i = 0; i < index.length; i += 3) {
          const ids = Array.from(index.slice(i, i + 3));
          const [a, b, c] = ids.map((j) => new T.Vector3().fromBufferAttribute(p, j));
          volume += a.dot(b.clone().cross(c)) / 6;
          for (let j = 0; j < 3; j++) {
            const x = ids[j],
              y = ids[(j + 1) % 3],
              key = x < y ? `${x}:${y}` : `${y}:${x}`;
            edges.set(key, (edges.get(key) ?? 0) + 1);
          }
        }
        expect(
          [...edges.values()].every((count) => count === 2),
          wing.name,
        ).toBe(true);
        expect(volume, wing.name).toBeGreaterThan(0.002);
        expect(volume, wing.name).toBeLessThan(0.02);
        const weights = g.attributes.skinWeight,
          joints = g.attributes.skinIndex;
        let bad = 0;
        for (let i = 0; i < p.count; i++) {
          let total = 0;
          for (let j = 0; j < 4; j++) {
            const w = weights.getComponent(i, j);
            total += w;
            if (
              !Number.isFinite(w) ||
              w < 0 ||
              w > 1 ||
              joints.getComponent(i, j) >= wing.skeleton.bones.length
            )
              bad++;
          }
          if (Math.abs(total - 1) > 1e-6) bad++;
        }
        expect(bad).toBe(0);
      }
    } finally {
      disposeObject(root);
    }
  });
  it('keeps all six grips and hinge roots fixed while wing margins and tails flex', () => {
    const root = createStudy('moonmoth'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const fixed: T.Object3D[] = [],
        anchors: T.Object3D[] = [],
        wings: T.SkinnedMesh[] = [];
      root.traverse((node) => {
        if (
          node.name.includes('ClaspingLeg') ||
          node.name === 'Moonmoth_Perch' ||
          node.name === 'Moonmoth_PerchFoot'
        )
          fixed.push(node);
        if (node.name.endsWith('_Anchor')) anchors.push(node);
        if (isSkinnedMesh(node)) wings.push(node);
      });
      expect(fixed.filter((n) => n.name.includes('ClaspingLeg'))).toHaveLength(6);
      const frames = fixed.map((n) => n.matrixWorld.clone()),
        positions = anchors.map((n) => n.getWorldPosition(new T.Vector3()));
      expect(new T.Box3().setFromObject(root.getObjectByName('Moonmoth_Perch')!).min.y).toBeCloseTo(
        0.105,
        6,
      );
      const tips = wings.map((w) => {
        const p = w.geometry.attributes.position;
        let index = 0;
        for (let i = 1; i < p.count; i++)
          if (
            w.name.includes('Hind')
              ? p.getY(i) < p.getY(index)
              : Math.abs(p.getX(i)) > Math.abs(p.getX(index))
          )
            index = i;
        return {
          index,
          p: w.getVertexPosition(index, new T.Vector3()).applyMatrix4(w.matrixWorld),
        };
      });
      const travel = wings.map(() => 0);
      mixer.clipAction(createStudyClip(root, 'moonmoth')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        fixed.forEach((n, j) =>
          n.matrixWorld.elements.forEach((value, k) =>
            expect(value).toBeCloseTo(frames[j].elements[k], 7),
          ),
        );
        anchors.forEach((n, i) =>
          expect(n.getWorldPosition(new T.Vector3()).distanceTo(positions[i])).toBeLessThan(1e-7),
        );
        wings.forEach((w, i) => {
          travel[i] = Math.max(
            travel[i],
            w
              .getVertexPosition(tips[i].index, new T.Vector3())
              .applyMatrix4(w.matrixWorld)
              .distanceTo(tips[i].p),
          );
        });
      }
      travel.forEach((distance) => expect(distance).toBeGreaterThan(0.02));
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});
