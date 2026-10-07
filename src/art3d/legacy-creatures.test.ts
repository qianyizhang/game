import { isMesh, isSkinnedMesh } from './objects';
import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createStudy, disposeObject } from './models';
import { createStudyClip } from './animation';

function openEdges(g: T.BufferGeometry) {
  const p = g.attributes.position,
    index = g.index!.array;
  const keys = new Map<string, number>(),
    welded: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const key = [p.getX(i), p.getY(i), p.getZ(i)].map((v) => Math.round(v * 1e6)).join(',');
    if (!keys.has(key)) keys.set(key, keys.size);
    welded.push(keys.get(key)!);
  }
  const edges = new Map<string, number>();
  for (let i = 0; i < index.length; i += 3) {
    const triangle = Array.from(index.slice(i, i + 3), (v) => welded[v]);
    if (new Set(triangle).size < 3) continue;
    for (let j = 0; j < 3; j++) {
      const a = triangle[j],
        b = triangle[(j + 1) % 3],
        key = a < b ? `${a}:${b}` : `${b}:${a}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  return [...edges.values()].filter((count) => count !== 2).length;
}

function volume(g: T.BufferGeometry) {
  const p = g.attributes.position,
    idx = g.index!,
    a = new T.Vector3(),
    b = new T.Vector3(),
    c = new T.Vector3();
  let result = 0;
  for (let i = 0; i < idx.count; i += 3) {
    a.fromBufferAttribute(p, idx.getX(i));
    b.fromBufferAttribute(p, idx.getX(i + 1));
    c.fromBufferAttribute(p, idx.getX(i + 2));
    result += a.dot(b.cross(c)) / 6;
  }
  return result;
}
// Compatibility fixtures for the legacy procedural gallery. New authoring checks belong
// to the DCC package; these named surfaces preserve existing closure regressions.
function checkConstruction(root: T.Group, names: string[]) {
  for (const name of names) {
    const mesh = root.getObjectByName(name) as T.Mesh;
    expect(openEdges(mesh.geometry), name).toBe(0);
    expect(volume(mesh.geometry), name).toBeGreaterThan(0);
    expect(Array.from(mesh.geometry.attributes.position.array).every(Number.isFinite), name).toBe(
      true,
    );
  }
  let skins = 0;
  root.traverse((node) => {
    if (!isSkinnedMesh(node)) return;
    skins++;
    const weights = node.geometry.attributes.skinWeight;
    const joints = node.geometry.attributes.skinIndex;
    let invalid = 0;
    for (let vertex = 0; vertex < weights.count; vertex++) {
      let sum = 0;
      for (let slot = 0; slot < 4; slot++) {
        const weight = weights.getComponent(vertex, slot);
        const joint = joints.getComponent(vertex, slot);
        if (
          !Number.isFinite(weight) ||
          weight < 0 ||
          weight > 1 ||
          !Number.isInteger(joint) ||
          joint < 0 ||
          joint >= node.skeleton.bones.length
        )
          invalid++;
        sum += weight;
      }
      if (Math.abs(sum - 1) > 1e-6) invalid++;
    }
    expect(invalid, node.name).toBe(0);
  });
  expect(skins).toBeGreaterThan(0);
}

describe('Legacy Cub delivery prerequisites', () => {
  it('preserves closed outward surfaces and valid deformation weights', () => {
    const root = createStudy('cub');
    try {
      checkConstruction(root, [
        'Cub_ContinuousAnatomy',
        'Cub_RoundedPinna_-1',
        'Cub_RoundedPinna_1',
      ]);
    } finally {
      disposeObject(root);
    }
  });
  it('keeps four soles and their claws fixed through the loop', () => {
    const root = createStudy('cub'),
      mixer = new T.AnimationMixer(root);
    root.updateMatrixWorld(true);
    try {
      const skin = root.getObjectByName('Cub_ContinuousAnatomy') as T.SkinnedMesh,
        p = skin.geometry.attributes.position;
      const paws = [
        [-0.72, 0.172, 0.35],
        [-0.46, 0.172, -0.2],
        [0.28, 0.172, 0.34],
        [0.48, 0.172, -0.25],
      ];
      const sampleGroups = paws.map(([x, y, z]) =>
        Array.from({ length: p.count }, (_, i) => i).filter(
          (i) =>
            Math.abs(p.getX(i) - x) < 0.17 &&
            Math.abs(p.getY(i) - y) < 0.09 &&
            Math.abs(p.getZ(i) - z) < 0.09,
        ),
      );
      sampleGroups.forEach((ids) => {
        expect(ids.length).toBeGreaterThan(0);
        const min = Math.min(...ids.map((i) => p.getY(i)));
        expect(Math.abs(min - 0.105)).toBeLessThan(0.005);
      });
      const selected = sampleGroups.flatMap((ids) => ids.filter((_, i) => i % 9 === 0)),
        before = selected.map((i) => skin.getVertexPosition(i, new T.Vector3()));
      const claws: T.Mesh[] = [];
      root.traverse((o) => {
        if (isMesh(o) && o.name.startsWith('Cub_Claw_')) claws.push(o);
      });
      expect(claws.length).toBeGreaterThan(0);
      const matrices = claws.map((o) => o.matrixWorld.clone());
      mixer.clipAction(createStudyClip(root, 'cub')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        selected.forEach((i, j) =>
          expect(skin.getVertexPosition(i, new T.Vector3()).distanceTo(before[j])).toBeLessThan(
            1e-7,
          ),
        );
        claws.forEach((o, i) => expect(o.matrixWorld.elements).toEqual(matrices[i].elements));
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
  it('keeps the short muzzle fitted to the turning skull through the scenting loop', () => {
    const root = createStudy('cub'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Cub_ContinuousAnatomy') as T.SkinnedMesh;
      const p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight;
      const vertex = Array.from({ length: p.count }, (_, i) => i).find((i) => w.getZ(i) === 1)!;
      expect(vertex).toBeDefined();
      const names = ['Cub_LeatherNose', 'Cub_Eye_-1', 'Cub_Eye_1', 'Cub_Ear_-1', 'Cub_Ear_1'];
      const objects = names.map((n) => root.getObjectByName(n)!);
      const distances = objects.map((o) =>
        body
          .getVertexPosition(vertex, new T.Vector3())
          .distanceTo(o.getWorldPosition(new T.Vector3())),
      );
      const start = objects[0].getWorldPosition(new T.Vector3());
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'cub')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        objects.forEach((o, i) =>
          expect(
            body
              .getVertexPosition(vertex, new T.Vector3())
              .distanceTo(o.getWorldPosition(new T.Vector3())),
          ).toBeCloseTo(distances[i], 6),
        );
        travel = Math.max(travel, objects[0].getWorldPosition(new T.Vector3()).distanceTo(start));
      }
      expect(travel).toBeGreaterThan(0.015);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});

describe('Legacy Stray delivery prerequisites', () => {
  it('preserves closed outward surfaces and valid deformation weights', () => {
    const root = createStudy('stray');
    try {
      checkConstruction(root, [
        'Stray_ContinuousAnatomy',
        'Stray_BrushTail',
        'Stray_CuppedEar_-1',
        'Stray_CuppedEar_1',
      ]);
    } finally {
      disposeObject(root);
    }
  });
  it('keeps three soles, a raised forepaw and their claws fixed through the loop', () => {
    const root = createStudy('stray'),
      mixer = new T.AnimationMixer(root);
    root.updateMatrixWorld(true);
    try {
      const skin = root.getObjectByName('Stray_ContinuousAnatomy') as T.SkinnedMesh,
        p = skin.geometry.attributes.position;
      const paws = [
        [-0.6, 0.375, 0.325],
        [-0.49, 0.16, -0.25],
        [0.53, 0.16, 0.26],
        [0.68, 0.16, -0.25],
      ];
      const sampleGroups = paws.map(([x, y, z]) =>
        Array.from({ length: p.count }, (_, i) => i).filter(
          (i) =>
            Math.abs(p.getX(i) - x) < 0.17 &&
            Math.abs(p.getY(i) - y) < 0.09 &&
            Math.abs(p.getZ(i) - z) < 0.09,
        ),
      );
      sampleGroups.forEach((ids, foot) => {
        expect(ids.length).toBeGreaterThan(0);
        const min = Math.min(...ids.map((i) => p.getY(i)));
        if (foot === 0) expect(min).toBeGreaterThan(0.25);
        else expect(Math.abs(min - 0.105)).toBeLessThan(0.005);
      });
      const selected = sampleGroups.flatMap((ids) => ids.filter((_, i) => i % 9 === 0)),
        before = selected.map((i) => skin.getVertexPosition(i, new T.Vector3()));
      const claws: T.Mesh[] = [];
      root.traverse((o) => {
        if (isMesh(o) && o.name.startsWith('Stray_Claw_')) claws.push(o);
      });
      expect(claws.length).toBeGreaterThan(0);
      const matrices = claws.map((o) => o.matrixWorld.clone());
      mixer.clipAction(createStudyClip(root, 'stray')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        selected.forEach((i, j) =>
          expect(skin.getVertexPosition(i, new T.Vector3()).distanceTo(before[j])).toBeLessThan(
            1e-7,
          ),
        );
        claws.forEach((o, i) => expect(o.matrixWorld.elements).toEqual(matrices[i].elements));
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
  it('carries the face with the skull while the tail root stays anchored and the tip sweeps above the floor', () => {
    const root = createStudy('stray'),
      mixer = new T.AnimationMixer(root);
    root.updateMatrixWorld(true);
    try {
      const body = root.getObjectByName('Stray_ContinuousAnatomy') as T.SkinnedMesh,
        tail = root.getObjectByName('Stray_BrushTail') as T.SkinnedMesh;
      const p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight,
        nose = root.getObjectByName('Stray_Nose')!;
      let vertex = -1;
      for (let i = 0; i < p.count; i++)
        if (w.getZ(i) === 1) {
          vertex = i;
          break;
        }
      expect(vertex).toBeGreaterThanOrEqual(0);
      const distance = body
        .getVertexPosition(vertex, new T.Vector3())
        .distanceTo(nose.getWorldPosition(new T.Vector3()));
      const cap = tail.geometry.attributes.position.count - 2,
        tip = cap + 1,
        base = tail.getVertexPosition(cap, new T.Vector3()),
        end = tail.getVertexPosition(tip, new T.Vector3()),
        nose0 = nose.getWorldPosition(new T.Vector3());
      let tailTravel = 0,
        headTravel = 0;
      mixer.clipAction(createStudyClip(root, 'stray')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        const endNow = tail.getVertexPosition(tip, new T.Vector3());
        expect(tail.getVertexPosition(cap, new T.Vector3()).distanceTo(base)).toBeLessThan(1e-7);
        expect(endNow.y).toBeCloseTo(end.y, 7);
        expect(endNow.y).toBeGreaterThan(0.105);
        expect(
          body
            .getVertexPosition(vertex, new T.Vector3())
            .distanceTo(nose.getWorldPosition(new T.Vector3())),
        ).toBeCloseTo(distance, 6);
        tailTravel = Math.max(tailTravel, endNow.distanceTo(end));
        headTravel = Math.max(headTravel, nose.getWorldPosition(new T.Vector3()).distanceTo(nose0));
      }
      expect(tailTravel).toBeGreaterThan(0.035);
      expect(headTravel).toBeGreaterThan(0.025);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});
