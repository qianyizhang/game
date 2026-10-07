import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';
const smooth = T.MathUtils.smoothstep;
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const HEAD = new T.Vector3(0.1, 1.82, -0.015);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(-0.035, 0.24, -0.07, 'YXZ'));
const POLE_BASE = new T.Vector3(-0.29, 0.13, 0.3);
const POLE_AXIS = new T.Vector3(-0.085, 1, -0.078).normalize();
const POLE_TURN = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), POLE_AXIS);
const HANDS = [
  { p: POLE_BASE.clone().addScaledVector(POLE_AXIS, 1.34).toArray(), wrist: [-0.32, 1.39, 0.135] },
  { p: POLE_BASE.clone().addScaledVector(POLE_AXIS, 0.96).toArray(), wrist: [-0.265, 1.05, 0.225] },
];
const FEET = [
  [-0.16, 0.155, 0.22],
  [0.25, 0.155, -0.12],
];

function join(shapes: [Field, number][]): Field {
  return (x, y, z) => {
    let f = 10;
    for (const [s, k] of shapes) f = union(f, s(x, y, z), k);
    return f;
  };
}
// The curve bounds only bypass points farther than any blending influence.
function spine(points: number[][], radii: number[]): Field {
  const field = taperedSpineField(points, radii),
    curve = new T.CatmullRomCurve3(points.map(v));
  const box = new T.Box3()
    .setFromPoints(curve.getPoints(64))
    .expandByScalar(Math.max(...radii) + 0.15);
  return (x, y, z) =>
    x < box.min.x ||
    x > box.max.x ||
    y < box.min.y ||
    y > box.max.y ||
    z < box.min.z ||
    z > box.max.z
      ? 10
      : field(x, y, z);
}

function skullField(): Field {
  return join([
    [ellipsoid([0, 0.015, -0.026], [0.141, 0.172, 0.131]), 0.02],
    [ellipsoid([0, -0.095, 0.014], [0.12, 0.101, 0.11]), 0.019],
    [ellipsoid([0, -0.172, 0.035], [0.075, 0.052, 0.065]), 0.019],
    [ellipsoid([0, -0.018, 0.1], [0.025, 0.084, 0.049]), 0.016],
    [ellipsoid([0, -0.069, 0.131], [0.027, 0.024, 0.031]), 0.015],
    [ellipsoid([0, -0.13, 0.084], [0.068, 0.025, 0.029]), 0.015],
    ...[-1, 1].map(
      (s) =>
        [ellipsoid([s * 0.091, -0.035, 0.039], [0.052, 0.067, 0.043], s * 0.2), 0.017] as [
          Field,
          number,
        ],
    ),
    ...[-1, 1].map(
      (s) =>
        [ellipsoid([s * 0.139, -0.035, -0.006], [0.024, 0.051, 0.029], s * 0.1), 0.012] as [
          Field,
          number,
        ],
    ),
    ...[-1, 1].map(
      (s) =>
        [ellipsoid([s * 0.064, 0.04, 0.082], [0.056, 0.022, 0.032], s * 0.11), 0.015] as [
          Field,
          number,
        ],
    ),
  ]);
}

