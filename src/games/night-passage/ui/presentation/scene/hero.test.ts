import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyCommand, createGame } from '../../../domain/game';
import type { Input, WeaponId } from '../../../domain/types';
import { createHero } from './hero';

const { load, weaponsLoad } = vi.hoisted(() => ({
  load: vi.fn<(url: string) => Promise<unknown>>(),
  weaponsLoad: vi.fn<(url: string) => Promise<unknown>>(),
}));
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    loadAsync(url: string) {
      return url.includes('weapons.glb') ? weaponsLoad(url) : load(url);
    }
  },
}));
const clipNames = [
  'idle',
  'run',
  'dodge',
  'slash',
  'thrust',
  'shoot',
  'guard',
  'punch',
  'cast',
  'death',
  'sword_special',
  'spear_special',
  'shield_special',
  'bow_special',
  'fists_special',
  'punch_left',
];
function asset() {
  const scene = new THREE.Group();
  const marker = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  marker.name = 'pose_marker';
  const socket = new THREE.Bone();
  socket.name = 'weapon_socket';
  socket.position.set(0.25, 1, 0);
  const left = new THREE.Bone();
  left.name = 'weapon_socket_L';
  scene.add(marker, socket, left);
  const animations = clipNames.map(
    (name, index) =>
      new THREE.AnimationClip(name, 1, [
        new THREE.NumberKeyframeTrack(
          'pose_marker.position[x]',
          [0, 1],
          [index * 10, index * 10 + 1],
        ),
      ]),
  );
  return { scene, marker, animations, socket };
}
function armoryAsset() {
  const scene = new THREE.Group();
  for (const name of [
    'weapon_sword',
    'weapon_spear',
    'weapon_shield',
    'weapon_bow',
    'weapon_fists_R',
    'weapon_fists_L',
  ]) {
    const group = new THREE.Group();
    group.name = name;
    scene.add(group);
  }
  const geometry = new THREE.BoxGeometry();
  geometry.morphAttributes.position = [geometry.attributes.position.clone()];
  geometry.morphAttributes.position[0].name = 'Draw';
  const string = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  string.name = 'bow_string';
  scene.getObjectByName('weapon_bow')!.add(string);
  const arrow = new THREE.Object3D();
  arrow.name = 'Bow_nocked_shaft';
  scene.getObjectByName('weapon_bow')!.add(arrow);
  return { scene, animations: [], string, arrow };
}
function setup() {
  const root = new THREE.Group();
  const hand = new THREE.Group();
  root.add(hand);
  const held = new THREE.Group();
  const geometry = new THREE.BoxGeometry();
  held.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()));
  hand.add(held);
  const weapons = new Map<WeaponId, THREE.Group>([['sword', held]]);
  const redraw = vi.fn();
  return { root, hand, held, geometry, redraw, hero: createHero(root, hand, weapons, redraw) };
}
beforeEach(() => {
  load.mockReset();
  weaponsLoad.mockReset();
  weaponsLoad.mockResolvedValue(armoryAsset());
});
const idle: Input = {
  x: 0,
  y: 0,
  aim: 0,
  attack: false,
  special: false,
  dash: false,
  cast: false,
  call: false,
};

