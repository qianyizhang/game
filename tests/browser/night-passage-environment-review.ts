import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { isMesh } from '../../src/shared/three/objects';
import { disposeObject } from '../../src/shared/three/resources';
import { createRoom } from '../../src/games/night-passage/ui/presentation/scene/room';
import {
  createCamera,
  fitCamera,
} from '../../src/games/night-passage/ui/presentation/scene/camera';
import { createSceneRenderer } from '../../src/games/night-passage/ui/presentation/scene';
import { createGame } from '../../src/games/night-passage/domain/game';
import {
  CHAMBER_LAYOUTS,
  chamberLayout,
} from '../../src/games/night-passage/domain/chamber-content';
import { spawnEnemy } from '../../src/games/night-passage/domain/encounters';
import { translate } from '../../src/games/night-passage/domain/geometry';
import type { LayoutId, State } from '../../src/games/night-passage/domain/types';

const url = '/packages/dcc-workbench/assets/night-passage/environment-sepulcher.glb';
const nativeName = 'night-passage-authored-sepulcher',
  fallbackName = 'night-passage-blockout-room';
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Controlled renderer fixture; this does not replace the game UI or prove a legal campaign. */
function fixture(id: LayoutId) {
  const layout = chamberLayout(id),
    state = createGame(`sepulcher-${id}`);
  state.phase = 'combat';
  state.tick = 210;
  state.room.name = `${layout.name} · controlled sepulcher presentation`;
  state.room.layout = id;
  state.room.pillars = layout.pillars.map((pillar) => ({ ...pillar }));
  state.room.hazards = layout.hazards.map((site) => ({ ...site, kind: 'thorns', radius: 46 }));
  state.player.x = 480;
  state.player.y = 470;
  spawnEnemy(state, 'hunter', { x: 760, y: 160 });
  Object.assign(state.enemies[0], { aim: 2.3, windup: 20, target: { x: 480, y: 470 } });
  return state;
}
function named(root: T.Object3D, name: string) {
  const result: T.Object3D[] = [];
  root.traverse((object) => {
    if (object.name === name) result.push(object);
  });
  return result;
}
function materials(root: T.Object3D) {
  const result = new Set<T.Material>();
  root.traverse((object) => {
    if (isMesh(object))
      for (const material of Array.isArray(object.material) ? object.material : [object.material])
        result.add(material);
  });
  return [...result];
}

