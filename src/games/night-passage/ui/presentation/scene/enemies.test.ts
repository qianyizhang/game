import * as T from 'three';
import { beforeEach, expect, it, vi } from 'vitest';
import { createGame } from '../../../domain/game';
import { spawnEnemy } from '../../../domain/encounters';
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
beforeEach(() => {
  load.mockReset();
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

it('requires the archer nocked arrow before replacing its fallback', async () => {
  const delivered = asset();
  delivered.scene.getObjectByName('Reed_arrow')!.removeFromParent();
  load.mockResolvedValue(delivered);
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const library = createEnemies(() => {});
  try {
    const actor = library.attach(new T.Group(), 'archer');
    await Promise.resolve();
    const { state, enemy } = snapshot('archer');
    expect(actor.sync(enemy, state, false)).toBe(false);
  } finally {
    library.dispose();
    warn.mockRestore();
  }
});