function anatomy(): Field {
  const torso = join([
    [ellipsoid([0.068, 1.465, 0.015], [0.17, 0.14, 0.126]), 0.027],
    [
      spine([[0.068, 1.43, 0.015], [0.085, 1.64, 0.008], HEAD.toArray()], [0.095, 0.079, 0.082]),
      0.026,
    ],
  ]);
  const skull = skullField(),
    sockets = [-1, 1].map((s) => ellipsoid([s * 0.065, 0.009, 0.11], [0.033, 0.019, 0.035]));
  const inv = new T.Matrix4().makeRotationFromQuaternion(TURN.clone().invert()).elements;
  return (x, y, z) => {
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z,
      hx = inv[0] * dx + inv[4] * dy + inv[8] * dz,
      hy = inv[1] * dx + inv[5] * dy + inv[9] * dz,
      hz = inv[2] * dx + inv[6] * dy + inv[10] * dz;
    let f = union(torso(x, y, z), skull(hx, hy, hz), 0.027);
    for (const socket of sockets) f = -union(-f, socket(hx, hy, hz), 0.005);
    return Math.max(
      f,
      1.372 - y,
      y < 1.64 ? Math.abs(x - 0.068) - (y - 1.375) * 0.69 + 0.003 : -10,
    );
  };
}
function torsoField(): Field {
  return join([
    [ellipsoid([0.005, 1.02, -0.012], [0.215, 0.205, 0.15], -0.02), 0.034],
    [ellipsoid([0.04, 1.25, -0.005], [0.25, 0.28, 0.166], -0.07), 0.033],
    [ellipsoid([0.06, 1.46, 0], [0.285, 0.105, 0.145], -0.05), 0.034],
  ]);
}
function bodiceField(): Field {
  const base = torsoField(),
    arms = [
      spine(
        [[-0.215, 1.445, 0], [-0.397, 1.225, 0.025], HANDS[0].wrist, HANDS[0].p],
        [0.092, 0.077, 0.055, 0.04],
      ),
      spine(
        [
          [0.3, 1.437, -0.005],
          [0.27, 1.095, 0.005],
          [0.14, 1.045, 0.17],
          HANDS[1].wrist,
          HANDS[1].p,
        ],
        [0.094, 0.081, 0.075, 0.052, 0.039],
      ),
    ];
  const axes = HANDS.map((h) => v(h.wrist).sub(v(h.p)).normalize());
  return (x, y, z) => {
    let f = Math.max(base(x, y, z), 0.944 - y);
    for (let i = 0; i < 2; i++) {
      const dx = x - HANDS[i].p[0],
        dy = y - HANDS[i].p[1],
        dz = z - HANDS[i].p[2],
        axis = axes[i];
      const arm = Math.max(arms[i](x, y, z), 0.064 - dx * axis.x - dy * axis.y - dz * axis.z);
      f = union(f, arm, 0.032);
    }
    const opening = Math.max(1.375 - y, Math.abs(x - 0.068) - (y - 1.375) * 0.69, -z - 0.01);
    return Math.max(f, -opening);
  };
}

function broadNormals(g: T.BufferGeometry, field: Field) {
  const p = g.attributes.position,
    n = g.attributes.normal,
    e = 0.012,
    q = new T.Vector3();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    q.set(
      field(x + e, y, z) - field(x - e, y, z),
      field(x, y + e, z) - field(x, y - e, z),
      field(x, y, z + e) - field(x, y, z - e),
    ).normalize();
    n.setXYZ(i, q.x, q.y, q.z);
  }
  return g;
}

function fleshColor(p: T.Vector3) {
  const h = p.clone().sub(HEAD).applyQuaternion(TURN.clone().invert()),
    front = smooth(h.z, 0.03, 0.13);
  const brow =
    Math.exp(-(((h.y - (0.045 + 0.05 * (Math.abs(h.x) - 0.04))) / 0.01) ** 2)) *
    smooth(Math.abs(h.x), 0.026, 0.04) *
    (1 - smooth(Math.abs(h.x), 0.092, 0.11)) *
    smooth(h.z, 0.078, 0.12);
  const lip =
    Math.exp(-(((h.y + 0.133) / 0.012) ** 2)) *
    (1 - smooth(Math.abs(h.x), 0.03, 0.071)) *
    smooth(h.z, 0.07, 0.12);
  return new T.Color('#aa957d')
    .lerp(new T.Color('#d0b899'), front * 0.52)
    .lerp(new T.Color('#766359'), smooth(Math.abs(h.x), 0.06, 0.14) * 0.23)
    .lerp(new T.Color('#3c352d'), brow * 0.86)
    .lerp(new T.Color('#967264'), lip * 0.28);
}

const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function surface(kind: 'skin' | 'cloth' | 'wood' | 'bronze') {
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
      } else if (kind === 'wood') {
        const grainLine = Math.sin(
          u * Math.PI * 94 +
            Math.sin(u * Math.PI * 12) * 1.2 +
            Math.sin(t * Math.PI * 3 + u * Math.PI * 6) * 0.4,
        );
        const broadGrain = Math.sin(u * Math.PI * 34 + Math.sin(t * Math.PI * 3) * 0.4);
        const joinLine =
          Math.exp(-(((u - 0.31) / 0.003) ** 2)) + Math.exp(-(((u - 0.68) / 0.003) ** 2));
        h = grainLine * 0.009 + broadGrain * 0.012 - joinLine * 0.045;
        tone = 239 + grainLine * 1.5 + broadGrain * 2 - joinLine * 9 + (grain - 0.5) * 2;
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
      packed.set([255, (kind === 'bronze' ? 196 : 238) + (tone - 235) * 0.5, 255, 255], i);
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
    roughness: kind === 'wood' ? 0.91 : kind === 'bronze' ? 0.82 : 0.96,
    metalness: kind === 'bronze' ? 0.65 : 0,
  });
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