export async function inspectEnvironment() {
  const parent = new T.Group(),
    camera = createCamera();
  let invalidations = 0,
    pure = true;
  const room = createRoom(parent, () => {
    invalidations++;
  });
  let state = fixture('court');
  const sync = () => {
    const before = JSON.stringify(state);
    room.sync(state, camera);
    parent.updateMatrixWorld(true);
    pure &&= before === JSON.stringify(state);
  };
  try {
    sync();
    const initialFallback =
      parent.getObjectByName(fallbackName)?.visible === true &&
      parent.getObjectByName(nativeName)?.visible === false;
    const paused = JSON.stringify(state),
      deadline = performance.now() + 10000;
    while (invalidations === 0) {
      if (performance.now() > deadline) throw new Error('Sepulcher paused-load callback timed out');
      await nextFrame();
    }
    const arrivalPure = paused === JSON.stringify(state);
    sync(); // The exact same paused object selects the newly delivered kit.
    const sameStateArrival =
      parent.getObjectByName(nativeName)?.visible === true &&
      parent.getObjectByName(fallbackName)?.visible === false;
    const cases = [];
    for (const layout of CHAMBER_LAYOUTS) {
      state = fixture(layout.id);
      state.player.x = 80;
      state.player.y = 80;
      Object.assign(state.enemies[0], { x: 870, y: 520, windup: 0 });
      sync();
      const native = parent.getObjectByName(nativeName)!;
      const pillars = named(native, 'sepulcher-pillar'),
        lanterns = named(native, 'sepulcher-lantern');
      const base = pillars.map((pillar) =>
        materials(pillar).map((material) => ({
          material,
          opacity: material.opacity,
          depthWrite: material.depthWrite,
        })),
      );
      const placements = pillars.map((pillar, i) => {
        const rule = layout.pillars[i],
          bounds = new T.Box3().setFromObject(pillar);
        return {
          x: pillar.position.x,
          z: pillar.position.z,
          scale: pillar.scale.toArray(),
          height: bounds.max.y - bounds.min.y,
          minY: bounds.min.y,
          expected: { x: rule.x, z: rule.y, radius: rule.radius },
        };
      });
      state.enemies[0].windup = 1;
      sync();
      const warningFade = base.every(
        (entries) =>
          entries.length > 0 &&
          entries.every(
            ({ material, opacity }) =>
              Math.abs(material.opacity - opacity * 0.22) < 1e-6 && !material.depthWrite,
          ),
      );
      state.enemies[0].windup = 0;
      sync();
      const restored = base.every((entries) =>
        entries.every(
          ({ material, opacity, depthWrite }) =>
            material.opacity === opacity && material.depthWrite === depthWrite,
        ),
      );
      const direction = camera.getWorldDirection(new T.Vector3()),
        first = layout.pillars[0];
      const travel = (78 - 20) / -direction.y;
      state.player.x = first.x + direction.x * travel;
      state.player.y = first.y + direction.z * travel;
      sync();
      const occlusionFade = base[0].every(
        ({ material, opacity }) =>
          Math.abs(material.opacity - opacity * 0.22) < 1e-6 && !material.depthWrite,
      );
      const privateMaterials = base.every((entries, i) =>
        base
          .slice(i + 1)
          .every((other) =>
            entries.every(({ material }) => other.every((entry) => entry.material !== material)),
          ),
      );
      cases.push({
        id: layout.id,
        placements,
        floor: named(native, 'sepulcher-floor').map((object) => object.position.toArray()),
        boundary: named(native, 'sepulcher-boundary').map((object) => object.position.toArray()),
        lanterns: lanterns.map((object) => object.position.toArray()),
        warningFade,
        restored,
        occlusionFade,
        privateMaterials,
        occlusionActorClear:
          Math.hypot(state.player.x - first.x, state.player.y - first.y) >= first.radius + 14,
      });
    }
    const otherRegions = [];
    for (const region of [1, 2, 3]) {
      state.region = region;
      sync();
      otherRegions.push({
        region,
        fallback: parent.getObjectByName(fallbackName)?.visible === true,
        nativeHidden: parent.getObjectByName(nativeName)?.visible === false,
      });
    }
    state.region = 0;
    sync();
    return {
      initialFallback,
      arrivalPure,
      sameStateArrival,
      invalidations,
      cases,
      otherRegions,
      restoredRegion: parent.getObjectByName(nativeName)?.visible === true,
      rulesUnchanged: pure,
    };
  } finally {
    room.dispose();
  }
}

function observed(canvas: HTMLCanvasElement, state: State, lost: () => void) {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- explicit apply and exact scoped restoration.
  const original = T.Object3D.prototype.add;
  let room: T.Object3D | undefined, hero: T.Object3D | undefined, hunter: T.Object3D | undefined;
  T.Object3D.prototype.add = function (...objects) {
    for (const object of objects) {
      if (object.name === 'night-passage-room') room = object;
      if (object.name === 'night-passage-authored-hero') hero = object;
      if (object.name === 'night-passage-authored-hunter') hunter = object;
    }
    original.apply(this, objects);
    return this;
  };
  try {
    const surface = createSceneRenderer(canvas, lost);
    surface.draw(state);
    return {
      surface,
      room: () => room,
      ready: (fallback: boolean) =>
        hero?.visible === true &&
        !!hero.getObjectByName('weapon_sword') &&
        hunter?.visible === true &&
        (fallback
          ? room?.getObjectByName(fallbackName)?.visible === true &&
            room.getObjectByName(nativeName)?.visible === false
          : room?.getObjectByName(nativeName)?.visible === true),
    };
  } finally {
    T.Object3D.prototype.add = original;
  }
}
function warningPlane(room: T.Object3D) {
  let plane: T.Mesh | undefined, canvas: HTMLCanvasElement | undefined;
  room.parent?.traverse((object) => {
    if (
      !isMesh(object) ||
      Array.isArray(object.material) ||
      !(object.material instanceof T.MeshBasicMaterial)
    )
      return;
    const image: unknown = object.material.map?.image;
    if (image instanceof HTMLCanvasElement && image.width === 1920 && image.height === 1200) {
      plane = object;
      canvas = image;
    }
  });
  if (!plane || !canvas) throw new Error('Production warning decal is missing');
  return { png: canvas.toDataURL('image/png'), y: plane.getWorldPosition(new T.Vector3()).y };
}
function collision(state: State) {
  const p = state.room.pillars[0],
    probe = { x: p.x - p.radius - 15, y: p.y };
  translate(state, probe, p.radius + 15, 0, 14);
  return { point: probe, expected: { x: p.x + p.radius + 14, y: p.y } };
}

