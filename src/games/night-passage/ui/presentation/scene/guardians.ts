import * as T from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import bellwardenUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/guardian-bellwarden.glb?url';
import { disposeObject } from '../../../../../shared/three/resources';
import { isMesh, isSkinnedMesh } from '../../../../../shared/three/objects';
import { GUARDIANS } from '../../../domain/encounter-content';
import type { Enemy, State } from '../../../domain/types';
import { batchEnemyAsset, shareSkeletons } from './batches';

const clips = ['idle', 'run', 'sweep', 'rain', 'wheel', 'stagger'] as const;
type Clip = (typeof clips)[number];
const attacks = ['sweep', 'rain', 'wheel'] as const;
const contact = 0.45;
const settleTicks = 18;
type Pose = { clip: Clip; phase: number };
export type GuardianModel = { sync(enemy: Enemy, state: State, reducedMotion: boolean): boolean };

function poseSampler() {
  let identity = '',
    tick = -1,
    x = 0,
    y = 0,
    moving = false;
  let windupPattern = -1,
    windupTotal = 0,
    recoveryPattern = -1,
    recoveryTotal = 0;
  return (enemy: Enemy, state: State, reducedMotion: boolean): Pose => {
    const key = `${state.seed}:${state.runNumber}:${state.region}:${state.chamber}:${enemy.id}`;
    const reset = identity !== key || state.tick < tick;
    if (reset) windupPattern = recoveryPattern = -1;
    if (reset || tick !== state.tick) {
      moving = !reset && Math.hypot(enemy.x - x, enemy.y - y) > 0.1;
      identity = key;
      tick = state.tick;
      x = enemy.x;
      y = enemy.y;
    }
    const enraged = enemy.hp < enemy.maxHp / 2;
    if (enemy.windup > 0) {
      const pattern = GUARDIANS[0][enemy.pattern % attacks.length];
      if (windupPattern !== enemy.pattern) {
        windupPattern = enemy.pattern;
        // Once observed, the windup retains its duration if health crosses half.
        // A first load mid-action after crossing half cannot recover the original
        // duration from this snapshot; its inferred pose may differ from continuous
        // observation. Remaining ticks bound the inference, and pattern advance
        // still marks the exact rules contact boundary.
        windupTotal = Math.max(
          enemy.windup,
          enraged ? Math.round(pattern.windup * 0.8) : pattern.windup,
        );
      }
    } else if (enemy.pattern > 0 && recoveryPattern !== enemy.pattern) {
      recoveryPattern = enemy.pattern;
      const previous = GUARDIANS[0][(enemy.pattern - 1) % attacks.length];
      // A later hit cannot retroactively shorten a cooldown already set by the rules.
      recoveryTotal =
        enemy.cooldown > Math.round(previous.recovery * 0.72)
          ? previous.recovery
          : enraged
            ? Math.round(previous.recovery * 0.72)
            : previous.recovery;
    }
    if (enemy.stagger > 0)
      return {
        clip: 'stagger',
        phase: reducedMotion ? 0.4 : T.MathUtils.clamp(1 - enemy.stagger / 9, 0, 1),
      };
    if (enemy.windup > 0)
      return {
        clip: attacks[enemy.pattern % attacks.length],
        phase: reducedMotion
          ? 0.36
          : contact * T.MathUtils.clamp(1 - enemy.windup / windupTotal, 0, 1),
      };
    if (enemy.pattern > 0 && enemy.cooldown > recoveryTotal - settleTicks)
      return {
        clip: attacks[(enemy.pattern - 1) % attacks.length],
        phase: reducedMotion
          ? contact
          : contact +
            (1 - contact) * T.MathUtils.clamp((recoveryTotal - enemy.cooldown) / settleTicks, 0, 1),
      };
    return {
      clip: moving ? 'run' : 'idle',
      phase: reducedMotion ? 0 : (state.tick + enemy.id * 7) / 60,
    };
  };
}

/** Bellwarden only. Geometry/textures belong to this renderer; each pooled actor owns its pose/materials. */
export function createGuardians(invalidate: () => void) {
  let library: GLTF | null = null;
  let requested = false,
    disposed = false;
  const releases: (() => void)[] = [];
  function request() {
    if (requested || disposed) return;
    requested = true;
    void new GLTFLoader()
      .loadAsync(bellwardenUrl)
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
          )
        ) {
          disposeObject(gltf.scene);
          console.warn(
            'Night Passage Bellwarden is missing required motion clips; keeping its fallback.',
          );
          return;
        }
        batchEnemyAsset(gltf);
        library = gltf;
        invalidate();
      })
      .catch(() => {
        if (!disposed) console.warn('Night Passage Bellwarden unavailable; keeping its fallback.');
      });
  }
  return {
    attach(parent: T.Group): GuardianModel {
      if (disposed) return { sync: () => false };
      const root = new T.Group();
      root.name = 'night-passage-authored-bellwarden';
      root.visible = false;
      parent.add(root);
      let sample = poseSampler();
      let wasBellwarden = false;
      let model: T.Object3D | null = null,
        mixer: T.AnimationMixer | null = null,
        current: Clip | null = null;
      const actions = new Map<Clip, T.AnimationAction>();
      const copies = new Map<T.Material, T.Material>();
      const skeletons = new Set<T.Skeleton>();
      const emissions: { material: T.MeshStandardMaterial; color: T.Color; intensity: number }[] =
        [];
      function activate() {
        if (model || !library) return;
        model = clone(library.scene);
        shareSkeletons(model);
        model.scale.setScalar(28);
        model.traverse((object) => {
          if (isSkinnedMesh(object)) skeletons.add(object.skeleton);
          if (!isMesh(object)) return;
          object.castShadow = object.receiveShadow = true;
          const copy = (source: T.Material) => {
            let material = copies.get(source);
            if (!material) {
              material = source.clone();
              copies.set(source, material);
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
        mixer = new T.AnimationMixer(model);
        for (const name of clips) {
          const action = mixer.clipAction(library.animations.find((clip) => clip.name === name)!);
          action.setLoop(name === 'idle' || name === 'run' ? T.LoopRepeat : T.LoopOnce, Infinity);
          action.clampWhenFinished = true;
          actions.set(name, action);
        }
        root.add(model);
      }
      releases.push(() => {
        mixer?.stopAllAction();
        if (model) mixer?.uncacheRoot(model);
        for (const material of copies.values()) material.dispose();
        for (const skeleton of skeletons) skeleton.dispose();
        root.removeFromParent();
        root.clear();
        copies.clear();
        skeletons.clear();
        emissions.length = 0;
        actions.clear();
        model = null;
        mixer = null;
      });
      return {
        sync(enemy, state, reducedMotion) {
          if (disposed) return false;
          if (state.region !== 0 || enemy.kind !== 'boss') {
            root.visible = false;
            if (wasBellwarden) sample = poseSampler();
            wasBellwarden = false;
            return false;
          }
          wasBellwarden = true;
          request();
          activate();
          if (!model || !mixer) return false;
          root.visible = enemy.hp > 0;
          root.rotation.y = -enemy.aim;
          const pose = sample(enemy, state, reducedMotion);
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
      if (disposed) return;
      disposed = true;
      for (const release of releases) release();
      if (library) disposeObject(library.scene);
      releases.length = 0;
      library = null;
    },
  };
}
