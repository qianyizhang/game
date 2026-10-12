import * as T from 'three';
import { beforeEach, expect, it, vi } from 'vitest';
import { createGame } from '../../../domain/game';
import { spawnEnemy } from '../../../domain/encounters';
import { ENEMY_PATTERNS } from '../../../domain/encounter-content';
import { createEnemies } from './enemies';

const { load } = vi.hoisted(() => ({ load: vi.fn<(url: string) => Promise<unknown>>() }));
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    loadAsync(url: string) {
      return load(url);
    }
  },
}));
// Controlled delivery makes late arrival and independent mixer ownership observable.
// Real weighted geometry and saved motions are checked by the native/browser journey.
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
  const mesh = new T.SkinnedMesh(geometry, new T.MeshStandardMaterial());
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
function snapshot(kind: 'hunter' | 'archer' = 'hunter') {
  const state = createGame('enemy-presentation');
  spawnEnemy(state, kind, { x: 200, y: 200 });
  return { state, enemy: state.enemies[0] };
}
const pose = (root: T.Group) => root.getObjectByName('joint')!.position.x;
beforeEach(() => load.mockReset());

it('loads a family once, isolates simultaneous poses and releases shared resources once', async () => {
  const delivered = asset();
  delivered.mesh.material.emissive.setHex(0x2277aa);
  delivered.mesh.material.emissiveIntensity = 1.2;
  let finish!: (value: ReturnType<typeof asset>) => void;
  load.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const invalidate = vi.fn();
  const library = createEnemies(invalidate);
  const a = new T.Group(),
    b = new T.Group();
  const first = library.attach(a, 'hunter'),
    second = library.attach(b, 'hunter');
  const { state, enemy } = snapshot();
  expect(first.sync(enemy, state, false)).toBe(false);
  expect(second.sync(enemy, state, false)).toBe(false);
  expect(load).toHaveBeenCalledOnce();
  finish(delivered);
  await Promise.resolve();
  expect(invalidate).toHaveBeenCalledOnce();
  enemy.windup = ENEMY_PATTERNS.hunter.windup;
  expect(first.sync(enemy, state, false)).toBe(true);
  enemy.windup = 1;
  expect(second.sync(enemy, state, false)).toBe(true);
  expect(pose(a)).toBeCloseTo(20);
  expect(pose(b)).toBeGreaterThan(20.4);
  const firstMesh = a.getObjectByName('surface') as T.SkinnedMesh;
  const secondMesh = b.getObjectByName('surface') as T.SkinnedMesh;
  expect(firstMesh.skeleton).not.toBe(secondMesh.skeleton);
  expect(firstMesh.material).not.toBe(secondMesh.material);
  expect(firstMesh.geometry).toBe(secondMesh.geometry);
  const firstMaterial = firstMesh.material as T.MeshStandardMaterial;
  const secondMaterial = secondMesh.material as T.MeshStandardMaterial;
  enemy.flash = 3;
  first.sync(enemy, state, false);
  expect(firstMaterial.emissive.getHex()).not.toBe(secondMaterial.emissive.getHex());
  enemy.flash = 0;
  first.sync(enemy, state, false);
  expect(firstMaterial.emissive.getHex()).toBe(0x2277aa);
  expect(firstMaterial.emissiveIntensity).toBe(1.2);
  const geometryDispose = vi.spyOn(delivered.mesh.geometry, 'dispose');
  const firstSkeletonDispose = vi.spyOn(firstMesh.skeleton, 'dispose');
  const secondSkeletonDispose = vi.spyOn(secondMesh.skeleton, 'dispose');
  const materialDispose = vi.spyOn(firstMesh.material as T.Material, 'dispose');
  library.dispose();
  library.dispose();
  expect(geometryDispose).toHaveBeenCalledOnce();
  expect(firstSkeletonDispose).toHaveBeenCalledOnce();
  expect(secondSkeletonDispose).toHaveBeenCalledOnce();
  expect(materialDispose).toHaveBeenCalledOnce();
  expect(a.children).toHaveLength(0);
  expect(first.sync(enemy, state, false)).toBe(false);
  expect(library.attach(a, 'hunter').sync(enemy, state, false)).toBe(false);
  expect(a.children).toHaveLength(0);
});

