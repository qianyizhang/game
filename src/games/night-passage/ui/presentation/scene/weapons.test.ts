import * as THREE from 'three';
import { beforeEach, expect, it, vi } from 'vitest';
import type { WeaponId } from '../../../domain/types';
import { createWeapons } from './weapons';

const { load } = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    loadAsync = load;
  },
}));
const ids: WeaponId[] = ['sword', 'spear', 'shield', 'bow', 'fists'];
const rest = { action: null, stage: 'rest', phase: 0 } as const;
function asset() {
  const scene = new THREE.Group();
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial();
  // Exercise the real export-parent conversion instead of requiring flat identity roots.
  const conversion = new THREE.Group();
  conversion.rotation.z = Math.PI / 2;
  scene.add(conversion);
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
    group.add(new THREE.Mesh(geometry, material));
    conversion.add(group);
  }
  const morph = new THREE.BoxGeometry();
  morph.morphAttributes.position = [morph.attributes.position.clone()];
  morph.morphAttributes.position[0].name = 'Draw';
  const string = new THREE.Mesh(morph, material);
  string.name = 'bow_string';
  scene.getObjectByName('weapon_bow')!.add(string);
  return { scene, animations: [], geometry, material };
}
function setup() {
  const fallbackHand = new THREE.Group();
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial();
  const held = new Map<WeaponId, THREE.Group>();
  for (const id of ids) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geometry, material));
    fallbackHand.add(group);
    held.set(id, group);
  }
  const rig = new THREE.Group();
  rig.scale.setScalar(28);
  const right = new THREE.Bone(),
    left = new THREE.Bone();
  rig.add(right, left);
  const redraw = vi.fn();
  return {
    fallbackHand,
    geometry,
    material,
    held,
    right,
    left,
    redraw,
    armory: createWeapons(held, redraw, fallbackHand),
  };
}
beforeEach(() => {
  load.mockReset();
});

it('equips both hands atomically, preserves export transforms and releases only native resources', async () => {
  const delivered = asset();
  let finish!: (value: ReturnType<typeof asset>) => void;
  load.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { armory, held, fallbackHand, right, left, geometry, material, redraw } = setup();
  const nativeGeometry = vi.spyOn(delivered.geometry, 'dispose');
  const nativeMaterial = vi.spyOn(delivered.material, 'dispose');
  const externalGeometry = vi.spyOn(geometry, 'dispose');
  const externalMaterial = vi.spyOn(material, 'dispose');
  armory.bind(right, left);
  expect(armory.sync('fists', rest)).toBe(false);
  expect(held.get('fists')!.parent).toBe(fallbackHand);
  finish(delivered);
  await Promise.resolve();
  expect(redraw).toHaveBeenCalledOnce();
  expect(armory.sync('fists', rest)).toBe(true);
  const fistR =
    delivered.scene.getObjectByName('weapon_fists_R') ??
    held.get('fists')!.getObjectByName('weapon_fists_R')!;
  const fistL = left.getObjectByName('weapon_fists_L')!;
  expect(fistR.getWorldScale(new THREE.Vector3()).x).toBeCloseTo(1);
  expect(fistL.getWorldScale(new THREE.Vector3()).x).toBeCloseTo(1);
  expect(new THREE.Vector3(1, 0, 0).transformDirection(fistR.matrixWorld).y).toBeCloseTo(1);
  expect(fistL.parent!.visible).toBe(true);
  for (const id of ids) expect(held.get(id)!.visible).toBe(id === 'fists');
  armory.sync('sword', rest);
  expect(fistL.parent!.visible).toBe(false);
  expect(held.get('sword')!.children[0].visible).toBe(false);
  armory.dispose();
  armory.dispose();
  expect(nativeGeometry).toHaveBeenCalledOnce();
  expect(nativeMaterial).toHaveBeenCalledOnce();
  expect(externalGeometry).not.toHaveBeenCalled();
  expect(externalMaterial).not.toHaveBeenCalled();
  for (const group of held.values()) {
    expect(group.parent).toBe(fallbackHand);
    expect(group.scale.x).toBe(1);
    expect(group.children).toHaveLength(1);
    expect(group.children[0].visible).toBe(true);
  }
  expect(left.children).toHaveLength(0);
  expect(armory.sync('sword', rest)).toBe(false);
});

