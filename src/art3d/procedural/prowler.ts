import * as T from 'three';
import { loft } from './newStudies';

const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const mix = T.MathUtils.lerp;
const smooth = T.MathUtils.smoothstep;
const HEAD = new T.Vector3(-0.85, 1.045, 0.34);
const HEAD_ROTATION = new T.Quaternion().setFromEuler(new T.Euler(-0.02, -0.41, 0.055));
const TAIL = [
  [0.7, 0.79, -0.17],
  [1.05, 0.65, -0.24],
  [1.16, 0.31, -0.54],
  [0.91, 0.23, -0.8],
  [0.42, 0.25, -0.91],
  [0.18, 0.35, -0.78],
];
const PAWS = [
  [-0.95, 0.165, 0.44],
  [-0.55, 0.165, -0.32],
  [0.54, 0.165, 0.35],
  [0.86, 0.165, -0.24],
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
function limb(points: number[][], radii: number[]): Field {
  const curve = new T.CatmullRomCurve3(points.map(v));
  const samples = Array.from({ length: 15 }, (_, i) => {
    const t = i / 14,
      f = t * (radii.length - 1),
      j = Math.min(radii.length - 2, Math.floor(f));
    return { p: curve.getPoint(t), r: mix(radii[j], radii[j + 1], f - j) };
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
    for (let i = 0; i < samples.length - 1; i++) {
      const a = samples[i],
        b = samples[i + 1],
        dx = b.p.x - a.p.x,
        dy = b.p.y - a.p.y,
        dz = b.p.z - a.p.z;
      const t = T.MathUtils.clamp(
        ((x - a.p.x) * dx + (y - a.p.y) * dy + (z - a.p.z) * dz) / (dx * dx + dy * dy + dz * dz),
        0,
        1,
      );
      d = Math.min(
        d,
        Math.hypot(x - a.p.x - dx * t, y - a.p.y - dy * t, z - a.p.z - dz * t) - mix(a.r, b.r, t),
      );
    }
    return d;
  };
}

/** One quiet, weight-bearing gesture: compressed haunch, low reach, turned skull. */
function anatomyField(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([-0.26, 0.83, -0.025], [0.5, 0.25, 0.24], -0.08), 0.12],
    [ellipsoid([0.18, 0.88, -0.07], [0.44, 0.18, 0.19], -0.08), 0.16],
    [ellipsoid([0.55, 0.84, -0.09], [0.32, 0.24, 0.225], -0.24), 0.13],
    // Scapulae continue into unequal forelegs instead of sitting on a cylindrical trunk.
    [ellipsoid([-0.44, 0.83, 0.145], [0.22, 0.27, 0.135], -0.42), 0.12],
    [ellipsoid([-0.32, 0.81, -0.19], [0.21, 0.26, 0.125], 0.25), 0.11],
    [
      limb(
        [[-0.45, 0.82, 0.18], [-0.4, 0.53, 0.27], [-0.77, 0.27, 0.4], PAWS[0]],
        [0.13, 0.093, 0.061, 0.07],
      ),
      0.1,
    ],
    [
      limb(
        [[-0.34, 0.79, -0.21], [-0.22, 0.48, -0.27], [-0.43, 0.27, -0.31], PAWS[1]],
        [0.115, 0.085, 0.052, 0.065],
      ),
      0.09,
    ],
    [ellipsoid([0.51, 0.67, 0.145], [0.22, 0.265, 0.15], -0.43), 0.11],
    [
      limb(
        [[0.56, 0.72, 0.2], [0.3, 0.49, 0.27], [0.74, 0.31, 0.34], PAWS[2]],
        [0.125, 0.082, 0.048, 0.057],
      ),
      0.08,
    ],
    [ellipsoid([0.67, 0.66, -0.245], [0.21, 0.24, 0.13], -0.22), 0.09],
    [
      limb(
        [[0.7, 0.7, -0.24], [0.49, 0.46, -0.3], [0.99, 0.3, -0.3], PAWS[3]],
        [0.11, 0.076, 0.045, 0.055],
      ),
      0.07,
    ],
    [
      limb(
        [[-0.4, 0.86, 0.04], [-0.57, 0.95, 0.14], [-0.75, 1.01, 0.27], HEAD.toArray()],
        [0.225, 0.195, 0.18, 0.18],
      ),
      0.11,
    ],
  ];
  for (const [px, py, pz] of PAWS) {
    shapes.push([ellipsoid([px - 0.035, py + 0.003, pz], [0.135, 0.075, 0.1]), 0.045]);
    for (let toe = 0; toe < 4; toe++)
      shapes.push([
        ellipsoid(
          [px - 0.11 - 0.02 * Math.sin((toe * Math.PI) / 3), py - 0.001, pz + (toe - 1.5) * 0.046],
          [0.065, 0.06, 0.031],
        ),
        0.018,
      ]);
  }
  const skull = [
    [ellipsoid([0, 0.035, 0], [0.235, 0.19, 0.21]), 0.06],
    [ellipsoid([0, -0.084, 0.085], [0.175, 0.104, 0.16]), 0.06],
    [ellipsoid([0, -0.006, 0.165], [0.098, 0.095, 0.125]), 0.05],
    [ellipsoid([-0.078, -0.076, 0.209], [0.097, 0.078, 0.075]), 0.035],
    [ellipsoid([0.078, -0.076, 0.209], [0.097, 0.078, 0.075]), 0.035],
    [ellipsoid([0, -0.135, 0.192], [0.112, 0.054, 0.074]), 0.025],
    [ellipsoid([-0.115, 0.095, 0.132], [0.088, 0.024, 0.045], -0.19), 0.052],
    [ellipsoid([0.115, 0.095, 0.132], [0.088, 0.024, 0.045], 0.19), 0.052],
  ] as [Field, number][];
  const inverse = new T.Matrix4().makeRotationFromQuaternion(
    HEAD_ROTATION.clone().invert(),
  ).elements;
  return (x, y, z) => {
    let f = 10;
    for (const [field, blend] of shapes) f = union(f, field(x, y, z), blend);
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    if (Math.abs(dx) > 0.52 || Math.abs(dy) > 0.48 || Math.abs(dz) > 0.52)
      return Math.max(f, 0.105 - y);
    const hx = inverse[0] * dx + inverse[4] * dy + inverse[8] * dz;
    const hy = inverse[1] * dx + inverse[5] * dy + inverse[9] * dz;
    const hz = inverse[2] * dx + inverse[6] * dy + inverse[10] * dz;
    let h = 10;
    for (const [field, blend] of skull) h = union(h, field(hx, hy, hz), blend);
    for (const side of [-1, 1]) {
      // Carved orbital recess, under the continuous brow. Eye layers are fitted inside it.
      const eye =
        (Math.hypot((hx - side * 0.142) / 0.076, (hy - 0.061) / 0.031, (hz - 0.192) / 0.069) - 1) *
        0.031;
      h = Math.max(h, -eye);
    }
    return Math.max(union(f, h, 0.055), 0.105 - y);
  };
}