/** Matched production camera and warning state; fallback differs only by the failed kit request. */
export async function reviewEnvironmentLayouts(allowFallback = false) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:960px;height:600px;z-index:9999';
  document.body.append(canvas);
  const manager = T.DefaultLoadingManager,
    previousError = manager.onError;
  let failed = false,
    unavailable = false;
  manager.onError = (request) => {
    previousError?.(request);
    if (new URL(request, location.href).pathname.endsWith('/environment-sepulcher.glb'))
      failed = true;
  };
  let scene: ReturnType<typeof observed> | undefined;
  try {
    const first = fixture('court');
    scene = observed(canvas, first, () => {
      unavailable = true;
    });
    const deadline = performance.now() + 10000;
    do {
      scene.surface.draw(first);
      if (scene.ready(allowFallback) && (!allowFallback || failed)) break;
      if (performance.now() > deadline)
        throw new Error('Sepulcher production scene activation timed out');
      await nextFrame();
    } while (true);
    const pictures = [];
    for (const layout of CHAMBER_LAYOUTS) {
      canvas.style.width = '960px';
      canvas.style.height = '600px';
      await nextFrame();
      await nextFrame();
      const state = fixture(layout.id),
        before = JSON.stringify(state);
      scene.surface.draw(state);
      const png = canvas.toDataURL('image/png'),
        warnings = warningPlane(scene.room()!);
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
      const camera = createCamera();
      fitCamera(camera, 390 / 244);
      const ndc = new T.Vector3(480, 0, 300).project(camera),
        box = canvas.getBoundingClientRect();
      const ground = scene.surface.groundPoint({
        x: box.left + ((ndc.x + 1) * box.width) / 2,
        y: box.top + ((1 - ndc.y) * box.height) / 2,
      });
      pictures.push({
        id: layout.id,
        png,
        pngNarrow: canvas.toDataURL('image/png'),
        warnings,
        collision: collision(state),
        ground,
        colors: colors.size,
        pausedStable,
        rulesUnchanged: before === JSON.stringify(state),
      });
    }
    return { pictures, unavailable, ready: scene.ready(allowFallback) };
  } finally {
    manager.onError = previousError;
    canvas.remove();
    scene?.surface.dispose();
  }
}

interface Reference {
  objects: { name: string; points: number[][] }[];
}
/** All source and delivery vertices are covered, allowing normal/material-driven export splits. */
async function compareStatic(model: string, reference: Reference) {
  const gltf = await new GLTFLoader().loadAsync(model);
  gltf.scene.updateMatrixWorld(true);
  const covered = new Set<T.Mesh>(),
    results = [];
  try {
    for (const object of reference.objects) {
      const root = gltf.scene.getObjectByName(T.PropertyBinding.sanitizeNodeName(object.name));
      if (!root) throw new Error(`Missing sepulcher mesh ${object.name}`);
      const points: T.Vector3[] = [];
      root.traverse((node) => {
        if (!isMesh(node)) return;
        covered.add(node);
        for (let i = 0; i < node.geometry.attributes.position.count; i++)
          points.push(node.getVertexPosition(i, new T.Vector3()).applyMatrix4(node.matrixWorld));
      });
      const native = object.points.map(
        (point) => new T.Vector3(...(point as [number, number, number])),
      );
      if (!native.length || !points.length)
        throw new Error(`Empty sepulcher surface ${object.name}`);
      let maxError = 0;
      for (const [from, to] of [
        [native, points],
        [points, native],
      ])
        for (const point of from) {
          let nearest = Infinity;
          for (const candidate of to)
            nearest = Math.min(nearest, point.distanceToSquared(candidate));
          maxError = Math.max(maxError, Math.sqrt(nearest));
        }
      results.push({
        name: object.name,
        nativeVertices: native.length,
        deliveryVertices: points.length,
        maxError,
      });
    }
    gltf.scene.traverse((object) => {
      if (isMesh(object) && !covered.has(object))
        throw new Error(`Unsampled sepulcher mesh ${object.name}`);
    });
    return results;
  } finally {
    disposeObject(gltf.scene);
  }
}
export async function compareEnvironmentNative(directory: string) {
  const read = async (name: string) => {
    const response = await fetch(`/@fs${directory}/${name}.json`);
    if (!response.ok) throw new Error(`Missing ${name} environment evidence`);
    return (await response.json()) as Reference;
  };
  const reference = await read('reference'),
    edited = await read('edited');
  const model = `/@fs${directory}/models/environment-sepulcher.glb`;
  return {
    original: await compareStatic(url, reference),
    edited: await compareStatic(model, edited),
    changed: await compareStatic(model, reference),
  };
}
