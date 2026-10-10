import * as T from 'three';
import { loft } from './newStudies';

const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const mix = T.MathUtils.lerp;
const smooth = T.MathUtils.smoothstep;
const HEAD = new T.Vector3(-0.66, 1.58, 0.16);
const HEAD_ROTATION = new T.Quaternion().setFromEuler(new T.Euler(-0.12, -0.73, -0.02));
const TAIL = [
  [0.66, 0.98, -0.1],
  [0.99, 0.84, -0.17],
  [1.16, 0.61, -0.22],
  [1.19, 0.37, -0.28],
  [1.11, 0.24, -0.35],
  [0.96, 0.21, -0.42],
];
const PAWS = [
  [-0.55, 0.165, 0.3],
  [-0.34, 0.165, -0.24],
  [0.73, 0.165, 0.25],
  [0.47, 0.165, -0.3],
];

type Field = (x: number, y: number, z: number) => number;
const union = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
function ellipsoid(center: number[], radii: number[], angle = 0): Field {
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

/** A standing forest sentry: weight through forelegs, falling back, head lifted to listen. */
function anatomyField(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([-0.18, 1.08, -0.025], [0.49, 0.32, 0.255], 0.09), 0.12],
    [ellipsoid([0.22, 1.08, -0.075], [0.38, 0.205, 0.205], -0.11), 0.12],
    [ellipsoid([0.51, 1.01, -0.08], [0.3, 0.27, 0.23], -0.22), 0.11],
    [ellipsoid([-0.35, 1.08, 0.14], [0.205, 0.33, 0.15], -0.11), 0.1],
    [ellipsoid([-0.27, 1.08, -0.18], [0.19, 0.31, 0.13], 0.05), 0.1],
    [
      taperedSpineField(
        [[-0.36, 1.08, 0.16], [-0.29, 0.7, 0.24], [-0.49, 0.31, 0.29], PAWS[0]],
        [0.135, 0.098, 0.052, 0.065],
      ),
      0.075,
    ],
    [
      taperedSpineField(
        [[-0.29, 1.06, -0.19], [-0.12, 0.69, -0.25], [-0.25, 0.29, -0.24], PAWS[1]],
        [0.12, 0.085, 0.05, 0.06],
      ),
      0.07,
    ],
    [ellipsoid([0.51, 0.83, 0.14], [0.21, 0.29, 0.15], -0.38), 0.09],
    [
      taperedSpineField(
        [[0.54, 0.87, 0.19], [0.33, 0.58, 0.24], [0.73, 0.35, 0.24], PAWS[2]],
        [0.12, 0.082, 0.048, 0.055],
      ),
      0.075,
    ],
    [ellipsoid([0.59, 0.82, -0.24], [0.2, 0.25, 0.135], -0.31), 0.09],
    [
      taperedSpineField(
        [[0.6, 0.9, -0.24], [0.39, 0.55, -0.29], [0.61, 0.3, -0.3], PAWS[3]],
        [0.11, 0.075, 0.047, 0.05],
      ),
      0.07,
    ],
    [
      taperedSpineField(
        [[-0.33, 1.07, 0.015], [-0.4, 1.32, 0.07], [-0.56, 1.49, 0.12], HEAD.toArray()],
        [0.27, 0.24, 0.2, 0.175],
      ),
      0.14,
    ],
    // The bib broadens the neck at its root and closes into the chest, rather than a collar.
    [ellipsoid([-0.51, 1.16, 0.13], [0.19, 0.31, 0.21], 0.25), 0.1],
  ];
  // A few broad, swept locks grow out of the bib. Their roots merge into the neck;
  // their unequal tips change the contour without tiling the quiet coat.
  const bibLocks: [number[][], number[]][] = [
    [
      [
        [-0.6, 1.35, 0.13],
        [-0.68, 1.14, 0.15],
        [-0.66, 0.98, 0.15],
      ],
      [0.085, 0.065, 0.004],
    ],
    [
      [
        [-0.5, 1.35, 0.27],
        [-0.45, 1.13, 0.3],
        [-0.34, 1.01, 0.295],
      ],
      [0.088, 0.044, 0.003],
    ],
    [
      [
        [-0.42, 1.27, 0.25],
        [-0.3, 1.12, 0.3],
        [-0.17, 1.04, 0.29],
      ],
      [0.085, 0.04, 0.003],
    ],
    [
      [
        [-0.54, 1.34, -0.12],
        [-0.53, 1.13, -0.19],
        [-0.43, 0.99, -0.2],
      ],
      [0.075, 0.054, 0.003],
    ],
  ];
  for (const [points, radii] of bibLocks) shapes.push([taperedSpineField(points, radii), 0.075]);
  for (const [x, y, z] of PAWS) {
    shapes.push([ellipsoid([x - 0.025, y + 0.007, z], [0.13, 0.074, 0.088]), 0.038]);
    for (let i = 0; i < 4; i++)
      shapes.push([
        ellipsoid(
          [x - 0.096 - 0.013 * Math.sin((i * Math.PI) / 3), y - 0.001, z + (i - 1.5) * 0.038],
          [0.06, 0.06, 0.027],
        ),
        0.014,
      ]);
  }
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.025, -0.015], [0.202, 0.187, 0.202]), 0.052],
    [ellipsoid([0, -0.068, 0.055], [0.173, 0.118, 0.15]), 0.04],
    [ellipsoid([0, -0.006, 0.236], [0.101, 0.095, 0.225]), 0.054],
    [ellipsoid([0, -0.101, 0.239], [0.091, 0.042, 0.2]), 0.024],
    [ellipsoid([-0.121, 0.091, 0.113], [0.085, 0.036, 0.058], -0.13), 0.049],
    [ellipsoid([0.121, 0.091, 0.113], [0.085, 0.036, 0.058], 0.13), 0.049],
  ];
  const inv = new T.Matrix4().makeRotationFromQuaternion(HEAD_ROTATION.clone().invert()).elements;
  return (x, y, z) => {
    let f = 10;
    for (const [field, k] of shapes) f = union(f, field(x, y, z), k);
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    if (Math.abs(dx) > 0.72 || Math.abs(dy) > 0.5 || Math.abs(dz) > 0.72)
      return Math.max(f, 0.105 - y);
    const hx = (inv[0] * dx + inv[4] * dy + inv[8] * dz) / 1.08,
      hy = (inv[1] * dx + inv[5] * dy + inv[9] * dz) / 1.08,
      hz = (inv[2] * dx + inv[6] * dy + inv[10] * dz) / 1.08;
    let h = 10;
    for (const [field, k] of skull) h = union(h, field(hx, hy, hz), k);
    for (const side of [-1, 1]) {
      const socket =
        (Math.hypot((hx - side * 0.148) / 0.066, (hy - 0.059) / 0.032, (hz - 0.147) / 0.06) - 1) *
        0.032;
      h = Math.max(h, -socket);
    }
    return Math.max(union(f, h, 0.055), 0.105 - y);
  };
}

