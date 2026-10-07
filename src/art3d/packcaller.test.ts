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
describe('Pack Caller anatomy, support and fittings', () => {
  it('closes the body, tail and ear cups with finite weights and outward faces', () => {
    const root = createStudy('packcaller');
    try {
      for (const name of [
        'Packcaller_ContinuousAnatomy',
        'Packcaller_BrushTail',
        'Packcaller_CuppedEar_-1',
        'Packcaller_CuppedEar_1',
        'Packcaller_FittedCollar',
        'Packcaller_LowerJaw',
      ]) {
        const m = root.getObjectByName(name) as T.Mesh,
          g = m.geometry;
        expect(openEdges(g), name).toBe(0);
        expect(volume(g), name).toBeGreaterThan(0);
        expect(Array.from(g.attributes.position.array).every(Number.isFinite), name).toBe(true);
      }
      const skins: T.SkinnedMesh[] = [];
      root.traverse((o) => {
        if (o instanceof T.SkinnedMesh) skins.push(o);
      });
      expect(skins).toHaveLength(3);
      for (const skin of skins) {
        const w = skin.geometry.attributes.skinWeight,
          j = skin.geometry.attributes.skinIndex;
        let bad = 0;
        for (let i = 0; i < w.count; i++) {
          let sum = 0;
          for (let c = 0; c < 4; c++) {
            const n = w.getComponent(i, c);
            sum += n;
            if (
              !Number.isFinite(n) ||
              n < 0 ||
              n > 1 ||
              j.getComponent(i, c) >= skin.skeleton.bones.length
            )
              bad++;
          }
          if (Math.abs(sum - 1) > 1e-6) bad++;
        }
        expect(bad, skin.name).toBe(0);
      }
    } finally {
      disposeObject(root);
    }
  });
  it('keeps four soles, folded haunches and sixteen claws fixed through the loop', () => {
    const root = createStudy('packcaller'),
      mixer = new T.AnimationMixer(root);
    root.updateMatrixWorld(true);
    try {
      const skin = root.getObjectByName('Packcaller_ContinuousAnatomy') as T.SkinnedMesh,
        p = skin.geometry.attributes.position;
      const paws = [
        [-0.47, 0.16, 0.32],
        [-0.27, 0.16, -0.28],
        [0.24, 0.16, 0.34],
        [0.35, 0.16, -0.33],
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
        expect(ids.length).toBeGreaterThan(20);
        const min = Math.min(...ids.map((i) => p.getY(i)));
        expect(min).toBeCloseTo(0.105, 6);
      });
      const selected = sampleGroups.flat().filter((_, i) => i % 9 === 0),
        before = selected.map((i) => skin.getVertexPosition(i, new T.Vector3()));
      const claws: T.Mesh[] = [];
      root.traverse((o) => {
        if (o instanceof T.Mesh && o.name.startsWith('Packcaller_Claw_')) claws.push(o);
      });
      expect(claws).toHaveLength(16);
      const matrices = claws.map((o) => o.matrixWorld.clone());
      mixer.clipAction(createStudyClip(root, 'packcaller')).play();
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
    const root = createStudy('packcaller'),
      mixer = new T.AnimationMixer(root);
    root.updateMatrixWorld(true);
    try {
      const body = root.getObjectByName('Packcaller_ContinuousAnatomy') as T.SkinnedMesh,
        tail = root.getObjectByName('Packcaller_BrushTail') as T.SkinnedMesh;
      const p = body.geometry.attributes.position,
        w = body.geometry.attributes.skinWeight,
        nose = root.getObjectByName('Packcaller_Nose')!;
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
      mixer.clipAction(createStudyClip(root, 'packcaller')).play();
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
      expect(tailTravel).toBeGreaterThan(0.02);
      expect(headTravel).toBeGreaterThan(0.015);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
  it('keeps the fitted collar close to the neck and the pendant attached while the jaw articulates', () => {
    const root = createStudy('packcaller'),
      mixer = new T.AnimationMixer(root);
    try {
      root.updateMatrixWorld(true);
      const body = root.getObjectByName('Packcaller_ContinuousAnatomy') as T.SkinnedMesh;
      const band = root.getObjectByName('Packcaller_FittedCollar') as T.SkinnedMesh;
      const jaw = root.getObjectByName('Packcaller_Jaw')!;
      const pendant = root.getObjectByName('Packcaller_PendantAssembly')!;
      const indices = [0, 20, 40, 60, 80, 100].flatMap((j) => [121 + j, 363 + j]);
      const paired = indices.map((i) => {
        const q = band.getVertexPosition(i, new T.Vector3());
        let nearest = -1,
          best = Infinity;
        const p = body.geometry.attributes.position;
        for (let k = 0; k < p.count; k++) {
          const d = new T.Vector3().fromBufferAttribute(p, k).distanceTo(q);
          if (d < best) {
            best = d;
            nearest = k;
          }
        }
        expect(best).toBeLessThan(0.037);
        return { i, k: nearest, d: best };
      });
      const pendant0 = pendant.getWorldPosition(new T.Vector3()),
        jawBase = jaw.position.clone(),
        jawStart = jaw.quaternion.clone();
      const collarPosition = band.geometry.attributes.position;
      const attachment = root.worldToLocal(pendant0.clone());
      let bailDistance = Infinity;
      for (let i = 0; i < collarPosition.count; i++)
        bailDistance = Math.min(
          bailDistance,
          new T.Vector3().fromBufferAttribute(collarPosition, i).distanceTo(attachment),
        );
      expect(bailDistance).toBeLessThan(0.025);
      let jawTravel = 0;
      mixer.clipAction(createStudyClip(root, 'packcaller')).play();
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        for (const { i, k, d } of paired) {
          const now = band
            .getVertexPosition(i, new T.Vector3())
            .distanceTo(body.getVertexPosition(k, new T.Vector3()));
          expect(Math.abs(now - d)).toBeLessThan(0.008);
        }
        expect(pendant.getWorldPosition(new T.Vector3()).distanceTo(pendant0)).toBeLessThan(1e-7);
        expect(jaw.position.distanceTo(jawBase)).toBeLessThan(1e-7);
        jawTravel = Math.max(jawTravel, jaw.quaternion.angleTo(jawStart));
      }
      expect(jawTravel).toBeGreaterThan(0.05);
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
});
