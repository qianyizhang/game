import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObject } from '../../src/shared/three/resources';
import { createActors } from '../../src/games/night-passage/ui/presentation/scene/actors';
import { createSceneRenderer } from '../../src/games/night-passage/ui/presentation/scene';
import { createGame } from '../../src/games/night-passage/domain/game';
import { spawnEnemy } from '../../src/games/night-passage/domain/encounters';
import { ENEMY_PATTERNS } from '../../src/games/night-passage/domain/encounter-content';
import { inspectVideoMotion } from './video-motion';

export const enemyKinds = ['hunter', 'archer', 'brute', 'witch'] as const;
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Controlled presentation fixture; it does not inject state into the game UI or claim a legal campaign. */
function encounter() {
  const state = createGame('enemy-readability');
  state.phase = 'combat';
  state.region = 3;
  state.room.name = 'Four enemy families · controlled presentation';
  state.room.pillars = [{ x: 480, y: 285, radius: 38 }];
  state.player.x = 480;
  state.player.y = 470;
  enemyKinds.forEach((kind, index) => {
    spawnEnemy(state, kind, { x: 220 + index * 170, y: index % 2 ? 220 : 340 });
    const enemy = state.enemies.at(-1)!;
    enemy.aim = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
    enemy.target = { x: state.player.x, y: state.player.y };
    enemy.windup = Math.floor(ENEMY_PATTERNS[kind].windup / 2);
  });
  return state;
}

function pose(root: T.Object3D): number[] {
  root.updateMatrixWorld(true);
  const values: number[] = [];
  root.traverse((object) => {
    if (object instanceof T.Bone) values.push(...object.matrixWorld.elements);
  });
  if (!values.length) throw new Error('Native enemy has no evaluated skeleton');
  return values;
}

/** Exercise real actor activation and immutable pause/reduced-motion snapshots. */
export async function inspectEnemies() {
  const parent = new T.Group();
  const actors = createActors(parent);
  const state = encounter();
  try {
    const deadline = performance.now() + 10000;
    do {
      actors.sync(state, false);
      if (
        enemyKinds.every(
          (kind) => parent.getObjectByName(`night-passage-authored-${kind}`)?.visible,
        )
      )
        break;
      if (performance.now() > deadline) throw new Error('Native enemy families failed to activate');
      await nextFrame();
    } while (true);
    const results = [];
    for (const kind of enemyKinds) {
      const native = parent.getObjectByName(`night-passage-authored-${kind}`)!;
      const before = JSON.stringify(state);
      actors.sync(state, false);
      parent.updateMatrixWorld(true);
      const first = pose(native);
      actors.sync(state, false);
      const paused = pose(native);
      actors.sync(state, true);
      const reduced = pose(native);
      const unchangedBeforeAdvance = before === JSON.stringify(state);
      state.tick++;
      const advanced = JSON.stringify(state);
      actors.sync(state, true);
      const reducedLater = pose(native);
      const bounds = new T.Box3().setFromObject(native);
      const rulesUnchanged = unchangedBeforeAdvance && advanced === JSON.stringify(state);
      let archerArrow: {
        windup: boolean;
        release: boolean;
        rest: boolean;
        rulesUnchanged: boolean;
      } | null = null;
      if (kind === 'archer') {
        const arrow = native.getObjectByName('Reed_arrow');
        if (!arrow) throw new Error('Native archer has no held Reed_arrow mesh');
        const probe = structuredClone(state);
        const archer = probe.enemies.find((enemy) => enemy.kind === 'archer')!;
        let pure = true;
        const visibleAt = (ticks: number, windup: number, cooldown: number, pattern: number) => {
          probe.tick = state.tick + ticks;
          Object.assign(archer, { windup, cooldown, pattern });
          const before = JSON.stringify(probe);
          actors.sync(probe, false);
          pure &&= before === JSON.stringify(probe);
          return arrow.visible;
        };
        archerArrow = {
          windup: visibleAt(0, 1, 0, 0),
          release: visibleAt(1, 0, 65, 1),
          rest: visibleAt(19, 0, 47, 1),
          rulesUnchanged: pure,
        };
      }
      results.push({
        kind,
        visible: native.visible && native.parent?.visible,
        fallbackHidden: native.parent?.children[0].visible === false,
        finiteBounds: [...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite),
        standingHeight: bounds.max.y - bounds.min.y,
        pausedStable: first.every((value, index) => value === paused[index]),
        reducedStable: reduced.every((value, index) => value === reducedLater[index]),
        rulesUnchanged,
        archerArrow,
      });
    }
    return results;
  } finally {
    actors.dispose();
  }
}

