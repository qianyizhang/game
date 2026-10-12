import * as T from 'three';
import { beforeEach, expect, it, vi } from 'vitest';
import { isMesh } from '../../../../../shared/three/objects';
import { createGame } from '../../../domain/game';
import { spawnEnemy } from '../../../domain/encounters';
import { createRoom } from './room';

const { load } = vi.hoisted(() => ({ load: vi.fn<(url: string) => Promise<unknown>>() }));
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    loadAsync = load;
  },
}));
// Small static meshes stand in for kit delivery, permitting controlled load/fade/disposal failures.
function asset() {
  const scene = new T.Group();
  const texture = new T.Texture();
  const stone = new T.MeshStandardMaterial({ map: texture });
  const inset = new T.MeshStandardMaterial({ opacity: 0.7, depthWrite: false });
  const meshes = new Map<string, T.Mesh>();
  for (const name of ['Floor', 'Boundary', 'Lantern', 'Pillar']) {
    const group = new T.Group();
    group.name = name;
    const geometry =
      name === 'Floor'
        ? new T.BoxGeometry(960, 4, 600)
        : name === 'Pillar'
          ? new T.CylinderGeometry(30, 30, 81, 8)
          : new T.BoxGeometry(8, 44, 8);
    const mesh = new T.Mesh(geometry, name === 'Pillar' ? [stone, inset, stone] : stone);
    mesh.position.y = name === 'Floor' ? -2 : name === 'Pillar' ? 40.5 : 22;
    group.add(mesh);
    scene.add(group);
    meshes.set(name, mesh);
  }
  return { scene, meshes, texture, stone, inset, animations: [] };
}
function fixture() {
  const state = createGame('sepulcher-presentation');
  state.room.pillars = [
    { x: 300, y: 300, radius: 18 },
    { x: 650, y: 350, radius: 42 },
  ];
  state.player.x = 900;
  state.player.y = 500;
  const camera = new T.OrthographicCamera(-600, 600, 400, -400, 1, 3000);
  camera.position.set(480, 1000, 300);
  camera.lookAt(480, 0, 300);
  return { state, camera };
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
const native = (parent: T.Group) => parent.getObjectByName('night-passage-authored-sepulcher')!;
const fallback = (parent: T.Group) => parent.getObjectByName('night-passage-blockout-room')!;
beforeEach(() => {
  load.mockReset();
});

it('lazily replaces the paused fallback with the complete kit and rules-derived placements', async () => {
  const delivered = asset();
  let finish!: (value: ReturnType<typeof asset>) => void;
  load.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const parent = new T.Group(),
    redraw = vi.fn(),
    room = createRoom(parent, redraw);
  const { state, camera } = fixture();
  state.region = 1;
  room.sync(state, camera);
  expect(load).not.toHaveBeenCalled();
  state.region = 0;
  const before = structuredClone(state);
  room.sync(state, camera);
  room.sync(state, camera);
  expect(load).toHaveBeenCalledOnce();
  expect(fallback(parent).visible).toBe(true);
  expect(native(parent).visible).toBe(false);
  finish(delivered);
  await Promise.resolve();
  expect(redraw).toHaveBeenCalledOnce();
  room.sync(state, camera); // Same paused snapshot must activate after invalidation.
  expect(fallback(parent).visible).toBe(false);
  const root = native(parent);
  expect(root.visible).toBe(true);
  expect(root.getObjectByName('sepulcher-floor')!.position.toArray()).toEqual([480, 0, 300]);
  expect(root.getObjectByName('sepulcher-boundary')!.position.toArray()).toEqual([480, 0, 300]);
  expect(
    root.children
      .filter((part) => part.name === 'sepulcher-lantern')
      .map((part) => part.position.toArray()),
  ).toEqual([
    [55, 0, 90],
    [55, 0, 510],
    [905, 0, 90],
    [905, 0, 510],
  ]);
  const pillars = root.children.filter((part) => part.name === 'sepulcher-pillar');
  expect(pillars.map((part) => part.position.toArray())).toEqual([
    [300, 0, 300],
    [650, 0, 350],
  ]);
  expect(pillars.map((part) => part.scale.toArray())).toEqual([
    [0.6, 1, 0.6],
    [1.4, 1, 1.4],
  ]);
  expect(state).toEqual(before);
  for (const region of [1, 2, 3, 0]) {
    state.region = region;
    room.sync(state, camera);
    expect(root.visible).toBe(region === 0);
    expect(fallback(parent).visible).toBe(region !== 0);
  }
  expect(load).toHaveBeenCalledOnce();
  state.room.pillars = [];
  room.sync(state, camera);
  expect(root.children.filter((part) => part.name === 'sepulcher-pillar')).toHaveLength(0);
  room.dispose();
});

it('fades every private pillar material for actual occlusion and windups, then restores it', async () => {
  load.mockResolvedValue(asset());
  const parent = new T.Group(),
    room = createRoom(parent),
    { state, camera } = fixture();
  room.sync(state, camera);
  await Promise.resolve();
  room.sync(state, camera);
  const root = native(parent),
    pillars = root.children.filter((part) => part.name === 'sepulcher-pillar');
  const first = materials(pillars[0]),
    second = materials(pillars[1]);
  expect(first[0]).not.toBe(second[0]);
  state.player.x = 300;
  state.player.y = 300;
  const before = structuredClone(state);
  room.sync(state, camera);
  expect(first.map((material) => material.opacity)).toEqual([0.22, 0.7 * 0.22]);
  expect(first.every((material) => material.transparent && !material.depthWrite)).toBe(true);
  expect(second.map((material) => material.opacity)).toEqual([1, 0.7]);
  expect(materials(root.getObjectByName('sepulcher-floor')!)[0].opacity).toBe(1);
  expect(state).toEqual(before);
  state.player.x = 900;
  state.player.y = 500;
  spawnEnemy(state, 'hunter', { x: 850, y: 500 });
  state.enemies[0].windup = 1;
  room.sync(state, camera);
  expect(second.map((material) => material.opacity)).toEqual([0.22, 0.7 * 0.22]);
  state.enemies[0].windup = 0;
  room.sync(state, camera);
  for (const list of [first, second]) {
    expect(list.map((material) => material.opacity)).toEqual([1, 0.7]);
    expect(list.map((material) => material.depthWrite)).toEqual([true, false]);
  }
  room.dispose();
});

it('rebuilds private materials without releasing shared geometry or textures before final disposal', async () => {
  const delivered = asset();
  load.mockResolvedValue(delivered);
  const parent = new T.Group(),
    room = createRoom(parent),
    { state, camera } = fixture();
  room.sync(state, camera);
  await Promise.resolve();
  room.sync(state, camera);
  const geometries = [...delivered.meshes.values()].map((mesh) =>
    vi.spyOn(mesh.geometry, 'dispose'),
  );
  const texture = vi.spyOn(delivered.texture, 'dispose'),
    source = vi.spyOn(delivered.stone, 'dispose');
  const root = native(parent),
    old = materials(root).map((material) => vi.spyOn(material, 'dispose'));
  const oldPillars = root.children.filter((part) => part.name === 'sepulcher-pillar');
  const firstMesh = oldPillars[0].getObjectByName('Pillar')!.children[0] as T.Mesh;
  const secondMesh = oldPillars[1].getObjectByName('Pillar')!.children[0] as T.Mesh;
  expect(firstMesh.geometry).toBe(secondMesh.geometry);
  expect(firstMesh.geometry).toBe(delivered.meshes.get('Pillar')!.geometry);
  room.sync(state, camera);
  expect(old.every((dispose) => dispose.mock.calls.length === 0)).toBe(true);
  state.room.pillars[0].radius = 24;
  room.sync(state, camera);
  expect(old.every((dispose) => dispose.mock.calls.length === 1)).toBe(true);
  expect(geometries.every((dispose) => dispose.mock.calls.length === 0)).toBe(true);
  expect(texture).not.toHaveBeenCalled();
  expect(source).not.toHaveBeenCalled();
  const current = materials(root).map((material) => vi.spyOn(material, 'dispose'));
  room.dispose();
  room.dispose();
  room.sync(state, camera);
  expect(current.every((dispose) => dispose.mock.calls.length === 1)).toBe(true);
  expect(old.every((dispose) => dispose.mock.calls.length === 1)).toBe(true);
  expect(geometries.every((dispose) => dispose.mock.calls.length === 1)).toBe(true);
  expect(texture).toHaveBeenCalledOnce();
  expect(source).toHaveBeenCalledOnce();
  expect(parent.children).toHaveLength(0);
});

it.each(['missing', 'empty', 'mesh', 'duplicate'])(
  'keeps the complete room fallback and releases an invalid kit: %s',
  async (failure) => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const delivered = asset(),
      pillar = delivered.scene.getObjectByName('Pillar')!;
    if (failure === 'missing') pillar.name = 'WrongPillar';
    if (failure === 'empty') {
      delivered.scene.getObjectByName('Floor')!.name = 'WrongFloor';
      delivered.scene.add(Object.assign(new T.Group(), { name: 'Floor' }));
    }
    if (failure === 'mesh') {
      pillar.name = 'WrongPillar';
      delivered.meshes.get('Pillar')!.name = 'Pillar';
    }
    if (failure === 'duplicate') delivered.scene.add(pillar.clone(true));
    const released = vi.spyOn(delivered.meshes.get('Pillar')!.geometry, 'dispose');
    load.mockResolvedValue(delivered);
    const parent = new T.Group(),
      redraw = vi.fn(),
      room = createRoom(parent, redraw),
      { state, camera } = fixture();
    try {
      room.sync(state, camera);
      await Promise.resolve();
      room.sync(state, camera);
      expect(fallback(parent).visible).toBe(true);
      expect(native(parent).visible).toBe(false);
      expect(redraw).not.toHaveBeenCalled();
      expect(released).toHaveBeenCalledOnce();
      room.dispose();
      expect(released).toHaveBeenCalledOnce();
    } finally {
      room.dispose();
      warning.mockRestore();
    }
  },
);