function coatColor(p: T.Vector3) {
  const local = p.clone().sub(HEAD).applyQuaternion(HEAD_ROTATION.clone().invert());
  const muzzle =
    smooth(local.z, 0.09, 0.33) *
    (1 - smooth(local.y, -0.015, 0.06)) *
    (1 - smooth(Math.abs(local.x), 0.09, 0.18));
  const bib = smooth(-p.x, 0.3, 0.62) * (1 - smooth(p.y, 1.35, 1.55)) * smooth(p.z, -0.05, 0.22);
  const dorsal = smooth(p.y, 1.0, 1.31) * (1 - smooth(Math.abs(p.z + 0.06), 0.05, 0.24));
  const leg = (1 - smooth(p.y, 0.3, 0.75)) * 0.3;
  const color = new T.Color('#657465')
    .lerp(new T.Color('#34493e'), dorsal * 0.8)
    .lerp(new T.Color('#b7bba0'), Math.max(muzzle * 0.8, bib * 0.83, leg));

  return color;
}

/** Closed implicit skin, with gradient normals instead of visible tetrahedral facets. */
function sculpt(
  field: Field,
  settings = { step: 0.023, origin: [-1.45, 0.03, -0.62], cells: [115, 84, 60] },
  tint?: (p: T.Vector3) => T.Color,
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

    const color = tint ? tint(p) : coatColor(p);
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
        ...(y > 1.26
          ? [x * 2.6 + z * 1.3, y * 1.75]
          : ax > ay && ax > az
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

const hash = (x: number, y: number) => {
  const f = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return f - Math.floor(f);
};
function surfaceMaterial(kind: 'fur' | 'antler' | 'nose' = 'fur') {
  const size = 512,
    paint = new Uint8Array(size * size * 4),
    normals = paint.slice(),
    packed = paint.slice();
  const heights = new Float32Array(size * size),
    tones = new Float32Array(size * size);
  const wrap = (x: number, n: number) => ((x % n) + n) % n;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let relief = 0,
        tone = 234;
      if (kind === 'fur') {
        const col = Math.floor(x / 8),
          row = Math.floor(y / 32);
        for (let c = col - 1; c <= col + 1; c++)
          for (let r = row - 1; r <= row + 1; r++) {
            const seed = hash(wrap(c, 64), wrap(r, 16)),
              cx = c * 8 + seed * 5,
              cy = r * 32 + hash(wrap(c + 31, 64), wrap(r, 16)) * 17;
            const t = (y - cy) / (19 + seed * 15);
            if (t < 0 || t > 1) continue;
            const dx = x - cx - Math.sin(t * 2.5 + seed) * 2,
              w = (1.1 + seed) * Math.sin(t * Math.PI) ** 0.45;
            const strand = Math.exp(-((dx / Math.max(w, 0.1)) ** 2)) * Math.sin(t * Math.PI) ** 0.5;
            relief += strand;
            tone += strand * (10 + seed * 12) - strand * hash(c + 13, r) * 7;
          }
        tone -= 11;
        tone += (hash(x, y) - 0.5) * 6;
      } else if (kind === 'antler') {
        relief =
          Math.sin(x * 0.75 + Math.sin(y * 0.029) * 1.5) * 0.13 +
          Math.sin(x * 0.21 + y * 0.032) * 0.11;
        const pore = Math.max(0, hash(Math.floor(x / 3), Math.floor(y / 8)) - 0.8) * 2;
        relief -= pore;
        tone = 226 + relief * 31 + Math.sin(x * 0.06 + y * 0.019) * 7;
      } else {
        const cell = hash(Math.floor(x / 5), Math.floor(y / 5));
        relief = (Math.cos(x * 1.25) + Math.cos(y * 1.25)) * 0.07 + cell * 0.12;
        tone = 223 + cell * 19;
      }
      heights[y * size + x] = relief;
      tones[y * size + x] = tone;
    }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4,
        h = heights[y * size + x],
        tone = tones[y * size + x];
      paint.set([tone, tone, tone, 255], i);
      const n = new T.Vector3(
        (heights[y * size + wrap(x - 1, size)] - heights[y * size + wrap(x + 1, size)]) * 0.55,
        (heights[wrap(y - 1, size) * size + x] - heights[wrap(y + 1, size) * size + x]) * 0.55,
        1,
      ).normalize();
      normals.set([128 + n.x * 127, 128 - n.y * 127, n.z * 255, 255], i);
      packed.set([255, 220 + h * 12, 255, 255], i);
    }
  const tex = (data: Uint8Array, srgb = false) => {
    const map = new T.DataTexture(data, size, size);
    map.wrapS = map.wrapT = T.RepeatWrapping;
    map.magFilter = T.LinearFilter;
    map.minFilter = T.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.needsUpdate = true;
    if (srgb) map.colorSpace = T.SRGBColorSpace;
    return map;
  };
  const rough = tex(packed);
  return new T.MeshStandardMaterial({
    map: tex(paint, true),
    normalMap: tex(normals),
    normalScale: new T.Vector2(0.25, -0.25),
    roughnessMap: rough,
    metalnessMap: rough,
    metalness: 0,
    roughness: kind === 'nose' ? 0.67 : 0.93,
    vertexColors: kind !== 'nose',
  });
}
function seamNormals(g: T.BufferGeometry, segments: number, sides: number) {
  const n = g.getAttribute('normal');
  for (let i = 0; i <= segments; i++) {
    const a = i * (sides + 1),
      b = a + sides,
      out = new T.Vector3()
        .fromBufferAttribute(n, a)
        .add(new T.Vector3().fromBufferAttribute(n, b))
        .normalize();
    n.setXYZ(a, out.x, out.y, out.z);
    n.setXYZ(b, out.x, out.y, out.z);
  }
}
function mesh(parent: T.Object3D, g: T.BufferGeometry, m: T.Material, name: string) {
  const result = new T.Mesh(g, m);
  result.name = name;
  result.castShadow = result.receiveShadow = true;
  parent.add(result);
  return result;
}
function oval(parent: T.Object3D, name: string, p: number[], s: number[], m: T.Material) {
  const o = mesh(parent, new T.SphereGeometry(1, 32, 24), m, name);
  o.position.copy(v(p));
  o.scale.copy(v(s));
  return o;
}
function stroke(
  parent: T.Object3D,
  name: string,
  points: number[][],
  radii: number[],
  m: T.Material,
) {
  return mesh(parent, loft(points, radii, radii, 24, 8), m, name);
}
function ear(parent: T.Object3D, side: number, fur: T.Material, inner: T.Material) {
  const group = new T.Group();
  group.name = `Wolf_Ear_${side}`;
  group.position.set(side * 0.115, 0.103, -0.035);
  group.rotation.z = -side * 0.18;
  group.rotation.y = side * 0.28;
  group.userData.motion = 'wolfEar';
  group.userData.side = side;
  parent.add(group);
  const shape = loft(
    [
      [0, -0.025, 0],
      [side * 0.006, 0.12, -0.014],
      [side * 0.013, 0.275, -0.032],
    ],
    [0.074, 0.055, 0.0008],
    [0.048, 0.03, 0.0007],
    36,
    20,
  );
  seamNormals(shape, 36, 20);
  mesh(group, shape, fur, `Wolf_PointedEar_${side}`);
  const g = new T.BufferGeometry();
  g.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [
        -0.059,
        0.016,
        0.034,
        0.06,
        0.016,
        0.034,
        -0.041,
        0.12,
        0.025,
        0.041,
        0.12,
        0.025,
        side * 0.013,
        0.228,
        -0.001,
      ],
      3,
    ),
  );
  g.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
  g.computeVertexNormals();
  mesh(group, g, inner, `Wolf_InnerEar_${side}`);
  return group;
}

