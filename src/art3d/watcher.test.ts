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
describe('Pit Watcher living assembly', () => {
  it('closes its body, palms and fitted garments with valid skin weights', () => {
    const root = createStudy('watcher');
    try {
      const names = [
        'Watcher_ContinuousAnatomy',
        'Watcher_HandSkin_0',
        'Watcher_HandSkin_1',
        'Watcher_LeatherJerkin',
        'Watcher_HipWrap',
        'Watcher_UpperLidSkin',
        'Watcher_LowerLidSkin',
      ];
      for (const name of names) {
        const g = (root.getObjectByName(name) as T.Mesh).geometry;
        expect(openEdges(g), name).toBe(0);
        expect(volume(g), name).toBeGreaterThan(0);
        expect(Array.from(g.attributes.position.array).every(Number.isFinite), name).toBe(true);
      }
      expect(
        components((root.getObjectByName('Watcher_ContinuousAnatomy') as T.Mesh).geometry),
      ).toBe(1);
      let count = 0;
      root.traverse((o) => {
        if (!(o instanceof T.SkinnedMesh)) return;
        count++;
        const w = o.geometry.attributes.skinWeight,
          j = o.geometry.attributes.skinIndex;
        let bad = 0;
        for (let i = 0; i < w.count; i++) {
          let sum = 0;
          for (let c = 0; c < 4; c++) {
            const value = w.getComponent(i, c);
            sum += value;
            if (
              !Number.isFinite(value) ||
              value < 0 ||
              value > 1 ||
              j.getComponent(i, c) >= o.skeleton.bones.length
            )
              bad++;
          }
          if (Math.abs(sum - 1) > 1e-6) bad++;
        }
        expect(bad, o.name).toBe(0);
      });
      expect(count).toBe(2);
    } finally {
      disposeObject(root);
    }
  }, 15000);
  it('keeps its planted feet, hands and wrap stationary throughout the loop', () => {
    const root = createStudy('watcher'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Watcher_ContinuousAnatomy') as T.SkinnedMesh,
        p = body.geometry.attributes.position;
      const feet = [
        [-0.255, 0.16, 0.265],
        [0.22, 0.16, -0.04],
      ];
      const groups = feet.map(([x, y, z]) =>
        Array.from({ length: p.count }, (_, i) => i).filter(
          (i) =>
            Math.abs(p.getX(i) - x) < 0.1 &&
            Math.abs(p.getY(i) - y) < 0.063 &&
            Math.abs(p.getZ(i) - z) < 0.14,
        ),
      );
      for (const ids of groups) {
        expect(ids.length).toBeGreaterThan(20);
        expect(Math.min(...ids.map((i) => p.getY(i)))).toBeCloseTo(0.105, 6);
      }
      const selected = groups.flat().filter((_, i) => i % 11 === 0),
        before = selected.map((i) => body.getVertexPosition(i, new T.Vector3()));
      const fixed: T.Mesh[] = [];
      root.traverse((o) => {
        if (o instanceof T.Mesh && /^Watcher_(HandSkin|HandClaw|ToeClaw)_/.test(o.name))
          fixed.push(o);
      });
      expect(fixed).toHaveLength(16);
      const matrices = fixed.map((o) => o.matrixWorld.clone());
      mixer.clipAction(createStudyClip(root, 'watcher')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        selected.forEach((i, j) =>
          expect(body.getVertexPosition(i, new T.Vector3()).distanceTo(before[j])).toBeLessThan(
            1e-7,
          ),
        );
        fixed.forEach((o, i) => expect(o.matrixWorld.elements).toEqual(matrices[i].elements));
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
  it('carries horns, the eye socket and mouth with the deforming head', () => {
    const root = createStudy('watcher'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Watcher_ContinuousAnatomy') as T.SkinnedMesh;
      const p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight,
        j = body.geometry.attributes.skinIndex;
      const vertex = Array.from({ length: p.count }, (_, i) => i).find(
        (i) => j.getX(i) === 2 && w.getX(i) === 1,
      )!;
      expect(vertex).toBeDefined();
      const objects = ['Watcher_Horn_-1', 'Watcher_Horn_1', 'Watcher_Eye', 'Watcher_Mouth'].map(
        (n) => root.getObjectByName(n)!,
      );
      const distance = objects.map((o) =>
        body
          .getVertexPosition(vertex, new T.Vector3())
          .distanceTo(o.getWorldPosition(new T.Vector3())),
      );
      const tip = () => objects[0].localToWorld(new T.Vector3(-0.385, 0.34, -0.063)),
        initial = tip();
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'watcher')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        objects.forEach((o, i) =>
          expect(
            body
              .getVertexPosition(vertex, new T.Vector3())
              .distanceTo(o.getWorldPosition(new T.Vector3())),
          ).toBeCloseTo(distance[i], 6),
        );
        travel = Math.max(travel, tip().distanceTo(initial));
      }
      expect(travel).toBeGreaterThan(0.015);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
  it('fits both closed palm roots inside their stationary forearms', () => {
    const root = createStudy('watcher'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Watcher_ContinuousAnatomy') as T.SkinnedMesh,
        p = body.geometry.attributes.position;
      const nearest = (point: T.Vector3) => {
        let index = 0,
          gap = Infinity;
        for (let i = 0; i < p.count; i++) {
          const d = body.getVertexPosition(i, new T.Vector3()).distanceTo(point);
          if (d < gap) {
            gap = d;
            index = i;
          }
        }
        return { index, gap };
      };
      const fittings: { mesh: T.Mesh; vertex: number; index: number; gap: number }[] = [];
      for (let h = 0; h < 2; h++) {
        const mesh = root.getObjectByName(`Watcher_HandSkin_${h}`) as T.Mesh,
          hp = mesh.geometry.attributes.position;
        const ids = Array.from({ length: hp.count }, (_, i) => i)
          .filter((i) => hp.getY(i) > 0.085 && hp.getY(i) < 0.094)
          .filter((_, i) => i % 41 === 0);
        expect(ids.length).toBeGreaterThan(3);
        for (const vertex of ids) {
          const match = nearest(
            mesh.getVertexPosition(vertex, new T.Vector3()).applyMatrix4(mesh.matrixWorld),
          );
          expect(match.gap, mesh.name).toBeLessThan(0.024);
          fittings.push({ mesh, vertex, ...match });
        }
      }
      mixer.clipAction(createStudyClip(root, 'watcher')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        for (const f of fittings) {
          const gap = f.mesh
            .getVertexPosition(f.vertex, new T.Vector3())
            .applyMatrix4(f.mesh.matrixWorld)
            .distanceTo(body.getVertexPosition(f.index, new T.Vector3()));
          expect(Math.abs(gap - f.gap), f.mesh.name).toBeLessThan(0.002);
        }
      }
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
  it('keeps the single iris inside its socket while scanning and blinking', () => {
    const root = createStudy('watcher'),
      mixer = new T.AnimationMixer(root);
    try {
      const eye = root.getObjectByName('Watcher_Eye')!,
        iris = root.getObjectByName('Watcher_IrisFrame')!,
        visible = root.getObjectByName('Watcher_VisibleEye')!;
      const x: number[] = [];
      mixer.clipAction(createStudyClip(root, 'watcher')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        const p = eye.worldToLocal(iris.getWorldPosition(new T.Vector3()));
        expect(Math.abs(p.x) + 0.061).toBeLessThan(0.185);
        expect(Math.abs(p.y) + 0.06 * visible.scale.y).toBeLessThan(0.067);
        expect(p.z).toBeCloseTo(0, 6);
        if (visible.scale.y > 0.5 && frame % 12 === 0) {
          const body = root.getObjectByName('Watcher_ContinuousAnatomy')!;
          const origin = eye.localToWorld(new T.Vector3(p.x, 0, 1));
          const direction = eye
            .localToWorld(new T.Vector3(p.x, 0, 0))
            .sub(origin)
            .normalize();
          const ray = new T.Raycaster(origin, direction);
          const eyeHit = ray.intersectObject(root.getObjectByName('Watcher_Eyeball')!)[0];
          const skinHit = ray.intersectObject(body)[0];
          expect(eyeHit).toBeDefined();
          expect(skinHit).toBeDefined();
          expect(eyeHit.distance).toBeLessThan(skinHit.distance);
        }
        x.push(p.x);
      }
      expect(Math.max(...x) - Math.min(...x)).toBeGreaterThan(0.033);
      mixer.setTime(3.8);
      root.updateMatrixWorld(true);
      for (const name of ['Watcher_UpperLid', 'Watcher_LowerLid'])
        expect(Math.abs(root.getObjectByName(name)!.rotation.x)).toBeLessThan(1e-6);
      const origin = eye.localToWorld(new T.Vector3(0, 0.02, 1)),
        direction = eye
          .localToWorld(new T.Vector3(0, 0.02, 0))
          .sub(origin)
          .normalize();
      const ray = new T.Raycaster(origin, direction);
      const lid = ray.intersectObject(root.getObjectByName('Watcher_UpperLidSkin')!)[0];
      const eyeball = ray.intersectObject(root.getObjectByName('Watcher_Eyeball')!)[0];
      expect(lid).toBeDefined();
      expect(eyeball).toBeDefined();
      expect(lid.distance).toBeLessThan(eyeball.distance);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
  it('faces both wrap rims outward and keeps clothing outside the underlying flesh', () => {
    const root = createStudy('watcher');
    try {
      root.updateMatrixWorld(true);
      const wrap = root.getObjectByName('Watcher_HipWrap') as T.Mesh,
        g = wrap.geometry,
        p = g.attributes.position,
        idx = g.index!;
      const start = 40 * 96 * 12;
      for (let k = 0; k < start; k += 12) {
        const a = new T.Vector3().fromBufferAttribute(p, idx.getX(k)),
          b = new T.Vector3().fromBufferAttribute(p, idx.getX(k + 1)),
          c = new T.Vector3().fromBufferAttribute(p, idx.getX(k + 2));
        const radial = new T.Vector3(
          (a.x + b.x + c.x) / 3 - 0.025,
          0,
          (a.z + b.z + c.z) / 3 + 0.025,
        ).normalize();
        expect(b.sub(a).cross(c.sub(a)).normalize().dot(radial)).toBeGreaterThan(0.3);
      }
      for (let row = 0; row < 2; row++)
        for (let i = 0; i < 96 * 6; i += 3) {
          const a = new T.Vector3().fromBufferAttribute(p, idx.getX(start + row * 96 * 6 + i));
          const b = new T.Vector3().fromBufferAttribute(p, idx.getX(start + row * 96 * 6 + i + 1));
          const c = new T.Vector3().fromBufferAttribute(p, idx.getX(start + row * 96 * 6 + i + 2));
          const normal = b.sub(a).cross(c.sub(a)).normalize();
          expect(normal.y * (row === 0 ? 1 : -1)).toBeGreaterThan(0.9);
        }
      const body = root.getObjectByName('Watcher_ContinuousAnatomy') as T.Mesh;
      const ray = new T.Raycaster();
      for (const y of [0.58, 0.68, 0.77])
        for (const angle of [0, 0.6, 1.2, 2, Math.PI, 4.5, 5.8]) {
          const outward = new T.Vector3(Math.sin(angle), 0, Math.cos(angle));
          const origin = new T.Vector3(0.025, y, -0.025).addScaledVector(outward, 1);
          ray.set(origin, outward.clone().negate());
          const cloth = ray.intersectObject(wrap)[0],
            flesh = ray.intersectObject(body)[0];
          expect(cloth, `wrap ${y}/${angle}`).toBeDefined();
          expect(flesh).toBeDefined();
          expect(cloth.distance, `wrap ${y}/${angle}`).toBeLessThan(flesh.distance + 0.004);
        }
    } finally {
      disposeObject(root);
    }
  }, 15000);
});
