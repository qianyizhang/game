import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { isMesh } from '../../src/shared/three/objects';
import { disposeObject } from '../../src/shared/three/resources';

/** Inspect the model a consumer downloads, using the real glTF loader. */
export async function inspectStudyExportNormals(url: string) {
  const loaded = await new GLTFLoader().loadAsync(url);
  let meshCount = 0;
  let normalCount = 0;
  try {
    loaded.scene.traverse((node) => {
      if (!isMesh(node)) return;
      meshCount++;
      const normals = node.geometry.getAttribute('normal');
      const positions = node.geometry.getAttribute('position');
      if (!normals || !positions || normals.count !== positions.count || !normals.count)
        throw new Error(`Missing exported normals: ${node.name}`);
      for (let i = 0; i < normals.count; i++) {
        const length = Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i));
        // Retain the preceding source check's glTF tolerance at the delivery surface.
        if (!Number.isFinite(length) || Math.abs(length - 1) > 0.0005)
          throw new Error(`Invalid exported normal: ${node.name} vertex ${i}`);
      }
      normalCount += normals.count;
    });
    if (!meshCount) throw new Error('No exported meshes.');
    return { meshCount, normalCount };
  } finally {
    disposeObject(loaded.scene);
  }
}
