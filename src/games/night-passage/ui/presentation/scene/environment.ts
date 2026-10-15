import * as T from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import starlessUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/environment-starless.glb?url';
import cinderUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/environment-cinder.glb?url';
import archiveUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/environment-archive.glb?url';
import sepulcherUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/environment-sepulcher.glb?url';
import { isMesh } from '../../../../../shared/three/objects';
import { disposeObject } from '../../../../../shared/three/resources';
import type { StateView as State } from '../../../domain/types';

export type RoomPillar = {
  group: T.Object3D;
  materials: { material: T.Material; opacity: number; depthWrite: boolean }[];
};
const parts = ['Floor', 'Boundary', 'Lantern', 'Pillar'] as const;
type Part = (typeof parts)[number];

/** Static kit geometry/textures belong to the library; placed parts own only materials. */
export function createEnvironment(parent: T.Group, invalidate: () => void) {
  const kits = [
    createKit(parent, invalidate, 0, 'sepulcher', sepulcherUrl),
    createKit(parent, invalidate, 1, 'archive', archiveUrl),
    createKit(parent, invalidate, 2, 'cinder', cinderUrl),
    createKit(parent, invalidate, 3, 'starless', starlessUrl),
  ];
  return {
    sync(state: State): RoomPillar[] | null {
      let active: RoomPillar[] | null = null;
      for (const kit of kits) {
        const result = kit.sync(state);
        if (result) active = result;
      }
      return active;
    },
    dispose() {
      for (const kit of kits) kit.dispose();
    },
  };
}
function createKit(
  parent: T.Group,
  invalidate: () => void,
  region: number,
  kind: string,
  url: string,
) {
  const root = new T.Group();
  root.name = `night-passage-authored-${kind}`;
  root.visible = false;
  parent.add(root);
  let library: GLTF | null = null;
  let sources: Record<Part, T.Object3D> | null = null;
  let requested = false,
    disposed = false,
    identity = '';
  let pillars: RoomPillar[] = [];
  const materials = new Set<T.Material>();
  function clear() {
    for (const material of materials) material.dispose();
    materials.clear();
    root.clear();
    pillars = [];
  }
  function request() {
    if (requested || disposed) return;
    requested = true;
    void new GLTFLoader()
      .loadAsync(url)
      .then((gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        const found = new Map<Part, T.Object3D>();
        let valid = true;
        gltf.scene.traverse((object) => {
          if (!parts.includes(object.name as Part)) return;
          const name = object.name as Part;
          let meshes = 0;
          object.traverse((child) => {
            if (isMesh(child)) meshes++;
          });
          if (found.has(name) || isMesh(object) || !meshes) valid = false;
          for (let ancestor = object.parent; ancestor; ancestor = ancestor.parent)
            if (parts.includes(ancestor.name as Part)) valid = false;
          found.set(name, object);
        });
        if (!valid || found.size !== parts.length) {
          disposeObject(gltf.scene);
          console.warn(
            `Night Passage ${kind} is missing its complete static kit; keeping fallback.`,
          );
          return;
        }
        library = gltf;
        sources = Object.fromEntries(found) as Record<Part, T.Object3D>;
        invalidate();
      })
      .catch(() => {
        if (!disposed) console.warn(`Night Passage ${kind} unavailable; keeping fallback.`);
      });
  }
  function place(name: Part, x: number, z: number, radius?: number) {
    const instance = new T.Group();
    instance.name = `${kind}-${name.toLowerCase()}`;
    instance.add(sources![name].clone(true));
    // Kit roots are local bases in game units; Floor/Boundary use the arena center.
    instance.position.set(x, 0, z);
    instance.scale.set(
      radius === undefined ? 1 : radius / 30,
      1,
      radius === undefined ? 1 : radius / 30,
    );
    const copies = new Map<T.Material, T.Material>();
    instance.traverse((object) => {
      if (!isMesh(object)) return;
      object.castShadow = name !== 'Floor';
      object.receiveShadow = true;
      const copy = (source: T.Material) => {
        let material = copies.get(source);
        if (!material) {
          material = source.clone();
          if (name === 'Pillar') material.transparent = true;
          copies.set(source, material);
          materials.add(material);
        }
        return material;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(copy)
        : copy(object.material);
    });
    root.add(instance);
    return {
      group: instance,
      materials: [...copies.values()].map((material) => ({
        material,
        opacity: material.opacity,
        depthWrite: material.depthWrite,
      })),
    };
  }
  return {
    sync(state: State): RoomPillar[] | null {
      if (disposed) return null;
      root.visible = false;
      if (state.region !== region) return null;
      request();
      if (!sources) return null;
      const key = JSON.stringify(state.room.pillars);
      if (key !== identity) {
        clear();
        identity = key;
        place('Floor', 480, 300);
        place('Boundary', 480, 300);
        for (const x of [55, 905]) for (const z of [90, 510]) place('Lantern', x, z);
        for (const pillar of state.room.pillars)
          pillars.push(place('Pillar', pillar.x, pillar.y, pillar.radius));
      }
      root.visible = true;
      return pillars;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clear();
      if (library) disposeObject(library.scene);
      library = null;
      sources = null;
      root.removeFromParent();
    },
  };
}
