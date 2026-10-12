import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObject } from '../../src/shared/three/resources';
import { createActors } from '../../src/games/night-passage/ui/presentation/scene/actors';
import { createGame } from '../../src/games/night-passage/domain/game';
import { WEAPONS } from '../../src/games/night-passage/domain/content';

export async function inspectHeroAttachment() {
  const parent = new T.Group();
  const actors = createActors(parent);
  try {
    const probe = createGame('attachment-load');
    const deadline = performance.now() + 10000;
    do {
      actors.sync(probe, false);
      if (parent.getObjectByName('weapon_sword')) break;
      if (performance.now() > deadline) throw new Error('Hero and weapons failed to load');
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    } while (true);
    const state = createGame('hero-attachment');
    const results = [];
    for (const entry of WEAPONS) {
      state.player.weapon = entry.id;
      actors.sync(state, false);
      parent.updateMatrixWorld(true);
      const socket = parent.getObjectByName('weapon_socket')!;
      const held = parent.getObjectByName(`held-${entry.id}`)!;
      const fallback = parent.getObjectByName('blockout-hero')!.children[0];
      const bounds = new T.Box3().setFromObject(held);
      results.push({
        weapon: entry.id,
        attached: held.parent === socket,
        visible: held.visible,
        fallbackHidden: !fallback.visible,
        scale: held.getWorldScale(new T.Vector3()).toArray(),
        up: new T.Vector3(0, 1, 0).transformDirection(held.matrixWorld).y,
        distance: held
          .getWorldPosition(new T.Vector3())
          .distanceTo(new T.Vector3(state.player.x, 0, state.player.y)),
        finiteBounds: [...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite),
      });
    }
    return results;
  } finally {
    actors.dispose();
  }
}

/** Regenerable, actual 1x playback review. This module is loaded only by Playwright. */
export async function reviewHero() {
  const gltf = await new GLTFLoader().loadAsync(
    '/packages/dcc-workbench/assets/night-passage/hero.glb',
  );
  const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(480, 480);
  renderer.setClearColor('#15242c');
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  const scene = new T.Scene();
  scene.add(gltf.scene, new T.HemisphereLight('#e5efff', '#4c4541', 2.4));
  const light = new T.DirectionalLight('#fff0ce', 3);
  light.position.set(4, 6, 5);
  scene.add(light);
  const camera = new T.OrthographicCamera(-1.5, 1.5, 1.5, -1.5, 0.1, 100);
  camera.position.set(4, 3.3, 6);
  camera.lookAt(0, 1.1, 0);
  const mixer = new T.AnimationMixer(gltf.scene);
  const socket = gltf.scene.getObjectByName('weapon_socket');
  if (!socket) throw new Error('Native hero has no weapon socket');
  const snapshots: { name: string; fraction: number; png: string }[] = [];
  const timings: { name: string; seconds: number; wallSeconds: number; frames: number }[] = [];
  const chunks: Blob[] = [];
  const stream = renderer.domElement.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });
  recorder.start();
  try {
    for (const clip of gltf.animations) {
      mixer.stopAllAction();
      const action = mixer.clipAction(clip).reset().setLoop(T.LoopOnce, 1).play();
      action.clampWhenFinished = true;
      const start = performance.now();
      let frames = 0;
      let nextCapture = 0;
      await new Promise<void>((resolve) => {
        const draw = () => {
          const elapsed = (performance.now() - start) / 1000;
          action.paused = false;
          mixer.setTime(Math.min(clip.duration - 1e-6, elapsed));
          renderer.render(scene, camera);
          frames++;
          if (elapsed / clip.duration >= nextCapture / 5) {
            snapshots.push({
              name: clip.name,
              fraction: nextCapture / 5,
              png: renderer.domElement.toDataURL('image/png'),
            });
            nextCapture++;
          }
          if (elapsed < clip.duration) requestAnimationFrame(draw);
          else resolve();
        };
        requestAnimationFrame(draw);
      });
      timings.push({
        name: clip.name,
        seconds: clip.duration,
        wallSeconds: (performance.now() - start) / 1000,
        frames,
      });
    }
    recorder.stop();
    await stopped;
    const bytes = new Uint8Array(await new Blob(chunks, { type: 'video/webm' }).arrayBuffer());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return { snapshots, timings, video: btoa(binary) };
  } finally {
    if (recorder.state !== 'inactive') recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    mixer.stopAllAction();
    mixer.uncacheRoot(gltf.scene);
    disposeObject(gltf.scene);
    renderer.dispose();
    renderer.forceContextLoss();
  }
}
