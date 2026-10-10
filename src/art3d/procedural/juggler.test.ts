import { isMesh, isSkinnedMesh } from '../../shared/three/objects';
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
describe('Soul Juggler living assembly', () => {
  it('closes its body, ears, hands and spirit flames with valid skin weights', () => {
    const root = createStudy('juggler');
    try {
      const names = [
        'Juggler_ContinuousAnatomy',
        'Juggler_HandSkin_0',
        'Juggler_HandSkin_1',
        'Juggler_CuppedEar_-1',
        'Juggler_CuppedEar_1',
      ];
      for (let i = 0; i < 2; i++) names.push(`Juggler_Flame_${i}`, `Juggler_FlameCore_${i}`);
      for (const name of names) {
        const g = (root.getObjectByName(name) as T.Mesh).geometry;
        expect(openEdges(g), name).toBe(0);
        expect(volume(g), name).toBeGreaterThan(0);
        expect(Array.from(g.attributes.position.array).every(Number.isFinite), name).toBe(true);
      }
      expect(
        components((root.getObjectByName('Juggler_ContinuousAnatomy') as T.Mesh).geometry),
      ).toBe(1);
      let count = 0;
      root.traverse((o) => {
        if (!isSkinnedMesh(o)) return;
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
      expect(count).toBe(1);
    } finally {
      disposeObject(root);
    }
  }, 15000);
  it('keeps both soles and the raised hands stationary throughout the loop', () => {
    const root = createStudy('juggler'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Juggler_ContinuousAnatomy') as T.SkinnedMesh,
        p = body.geometry.attributes.position;
      const feet = [
        [-0.21, 0.16, 0.27],
        [0.22, 0.16, -0.015],
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
        if (isMesh(o) && /^Juggler_(HandSkin|HandClaw|ToeClaw)_/.test(o.name)) fixed.push(o);
      });
      expect(fixed).toHaveLength(16);
      const matrices = fixed.map((o) => o.matrixWorld.clone());
      mixer.clipAction(createStudyClip(root, 'juggler')).play();
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
  it('carries horns, eyes, fangs and mouth with the deforming head', () => {
    const root = createStudy('juggler'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Juggler_ContinuousAnatomy') as T.SkinnedMesh;
      const p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight,
        j = body.geometry.attributes.skinIndex;
      const vertex = Array.from({ length: p.count }, (_, i) => i).find(
        (i) => j.getX(i) === 2 && w.getX(i) === 1,
      )!;
      expect(vertex).toBeDefined();
      const objects = [
        'Juggler_Horn_-1',
        'Juggler_Horn_1',
        'Juggler_Fang_-1',
        'Juggler_Fang_1',
        'Juggler_Eye_-1',
        'Juggler_Eye_1',
        'Juggler_Mouth',
      ].map((n) => root.getObjectByName(n)!);
      const distance = objects.map((o) =>
        body
          .getVertexPosition(vertex, new T.Vector3())
          .distanceTo(o.getWorldPosition(new T.Vector3())),
      );
      const tip = () => objects[0].localToWorld(new T.Vector3(-0.2, 0.46, -0.073)),
        initial = tip();
      let travel = 0;
      mixer.clipAction(createStudyClip(root, 'juggler')).play();
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
    const root = createStudy('juggler'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Juggler_ContinuousAnatomy') as T.SkinnedMesh,
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
        const mesh = root.getObjectByName(`Juggler_HandSkin_${h}`) as T.Mesh,
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
      mixer.clipAction(createStudyClip(root, 'juggler')).play();
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
  it('keeps each flame core fitted while both spirits hover clear of their hands', () => {
    const root = createStudy('juggler'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const flames = [0, 1].map((i) => root.getObjectByName(`Juggler_Spirit_${i}`)!);
      const minY = [Infinity, Infinity],
        maxY = [-Infinity, -Infinity];
      const cores = [0, 1].map((i) => root.getObjectByName(`Juggler_FlameCore_${i}`) as T.Mesh);
      const matrices = cores.map((c) => c.matrix.clone());
      for (const c of cores) expect(c.geometry.getAttribute('color')).toBeUndefined();
      mixer.clipAction(createStudyClip(root, 'juggler')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        for (let i = 0; i < 2; i++) {
          const p = flames[i].getWorldPosition(new T.Vector3());
          minY[i] = Math.min(minY[i], p.y);
          maxY[i] = Math.max(maxY[i], p.y);
          expect(cores[i].parent).toBe(flames[i]);
          expect(cores[i].matrix.elements).toEqual(matrices[i].elements);
          const hand = root.getObjectByName(`Juggler_Hand_${i}`)!;
          const handTop = new T.Box3().setFromObject(hand, true).max.y;
          const flameBottom = new T.Box3().setFromObject(flames[i], true).min.y;
          expect(
            flameBottom - handTop,
            `flame ${i} frame ${frame}, hand ${handTop}, bottom ${flameBottom}`,
          ).toBeGreaterThan(0.025);
          expect(flameBottom - handTop).toBeLessThan(0.17);
        }
      }
      for (let i = 0; i < 2; i++) expect(maxY[i] - minY[i]).toBeGreaterThan(0.045);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  }, 15000);
});
