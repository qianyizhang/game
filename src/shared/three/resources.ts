import * as T from 'three';
import { isMesh, isSkinnedMesh, isTexture } from './objects';

/** Release asset-owned resources once, using originals when a viewer overrides materials. */
export function disposeObject(
  root: T.Object3D,
  originals?: ReadonlyMap<T.Mesh, T.Material | T.Material[]>,
) {
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>(),
    textures = new Set<T.Texture>(),
    skeletons = new Set<T.Skeleton>();
  root.traverse((object) => {
    if (isSkinnedMesh(object)) skeletons.add(object.skeleton);
    if (isMesh(object)) {
      geometries.add(object.geometry);
      const material = originals?.get(object) ?? object.material;
      for (const mat of Array.isArray(material) ? material : [material]) materials.add(mat);
    }
  });
  materials.forEach((mat) => {
    for (const value of Object.values(mat)) if (isTexture(value)) textures.add(value);
    mat.dispose();
  });
  textures.forEach((texture) => texture.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  skeletons.forEach((skeleton) => skeleton.dispose());
}