describe('authored hero delivery', () => {
  it('replaces a paused fallback after load and releases native resources without owning hand meshes', async () => {
    const delivered = asset();
    let finish!: (value: ReturnType<typeof asset>) => void;
    load.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { hero, held, hand, geometry, redraw } = setup();
    const state = createGame('paused-delivery');
    const ownedDispose = vi.spyOn(delivered.marker.geometry, 'dispose');
    const externalDispose = vi.spyOn(geometry, 'dispose');
    expect(hero.sync(state, false)).toBe(false);
    finish(delivered);
    await Promise.resolve();
    expect(redraw).toHaveBeenCalledOnce();
    expect(hero.sync(state, false)).toBe(true);
    expect(held.parent).toBe(delivered.socket);
    expect(held.getWorldScale(new THREE.Vector3()).x).toBeCloseTo(1);
    hero.dispose();
    hero.dispose();
    expect(ownedDispose).toHaveBeenCalledOnce();
    expect(externalDispose).not.toHaveBeenCalled();
    expect(held.parent).toBe(hand);
    expect(held.scale.x).toBe(1);
    expect(hero.sync(state, false)).toBe(false);
  });

  it('disposes a late delivery after cleanup instead of attaching it or invalidating', async () => {
    const delivered = asset();
    let finish!: (value: ReturnType<typeof asset>) => void;
    load.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const ownedDispose = vi.spyOn(delivered.marker.geometry, 'dispose');
    const { hero, redraw, root } = setup();
    hero.dispose();
    finish(delivered);
    await Promise.resolve();
    expect(ownedDispose).toHaveBeenCalledOnce();
    expect(redraw).not.toHaveBeenCalled();
    expect(delivered.scene.parent).toBeNull();
    expect(root.children).toHaveLength(1);
  });

  it('retains the fallback for failed or incomplete delivery', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    load.mockRejectedValue(new Error('unavailable'));
    const first = setup();
    await Promise.resolve();
    await Promise.resolve();
    expect(first.hero.sync(createGame('failed'), false)).toBe(false);
    first.hero.dispose();
    const incomplete = asset();
    incomplete.socket.removeFromParent();
    const ownedDispose = vi.spyOn(incomplete.marker.geometry, 'dispose');
    load.mockResolvedValue(incomplete);
    const second = setup();
    await Promise.resolve();
    expect(second.hero.sync(createGame('incomplete'), false)).toBe(false);
    expect(ownedDispose).toHaveBeenCalledOnce();
    second.hero.dispose();
    warning.mockRestore();
  });

  it('samples windup/contact/recovery from rules ticks and holds repeated paused draws', async () => {
    const delivered = asset();
    load.mockResolvedValue(delivered);
    const { hero } = setup();
    await Promise.resolve();
    const state = createGame('sword-timing');
    state.player.strike = { action: 'attack', aim: 0.6, left: 7, recovery: 12, dashed: false };
    hero.sync(state, false);
    expect(delivered.marker.position.x).toBeCloseTo(30);
    state.tick += 6;
    state.player.strike.left = 1;
    hero.sync(state, false);
    expect(delivered.marker.position.x).toBeCloseTo(30 + (0.45 * 6) / 7);
    state.tick++;
    state.player.strike = null;
    state.player.recovery = 12;
    hero.sync(state, false);
    expect(delivered.marker.position.x).toBeCloseTo(30.45);
    state.tick += 11;
    state.player.recovery = 1;
    const before = structuredClone(state);
    hero.sync(state, false);
    const pose = delivered.marker.position.x;
    expect(pose).toBeCloseTo(30 + 0.45 + (0.55 * 11) / 12);
    hero.sync(state, false);
    expect(delivered.marker.position.x).toBe(pose);
    expect(state).toEqual(before);
    hero.dispose();
  });

  it('uses weapon-specific clips and stable reduced-motion movement/attack poses', async () => {
    const delivered = asset();
    load.mockResolvedValue(delivered);
    const { hero } = setup();
    await Promise.resolve();
    const state = createGame('selection');
    hero.sync(state, false);
    state.tick = 10;
    state.player.x += 15;
    hero.sync(state, true);
    expect(delivered.marker.position.x).toBe(10); // run, stable frame
    state.tick++;
    state.player.x += 3;
    hero.sync(state, true);
    expect(delivered.marker.position.x).toBe(10);
    for (const [id, frame] of [
      ['sword', 30],
      ['spear', 40],
      ['shield', 60],
      ['bow', 50],
      ['fists', 70],
    ] as const) {
      state.player.weapon = id;
      state.player.strike = { action: 'attack', aim: 0, left: 1, recovery: 12, dashed: false };
      hero.sync(state, true);
      expect(delivered.marker.position.x).toBeCloseTo(frame + 0.36);
      state.player.strike.left = 2;
      hero.sync(state, true);
      expect(delivered.marker.position.x).toBeCloseTo(frame + 0.36);
    }
    state.player.strike = { action: 'cast', aim: 0, left: 8, recovery: 14, dashed: false };
    hero.sync(state, true);
    expect(delivered.marker.position.x).toBeCloseTo(80.36);
    state.player.strike = null;
    state.player.dashLeft = 8;
    hero.sync(state, true);
    expect(delivered.marker.position.x).toBeCloseTo(20.25);
    state.player.hp = 0;
    hero.sync(state, true);
    expect(delivered.marker.position.x).toBeCloseTo(91);
    hero.dispose();
  });

  it('drops a canceled spear special when batched dash attacks skip their short windup', async () => {
    const delivered = asset();
    load.mockResolvedValue(delivered);
    const { hero } = setup();
    await Promise.resolve();
    let state = applyCommand(createGame('dash-animation-cancel'), {
      type: 'start',
      weapon: 'spear',
      runes: [],
    }).state;
    const frame = (input: Input, ticks: number) => {
      const result = applyCommand(state, { type: 'frame', input, ticks });
      expect(result.error).toBeNull();
      state = result.state;
      hero.sync(state, false);
    };
    frame({ ...idle, aim: -0.6, special: true }, 1);
    expect(state.player.strike?.action).toBe('special');
    expect(delivered.marker.position.x).toBeGreaterThanOrEqual(110); // spear special
    expect(delivered.marker.position.x).toBeLessThan(111);
    frame({ ...idle, aim: 0.8, dash: true, attack: true }, 6);
    expect(state.player).toMatchObject({ dashLeft: 6, strike: null, recovery: 12 });
    expect(delivered.marker.position.x).toBeGreaterThanOrEqual(20); // dodge masks recovery
    expect(delivered.marker.position.x).toBeLessThan(21);
    frame({ ...idle, aim: 0.8, dash: true, attack: true }, 6);
    expect(state.player).toMatchObject({ dashLeft: 0, strike: null, recovery: 6 });
    expect(delivered.marker.position.x).toBeCloseTo(40 + 0.45 + 0.55 * (1 - 6 / 15));
    expect(delivered.scene.parent?.rotation.y).toBeCloseTo(-0.8);
    const sampled = delivered.marker.position.x;
    hero.sync(state, false);
    expect(delivered.marker.position.x).toBe(sampled);
    hero.dispose();
  });

  it('rejects old clip/aim when a new unsampled action increases recovery', async () => {
    const delivered = asset();
    load.mockResolvedValue(delivered);
    const { hero } = setup();
    await Promise.resolve();
    let state = applyCommand(createGame('unseen-recovery'), {
      type: 'start',
      weapon: 'spear',
      runes: [],
    }).state;
    const frame = (input: Input, ticks: number) => {
      const result = applyCommand(state, { type: 'frame', input, ticks });
      expect(result.error).toBeNull();
      state = result.state;
      hero.sync(state, false);
    };
    frame({ ...idle, aim: -0.6, special: true }, 1);
    frame(idle, 42);
    expect(state.player).toMatchObject({ strike: null, recovery: 1 });
    expect(delivered.marker.position.x).toBeGreaterThanOrEqual(110);
    expect(delivered.marker.position.x).toBeLessThan(111);
    frame({ ...idle, aim: 0.7, attack: true }, 10);
    expect(state.player).toMatchObject({ strike: null, recovery: 13 });
    expect(delivered.marker.position.x).toBeCloseTo(40 + 0.45 + 0.55 * (1 - 13 / 14));
    expect(delivered.scene.parent?.rotation.y).toBeCloseTo(-0.7);
    // An unobserved action's guessed aim follows the current confirmed snapshot.
    frame({ ...idle, aim: -0.2 }, 1);
    expect(delivered.scene.parent?.rotation.y).toBeCloseTo(0.2);
    hero.dispose();
  });

  it('keeps the procedural hero and hand meshes until the native armory is also ready', async () => {
    const delivered = asset();
    load.mockResolvedValue(delivered);
    let finish!: (value: ReturnType<typeof armoryAsset>) => void;
    weaponsLoad.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { hero, hand, held } = setup();
    const fallback = held.children[0];
    const state = createGame('atomic-armory');
    await Promise.resolve();
    expect(hero.sync(state, false)).toBe(false);
    expect(held.parent).toBe(hand);
    expect(fallback.visible).toBe(true);
    expect(delivered.scene.parent?.visible).toBe(false);
    finish(armoryAsset());
    await Promise.resolve();
    expect(hero.sync(state, false)).toBe(true);
    expect(held.parent).toBe(delivered.socket);
    expect(fallback.visible).toBe(false);
    expect(delivered.scene.parent?.visible).toBe(true);
    hero.dispose();
  });

  it('selects every authored special and keeps the R/L/R fist sequence across confirmed hits', async () => {
    const delivered = asset();
    load.mockResolvedValue(delivered);
    const { hero } = setup();
    await Promise.resolve();
    for (const [id, frame] of [
      ['sword', 100],
      ['spear', 110],
      ['shield', 120],
      ['bow', 130],
      ['fists', 140],
    ] as const) {
      let state = applyCommand(createGame(`special-${id}`), {
        type: 'start',
        weapon: id,
        runes: [],
      }).state;
      const result = applyCommand(state, {
        type: 'frame',
        input: { ...idle, special: true },
        ticks: 1,
      });
      expect(result.error).toBeNull();
      state = result.state;
      hero.sync(state, false);
      expect(delivered.marker.position.x).toBeGreaterThan(frame);
      expect(delivered.marker.position.x).toBeLessThan(frame + 0.45);
    }
    let state = applyCommand(createGame('fist-hands'), {
      type: 'start',
      weapon: 'fists',
      runes: [],
    }).state;
    for (const [index, frame] of [70, 150, 70, 70].entries()) {
      state = applyCommand(state, {
        type: 'frame',
        input: { ...idle, attack: true },
        ticks: 1,
      }).state;
      expect(state.player.combo).toBe(index % 3);
      hero.sync(state, false);
      expect(delivered.marker.position.x).toBeCloseTo(frame + 0.15);
      state = applyCommand(state, { type: 'frame', input: idle, ticks: 2 }).state;
      expect(state.player.combo).toBe((index + 1) % 3);
      hero.sync(state, false);
      expect(delivered.marker.position.x).toBeCloseTo(frame + 0.45);
      state = applyCommand(state, { type: 'frame', input: idle, ticks: 8 }).state;
      hero.sync(state, false);
    }
    hero.dispose();
  });

  it('uses the shared bow windup sample for draw, release, rest and reduced motion', async () => {
    const delivered = asset();
    const armory = armoryAsset();
    load.mockResolvedValue(delivered);
    weaponsLoad.mockResolvedValue(armory);
    const { hero } = setup();
    await Promise.resolve();
    let state = applyCommand(createGame('bow-draw'), {
      type: 'start',
      weapon: 'bow',
      runes: [],
    }).state;
    state = applyCommand(state, {
      type: 'frame',
      input: { ...idle, attack: true },
      ticks: 1,
    }).state;
    hero.sync(state, false);
    expect(armory.string.morphTargetInfluences![0]).toBeCloseTo(1 / 22);
    hero.sync(state, true);
    expect(armory.string.morphTargetInfluences![0]).toBeCloseTo(0.8);
    state = applyCommand(state, { type: 'frame', input: idle, ticks: 5 }).state;
    hero.sync(state, true);
    expect(armory.string.morphTargetInfluences![0]).toBeCloseTo(0.8);
    state = applyCommand(state, { type: 'frame', input: idle, ticks: 16 }).state;
    hero.sync(state, false);
    expect(state.player.strike).toBeNull();
    expect(armory.string.morphTargetInfluences![0]).toBe(0);
    expect(armory.arrow.visible).toBe(false);
    state = applyCommand(state, { type: 'frame', input: idle, ticks: 10 }).state;
    hero.sync(state, false);
    expect(armory.arrow.visible).toBe(true);
    hero.dispose();
  });
});
