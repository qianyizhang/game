import * as T from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { isMesh, isSkinnedMesh } from '../../../../../shared/three/objects';

function sameLayout(a: T.BufferGeometry, b: T.BufferGeometry) {
  const names = Object.keys(a.attributes);
  return (
    names.length === Object.keys(b.attributes).length &&
    names.every((name) => {
      const x = a.attributes[name],
        y = b.attributes[name];
      return (
        x instanceof T.BufferAttribute &&
        y instanceof T.BufferAttribute &&
        x.itemSize === y.itemSize &&
        x.normalized === y.normalized &&
        x.array.constructor === y.array.constructor &&
        x.gpuType === y.gpuType
      );
    })
  );
}

function eligible(mesh: T.SkinnedMesh, first: T.SkinnedMesh) {
  const geometry = mesh.geometry,
    material = mesh.material;
  return (
    mesh.parent !== null &&
    mesh.parent === first.parent &&
    mesh.children.length === 0 &&
    mesh.skeleton === first.skeleton &&
    mesh.bindMode === first.bindMode &&
    mesh.bindMatrix.equals(first.bindMatrix) &&
    mesh.bindMatrixInverse.equals(first.bindMatrixInverse) &&
    mesh.matrix.equals(first.matrix) &&
    mesh.position.equals(first.position) &&
    mesh.quaternion.equals(first.quaternion) &&
    mesh.scale.equals(first.scale) &&
    mesh.matrixAutoUpdate === first.matrixAutoUpdate &&
    mesh.visible === first.visible &&
    mesh.layers.mask === first.layers.mask &&
    mesh.renderOrder === first.renderOrder &&
    mesh.frustumCulled === first.frustumCulled &&
    mesh.castShadow === first.castShadow &&
    mesh.receiveShadow === first.receiveShadow &&
    !Array.isArray(material) &&
    !material.transparent &&
    material.opacity === 1 &&
    material.alphaTest === 0 &&
    material.blending === T.NormalBlending &&
    geometry.index !== null &&
    geometry.groups.length === 0 &&
    geometry.drawRange.start === 0 &&
    (geometry.drawRange.count === Infinity || geometry.drawRange.count === geometry.index.count) &&
    Object.keys(geometry.morphAttributes).length === 0 &&
    ['position', 'normal', 'skinIndex', 'skinWeight'].every((name) =>
      geometry.hasAttribute(name),
    ) &&
    sameLayout(geometry, first.geometry)
  );
}

/** Once per loaded enemy library, before clones exist. Incompatible assets stay intact. */
export function batchEnemyAsset(gltf: GLTF): void {
  const meshes: T.SkinnedMesh[] = [];
  gltf.scene.traverse((object) => {
    if (isSkinnedMesh(object) && object.name !== 'Reed_arrow') meshes.push(object);
  });
  const first = meshes[0];
  if (!first || !meshes.every((mesh) => eligible(mesh, first))) return;
  // Removed mesh names must never be animation bindings, including UUID bindings.
  try {
    for (const clip of gltf.animations)
      for (const track of clip.tracks) {
        const path = T.PropertyBinding.parseTrackName(track.name);
        const target = T.PropertyBinding.findNode(gltf.scene, path.nodeName);
        if (!target || meshes.includes(target as T.SkinnedMesh)) return;
      }
  } catch {
    return;
  }
  const groups = new Map<T.Material, T.SkinnedMesh[]>();
  for (const mesh of meshes) {
    const material = mesh.material as T.Material;
    const group = groups.get(material) ?? [];
    group.push(mesh);
    groups.set(material, group);
  }
  const replacements: { sources: T.SkinnedMesh[]; mesh: T.SkinnedMesh }[] = [];
  for (const [material, sources] of groups) {
    if (sources.length < 2) continue;
    const geometry = mergeGeometries(sources.map((mesh) => mesh.geometry));
    if (!geometry) {
      for (const replacement of replacements) replacement.mesh.geometry.dispose();
      return;
    }
    const mesh = new T.SkinnedMesh(geometry, material).copy(sources[0], false);
    mesh.geometry = geometry;
    mesh.material = material;
    mesh.name = `enemy_batch_${material.name || replacements.length}`;
    // The first component's cached bounds cannot enclose the merged surface.
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    replacements.push({ sources, mesh });
  }
  const removed = new Set<T.BufferGeometry>();
  for (const { sources, mesh } of replacements) {
    sources[0].parent!.add(mesh);
    for (const source of sources) {
      removed.add(source.geometry);
      source.removeFromParent();
    }
  }
  // An excluded arrow or another retained mesh can still own the old geometry.
  gltf.scene.traverse((object) => {
    if (isMesh(object)) removed.delete(object.geometry);
  });
  for (const geometry of removed) geometry.dispose();
}

function sameBones(a: T.Skeleton, b: T.Skeleton) {
  return (
    a.bones.length === b.bones.length &&
    a.boneInverses.length === a.bones.length &&
    b.boneInverses.length === b.bones.length &&
    a.bones.every((bone, i) => bone === b.bones[i] && a.boneInverses[i].equals(b.boneInverses[i]))
  );
}

/** Immediately after SkeletonUtils.clone: keep one private skeleton per compatible rig. */
export function shareSkeletons(root: T.Object3D): void {
  const kept: T.Skeleton[] = [],
    removed = new Set<T.Skeleton>();
  root.traverse((object) => {
    if (!isSkinnedMesh(object)) return;
    const original = object.skeleton;
    const shared = kept.find((skeleton) => sameBones(skeleton, original));
    if (shared) {
      object.skeleton = shared;
      if (original !== shared) removed.add(original);
    } else kept.push(original);
  });
  for (const skeleton of removed) skeleton.dispose();
}
