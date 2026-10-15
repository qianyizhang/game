import * as T from 'three';
import { isMesh, isRenderable, isSkinnedMesh, isTexture } from './objects';

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
    if (isRenderable(object)) {
      geometries.add(object.geometry);
      const material = (isMesh(object) ? originals?.get(object) : undefined) ?? object.material;
      for (const mat of Array.isArray(material) ? material : [material]) materials.add(mat);
    }
  });
  for (const mat of materials)
    for (const value of Object.values(mat)) if (isTexture(value)) textures.add(value);
  for (const resource of [...materials, ...textures, ...geometries, ...skeletons]) {
    try {
      resource.dispose();
    } catch (error) {
      console.error('Asset resource cleanup failed', error);
    }
  }
}