function antlers(parent: T.Object3D) {
  const branches: [number[][], number[]][] = [
    [
      [
        [-0.14, 0.15, -0.12],
        [-0.24, 0.3, -0.17],
        [-0.39, 0.49, -0.2],
        [-0.47, 0.78, -0.15],
        [-0.44, 0.98, -0.12],
      ],
      [0.054, 0.044, 0.034, 0.018, 0.0015],
    ],
    [
      [
        [-0.33, 0.43, -0.19],
        [-0.52, 0.54, -0.1],
        [-0.59, 0.68, -0.035],
      ],
      [0.033, 0.018, 0.001],
    ],
    [
      [
        [-0.43, 0.68, -0.17],
        [-0.25, 0.78, -0.2],
        [-0.17, 0.93, -0.16],
      ],
      [0.024, 0.012, 0.001],
    ],
    [
      [
        [-0.24, 0.3, -0.17],
        [-0.35, 0.4, 0.04],
        [-0.39, 0.54, 0.08],
      ],
      [0.03, 0.017, 0.001],
    ],
    [
      [
        [0.14, 0.15, -0.15],
        [0.26, 0.34, -0.22],
        [0.34, 0.56, -0.25],
        [0.37, 0.82, -0.21],
        [0.32, 0.93, -0.16],
      ],
      [0.05, 0.04, 0.031, 0.017, 0.001],
    ],
    [
      [
        [0.29, 0.43, -0.23],
        [0.51, 0.53, -0.18],
        [0.61, 0.68, -0.11],
      ],
      [0.031, 0.018, 0.001],
    ],
    [
      [
        [0.36, 0.7, -0.23],
        [0.51, 0.77, -0.34],
        [0.55, 0.84, -0.33],
      ],
      [0.02, 0.011, 0.003],
    ],
  ];
  const fields = branches.map(([p, r]) =>
    taperedSpineField(
      p.map(([x, y, z]) => [x, 0.15 + (y - 0.15) * 0.73, z]),
      r,
    ),
  );
  const field: Field = (x, y, z) => fields.reduce((d, f) => union(d, f(x, y, z), 0.029), 10);
  const g = sculpt(
    field,
    { step: 0.013, origin: [-0.68, 0.055, -0.44], cells: [104, 78, 46] },
    (p) => new T.Color('#776748').lerp(new T.Color('#b6ab87'), smooth(p.y, 0.13, 0.83)),
  );
  const antler = mesh(parent, g, surfaceMaterial('antler'), 'Wolf_BranchingAntlers');
  return antler;
}

