import { isMesh, isSkinnedMesh, isTexture } from '../../src/art3d/objects';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import samples from '../../packages/dcc-workbench/assets/pose-samples.json';
import assetUrl from '../../packages/dcc-workbench/assets/briar-hydra.glb?url';

/** Compare Blender's evaluated delivery vertices with Three.js, in the same world space. */
export async function compareDccPoses(url = assetUrl, reference = samples) {
  const gltf = await new GLTFLoader().loadAsync(url);
  const mixer = new T.AnimationMixer(gltf.scene);
  mixer.clipAction(gltf.animations[0]).play();
  const skins: T.SkinnedMesh[] = [];
  gltf.scene.traverse((object) => {
    if (isSkinnedMesh(object)) skins.push(object);
  });
  const evaluate = (seconds: number) => {
    mixer.setTime(seconds);
    gltf.scene.updateMatrixWorld(true);
    skins.forEach((mesh) => mesh.skeleton.update());
  };
  const point = (mesh: T.SkinnedMesh, index: number) =>
    mesh.getVertexPosition(index, new T.Vector3()).applyMatrix4(mesh.matrixWorld);
  evaluate(0);
  const candidates = skins.flatMap((mesh) =>
    Array.from({ length: mesh.geometry.getAttribute('position').count }, (_, index) => ({
      mesh,
      index,
      position: point(mesh, index),
    })),
  );
  const matches = reference.samples[0].points.map((p) => {
    const target = new T.Vector3(...(p as [number, number, number]));
    let best = candidates[0];
    let error = Infinity;
    for (const candidate of candidates) {
      const distance = target.distanceToSquared(candidate.position);
      if (distance < error) {
        error = distance;
        best = candidate;
      }
    }
    return { ...best, error: Math.sqrt(error) };
  });
  let maxError = 0;
  const perPose = reference.samples.map((pose) => {
    evaluate(pose.seconds);
    let error = 0;
    for (let i = 0; i < matches.length; i++) {
      const { mesh, index } = matches[i];
      error = Math.max(
        error,
        point(mesh, index).distanceTo(
          new T.Vector3(...(pose.points[i] as [number, number, number])),
        ),
      );
    }
    maxError = Math.max(maxError, error);
    return { seconds: pose.seconds, maxError: error };
  });
  const result = {
    sampleVertices: matches.length,
    maxRestMatchError: Math.max(...matches.map((m) => m.error)),
    maxPoseError: maxError,
    perPose,
  };
  mixer.stopAllAction();
  mixer.uncacheRoot(gltf.scene);
  gltf.scene.traverse((object) => {
    if (isMesh(object)) {
      object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        for (const value of Object.values(material)) if (isTexture(value)) value.dispose();
        material.dispose();
      }
      if (isSkinnedMesh(object)) object.skeleton.dispose();
    }
  });
  return result;
}