/** A short open-front coat has a closed lining, uneven hem and fitted waist. */
function coatTails(coat: Field) {
  const legs = trousers();
  const rows = 56,
    cols = 112,
    n = (rows + 1) * (cols + 1),
    pos: number[] = [],
    uv: number[] = [],
    colors: number[] = [],
    idx: number[] = [];
  for (const inner of [false, true])
    for (let j = 0; j <= rows; j++)
      for (let i = 0; i <= cols; i++) {
        const t = j / rows,
          a = 0.24 + (i / cols) * (Math.PI * 2 - 0.48),
          cx = 0.005,
          cz = -0.025;
        const width = 0.218 + 0.064 * (1 - t),
          depth = 0.154 + 0.048 * (1 - t),
          fold = (Math.sin(a * 7 + t * 0.7) * 0.75 + Math.sin(a * 11 - t) * 0.25) * 0.012 * (1 - t);
        const r = fold,
          hem = 0.655 + 0.035 * Math.max(0, Math.cos(a)) + 0.016 * Math.sin(a - 0.5);
        const y = T.MathUtils.lerp(hem, 1.003, t);
        let x = cx + Math.sin(a) * (width + r),
          z = cz + Math.cos(a) * (depth + r);
        if (t > 0.68) {
          let lo = 0,
            hi = 0.45;
          for (let k = 0; k < 17; k++) {
            const m = (lo + hi) / 2;
            if (coat(0.005 + Math.sin(a) * m, Math.max(0.951, y), -0.025 + Math.cos(a) * m) < 0)
              lo = m;
            else hi = m;
          }
          const radius = (lo + hi) / 2 + 0.0065,
            blend = smooth(t, 0.68, 1);
          x = T.MathUtils.lerp(x, 0.005 + Math.sin(a) * radius, blend);
          z = T.MathUtils.lerp(z, -0.025 + Math.cos(a) * radius, blend);
        }
        // Fit around the furthest trouser intersection on this radial line.
        // Start outside both legs so the gap between them cannot masquerade as a surface.
        const dx = x - 0.005,
          dz = z + 0.025,
          baseR = Math.hypot(dx, dz),
          ux = dx / baseR,
          uz = dz / baseR;
        let probe = 0.5;
        while (probe > 0.1 && legs(0.005 + ux * probe, y, -0.025 + uz * probe) > 0) probe -= 0.008;
        if (probe > 0.1) {
          let lo = probe,
            hi = probe + 0.008;
          for (let k = 0; k < 14; k++) {
            const mid = (lo + hi) / 2;
            if (legs(0.005 + ux * mid, y, -0.025 + uz * mid) < 0) lo = mid;
            else hi = mid;
          }
          const required = (lo + hi) / 2 + 0.022,
            h = Math.max(0.03 - Math.abs(baseR - required), 0) / 0.03;
          const fitted = Math.max(baseR, required) + h * h * 0.03 * 0.25;
          x = 0.005 + ux * fitted;
          z = -0.025 + uz * fitted;
        }
        if (inner) {
          // Derive the lining from the finished outer surface so clearance fitting
          // cannot push the inner wall through the outside of the garment.
          const k = (j * (cols + 1) + i) * 3,
            ox = pos[k] - 0.005,
            oz = pos[k + 2] + 0.025,
            or = Math.hypot(ox, oz);
          x = pos[k] - (ox / or) * 0.013;
          z = pos[k + 2] - (oz / or) * 0.013;
        }
        pos.push(x, y, z);
        uv.push((i / cols) * 2, t * 1.5);
        colors.push(
          ...new T.Color('#67645e')
            .lerp(new T.Color('#a19a87'), Math.max(0, Math.cos(a - 0.5)) * 0.18 + fold * 2)
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
  for (let j = 0; j < rows; j++) {
    const k = j * (cols + 1),
      q = k + cols + 1;
    quad(k, q, n + q, n + k);
    quad(k + cols, n + k + cols, n + q + cols, q + cols);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function trousers(): Field {
  return join([
    [ellipsoid([0.005, 0.936, -0.016], [0.18, 0.146, 0.131]), 0.028],
    [
      spine(
        [
          [-0.095, 0.88, 0.025],
          [-0.17, 0.65, 0.15],
          [-0.16, 0.4, 0.17],
        ],
        [0.1, 0.079, 0.056],
      ),
      0.027,
    ],
    [
      spine(
        [
          [0.12, 0.88, -0.015],
          [0.248, 0.65, -0.125],
          [0.25, 0.4, -0.175],
        ],
        [0.1, 0.077, 0.056],
      ),
      0.027,
    ],
  ]);
}

/** Two fitted walls and boundary rims form a solid patch; wrapped seams omit duplicate walls. */
function shell(
  rows: number,
  cols: number,
  point: (u: number, t: number, inner: boolean) => T.Vector3,
  wrapU = false,
) {
  const pos: number[] = [],
    uv: number[] = [],
    idx: number[] = [],
    n = (rows + 1) * (cols + 1);
  for (const inner of [false, true])
    for (let j = 0; j <= rows; j++)
      for (let i = 0; i <= cols; i++) {
        pos.push(...point(i / cols, j / rows, inner).toArray());
        uv.push(i / cols, j / rows);
      }
  const q = (a: number, b: number, c: number, d: number) => idx.push(a, b, c, a, c, d);
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const k = j * (cols + 1) + i,
        r = k + cols + 1;
      q(k, k + 1, r + 1, r);
      q(n + k, n + r, n + r + 1, n + k + 1);
    }
  for (let i = 0; i < cols; i++) {
    q(i, n + i, n + i + 1, i + 1);
    const k = rows * (cols + 1) + i;
    q(k, k + 1, n + k + 1, n + k);
  }
  if (!wrapU)
    for (let j = 0; j < rows; j++) {
      const k = j * (cols + 1),
        r = k + cols + 1;
      q(k, r, n + r, n + k);
      q(k + cols, n + k + cols, n + r + cols, r + cols);
    }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function smoothSeams(g: T.BufferGeometry) {
  const p = g.attributes.position,
    n = g.attributes.normal,
    sums = new Map<string, T.Vector3>();
  const key = (i: number) =>
    [p.getX(i), p.getY(i), p.getZ(i)].map((x) => Math.round(x * 1e6)).join(',');
  for (let i = 0; i < p.count; i++) {
    const k = key(i);
    if (!sums.has(k)) sums.set(k, new T.Vector3());
    sums.get(k)!.add(new T.Vector3().fromBufferAttribute(n, i));
  }
  for (let i = 0; i < p.count; i++) {
    const a = sums.get(key(i))!.clone().normalize();
    n.setXYZ(i, a.x, a.y, a.z);
  }
  return g;
}
function reverse(g: T.BufferGeometry) {
  const idx = g.index!;
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i);
    idx.setX(i, idx.getX(i + 2));
    idx.setX(i + 2, a);
  }
  g.computeVertexNormals();
  return g;
}

function shoulders(root: T.Group, _coat: Field, metal: T.Material) {
  for (const side of [-1, 1]) {
    const center = [side < 0 ? -0.215 : 0.305, side < 0 ? 1.464 : 1.456, 0];
    const outer = ellipsoid(center, [0.145, 0.085, 0.155]),
      inner = ellipsoid(center, [0.132, 0.072, 0.142]);
    const field: Field = (x, y, z) =>
      Math.max(outer(x, y, z), -inner(x, y, z), 1.386 - y, 0.175 - side * (x - 0.045));
    const g = sculptField(
      field,
      { step: 0.0045, origin: [center[0] - 0.18, 1.37, -0.19], cells: [81, 56, 85] },
      () => new T.Color('#ffffff'),
    );
    g.deleteAttribute('color');
    add(root, g, metal, `BannerBearer_Pauldron_${side}`);
  }
}

function grip(root: T.Group, index: number, material: T.Material) {
  const turn = POLE_TURN.clone().multiply(
      new T.Quaternion().setFromAxisAngle(
        new T.Vector3(0, 1, 0),
        index === 0 ? Math.PI : Math.PI * 0.72,
      ),
    ),
    center = v(HANDS[index].p),
    group = new T.Group();
  group.name = `BannerBearer_Grip_${index}`;
  group.position.copy(center);
  group.quaternion.copy(turn);
  root.add(group);
  const wrist = v(HANDS[index].wrist).sub(center).applyQuaternion(turn.clone().invert());
  const field = join([
    [ellipsoid([-0.044, 0, -0.011], [0.027, 0.065, 0.036]), 0.012],
    [
      spine([wrist.toArray(), [-0.03, 0.03, -0.045], [-0.038, 0, -0.025]], [0.03, 0.033, 0.032]),
      0.012,
    ],
    ...Array.from({ length: 4 }, (_, i) => {
      const y = -0.043 + i * 0.028;
      return [
        spine(
          [
            [-0.043, y, -0.022],
            [0.018, y, -0.041],
            [0.043, y, -0.015],
            [0.038, y, 0.025],
            [-0.014, y, 0.035],
          ],
          [0.014, 0.013, 0.012, 0.011, 0.009],
        ),
        0.008,
      ] as [Field, number];
    }),
    [
      spine(
        [
          [-0.048, 0.025, -0.01],
          [-0.056, 0.07, 0.005],
          [-0.026, 0.074, 0.033],
          [0.012, 0.052, 0.039],
        ],
        [0.022, 0.018, 0.014, 0.01],
      ),
      0.013,
    ],
  ]);
  const bounds = new T.Box3()
      .setFromPoints([wrist, v([-0.08, -0.085, -0.08]), v([0.07, 0.105, 0.065])])
      .expandByScalar(0.043),
    step = 0.0045,
    size = bounds.getSize(new T.Vector3());
  add(
    group,
    sculptField(
      field,
      {
        step,
        origin: bounds.min.toArray(),
        cells: size.toArray().map((n) => Math.ceil(n / step)) as [number, number, number],
      },
      () => new T.Color('#b89e81'),
    ),
    material,
    `BannerBearer_HandSkin_${index}`,
  );
}

function eyelid(face: T.Group, side: number, lid: number, material: T.Material) {
  const group = new T.Group();
  group.name = `BannerBearer_Lid_${side}_${lid}`;
  group.position.set(side * 0.065, 0.009, 0.104);
  group.rotation.y = side * 0.2;
  const pivot = new T.Group();
  pivot.name = `BannerBearer_LidPivot_${side}_${lid}`;
  pivot.rotation.x = (-lid * Math.PI) / 2;
  pivot.userData.motion = 'bannerbearerLid';
  pivot.userData.side = lid;
  group.add(pivot);
  face.add(group);
  const f = ellipsoid([0, 0, 0], [0.034, 0.018, 0.025]);
  const g = sculptField(
    (x, y, z) => Math.max(f(x, y, z), -lid * y - 0.0003),
    { step: 0.003, origin: [-0.055, -0.032, -0.033], cells: [37, 22, 23] },
    () => new T.Color('#bba085'),
  );
  add(pivot, g, material, `BannerBearer_LidSkin_${side}_${lid}`);
}

/** Closed cloth lapels follow the coat surface instead of bridging above it. */
function lapel(coat: Field, side: number) {
  const rows = 40,
    cols = 8,
    n = (rows + 1) * (cols + 1),
    pos: number[] = [],
    uv: number[] = [],
    colors: number[] = [],
    idx: number[] = [];
  for (const back of [false, true])
    for (let j = 0; j <= rows; j++)
      for (let i = 0; i <= cols; i++) {
        const t = j / rows,
          u = i / cols,
          y = 1.392 + t * 0.135,
          x = 0.068 + side * ((y - 1.375) * 0.69 + 0.038) + (u - 0.5) * (0.038 + 0.026 * t);
        let z = 0.3;
        while (coat(x, y, z) > 0 && z > -0.1) z -= 0.0015;
        z += back ? -0.003 : 0.005;
        pos.push(x, y, z);
        uv.push(u, t * 3);
        colors.push(
          ...new T.Color('#a49b7f')
            .lerp(new T.Color('#625d51'), (1 - smooth(Math.min(u, 1 - u), 0, 0.2)) * 0.35)
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
  for (let j = 0; j < rows; j++) {
    const k = j * (cols + 1),
      q = k + cols + 1;
    quad(k, q, n + q, n + k);
    quad(k + cols, n + k + cols, n + q + cols, q + cols);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function hair(face: T.Group) {
  const skull = skullField(),
    cap = ellipsoid([0, 0.02, -0.039], [0.147, 0.183, 0.137]);
  const sweep = spine(
    [
      [-0.11, 0.1, 0.04],
      [-0.1, 0.165, 0.045],
      [-0.045, 0.184, 0.078],
      [0.045, 0.154, 0.105],
      [0.105, 0.102, 0.075],
    ],
    [0.018, 0.026, 0.03, 0.023, 0.009],
  );
  const field: Field = (x, y, z) => {
    let line = -0.09 + 0.176 * smooth(z, 0.015, 0.112) + 0.08 * x * smooth(z, 0.02, 0.1);
    const side = smooth(Math.abs(x), 0.108, 0.142) * (1 - smooth(Math.abs(z + 0.01), 0.05, 0.095));
    line = T.MathUtils.lerp(line, Math.max(line, 0), side);
    return Math.max(union(cap(x, y, z), sweep(x, y, z), 0.022), -skull(x, y, z) - 0.002, line - y);
  };
  const g = sculptField(
    field,
    { step: 0.0045, origin: [-0.19, -0.125, -0.2], cells: [86, 86, 87] },
    (p) => new T.Color('#332f2a').lerp(new T.Color('#655647'), smooth(p.y, 0.07, 0.2) * 0.25),
  );
  add(
    face,
    g,
    new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.91 }),
    'BannerBearer_Hair',
  );
}
function standard(root: T.Group, cloth: T.Material, wood: T.Material, metal: T.Material) {
  const pole = new T.Group();
  pole.name = 'BannerBearer_Standard';
  pole.position.copy(POLE_BASE);
  pole.quaternion.copy(POLE_TURN);
  root.add(pole);
  stroke(
    pole,
    'BannerBearer_PoleShaft',
    [
      [0, 0, 0],
      [0, 2.52, 0],
    ],
    [0.024, 0.021],
    wood,
  );
  const ferruleField = ellipsoid([POLE_BASE.x, 0.145, POLE_BASE.z], [0.033, 0.05, 0.033]);
  const fg = sculptField(
    (x, y, z) => Math.max(ferruleField(x, y, z), 0.105 - y),
    { step: 0.004, origin: [POLE_BASE.x - 0.045, 0.09, POLE_BASE.z - 0.045], cells: [24, 28, 24] },
    () => new T.Color('#ffffff'),
  );
  fg.deleteAttribute('color');
  add(root, fg, metal, 'BannerBearer_PoleFerrule');
  const tip = add(pole, new T.ConeGeometry(0.031, 0.112, 8), metal, 'BannerBearer_PoleTip');
  tip.position.y = 2.575;
  for (const y of [2.02, 2.48]) {
    const tie = add(
      pole,
      new T.TorusGeometry(0.028, 0.007, 10, 32),
      cloth,
      `BannerBearer_BannerTie_${y}`,
    );
    tie.rotation.x = Math.PI / 2;
    tie.position.y = y;
    const c = Array.from({ length: tie.geometry.attributes.position.count }, () =>
      new T.Color('#77613c').toArray(),
    ).flat();
    tie.geometry.setAttribute('color', new T.Float32BufferAttribute(c, 3));
  }
  const anchor = new T.Bone();
  anchor.name = 'BannerBearer_FlagAnchor';
  pole.add(anchor);
  const middle = new T.Bone();
  middle.name = 'BannerBearer_FlagMiddle';
  middle.position.set(0.23, 2.24, 0);
  middle.userData.motion = 'bannerbearerFlagMiddle';
  anchor.add(middle);
  const tipBone = new T.Bone();
  tipBone.name = 'BannerBearer_FlagTip';
  tipBone.position.set(0.26, 0, 0);
  tipBone.userData.motion = 'bannerbearerFlagTip';
  middle.add(tipBone);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, middle, tipBone]);
  const cols = 96,
    rows = 64;
  const g = shell(rows, cols, (u, t, inner) => {
    const width = 0.68 * (1 - 0.28 * Math.sin(t * Math.PI) ** 2),
      x = 0.023 + u * width,
      y = 2.495 - 0.47 * t - 0.028 * u + 0.018 * Math.sin(u * Math.PI) * Math.sin(t * Math.PI),
      wave =
        (0.053 * Math.sin(u * 4.6 + t * 0.9) + 0.018 * Math.sin(u * 8 - t * 2)) *
        smooth(u, 0, 0.45);
    return new T.Vector3(x, y, wave + (inner ? -0.0025 : 0.0025));
  });
  reverse(g);
  const uv = g.attributes.uv,
    colors: number[] = [];
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i),
      t = uv.getY(i),
      frame = Math.max(
        (1 - smooth(Math.abs(u - 0.12), 0.005, 0.02)) *
          smooth(t, 0.08, 0.11) *
          (1 - smooth(t, 0.77, 0.81)),
        (1 - smooth(Math.abs(t - 0.78), 0.006, 0.021)) *
          smooth(u, 0.11, 0.15) *
          (1 - smooth(u, 0.65, 0.69)),
      ),
      diamond = Math.abs(Math.abs(u - 0.47) + Math.abs((t - 0.33) * 0.82) - 0.145),
      mark = 1 - smooth(diamond, 0.007, 0.022);
    colors.push(
      ...new T.Color('#887c4c').lerp(new T.Color('#c7b386'), Math.max(frame, mark) * 0.7).toArray(),
    );
  }
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  skin(pole, g, cloth, 'BannerBearer_BannerCloth', skeleton, (p) => {
    const mid = smooth(p.x, 0.075, 0.37),
      tip = smooth(p.x, 0.35, 0.63);
    return [1 - mid, mid * (1 - tip), mid * tip];
  });
}

