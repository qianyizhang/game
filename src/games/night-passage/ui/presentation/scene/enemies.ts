import * as T from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import hunterUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/enemy-hunter.glb?url';
import archerUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/enemy-archer.glb?url';
import bruteUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/enemy-brute.glb?url';
import witchUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/enemy-witch.glb?url';
import { disposeObject } from '../../../../../shared/three/resources';
import { isMesh, isSkinnedMesh } from '../../../../../shared/three/objects';
import { ENEMY_PATTERNS } from '../../../domain/encounter-content';
import type { Enemy, EnemyKind, State } from '../../../domain/types';

type Kind = Exclude<EnemyKind, 'boss'>;
const urls: Record<Kind, string> = {
  hunter: hunterUrl,
  archer: archerUrl,
  brute: bruteUrl,
  witch: witchUrl,
};
const clips = ['idle', 'run', 'attack', 'stagger'] as const;
type Clip = (typeof clips)[number];
// The final part of the authored attack settles over 18 rules ticks. The rest
// of the rules cooldown permits locomotion; visual recovery never holds movement.
const settleTicks = 18;

export type EnemyModel = {
  sync(enemy: Enemy, state: State, reducedMotion: boolean): boolean;
};

/** One library per renderer: shared geometry/textures, private skeletons and poses. */
export function createEnemies(invalidate: () => void) {
  const library = new Map<Kind, GLTF>();
  const requested = new Set<Kind>();
  const instances: (() => void)[] = [];
  let disposed = false;
  function request(kind: Kind) {
    if (requested.has(kind) || disposed) return;
    requested.add(kind);
    void new GLTFLoader()
      .loadAsync(urls[kind])
      .then((gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        if (
          clips.some(
            (name) =>
              !gltf.animations.some(
                (clip) => clip.name === name && clip.duration > 0 && Number.isFinite(clip.duration),
              ),
          ) ||
          (kind === 'archer' && !gltf.scene.getObjectByName('Reed_arrow'))
        ) {
          disposeObject(gltf.scene);
          console.warn(
            `Night Passage ${kind} is missing required motion clips or its nocked arrow.`,
          );
          return;
        }
        library.set(kind, gltf);
        invalidate();
      })
      .catch(() => {
        if (!disposed) console.warn(`Night Passage ${kind} unavailable; keeping its fallback.`);
      });
  }
  return {
    attach(parent: T.Group, kind: Kind): EnemyModel {
      if (disposed) return { sync: () => false };
      const root = new T.Group();
      root.name = `night-passage-authored-${kind}`;
      root.visible = false;
      parent.add(root);
      request(kind);
      let model: T.Object3D | null = null;
      let arrow: T.Object3D | undefined;
      let mixer: T.AnimationMixer | null = null;
      const actions = new Map<Clip, T.AnimationAction>();
      const materials: {
        material: T.MeshStandardMaterial;
        emission: T.Color;
        intensity: number;
      }[] = [];
      const skeletons = new Set<T.Skeleton>();
      let current: Clip | null = null;
      let identity = '',
        previousTick = -1,
        previousX = 0,
        previousY = 0,
        moving = false;
      function activate() {
        const asset = library.get(kind);
        if (model || !asset) return;
        model = clone(asset.scene);
        arrow = kind === 'archer' ? model.getObjectByName('Reed_arrow') : undefined;
        model.scale.setScalar(28);
        const copies = new Map<T.Material, T.Material>();
        model.traverse((object) => {
          if (isSkinnedMesh(object)) skeletons.add(object.skeleton);
          if (!isMesh(object)) return;
          object.castShadow = true;
          object.receiveShadow = true;
          const copy = (source: T.Material) => {
            let result = copies.get(source);
            if (!result) {
              result = source.clone();
              copies.set(source, result);
              if (result instanceof T.MeshStandardMaterial)
                materials.push({
                  material: result,
                  emission: result.emissive.clone(),
                  intensity: result.emissiveIntensity,
                });
            }
            return result;
          };
          object.material = Array.isArray(object.material)
            ? object.material.map(copy)
            : copy(object.material);
        });
        mixer = new T.AnimationMixer(model);
        for (const name of clips) {
          const action = mixer.clipAction(asset.animations.find((clip) => clip.name === name)!);
          action.setLoop(name === 'idle' || name === 'run' ? T.LoopRepeat : T.LoopOnce, Infinity);
          action.clampWhenFinished = true;
          actions.set(name, action);
        }
        root.add(model);
        // Cloned materials share textures with the library; dispose only the copies.
        instances.push(() => {
          mixer?.stopAllAction();
          if (model) mixer?.uncacheRoot(model);
          for (const material of copies.values()) material.dispose();
          for (const skeleton of skeletons) skeleton.dispose();
          copies.clear();
          skeletons.clear();
          materials.length = 0;
          actions.clear();
          model = null;
          mixer = null;
          arrow = undefined;
        });
      }
      instances.push(() => {
        root.removeFromParent();
        root.clear();
      });
      return {
        sync(enemy, state, reducedMotion) {
          if (disposed) return false;
          activate();
          if (!model || !mixer) return false;
          root.visible = enemy.hp > 0;
          root.rotation.y = -enemy.aim;
          const key = `${state.seed}:${state.runNumber}:${state.region}:${state.chamber}:${enemy.id}`;
          const reset = identity !== key || state.tick < previousTick;
          if (reset || state.tick !== previousTick) {
            moving = !reset && Math.hypot(enemy.x - previousX, enemy.y - previousY) > 0.1;
            identity = key;
            previousTick = state.tick;
            previousX = enemy.x;
            previousY = enemy.y;
          }
          const pattern = ENEMY_PATTERNS[kind];
          let clip: Clip = moving ? 'run' : 'idle';
          let phase = reducedMotion ? 0 : (state.tick + enemy.id * 7) / 60;
          if (enemy.stagger > 0) {
            clip = 'stagger';
            phase = reducedMotion ? 0.4 : T.MathUtils.clamp(1 - enemy.stagger / 9, 0, 1);
          } else if (enemy.windup > 0) {
            clip = 'attack';
            phase = reducedMotion
              ? 0.36
              : 0.45 * T.MathUtils.clamp(1 - enemy.windup / pattern.windup, 0, 1);
          } else if (enemy.pattern > 0 && enemy.cooldown > pattern.recovery - settleTicks) {
            clip = 'attack';
            phase = reducedMotion
              ? 0.45
              : 0.45 +
                0.55 * T.MathUtils.clamp((pattern.recovery - enemy.cooldown) / settleTicks, 0, 1);
          }
          const action = actions.get(clip)!;
          if (current !== clip) {
            mixer.stopAllAction();
            action.reset().play();
            action.paused = true;
            current = clip;
          }
          const duration = action.getClip().duration;
          action.time =
            clip === 'idle' || clip === 'run'
              ? phase % duration
              : Math.min(duration - 1e-6, phase * duration);
          mixer.update(0);
          model.updateMatrixWorld(true);
          if (arrow) arrow.visible = !(clip === 'attack' && phase >= 0.45);
          for (const { material, emission, intensity } of materials) {
            if (enemy.flash > 0 || enemy.stagger > 0) {
              material.emissive.setHex(enemy.flash > 0 ? 0xffe5a8 : 0x61400c);
              material.emissiveIntensity = enemy.flash > 0 ? 0.65 : 0.3;
            } else {
              material.emissive.copy(emission);
              material.emissiveIntensity = intensity;
            }
          }
          return true;
        },
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const release of instances) release();
      for (const asset of library.values()) disposeObject(asset.scene);
      instances.length = 0;
      library.clear();
    },
  };
}
