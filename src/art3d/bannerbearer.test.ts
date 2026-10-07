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
describe('Banner Bearer living assembly', () => {
  it('closes skin, hair, garments, hands and cloth with outward faces and valid weights', () => {
    const root = createStudy('bannerbearer');
    try {
      for (const name of [
        'BannerBearer_FaceNeck',
        'BannerBearer_Hair',
        'BannerBearer_TunicSleeves',
        'BannerBearer_TunicSkirt',
        'BannerBearer_Trousers',
        'BannerBearer_HandSkin_0',
        'BannerBearer_HandSkin_1',
        'BannerBearer_BannerCloth',
        'BannerBearer_PoleFerrule',
        ...[-1, 1].flatMap((s) => [-1, 1].map((l) => `BannerBearer_LidSkin_${s}_${l}`)),
      ]) {
        const mesh = root.getObjectByName(name) as T.Mesh;
        expect(mesh, name).toBeDefined();
        expect(openEdges(mesh.geometry), name).toBe(0);
        expect(components(mesh.geometry), name).toBe(1);
        expect(volume(mesh.geometry), name).toBeGreaterThan(0);
      }
      const skins: T.SkinnedMesh[] = [];
      root.traverse((o) => {
        if (o instanceof T.SkinnedMesh) skins.push(o);
      });
      expect(skins).toHaveLength(2);
      for (const mesh of skins) {
        const w = mesh.geometry.attributes.skinWeight,
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
      }
    } finally {
      disposeObject(root);
    }
  }, 15000);
  it('anchors the planted pole, boots and both hands throughout the loop', () => {
    const root = createStudy('bannerbearer'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      for (const name of ['BannerBearer_Boot_0', 'BannerBearer_Boot_1', 'BannerBearer_PoleFerrule'])
        expect(
          new T.Box3().setFromObject(root.getObjectByName(name)!, true).min.y,
          name,
        ).toBeCloseTo(0.105, 6);
      const fixed: T.Object3D[] = [];
      root.traverse((o) => {
        if (
          /BannerBearer_(Boot|Pole|Hand|Grip|Tunic|Trousers|Lapel|Belt|Pauldron|BannerTie)/.test(
            o.name,
          )
        )
          fixed.push(o);
      });
      expect(fixed.length).toBeGreaterThan(15);
      const matrices = fixed.map((o) => o.matrixWorld.clone());
      mixer.clipAction(createStudyClip(root, 'bannerbearer')).play();
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
  it('carries hair, eyes and mouth with the weighted skull during the listening turn', () => {
    const root = createStudy('bannerbearer'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('BannerBearer_FaceNeck') as T.SkinnedMesh,
        p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight,
        j = body.geometry.attributes.skinIndex,
        id = Array.from({ length: p.count }, (_, i) => i).find(
          (i) => j.getX(i) === 2 && w.getX(i) === 1,
        )!;
      expect(id).toBeDefined();
      const parts = [
        'BannerBearer_Hair',
        'BannerBearer_Eye_-1',
        'BannerBearer_Eye_1',
        'BannerBearer_Mouth',
      ].map((n) => root.getObjectByName(n)!);
      const d = parts.map((o) =>
          body
            .getVertexPosition(id, new T.Vector3())
            .distanceTo(o.getWorldPosition(new T.Vector3())),
        ),
        initial = parts[3].localToWorld(new T.Vector3(0.06, -0.133, 0.13));
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'bannerbearer')).play();
      for (let f = 0; f <= 144; f++) {
        mixer.setTime(f / 24);
        root.updateMatrixWorld(true);
        parts.forEach((o, i) =>
          expect(
            body
              .getVertexPosition(id, new T.Vector3())
              .distanceTo(o.getWorldPosition(new T.Vector3())),
          ).toBeCloseTo(d[i], 6),
        );
        travel = Math.max(
          travel,
          parts[3].localToWorld(new T.Vector3(0.06, -0.133, 0.13)).distanceTo(initial),
        );
      }
      expect(travel).toBeGreaterThan(0.01);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
  it('keeps eyes clear of the face and closes skin eyelids in front of the globes', () => {
    const root = createStudy('bannerbearer'),
      mixer = new T.AnimationMixer(root);
    try {
      mixer.clipAction(createStudyClip(root, 'bannerbearer')).play();
      const body = root.getObjectByName('BannerBearer_FaceNeck')!;
      for (const time of [0, 0.75, 2.25, 3.85, 4.5]) {
        mixer.setTime(time);
        root.updateMatrixWorld(true);
        for (const side of [-1, 1]) {
          const eye = root.getObjectByName(`BannerBearer_Eye_${side}`)!,
            globe = root.getObjectByName(`BannerBearer_Eyeball_${side}`)!,
            origin = eye.localToWorld(new T.Vector3(0, 0, 0.2)),
            direction = eye.localToWorld(new T.Vector3()).sub(origin).normalize(),
            ray = new T.Raycaster(origin, direction, 0, 0.3),
            hit = ray.intersectObject(globe, false)[0],
            face = ray.intersectObject(body, false)[0];
          expect(hit).toBeDefined();
          expect(!face || face.distance > hit.distance).toBe(true);
          const lids = [-1, 1].map((l) =>
              root.getObjectByName(`BannerBearer_LidSkin_${side}_${l}`)!,
            ),
            lid = ray.intersectObjects(lids, false)[0];
          if (time === 3.85) {
            expect(lid).toBeDefined();
            expect(lid.distance).toBeLessThan(hit.distance);
          } else expect(!lid || lid.distance > hit.distance).toBe(true);
        }
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
  it('wraps each hand around the actual pole at its own height', () => {
    const root = createStudy('bannerbearer');
    try {
      root.updateMatrixWorld(true);
      const pole = root.getObjectByName('BannerBearer_PoleShaft')!;
      for (let i = 0; i < 2; i++) {
        const grip = root.getObjectByName(`BannerBearer_Grip_${i}`)!,
          hand = root.getObjectByName(`BannerBearer_HandSkin_${i}`)!;
        for (const y of [-0.043, -0.015, 0.013, 0.041])
          for (const a of [-Math.PI / 2 + 0.031, 0.031, Math.PI / 2 + 0.031, Math.PI + 0.031]) {
            const origin = grip.localToWorld(
                new T.Vector3(Math.sin(a) * 0.12, y, Math.cos(a) * 0.12),
              ),
              direction = grip
                .localToWorld(new T.Vector3(0, y, 0))
                .sub(origin)
                .normalize(),
              ray = new T.Raycaster(origin, direction, 0, 0.24),
              poleHit = ray.intersectObject(pole, false)[0],
              skin = ray.intersectObject(hand, false)[0];
            expect(poleHit).toBeDefined();
            expect(skin).toBeDefined();
            expect(skin.distance, `hand ${i} y ${y} angle ${a}`).toBeLessThan(poleHit.distance);
            expect(poleHit.distance - skin.distance).toBeLessThan(0.065);
          }
      }
    } finally {
      disposeObject(root);
    }
  }, 15000);
  it('pins the banner to its pole while the closed cloth free edge moves', () => {
    const root = createStudy('bannerbearer'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const cloth = root.getObjectByName('BannerBearer_BannerCloth') as T.SkinnedMesh,
        p = cloth.geometry.attributes.position,
        uv = cloth.geometry.attributes.uv,
        pinned: number[] = [],
        free: number[] = [];
      for (let i = 0; i < p.count; i++) {
        if (uv.getX(i) === 0) pinned.push(i);
        if (uv.getX(i) === 1) free.push(i);
      }
      expect(pinned.length).toBeGreaterThan(50);
      expect(free.length).toBeGreaterThan(50);
      const world = (i: number) => cloth.localToWorld(cloth.getVertexPosition(i, new T.Vector3()));
      const rest = pinned.map(world),
        start = free.map(world);
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'bannerbearer')).play();
      for (let f = 0; f <= 144; f++) {
        mixer.setTime(f / 24);
        root.updateMatrixWorld(true);
        pinned.forEach((id, i) => expect(world(id).distanceTo(rest[i])).toBeLessThan(1e-7));
        free.forEach((id, i) => (travel = Math.max(travel, world(id).distanceTo(start[i]))));
      }
      expect(travel).toBeGreaterThan(0.008);
      expect(travel).toBeLessThan(0.085);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
});
