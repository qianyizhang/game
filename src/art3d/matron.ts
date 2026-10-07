import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';
const smooth = T.MathUtils.smoothstep;
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const HEAD = new T.Vector3(-0.055, 1.97, 0.06);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(0.07, -0.25, 0.07, 'YXZ'));
const HANDS = [
  { p: [-0.5, 1.27, 0.42], wrist: [-0.48, 1.28, 0.33], up: [0, 1, 0] },
  { p: [0.21, 1.05, 0.125], wrist: [0.27, 1.13, 0.15], up: [0, 0, 1] },
];
const FEET = [
  [-0.2, 0.155, 0.13],
  [0.16, 0.155, -0.02],
];
const localHead = (p: T.Vector3) => p.clone().sub(HEAD).applyQuaternion(TURN.clone().invert());
function join(shapes: [Field, number][]): Field {
  return (x, y, z) => {
    let f = 10;
    for (const [shape, k] of shapes) f = union(f, shape(x, y, z), k);
    return f;
  };
}
function anatomy(): Field {
  const torso = join([
    [ellipsoid([-0.035, 1.555, 0.005], [0.192, 0.153, 0.119], -0.08), 0.035],
    [
      taperedSpineField(
        [
          [-0.025, 1.57, 0.0],
          [-0.045, 1.73, 0.01],
          [-0.053, 1.84, 0.025],
        ],
        [0.105, 0.08, 0.079],
      ),
      0.04,
    ],
  ]);
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.025, -0.025], [0.146, 0.198, 0.136]), 0.028],
    [ellipsoid([0, -0.11, 0.012], [0.103, 0.104, 0.112]), 0.026],
    [ellipsoid([0, -0.19, 0.048], [0.056, 0.036, 0.068]), 0.02],
    [ellipsoid([0, -0.013, 0.106], [0.025, 0.083, 0.039]), 0.018],
    [ellipsoid([0, -0.07, 0.15], [0.024, 0.022, 0.026]), 0.012],
    [ellipsoid([0, -0.111, 0.097], [0.051, 0.021, 0.026]), 0.013],
    [ellipsoid([0, -0.136, 0.093], [0.047, 0.019, 0.027]), 0.013],
  ];
  for (const side of [-1, 1]) {
    skull.push([
      ellipsoid([side * 0.074, -0.037, 0.046], [0.06, 0.049, 0.049], side * 0.23),
      0.018,
    ]);
    skull.push([
      ellipsoid([side * 0.064, 0.047, 0.076], [0.061, 0.022, 0.038], side * 0.15),
      0.018,
    ]);
    skull.push([ellipsoid([side * 0.022, -0.075, 0.115], [0.017, 0.015, 0.021]), 0.012]);
  }
  const face = join(skull),
    sockets = [-1, 1].map((side) => ellipsoid([side * 0.064, 0.018, 0.111], [0.039, 0.022, 0.034]));
  const inv = new T.Matrix4().makeRotationFromQuaternion(TURN.clone().invert()).elements;
  return (x, y, z) => {
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    const hx = inv[0] * dx + inv[4] * dy + inv[8] * dz,
      hy = inv[1] * dx + inv[5] * dy + inv[9] * dz,
      hz = inv[2] * dx + inv[6] * dy + inv[10] * dz;
    let h = face(hx, hy, hz);
    for (const socket of sockets) h = -union(-h, socket(hx, hy, hz), 0.008);
    const f = union(torso(x, y, z), h, 0.04);
    return y < 1.7 ? Math.max(f, Math.abs(x + 0.035) - (y - 1.455) * 0.65 + 0.01) : f;
  };
}
function bodiceField(): Field {
  const base = join([
    [ellipsoid([0.035, 1.15, -0.025], [0.198, 0.22, 0.142], 0.12), 0.043],
    [ellipsoid([-0.005, 1.4, -0.012], [0.252, 0.28, 0.143], -0.11), 0.05],
    [ellipsoid([-0.03, 1.6, -0.019], [0.3, 0.119, 0.136], -0.07), 0.05],
  ]);
  const sleeves = join([
    [
      taperedSpineField(
        [
          [-0.255, 1.595, 0.0],
          [-0.39, 1.38, 0.015],
          [-0.43, 1.3, 0.15],
          [-0.479, 1.28, 0.335],
        ],
        [0.112, 0.087, 0.077, 0.066],
      ),
      0.05,
    ],
    [
      taperedSpineField(
        [
          [0.235, 1.59, -0.019],
          [0.4, 1.34, -0.015],
          [0.34, 1.24, 0.07],
          [0.27, 1.13, 0.15],
        ],
        [0.112, 0.088, 0.071, 0.062],
      ),
      0.05,
    ],
  ]);
  const wrists = HANDS.map((h) => taperedSpineField([h.p, h.wrist], [0.037, 0.04]));
  const axes = HANDS.map((h) => v(h.wrist).sub(v(h.p)).normalize());
  return (x, y, z) => {
    let f = sleeves(x, y, z);
    const elbow = Math.exp(-(((y - 1.37) / 0.1) ** 2)) * smooth(Math.abs(x), 0.23, 0.34);
    f += elbow * Math.sin(y * 77 + z * 16) * 0.004;
    for (const wrist of wrists) f = Math.max(f, -wrist(x, y, z));
    for (let h = 0; h < HANDS.length; h++) {
      const hand = HANDS[h],
        axis = axes[h];
      const dx = x - hand.p[0],
        dy = y - hand.p[1],
        dz = z - hand.p[2];
      if (dx * dx + dy * dy + dz * dz < 0.16 * 0.16) {
        f = Math.max(f, 0.065 - (dx * axis.x + dy * axis.y + dz * axis.z));
      }
    }
    // Cuff cutters apply to sleeves before joining the torso, so a gathering hand
    // cannot punch a hole in the neighboring garment at the waist.
    f = union(Math.max(base(x, y, z), 1.149 - y), f, 0.05);
    const opening = Math.max(1.455 - y, Math.abs(x + 0.035) - (y - 1.455) * 0.65, -z - 0.01);
    return Math.max(f, -opening);
  };
}
function fleshColor(p: T.Vector3) {
  const h = localHead(p),
    head = smooth(p.y, 1.78, 1.9);
  const front = smooth(h.z, -0.015, 0.12);
  const cheek = Math.exp(-(((h.y + 0.04) / 0.09) ** 2)) * smooth(Math.abs(h.x), 0.04, 0.13);
  return new T.Color('#967b90')
    .lerp(new T.Color('#c4a5b1'), front * 0.66)
    .lerp(new T.Color('#765b76'), cheek * head * 0.36);
}
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function surface(kind: 'skin' | 'cloth' | 'hair' | 'horn' | 'bronze') {
  const size = 512,
    bytes = new Uint8Array(size * size * 4),
    normals = bytes.slice(),
    packed = bytes.slice(),
    heights = new Float32Array(size * size),
    tones = heights.slice();
  const wrap = (n: number) => (n + size) % size;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / size,
        t = y / size,
        grain = hash(x, y),
        broad = Math.sin(u * Math.PI * 8 + Math.sin(t * Math.PI * 6)) * Math.sin(t * Math.PI * 10);
      let h = 0,
        tone = 240;
      if (kind === 'skin') {
        const pore = Math.exp(-(((x % 5) - 2) ** 2 + ((y % 5) - 2) ** 2) / 1.4);
        h = -pore * 0.1 + (grain - 0.5) * 0.04;
        tone = 241 - pore * 4 + (grain - 0.5) * 3;
      } else if (kind === 'cloth') {
        const warp = Math.sin((x * Math.PI) / 2),
          weft = Math.sin((y * Math.PI) / 2);
        const twill = Math.sin(((x + y) * Math.PI) / 8);
        h = warp * weft * 0.1 + twill * 0.025;
        tone = 237 + warp * weft * 3 + twill * 2 + broad * 2;
      } else if (kind === 'hair') {
        const wave = Math.sin(t * Math.PI * 6) * 0.5,
          strand = Math.sin(u * Math.PI * 192 + wave),
          lock = Math.sin(u * Math.PI * 48 + Math.sin(t * Math.PI * 4) * 0.4);
        h = strand * 0.1 + lock * 0.06 + (grain - 0.5) * 0.02;
        tone = 222 + strand * 10 + lock * 10 + broad * 3;
      } else if (kind === 'horn') {
        const ridge = Math.sin(u * Math.PI * 96 + Math.sin(t * Math.PI * 8) * 0.5),
          ring = Math.sin(t * Math.PI * 32 + u * Math.PI * 4);
        h = ridge * 0.1 + ring * 0.035;
        tone = 234 + ridge * 6 + ring * 3;
      } else {
        h = broad * 0.04 + (grain - 0.5) * 0.05;
        tone = 232 + broad * 10 + (grain - 0.5) * 7;
      }
      heights[y * size + x] = h;
      tones[y * size + x] = tone;
    }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4,
        tone = tones[y * size + x];
      bytes.set([tone, tone, tone, 255], i);
      const n = new T.Vector3(
        (heights[y * size + wrap(x - 1)] - heights[y * size + wrap(x + 1)]) * 1.2,
        (heights[wrap(y - 1) * size + x] - heights[wrap(y + 1) * size + x]) * 1.2,
        1,
      ).normalize();
      normals.set([128 + n.x * 127, 128 - n.y * 127, n.z * 255, 255], i);
      packed.set(
        [
          255,
          (kind === 'bronze' ? 196 : kind === 'hair' ? 208 : 238) + (tone - 235) * 0.5,
          255,
          255,
        ],
        i,
      );
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
    vertexColors: kind === 'skin' || kind === 'cloth',
    map: tex(bytes, true),
    normalMap: tex(normals),
    normalScale: new T.Vector2(kind === 'skin' ? 0.12 : 0.25, kind === 'skin' ? -0.12 : -0.25),
    roughnessMap: rough,
    metalnessMap: rough,
    roughness: kind === 'hair' ? 0.79 : kind === 'horn' ? 0.81 : kind === 'bronze' ? 0.68 : 0.96,
    metalness: kind === 'bronze' ? 0.65 : 0,
  });
}
/** Hair grain runs from the crown toward the ends; duplicate only the angular seam. */
function hairUV(g: T.BufferGeometry) {
  const p = g.attributes.position,
    n = g.attributes.normal,
    colors = g.attributes.color,
    index = g.index!;
  const positions: number[] = [],
    normals: number[] = [],
    pigment: number[] = [],
    uv: number[] = [],
    indices: number[] = [],
    cache = new Map<string, number>();
  for (let triangle = 0; triangle < index.count; triangle += 3) {
    const ids = [0, 1, 2].map((k) => index.getX(triangle + k));
    const us = ids.map((i) => (Math.atan2(p.getX(i), -p.getZ(i) - 0.06) + Math.PI) / Math.PI);
    const seam = Math.max(...us) - Math.min(...us) > 1;
    ids.forEach((i, k) => {
      const shift = seam && us[k] < 1 ? 2 : 0,
        key = `${i}:${shift}`;
      let j = cache.get(key);
      if (j === undefined) {
        j = positions.length / 3;
        cache.set(key, j);
        positions.push(p.getX(i), p.getY(i), p.getZ(i));
        normals.push(n.getX(i), n.getY(i), n.getZ(i));
        pigment.push(colors.getX(i), colors.getY(i), colors.getZ(i));
        uv.push(us[k] + shift, p.getY(i) * 1.8);
      }
      indices.push(j);
    });
  }
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(pigment, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  return g;
}
function add(parent: T.Object3D, g: T.BufferGeometry, m: T.Material, name: string) {
  const o = new T.Mesh(g, m);
  o.name = name;
  o.castShadow = o.receiveShadow = true;
  parent.add(o);
  return o;
}
function oval(parent: T.Object3D, name: string, p: number[], s: number[], m: T.Material) {
  const o = add(parent, new T.SphereGeometry(1, 32, 24), m, name);
  o.position.copy(v(p));
  o.scale.copy(v(s));
  return o;
}
function stroke(
  parent: T.Object3D,
  name: string,
  points: number[][],
  radii: number[],
  mat: T.Material,
) {
  return add(parent, loft(points, radii, radii, 48, 20), mat, name);
}
function skin(
  parent: T.Object3D,
  g: T.BufferGeometry,
  m: T.Material,
  name: string,
  skeleton: T.Skeleton,
  weights: (p: T.Vector3) => number[],
) {
  const joints: number[] = [],
    values: number[] = [],
    p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const w = weights(new T.Vector3().fromBufferAttribute(p, i));
    const selected = w
      .map((weight, j) => ({ weight, j }))
      .filter((a) => a.weight > 0)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 4);
    while (selected.length < 4) selected.push({ weight: 0, j: 0 });
    const sum = selected.reduce((a, b) => a + b.weight, 0);
    selected.forEach((a) => {
      joints.push(a.j);
      values.push(a.weight / sum);
    });
  }
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(values, 4));
  const o = new T.SkinnedMesh(g, m);
  o.name = name;
  o.castShadow = o.receiveShadow = true;
  parent.add(o);
  o.bind(skeleton);
  return o;
}
function closeRingNormals(g: T.BufferGeometry, rows: number, cols: number) {
  const normals = g.attributes.normal;
  for (let row = 0; row < rows; row++) {
    const a = row * (cols + 1),
      b = a + cols,
      n = new T.Vector3()
        .fromBufferAttribute(normals, a)
        .add(new T.Vector3().fromBufferAttribute(normals, b))
        .normalize();
    normals.setXYZ(a, n.x, n.y, n.z);
    normals.setXYZ(b, n.x, n.y, n.z);
  }
  return g;
}
/** Sewn skirt: staggered hanging folds, a hip-gather and a thin closed hem. */
function skirt() {
  const rows = 80,
    cols = 128,
    n = (rows + 1) * (cols + 1),
    pos: number[] = [],
    uv: number[] = [],
    colors: number[] = [],
    idx: number[] = [];
  for (const inner of [false, true])
    for (let j = 0; j <= rows; j++)
      for (let i = 0; i <= cols; i++) {
        const t = j / rows,
          a = (i / cols) * Math.PI * 2;
        const xCenter = 0.035 - 0.06 * (1 - t) ** 1.8,
          zCenter = -0.02 - 0.035 * (1 - t);
        const width = 0.191 + 0.19 * (1 - t) ** 1.2 + 0.046 * Math.sin(t * Math.PI) ** 2;
        const depth = 0.135 + 0.14 * (1 - t) ** 1.2;
        const waves =
          Math.sin(a * 9 + t * 0.9) * 0.62 +
          Math.sin(a * 13 - t * 1.5) * 0.25 +
          Math.sin(a * 5 + t * 3) * 0.3;
        const fold = waves * (0.013 + 0.019 * (1 - t));
        const gathered =
          Math.exp(-((Math.atan2(Math.sin(a - 0.72), Math.cos(a - 0.72)) / 0.43) ** 2)) *
          smooth(t, 0.55, 0.97);
        const r = (inner ? -0.013 : 0) + fold * (1 - t * 0.58);
        const x = xCenter + Math.sin(a) * (width + r),
          z = zCenter + Math.cos(a) * (depth + r);
        const y =
          0.125 +
          t * 1.04 +
          0.012 * (1 - t) * Math.sin(a * 5) ** 2 +
          gathered * 0.035 * Math.sin(t * Math.PI);
        pos.push(x, y, z);
        uv.push((i / cols) * 2, t * 2.5);
        colors.push(
          ...new T.Color('#493748')
            .lerp(
              new T.Color('#74576b'),
              Math.max(0, Math.cos(a - 0.3)) * 0.28 + (waves + 1) * 0.04,
            )
            .toArray(),
        );
      }
  const quad = (a: number, b: number, c: number, d: number) => idx.push(a, b, c, a, c, d);
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const k = j * (cols + 1) + i,
        q = k + cols + 1;
      quad(k, k + 1, q + 1, q);
      quad(n + k, n + q, n + q + 1, n + k + 1);
    }
  for (let i = 0; i < cols; i++) {
    quad(i, n + i, n + i + 1, i + 1);
    const k = rows * (cols + 1) + i;
    quad(k, k + 1, n + k + 1, n + k);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // Smooth the duplicated UV seam without changing the thin hem geometry.
  return closeRingNormals(g, (rows + 1) * 2, cols);
}
function hairRibbon(points: number[][], radii: number[]): Field {
  const curve = new T.CatmullRomCurve3(points.map(v));
  const top = points[0][1],
    bottom = points[points.length - 1][1];
  const samples = Array.from({ length: 161 }, (_, i) => {
    const t = i / 160,
      p = curve.getPoint(t),
      f = t * (radii.length - 1),
      j = Math.min(radii.length - 2, Math.floor(f));
    return { x: p.x, z: p.z, r: T.MathUtils.lerp(radii[j], radii[j + 1], f - j) };
  });
  return (x, y, z) => {
    if (y > top + 0.1 || y < bottom - 0.1) return 10;
    const t = T.MathUtils.clamp((top - y) / (top - bottom), 0, 1),
      f = t * 160,
      j = Math.min(159, Math.floor(f)),
      a = samples[j],
      b = samples[j + 1],
      s = f - j;
    const cx = T.MathUtils.lerp(a.x, b.x, s),
      cz = T.MathUtils.lerp(a.z, b.z, s),
      r = T.MathUtils.lerp(a.r, b.r, s);
    const cap = y > top ? (y - top) / r : y < bottom ? (y - bottom) / r : 0;
    return (Math.hypot((x - cx) / r, (z - cz) / (r * 0.72), cap) - 1) * r * 0.72;
  };
}
function hairField(): Field {
  const cap = ellipsoid([0, 0.03, -0.062], [0.158, 0.216, 0.152]);
  const paths: [Field, number][] = [];
  for (const side of [-1, 1]) {
    paths.push([
      hairRibbon(
        [
          [side * 0.13, 0.12, -0.071],
          [side * 0.172, -0.08, -0.028],
          [side * 0.162, -0.31, 0.0],
          [side * 0.23, -0.55, -0.033],
          [side * 0.235, -0.65, -0.072],
        ],
        [0.066, 0.068, 0.065, 0.047, 0.005],
      ),
      0.033,
    ]);
    paths.push([
      hairRibbon(
        [
          [side * 0.09, 0.12, -0.125],
          [side * 0.14, -0.15, -0.139],
          [side * 0.125, -0.42, -0.1],
          [side * 0.15, -0.65, -0.145],
        ],
        [0.073, 0.07, 0.058, 0.007],
      ),
      0.039,
    ]);
  }
  const locks = join([
    [ellipsoid([0, -0.25, -0.15], [0.155, 0.33, 0.068]), 0.04],
    [ellipsoid([0.015, -0.46, -0.14], [0.163, 0.145, 0.057]), 0.035],
    ...paths,
  ]);
  return (x, y, z) => {
    // Cut the forehead opening into the crown; broad side locks supply continuous mass.
    const opening = Math.max(0.06 - z, y - 0.155 - 0.03 * Math.sin(x * 17));
    const c = Math.max(cap(x, y, z), -opening);
    return union(c, locks(x, y, z), 0.026);
  };
}
function hand(root: T.Group, index: number, flesh: T.Material, nail: T.Material, cuff: T.Material) {
  const h = HANDS[index],
    group = new T.Group();
  group.name = `Matron_Hand_${index}`;
  group.position.copy(v(h.p));
  const y = v(h.wrist).sub(v(h.p)).normalize(),
    z = v(h.up).addScaledVector(y, -v(h.up).dot(y)).normalize(),
    x = new T.Vector3().crossVectors(y, z).normalize();
  group.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z));
  root.add(group);
  const cuffGeometry = crownGeometry(),
    cp = cuffGeometry.attributes.position;
  for (let row = 0; row < 4; row++)
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2,
        inside = row >= 2,
        top = row % 2 === 1,
        r = inside ? 0.04 : 0.061;
      cp.setXYZ(row * 129 + i, Math.sin(a) * r, top ? 0.079 : 0.06, Math.cos(a) * r);
    }
  cuffGeometry.computeVertexNormals();
  closeRingNormals(cuffGeometry, 4, 128);
  add(group, cuffGeometry, cuff, `Matron_Cuff_${index}`);
  const shapes: [Field, number][] = [
    [ellipsoid([0, 0.009, 0], [0.05, 0.066, 0.026]), 0.016],
    [
      taperedSpineField(
        [
          [0, 0.12, 0],
          [0, 0.058, 0],
          [0, 0.02, 0],
        ],
        [0.032, 0.035, 0.037],
      ),
      0.015,
    ],
  ];
  const tips: number[][] = [];
  for (let finger = 0; finger < 4; finger++) {
    const fx = (finger - 1.5) * 0.024,
      length = [0.092, 0.12, 0.126, 0.105][finger],
      curl = index === 0 ? 0.025 : 0.053;
    const path = [
      [fx, -0.024, 0],
      [fx * 1.12, -0.073, 0.003],
      [fx * 1.13, -length, 0.012],
      [fx * 1.02, -length - 0.012, curl],
    ];
    shapes.push([taperedSpineField(path, [0.014, 0.0125, 0.0105, 0.008]), 0.006]);
    tips.push(path[3]);
  }
  const thumb = [
    [-0.04, 0.025, 0.004],
    [-0.072, -0.002, 0.005],
    [-0.081, -0.032, 0.02],
    [-0.069, -0.048, 0.04],
  ];
  shapes.push([taperedSpineField(thumb, [0.022, 0.017, 0.014, 0.008]), 0.013]);
  tips.push(thumb[3]);
  add(
    group,
    sculptField(
      join(shapes),
      { step: 0.0048, origin: [-0.106, -0.168, -0.049], cells: [44, 68, 29] },
      () => new T.Color('#a58a9e'),
    ),
    flesh,
    `Matron_HandSkin_${index}`,
  );
  for (let i = 0; i < tips.length; i++) {
    const [tx, ty, tz] = tips[i];
    oval(
      group,
      `Matron_Nail_${index}_${i}`,
      [tx, ty + 0.001, tz - 0.007],
      [0.0055, 0.01, 0.0025],
      nail,
    );
  }
}
function crownGeometry() {
  const cols = 128,
    pos: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  for (let row = 0; row < 4; row++)
    for (let i = 0; i <= cols; i++) {
      const a = (i / cols) * Math.PI * 2,
        inner = row >= 2,
        top = row % 2 === 1;
      const da = (b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
      const peak =
        Math.max(0, 1 - da(0) / 0.33) * 0.056 +
        Math.max(0, 1 - da(0.75) / 0.25) * 0.036 +
        Math.max(0, 1 - da(-0.75) / 0.25) * 0.04;
      const r = inner ? -0.008 : 0;
      pos.push(
        Math.sin(a) * (0.149 + r),
        0.152 + Math.cos(a) * 0.006 + (top ? 0.027 + peak : 0),
        -0.025 + Math.cos(a) * (0.135 + r),
      );
      uv.push(i / cols, top ? 1 : 0);
    }
  const n = cols + 1,
    q = (a: number, b: number, c: number, d: number) => idx.push(a, b, c, a, c, d);
  for (let i = 0; i < cols; i++) {
    q(i, i + 1, n + i + 1, n + i);
    q(2 * n + i, 3 * n + i, 3 * n + i + 1, 2 * n + i + 1);
    q(n + i, n + i + 1, 3 * n + i + 1, 3 * n + i);
    q(i, 2 * n + i, 2 * n + i + 1, i + 1);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return closeRingNormals(g, 4, 128);
}
function waistBand() {
  const g = crownGeometry(),
    p = g.attributes.position,
    n = 129;
  for (let row = 0; row < 4; row++)
    for (let i = 0; i < n; i++) {
      const a = (i / (n - 1)) * Math.PI * 2,
        inner = row >= 2,
        top = row % 2 === 1;
      p.setXYZ(
        row * n + i,
        0.035 + Math.sin(a) * (inner ? 0.19 : 0.211),
        top ? 1.175 : 1.135,
        -0.025 + Math.cos(a) * (inner ? 0.132 : 0.156),
      );
    }
  g.computeVertexNormals();
  return closeRingNormals(g, 4, 128);
}
export function matron(root: T.Group) {
  const flesh = surface('skin'),
    cloth = surface('cloth'),
    hair = surface('hair'),
    horn = surface('horn'),
    bronze = surface('bronze');
  hair.color.set('#49384e');
  horn.color.set('#c6b59e');
  bronze.color.set('#a78c62');
  const dark = new T.MeshStandardMaterial({ color: '#402e43', roughness: 0.74 });
  const anchor = new T.Bone();
  anchor.name = 'Matron_Anchor';
  root.add(anchor);
  const neck = new T.Bone();
  neck.name = 'Matron_Neck';
  neck.position.set(-0.045, 1.73, 0.01);
  neck.userData.motion = 'matronNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'Matron_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'matronHead';
  neck.add(head);
  const hairBones = [-1, 1].map((side) => {
    const b = new T.Bone();
    b.name = `Matron_HairTip_${side}`;
    b.position.set(side * 0.22, 1.44, -0.03);
    b.userData.motion = 'matronHair';
    b.userData.side = side;
    anchor.add(b);
    return b;
  });
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, neck, head]),
    field = anatomy();
  skin(
    root,
    sculptField(
      field,
      { step: 0.008, origin: [-0.35, 1.38, -0.24], cells: [77, 108, 68] },
      fleshColor,
    ),
    flesh,
    'Matron_ContinuousFaceNeck',
    skeleton,
    (p) => {
      const h = smooth(p.y, 1.78, 1.87),
        n = smooth(p.y, 1.62, 1.8) * (1 - h);
      return [1 - h - n, n, h];
    },
  );
  const bodice = bodiceField();
  add(
    root,
    sculptField(bodice, { step: 0.01, origin: [-0.66, 0.88, -0.24], cells: [124, 90, 75] }, (p) =>
      new T.Color('#594353').lerp(new T.Color('#72576a'), smooth(p.z, 0, 0.16) * 0.3),
    ),
    cloth,
    'Matron_BodiceSleeves',
  );
  add(root, skirt(), cloth, 'Matron_FoldedSkirt');
  const waist = cloth.clone();
  waist.vertexColors = false;
  waist.color.set('#57404f');
  add(root, waistBand(), waist, 'Matron_WaistSeam');
  for (let f = 0; f < 2; f++) {
    const [x, y, z] = FEET[f];
    const shoeField = join([
      [ellipsoid([x, y, z], [0.066, 0.07, 0.145]), 0.025],
      [ellipsoid([x, y - 0.001, z + 0.108], [0.054, 0.05, 0.081]), 0.02],
      [ellipsoid([x, y + 0.089, z - 0.07], [0.055, 0.12, 0.066]), 0.025],
    ]);
    add(
      root,
      sculptField(
        (x, y, z) => Math.max(shoeField(x, y, z), 0.105 - y),
        { step: 0.008, origin: [x - 0.1, 0.065, z - 0.2], cells: [27, 45, 57] },
        () => new T.Color('#342c3c'),
      ),
      cloth,
      `Matron_Boot_${f}`,
    );
  }
  const face = new T.Group();
  face.name = 'Matron_Face';
  face.quaternion.copy(TURN);
  head.add(face);
  const hz = (x: number, y: number) => {
    const sample = (z: number) => {
      const p = v([x, y, z]).applyQuaternion(TURN).add(HEAD);
      return field(p.x, p.y, p.z);
    };
    let inside = 0.35;
    while (sample(inside) > 0 && inside > -0.15) inside -= 0.003;
    let outside = inside + 0.003;
    for (let i = 0; i < 15; i++) {
      const mid = (inside + outside) / 2;
      if (sample(mid) > 0) outside = mid;
      else inside = mid;
    }
    return (inside + outside) / 2;
  };
  for (const side of [-1, 1]) {
    stroke(
      face,
      `Matron_Horn_${side}`,
      [
        [side * 0.123, 0.13, -0.061],
        [side * 0.263, 0.176, -0.07],
        [side * 0.326, 0.265, -0.12],
        [side * 0.275, side < 0 ? 0.367 : 0.405, -0.16],
      ],
      [0.048, 0.044, 0.025, 0.0008],
      horn,
    );
    const eye = new T.Group();
    eye.name = `Matron_Eye_${side}`;
    eye.position.set(side * 0.064, 0.018, 0.105);
    eye.rotation.y = side * 0.2;
    eye.rotation.z = side * 0.12;
    eye.userData.motion = 'matronBlink';
    face.add(eye);
    oval(eye, `Matron_Orbit_${side}`, [0, 0, 0], [0.034, 0.015, 0.015], dark);
    oval(
      eye,
      `Matron_Iris_${side}`,
      [0, 0, 0.012],
      [0.023, 0.011, 0.007],
      new T.MeshStandardMaterial({ color: '#cfac76', roughness: 0.44 }),
    );
    oval(eye, `Matron_Pupil_${side}`, [0, 0, 0.018], [0.0055, 0.01, 0.0025], dark);
    const nx = side * 0.018,
      ny = -0.081;
    oval(face, `Matron_Nostril_${side}`, [nx, ny, hz(nx, ny) + 0.001], [0.006, 0.003, 0.003], dark);
  }
  const mouth = Array.from({ length: 25 }, (_, i) => {
    const x = -0.047 + (i / 24) * 0.094,
      y = -0.122 + Math.abs(x) * 0.08;
    return [x, y, hz(x, y) + 0.001];
  });
  stroke(face, 'Matron_Mouth', mouth, [0.0006, 0.002, 0.0006], dark);
  add(face, crownGeometry(), bronze, 'Matron_Crown');
  const hg = sculptField(
    hairField(),
    { step: 0.01, origin: [-0.35, -0.74, -0.32], cells: [70, 99, 54] },
    () => new T.Color('#352b40'),
  );
  hairUV(hg);
  // glTF always exports COLOR_0 when present; the live hair uses only its material tint.
  hg.deleteAttribute('color');
  hg.applyMatrix4(new T.Matrix4().compose(HEAD, TURN, new T.Vector3(1, 1, 1)));
  skin(root, hg, hair, 'Matron_Hair', new T.Skeleton([anchor, neck, head, ...hairBones]), (p) => {
    const h = localHead(p),
      top = smooth(h.y, -0.58, -0.24);
    return [0, 0, top, h.x < 0 ? 1 - top : 0, h.x >= 0 ? 1 - top : 0];
  });
  for (let i = 0; i < 2; i++) hand(root, i, flesh, dark, waist);
  // Gold follows the V opening rather than floating in front of the robe.
  const frontZ = (x: number, y: number) => {
    let z = 0.3;
    while (bodice(x, y, z) > 0 && z > -0.2) z -= 0.002;
    return z + 0.003;
  };
  for (const side of [-1, 1]) {
    const points = Array.from({ length: 26 }, (_, i) => {
      const y = 1.465 + (i / 25) * 0.215,
        x = -0.035 + side * ((y - 1.455) * 0.65 + 0.012);
      return [x, y, frontZ(x, y)];
    });
    stroke(root, `Matron_CollarEdge_${side}`, points, [0.004, 0.004, 0.002], bronze);
  }
  const pendant = add(root, new T.OctahedronGeometry(1), bronze, 'Matron_Pendant');
  pendant.position.set(-0.035, 1.472, 0.146);
  pendant.scale.set(0.026, 0.047, 0.009);
  pendant.geometry.computeVertexNormals();
  root.updateMatrixWorld(true);
}
export function matronMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((o) => {
    const motion = o.userData.motion as string | undefined;
    if (!motion?.startsWith('matron')) return;
    const rest = o.quaternion.clone(),
      values: number[] = [],
      side = o.userData.side as number;
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'matronNeck') {
        e.y = Math.sin(a) * 0.017;
        e.z = Math.sin(a - 0.4) * 0.008;
      }
      if (motion === 'matronHead') {
        e.y = Math.sin(a - 0.5) * 0.033;
        e.x = Math.sin(a * 2 - 0.3) * 0.009;
      }
      if (motion === 'matronHair') {
        e.z = Math.sin(a - 0.9 + side * 0.5) * 0.018 * side;
        e.x = Math.sin(a - 0.6) * 0.012;
      }
      if (motion === 'matronBlink') {
        const b = Math.max(0, 1 - Math.abs(time - 3.85) / 0.16);
        values.push(1, 1 - b * 0.94, 1);
      } else values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const size = motion === 'matronBlink' ? 3 : 4;
    values.splice(values.length - size, size, ...values.slice(0, size));
    tracks.push(
      motion === 'matronBlink'
        ? new T.VectorKeyframeTrack(`${o.name}.scale`, times, values)
        : new T.QuaternionKeyframeTrack(`${o.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