it('keeps failed-load fallback and releases a late delivery without resurrecting the room', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { state, camera } = fixture();
  let failed: ReturnType<typeof createRoom> | undefined,
    late: ReturnType<typeof createRoom> | undefined;
  try {
    load.mockRejectedValue(new Error('offline'));
    const parent = new T.Group();
    failed = createRoom(parent);
    failed.sync(state, camera);
    await Promise.resolve();
    await Promise.resolve();
    failed.sync(state, camera);
    expect(fallback(parent).visible).toBe(true);
    expect(load).toHaveBeenCalledOnce();
    failed.dispose();
    const delivered = asset();
    let finish!: (value: ReturnType<typeof asset>) => void;
    load.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const redraw = vi.fn(),
      lateParent = new T.Group();
    late = createRoom(lateParent, redraw);
    late.sync(state, camera);
    late.dispose();
    const released = vi.spyOn(delivered.meshes.get('Pillar')!.geometry, 'dispose');
    finish(delivered);
    await Promise.resolve();
    late.sync(state, camera);
    expect(released).toHaveBeenCalledOnce();
    expect(redraw).not.toHaveBeenCalled();
    expect(lateParent.children).toHaveLength(0);
  } finally {
    failed?.dispose();
    late?.dispose();
    warning.mockRestore();
  }
});
