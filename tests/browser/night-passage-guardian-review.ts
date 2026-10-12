import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { isMesh, isSkinnedMesh } from '../../src/shared/three/objects';
import { disposeObject } from '../../src/shared/three/resources';
import { createActors } from '../../src/games/night-passage/ui/presentation/scene/actors';
import { createSceneRenderer } from '../../src/games/night-passage/ui/presentation/scene';
import { createGame } from '../../src/games/night-passage/domain/game';
import { spawnEnemy } from '../../src/games/night-passage/domain/encounters';
import { GUARDIANS } from '../../src/games/night-passage/domain/encounter-content';
import type { State } from '../../src/games/night-passage/domain/types';
import { compareCanid } from './canid-evidence';
import { inspectVideoMotion } from './video-motion';

const modelUrl = '/packages/dcc-workbench/assets/night-passage/guardian-bellwarden.glb';
const rootName = 'night-passage-authored-bellwarden';
export const guardianClips = ['idle', 'run', 'sweep', 'rain', 'wheel', 'stagger'] as const;
const phases = [0, 0.2, 0.4, 0.45, 0.7, 0.95];
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Explicit presentation fixture, not a legal campaign or an injected UI save. */
function encounter(twins = false) {
  const state = createGame('bellwarden-presentation');
  state.phase = 'combat';
  state.region = 0;
  state.chamber = 7;
  state.room.boss = true;
  state.room.name = 'Bellwarden · controlled presentation';
  state.room.pillars = [];
  state.room.hazards = [];
  state.player.x = 480;
  state.player.y = 470;
  for (const x of twins ? [280, 680] : [480]) {
    spawnEnemy(state, 'boss', { x, y: 260 });
    const enemy = state.enemies.at(-1)!;
    enemy.aim = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
    enemy.target = { x: state.player.x, y: state.player.y };
    enemy.windup = twins && x === 680 ? 1 : Math.round(GUARDIANS[0][0].windup / 2);
  }
  return state;
}

function roots(parent: T.Object3D) {
  const result: T.Object3D[] = [];
  parent.traverse((object) => {
    if (object.name === rootName) result.push(object);
  });
  return result;
}
function pose(root: T.Object3D) {
  root.updateMatrixWorld(true);
  const values: number[] = [];
  root.traverse((object) => {
    if (object instanceof T.Bone) values.push(...object.matrix.elements);
  });
  if (!values.length) throw new Error('Bellwarden has no evaluated bones');
  return values;
}
const equal = (a: number[], b: number[]) =>
  a.length === b.length && a.every((value, i) => value === b[i]);
function surfaces(root: T.Object3D) {
  const result: T.SkinnedMesh[] = [];
  root.traverse((object) => {
    if (isSkinnedMesh(object)) result.push(object);
  });
  return result;
}

export async function inspectGuardianActors() {
  const parent = new T.Group(),
    actors = createActors(parent),
    state = encounter(true);
  let pure = true;
  const sync = (reduced = false) => {
    const before = JSON.stringify(state);
    actors.sync(state, reduced);
    parent.updateMatrixWorld(true);
    pure &&= before === JSON.stringify(state);
  };
  try {
    const deadline = performance.now() + 10000;
    do {
      sync();
      if (roots(parent).filter((root) => root.visible).length === 2) break;
      if (performance.now() > deadline)
        throw new Error('Production Bellwardens failed to activate');
      await nextFrame();
    } while (true);
    const [first, second] = roots(parent);
    const a = pose(first),
      b = pose(second);
    sync();
    const pausedStable = equal(a, pose(first)) && equal(b, pose(second));
    sync(true);
    const reduced = pose(first);
    state.tick++;
    sync(true);
    const reducedStable = equal(reduced, pose(first));
    const firstMeshes = surfaces(first),
      secondMeshes = surfaces(second);
    const bounds = new T.Box3().setFromObject(first);
    const privateSkeletons = firstMeshes.every(
      (mesh) => !secondMeshes.some((other) => other.skeleton === mesh.skeleton),
    );
    const privateMaterials = firstMeshes.every(
      (mesh) => !secondMeshes.some((other) => other.material === mesh.material),
    );
    const sharedGeometry =
      firstMeshes.length === secondMeshes.length &&
      firstMeshes.every((mesh, i) => mesh.geometry === secondMeshes[i].geometry);
    sync();
    const heldSecond = pose(second);
    state.enemies[0].windup = 2;
    state.tick++;
    sync();
    const independentPoses = !equal(a, b) && equal(heldSecond, pose(second));
    const attacks = [];
    for (const [pattern, content] of GUARDIANS[0].entries()) {
      Object.assign(state.enemies[0], { pattern, windup: Math.ceil(content.windup * 0.8) });
      state.tick++;
      sync();
      const windup = pose(first);
      Object.assign(state.enemies[0], {
        pattern: pattern + 1,
        windup: 0,
        cooldown: content.recovery,
      });
      state.tick++;
      sync();
      const contact = pose(first);
      sync();
      attacks.push({
        kind: content.kind,
        moving: !equal(windup, contact),
        pausedStable: equal(contact, pose(first)),
      });
    }
    const otherRegions = [];
    for (const region of [1, 2, 3]) {
      state.region = region;
      sync();
      otherRegions.push({
        region,
        authoredHidden: roots(parent).every((root) => !root.visible),
        fallbackVisible: roots(parent).every((root) => root.parent?.children[0].visible === true),
      });
    }
    state.region = 0;
    sync();
    return {
      visible: first.visible && second.visible,
      fallbackHidden:
        first.parent?.children[0].visible === false && second.parent?.children[0].visible === false,
      finiteBounds: [...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite),
      height: bounds.max.y - bounds.min.y,
      pausedStable,
      reducedStable,
      independentPoses,
      privateSkeletons,
      privateMaterials,
      sharedGeometry,
      attacks,
      otherRegions,
      rulesUnchanged: pure,
    };
  } finally {
    actors.dispose();
  }
}

