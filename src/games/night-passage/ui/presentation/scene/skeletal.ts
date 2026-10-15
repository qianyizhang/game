import * as T from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { AssetLifetime } from '../../../../../shared/three/lifetime';
import { disposeObject } from '../../../../../shared/three/resources';
import { isMesh, isSkinnedMesh } from '../../../../../shared/three/objects';
import type { Enemy } from '../../../domain/types';
import { batchEnemyAsset, shareSkeletons } from './batches';

type Profile<Kind extends string, Clip extends string> = {
  id: Kind;
  url: string;
  clips: readonly Clip[];
  validate?: (asset: GLTF) => boolean;
};
type SkeletalPose<Clip extends string> = { clip: Clip; phase: number };

/** Templates own geometry/textures; instances own only skeletons, material copies and mixers. */
export function createSkeletalLibrary<Kind extends string, Clip extends string>(
  profiles: readonly Profile<Kind, Clip>[],
  invalidate: () => void,
) {
  const templates = new AssetLifetime();
  const instances = new AssetLifetime();
  const library = new Map<Kind, GLTF>();
  const requested = new Set<Kind>();

  function request(profile: Profile<Kind, Clip>) {
    if (requested.has(profile.id) || templates.closed) return;
    requested.add(profile.id);
    void new GLTFLoader()
      .loadAsync(profile.url)
      .then((asset) => {
        const release = templates.own(() => disposeObject(asset.scene));
        if (templates.closed) return;
        if (
          profile.clips.some(
            (name) =>
              !asset.animations.some(
                (clip) => clip.name === name && clip.duration > 0 && Number.isFinite(clip.duration),
              ),
          ) ||
          profile.validate?.(asset) === false
        ) {
          release();
          console.warn(
            `Night Passage ${profile.id} is missing required motion clips or attachments; keeping its fallback.`,
          );
          return;
        }
        batchEnemyAsset(asset);
        library.set(profile.id, asset);
        invalidate();
      })
      .catch(() => {
        if (!templates.closed)
          console.warn(`Night Passage ${profile.id} unavailable; keeping its fallback.`);
      });
  }

  return {
    attach(parent: T.Group, kind: Kind) {
      const root = new T.Group();
      root.name = `night-passage-authored-${kind}`;
      root.visible = false;
      const profile = profiles.find((entry) => entry.id === kind)!;
      const lifetime = new AssetLifetime();
      instances.own(() => lifetime.dispose());
      lifetime.own(() => root.clear());
      lifetime.own(() => root.removeFromParent());
      if (!instances.closed) {
        parent.add(root);
        request(profile);
      }
      let model: T.Object3D | null = null;
      let mixer: T.AnimationMixer | null = null;
      let current: Clip | null = null;
      const actions = new Map<Clip, T.AnimationAction>();
      const emissions: { material: T.MeshStandardMaterial; color: T.Color; intensity: number }[] =
        [];

      function activate() {
        const asset = library.get(kind);
        if (model || !asset) return;
        model = clone(asset.scene);
        shareSkeletons(model);
        model.scale.setScalar(28);
        const copies = new Map<T.Material, T.Material>();
        const skeletons = new Set<T.Skeleton>();
        model.traverse((object) => {
          if (isSkinnedMesh(object) && !skeletons.has(object.skeleton)) {
            const skeleton = object.skeleton;
            skeletons.add(skeleton);
            lifetime.own(() => skeleton.dispose());
          }
          if (!isMesh(object)) return;
          object.castShadow = object.receiveShadow = true;
          const copy = (source: T.Material) => {
            let material = copies.get(source);
            if (!material) {
              material = source.clone();
              copies.set(source, material);
              const owned = material;
              lifetime.own(() => owned.dispose());
              if (material instanceof T.MeshStandardMaterial)
                emissions.push({
                  material,
                  color: material.emissive.clone(),
                  intensity: material.emissiveIntensity,
                });
            }
            return material;
          };
          object.material = Array.isArray(object.material)
            ? object.material.map(copy)
            : copy(object.material);
        });
        const animated = model;
        const animation = new T.AnimationMixer(model);
        mixer = animation;
        lifetime.own(() => animation.uncacheRoot(animated));
        lifetime.own(() => animation.stopAllAction());
        for (const name of profile.clips) {
          const action = animation.clipAction(asset.animations.find((clip) => clip.name === name)!);
          action.setLoop(name === 'idle' || name === 'run' ? T.LoopRepeat : T.LoopOnce, Infinity);
          action.clampWhenFinished = true;
          actions.set(name, action);
        }
        root.add(model);
      }
      lifetime.own(() => {
        actions.clear();
        emissions.length = 0;
        model = mixer = null;
      });
      return {
        root,
        sync(enemy: Enemy, sample: () => SkeletalPose<Clip>): boolean {
          if (lifetime.closed) return false;
          activate();
          if (!model || !mixer) return false;
          const pose = sample();
          root.visible = enemy.hp > 0;
          root.rotation.y = -enemy.aim;
          const action = actions.get(pose.clip)!;
          if (current !== pose.clip) {
            mixer.stopAllAction();
            action.reset().play();
            action.paused = true;
            current = pose.clip;
          }
          const duration = action.getClip().duration;
          action.time =
            pose.clip === 'idle' || pose.clip === 'run'
              ? pose.phase % duration
              : Math.min(duration - 1e-6, pose.phase * duration);
          mixer.update(0);
          model.updateMatrixWorld(true);
          for (const { material, color, intensity } of emissions) {
            if (enemy.flash > 0 || enemy.stagger > 0) {
              material.emissive.setHex(enemy.flash > 0 ? 0xffe5a8 : 0x61400c);
              material.emissiveIntensity = enemy.flash > 0 ? 0.65 : 0.3;
            } else {
              material.emissive.copy(color);
              material.emissiveIntensity = intensity;
            }
          }
          return true;
        },
      };
    },
    dispose() {
      instances.dispose();
      templates.dispose();
      library.clear();
    },
  };
}