it('holds paused poses, follows windup/contact and recovers locomotion without inventing a spawn attack', async () => {
  load.mockResolvedValue(asset());
  const library = createEnemies(() => {}),
    root = new T.Group();
  const actor = library.attach(root, 'archer');
  await Promise.resolve();
  const { state, enemy } = snapshot('archer');
  actor.sync(enemy, state, false);
  expect(pose(root)).toBeLessThan(1); // initial cooldown is not a release
  state.tick++;
  enemy.x += 3;
  actor.sync(enemy, state, false);
  expect(pose(root)).toBeGreaterThanOrEqual(10);
  enemy.windup = 19;
  actor.sync(enemy, state, false);
  expect(pose(root)).toBeCloseTo(20.225);
  expect(root.getObjectByName('Reed_arrow')!.visible).toBe(true);
  enemy.stagger = 9;
  actor.sync(enemy, state, false);
  expect(pose(root)).toBeCloseTo(30);
  enemy.stagger = 0;
  enemy.windup = 0;
  enemy.pattern = 1;
  enemy.cooldown = 65;
  state.tick++;
  const before = structuredClone(state);
  actor.sync(enemy, state, false);
  expect(pose(root)).toBeCloseTo(20.45);
  expect(root.getObjectByName('Reed_arrow')!.visible).toBe(false);
  actor.sync(enemy, state, false);
  expect(pose(root)).toBeCloseTo(20.45);
  expect(state).toEqual(before);
  enemy.cooldown = 47;
  state.tick++;
  enemy.x += 3;
  actor.sync(enemy, state, false);
  expect(pose(root)).toBeGreaterThanOrEqual(10);
  expect(pose(root)).toBeLessThan(11);
  expect(root.getObjectByName('Reed_arrow')!.visible).toBe(true);
  // A pooled actor must not carry movement into another identity or rewound run.
  enemy.id++;
  actor.sync(enemy, state, false);
  expect(pose(root)).toBeLessThan(1);
  enemy.windup = 10;
  actor.sync(enemy, state, true);
  expect(pose(root)).toBeCloseTo(20.36);
  state.tick += 4;
  enemy.windup = 6;
  actor.sync(enemy, state, true);
  expect(pose(root)).toBeCloseTo(20.36);
  library.dispose();
});

it('keeps fallbacks on failed/incomplete assets and releases a delivery arriving after disposal', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    load.mockRejectedValue(new Error('offline'));
    const failed = createEnemies(() => {});
    const first = failed.attach(new T.Group(), 'hunter');
    await Promise.resolve();
    await Promise.resolve();
    const { state, enemy } = snapshot();
    expect(first.sync(enemy, state, false)).toBe(false);
    failed.dispose();
    const incomplete = asset();
    incomplete.animations.pop();
    const rejectedDispose = vi.spyOn(incomplete.mesh.geometry, 'dispose');
    load.mockResolvedValue(incomplete);
    const invalid = createEnemies(() => {});
    const second = invalid.attach(new T.Group(), 'hunter');
    await Promise.resolve();
    expect(second.sync(enemy, state, false)).toBe(false);
    expect(rejectedDispose).toHaveBeenCalledOnce();
    invalid.dispose();
    const late = asset();
    let finish!: (value: ReturnType<typeof asset>) => void;
    load.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const invalidate = vi.fn();
    const library = createEnemies(invalidate),
      root = new T.Group();
    library.attach(root, 'hunter');
    library.dispose();
    const lateDispose = vi.spyOn(late.mesh.geometry, 'dispose');
    finish(late);
    await Promise.resolve();
    expect(lateDispose).toHaveBeenCalledOnce();
    expect(invalidate).not.toHaveBeenCalled();
    expect(root.children).toHaveLength(0);
  } finally {
    warn.mockRestore();
  }
});
