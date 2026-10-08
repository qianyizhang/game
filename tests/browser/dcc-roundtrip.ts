import { isMesh, isSkinnedMesh, isTexture } from '../../src/art3d/objects';
import * as T from 'three';
import { loadPoseEvidence } from '../../packages/dcc-workbench/src/pose-evidence';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  getPublishedAsset,
  type PublishedPoseSamples,
  type PublishedSavedPoseSamples,
} from '../../packages/dcc-workbench/src/delivery';

/** Compare Blender's evaluated delivery vertices with Three.js, in the same world space. */
export async function compareDccPoses(
  url?: string,
  reference?: PublishedPoseSamples | PublishedSavedPoseSamples,
) {
  const published = getPublishedAsset('briar-hydra');
  const samples = reference ?? (await loadPoseEvidence(published));
  if (!samples?.samples.length)
    throw new Error('Selected Hydra delivery has no evaluated pose samples');
  if ('objects' in samples) return compareSavedPoses(url ?? published.modelUrl, samples);
  const gltf = await new GLTFLoader().loadAsync(url ?? published.modelUrl);
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
  const matches = samples.samples[0].points.map((p) => {
    const target = new T.Vector3(...p);
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
  const perPose = samples.samples.map((pose) => {
    evaluate(pose.seconds);
    let error = 0;
    for (let i = 0; i < matches.length; i++) {
      const { mesh, index } = matches[i];
      error = Math.max(error, point(mesh, index).distanceTo(new T.Vector3(...pose.points[i])));
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

/** Named native samples cover rigid fitted parts as well as deforming skins. */
export async function compareSavedPoses(url: string, reference: PublishedSavedPoseSamples) {
  const gltf = await new GLTFLoader().loadAsync(url);
  const mixer = new T.AnimationMixer(gltf.scene);
  if (gltf.animations[0]) mixer.clipAction(gltf.animations[0]).play();
  const meshes = new Map<string, T.Mesh>();
  gltf.scene.traverse((object) => {
    if (isMesh(object)) meshes.set(object.name, object);
  });
  const point = (mesh: T.Mesh, index: number) =>
    mesh.getVertexPosition(index, new T.Vector3()).applyMatrix4(mesh.matrixWorld);
  const evaluate = (seconds: number) => {
    mixer.setTime(seconds);
    gltf.scene.updateMatrixWorld(true);
    for (const mesh of meshes.values()) if (isSkinnedMesh(mesh)) mesh.skeleton.update();
  };
  try {
    evaluate(0);
    const matches = reference.objects.map((definition) => {
      const mesh = meshes.get(definition.name);
      if (!mesh) throw new Error(`Missing delivered object: ${definition.name}`);
      if (isSkinnedMesh(mesh) !== (definition.role === 'skinned'))
        throw new Error(`Changed skin role: ${definition.name}`);
      const source = reference.samples[0].objects.find((object) => object.name === definition.name);
      if (!source?.points.length)
        throw new Error(`Missing native rest samples: ${definition.name}`);
      const positions = Array.from(
        { length: mesh.geometry.getAttribute('position').count },
        (_, index) => point(mesh, index),
      );
      const indices = source.points.map((p) => {
        const target = new T.Vector3(...p);
        let index = -1,
          distance = Infinity;
        positions.forEach((position, i) => {
          const error = position.distanceToSquared(target);
          if (error < distance) {
            index = i;
            distance = error;
          }
        });
        if (index < 0) throw new Error(`Empty delivered object: ${definition.name}`);
        return { index, restError: Math.sqrt(distance) };
      });
      return { name: definition.name, role: definition.role, mesh, indices };
    });
    const perPose = reference.samples.map((sample) => {
      evaluate(sample.seconds);
      let maxError = 0;
      for (const match of matches) {
        const target = sample.objects.find((object) => object.name === match.name);
        if (target?.points.length !== match.indices.length)
          throw new Error(`Incomplete pose samples: ${match.name}`);
        match.indices.forEach(({ index }, i) => {
          maxError = Math.max(
            maxError,
            point(match.mesh, index).distanceTo(new T.Vector3(...target.points[i])),
          );
        });
      }
      return { seconds: sample.seconds, maxError };
    });
    return {
      sampleVertices: matches.reduce((total, match) => total + match.indices.length, 0),
      sampledObjects: matches.length,
      sampledSkins: matches.filter((match) => match.role === 'skinned').length,
      sampledRigid: matches.filter((match) => match.role === 'rigid').length,
      maxRestMatchError: Math.max(
        ...matches.flatMap((match) => match.indices.map((p) => p.restError)),
      ),
      maxPoseError: Math.max(...perPose.map((pose) => pose.maxError)),
      perPose,
    };
  } finally {
    mixer.stopAllAction();
    mixer.uncacheRoot(gltf.scene);
    gltf.scene.traverse((object) => {
      if (isMesh(object)) {
        object.geometry.dispose();
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material]) {
          for (const value of Object.values(material)) if (isTexture(value)) value.dispose();
          material.dispose();
        }
        if (isSkinnedMesh(object)) object.skeleton.dispose();
      }
    });
  }
}
