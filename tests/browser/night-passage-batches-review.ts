import * as T from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { disposeObject } from '../../src/shared/three/resources';
import { isSkinnedMesh } from '../../src/shared/three/objects';
import {
  batchEnemyAsset,
  shareSkeletons,
} from '../../src/games/night-passage/ui/presentation/scene/batches';

const kinds = ['hunter', 'archer', 'brute', 'witch'] as const;
type Vertex = { mesh: T.SkinnedMesh; index: number; signature: string };

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

function materialKey(material: T.Material | T.Material[]) {
  if (Array.isArray(material))
    throw new Error('Delivered enemy comparison expects single-material meshes');
  const data: Record<string, unknown> = { ...material.toJSON() };
  delete data.uuid;
  delete data.metadata;
  return stable(data);
}

/** Attribute tuples and material semantics establish correspondence independently of batch names/order. */
function vertices(root: T.Object3D) {
  const result: Vertex[] = [];
  root.traverse((object) => {
    if (!isSkinnedMesh(object)) return;
    const geometry = object.geometry;
    const names = Object.keys(geometry.attributes).sort();
    const schema = names.map((name) => {
      const attribute = geometry.getAttribute(name);
      return [name, attribute.itemSize, attribute.normalized, attribute.array.constructor.name];
    });
    const material = materialKey(object.material);
    for (let index = 0; index < geometry.getAttribute('position').count; index++) {
      const attributes = names.map((name) => {
        const attribute = geometry.getAttribute(name);
        return Array.from({ length: attribute.itemSize }, (_, component) =>
          attribute.getComponent(index, component),
        );
      });
      const bones = object.skeleton.bones.map((bone) => bone.name);
      result.push({
        mesh: object,
        index,
        signature: stable([material, schema, attributes, bones]),
      });
    }
  });
  if (!result.length) throw new Error('Delivered enemy contains no skinned vertices');
  return result;
}

function meshCount(root: T.Object3D) {
  let count = 0;
  root.traverse((object) => {
    if (object instanceof T.SkinnedMesh) count++;
  });
  return count;
}

function topology(records: Vertex[], ids: Map<string, number>) {
  const perMesh = new Map<T.SkinnedMesh, number[]>();
  for (const record of records) {
    const list = perMesh.get(record.mesh) ?? [];
    list[record.index] = ids.get(record.signature)!;
    perMesh.set(record.mesh, list);
  }
  const triangles: string[] = [];
  for (const [mesh, vertices] of perMesh) {
    const indices = mesh.geometry.index;
    if (!indices || indices.count % 3)
      throw new Error('Enemy comparison expects indexed triangles');
    const material = materialKey(mesh.material);
    for (let index = 0; index < indices.count; index += 3) {
      const [a, b, c] = [0, 1, 2].map((offset) => vertices[indices.getX(index + offset)]);
      // Cyclic rotation preserves a triangle; reverse winding remains a distinct signature.
      const oriented = [`${a},${b},${c}`, `${b},${c},${a}`, `${c},${a},${b}`].sort()[0];
      triangles.push(`${material}|${oriented}`);
    }
  }
  return triangles.sort();
}

function match(original: T.Object3D, candidate: T.Object3D) {
  const source = vertices(original),
    target = vertices(candidate);
  const buckets = new Map<string, Vertex[]>();
  const ids = new Map<string, number>();
  for (const vertex of source) {
    if (!ids.has(vertex.signature)) ids.set(vertex.signature, ids.size);
    const bucket = buckets.get(vertex.signature) ?? [];
    bucket.push(vertex);
    buckets.set(vertex.signature, bucket);
  }
  const sourceTriangles = topology(source, ids);
  if (source.length !== target.length) throw new Error('Batching changed skinned vertex count');
  const pairs = target.map((vertex) => {
    const source = buckets.get(vertex.signature)?.pop();
    if (!source)
      throw new Error(`Batching changed a material or attribute tuple: ${vertex.mesh.name}`);
    return { source, target: vertex };
  });
  if ([...buckets.values()].some((bucket) => bucket.length))
    throw new Error('Batching dropped source attributes');
  const targetTriangles = topology(target, ids);
  if (
    sourceTriangles.length !== targetTriangles.length ||
    sourceTriangles.some((triangle, index) => triangle !== targetTriangles[index])
  )
    throw new Error('Batching changed material assignment, triangle topology or winding');
  return { pairs, vertices: source.length, triangles: sourceTriangles.length };
}

function evaluate(root: T.Object3D, mixer: T.AnimationMixer, seconds: number) {
  for (const action of root.animations) {
    const existing = mixer.existingAction(action);
    if (existing) existing.paused = false;
  }
  mixer.setTime(seconds);
  root.updateWorldMatrix(true, false);
  root.updateMatrixWorld(true);
  const skeletons = new Set<T.Skeleton>();
  root.traverse((object) => {
    if (object instanceof T.SkinnedMesh) skeletons.add(object.skeleton);
  });
  for (const skeleton of skeletons) skeleton.update();
}

