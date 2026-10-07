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
describe('Storm Roc fitted wings, body and grip', () => {
  it('closes the living body, wing leading volumes and thin flight vanes with outward winding', () => {
    const root = createStudy('stormroc');
    try {
      const meshes: T.Mesh[] = [];
      root.traverse((o) => {
        if (
          o instanceof T.Mesh &&
          /ContinuousPlumage|WingLeading|Primary_|Secondary_|Rectrix_/.test(o.name) &&
          !o.name.endsWith('_FineShaft')
        )
          meshes.push(o);
      });
      expect(meshes.length).toBeGreaterThan(50);
      for (const m of meshes) {
        expect(openEdges(m.geometry), m.name).toBe(0);
        expect(
          Array.from(m.geometry.attributes.position.array).every(Number.isFinite),
          m.name,
        ).toBe(true);
        expect(volume(m.geometry), m.name).toBeGreaterThan(0);
      }
      // Export must retain the ledge's flat planes without relying on a material shader flag.
      const rock = (root.getObjectByName('Stormroc_Rock') as T.Mesh).geometry,
        n = rock.attributes.normal;
      expect(rock.index).toBeNull();
      for (let i = 0; i < n.count; i += 3) {
        const a = new T.Vector3().fromBufferAttribute(n, i);
        expect(a.distanceTo(new T.Vector3().fromBufferAttribute(n, i + 1))).toBeLessThan(1e-7);
        expect(a.distanceTo(new T.Vector3().fromBufferAttribute(n, i + 2))).toBeLessThan(1e-7);
      }
      const skin = root.getObjectByName('Stormroc_ContinuousPlumage') as T.SkinnedMesh,
        w = skin.geometry.attributes.skinWeight,
        j = skin.geometry.attributes.skinIndex;
      let bad = 0;
      for (let i = 0; i < w.count; i++) {
        let sum = 0;
        for (let c = 0; c < 4; c++) {
          const n = w.getComponent(i, c);
          sum += n;
          if (!Number.isFinite(n) || n < 0 || n > 1 || j.getComponent(i, c) >= 3) bad++;
        }
        if (Math.abs(sum - 1) > 1e-6) bad++;
      }
      expect(bad).toBe(0);
    } finally {
      disposeObject(root);
    }
  });
  it('keeps the low ledge, talons and pelvis fixed while head and wing tips respond', () => {
    const root = createStudy('stormroc'),
      mixer = new T.AnimationMixer(root);
    mixer.clipAction(createStudyClip(root, 'stormroc')).play();
    root.updateMatrixWorld(true);
    try {
      const support = root.getObjectByName('Stormroc_RockAndGrip')!,
        fixed: T.Object3D[] = [];
      support.traverse((o) => {
        if (o instanceof T.Mesh) fixed.push(o);
      });
      const rest = fixed.map((o) => o.matrixWorld.clone());
      expect(fixed.filter((o) => /Claw_/.test(o.name))).toHaveLength(8);
      const skin = root.getObjectByName('Stormroc_ContinuousPlumage') as T.SkinnedMesh,
        p = skin.geometry.attributes.position;
      const anchored: number[] = [];
      for (let i = 0; i < p.count; i += 31) if (p.getY(i) < 1.5) anchored.push(i);
      const stable = anchored.map((i) => skin.getVertexPosition(i, new T.Vector3()));
      const names = ['Stormroc_UpperBill', 'Stormroc_Primary_-1_8', 'Stormroc_Primary_1_8'];
      const tip = (name: string) => {
        const m = root.getObjectByName(name) as T.Mesh;
        return new T.Vector3()
          .fromBufferAttribute(m.geometry.attributes.position, 300)
          .applyMatrix4(m.matrixWorld);
      };
      const before = names.map(tip),
        moves = names.map(() => 0);
      for (let frame = 0; frame <= 144; frame++) {
        mixer.setTime(frame / 24);
        root.updateMatrixWorld(true);
        fixed.forEach((o, i) => expect(o.matrixWorld.elements).toEqual(rest[i].elements));
        for (let i = 0; i < anchored.length; i++)
          expect(
            skin.getVertexPosition(anchored[i], new T.Vector3()).distanceTo(stable[i]),
          ).toBeLessThan(1e-7);
        names.forEach(
          (name, i) => (moves[i] = Math.max(moves[i], tip(name).distanceTo(before[i]))),
        );
      }
      moves.forEach((d) => expect(d).toBeGreaterThan(0.02));
    } finally {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      disposeObject(root);
    }
  });
  it('fits eyes to the skull and seats both front grips on the actual rock', () => {
    const root = createStudy('stormroc');
    root.updateMatrixWorld(true);
    try {
      const skin = root.getObjectByName('Stormroc_ContinuousPlumage') as T.SkinnedMesh,
        p = skin.geometry.attributes.position;
      for (const side of [-1, 1]) {
        const eye = root.getObjectByName(`Stormroc_Eye_${side}`)!,
          center = eye.getWorldPosition(new T.Vector3());
        let gap = Infinity;
        for (let i = 0; i < p.count; i++)
          gap = Math.min(
            gap,
            skin
              .getVertexPosition(i, new T.Vector3())
              .applyMatrix4(skin.matrixWorld)
              .distanceTo(center),
          );
        expect(gap).toBeLessThan(0.016);
        for (const name of [
          `Stormroc_Toe_${side}_0`,
          `Stormroc_Toe_${side}_1`,
          `Stormroc_Toe_${side}_2`,
          `Stormroc_Hallux_${side}`,
        ]) {
          const toe = root.getObjectByName(name) as T.Mesh,
            positions = toe.geometry.attributes.position;
          let contact = Infinity;
          for (let i = 0; i < positions.count; i += 3) {
            const q = new T.Vector3()
              .fromBufferAttribute(positions, i)
              .applyMatrix4(toe.matrixWorld);
            const ray = new T.Raycaster(new T.Vector3(q.x, 2, q.z), new T.Vector3(0, -1, 0)),
              hits = ray.intersectObject(root.getObjectByName('Stormroc_Rock')!);
            if (hits.length) contact = Math.min(contact, Math.abs(q.y - hits[0].point.y));
          }
          expect(contact, name).toBeLessThan(0.012);
        }
      }
    } finally {
      disposeObject(root);
    }
  });
});
