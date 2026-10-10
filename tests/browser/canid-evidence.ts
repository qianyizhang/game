import { isMesh } from '../../src/shared/three/objects';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObject } from '../../src/shared/three/resources';
import ash from '../../packages/dcc-workbench/assets/canid/refined/ash.json';
import russet from '../../packages/dcc-workbench/assets/canid/refined/russet.json';
import moss from '../../packages/dcc-workbench/assets/canid/refined/moss.json';
import { characters } from '../../packages/dcc-workbench/src/canid-assets';

type Evidence = typeof ash;
export async function compareCanid(model: string, receipt: Evidence) {
  const gltf = await new GLTFLoader().loadAsync(model);
  const mixer = new T.AnimationMixer(gltf.scene);
  const meshes: T.Mesh[] = [];
  gltf.scene.traverse((o) => {
    if (isMesh(o)) meshes.push(o);
  });
  const point = (mesh: T.Mesh, index: number) =>
    mesh.getVertexPosition(index, new T.Vector3()).applyMatrix4(mesh.matrixWorld);
  const evaluate = (time: number) => {
    for (const clip of gltf.animations) {
      const action = mixer.existingAction(clip);
      if (action) action.paused = false;
    }
    mixer.setTime(time);
    gltf.scene.updateMatrixWorld(true);
    for (const mesh of meshes) if (mesh instanceof T.SkinnedMesh) mesh.skeleton.update();
  };
  const results = [];
  try {
    for (const [name, native] of Object.entries(receipt.clips)) {
      mixer.stopAllAction();
      const clip = gltf.animations.find((a) => a.name === name);
      if (!clip) throw new Error(`Missing clip ${name}`);
      const action = mixer.clipAction(clip);
      action.reset().setLoop(T.LoopOnce, 1).play();
      action.clampWhenFinished = true;
      evaluate(0);
      // Match within the named source mesh. glTF can split multi-material meshes into children.
      const matches = native.samples[0].objects.flatMap((object) => {
        const root = gltf.scene.getObjectByName(T.PropertyBinding.sanitizeNodeName(object.name));
        if (!root) throw new Error(`Missing source mesh ${object.name}`);
        const candidates: { mesh: T.Mesh; index: number; position: T.Vector3 }[] = [];
        root.traverse((o) => {
          if (isMesh(o))
            for (let index = 0; index < o.geometry.getAttribute('position').count; index++)
              candidates.push({ mesh: o, index, position: point(o, index) });
        });
        return object.points.map((xyz, sampleIndex) => {
          const target = new T.Vector3(...xyz);
          let best = candidates[0];
          if (!best) throw new Error(`No vertices for ${object.name}`);
          for (const candidate of candidates)
            if (
              candidate.position.distanceToSquared(target) < best.position.distanceToSquared(target)
            )
              best = candidate;
          return {
            ...best,
            object: object.name,
            sampleIndex,
            restError: best.position.distanceTo(target),
          };
        });
      });
      let maxError = Math.max(...matches.map((m) => m.restError));
      for (const sample of native.samples) {
        evaluate(sample.seconds);
        for (const match of matches) {
          const target = sample.objects.find((o) => o.name === match.object)!.points[
            match.sampleIndex
          ];
          maxError = Math.max(
            maxError,
            point(match.mesh, match.index).distanceTo(new T.Vector3(...target)),
          );
        }
      }
      results.push({ name, maxError, samples: native.samples.length, vertices: matches.length });
    }
    return results;
  } finally {
    mixer.stopAllAction();
    mixer.uncacheRoot(gltf.scene);
    disposeObject(gltf.scene);
  }
}
export async function compareCanids() {
  const receipts = [ash, russet, moss];
  return Promise.all(
    characters.map(async (c, i) => ({ id: c.id, clips: await compareCanid(c.model, receipts[i]) })),
  );
}
