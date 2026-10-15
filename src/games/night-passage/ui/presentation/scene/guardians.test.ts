import * as T from 'three';
import { beforeEach, expect, it, vi } from 'vitest';
import { createGame } from '../../../domain/game';
import { enemyStep, spawnEnemy } from '../../../domain/encounters';
import { GUARDIANS } from '../../../domain/encounter-content';
import { createGuardians } from './guardians';
import { createActors } from './actors';

const { load } = vi.hoisted(() => ({ load: vi.fn<(url: string) => Promise<unknown>>() }));
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    loadAsync = load;
  },
}));
// Weighted marker clips expose exact sampled phases; real native form/motion is checked in the browser.
const ids = ['bellwarden', 'undertow', 'ashregent', 'sovereign'];
const regions = ids.map((_, region) => region);
const attackClips = [
  ['sweep', 'rain', 'wheel'],
  ['charge', 'volley', 'pulse'],
  ['cross', 'rain', 'volley'],
  ['cross', 'rain', 'pulse', 'wheel'],
];
function asset(region = 0) {
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
  const attacks = attackClips[region];
  const animations = ['idle', 'run', ...attacks, 'stagger'].map(
    (name, index) =>
      new T.AnimationClip(name, 1, [
        new T.NumberKeyframeTrack('joint.position[x]', [0, 1], [index * 10, index * 10 + 1]),
      ]),
  );
  return { scene, animations, mesh };
}
function encounter(enraged = false, region = 0) {
  const state = createGame('bellwarden-presentation');
  state.phase = 'combat';
  state.region = region;
  state.player.x = 480;
  state.player.y = 300;
  spawnEnemy(state, 'boss', { x: 480, y: 190 });
  const boss = state.enemies[0];
  boss.cooldown = 0;
  if (enraged) boss.hp = boss.maxHp / 2 - 1;
  return { state, boss };
}
const pose = (root: T.Group) => root.getObjectByName('joint')!.position.x;
beforeEach(() => {
  load.mockReset();
});

it.each([
  { region: 0, enraged: false },
  { region: 0, enraged: true },
  { region: 1, enraged: false },
  { region: 1, enraged: true },
  { region: 2, enraged: false },
  { region: 2, enraged: true },
  { region: 3, enraged: false },
  { region: 3, enraged: true },
])(
  'samples the actual regional pattern cycle and wraparound, region=$region enraged=$enraged',
  async ({ region, enraged }) => {
    load.mockResolvedValue(asset(region));
    const library = createGuardians(() => {}),
      root = new T.Group();
    const model = library.attach(root);
    const { state, boss } = encounter(enraged, region);
    model.sync(boss, state, false);
    await Promise.resolve();
    for (let index = 0; index <= attackClips[region].length; index++) {
      expect(boss.pattern).toBe(index);
      boss.cooldown = 0;
      state.tick++;
      enemyStep(state, boss);
      model.sync(boss, state, false);
      const patternIndex = index % attackClips[region].length;
      const pattern = GUARDIANS[region][patternIndex];
      const windup = enraged ? Math.round(pattern.windup * 0.8) : pattern.windup;
      const recovery = enraged ? Math.round(pattern.recovery * 0.72) : pattern.recovery;
      const marker = 20 + patternIndex * 10;
      expect(boss.windup).toBe(windup);
      expect(pose(root)).toBeCloseTo(marker);
      for (let remaining = windup - 1; remaining >= 1; remaining--) {
        state.tick++;
        enemyStep(state, boss);
        model.sync(boss, state, false);
        expect(boss.windup).toBe(remaining);
        expect(pose(root)).toBeCloseTo(marker + 0.45 * (1 - remaining / windup));
      }
      const beforeRelease = { x: boss.x, y: boss.y };
      state.tick++;
      enemyStep(state, boss);
      model.sync(boss, state, false);
      expect(boss.pattern).toBe(index + 1);
      expect(boss.cooldown).toBe(recovery);
      expect(pose(root)).toBeCloseTo(marker + 0.45); // completed pattern, not next windup
      if (region === 1 && patternIndex === 0) {
        expect(Math.hypot(boss.x - beforeRelease.x, boss.y - beforeRelease.y)).toBeGreaterThan(300);
        expect(root.getObjectByName('night-passage-authored-undertow')!.position.toArray()).toEqual(
          [0, 0, 0],
        );
      }
      if (region === 2 || region === 3) {
        expect({ x: boss.x, y: boss.y }).toEqual(beforeRelease);
        expect(
          root.getObjectByName(`night-passage-authored-${ids[region]}`)!.position.toArray(),
        ).toEqual([0, 0, 0]);
      }
      const before = structuredClone(state);
      model.sync(boss, state, false);
      expect(pose(root)).toBeCloseTo(marker + 0.45);
      expect(state).toEqual(before);
      for (let step = 1; step < 18; step++) {
        state.tick++;
        enemyStep(state, boss);
        model.sync(boss, state, false);
        expect(pose(root)).toBeCloseTo(marker + 0.45 + (0.55 * step) / 18);
      }
      state.tick++;
      enemyStep(state, boss);
      model.sync(boss, state, false);
      expect(pose(root)).toBeLessThan(1); // settle ended; standing boss can idle
    }
    library.dispose();
  },
);