/** Closed implicit skin, with gradient normals instead of visible tetrahedral facets. */
function sculpt(field: Field) {
  const step = 0.021,
    origin = [-1.5, 0.03, -0.65],
    cells = [134, 76, 73];
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

    const local = p.clone().sub(HEAD).applyQuaternion(HEAD_ROTATION.clone().invert());
    const muzzle =
      (1 - smooth(Math.abs(local.x), 0.11, 0.2)) *
      (1 - smooth(local.y, -0.035, 0.01)) *
      smooth(local.z, 0.17, 0.245);
    const belly = (1 - smooth(p.y, 0.37, 0.59)) * (1 - smooth(Math.abs(p.x), 0.2, 0.6));
    const dorsal = smooth(p.y, 0.72, 0.92) * (1 - smooth(Math.abs(p.z + 0.06), 0.1, 0.29));
    const color = new T.Color('#415348')
      .lerp(new T.Color('#233931'), dorsal * 0.63)
      .lerp(new T.Color('#899280'), Math.max(muzzle * 0.58, belly * 0.26));
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

const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function coatMaterial() {
  const size = 512,
    bytes = new Uint8Array(size * size * 4),
    normals = bytes.slice(),
    packed = bytes.slice();
  // Short, tapered fur strokes with subdued broken rosettes. The large planes remain quiet.
  // Staggered, tapering undercoat locks; no per-cell phase jump at the cell borders.
  const height = (x: number, y: number) => {
    const wrap = (n: number, period: number) => ((n % period) + period) % period;
    let value = 0;
    const col = Math.floor(x / 8),
      row = Math.floor(y / 32);
    for (let c = col - 1; c <= col + 1; c++)
      for (let r = row - 1; r <= row + 1; r++) {
        const seed = hash(wrap(c, 64), wrap(r, 16));
        const cx = c * 8 + seed * 5,
          cy = r * 32 + hash(wrap(c + 31, 64), wrap(r, 16)) * 15;
        const t = (y - cy) / (19 + seed * 12);
        if (t < 0 || t > 1) continue;
        const dx = x - cx - Math.sin(t * 2.2 + seed) * 2.2;
        const width = (1.3 + seed) * Math.sin(t * Math.PI) ** 0.45;
        value += Math.exp(-((dx / Math.max(width, 0.1)) ** 2)) * Math.sin(t * Math.PI) ** 0.5;
      }
    return value;
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let spot = 0;
      const col = Math.floor(x / 68),
        row = Math.floor(y / 61);
      for (let c = col - 1; c <= col + 1; c++)
        for (let r = row - 1; r <= row + 1; r++) {
          const seed = hash(c, r),
            cx = c * 68 + seed * 30,
            cy = r * 61 + hash(c + 19, r) * 29;
          const angle = Math.atan2(y - cy, x - cx),
            radius = Math.hypot((x - cx) / (19 + seed * 7), (y - cy) / (16 + seed * 8));
          const ring = Math.exp(
            -(((radius - 0.85 - Math.sin(angle * 3 + seed * 9) * 0.16) / 0.18) ** 2),
          );
          spot = Math.max(
            spot,
            ring * (0.4 + 0.6 * smooth(Math.sin(angle * 2 + seed * 5), -0.8, 0.5)),
          );
        }
      const h = height(x, y),
        tone = 222 + h * 20 - spot * 5 + (hash(x, y) - 0.5) * 8,
        i = (y * size + x) * 4;
      bytes.set([tone, tone, tone, 255], i);
      const n = new T.Vector3(
        (height(x - 1, y) - height(x + 1, y)) * 0.65,
        (height(x, y - 1) - height(x, y + 1)) * 0.65,
        1,
      ).normalize();
      normals.set([128 + n.x * 127, 128 - n.y * 127, n.z * 255, 255], i);
      packed.set([255, 220 + h * 15, 255, 255], i);
    }
  const texture = (data: Uint8Array, color = false) => {
    const map = new T.DataTexture(data, size, size);
    map.wrapS = map.wrapT = T.RepeatWrapping;
    map.magFilter = T.LinearFilter;
    map.minFilter = T.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.needsUpdate = true;
    if (color) map.colorSpace = T.SRGBColorSpace;
    return map;
  };
  const roughness = texture(packed);
  return new T.MeshStandardMaterial({
    map: texture(bytes, true),
    normalMap: texture(normals),
    normalScale: new T.Vector2(0.22, -0.22),
    roughnessMap: roughness,
    metalnessMap: roughness,
    roughness: 0.94,
    metalness: 0,
    vertexColors: true,
  });
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
  group.name = `Prowler_Ear_${side}`;
  group.position.set(side * 0.165, 0.152, -0.025);
  group.rotation.z = -side * 0.19;
  group.rotation.y = side * 0.37;
  group.userData.motion = 'prowlerEar';
  group.userData.side = side;
  parent.add(group);
  const rows = 16,
    cols = 48,
    sheet = (rows + 1) * (cols + 1);
  const points: number[] = [],
    indices: number[] = [],
    colors: number[] = [],
    uv: number[] = [];
  for (let face = 0; face < 2; face++)
    for (let i = 0; i <= rows; i++)
      for (let j = 0; j <= cols; j++) {
        const r = i / rows,
          a = (j / cols) * Math.PI * 2;
        const x = Math.cos(a) * r * 0.083,
          y = 0.018 + Math.sin(a) * r * 0.096;
        const z = face === 0 ? 0.02 + r * r * 0.032 : -0.038 + r * r * 0.08;
        points.push(x, y, z);
        uv.push(x * 3 + 0.5, y * 3 + 0.5);
        colors.push(...new T.Color(face === 0 ? '#4d5e4c' : '#293e34').toArray());
        if (i < rows && j < cols) {
          const k = face * sheet + i * (cols + 1) + j;
          indices.push(
            ...(face === 0
              ? [k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2]
              : [k, k + 1, k + cols + 1, k + 1, k + cols + 2, k + cols + 1]),
          );
        }
      }
  for (let j = 0; j < cols; j++) {
    const a = rows * (cols + 1) + j;
    indices.push(a, a + 1, a + sheet, a + 1, a + sheet + 1, a + sheet);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  mesh(group, g, fur, `Prowler_RoundedPinna_${side}`);
  const bowl = oval(
    group,
    `Prowler_EarBowl_${side}`,
    [0, 0.024, 0.023],
    [0.058, 0.064, 0.008],
    inner,
  );
  bowl.castShadow = false;
  return group;
}

export function prowler(root: T.Group) {
  const coat = coatMaterial(),
    plainCoat = coat.clone();
  plainCoat.vertexColors = false;
  plainCoat.color.set('#3e564b');
  const leather = new T.MeshStandardMaterial({ color: '#202c28', roughness: 0.73 });
  const inner = new T.MeshStandardMaterial({
    color: '#424d40',
    roughness: 0.92,
    side: T.DoubleSide,
  });
  const earCoat = coat.clone();
  earCoat.side = T.FrontSide;
  const rim = new T.MeshStandardMaterial({ color: '#182822', roughness: 0.72 });
  const whisker = new T.MeshStandardMaterial({ color: '#9b9f87', roughness: 0.8 });
  const rig = new T.Bone();
  rig.name = 'Prowler_Anchor';
  root.add(rig);
  const neck = new T.Bone();
  neck.name = 'Prowler_Neck';
  neck.position.set(-0.47, 0.9, 0.12);
  neck.userData.motion = 'prowlerNeck';
  rig.add(neck);
  const head = new T.Bone();
  head.name = 'Prowler_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'prowlerHead';
  neck.add(head);
  const bones = [rig, neck, head];
  const curve = new T.CatmullRomCurve3(TAIL.map(v));
  for (let i = 0; i < 7; i++) {
    const bone = new T.Bone();
    bone.name = `Prowler_Tail_${i}`;
    const p = curve.getPointAt(i / 6);
    bone.position.copy(p);
    if (i > 0) {
      bone.position.sub(curve.getPointAt((i - 1) / 6));
      bones[bones.length - 1].add(bone);
    } else rig.add(bone);
    if (i > 1) {
      bone.userData.motion = 'prowlerTail';
      bone.userData.joint = i;
    }
    bones.push(bone);
  }
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton(bones);
  const geometry = sculpt(anatomyField()),
    positions = geometry.getAttribute('position'),
    joints: number[] = [],
    weights: number[] = [];
  for (let i = 0; i < positions.count; i++) {
    const p = new T.Vector3().fromBufferAttribute(positions, i);
    const headWeight =
      smooth(-p.x, 0.54, 0.67) * smooth(p.y, 0.76, 0.87) * smooth(p.z, -0.06, 0.14);
    const neckWeight =
      (1 - headWeight) *
      smooth(-p.x, 0.32, 0.65) *
      smooth(p.y, 0.68, 0.91) *
      smooth(p.z, -0.1, 0.1);
    joints.push(0, 1, 2, 0);
    weights.push(1 - headWeight - neckWeight, neckWeight, headWeight, 0);
  }
  geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  const body = new T.SkinnedMesh(geometry, coat);
  body.name = 'Prowler_ContinuousAnatomy';
  body.castShadow = body.receiveShadow = true;
  root.add(body);
  body.bind(skeleton);
  const tailGeo = loft(
    TAIL,
    [0.085, 0.077, 0.062, 0.05, 0.04, 0.007],
    [0.085, 0.077, 0.062, 0.05, 0.04, 0.007],
    90,
    20,
  );
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
  const tail = new T.SkinnedMesh(tailGeo, plainCoat);
  tail.name = 'Prowler_LivingTail';
  tail.castShadow = tail.receiveShadow = true;
  root.add(tail);
  tail.bind(skeleton);
  const face = new T.Group();
  face.name = 'Prowler_Face';
  face.quaternion.copy(HEAD_ROTATION);
  head.add(face);
  for (const side of [-1, 1]) {
    ear(face, side, earCoat, inner);
    const eye = new T.Group();
    eye.name = `Prowler_Eye_${side}`;
    eye.position.set(side * 0.142, 0.061, 0.179);
    eye.rotation.y = side * 0.35;
    eye.rotation.z = side * 0.14;
    eye.userData.motion = 'prowlerBlink';
    face.add(eye);
    oval(eye, `Prowler_EyeSocket_${side}`, [0, 0, 0], [0.061, 0.022, 0.023], rim);
    const amber = new T.MeshStandardMaterial({ color: '#9c8544', roughness: 0.32 });
    oval(eye, `Prowler_Iris_${side}`, [0, -0.001, 0.02], [0.039, 0.017, 0.014], amber);
    oval(eye, `Prowler_Pupil_${side}`, [0, -0.001, 0.035], [0.01, 0.014, 0.004], rim);
    oval(
      eye,
      `Prowler_Catchlight_${side}`,
      [-0.013, 0.009, 0.038],
      [0.006, 0.004, 0.002],
      new T.MeshStandardMaterial({ color: '#e1d9b7', roughness: 0.2 }),
    );
    for (let i = 0; i < 3; i++) {
      stroke(
        face,
        `Prowler_Whisker_${side}_${i}`,
        [
          [side * (0.115 + i * 0.008), -0.09 + i * 0.014, 0.256],
          [side * 0.21, -0.1 + i * 0.028, 0.29],
          [side * (0.28 + i * 0.023), -0.11 + i * 0.04, 0.285],
        ],
        [0.0014, 0.001, 0.0003],
        whisker,
      );
      oval(
        face,
        `Prowler_Follicle_${side}_${i}`,
        [side * (0.092 + i * 0.018), -0.091 + i * 0.02, 0.278 - i * 0.007],
        [0.003, 0.0025, 0.002],
        rim,
      );
    }
    stroke(
      face,
      `Prowler_Mouth_${side}`,
      [
        [0, -0.107, 0.279],
        [side * 0.046, -0.121, 0.278],
        [side * 0.096, -0.11, 0.265],
      ],
      [0.0025, 0.002, 0.0006],
      rim,
    );
  }
  // Broad, short feline nose; its central taper joins the philtrum rather than a long muzzle.
  const noseShape = new T.Shape();
  noseShape.moveTo(-0.06, 0.008);
  noseShape.quadraticCurveTo(0, 0.027, 0.06, 0.008);
  noseShape.quadraticCurveTo(0.046, -0.013, 0.01, -0.034);
  noseShape.quadraticCurveTo(0, -0.039, -0.01, -0.034);
  noseShape.quadraticCurveTo(-0.046, -0.013, -0.06, 0.008);
  const nose = mesh(
    face,
    new T.ExtrudeGeometry(noseShape, {
      depth: 0.014,
      bevelEnabled: true,
      bevelSize: 0.005,
      bevelThickness: 0.004,
      bevelSegments: 3,
      steps: 1,
    }),
    leather,
    'Prowler_LeatherNose',
  );
  nose.position.set(0, -0.044, 0.28);
  stroke(
    face,
    'Prowler_Philtrum',
    [
      [0, -0.067, 0.297],
      [0, -0.093, 0.285],
      [0, -0.111, 0.277],
    ],
    [0.003, 0.0025, 0.001],
    rim,
  );
  for (const side of [-1, 1])
    oval(
      face,
      `Prowler_Nostril_${side}`,
      [side * 0.044, -0.048, 0.282],
      [0.012, 0.005, 0.005],
      rim,
    );
  // Small toe creases sit on the fitted paw surface; claws remain sheathed in the stalk.
  for (let foot = 0; foot < PAWS.length; foot++) {
    const [x, y, z] = PAWS[foot];
    for (let i = 0; i < 3; i++)
      stroke(
        root,
        `Prowler_ToeCrease_${foot}_${i}`,
        [
          [x - 0.155, y + 0.034, z + (i - 1) * 0.046],
          [x - 0.115, y + 0.055, z + (i - 1) * 0.046],
          [x - 0.08, y + 0.067, z + (i - 1) * 0.046],
        ],
        [0.0005, 0.0018, 0.0003],
        leather,
      );
  }
  root.updateMatrixWorld(true);
}

export function prowlerMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((object) => {
    const motion = object.userData.motion as string | undefined;
    if (!motion?.startsWith('prowler')) return;
    const values: number[] = [],
      rest = object.quaternion.clone();
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'prowlerNeck') {
        e.y = Math.sin(a) * 0.025;
        e.z = Math.sin(a - 0.5) * 0.007;
      }
      if (motion === 'prowlerHead') {
        e.y = Math.sin(a - 0.45) * 0.06;
        e.x = Math.sin(a - 0.2) * 0.014;
      }
      if (motion === 'prowlerTail') {
        const j = object.userData.joint as number;
        e.y = Math.sin(a - j * 0.5) * 0.048 * (j / 6);
        e.z = Math.sin(a - j * 0.5 - 0.6) * 0.025 * (j / 6);
      }
      if (motion === 'prowlerEar') {
        const side = object.userData.side as number;
        e.y = Math.sin(a + side * 0.9) ** 7 * 0.085 * side;
      }
      if (motion === 'prowlerBlink') {
        const blink = Math.max(0, 1 - Math.abs(time - 3.8) / 0.15);
        values.push(1, 1 - blink * 0.91, 1);
      } else values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const size = motion === 'prowlerBlink' ? 3 : 4;
    values.splice(values.length - size, size, ...values.slice(0, size));
    tracks.push(
      motion === 'prowlerBlink'
        ? new T.VectorKeyframeTrack(`${object.name}.scale`, times, values)
        : new T.QuaternionKeyframeTrack(`${object.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
