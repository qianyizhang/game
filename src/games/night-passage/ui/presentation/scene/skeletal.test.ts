import * as T from 'three';
import { beforeEach, expect, it, vi } from 'vitest';
import { createGame } from '../../../domain/game';
import { spawnEnemy } from '../../../domain/encounters';
import { createSkeletalLibrary } from './skeletal';
const { load } = vi.hoisted(() => ({ load: vi.fn<(url: string) => Promise<unknown>>() }));
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    loadAsync = load;
  },
}));
function asset() {
  const scene = new T.Group();
  const joint = new T.Bone();
  joint.name = 'joint';
  const geometry = new T.BoxGeometry();
  const count = geometry.attributes.position.count;
  geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(new Uint16Array(count * 4), 4));
  const weights = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) weights[i * 4] = 1;
  geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  const mesh = new T.SkinnedMesh(geometry, new T.MeshStandardMaterial({ map: new T.Texture() }));
  mesh.name = 'surface';
  mesh.add(joint);
  mesh.bind(new T.Skeleton([joint]));
  scene.add(mesh);
  const arrow = new T.Object3D();
  arrow.name = 'Reed_arrow';
  scene.add(arrow);
  const animations = ['idle', 'run', 'attack', 'stagger'].map(
    (name, index) =>
      new T.AnimationClip(name, 1, [
        new T.NumberKeyframeTrack('joint.position[x]', [0, 1], [index * 10, index * 10 + 1]),
      ]),
  );
  return { scene, animations, mesh };
}

const profiles = [
  { id: 'hunter', url: 'hunter.glb', clips: ['idle', 'run', 'attack', 'stagger'] },
] as const;
function enemy() {
  const state = createGame('skeletal-lifetime');
  spawnEnemy(state, 'hunter', { x: 200, y: 200 });
  return state.enemies[0];
}
const pose = (root: T.Group) => root.getObjectByName('joint')!.position.x;
beforeEach(() => {
  load.mockReset();
});

it('shares a template while isolating skeletons, poses, materials and hit emission until final release', async () => {
  const delivered = asset();
  delivered.mesh.material.emissive.setHex(0x2277aa);
  delivered.mesh.material.emissiveIntensity = 1.2;
  let finish!: (value: ReturnType<typeof asset>) => void;
  load.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const redraw = vi.fn();
  const library = createSkeletalLibrary(profiles, redraw);
  const a = new T.Group(),
    b = new T.Group();
  const first = library.attach(a, 'hunter'),
    second = library.attach(b, 'hunter');
  const unit = enemy();
  const sample = vi.fn(() => ({ clip: 'attack' as const, phase: 0 }));
  expect(first.sync(unit, sample)).toBe(false);
  expect(second.sync(unit, sample)).toBe(false);
  expect(sample).not.toHaveBeenCalled();
  expect(load).toHaveBeenCalledOnce();
  finish(delivered);
  await Promise.resolve();
  expect(redraw).toHaveBeenCalledOnce();
  expect(first.sync(unit, sample)).toBe(true);
  second.sync(unit, () => ({ clip: 'attack', phase: 0.8 }));
  expect(pose(a)).toBeCloseTo(20);
  expect(pose(b)).toBeCloseTo(20.8);
  const meshA = a.getObjectByName('surface') as T.SkinnedMesh,
    meshB = b.getObjectByName('surface') as T.SkinnedMesh;
  expect(meshA.skeleton).not.toBe(meshB.skeleton);
  expect(meshA.material).not.toBe(meshB.material);
  expect(meshA.geometry).toBe(meshB.geometry);
  const material = meshA.material as T.MeshStandardMaterial;
  expect(material.map).toBe(delivered.mesh.material.map);
  const releases = [
    delivered.mesh.geometry,
    delivered.mesh.material.map!,
    meshA.skeleton,
    meshB.skeleton,
    material,
  ].map((resource) => vi.spyOn(resource, 'dispose'));
  unit.flash = 3;
  first.sync(unit, sample);
  expect(material.emissive.getHex()).not.toBe(
    (meshB.material as T.MeshStandardMaterial).emissive.getHex(),
  );
  unit.flash = 0;
  unit.stagger = 3;
  first.sync(unit, sample);
  expect(material.emissiveIntensity).toBe(0.3);
  unit.stagger = 0;
  first.sync(unit, sample);
  expect(material.emissive.getHex()).toBe(0x2277aa);
  expect(material.emissiveIntensity).toBe(1.2);
  first.sync(unit, () => ({ clip: 'idle', phase: 1.25 }));
  expect(pose(a)).toBeCloseTo(0.25);
  first.sync(unit, () => ({ clip: 'attack', phase: 1 }));
  expect(pose(a)).toBeCloseTo(21, 4);
  expect(pose(b)).toBeCloseTo(20.8);
  for (const release of releases) expect(release).not.toHaveBeenCalled();
  library.dispose();
  library.dispose();
  for (const release of releases) expect(release).toHaveBeenCalledOnce();
  expect(a.children).toHaveLength(0);
  expect(b.children).toHaveLength(0);
  expect(first.sync(unit, sample)).toBe(false);
  expect(library.attach(a, 'hunter').sync(unit, sample)).toBe(false);
  expect(a.children).toHaveLength(0);
});

it.each(['offline', 'clip', 'attachment'] as const)(
  'keeps fallback on %s failure and releases rejected models',
  async (mode) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const delivered = asset();
    if (mode === 'clip') delivered.animations.pop();
    const release = vi.spyOn(delivered.mesh.geometry, 'dispose');
    if (mode === 'offline') load.mockRejectedValue(new Error('offline'));
    else load.mockResolvedValue(delivered);
    const redraw = vi.fn();
    const library = createSkeletalLibrary(
      profiles.map((profile) => ({ ...profile, validate: () => mode !== 'attachment' })),
      redraw,
    );
    try {
      const instance = library.attach(new T.Group(), 'hunter');
      await Promise.resolve();
      await Promise.resolve();
      expect(instance.sync(enemy(), () => ({ clip: 'idle', phase: 0 }))).toBe(false);
      expect(redraw).not.toHaveBeenCalled();
      expect(release).toHaveBeenCalledTimes(mode === 'offline' ? 0 : 1);
      library.dispose();
      expect(release).toHaveBeenCalledTimes(mode === 'offline' ? 0 : 1);
    } finally {
      library.dispose();
      warn.mockRestore();
    }
  },
);

it('releases late delivery without attaching or sampling it', async () => {
  const delivered = asset();
  let finish!: (value: ReturnType<typeof asset>) => void;
  load.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const redraw = vi.fn();
  const library = createSkeletalLibrary(profiles, redraw);
  const parent = new T.Group();
  const instance = library.attach(parent, 'hunter');
  library.dispose();
  const release = vi.spyOn(delivered.mesh.geometry, 'dispose');
  finish(delivered);
  await Promise.resolve();
  const sample = vi.fn(() => ({ clip: 'idle' as const, phase: 0 }));
  expect(instance.sync(enemy(), sample)).toBe(false);
  expect(sample).not.toHaveBeenCalled();
  expect(release).toHaveBeenCalledOnce();
  expect(redraw).not.toHaveBeenCalled();
  expect(parent.children).toHaveLength(0);
});
