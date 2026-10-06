import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { phoenix, phoenixMotionTracks } from './phoenix';
import { disposeObject } from './models';

describe('living Phoenix fitted movement', () => {
  it('keeps the pelvis and support fixed while skull plumage and facial parts share a head frame', () => {
    const root = new T.Group();
    phoenix(root);
    const skin = root.getObjectByName('PhoenixContinuousPlumage') as T.SkinnedMesh;
    const head = root.getObjectByName('PhoenixHeadTurn')!;
    const support = root.getObjectByName('PhoenixBasaltAndGrip')!;
    const p = skin.geometry.getAttribute('position');
    const weights = skin.geometry.getAttribute('skinWeight');
    const joints = skin.geometry.getAttribute('skinIndex');
    const errors: number[] = [];
    for (let i = 0; i < weights.count; i++) {
      let sum = 0;
      for (let j = 0; j < 4; j++) {
        const weight = weights.getComponent(i, j);
        if (!Number.isFinite(weight) || weight < 0 || joints.getComponent(i, j) >= 3)
          errors.push(i);
        sum += weight;
      }
      if (Math.abs(sum - 1) > 1e-6) errors.push(i);
    }
    expect(errors).toEqual([]);
    root.updateMatrixWorld(true);
    const pelvis = Array.from({ length: p.count }, (_, i) => i).filter((i) => p.getY(i) < 1.85);
    const restPelvis = pelvis.map((i) => skin.getVertexPosition(i, new T.Vector3()));
    const crown = Array.from({ length: p.count }, (_, i) => i).find((i) => p.getY(i) > 2.45)!;
    const restCrown = head.worldToLocal(skin.getVertexPosition(crown, new T.Vector3()));
    const restGrip = support.getWorldPosition(new T.Vector3());
    const times = Array.from({ length: 145 }, (_, i) => i / 24);
    const tracks = phoenixMotionTracks(root, times, 6);
    for (const track of tracks) {
      expect(Array.from(track.values).every(Number.isFinite)).toBe(true);
      expect(Array.from(track.values.slice(-4))).toEqual(Array.from(track.values.slice(0, 4)));
    }
    const mixer = new T.AnimationMixer(root);
    mixer.clipAction(new T.AnimationClip('phoenix_test', 6, tracks)).play();
    let crownMoved = 0;
    try {
      for (const time of [0, 0.75, 1.5, 2.25, 3, 4.5, 5.25, 6]) {
        mixer.setTime(time);
        root.updateMatrixWorld(true);
        const drift = pelvis.reduce(
          (max, i, j) =>
            Math.max(max, skin.getVertexPosition(i, new T.Vector3()).distanceTo(restPelvis[j])),
          0,
        );
        expect(drift).toBeLessThan(1e-7);
        expect(support.getWorldPosition(new T.Vector3()).distanceTo(restGrip)).toBeLessThan(1e-7);
        const now = skin.getVertexPosition(crown, new T.Vector3());
        expect(head.worldToLocal(now.clone()).distanceTo(restCrown)).toBeLessThan(1e-6);
        crownMoved = Math.max(crownMoved, now.distanceTo(vAtRest(p, crown)));
      }
      expect(crownMoved).toBeGreaterThan(0.005);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});
function vAtRest(attribute: T.BufferAttribute | T.InterleavedBufferAttribute, index: number) {
  return new T.Vector3().fromBufferAttribute(attribute, index);
}
