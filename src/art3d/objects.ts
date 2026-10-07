import * as T from 'three';

// Three.js class instanceof narrowing otherwise introduces unconstrained generic types.
export function isMesh(value: unknown): value is T.Mesh {
  return value instanceof T.Mesh;
}
export function isSkinnedMesh(value: unknown): value is T.SkinnedMesh {
  return value instanceof T.SkinnedMesh;
}
export function isTexture(value: unknown): value is T.Texture {
  return value instanceof T.Texture;
}
