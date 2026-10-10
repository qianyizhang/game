import { isSkinnedMesh } from '../../shared/three/objects';
import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createStudy } from './factory';
import { disposeObject } from '../../shared/three/resources';
import { createStudyClip } from './animation';

describe('living Hydra deformation', () => {
  it('keeps normalized bone weights, a fixed coil, and connected head sockets through the loop', () => {
    const root = createStudy('hydra');
    const body = root.getObjectByName('Hydra_Joined_Shoulder_And_Necks') as T.SkinnedMesh;
    const mixer = new T.AnimationMixer(root);
    mixer.clipAction(createStudyClip(root, 'hydra')).play();
    try {
      const skins: T.SkinnedMesh[] = [];
      root.traverse((node) => {
        if (isSkinnedMesh(node)) skins.push(node);
      });
      expect(skins.length).toBeGreaterThan(3);
      for (const mesh of skins) {
        const weights = mesh.geometry.getAttribute('skinWeight');
        const joints = mesh.geometry.getAttribute('skinIndex');
        const invalid: number[] = [];
        for (let i = 0; i < weights.count; i++) {
          let total = 0;
          for (let c = 0; c < 4; c++) {
            const w = weights.getComponent(i, c);
            if (
              !Number.isFinite(w) ||
              w < 0 ||
              w > 1 ||
              joints.getComponent(i, c) >= mesh.skeleton.bones.length
            )
              invalid.push(i);
            total += w;
          }
          if (Math.abs(total - 1) > 1e-6) invalid.push(i);
        }
        expect(invalid, mesh.name).toEqual([]);
      }
      root.updateMatrixWorld(true);
      const positions = body.geometry.getAttribute('position');
      const coil = Array.from({ length: positions.count }, (_, i) => i).filter(
        (i) => positions.getY(i) < 0.45,
      );
      const restCoil = coil.map((i) => body.getVertexPosition(i, new T.Vector3()));
      // The terminal bone and head share a socket, and the coil must stay fixed as the necks bend.
      const initialHeads = [0, 1, 2].map((n) =>
        root.getObjectByName(`Hydra_Head_${n}`)!.getWorldPosition(new T.Vector3()),
      );
      let moved = 0;
      for (const time of [0, 0.75, 1.5, 2.25, 3, 3.75, 4.5, 5.25, 6]) {
        mixer.setTime(time);
        root.updateMatrixWorld(true);
        const drift = coil.reduce(
          (max, i, index) =>
            Math.max(max, body.getVertexPosition(i, new T.Vector3()).distanceTo(restCoil[index])),
          0,
        );
        expect(drift).toBeLessThan(1e-7);
        for (let n = 0; n < 3; n++) {
          const head = root.getObjectByName(`Hydra_Head_${n}`)!;
          const joint = root.getObjectByName(`Hydra_Neck_${n}_Joint_8`)!;
          const p = head.getWorldPosition(new T.Vector3());
          expect(p.distanceTo(joint.getWorldPosition(new T.Vector3()))).toBeLessThan(1e-7);
          moved = Math.max(moved, p.distanceTo(initialHeads[n]));
        }
      }
      expect(moved).toBeGreaterThan(0.025);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});
