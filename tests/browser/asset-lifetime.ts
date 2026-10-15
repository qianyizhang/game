import * as T from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { createCanidPlayer } from '../../packages/dcc-workbench/src/canid-player';
import { isRenderable } from '../../src/shared/three/objects';
import {
  clips,
  type CanidOptions,
  type MotionStudy,
} from '../../packages/dcc-workbench/src/canid-assets';

/** Controlled model arrivals expose teardown while another load remains pending. */
export async function inspectBatchLifetime(fail: boolean) {
  const pending = new Map<
    string,
    { resolve: (gltf: GLTF) => void; reject: (error: Error) => void }
  >();
  const original = Object.getOwnPropertyDescriptor(GLTFLoader.prototype, 'loadAsync');
  GLTFLoader.prototype.loadAsync = (url: string) =>
    new Promise<GLTF>((resolve, reject) => {
      pending.set(url, { resolve, reject });
    });
  const host = document.createElement('div');
  host.style.cssText = 'width:640px;height:400px';
  document.body.append(host);
  const study: MotionStudy = {
    id: 'lifetime',
    title: 'Lifetime probe',
    eyebrow: 'Probe',
    introduction: '',
    description: '',
    radius: 2,
    targetHeight: 1,
    motionSource: '',
    characters: ['first', 'pending', 'late'].map((id) => ({
      id,
      name: id,
      subtitle: '',
      model: id,
      source: '',
      motions: clips,
    })),
  };
  const options: CanidOptions = {
    revision: 'refined',
    clip: 'idle',
    character: 'all',
    playing: false,
    time: 0,
    seek: 0,
    surface: 'Material',
    view: 'Side',
    rig: false,
    movement: 'in-place',
  };
  const statuses: boolean[] = [];
  let stop: (() => void) | undefined;
  const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const fixture = () => {
    const scene = new T.Group().add(new T.Mesh(new T.BoxGeometry(), new T.MeshStandardMaterial()));
    return {
      scene,
      scenes: [scene],
      cameras: [],
      asset: { version: '2.0' },
      userData: {},
      animations: Object.entries(clips).map(
        ([name, motion]) => new T.AnimationClip(name, motion.seconds, []),
      ),
      parser: {} as GLTF['parser'],
    } satisfies GLTF;
  };
  try {
    stop = createCanidPlayer(
      host,
      () => options,
      () => {},
      (_, ready) => statuses.push(ready),
      study,
    );
    const first = fixture();
    let firstReleased = 0,
      helpersReleased = 0,
      lateReleased = 0;
    const mesh = first.scene.children[0] as T.Mesh;
    mesh.geometry.addEventListener('dispose', () => firstReleased++);
    pending.get('first')!.resolve(first);
    await nextFrame();
    const scene = first.scene.parent!;
    // Track the actual allocated grid and final trajectory, not a replacement disposer.
    for (const object of scene.children) {
      if (isRenderable(object) && (object.type === 'GridHelper' || object.type === 'Line')) {
        object.geometry.addEventListener('dispose', () => helpersReleased++);
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials)
          material.addEventListener('dispose', () => helpersReleased++);
      }
    }
    if (fail) pending.get('pending')!.reject(new Error('Controlled load failure'));
    else stop();
    await nextFrame();
    const beforeLate = { firstReleased, helpersReleased };
    const late = fixture();
    (late.scene.children[0] as T.Mesh).geometry.addEventListener('dispose', () => lateReleased++);
    pending.get('late')!.resolve(late);
    if (!fail) pending.get('pending')!.resolve(fixture());
    await nextFrame();
    stop();
    stop();
    return {
      beforeLate,
      firstReleased,
      helpersReleased,
      lateReleased,
      statuses,
      canvases: host.querySelectorAll('canvas').length,
    };
  } finally {
    stop?.();
    if (original) Object.defineProperty(GLTFLoader.prototype, 'loadAsync', original);
    else Reflect.deleteProperty(GLTFLoader.prototype, 'loadAsync');
    host.remove();
  }
}