export function bannerbearer(root: T.Group) {
  const flesh = surface('skin'),
    cloth = surface('cloth'),
    metal = surface('bronze');
  metal.color.set('#a49b7f');
  metal.metalness = 0.5;
  metal.roughness = 0.82;
  const darkMetal = metal.clone();
  darkMetal.color.set('#786f57');
  darkMetal.roughness = 0.87;
  const leather = new T.MeshStandardMaterial({ color: '#554832', roughness: 0.87 });
  const wood = surface('wood');
  wood.color.set('#71614a');
  const anchor = new T.Bone();
  anchor.name = 'BannerBearer_Anchor';
  root.add(anchor);
  const neck = new T.Bone();
  neck.name = 'BannerBearer_Neck';
  neck.position.set(0.085, 1.64, 0.008);
  neck.userData.motion = 'bannerbearerNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'BannerBearer_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'bannerbearerHead';
  neck.add(head);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, neck, head]),
    field = anatomy();
  skin(
    root,
    sculptField(
      field,
      { step: 0.008, origin: [-0.15, 1.33, -0.23], cells: [67, 92, 64] },
      fleshColor,
    ),
    flesh,
    'BannerBearer_FaceNeck',
    skeleton,
    (p) => {
      const h = smooth(p.y, 1.615, 1.66),
        n = smooth(p.y, 1.45, 1.635) * (1 - h);
      return [1 - h - n, n, h];
    },
  );
  const coat = bodiceField(),
    waist = torsoField();
  add(
    root,
    broadNormals(
      sculptField(coat, { step: 0.011, origin: [-0.59, 0.82, -0.25], cells: [106, 78, 78] }, (p) =>
        new T.Color('#747169').lerp(new T.Color('#aca18a'), smooth(p.z, 0, 0.18) * 0.25),
      ),
      coat,
    ),
    cloth,
    'BannerBearer_TunicSleeves',
  );
  add(root, coatTails(waist), cloth, 'BannerBearer_TunicSkirt');
  const legs = trousers();
  add(
    root,
    broadNormals(
      sculptField(
        legs,
        { step: 0.01, origin: [-0.32, 0.3, -0.25], cells: [67, 81, 63] },
        () => new T.Color('#494b43'),
      ),
      legs,
    ),
    cloth,
    'BannerBearer_Trousers',
  );
  shoulders(root, coat, metal);
  for (const side of [-1, 1]) add(root, lapel(coat, side), cloth, `BannerBearer_Lapel_${side}`);
  for (let i = 0; i < 2; i++) {
    const [x, y, z] = FEET[i],
      shoe = join([
        [ellipsoid([x, y, z], [0.067, 0.07, 0.14]), 0.02],
        [ellipsoid([x, y, z + 0.098], [0.052, 0.05, 0.078]), 0.018],
        [ellipsoid([x, y + 0.17, z - 0.055], [0.071, 0.21, 0.075]), 0.021],
      ]);
    add(
      root,
      sculptField(
        (x, y, z) => Math.max(shoe(x, y, z), 0.105 - y),
        { step: 0.008, origin: [x - 0.1, 0.065, z - 0.18], cells: [26, 61, 53] },
        () => new T.Color('#51473b'),
      ),
      cloth,
      `BannerBearer_Boot_${i}`,
    );
  }
  const belt = shell(
    6,
    96,
    (u, t, inner) => {
      const a = u * Math.PI * 2,
        y = 1.004 + t * 0.065;
      let lo = 0,
        hi = 0.32;
      for (let k = 0; k < 18; k++) {
        const r = (lo + hi) / 2;
        if (waist(0.005 + Math.sin(a) * r, y, -0.025 + Math.cos(a) * r) < 0) lo = r;
        else hi = r;
      }
      const r = (lo + hi) / 2 + (inner ? 0.001 : 0.012);
      return v([0.005 + Math.sin(a) * r, y, -0.025 + Math.cos(a) * r]);
    },
    true,
  );
  smoothSeams(belt);
  add(root, belt, leather, 'BannerBearer_Belt');
  oval(root, 'BannerBearer_BeltBuckle', [0.003, 1.036, 0.162], [0.039, 0.028, 0.015], darkMetal);
  const face = new T.Group();
  face.name = 'BannerBearer_Face';
  face.quaternion.copy(TURN);
  head.add(face);
  for (const side of [-1, 1]) {
    const eye = new T.Group();
    eye.name = `BannerBearer_Eye_${side}`;
    eye.position.set(side * 0.065, 0.009, 0.104);
    eye.rotation.y = side * 0.2;
    face.add(eye);
    const eg = new T.SphereGeometry(1, 48, 32),
      p = eg.attributes.position,
      colors: number[] = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i),
        r = Math.hypot(x * 0.029, y * 0.015) / 0.015;
      colors.push(
        ...new T.Color('#b9b5a4')
          .lerp(new T.Color('#657b74'), (1 - smooth(r, 0.42, 0.53)) * smooth(z, 0.4, 0.75))
          .lerp(new T.Color('#242b29'), (1 - smooth(r, 0.16, 0.24)) * smooth(z, 0.6, 0.8))
          .toArray(),
      );
    }
    eg.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    const globe = add(
      eye,
      eg,
      new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.48 }),
      `BannerBearer_Eyeball_${side}`,
    );
    globe.scale.set(0.029, 0.015, 0.022);
    for (const l of [-1, 1]) eyelid(face, side, l, flesh);
  }
  hair(face);
  const hz = (x: number, y: number) => {
    const sample = (z: number) => {
      const p = v([x, y, z]).applyQuaternion(TURN).add(HEAD);
      return field(p.x, p.y, p.z);
    };
    let lo = 0.3;
    while (sample(lo) > 0 && lo > -0.15) lo -= 0.002;
    let hi = lo + 0.002;
    for (let i = 0; i < 14; i++) {
      const m = (lo + hi) / 2;
      if (sample(m) > 0) hi = m;
      else lo = m;
    }
    return (lo + hi) / 2;
  };
  const dark = new T.MeshStandardMaterial({ color: '#574438', roughness: 0.91 });
  for (const side of [-1, 1]) {
    const x = side * 0.016,
      y = -0.079;
    oval(
      face,
      `BannerBearer_Nostril_${side}`,
      [x, y, hz(x, y) + 0.001],
      [0.007, 0.0035, 0.003],
      dark,
    );
  }
  const mouth = Array.from({ length: 25 }, (_, i) => {
    const x = -0.069 + (i / 24) * 0.138,
      y = -0.133 + 0.024 * x;
    return [x, y, hz(x, y) + 0.0007];
  });
  stroke(face, 'BannerBearer_Mouth', mouth, [0.0005, 0.0022, 0.0005], dark);
  for (let i = 0; i < 2; i++) grip(root, i, flesh);
  standard(root, cloth, wood, metal);
  root.updateMatrixWorld(true);
}

