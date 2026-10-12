import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import weaponsUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/weapons.glb?url';
import { disposeObject } from '../../../../../shared/three/resources';
import type { Action, WeaponId } from '../../../domain/types';

export const WEAPON_CONTACT = 0.45;
export interface WeaponPose {
  action: Action | null;
  stage: 'windup' | 'recovery' | 'rest';
  phase: number;
}
const names = [
  'weapon_sword',
  'weapon_spear',
  'weapon_shield',
  'weapon_bow',
  'weapon_fists_R',
  'weapon_fists_L',
] as const;
const rightNames: Record<WeaponId, string> = {
  sword: 'weapon_sword',
  spear: 'weapon_spear',
  shield: 'weapon_shield',
  bow: 'weapon_bow',
  fists: 'weapon_fists_R',
};

/** Owns only the armory GLB; existing held wrappers and their fallback meshes stay caller-owned. */
export function createWeapons(
  held: ReadonlyMap<WeaponId, THREE.Group>,
  invalidate: () => void,
  fallbackHand: THREE.Group,
): {
  bind(right: THREE.Object3D, left: THREE.Object3D): void;
  sync(id: WeaponId, pose: WeaponPose): boolean;
  dispose(): void;
} {
  const fallbacks = new Map<WeaponId, { object: THREE.Object3D; visible: boolean }[]>();
  for (const [id, group] of held)
    fallbacks.set(
      id,
      group.children.map((object) => ({ object, visible: object.visible })),
    );
  const leftHand = new THREE.Group();
  leftHand.name = 'held-fists-left';
  leftHand.scale.setScalar(1 / 28);
  const parts = new Map<string, THREE.Object3D>();
  let asset: THREE.Group | null = null;
  let right: THREE.Object3D | null = null;
  let left: THREE.Object3D | null = null;
  let string: THREE.Mesh | null = null;
  let drawIndex = 0;
  let arrows: { object: THREE.Object3D; restX: number }[] = [];
  let equipped = false;
  let disposed = false;
  void new GLTFLoader()
    .loadAsync(weaponsUrl)
    .then((gltf) => {
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }
      const found = names.map((name) => gltf.scene.getObjectByName(name));
      const bowString = gltf.scene.getObjectByName('weapon_bow')?.getObjectByName('bow_string');
      const index =
        bowString instanceof THREE.Mesh ? bowString.morphTargetDictionary?.Draw : undefined;
      if (
        found.some((object) => !object) ||
        !(bowString instanceof THREE.Mesh) ||
        index === undefined ||
        !bowString.morphTargetInfluences ||
        !Number.isFinite(bowString.morphTargetInfluences[index])
      ) {
        disposeObject(gltf.scene);
        console.warn(
          'Night Passage armory is missing a held weapon or the bow Draw morph; using blockouts.',
        );
        return;
      }
      asset = gltf.scene;
      for (const [index, name] of names.entries()) parts.set(name, found[index]!);
      string = bowString;
      drawIndex = index;
      arrows = ['Bow_nocked_shaft', 'Bow_arrowhead'].flatMap((name) => {
        const object = parts.get('weapon_bow')!.getObjectByName(name);
        return object ? [{ object, restX: object.position.x }] : [];
      });
      asset.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      if (right && left) invalidate();
    })
    .catch((error: unknown) => {
      if (!disposed) console.warn('Night Passage armory could not load; using blockouts.', error);
    });
  return {
    bind(rightSocket, leftSocket) {
      if (disposed || equipped) return;
      right = rightSocket;
      left = leftSocket;
    },
    sync(id, pose) {
      if (disposed || !asset || !right || !left) return false;
      if (!equipped) {
        for (const [weapon, wrapper] of held) {
          const object = parts.get(rightNames[weapon])!;
          asset.attach(object); // Preserve any native export-parent transform.
          wrapper.add(object);
          for (const fallback of fallbacks.get(weapon)!) fallback.object.visible = false;
          wrapper.scale.setScalar(1 / 28);
          right.add(wrapper);
        }
        const fist = parts.get('weapon_fists_L')!;
        asset.attach(fist);
        leftHand.add(fist);
        left.add(leftHand);
        equipped = true;
      }
      for (const [weapon, wrapper] of held) wrapper.visible = weapon === id;
      leftHand.visible = id === 'fists';
      const shooting = pose.action === 'attack' || pose.action === 'special';
      const draw =
        id === 'bow' && shooting && pose.stage === 'windup'
          ? THREE.MathUtils.clamp(pose.phase / WEAPON_CONTACT, 0, 1)
          : 0;
      string!.morphTargetInfluences![drawIndex] = draw;
      for (const arrow of arrows) {
        arrow.object.position.x = arrow.restX - 13 * draw;
        arrow.object.visible = !(id === 'bow' && shooting && pose.stage === 'recovery');
      }
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      // Return every owned mesh to one disposal root before visiting resources.
      if (asset) {
        for (const object of parts.values()) asset.add(object);
        disposeObject(asset);
      }
      for (const [id, wrapper] of held) {
        for (const fallback of fallbacks.get(id)!) fallback.object.visible = fallback.visible;
        wrapper.scale.setScalar(1);
        fallbackHand.add(wrapper);
      }
      leftHand.removeFromParent();
      leftHand.clear();
      fallbacks.clear();
      parts.clear();
      arrows = [];
      asset = null;
      string = null;
      right = null;
      left = null;
    },
  };
}
