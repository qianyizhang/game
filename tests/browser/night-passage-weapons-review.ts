import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObject } from '../../src/shared/three/resources';
import { createActors } from '../../src/games/night-passage/ui/presentation/scene/actors';
import { applyCommand, createGame } from '../../src/games/night-passage/domain/game';
import { WEAPONS } from '../../src/games/night-passage/domain/content';
import type { Input } from '../../src/games/night-passage/domain/types';

interface Reference {
  poses: { draw: number; objects: { name: string; points: number[][] }[] }[];
}

/** Compare every native vertex, allowing the exporter's normal-driven vertex splits. */
export async function compareWeapons(url: string, reference: Reference) {
  const gltf = await new GLTFLoader().loadAsync(url);
  const results = [];
  try {
    for (const pose of reference.poses) {
      const string = gltf.scene.getObjectByName('bow_string') as T.Mesh;
      string.morphTargetInfluences![string.morphTargetDictionary!.Draw] = pose.draw;
      gltf.scene.updateMatrixWorld(true);
      let maxError = 0;
      let probes = 0;
      for (const entry of pose.objects) {
        const mesh = gltf.scene.getObjectByName(T.PropertyBinding.sanitizeNodeName(entry.name));
        if (!(mesh instanceof T.Mesh) || !(mesh.geometry instanceof T.BufferGeometry))
          throw new Error(`Missing native mesh ${entry.name}`);
        const points: T.Vector3[] = [];
        const geometry = mesh.geometry as T.BufferGeometry;
        for (let i = 0; i < geometry.getAttribute('position').count; i++)
          points.push(mesh.getVertexPosition(i, new T.Vector3()).applyMatrix4(mesh.matrixWorld));
        // Symmetric coverage rejects both missing native surfaces and invented delivery vertices.
        const native = entry.points.map((p) => new T.Vector3(...(p as [number, number, number])));
        for (const [a, b] of [
          [native, points],
          [points, native],
        ])
          for (const p of a) {
            maxError = Math.max(maxError, Math.min(...b.map((q) => p.distanceTo(q))));
            probes++;
          }
      }
      results.push({ draw: pose.draw, maxError, probes });
    }
    return results;
  } finally {
    disposeObject(gltf.scene);
  }
}

/** Actual rules ticks at 1x, rendered by the production actor and weapon adapters. */
export async function reviewWeapons() {
  const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(600, 440);
  renderer.setClearColor('#15242c');
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  const scene = new T.Scene();
  scene.add(new T.HemisphereLight('#e5efff', '#4c4541', 2.4));
  const light = new T.DirectionalLight('#fff0ce', 3);
  light.position.set(80, 180, 140);
  scene.add(light);
  const camera = new T.OrthographicCamera(-95, 95, 70, -70, 0.1, 1000);
  const actorRoot = new T.Group();
  scene.add(actorRoot);
  const actors = createActors(actorRoot);
  const output = document.createElement('canvas');
  output.width = 600;
  output.height = 480;
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
  const idle: Input = {
    x: 0,
    y: 0,
    aim: 0,
    attack: false,
    special: false,
    cast: false,
    call: false,
    dash: false,
  };
  const snapshots: { weapon: string; action: string; stage: string; png: string }[] = [];
  const timings = [];
  const checks = [];
  try {
    const probe = createGame('armory-load');
    const deadline = performance.now() + 10000;
    while (!scene.getObjectByName('weapon_sword')) {
      actors.sync(probe, false);
      if (performance.now() > deadline) throw new Error('Native armory failed to activate');
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    recorder.start();
    for (const weapon of WEAPONS)
      for (const action of ['attack', 'special'] as const) {
        let state = applyCommand(createGame('armory-review'), {
          type: 'start',
          weapon: weapon.id,
          runes: [],
        }).state;
        actors.sync(state, false);
        const start = performance.now();
        const captured = new Set<string>();
        let maxDraw = 0;
        let frames = 0;
        const draw = (stage: string) => {
          camera.position.set(state.player.x + 130, 130, state.player.y + 160);
          camera.lookAt(state.player.x + 15, 32, state.player.y);
          renderer.render(scene, camera);
          context.fillStyle = '#15242c';
          context.fillRect(0, 0, 600, 480);
          context.drawImage(renderer.domElement, 0, 40);
          context.fillStyle = '#f4e9d4';
          context.font = '18px sans-serif';
          context.fillText(`${weapon.name} · ${action} · 1×`, 20, 26);
          if (stage && !captured.has(stage)) {
            captured.add(stage);
            snapshots.push({
              weapon: weapon.id,
              action,
              stage,
              png: output.toDataURL('image/png'),
            });
          }
        };
        await new Promise<void>((resolve) => {
          const frame = () => {
            const target = Math.min(60, Math.floor(((performance.now() - start) * 60) / 1000));
            while (state.tick < target) {
              const result = applyCommand(state, {
                type: 'frame',
                input: { ...idle, [action]: state.tick === 0 },
                ticks: 1,
              });
              if (result.error) throw new Error(result.error);
              state = result.state;
              actors.sync(state, false);
              const string = scene.getObjectByName('bow_string') as T.Mesh;
              maxDraw = Math.max(maxDraw, string.morphTargetInfluences![0]);
              if (state.player.strike?.left === 1) draw('windup');
              if (state.player.recovery === weapon[action].recovery) draw('contact');
            }
            draw(state.tick === 60 ? 'rest' : '');
            frames++;
            if (state.tick < 60) requestAnimationFrame(frame);
            else resolve();
          };
          requestAnimationFrame(frame);
        });
        const left = scene.getObjectByName('held-fists-left')!;
        const before = JSON.stringify(state);
        actors.sync(state, true);
        scene.updateMatrixWorld(true);
        const transforms = scene.getObjectByName('weapon_sword')!.matrixWorld.toArray();
        actors.sync(state, true);
        scene.updateMatrixWorld(true);
        checks.push({
          weapon: weapon.id,
          action,
          maxDraw,
          leftVisible: left.visible,
          leftAttached: left.parent?.name === 'weapon_socket_L',
          pausedStable: transforms.every(
            (v, i) => v === scene.getObjectByName('weapon_sword')!.matrixWorld.elements[i],
          ),
          rulesUnchanged: before === JSON.stringify(state),
        });
        timings.push({
          weapon: weapon.id,
          action,
          seconds: (performance.now() - start) / 1000,
          frames,
        });
      }
    recorder.stop();
    await stopped;
    const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return { snapshots, timings, checks, video: btoa(binary) };
  } finally {
    if (recorder.state !== 'inactive') recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    actors.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }
}