/** Delivered clips play at elapsed wall time, with additional exact phase images. */
export async function reviewGuardianClips() {
  const asset = await new GLTFLoader().loadAsync(modelUrl);
  const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(480, 400);
  renderer.setClearColor('#15242c');
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  const scene = new T.Scene();
  scene.add(asset.scene, new T.HemisphereLight('#e5efff', '#4c4541', 2.4));
  const light = new T.DirectionalLight('#fff0ce', 3);
  light.position.set(4, 6, 5);
  scene.add(light);
  const camera = new T.OrthographicCamera(-2.6, 2.6, 2.17, -2.17, 0.1, 100);
  camera.position.set(4, 3, 6);
  camera.lookAt(0, 1.25, 0);
  const output = document.createElement('canvas');
  output.width = 480;
  output.height = 440;
  const context = output.getContext('2d')!;
  const mixer = new T.AnimationMixer(asset.scene);
  const draw = (name: string) => {
    renderer.render(scene, camera);
    context.fillStyle = '#15242c';
    context.fillRect(0, 0, 480, 440);
    context.drawImage(renderer.domElement, 0, 40);
    context.fillStyle = '#f4e9d4';
    context.font = '18px sans-serif';
    context.fillText(`Bellwarden · ${name} · native 1×`, 18, 26);
  };
  draw('idle');
  const stream = output.captureStream(30),
    chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });
  const snapshots: { clip: string; phase: number; png: string }[] = [];
  const timings: { clip: string; seconds: number; wallSeconds: number; frames: number }[] = [];
  recorder.start();
  try {
    for (const name of guardianClips) {
      const clip = asset.animations.find((candidate) => candidate.name === name);
      if (!clip || !Number.isFinite(clip.duration) || clip.duration <= 0)
        throw new Error(`Missing Bellwarden ${name}`);
      mixer.stopAllAction();
      const action = mixer.clipAction(clip).reset().setLoop(T.LoopOnce, 1).play();
      action.clampWhenFinished = true;
      const start = performance.now();
      let frames = 0;
      do {
        await nextFrame();
        const elapsed = (performance.now() - start) / 1000;
        mixer.setTime(Math.min(clip.duration - 1e-6, elapsed));
        draw(name);
        frames++;
        if (elapsed >= clip.duration) break;
      } while (true);
      timings.push({
        clip: name,
        seconds: clip.duration,
        wallSeconds: (performance.now() - start) / 1000,
        frames,
      });
    }
    recorder.stop();
    await stopped;
    for (const name of guardianClips) {
      mixer.stopAllAction();
      const clip = asset.animations.find((candidate) => candidate.name === name)!;
      const action = mixer.clipAction(clip).reset().setLoop(T.LoopOnce, 1).play();
      action.clampWhenFinished = true;
      for (const phase of phases) {
        mixer.setTime(phase * clip.duration);
        draw(name);
        snapshots.push({ clip: name, phase, png: output.toDataURL('image/png') });
      }
    }
    const movie = new Blob(chunks, { type: 'video/webm' }),
      url = URL.createObjectURL(movie);
    let decoded;
    try {
      decoded = await inspectVideoMotion(url, 5000);
    } finally {
      URL.revokeObjectURL(url);
    }
    let binary = '';
    for (const byte of new Uint8Array(await movie.arrayBuffer()))
      binary += String.fromCharCode(byte);
    return { snapshots, timings, video: btoa(binary), decoded };
  } finally {
    if (recorder.state !== 'inactive') recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    mixer.stopAllAction();
    mixer.uncacheRoot(asset.scene);
    disposeObject(asset.scene);
    renderer.dispose();
    renderer.forceContextLoss();
  }
}

