import { isMesh, isSkinnedMesh } from '../../shared/three/objects';
import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { nightjar, nightjarMotionTracks } from './nightjar';

function fixture() {
  const root = new T.Group();
  nightjar(root);
  root.updateMatrixWorld(true);
  const skin = root.getObjectByName('Nightjar_ContinuousAnatomy') as T.SkinnedMesh;
  skin.skeleton.update();
  return { root, skin };
}
function dispose(root: T.Group) {
  const materials = new Set<T.Material>();
  root.traverse((node) => {
    if (isMesh(node)) {
      node.geometry.dispose();
      for (const mat of Array.isArray(node.material) ? node.material : [node.material])
        materials.add(mat);
    }
    if (isSkinnedMesh(node)) node.skeleton.dispose();
  });
  for (const mat of materials) {
    if (mat instanceof T.MeshStandardMaterial) {
      mat.map?.dispose();
      mat.normalMap?.dispose();
    }
    mat.dispose();
  }
}

describe('living Nightjar construction regressions', () => {
  it('keeps crown seam positions and smooth normals continuous, with finite normalized skin weights', () => {
    const { root, skin } = fixture();
    try {
      const geometry = skin.geometry;
      const position = geometry.getAttribute('position'),
        normal = geometry.getAttribute('normal');
      const uv = geometry.getAttribute('uv'),
        weights = geometry.getAttribute('skinWeight');
      for (let i = 0; i < position.count; i++) {
        const w = [weights.getX(i), weights.getY(i), weights.getZ(i), weights.getW(i)];
        expect(w.every((x) => Number.isFinite(x) && x >= 0 && x <= 1)).toBe(true);
        expect(w.reduce((a, b) => a + b)).toBeCloseTo(1, 6);
        expect(new T.Vector3().fromBufferAttribute(normal, i).length()).toBeCloseTo(1, 5);
        // Every authored ring repeats its crown at v=0 and v=1. The former orbital
        // displacement broke this join specifically at the forehead's midline.
        if (uv.getY(i) !== 0) continue;
        let end = i + 1;
        while (end < uv.count && uv.getX(end) === uv.getX(i) && uv.getY(end) < 1) end++;
        expect(uv.getY(end)).toBe(1);
        expect(
          new T.Vector3()
            .fromBufferAttribute(position, i)
            .distanceTo(new T.Vector3().fromBufferAttribute(position, end)),
        ).toBeLessThan(0.00001);
        expect(
          new T.Vector3()
            .fromBufferAttribute(normal, i)
            .distanceTo(new T.Vector3().fromBufferAttribute(normal, end)),
        ).toBeLessThan(0.0001);
      }
    } finally {
      dispose(root);
    }
  });

  it('keeps the branch and gripping feet anchored, and fitted eyes attached through the listening loop', () => {
    const { root, skin } = fixture();
    const mixer = new T.AnimationMixer(root);
    const times = Array.from({ length: 145 }, (_, i) => i / 24);
    mixer
      .clipAction(new T.AnimationClip('nightjar', 6, nightjarMotionTracks(root, times, 6)))
      .play();
    try {
      const support = root.getObjectByName('Nightjar_AnchoredRoost')!;
      const meshes: T.Mesh[] = [];
      support.traverse((node) => {
        if (isMesh(node)) meshes.push(node);
      });
      const original = meshes.map((node) => node.matrixWorld.clone());
      const branch = root.getObjectByName('Nightjar_NaturalThinBranch')!;
      const bounds = new T.Box3().setFromObject(branch);
      expect(bounds.min.y).toBeLessThanOrEqual(0.11);
      expect(bounds.min.y).toBeGreaterThan(0.02);
      const eye = root.getObjectByName('Nightjar_Pupil_1')!;
      const eyePosition = eye.getWorldPosition(new T.Vector3());
      const positions = skin.geometry.getAttribute('position');
      let nearest = 0,
        distance = Infinity;
      for (let i = 0; i < positions.count; i++) {
        const d = skin
          .getVertexPosition(i, new T.Vector3())
          .applyMatrix4(skin.matrixWorld)
          .distanceTo(eyePosition);
        if (d < distance) {
          nearest = i;
          distance = d;
        }
      }
      expect(distance).toBeLessThan(0.045);
      for (const time of times) {
        mixer.setTime(time);
        root.updateMatrixWorld(true);
        skin.skeleton.update();
        meshes.forEach((node, i) => expect(node.matrixWorld.equals(original[i])).toBe(true));
        const d = skin
          .getVertexPosition(nearest, new T.Vector3())
          .applyMatrix4(skin.matrixWorld)
          .distanceTo(eye.getWorldPosition(new T.Vector3()));
        expect(d).toBeCloseTo(distance, 5);
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      dispose(root);
    }
  });
});
