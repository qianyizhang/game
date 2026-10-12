import * as T from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import bellwardenUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/guardian-bellwarden.glb?url';
import undertowUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/guardian-undertow.glb?url';
import ashregentUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/guardian-ashregent.glb?url';
import sovereignUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/guardian-sovereign.glb?url';
import { disposeObject } from '../../../../../shared/three/resources';
import { isMesh, isSkinnedMesh } from '../../../../../shared/three/objects';
import { GUARDIANS } from '../../../domain/encounter-content';
import type { Enemy, State } from '../../../domain/types';
import { batchEnemyAsset, shareSkeletons } from './batches';

const profiles = [
  { id: 'bellwarden', region: 0, url: bellwardenUrl, attacks: ['sweep', 'rain', 'wheel'] },
  { id: 'undertow', region: 1, url: undertowUrl, attacks: ['charge', 'volley', 'pulse'] },
  { id: 'ashregent', region: 2, url: ashregentUrl, attacks: ['cross', 'rain', 'volley'] },
  { id: 'sovereign', region: 3, url: sovereignUrl, attacks: ['cross', 'rain', 'pulse', 'wheel'] },
] as const;
type Profile = (typeof profiles)[number];
type Kind = Profile['id'];
type Clip = Profile['attacks'][number] | 'idle' | 'run' | 'stagger';
const clips = (profile: Profile): readonly Clip[] => ['idle', 'run', ...profile.attacks, 'stagger'];
const contact = 0.45;
const settleTicks = 18;
type Pose = { clip: Clip; phase: number };
export type GuardianModel = { sync(enemy: Enemy, state: State, reducedMotion: boolean): boolean };

function poseSampler(profile: Profile) {
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
      const pattern = GUARDIANS[profile.region][enemy.pattern % profile.attacks.length];
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
      const previous = GUARDIANS[profile.region][(enemy.pattern - 1) % profile.attacks.length];
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
        clip: profile.attacks[enemy.pattern % profile.attacks.length],
        phase: reducedMotion
          ? 0.36
          : contact * T.MathUtils.clamp(1 - enemy.windup / windupTotal, 0, 1),
      };
    if (enemy.pattern > 0 && enemy.cooldown > recoveryTotal - settleTicks)
      return {
        clip: profile.attacks[(enemy.pattern - 1) % profile.attacks.length],
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

/** Regional libraries share geometry/textures; each pooled actor owns its poses and materials. */
export function createGuardians(invalidate: () => void) {
  const library = new Map<Kind, GLTF>();
  const requested = new Set<Kind>();
  let disposed = false;
  const releases: (() => void)[] = [];
  function request(profile: Profile) {
    if (requested.has(profile.id) || disposed) return;
    requested.add(profile.id);
    void new GLTFLoader()
      .loadAsync(profile.url)
      .then((gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        if (
          clips(profile).some(
            (name) =>
              !gltf.animations.some(
                (clip) => clip.name === name && clip.duration > 0 && Number.isFinite(clip.duration),
              ),
          )
        ) {
          disposeObject(gltf.scene);
          console.warn(
            `Night Passage ${profile.id} is missing required motion clips; keeping its fallback.`,
          );
          return;
        }
        batchEnemyAsset(gltf);
        library.set(profile.id, gltf);
        invalidate();
      })
      .catch(() => {
        if (!disposed)
          console.warn(`Night Passage ${profile.id} unavailable; keeping its fallback.`);
      });
  }
  function createInstance(parent: T.Group, profile: Profile) {
    const root = new T.Group();
    root.name = `night-passage-authored-${profile.id}`;
    root.visible = false;
    parent.add(root);
    let sample = poseSampler(profile);
    let model: T.Object3D | null = null,
      mixer: T.AnimationMixer | null = null,
      current: Clip | null = null;
    const actions = new Map<Clip, T.AnimationAction>();
    const copies = new Map<T.Material, T.Material>();
    const skeletons = new Set<T.Skeleton>();
    const emissions: { material: T.MeshStandardMaterial; color: T.Color; intensity: number }[] = [];
    function activate() {
      const asset = library.get(profile.id);
      if (model || !asset) return;
      model = clone(asset.scene);
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
      for (const name of clips(profile)) {
        const action = mixer.clipAction(asset.animations.find((clip) => clip.name === name)!);
        action.setLoop(name === 'idle' || name === 'run' ? T.LoopRepeat : T.LoopOnce, Infinity);
        action.clampWhenFinished = true;
        actions.set(name, action);
      }
      root.add(model);
    }
    return {
      root,
      reset() {
        sample = poseSampler(profile);
      },
      sync(enemy: Enemy, state: State, reducedMotion: boolean) {
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
      dispose() {
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
      },
    };
  }
  return {
    attach(parent: T.Group): GuardianModel {
      if (disposed) return { sync: () => false };
      const instances = new Map<Kind, ReturnType<typeof createInstance>>();
      let active: Kind | null = null;
      releases.push(() => {
        for (const instance of instances.values()) instance.dispose();
        instances.clear();
      });
      return {
        sync(enemy, state, reducedMotion) {
          if (disposed) return false;
          for (const instance of instances.values()) instance.root.visible = false;
          const profile =
            enemy.kind === 'boss'
              ? profiles.find((entry) => entry.region === state.region)
              : undefined;
          if (!profile) {
            active = null;
            return false;
          }
          request(profile);
          let instance = instances.get(profile.id);
          if (!instance) {
            instance = createInstance(parent, profile);
            instances.set(profile.id, instance);
          }
          if (active !== profile.id) instance.reset();
          active = profile.id;
          return instance.sync(enemy, state, reducedMotion);
        },
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const release of releases) release();
      for (const asset of library.values()) disposeObject(asset.scene);
      releases.length = 0;
      library.clear();
    },
  };
}