/** Native clips run at their delivered duration; movie and phase images contain actual elapsed-time poses. */
export async function reviewEnemies() {
  const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(480, 400);
  renderer.setClearColor('#15242c');
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  const scene = new T.Scene();
  scene.add(new T.HemisphereLight('#e5efff', '#4c4541', 2.4));
  const light = new T.DirectionalLight('#fff0ce', 3);
  light.position.set(4, 6, 5);
  scene.add(light);
  const camera = new T.OrthographicCamera(-1.6, 1.6, 1.34, -1.34, 0.1, 100);
  camera.position.set(4, 3, 6);
  camera.lookAt(0, 1, 0);
  const output = document.createElement('canvas');
  output.width = 480;
  output.height = 440;
  const context = output.getContext('2d')!;
  const stream = output.captureStream(30);
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });
  const snapshots: { kind: string; clip: string; phase: number; png: string }[] = [];
  const timings: {
    kind: string;
    clip: string;
    seconds: number;
    wallSeconds: number;
    frames: number;
  }[] = [];
  recorder.start();
  try {
    for (const kind of enemyKinds) {
      const asset = await new GLTFLoader().loadAsync(
        `/packages/dcc-workbench/assets/night-passage/enemy-${kind}.glb`,
      );
      scene.add(asset.scene);
      const mixer = new T.AnimationMixer(asset.scene);
      try {
        for (const name of ['idle', 'run', 'attack', 'stagger']) {
          const clip = asset.animations.find((candidate) => candidate.name === name);
          if (!clip || !Number.isFinite(clip.duration) || clip.duration <= 0)
            throw new Error(`Missing ${kind} ${name} clip`);
          mixer.stopAllAction();
          const action = mixer.clipAction(clip).reset().setLoop(T.LoopOnce, 1).play();
          action.clampWhenFinished = true;
          const start = performance.now();
          let frames = 0;
          let phaseIndex = 0;
          const phases = [0, 0.45, 0.9];
          do {
            await nextFrame();
            const elapsed = (performance.now() - start) / 1000;
            mixer.setTime(Math.min(clip.duration - 1e-6, elapsed));
            renderer.render(scene, camera);
            context.fillStyle = '#15242c';
            context.fillRect(0, 0, 480, 440);
            context.drawImage(renderer.domElement, 0, 40);
            context.fillStyle = '#f4e9d4';
            context.font = '18px sans-serif';
            context.fillText(`${kind} · ${name} · native 1×`, 18, 26);
            frames++;
            if (phaseIndex < phases.length && elapsed / clip.duration >= phases[phaseIndex]) {
              snapshots.push({
                kind,
                clip: name,
                phase: phases[phaseIndex++],
                png: output.toDataURL('image/png'),
              });
            }
            if (elapsed >= clip.duration) break;
          } while (true);
          timings.push({
            kind,
            clip: name,
            seconds: clip.duration,
            wallSeconds: (performance.now() - start) / 1000,
            frames,
          });
        }
      } finally {
        mixer.stopAllAction();
        mixer.uncacheRoot(asset.scene);
        scene.remove(asset.scene);
        disposeObject(asset.scene);
      }
    }
    recorder.stop();
    await stopped;
    const movie = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(movie);
    let decoded;
    try {
      decoded = await inspectVideoMotion(url, 5000);
    } finally {
      URL.revokeObjectURL(url);
    }
    const bytes = new Uint8Array(await movie.arrayBuffer());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return { snapshots, timings, video: btoa(binary), decoded };
  } finally {
    if (recorder.state !== 'inactive') recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    renderer.dispose();
    renderer.forceContextLoss();
  }
}

/** Production camera, room, marks and actors at arena size, on an explicitly controlled encounter. */
export async function reviewEnemyEncounter(allowEnemyFallback = false) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:960px;height:600px;z-index:9999';
  document.body.append(canvas);
  const state = encounter();
  const manager = T.DefaultLoadingManager;
  const previousLoad = manager.onLoad;
  const previousError = manager.onError;
  let unavailable = false;
  let finish!: () => void;
  let fail!: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  manager.onLoad = () => {
    previousLoad?.();
    finish();
  };
  manager.onError = (url) => {
    previousError?.(url);
    if (
      allowEnemyFallback &&
      /\/enemy-(hunter|archer|brute|witch)\.glb$/.test(new URL(url, location.href).pathname)
    )
      return;
    fail(new Error(`Enemy scene delivery failed: ${url}`));
  };
  let surface: ReturnType<typeof createSceneRenderer> | null = null;
  let timeout = 0;
  try {
    surface = createSceneRenderer(canvas, () => {
      unavailable = true;
    });
    surface.draw(state);
    await Promise.race([
      ready,
      new Promise<void>((_, reject) => {
        timeout = window.setTimeout(
          () => reject(new Error('Enemy scene loading timed out')),
          10000,
        );
      }),
    ]);
    await nextFrame();
    const before = JSON.stringify(state);
    surface.draw({ ...state });
    const png = canvas.toDataURL('image/png');
    canvas.style.width = '390px';
    canvas.style.height = '244px';
    await nextFrame();
    await nextFrame();
    surface.draw({ ...state });
    return {
      png,
      pngNarrow: canvas.toDataURL('image/png'),
      unavailable,
      rulesUnchanged: before === JSON.stringify(state),
    };
  } finally {
    clearTimeout(timeout);
    manager.onLoad = previousLoad;
    manager.onError = previousError;
    canvas.remove();
    surface?.dispose();
  }
}