function skinWeights(g: T.BufferGeometry) {
  const p = g.attributes.position,
    joints: number[] = [],
    weights: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      headWeight = smooth(y, 1.32, 1.47) * smooth(-x, 0.38, 0.52),
      neckWeight = (1 - headWeight) * smooth(-x, 0.21, 0.4) * smooth(y, 1.03, 1.43);
    joints.push(0, 1, 2, 0);
    weights.push(1 - headWeight - neckWeight, neckWeight, headWeight, 0);
  }
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
}

export function wolf(root: T.Group) {
  const coat = surfaceMaterial(),
    plainCoat = coat.clone();
  plainCoat.vertexColors = false;
  plainCoat.color.set('#6d7863');
  const leather = surfaceMaterial('nose');
  leather.color.set('#202b24');
  const inner = new T.MeshStandardMaterial({
    color: '#424d40',
    roughness: 0.92,
    side: T.DoubleSide,
  });
  const earCoat = plainCoat.clone();
  earCoat.side = T.FrontSide;
  const rim = new T.MeshStandardMaterial({ color: '#182822', roughness: 0.72 });
  const whisker = new T.MeshStandardMaterial({ color: '#9b9f87', roughness: 0.8 });
  const rig = new T.Bone();
  rig.name = 'Wolf_Anchor';
  root.add(rig);
  const neck = new T.Bone();
  neck.name = 'Wolf_Neck';
  neck.position.set(-0.39, 1.25, 0.06);
  neck.userData.motion = 'wolfNeck';
  rig.add(neck);
  const head = new T.Bone();
  head.name = 'Wolf_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'wolfHead';
  neck.add(head);
  const bones = [rig, neck, head];
  const curve = new T.CatmullRomCurve3(TAIL.map(v));
  for (let i = 0; i < 7; i++) {
    const bone = new T.Bone();
    bone.name = `Wolf_Tail_${i}`;
    const p = curve.getPointAt(i / 6);
    bone.position.copy(p);
    if (i > 0) {
      bone.position.sub(curve.getPointAt((i - 1) / 6));
      bones[bones.length - 1].add(bone);
    } else rig.add(bone);
    if (i > 1) {
      bone.userData.motion = 'wolfTail';
      bone.userData.joint = i;
    }
    bones.push(bone);
  }
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton(bones);
  const field = anatomyField(),
    geometry = sculpt(field);
  skinWeights(geometry);
  const body = new T.SkinnedMesh(geometry, coat);
  body.name = 'Wolf_ContinuousAnatomy';
  body.castShadow = body.receiveShadow = true;
  root.add(body);
  body.bind(skeleton);
  const tailGeo = loft(
    TAIL,
    [0.085, 0.13, 0.135, 0.12, 0.08, 0.004],
    [0.085, 0.13, 0.135, 0.12, 0.08, 0.004],
    90,
    20,
  );
  seamNormals(tailGeo, 90, 20);
  const tailUV = tailGeo.getAttribute('uv');
  for (let i = 0; i < tailUV.count; i++)
    tailUV.setXY(i, tailUV.getX(i) * 0.8, tailUV.getY(i) * 2.8);
  const tj: number[] = [],
    tw: number[] = [];
  for (let i = 0; i < tailGeo.attributes.position.count; i++) {
    const row = i < 91 * 21 ? Math.floor(i / 21) : i === 91 * 21 ? 0 : 90;
    const f = (row / 90) * 6,
      j = Math.min(5, Math.floor(f));
    tj.push(3 + j, 4 + j, 0, 0);
    tw.push(1 - (f - j), f - j, 0, 0);
  }
  tailGeo.setAttribute('skinIndex', new T.Uint16BufferAttribute(tj, 4));
  tailGeo.setAttribute('skinWeight', new T.Float32BufferAttribute(tw, 4));
  const tailColors: number[] = [];
  for (let i = 0; i < tailGeo.attributes.position.count; i++) {
    const t = Math.min(1, Math.floor(i / 21) / 90);
    tailColors.push(
      ...new T.Color('#687664').lerp(new T.Color('#263d32'), smooth(t, 0.3, 0.96)).toArray(),
    );
  }
  tailGeo.setAttribute('color', new T.Float32BufferAttribute(tailColors, 3));
  const tail = new T.SkinnedMesh(tailGeo, coat);
  tail.name = 'Wolf_LivingTail';
  tail.castShadow = tail.receiveShadow = true;
  root.add(tail);
  tail.bind(skeleton);
  const face = new T.Group();
  face.name = 'Wolf_Face';
  face.quaternion.copy(HEAD_ROTATION);
  face.scale.setScalar(1.08);
  head.add(face);
  antlers(face);
  for (const side of [-1, 1]) {
    ear(face, side, earCoat, inner);
    const eye = new T.Group();
    eye.name = `Wolf_Eye_${side}`;
    eye.position.set(side * 0.148, 0.059, 0.143);
    eye.rotation.y = side * 0.59;
    eye.rotation.z = side * 0.14;
    eye.userData.motion = 'wolfBlink';
    face.add(eye);
    oval(eye, `Wolf_EyeSocket_${side}`, [0, 0, 0], [0.052, 0.02, 0.022], rim);
    const amber = new T.MeshStandardMaterial({ color: '#9c8544', roughness: 0.32 });
    oval(eye, `Wolf_Iris_${side}`, [0, -0.001, 0.02], [0.033, 0.016, 0.014], amber);
    oval(eye, `Wolf_Pupil_${side}`, [0, -0.001, 0.035], [0.01, 0.013, 0.004], rim);
    oval(
      eye,
      `Wolf_Catchlight_${side}`,
      [-0.013, 0.009, 0.038],
      [0.006, 0.004, 0.002],
      new T.MeshStandardMaterial({ color: '#e1d9b7', roughness: 0.2 }),
    );
    stroke(
      face,
      `Wolf_Lip_${side}`,
      [
        [side * 0.085, -0.087, 0.409],
        [side * 0.104, -0.075, 0.32],
        [side * 0.12, -0.069, 0.205],
        [side * 0.147, -0.055, 0.135],
      ],
      [0.002, 0.003, 0.002, 0.0007],
      rim,
    );
    for (let i = 0; i < 3; i++)
      stroke(
        face,
        `Wolf_Whisker_${side}_${i}`,
        [
          [side * 0.093, -0.055 + i * 0.012, 0.327],
          [side * 0.146, -0.071 + i * 0.02, 0.347],
          [side * 0.191, -0.085 + i * 0.032, 0.33],
        ],
        [0.0011, 0.0007, 0.0001],
        whisker,
      );
  }
  const nose = oval(face, 'Wolf_LeatherNose', [0, -0.003, 0.444], [0.073, 0.053, 0.046], leather);
  nose.rotation.x = -0.15;
  for (const side of [-1, 1])
    oval(face, `Wolf_Nostril_${side}`, [side * 0.039, 0.001, 0.479], [0.018, 0.01, 0.009], rim);
  stroke(
    face,
    'Wolf_Philtrum',
    [
      [0, -0.036, 0.48],
      [0, -0.067, 0.448],
      [0, -0.089, 0.416],
    ],
    [0.0025, 0.002, 0.001],
    rim,
  );
  // Short fitted toe creases articulate the planted paws.
  for (let foot = 0; foot < PAWS.length; foot++) {
    const [x, y, z] = PAWS[foot];
    for (let i = 0; i < 3; i++)
      stroke(
        root,
        `Wolf_ToeCrease_${foot}_${i}`,
        [
          [x - 0.135, y + 0.033, z + (i - 1) * 0.038],
          [x - 0.1, y + 0.052, z + (i - 1) * 0.038],
          [x - 0.065, y + 0.064, z + (i - 1) * 0.038],
        ],
        [0.0005, 0.0018, 0.0003],
        leather,
      );
  }
  root.updateMatrixWorld(true);
}

