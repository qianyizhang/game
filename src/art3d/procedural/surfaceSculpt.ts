import * as T from 'three';
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const mix = T.MathUtils.lerp;
export type Field = (x: number, y: number, z: number) => number;
export const union = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
export function ellipsoid(center: number[], radii: number[], angle = 0): Field {
  const [cx, cy, cz] = center;
  const [rx, ry, rz] = radii;
  const c = Math.cos(angle),
    s = Math.sin(angle),
    scale = Math.min(...radii);
  return (x, y, z) => {
    const dx = x - cx,
      dy = y - cy;
    return (Math.hypot((dx * c + dy * s) / rx, (-dx * s + dy * c) / ry, (z - cz) / rz) - 1) * scale;
  };
}
export function taperedSpineField(points: number[][], radii: number[]): Field {
  const curve = new T.CatmullRomCurve3(points.map(v));
  const samples = Array.from({ length: 32 }, (_, i) => {
    const t = i / 31,
      f = t * (radii.length - 1),
      j = Math.min(radii.length - 2, Math.floor(f));
    return { p: curve.getPoint(t), r: mix(radii[j], radii[j + 1], f - j) };
  });
  const segments = samples.slice(0, -1).map((a, i) => {
    const b = samples[i + 1],
      dx = b.p.x - a.p.x,
      dy = b.p.y - a.p.y,
      dz = b.p.z - a.p.z,
      l2 = dx * dx + dy * dy + dz * dz,
      dr = b.r - a.r;
    return {
      a,
      dx,
      dy,
      dz,
      l2,
      dr,
      factor: Math.abs(dr) < Math.sqrt(l2) ? dr / Math.sqrt(l2 * (l2 - dr * dr)) : 0,
    };
  });
  const margin = Math.max(...radii) + 0.25;
  const low = [0, 1, 2].map(
    (axis) => Math.min(...samples.map((s) => s.p.getComponent(axis))) - margin,
  );
  const high = [0, 1, 2].map(
    (axis) => Math.max(...samples.map((s) => s.p.getComponent(axis))) + margin,
  );
  return (x, y, z) => {
    // Outside this conservative bound the limb cannot influence the zero surface or its blend.
    if (x < low[0] || x > high[0] || y < low[1] || y > high[1] || z < low[2] || z > high[2])
      return 10;
    let d = 10;
    for (const { a, dx, dy, dz, l2, dr, factor } of segments) {
      const px = x - a.p.x,
        py = y - a.p.y,
        pz = z - a.p.z,
        dot = px * dx + py * dy + pz * dz;
      const projection = dot / l2,
        perpendicular = Math.sqrt(Math.max(0, px * px + py * py + pz * pz - (dot * dot) / l2));
      // Minimize distance minus linearly varying radius, not distance to the bare segment.
      const t =
        Math.abs(dr) >= Math.sqrt(l2)
          ? dr > 0
            ? 1
            : 0
          : T.MathUtils.clamp(projection + factor * perpendicular, 0, 1);
      const ex = px - dx * t,
        ey = py - dy * t,
        ez = pz - dz * t;
      d = Math.min(d, Math.sqrt(ex * ex + ey * ey + ez * ez) - a.r - dr * t);
    }
    return d;
  };
}