export function bannerbearerMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((o) => {
    const motion = o.userData.motion as string | undefined;
    if (!motion?.startsWith('bannerbearer')) return;
    const rest = o.quaternion.clone(),
      values: number[] = [];
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'bannerbearerNeck') {
        e.y = Math.sin(a) * 0.024;
        e.z = Math.sin(a - 0.3) * 0.009;
      }
      if (motion === 'bannerbearerHead') {
        e.y = Math.sin(a - 0.5) * 0.048;
        e.x = Math.sin(a * 2 - 0.2) * 0.012;
      }
      if (motion === 'bannerbearerFlagMiddle') {
        e.y = Math.sin(a) * 0.034;
        e.z = Math.sin(a - 0.4) * 0.013;
      }
      if (motion === 'bannerbearerFlagTip') {
        e.y = Math.sin(a - 0.8) * 0.047;
        e.z = Math.sin(a - 0.6) * 0.019;
      }
      if (motion === 'bannerbearerLid')
        e.x =
          (((o.userData.side as number) * Math.PI) / 2) *
          (1 - smooth(Math.abs(time - 3.85), 0.035, 0.17));
      values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    values.splice(values.length - 4, 4, ...values.slice(0, 4));
    tracks.push(new T.QuaternionKeyframeTrack(`${o.name}.quaternion`, times, values));
  });
  return tracks;
}
