import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import heroUrl from '../../../../../../packages/dcc-workbench/assets/night-passage/hero.glb?url';
import { AssetLifetime } from '../../../../../shared/three/lifetime';
import { BASE_CAST, SPELLS, boon, weapon } from '../../../domain/content';
import type { Action, Move, StateView as State, WeaponId } from '../../../domain/types';
import { createWeapons, WEAPON_CONTACT as CONTACT, type WeaponPose } from './weapons';

const MODEL_SCALE = 28;
const clips = [
  'idle',
  'run',
  'dodge',
  'slash',
  'thrust',
  'shoot',
  'guard',
  'punch',
  'cast',
  'death',
  'sword_special',
  'spear_special',
  'shield_special',
  'bow_special',
  'fists_special',
  'punch_left',
] as const;
type Clip = (typeof clips)[number];
type Pose = WeaponPose & { clip: Clip; aim: number };
type Attack = { clip: Clip; move: Move; aim: number; action: Action };
const attackClips: Record<WeaponId, Clip> = {
  sword: 'slash',
  spear: 'thrust',
  shield: 'guard',
  bow: 'shoot',
  fists: 'punch',
};

function attack(
  state: State,
  action: Action,
  dashed: boolean,
  aim: number,
  recovering = false,
): Attack {
  const player = state.player;
  if (action === 'cast' || action === 'call') {
    const equipped = player.boons.find((entry) => boon(entry.id).slot === action);
    return {
      clip: 'cast',
      move: equipped ? SPELLS[boon(equipped.id).god][action] : BASE_CAST,
      aim,
      action,
    };
  }
  return {
    clip:
      action === 'special'
        ? `${player.weapon}_special`
        : player.weapon === 'fists' && (recovering ? (player.combo + 2) % 3 : player.combo) === 1
          ? 'punch_left'
          : attackClips[player.weapon],
    move:
      action === 'attack' && dashed ? weapon(player.weapon).dash : weapon(player.weapon)[action],
    aim,
    action,
  };
}

/** Observes confirmed snapshots, including repeated draws of an unchanged paused tick. */
function createPoseSampler(): (state: State, reducedMotion: boolean) => Pose {
  let previousTick = -1,
    previousX = 0,
    previousY = 0,
    previousRun = -1,
    previousSeed = '';
  let moving = false;
  let lastAttack: Attack | null = null;
  let hitTick = 0;
  let observedDash: { start: number; end: number } | null = null;
  let previousWeapon: WeaponId | null = null;
  return (state, reducedMotion) => {
    const player = state.player;
    const reset =
      state.seed !== previousSeed || state.runNumber !== previousRun || state.tick < previousTick;
    if (reset || player.weapon !== previousWeapon) {
      lastAttack = null;
      observedDash = null;
    }
    previousWeapon = player.weapon;
    if (reset || state.tick !== previousTick) {
      moving =
        !reset && previousTick >= 0 && Math.hypot(player.x - previousX, player.y - previousY) > 0.1;
      previousX = player.x;
      previousY = player.y;
      previousTick = state.tick;
      previousSeed = state.seed;
      previousRun = state.runNumber;
    }
    if (player.dashLeft > 0) {
      const start = state.tick - (12 - player.dashLeft);
      if (start !== observedDash?.start) lastAttack = null;
      observedDash = { start, end: state.tick + player.dashLeft };
    }
    if (player.hp <= 0)
      return { clip: 'death', phase: 1, aim: player.aim, action: null, stage: 'rest' };
    if (player.strike) {
      const strike = player.strike;
      lastAttack = attack(state, strike.action, strike.dashed, strike.aim);
      hitTick = state.tick + strike.left;
      const progress = THREE.MathUtils.clamp(1 - strike.left / lastAttack.move.windup, 0, 1);
      return {
        clip: lastAttack.clip,
        phase: reducedMotion ? CONTACT * 0.8 : CONTACT * progress,
        aim: strike.aim,
        action: strike.action,
        stage: 'windup',
      };
    }
    if (player.dashLeft > 0) {
      // Dodge cancels the previous action in the rules. Recovery from a short
      // dash strike may already exist here, but cannot preserve the old swing.
      lastAttack = null;
      return {
        clip: 'dodge',
        phase: reducedMotion ? 0.25 : (12 - player.dashLeft) / 12,
        aim: player.aim,
        action: null,
        stage: 'rest',
      };
    }
    if (player.recovery > 0) {
      // Only an observed windup can retain its clip/aim, and its remaining
      // recovery must still agree with elapsed rules ticks. A new unseen action
      // can increase recovery or replace it with a different smaller count.
      if (
        lastAttack &&
        (state.tick < hitTick ||
          player.recovery !== lastAttack.move.recovery - (state.tick - hitTick))
      )
        lastAttack = null;
      const dash = weapon(player.weapon).dash;
      const inferredHit = state.tick + player.recovery - dash.recovery;
      const dashed =
        observedDash !== null &&
        inferredHit >= observedDash.start + dash.windup &&
        // Rules decrement dashLeft before starting a strike: the final dash
        // tick starts an ordinary action, so its later hit is outside this window.
        inferredHit <= observedDash.end + dash.windup - 2;
      // Guesses are sampled afresh, never retained as observed attack history.
      const recovering = lastAttack ?? attack(state, 'attack', dashed, player.aim, true);
      const progress = THREE.MathUtils.clamp(1 - player.recovery / recovering.move.recovery, 0, 1);
      return {
        clip: recovering.clip,
        phase: reducedMotion ? CONTACT : CONTACT + (1 - CONTACT) * progress,
        aim: recovering.aim,
        action: recovering.action,
        stage: 'recovery',
      };
    }
    lastAttack = null;
    observedDash = null;
    return {
      clip: moving ? 'run' : 'idle',
      phase: reducedMotion ? 0 : state.tick / 60,
      aim: player.aim,
      action: null,
      stage: 'rest',
    };
  };
}