export function wolfMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((object) => {
    const motion = object.userData.motion as string | undefined;
    if (!motion?.startsWith('wolf')) return;
    const values: number[] = [],
      rest = object.quaternion.clone();
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'wolfNeck') {
        e.y = Math.sin(a) * 0.032;
        e.z = Math.sin(a - 0.5) * 0.007;
      }
      if (motion === 'wolfHead') {
        e.y = Math.sin(a - 0.65) * 0.065;
        e.x = Math.sin(a - 0.4) * 0.023;
      }
      if (motion === 'wolfTail') {
        const j = object.userData.joint as number;
        e.y = Math.sin(a - j * 0.5) * 0.048 * (j / 6);
        e.z = Math.sin(a - j * 0.5 - 0.6) * 0.025 * (j / 6);
      }
      if (motion === 'wolfEar') {
        const side = object.userData.side as number;
        e.y = Math.sin(a + side * 0.9) ** 7 * 0.085 * side;
      }
      if (motion === 'wolfBlink') {
        const blink = Math.max(0, 1 - Math.abs(time - 4.15) / 0.15);
        values.push(1, 1 - blink * 0.91, 1);
      } else values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const size = motion === 'wolfBlink' ? 3 : 4;
    values.splice(values.length - size, size, ...values.slice(0, size));
    tracks.push(
      motion === 'wolfBlink'
        ? new T.VectorKeyframeTrack(`${object.name}.scale`, times, values)
        : new T.QuaternionKeyframeTrack(`${object.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