/** Closed implicit skin, with gradient normals instead of visible tetrahedral facets. */
export function sculptField(
  field: Field,
  settings = { step: 0.023, origin: [-1.45, 0.03, -0.62], cells: [115, 84, 60] },
  tint: (p: T.Vector3) => T.Color = () => new T.Color(0xffffff),
) {
  const { step, origin, cells } = settings;
  const [nx, ny, nz] = cells,
    key = (i: number, j: number, k: number) => (i * (ny + 1) + j) * (nz + 1) + k;
  const point = (i: number, j: number, k: number) =>
    new T.Vector3(origin[0] + i * step, origin[1] + j * step, origin[2] + k * step);
  const data = new Float32Array((nx + 1) * (ny + 1) * (nz + 1));
  for (let i = 0; i <= nx; i++)
    for (let j = 0; j <= ny; j++)
      for (let k = 0; k <= nz; k++) {
        const p = point(i, j, k);
        data[key(i, j, k)] = field(p.x, p.y, p.z);
      }
  const offsets = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1],
  ];
  const tetra = [
    [0, 5, 1, 6],
    [0, 1, 2, 6],
    [0, 2, 3, 6],
    [0, 3, 7, 6],
    [0, 7, 4, 6],
    [0, 4, 5, 6],
  ];
  const positions: number[] = [],
    normals: number[] = [],
    indices: number[] = [],
    colors: number[] = [];
  const cache = new Map<string, number>();
  const gradient = (p: T.Vector3) => {
    const e = 0.001;
    return new T.Vector3(
      field(p.x + e, p.y, p.z) - field(p.x - e, p.y, p.z),
      field(p.x, p.y + e, p.z) - field(p.x, p.y - e, p.z),
      field(p.x, p.y, p.z + e) - field(p.x, p.y, p.z - e),
    ).normalize();
  };
  const vertex = (p: T.Vector3) => {
    const key = p
      .toArray()
      .map((n) => Math.round(n * 1e6))
      .join(',');
    const found = cache.get(key);
    if (found !== undefined) return found;
    const index = positions.length / 3,
      n = gradient(p);
    positions.push(...p.toArray());
    normals.push(...n.toArray());

    const color = tint(p);
    colors.push(...color.toArray());
    cache.set(key, index);
    return index;
  };
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++)
      for (let k = 0; k < nz; k++) {
        const values = offsets.map(([a, b, c]) => data[key(i + a, j + b, k + c)]);
        if (values.every((f) => f < 0) || values.every((f) => f >= 0)) continue;
        const points = offsets.map(([a, b, c]) => point(i + a, j + b, k + c));
        for (const tet of tetra) {
          const crossing: T.Vector3[] = [];
          for (let a = 0; a < 4; a++)
            for (let b = a + 1; b < 4; b++) {
              const u = tet[a],
                w = tet[b];
              if (values[u] < 0 === values[w] < 0) continue;
              crossing.push(points[u].clone().lerp(points[w], values[u] / (values[u] - values[w])));
            }
          if (crossing.length < 3) continue;
          const center = crossing
            .reduce((sum, p) => sum.add(p), new T.Vector3())
            .multiplyScalar(1 / crossing.length);
          const normal = gradient(center),
            u = crossing[0].clone().sub(center).normalize(),
            w = new T.Vector3().crossVectors(normal, u);
          crossing.sort(
            (a, b) =>
              Math.atan2(a.clone().sub(center).dot(w), a.clone().sub(center).dot(u)) -
              Math.atan2(b.clone().sub(center).dot(w), b.clone().sub(center).dot(u)),
          );
          for (let t = 1; t < crossing.length - 1; t++)
            indices.push(vertex(crossing[0]), vertex(crossing[t]), vertex(crossing[t + 1]));
        }
      }
  // Regionally projected UVs avoid the polar stretching of a single cylindrical map.
  // Vertices share gradient normals across these UV boundaries; color detail stays quiet.
  const mappedPositions: number[] = [],
    mappedNormals: number[] = [],
    mappedColors: number[] = [],
    mappedUV: number[] = [],
    mappedIndices: number[] = [];
  const uvVertices = new Map<string, number>();
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = indices.slice(i, i + 3);
    const normal = triangle
      .reduce(
        (n, k) =>
          n.add(new T.Vector3(...(normals.slice(k * 3, k * 3 + 3) as [number, number, number]))),
        new T.Vector3(),
      )
      .normalize();
    const ax = Math.abs(normal.x),
      ay = Math.abs(normal.y),
      az = Math.abs(normal.z);
    const plane = ax > ay && ax > az ? 0 : ay > az ? 1 : 2;
    for (const k of triangle) {
      const key = `${k}:${plane}`;
      const existing = uvVertices.get(key);
      if (existing !== undefined) {
        mappedIndices.push(existing);
        continue;
      }
      const mappedIndex = mappedPositions.length / 3;
      uvVertices.set(key, mappedIndex);
      mappedIndices.push(mappedIndex);
      const [x, y, z] = positions.slice(k * 3, k * 3 + 3);
      mappedPositions.push(x, y, z);
      mappedNormals.push(...normals.slice(k * 3, k * 3 + 3));
      mappedColors.push(...colors.slice(k * 3, k * 3 + 3));
      mappedUV.push(
        ...(ax > ay && ax > az
          ? [z * 2.6, y * 1.75]
          : ay > az
            ? [z * 2.6, x * 1.75]
            : [y * 2.6, x * 1.75]),
      );
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(mappedPositions, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(mappedNormals, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(mappedColors, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(mappedUV, 2));
  g.setIndex(mappedIndices);
  return g;
}
