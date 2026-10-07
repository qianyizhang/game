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
describe('Abyssal Patron living assembly', () => {
  it('closes the head, coat, trousers, hands and lids with outward faces and valid skin weights', () => {
    const root = createStudy('patron');
    try {
      const names = [
        'Patron_FaceNeck',
        'Patron_CoatSleeves',
        'Patron_CoatTails',
        'Patron_HandSkin_1',
        'Patron_HandSkin_0',
        'Patron_Trousers',
        'Patron_Lapel_-1',
        'Patron_Lapel_1',
      ];
      for (const s of [-1, 1]) for (const l of [-1, 1]) names.push(`Patron_LidSkin_${s}_${l}`);
      for (const name of names) {
        const g = (root.getObjectByName(name) as T.Mesh).geometry;
        expect(openEdges(g), name).toBe(0);
        expect(volume(g), name).toBeGreaterThan(0);
        expect(Array.from(g.attributes.position.array).every(Number.isFinite), name).toBe(true);
        expect(components(g), name).toBe(1);
      }
      const mesh = root.getObjectByName('Patron_FaceNeck') as T.SkinnedMesh;
      const w = mesh.geometry.attributes.skinWeight,
        j = mesh.geometry.attributes.skinIndex;
      for (let i = 0; i < w.count; i++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          const n = w.getComponent(i, k);
          sum += n;
          expect(Number.isFinite(n) && n >= 0 && n <= 1).toBe(true);
          expect(j.getComponent(i, k)).toBeLessThan(3);
        }
        expect(sum).toBeCloseTo(1, 6);
      }
    } finally {
      disposeObject(root);
    }
  }, 15000);
  it('keeps boots, trousers, coat and both hands fixed throughout the loop', () => {
    const root = createStudy('patron'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      for (let i = 0; i < 2; i++)
        expect(
          new T.Box3().setFromObject(root.getObjectByName(`Patron_Boot_${i}`)!, true).min.y,
        ).toBeCloseTo(0.105, 6);
      const fixed: T.Object3D[] = [];
      root.traverse((o) => {
        if (/Patron_(Boot|Hand|Coat|Trousers|Lapel)/.test(o.name)) fixed.push(o);
      });
      expect(fixed.length).toBeGreaterThan(8);
      const matrices = fixed.map((o) => o.matrixWorld.clone());
      mixer.clipAction(createStudyClip(root, 'patron')).play();
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
  it('carries facial fittings and curled horns with the deforming head', () => {
    const root = createStudy('patron'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Patron_FaceNeck') as T.SkinnedMesh,
        p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight,
        j = body.geometry.attributes.skinIndex;
      const id = Array.from({ length: p.count }, (_, i) => i).find(
        (i) => j.getX(i) === 2 && w.getX(i) === 1,
      )!;
      expect(id).toBeDefined();
      const parts = [
        'Patron_SweptHorn_-1',
        'Patron_SweptHorn_1',
        'Patron_Eye_-1',
        'Patron_Eye_1',
        'Patron_Mouth',
        'Patron_Fang_-1',
        'Patron_Fang_1',
      ].map((n) => root.getObjectByName(n)!);
      const distance = parts.map((o) =>
        body.getVertexPosition(id, new T.Vector3()).distanceTo(o.getWorldPosition(new T.Vector3())),
      );
      const initial = parts[0].localToWorld(new T.Vector3(-0.425, 0.358, -0.052));
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'patron')).play();
      for (let f = 0; f <= 144; f++) {
        mixer.setTime(f / 24);
        root.updateMatrixWorld(true);
        parts.forEach((o, i) =>
          expect(
            body
              .getVertexPosition(id, new T.Vector3())
              .distanceTo(o.getWorldPosition(new T.Vector3())),
          ).toBeCloseTo(distance[i], 6),
        );
        travel = Math.max(
          travel,
          parts[0].localToWorld(new T.Vector3(-0.425, 0.358, -0.052)).distanceTo(initial),
        );
      }
      expect(travel).toBeGreaterThan(0.012);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
  it('keeps both eyes clear when open and closes real skin lids over them', () => {
    const root = createStudy('patron'),
      mixer = new T.AnimationMixer(root);
    try {
      const body = root.getObjectByName('Patron_FaceNeck') as T.SkinnedMesh;
      mixer.clipAction(createStudyClip(root, 'patron')).play();
      for (const time of [0, 0.75, 2.25, 3.9, 4.5]) {
        mixer.setTime(time);
        root.updateMatrixWorld(true);
        for (const s of [-1, 1]) {
          const eye = root.getObjectByName(`Patron_Eye_${s}`)!,
            globe = root.getObjectByName(`Patron_Eyeball_${s}`)!;
          const origin = eye.localToWorld(new T.Vector3(0, 0, 0.15)),
            direction = eye
              .localToWorld(new T.Vector3(0, 0, 0))
              .sub(origin)
              .normalize();
          const ray = new T.Raycaster(origin, direction, 0, 0.25),
            hit = ray.intersectObject(globe, false)[0];
          expect(hit).toBeDefined();
          const skinHit = ray.intersectObject(body, false)[0];
          expect(!skinHit || skinHit.distance > hit.distance).toBe(true);
          const lids = [-1, 1].map((l) => root.getObjectByName(`Patron_LidSkin_${s}_${l}`)!);
          const lidHit = ray.intersectObjects(lids, false)[0];
          if (time === 3.9) {
            expect(lidHit).toBeDefined();
            expect(lidHit.distance).toBeLessThan(hit.distance);
            for (const l of [-1, 1])
              expect(
                Math.abs(root.getObjectByName(`Patron_LidPivot_${s}_${l}`)!.rotation.x),
              ).toBeLessThan(1e-6);
          } else expect(!lidHit || lidHit.distance > hit.distance).toBe(true);
        }
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
  it('keeps the chest inside its opening and the lapels fitted over the coat', () => {
    const root = createStudy('patron');
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Patron_FaceNeck') as T.Mesh,
        coat = root.getObjectByName('Patron_CoatSleeves') as T.Mesh;
      for (const side of [-1, 1]) {
        const lapel = root.getObjectByName(`Patron_Lapel_${side}`) as T.Mesh,
          p = lapel.geometry.attributes.position;
        for (const t of [0.2, 0.5, 0.8]) {
          const y = 1.397 + t * 0.17,
            x = 0.073 + side * ((y - 1.38) * 0.72 + 0.038),
            ray = new T.Raycaster(new T.Vector3(x, y, 0.4), new T.Vector3(0, 0, -1), 0, 0.6);
          const clothHit = ray.intersectObject(coat, false)[0],
            trimHit = ray.intersectObject(lapel, false)[0],
            skinHit = ray.intersectObject(body, false)[0];
          expect(clothHit).toBeDefined();
          expect(trimHit).toBeDefined();
          expect(clothHit.distance - trimHit.distance).toBeGreaterThan(0);
          expect(clothHit.distance - trimHit.distance).toBeLessThan(0.014);
          expect(!skinHit || skinHit.distance > trimHit.distance).toBe(true);
        }
        expect(Math.min(...Array.from({ length: p.count }, (_, i) => p.getZ(i)))).toBeGreaterThan(
          -0.01,
        );
      }
    } finally {
      disposeObject(root);
    }
  }, 15000);
  it('keeps the fitted coat outside the thighs while preserving its open front', () => {
    const root = createStudy('patron');
    try {
      root.updateMatrixWorld(true);
      const coat = root.getObjectByName('Patron_CoatTails') as T.Mesh,
        pants = root.getObjectByName('Patron_Trousers') as T.Mesh;
      const cp = coat.geometry.attributes.position,
        half = cp.count / 2;
      for (let i = 0; i < half; i += 17) {
        const outer = Math.hypot(cp.getX(i) - 0.014, cp.getZ(i) + 0.025),
          inner = Math.hypot(cp.getX(i + half) - 0.014, cp.getZ(i + half) + 0.025);
        expect(outer - inner).toBeGreaterThan(0.01);
        expect(outer - inner).toBeLessThan(0.016);
      }
      let compared = 0;
      for (const y of [0.7, 0.8, 0.9])
        for (const a of [Math.PI / 3, Math.PI / 2, (Math.PI * 4) / 3, (Math.PI * 3) / 2]) {
          const ray = new T.Raycaster(
            new T.Vector3(0.014 + Math.sin(a) * 0.7, y, -0.025 + Math.cos(a) * 0.7),
            new T.Vector3(-Math.sin(a), 0, -Math.cos(a)),
            0,
            1.4,
          );
          const cloth = ray.intersectObject(coat, false)[0],
            leg = ray.intersectObject(pants, false)[0];
          expect(cloth).toBeDefined();
          if (leg) {
            compared++;
            expect(leg.distance - cloth.distance, `height ${y}, angle ${a}`).toBeGreaterThan(0.005);
          }
        }
      expect(compared).toBeGreaterThan(5);
      const splitRay = new T.Raycaster(
          new T.Vector3(0.03, 0.74, 0.6),
          new T.Vector3(0, 0, -1),
          0,
          1.2,
        ),
        splitHit = splitRay.intersectObject(coat, false)[0];
      expect(splitHit).toBeDefined();
      expect(splitHit.point.z).toBeLessThan(-0.1);
    } finally {
      disposeObject(root);
    }
  }, 15000);
});