/** Capture roots during synchronous setup AND first draw; loading readiness is actual activation. */
function observed(canvas: HTMLCanvasElement, state: State, unavailable: () => void) {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- explicit apply and immediate restoration.
  const original = T.Object3D.prototype.add;
  let hero: T.Object3D | undefined, guardian: T.Object3D | undefined;
  T.Object3D.prototype.add = function (...objects) {
    for (const object of objects) {
      if (object.name === 'night-passage-authored-hero') hero = object;
      if (object.name === rootName) guardian = object;
    }
    original.apply(this, objects);
    return this;
  };
  try {
    const surface = createSceneRenderer(canvas, unavailable);
    surface.draw(state);
    return {
      surface,
      ready: (fallback: boolean) =>
        hero?.visible === true &&
        !!hero.getObjectByName('weapon_sword') &&
        (fallback
          ? guardian?.visible === false && guardian.parent?.children[0].visible === true
          : guardian?.visible === true),
    };
  } finally {
    T.Object3D.prototype.add = original;
  }
}

export async function reviewGuardianEncounter(allowFallback = false) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:960px;height:600px;z-index:9999';
  document.body.append(canvas);
  const state = encounter(),
    manager = T.DefaultLoadingManager;
  const previousError = manager.onError;
  let guardianFailed = false,
    unavailable = false;
  manager.onError = (url) => {
    previousError?.(url);
    if (new URL(url, location.href).pathname.endsWith('/guardian-bellwarden.glb'))
      guardianFailed = true;
  };
  let scene: ReturnType<typeof observed> | undefined;
  try {
    scene = observed(canvas, state, () => {
      unavailable = true;
    });
    const deadline = performance.now() + 10000;
    do {
      scene.surface.draw(state);
      if (scene.ready(allowFallback) && (!allowFallback || guardianFailed)) break;
      if (performance.now() > deadline) throw new Error('Bellwarden scene activation timed out');
      await nextFrame();
    } while (true);
    const before = JSON.stringify(state);
    scene.surface.draw({ ...state });
    const png = canvas.toDataURL('image/png');
    scene.surface.draw({ ...state });
    const pausedStable = png === canvas.toDataURL('image/png');
    const probe = document.createElement('canvas');
    probe.width = 96;
    probe.height = 60;
    const context = probe.getContext('2d')!;
    context.drawImage(canvas, 0, 0, 96, 60);
    const pixels = context.getImageData(0, 0, 96, 60).data,
      colors = new Set<number>();
    for (let i = 0; i < pixels.length; i += 4)
      colors.add((pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2]);
    canvas.style.width = '390px';
    canvas.style.height = '244px';
    await nextFrame();
    await nextFrame();
    scene.surface.draw({ ...state });
    return {
      png,
      pngNarrow: canvas.toDataURL('image/png'),
      unavailable,
      pausedStable,
      colors: colors.size,
      ready: scene.ready(allowFallback),
      rulesUnchanged: before === JSON.stringify(state),
    };
  } finally {
    manager.onError = previousError;
    canvas.remove();
    scene?.surface.dispose();
  }
}

type Evidence = Parameters<typeof compareCanid>[1];
export async function compareGuardianNative(directory: string) {
  const read = async (name: string) => {
    const response = await fetch(`/@fs${directory}/${name}.json`);
    if (!response.ok) throw new Error(`Missing guardian ${name} evidence`);
    return (await response.json()) as Evidence;
  };
  const reference = await read('reference'),
    edited = await read('edited');
  const gltf = await new GLTFLoader().loadAsync(modelUrl);
  let allMeshesCovered = true;
  try {
    const meshes: T.Mesh[] = [];
    gltf.scene.traverse((object) => {
      if (isMesh(object)) meshes.push(object);
    });
    for (const clip of Object.values(reference.clips)) {
      const covered = new Set<T.Mesh>();
      for (const object of clip.samples[0].objects) {
        const root = gltf.scene.getObjectByName(T.PropertyBinding.sanitizeNodeName(object.name));
        root?.traverse((node) => {
          if (isMesh(node)) covered.add(node);
        });
      }
      allMeshesCovered &&= meshes.length > 0 && meshes.every((mesh) => covered.has(mesh));
    }
  } finally {
    disposeObject(gltf.scene);
  }
  const model = `/@fs${directory}/models/guardian-bellwarden.glb`;
  return {
    allMeshesCovered,
    original: await compareCanid(modelUrl, reference),
    edited: await compareCanid(model, edited),
    changed: await compareCanid(model, reference),
  };
}