function bones(root: T.Object3D) {
  root.updateWorldMatrix(true, false);
  root.updateMatrixWorld(true);
  const values: number[] = [];
  root.traverse((object) => {
    if (object instanceof T.Bone) values.push(...object.matrixWorld.elements);
  });
  return values;
}

function rig(asset: GLTF, x: number, radius: number) {
  const parent = new T.Group();
  parent.position.set(x, 0, 240);
  parent.rotation.y = 0.37;
  parent.scale.setScalar(radius / 14);
  const model = clone(asset.scene);
  model.scale.setScalar(28);
  model.animations = asset.animations;
  parent.add(model);
  return { parent, model, mixer: new T.AnimationMixer(model) };
}

function skeletonSet(root: T.Object3D) {
  const result = new Set<T.Skeleton>();
  root.traverse((object) => {
    if (object instanceof T.SkinnedMesh) result.add(object.skeleton);
  });
  return result;
}

/** Full authored-frame surfaces, plus fractional attacks; no generated pose fixture is persisted. */
export async function compareEnemyBatches() {
  const results = [];
  const pointA = new T.Vector3(),
    pointB = new T.Vector3();
  for (const kind of kinds) {
    const url = `/packages/dcc-workbench/assets/night-passage/enemy-${kind}.glb`;
    const original = await new GLTFLoader().loadAsync(url);
    const candidate = await new GLTFLoader().loadAsync(url);
    const owned = new T.Group();
    owned.add(original.scene, candidate.scene);
    const mixers: T.AnimationMixer[] = [];
    try {
      const originalMeshes = meshCount(original.scene);
      batchEnemyAsset(candidate);
      const batchedMeshes = meshCount(candidate.scene);
      const source = rig(original, 120, kind === 'brute' ? 24 : 17);
      const optimized = rig(candidate, 120, kind === 'brute' ? 24 : 17);
      const independent = rig(candidate, 700, 24);
      shareSkeletons(optimized.model);
      shareSkeletons(independent.model);
      owned.add(source.parent, optimized.parent, independent.parent);
      mixers.push(source.mixer, optimized.mixer, independent.mixer);
      const mapping = match(source.model, optimized.model);
      const firstSkeletons = skeletonSet(optimized.model),
        secondSkeletons = skeletonSet(independent.model);
      const independentBefore = bones(independent.model);
      const arrow = kind === 'archer' ? optimized.model.getObjectByName('Reed_arrow') : null;
      if (kind === 'archer' && !(arrow instanceof T.SkinnedMesh))
        throw new Error('Batching removed the independently visible Reed_arrow');
      const coverage = [];
      let maxError = 0;
      for (const clip of original.animations) {
        const counterpart = candidate.animations.find((entry) => entry.name === clip.name);
        if (!counterpart || counterpart.duration !== clip.duration)
          throw new Error(`Batching changed ${kind} ${clip.name} timing`);
        source.mixer.stopAllAction();
        optimized.mixer.stopAllAction();
        for (const [mixer, actionClip] of [
          [source.mixer, clip],
          [optimized.mixer, counterpart],
        ] as const) {
          const action = mixer.clipAction(actionClip).reset().setLoop(T.LoopOnce, 1).play();
          action.clampWhenFinished = true;
        }
        const authoredFrames = Math.round(clip.duration * 30) + 1;
        const fractionalFrames = clip.name === 'attack' ? authoredFrames - 1 : 0;
        const times = Array.from({ length: authoredFrames }, (_, index) => index / 30);
        if (fractionalFrames)
          times.push(...Array.from({ length: fractionalFrames }, (_, index) => (index + 0.5) / 30));
        for (const seconds of times) {
          evaluate(source.model, source.mixer, seconds);
          evaluate(optimized.model, optimized.mixer, seconds);
          for (const pair of mapping.pairs) {
            pair.source.mesh
              .getVertexPosition(pair.source.index, pointA)
              .applyMatrix4(pair.source.mesh.matrixWorld);
            pair.target.mesh
              .getVertexPosition(pair.target.index, pointB)
              .applyMatrix4(pair.target.mesh.matrixWorld);
            maxError = Math.max(maxError, pointA.distanceTo(pointB));
          }
        }
        coverage.push({ clip: clip.name, authoredFrames, fractionalFrames });
      }
      const independentAfter = bones(independent.model);
      results.push({
        kind,
        originalMeshes,
        batchedMeshes,
        vertices: mapping.vertices,
        triangles: mapping.triangles,
        materialAndAttributesPreserved: true,
        topologyAndWindingPreserved: true,
        coverage,
        maxWorldError: maxError,
        sharedSkeletons: firstSkeletons.size,
        independentSkeletons: secondSkeletons.size,
        independentClones: [...firstSkeletons].every((skeleton) => !secondSkeletons.has(skeleton)),
        untouchedCloneStable: independentBefore.every(
          (value, index) => value === independentAfter[index],
        ),
        arrowKeptSeparate: kind !== 'archer' || arrow?.name === 'Reed_arrow',
      });
    } finally {
      for (const mixer of mixers) {
        mixer.stopAllAction();
        mixer.uncacheRoot(mixer.getRoot());
      }
      disposeObject(owned);
    }
  }
  return results;
}