/** Owns the native hero and armory; procedural fallbacks remain actors.ts-owned. */
export function createHero(
  parent: THREE.Group,
  fallbackHand: THREE.Group,
  weapons: ReadonlyMap<WeaponId, THREE.Group>,
  invalidate: () => void,
): { sync(state: State, reducedMotion: boolean): boolean; dispose(): void } {
  const root = new THREE.Group();
  root.name = 'night-passage-authored-hero';
  root.visible = false;
  parent.add(root);
  const sample = createPoseSampler();
  const armory = createWeapons(weapons, invalidate, fallbackHand);
  let model: THREE.Group | null = null;
  let mixer: THREE.AnimationMixer | null = null;
  const actions = new Map<Clip, THREE.AnimationAction>();
  let current: Clip | null = null;
  const view = new AssetLifetime();
  const assets = new AssetLifetime();
  void new GLTFLoader()
    .loadAsync(heroUrl)
    .then((gltf) => {
      const owned = assets.adopt(gltf.scene);
      if (!owned) return;
      const socket = gltf.scene.getObjectByName('weapon_socket');
      const leftSocket = gltf.scene.getObjectByName('weapon_socket_L');
      if (
        !socket ||
        !leftSocket ||
        clips.some(
          (name) =>
            !gltf.animations.some(
              (clip) => clip.name === name && Number.isFinite(clip.duration) && clip.duration > 0,
            ),
        )
      ) {
        assets.dispose();
        console.warn('Night Passage hero asset is missing hand sockets or required motion clips.');
        return;
      }
      model = owned.root;
      model.scale.setScalar(MODEL_SCALE);
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      mixer = owned.mixer;
      for (const name of clips) {
        const action = mixer.clipAction(gltf.animations.find((clip) => clip.name === name)!);
        action.setLoop(
          name === 'idle' || name === 'run' ? THREE.LoopRepeat : THREE.LoopOnce,
          Infinity,
        );
        action.clampWhenFinished = true;
        actions.set(name, action);
      }
      armory.bind(socket, leftSocket);
      root.add(model);
      invalidate();
    })
    .catch((error: unknown) => {
      if (!view.closed)
        console.warn('Night Passage hero asset could not load; using the actor blockout.', error);
    });
  for (const release of [
    () => armory.dispose(),
    () => assets.dispose(),
    () => root.removeFromParent(),
    () => root.clear(),
    () => actions.clear(),
  ].reverse())
    view.own(release);
  return {
    sync(state, reducedMotion) {
      if (view.closed) return false;
      const pose = sample(state, reducedMotion);
      if (!model || !mixer) return false;
      if (!armory.sync(state.player.weapon, pose)) return false;
      root.visible = true;
      root.rotation.y = -pose.aim;
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
          : Math.min(duration - 1e-6, Math.max(0, pose.phase) * duration);
      // Zero delta evaluates the explicitly sampled time; wall-clock time is irrelevant.
      mixer.update(0);
      model.updateMatrixWorld(true);
      return true;
    },
    dispose() {
      if (view.closed) return;
      view.dispose();
      model = null;
      mixer = null;
    },
  };
}