it('keeps all procedural hand meshes after an armory load failure', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  load.mockRejectedValue(new Error('missing armory'));
  const { armory, held, right, left, fallbackHand } = setup();
  armory.bind(right, left);
  await Promise.resolve();
  await Promise.resolve();
  expect(armory.sync('bow', rest)).toBe(false);
  for (const group of held.values()) {
    expect(group.parent).toBe(fallbackHand);
    expect(group.children[0].visible).toBe(true);
  }
  armory.dispose();
  warning.mockRestore();
});

it.each(['left-hand', 'draw-morph'])(
  'rejects an armory missing %s and disposes it',
  async (missing) => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const delivered = asset();
    const string = delivered.scene.getObjectByName('bow_string') as THREE.Mesh;
    if (missing === 'draw-morph') delete string.morphTargetDictionary!.Draw;
    else delivered.scene.getObjectByName('weapon_fists_L')!.removeFromParent();
    const disposed = vi.spyOn(delivered.geometry, 'dispose');
    load.mockResolvedValue(delivered);
    const { armory, right, left } = setup();
    armory.bind(right, left);
    await Promise.resolve();
    expect(armory.sync('bow', rest)).toBe(false);
    expect(disposed).toHaveBeenCalledOnce();
    expect(left.children).toHaveLength(0);
    armory.dispose();
    expect(disposed).toHaveBeenCalledOnce();
    warning.mockRestore();
  },
);

it('disposes late weapons after cleanup without attaching them or redrawing', async () => {
  const delivered = asset();
  let finish!: (value: ReturnType<typeof asset>) => void;
  load.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const disposed = vi.spyOn(delivered.geometry, 'dispose');
  const { armory, right, left, redraw } = setup();
  armory.bind(right, left);
  armory.dispose();
  finish(delivered);
  await Promise.resolve();
  expect(disposed).toHaveBeenCalledOnce();
  expect(right.children).toHaveLength(0);
  expect(left.children).toHaveLength(0);
  expect(redraw).not.toHaveBeenCalled();
  expect(armory.sync('sword', rest)).toBe(false);
});

it('moves both nocked arrow parts with Draw and restores their rest transforms without accumulation', async () => {
  const delivered = asset();
  const bow = delivered.scene.getObjectByName('weapon_bow')!;
  const shaft = new THREE.Object3D(),
    head = new THREE.Object3D();
  shaft.name = 'Bow_nocked_shaft';
  shaft.position.set(4, 3, 2);
  head.name = 'Bow_arrowhead';
  head.position.set(19, 5, 1);
  bow.add(shaft, head);
  load.mockResolvedValue(delivered);
  const { armory, right, left } = setup();
  armory.bind(right, left);
  await Promise.resolve();
  armory.sync('bow', rest);
  expect(shaft.position.toArray()).toEqual([4, 3, 2]);
  expect(head.position.toArray()).toEqual([19, 5, 1]);
  armory.sync('bow', { action: 'attack', stage: 'windup', phase: 0.225 });
  expect(shaft.position.toArray()).toEqual([-2.5, 3, 2]);
  expect(head.position.toArray()).toEqual([12.5, 5, 1]);
  for (let repeat = 0; repeat < 20; repeat++)
    armory.sync('bow', { action: 'attack', stage: 'windup', phase: 0.45 });
  expect(shaft.position.toArray()).toEqual([-9, 3, 2]);
  expect(head.position.toArray()).toEqual([6, 5, 1]);
  armory.sync('bow', { action: 'attack', stage: 'recovery', phase: 0.6 });
  expect(shaft.visible).toBe(false);
  expect(head.visible).toBe(false);
  expect(shaft.position.toArray()).toEqual([4, 3, 2]);
  expect(head.position.toArray()).toEqual([19, 5, 1]);
  armory.sync('bow', rest);
  expect(shaft.visible).toBe(true);
  expect(head.visible).toBe(true);
  expect(shaft.position.toArray()).toEqual([4, 3, 2]);
  expect(head.position.toArray()).toEqual([19, 5, 1]);
  armory.dispose();
});