it.each(regions)(
  'does not retime observed durations across half health; reduced poses stay fixed, region=%s',
  async (region) => {
    load.mockResolvedValue(asset(region));
    const library = createGuardians(() => {}),
      root = new T.Group();
    const model = library.attach(root);
    const { state, boss } = encounter(false, region);
    const firstPattern = GUARDIANS[region][0];
    model.sync(boss, state, false);
    await Promise.resolve();
    const step = (count: number) => {
      for (let i = 0; i < count; i++) {
        state.tick++;
        enemyStep(state, boss);
        model.sync(boss, state, false);
      }
    };
    step(1);
    step(10);
    boss.hp = boss.maxHp / 2 - 1;
    step(10);
    expect(pose(root)).toBeCloseTo(20 + (0.45 * 20) / firstPattern.windup);
    model.sync(boss, state, true);
    expect(pose(root)).toBeCloseTo(20.36);
    step(1);
    model.sync(boss, state, true);
    expect(pose(root)).toBeCloseTo(20.36);
    step(boss.windup);
    expect(boss.cooldown).toBe(Math.round(firstPattern.recovery * 0.72)); // health at release chooses the new cooldown
    expect(pose(root)).toBeCloseTo(20.45);
    boss.stagger = 9;
    model.sync(boss, state, true);
    const staggerMarker = (attackClips[region].length + 2) * 10;
    expect(pose(root)).toBeCloseTo(staggerMarker + 0.4);
    boss.stagger = 4;
    model.sync(boss, state, true);
    expect(pose(root)).toBeCloseTo(staggerMarker + 0.4);
    library.dispose();

    load.mockResolvedValue(asset(region));
    const second = createGuardians(() => {}),
      otherRoot = new T.Group(),
      other = second.attach(otherRoot);
    const normal = encounter(false, region);
    other.sync(normal.boss, normal.state, false);
    await Promise.resolve();
    for (let i = 0; i <= firstPattern.windup; i++) {
      normal.state.tick++;
      enemyStep(normal.state, normal.boss);
      other.sync(normal.boss, normal.state, false);
    }
    expect(normal.boss.cooldown).toBe(firstPattern.recovery);
    normal.boss.hp = normal.boss.maxHp / 2 - 1;
    for (let i = 0; i < 10; i++) {
      normal.state.tick++;
      enemyStep(normal.state, normal.boss);
      other.sync(normal.boss, normal.state, false);
    }
    expect(pose(otherRoot)).toBeCloseTo(20 + 0.45 + (0.55 * 10) / 18);
    second.dispose();
  },
);

it('restores the correct fallback when one pooled boss crosses guardian regions and returns', async () => {
  // Unrelated asset requests remain pending: this regression owns guardian selection only.
  load.mockImplementation((url) => {
    const region = ids.findIndex((id) => url.includes(`guardian-${id}`));
    if (region >= 0) return Promise.resolve(asset(region));
    return new Promise(() => {});
  });
  const parent = new T.Group(),
    actors = createActors(parent),
    { state, boss } = encounter();
  actors.sync(state, false);
  await Promise.resolve();
  actors.sync(state, false);
  const pooled = parent.getObjectByName('blockout-boss')!;
  const native = pooled.getObjectByName('night-passage-authored-bellwarden')!;
  expect(native.visible).toBe(true);
  expect(pooled.children[0].visible).toBe(false);
  expect((pooled.children[3] as T.Sprite).position.y).toBe(58);
  for (const region of [1, 2, 3, 4, 0]) {
    state.enemies = [];
    actors.sync(state, false);
    state.region = region;
    state.enemies = [{ ...boss, id: boss.id + region + 10 }];
    actors.sync(state, false);
    await Promise.resolve();
    actors.sync(state, false);
    expect(parent.getObjectByName('blockout-boss')).toBe(pooled);
    expect(native.visible).toBe(region === 0);
    for (const [index, id] of ids.entries()) {
      expect(pooled.getObjectByName(`night-passage-authored-${id}`)?.visible ?? false).toBe(
        region === index,
      );
    }
    expect(pooled.children[0].visible).toBe(region === 4);
    expect((pooled.children[3] as T.Sprite).position.y).toBe(region < 4 ? 58 : 47);
  }
  expect(load.mock.calls.filter(([url]) => url.includes('guardian-'))).toHaveLength(ids.length);
  actors.dispose();
});

it.each(regions)(
  'a failed guardian library does not disable the other regional assets, failed=%s',
  async (failedRegion) => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    load.mockImplementation((url) => {
      const region = ids.findIndex((id) => url.includes(`guardian-${id}`));
      return region === failedRegion
        ? Promise.reject(new Error('unavailable regional asset'))
        : Promise.resolve(asset(region));
    });
    const library = createGuardians(() => {}),
      root = new T.Group(),
      model = library.attach(root);
    try {
      const failed = encounter(false, failedRegion);
      expect(model.sync(failed.boss, failed.state, false)).toBe(false);
      await Promise.resolve();
      await Promise.resolve();
      expect(model.sync(failed.boss, failed.state, false)).toBe(false);
      for (const region of regions.filter((region) => region !== failedRegion)) {
        const supported = encounter(false, region);
        model.sync(supported.boss, supported.state, false);
        await Promise.resolve();
        expect(model.sync(supported.boss, supported.state, false)).toBe(true);
        for (const [index, id] of ids.entries()) {
          expect(root.getObjectByName(`night-passage-authored-${id}`)?.visible ?? false).toBe(
            index === region,
          );
        }
        expect(model.sync(failed.boss, failed.state, false)).toBe(false);
        expect(model.sync(supported.boss, supported.state, false)).toBe(true);
      }
      expect(load).toHaveBeenCalledTimes(ids.length);
    } finally {
      library.dispose();
      warning.mockRestore();
    }
  },
);
