import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createStudy } from './factory';
import { disposeObject } from '../../shared/three/resources';
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
function components(g: T.BufferGeometry) {
  const p = g.attributes.position,
    ids = new Map<string, number>(),
    welded: number[] = [],
    parent: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const key = [p.getX(i), p.getY(i), p.getZ(i)].map((n) => Math.round(n * 1e6)).join(',');
    if (!ids.has(key)) {
      ids.set(key, ids.size);
      parent.push(parent.length);
    }
    welded.push(ids.get(key)!);
  }
  const find = (n: number): number => {
    while (parent[n] !== n) {
      parent[n] = parent[parent[n]];
      n = parent[n];
    }
    return n;
  };
  const used = new Set<number>();
  for (let i = 0; i < g.index!.count; i += 3) {
    const [a, b, c] = [0, 1, 2].map((k) => welded[g.index!.getX(i + k)]);
    if (new Set([a, b, c]).size < 3) continue;
    used.add(a);
    used.add(b);
    used.add(c);
    parent[find(a)] = find(b);
    parent[find(c)] = find(b);
  }
  return new Set([...used].map(find)).size;
}
describe('Hearth Squire living assembly', () => {
  it('uses connected outward closed skin, cloth, armor and glove solids with normalized weights', () => {
    const root = createStudy('squire');
    try {
      const names = [
        'Squire_FaceNeck',
        'Squire_TunicSleeves',
        'Squire_TunicSkirt',
        'Squire_Trousers',
        'Squire_HelmetDome',
        'Squire_Visor',
        'Squire_Pauldron_-1',
        'Squire_Pauldron_1',
        'Squire_Glove_0',
        'Squire_Glove_1',
        'Squire_Belt',
        'Squire_ShieldBoard',
        ...[-1, 1].flatMap((s) => [-1, 1].map((l) => `Squire_LidSkin_${s}_${l}`)),
      ];
      for (const name of names) {
        const mesh = root.getObjectByName(name) as T.Mesh;
        expect(mesh, name).toBeDefined();
        expect(openEdges(mesh.geometry), name).toBe(0);
        expect(components(mesh.geometry), name).toBe(1);
        expect(volume(mesh.geometry), name).toBeGreaterThan(0);
      }
      const mesh = root.getObjectByName('Squire_FaceNeck') as T.SkinnedMesh,
        w = mesh.geometry.attributes.skinWeight,
        j = mesh.geometry.attributes.skinIndex;
      for (let i = 0; i < w.count; i++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          const n = w.getComponent(i, k);
          expect(Number.isFinite(n) && n >= 0 && n <= 1).toBe(true);
          sum += n;
          expect(j.getComponent(i, k)).toBeLessThan(3);
        }
        expect(sum).toBeCloseTo(1, 6);
      }
    } finally {
      disposeObject(root);
    }
  }, 15000);
  it('grounds both boots and anchors shield, sword, hands and clothing through the full loop', () => {
    const root = createStudy('squire'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      for (let i = 0; i < 2; i++)
        expect(
          new T.Box3().setFromObject(root.getObjectByName(`Squire_Boot_${i}`)!, true).min.y,
        ).toBeCloseTo(0.105, 6);
      const fixed: T.Object3D[] = [];
      root.traverse((o) => {
        if (
          /Squire_(Boot|Shield|Sword|Scabbard|Grip|Glove|Tunic|Trousers|Belt|Pauldron)/.test(o.name)
        )
          fixed.push(o);
      });
      expect(fixed.length).toBeGreaterThan(15);
      const matrices = fixed.map((o) => o.matrixWorld.clone());
      mixer.clipAction(createStudyClip(root, 'squire')).play();
      for (let f = 0; f <= 144; f++) {
        mixer.setTime(f / 24);
        root.updateMatrixWorld(true);
        fixed.forEach((o, i) => expect(o.matrixWorld.elements).toEqual(matrices[i].elements));
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
  it('carries helmet and visor with the fully weighted skull through the head turn', () => {
    const root = createStudy('squire'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Squire_FaceNeck') as T.SkinnedMesh,
        p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight,
        j = body.geometry.attributes.skinIndex;
      const id = Array.from({ length: p.count }, (_, i) => i).find(
        (i) => j.getX(i) === 2 && w.getX(i) === 1,
      )!;
      expect(id).toBeDefined();
      const parts = ['Squire_HelmetDome', 'Squire_Visor', 'Squire_VisorPin_-1', 'Squire_Eye_1'].map(
        (n) => root.getObjectByName(n)!,
      );
      const distances = parts.map((o) =>
        body.getVertexPosition(id, new T.Vector3()).distanceTo(o.getWorldPosition(new T.Vector3())),
      );
      const initial = parts[1].localToWorld(new T.Vector3(0, -0.08, 0.23));
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'squire')).play();
      for (let f = 0; f <= 144; f++) {
        mixer.setTime(f / 24);
        root.updateMatrixWorld(true);
        parts.forEach((o, i) =>
          expect(
            body
              .getVertexPosition(id, new T.Vector3())
              .distanceTo(o.getWorldPosition(new T.Vector3())),
          ).toBeCloseTo(distances[i], 6),
        );
        travel = Math.max(
          travel,
          parts[1].localToWorld(new T.Vector3(0, -0.08, 0.23)).distanceTo(initial),
        );
      }
      expect(travel).toBeGreaterThan(0.014);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
  it('keeps a real visor opening in front of both eyes and closes fitted lids behind it', () => {
    const root = createStudy('squire'),
      mixer = new T.AnimationMixer(root);
    try {
      mixer.clipAction(createStudyClip(root, 'squire')).play();
      const armor = ['Squire_HelmetDome', 'Squire_Visor'].map((n) => root.getObjectByName(n)!);
      for (const time of [0, 0.75, 2.25, 3.8, 4.5]) {
        mixer.setTime(time);
        root.updateMatrixWorld(true);
        for (const s of [-1, 1]) {
          const eye = root.getObjectByName(`Squire_Eye_${s}`)!,
            globe = root.getObjectByName(`Squire_Eyeball_${s}`)!,
            origin = eye.localToWorld(new T.Vector3(0, 0, 0.22)),
            direction = eye.localToWorld(new T.Vector3()).sub(origin).normalize(),
            ray = new T.Raycaster(origin, direction, 0, 0.35),
            hit = ray.intersectObject(globe, false)[0];
          expect(hit).toBeDefined();
          const plate = ray.intersectObjects(armor, false)[0];
          expect(!plate || plate.distance > hit.distance).toBe(true);
          const lids = [-1, 1].map((l) => root.getObjectByName(`Squire_LidSkin_${s}_${l}`)!),
            lidHit = ray.intersectObjects(lids, false)[0];
          if (time === 3.8) {
            expect(lidHit).toBeDefined();
            expect(lidHit.distance).toBeLessThan(hit.distance);
          } else expect(!lidHit || lidHit.distance > hit.distance).toBe(true);
        }
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
  it('wraps both grips around their actual handles instead of floating beside them', () => {
    const root = createStudy('squire');
    try {
      root.updateMatrixWorld(true);
      for (let i = 0; i < 2; i++) {
        const grip = root.getObjectByName(`Squire_Grip_${i}`)!,
          glove = root.getObjectByName(`Squire_Glove_${i}`)!,
          handle = root.getObjectByName(i === 0 ? 'Squire_ShieldHandle' : 'Squire_SwordHandle')!;
        for (const y of [-0.043, -0.015, 0.013, 0.041])
          // Offset the sample directions from the loft's duplicated longitudinal seam.
          for (const a of [-Math.PI / 2 + 0.031, 0.031, Math.PI / 2 + 0.031, Math.PI + 0.031]) {
            const origin = grip.localToWorld(
                new T.Vector3(Math.sin(a) * 0.12, y, Math.cos(a) * 0.12),
              ),
              center = grip.localToWorld(new T.Vector3(0, y, 0)),
              ray = new T.Raycaster(origin, center.sub(origin).normalize(), 0, 0.24),
              handHit = ray.intersectObject(glove, false)[0],
              shaftHit = ray.intersectObject(handle, false)[0];
            expect(shaftHit, `shaft ${i}, y ${y}, angle ${a}`).toBeDefined();
            expect(handHit).toBeDefined();
            expect(handHit.distance, `grip ${i}, y ${y}, angle ${a}`).toBeLessThan(
              shaftHit.distance,
            );
            expect(shaftHit.distance - handHit.distance).toBeLessThan(0.065);
          }
      }
    } finally {
      disposeObject(root);
    }
  }, 15000);
  it('fits the shoulder plates over the sleeves without spanning the chest', () => {
    const root = createStudy('squire');
    try {
      root.updateMatrixWorld(true);
      const coat = root.getObjectByName('Squire_TunicSleeves')!,
        plates = [-1, 1].map((s) => root.getObjectByName(`Squire_Pauldron_${s}`)!);
      const center = new T.Raycaster(new T.Vector3(0, 1.43, 0.5), new T.Vector3(0, 0, -1), 0, 1);
      expect(center.intersectObjects(plates, false)).toHaveLength(0);
      for (let i = 0; i < 2; i++) {
        const ray = new T.Raycaster(
            new T.Vector3(i === 0 ? -0.25 : 0.29, 1.8, 0),
            new T.Vector3(0, -1, 0),
            0,
            0.6,
          ),
          armor = ray.intersectObject(plates[i], false)[0],
          sleeve = ray.intersectObject(coat, false)[0];
        expect(armor).toBeDefined();
        expect(sleeve).toBeDefined();
        expect(sleeve.distance - armor.distance).toBeGreaterThan(0.001);
        expect(sleeve.distance - armor.distance).toBeLessThan(0.055);
      }
    } finally {
      disposeObject(root);
    }
  }, 15000);
});
