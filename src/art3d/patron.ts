import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';
const smooth = T.MathUtils.smoothstep;
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const HEAD = new T.Vector3(0.09, 1.83, 0.12);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(-0.025, 0.28, -0.07, 'YXZ'));
const HANDS = [
  { p: [-0.61, 1.26, 0.32], wrist: [-0.54, 1.24, 0.21], up: [0, 1, 0.4] },
  { p: [0.1, 1.13, 0.365], wrist: [0.2, 1.15, 0.31], up: [0, 0, 1] },
];
const FEET = [
  [-0.245, 0.155, 0.175],
  [0.235, 0.155, -0.03],
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
function anatomy(): Field {
  const torso = join([
    [ellipsoid([0.073, 1.455, 0.02], [0.245, 0.16, 0.15], 0.08), 0.04],
    [spine([[0.073, 1.43, 0.02], [0.08, 1.65, 0.055], HEAD.toArray()], [0.13, 0.113, 0.114]), 0.04],
  ]);
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.025, -0.025], [0.184, 0.205, 0.16]), 0.024],
    [ellipsoid([0, -0.116, 0.018], [0.153, 0.127, 0.133]), 0.025],
    [ellipsoid([0, -0.216, 0.04], [0.094, 0.064, 0.073]), 0.024],
    [ellipsoid([0, -0.035, 0.125], [0.032, 0.112, 0.061]), 0.018],
    [ellipsoid([0, -0.098, 0.165], [0.031, 0.032, 0.036]), 0.018],
    [ellipsoid([0, -0.157, 0.092], [0.087, 0.032, 0.038]), 0.021],
  ];
  for (const s of [-1, 1]) {
    skull.push([ellipsoid([s * 0.11, -0.057, 0.035], [0.066, 0.087, 0.05], s * 0.27), 0.019]);
    skull.push([ellipsoid([s * 0.077, 0.047, 0.092], [0.067, 0.026, 0.04], s * 0.18), 0.017]);
    skull.push([ellipsoid([s * 0.104, -0.135, 0.009], [0.047, 0.074, 0.058], -s * 0.27), 0.02]);
  }
  const face = join(skull),
    sockets = [-1, 1].map((s) => ellipsoid([s * 0.082, 0.009, 0.141], [0.047, 0.027, 0.044]));
  const inv = new T.Matrix4().makeRotationFromQuaternion(TURN.clone().invert()).elements;
  return (x, y, z) => {
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    const hx = inv[0] * dx + inv[4] * dy + inv[8] * dz,
      hy = inv[1] * dx + inv[5] * dy + inv[9] * dz,
      hz = inv[2] * dx + inv[6] * dy + inv[10] * dz;
    let f = union(torso(x, y, z), face(hx, hy, hz), 0.035);
    for (const socket of sockets) f = -union(-f, socket(hx, hy, hz), 0.007);
    return Math.max(f, 1.374 - y, y < 1.66 ? Math.abs(x - 0.073) - (y - 1.38) * 0.72 + 0.003 : -10);
  };
}
function bodiceField(): Field {
  const base = join([
    [ellipsoid([0.014, 1.0, -0.015], [0.263, 0.23, 0.179], 0.08), 0.043],
    [ellipsoid([0.049, 1.27, 0], [0.331, 0.33, 0.205], 0.1), 0.047],
    [ellipsoid([0.074, 1.516, 0.005], [0.382, 0.129, 0.173], 0.065), 0.047],
  ]);
  const sleeves = join([
    [
      spine(
        [[-0.25, 1.5, 0], [-0.46, 1.21, 0.05], [-0.48, 1.2, 0.11], HANDS[0].wrist, HANDS[0].p],
        [0.126, 0.105, 0.087, 0.069, 0.045],
      ),
      0.045,
    ],
    [
      spine(
        [
          [0.345, 1.495, 0.005],
          [0.49, 1.255, 0.035],
          [0.4, 1.16, 0.18],
          HANDS[1].wrist,
          HANDS[1].p,
        ],
        [0.122, 0.103, 0.089, 0.067, 0.045],
      ),
      0.044,
    ],
  ]);
  const axes = HANDS.map((h) => v(h.wrist).sub(v(h.p)).normalize());
  return (x, y, z) => {
    let a = sleeves(x, y, z);
    for (let h = 0; h < 2; h++) {
      const dx = x - HANDS[h].p[0],
        dy = y - HANDS[h].p[1],
        dz = z - HANDS[h].p[2],
        axis = axes[h];
      if (dx * dx + dy * dy + dz * dz < 0.18 ** 2)
        a = Math.max(a, 0.072 - (dx * axis.x + dy * axis.y + dz * axis.z));
    }
    const f = union(Math.max(base(x, y, z), 0.944 - y), a, 0.044);
    const opening = Math.max(1.38 - y, Math.abs(x - 0.073) - (y - 1.38) * 0.72, -z - 0.01);
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
  const h = p.clone().sub(HEAD).applyQuaternion(TURN.clone().invert());
  const front = smooth(h.z, 0.015, 0.14),
    cheek = Math.exp(-(((h.y + 0.055) / 0.09) ** 2)) * smooth(Math.abs(h.x), 0.045, 0.14);
  return new T.Color('#81758f')
    .lerp(new T.Color('#b8a3bc'), front * 0.67)
    .lerp(new T.Color('#5d5069'), cheek * 0.3)
    .lerp(
      new T.Color('#675773'),
      smooth(-h.y, 0.17, 0.23) *
        (1 - smooth(Math.abs(h.x), 0.045, 0.095)) *
        smooth(h.z, 0.035, 0.08) *
        0.55,
    );
}
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function surface(kind: 'skin' | 'cloth' | 'horn' | 'bronze') {
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
    roughness: kind === 'horn' ? 0.81 : kind === 'bronze' ? 0.68 : 0.96,
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
          cx = 0.014 + 0.035 * (1 - t),
          cz = -0.025;
        const width = 0.256 + 0.14 * (1 - t),
          depth = 0.179 + 0.11 * (1 - t),
          fold = (Math.sin(a * 7 + t * 0.7) * 0.75 + Math.sin(a * 11 - t) * 0.25) * 0.012 * (1 - t);
        const r = fold,
          hem = 0.53 + 0.13 * Math.max(0, Math.cos(a)) + 0.025 * Math.sin(a - 0.5);
        const y = T.MathUtils.lerp(hem, 1.003, t);
        let x = cx + Math.sin(a) * (width + r),
          z = cz + Math.cos(a) * (depth + r);
        if (t > 0.68) {
          let lo = 0,
            hi = 0.45;
          for (let k = 0; k < 17; k++) {
            const m = (lo + hi) / 2;
            if (coat(0.014 + Math.sin(a) * m, Math.max(0.951, y), -0.025 + Math.cos(a) * m) < 0)
              lo = m;
            else hi = m;
          }
          const radius = (lo + hi) / 2 + 0.0065,
            blend = smooth(t, 0.68, 1);
          x = T.MathUtils.lerp(x, 0.014 + Math.sin(a) * radius, blend);
          z = T.MathUtils.lerp(z, -0.025 + Math.cos(a) * radius, blend);
        }
        // Fit around the furthest trouser intersection on this radial line.
        // Start outside both legs so the gap between them cannot masquerade as a surface.
        const dx = x - 0.014,
          dz = z + 0.025,
          baseR = Math.hypot(dx, dz),
          ux = dx / baseR,
          uz = dz / baseR;
        let probe = 0.5;
        while (probe > 0.1 && legs(0.014 + ux * probe, y, -0.025 + uz * probe) > 0) probe -= 0.008;
        if (probe > 0.1) {
          let lo = probe,
            hi = probe + 0.008;
          for (let k = 0; k < 14; k++) {
            const mid = (lo + hi) / 2;
            if (legs(0.014 + ux * mid, y, -0.025 + uz * mid) < 0) lo = mid;
            else hi = mid;
          }
          const required = (lo + hi) / 2 + 0.022,
            h = Math.max(0.03 - Math.abs(baseR - required), 0) / 0.03;
          const fitted = Math.max(baseR, required) + h * h * 0.03 * 0.25;
          x = 0.014 + ux * fitted;
          z = -0.025 + uz * fitted;
        }
        if (inner) {
          // Derive the lining from the finished outer surface so clearance fitting
          // cannot push the inner wall through the outside of the garment.
          const k = (j * (cols + 1) + i) * 3,
            ox = pos[k] - 0.014,
            oz = pos[k + 2] + 0.025,
            or = Math.hypot(ox, oz);
          x = pos[k] - (ox / or) * 0.013;
          z = pos[k + 2] - (oz / or) * 0.013;
        }
        pos.push(x, y, z);
        uv.push((i / cols) * 2, t * 1.5);
        colors.push(
          ...new T.Color('#443b50')
            .lerp(new T.Color('#73657f'), Math.max(0, Math.cos(a - 0.5)) * 0.18 + fold * 2)
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
    [ellipsoid([0.012, 0.946, -0.016], [0.208, 0.166, 0.148]), 0.037],
    [
      spine(
        [
          [-0.1, 0.88, 0.01],
          [-0.235, 0.64, 0.1],
          [-0.24, 0.41, 0.125],
        ],
        [0.128, 0.096, 0.069],
      ),
      0.032,
    ],
    [
      spine(
        [
          [0.135, 0.87, -0.025],
          [0.252, 0.64, -0.045],
          [0.236, 0.41, -0.075],
        ],
        [0.125, 0.095, 0.068],
      ),
      0.032,
    ],
  ]);
}
function hand(root: T.Group, index: number, flesh: T.Material, nail: T.Material) {
  const h = HANDS[index],
    group = new T.Group();
  group.name = `Patron_Hand_${index}`;
  group.position.copy(v(h.p));
  const y = v(h.wrist).sub(v(h.p)).normalize(),
    z = v(h.up).addScaledVector(y, -v(h.up).dot(y)).normalize(),
    x = new T.Vector3().crossVectors(y, z).normalize();
  group.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z));
  root.add(group);
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
      curl = index === 1 ? 0.058 : 0.029;
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
      () => new T.Color('#a390aa'),
    ),
    flesh,
    `Patron_HandSkin_${index}`,
  );
  for (let i = 0; i < tips.length; i++) {
    const [tx, ty, tz] = tips[i];
    oval(
      group,
      `Patron_Nail_${index}_${i}`,
      [tx, ty + 0.001, tz - 0.007],
      [0.0055, 0.01, 0.0025],
      nail,
    );
  }
}
function eyelid(face: T.Group, side: number, lid: number, material: T.Material) {
  const group = new T.Group();
  group.name = `Patron_Lid_${side}_${lid}`;
  group.position.set(side * 0.082, 0.009, 0.132);
  group.rotation.y = side * 0.2;
  const pivot = new T.Group();
  pivot.name = `Patron_LidPivot_${side}_${lid}`;
  pivot.rotation.x = (-lid * Math.PI) / 2;
  pivot.userData.motion = 'patronLid';
  pivot.userData.side = lid;
  group.add(pivot);
  face.add(group);
  const f = ellipsoid([0, 0, 0], [0.046, 0.024, 0.025]);
  const g = sculptField(
    (x, y, z) => Math.max(f(x, y, z), -lid * y - 0.0003),
    { step: 0.003, origin: [-0.055, -0.032, -0.033], cells: [37, 22, 23] },
    () => new T.Color('#aa96b0'),
  );
  add(pivot, g, material, `Patron_LidSkin_${side}_${lid}`);
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
          y = 1.397 + t * 0.17,
          x = 0.073 + side * ((y - 1.38) * 0.72 + 0.038) + (u - 0.5) * (0.038 + 0.026 * t);
        let z = 0.3;
        while (coat(x, y, z) > 0 && z > -0.1) z -= 0.0015;
        z += back ? -0.003 : 0.005;
        pos.push(x, y, z);
        uv.push(u, t * 3);
        colors.push(
          ...new T.Color('#7d728d')
            .lerp(new T.Color('#4e415d'), (1 - smooth(Math.min(u, 1 - u), 0, 0.2)) * 0.35)
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
export function patron(root: T.Group) {
  const flesh = surface('skin'),
    cloth = surface('cloth'),
    horn = surface('horn');
  horn.vertexColors = true;
  horn.color.set('#ffffff');
  const dark = new T.MeshStandardMaterial({ color: '#352c29', roughness: 0.83 });
  const anchor = new T.Bone();
  anchor.name = 'Patron_Anchor';
  root.add(anchor);
  const neck = new T.Bone();
  neck.name = 'Patron_Neck';
  neck.position.set(0.08, 1.65, 0.055);
  neck.userData.motion = 'patronNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'Patron_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'patronHead';
  neck.add(head);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, neck, head]),
    field = anatomy();
  skin(
    root,
    sculptField(
      field,
      { step: 0.009, origin: [-0.25, 1.32, -0.2], cells: [77, 94, 75] },
      fleshColor,
    ),
    flesh,
    'Patron_FaceNeck',
    skeleton,
    (p) => {
      const h = smooth(p.y, 1.655, 1.717),
        n = smooth(p.y, 1.5, 1.67) * (1 - h);
      return [1 - h - n, n, h];
    },
  );
  const body = bodiceField();
  add(
    root,
    broadNormals(
      sculptField(body, { step: 0.011, origin: [-0.7, 0.72, -0.265], cells: [120, 88, 78] }, (p) =>
        new T.Color('#51455f')
          .lerp(new T.Color('#292936'), smooth(p.y, 1.43, 1.555) * 0.86)
          .lerp(new T.Color('#806c8b'), smooth(p.z, 0, 0.17) * 0.16),
      ),
      body,
    ),
    cloth,
    'Patron_CoatSleeves',
  );
  add(root, coatTails(body), cloth, 'Patron_CoatTails');
  const legField = trousers();
  add(
    root,
    broadNormals(
      sculptField(
        legField,
        { step: 0.01, origin: [-0.4, 0.28, -0.245], cells: [80, 88, 62] },
        () => new T.Color('#383542'),
      ),
      legField,
    ),
    cloth,
    'Patron_Trousers',
  );
  for (const side of [-1, 1]) add(root, lapel(body, side), cloth, `Patron_Lapel_${side}`);
  for (let f = 0; f < 2; f++) {
    const [x, y, z] = FEET[f],
      shoe = join([
        [ellipsoid([x, y, z], [0.077, 0.074, 0.153]), 0.022],
        [ellipsoid([x, y, z + 0.105], [0.062, 0.052, 0.092]), 0.02],
        [ellipsoid([x, y + 0.18, z - 0.075], [0.087, 0.22, 0.092]), 0.024],
      ]);
    add(
      root,
      sculptField(
        (x, y, z) => Math.max(shoe(x, y, z), 0.105 - y),
        { step: 0.008, origin: [x - 0.12, 0.065, z - 0.22], cells: [31, 65, 63] },
        () => new T.Color('#3d302b'),
      ),
      cloth,
      `Patron_Boot_${f}`,
    );
  }
  const face = new T.Group();
  face.name = 'Patron_Face';
  face.quaternion.copy(TURN);
  head.add(face);
  const hz = (x: number, y: number) => {
    const sample = (z: number) => {
      const p = v([x, y, z]).applyQuaternion(TURN).add(HEAD);
      return field(p.x, p.y, p.z);
    };
    let inside = 0.4;
    while (sample(inside) > 0 && inside > -0.2) inside -= 0.003;
    let outside = inside + 0.003;
    for (let i = 0; i < 15; i++) {
      const mid = (inside + outside) / 2;
      if (sample(mid) > 0) outside = mid;
      else inside = mid;
    }
    return (inside + outside) / 2;
  };
  for (const s of [-1, 1]) {
    const hornMesh = stroke(
      face,
      `Patron_SweptHorn_${s}`,
      [
        [s * 0.105, 0.108, -0.045],
        [s * 0.285, 0.151, -0.069],
        [s * 0.437, 0.205, -0.09],
        [s * 0.514, s < 0 ? 0.338 : 0.371, -0.108],
        [s * 0.507, s < 0 ? 0.43 : 0.475, -0.121],
      ],
      [0.076, 0.065, 0.041, 0.019, 0.0007],
      horn,
    );
    const uv = hornMesh.geometry.attributes.uv,
      hornColors: number[] = [];
    for (let i = 0; i < uv.count; i++) {
      const t = uv.getY(i);
      hornColors.push(
        ...new T.Color('#665a67')
          .lerp(new T.Color('#b6ab99'), smooth(t, 0.05, 0.65))
          .lerp(new T.Color('#e0d3b6'), smooth(t, 0.68, 1) * 0.7)
          .toArray(),
      );
    }
    hornMesh.geometry.setAttribute('color', new T.Float32BufferAttribute(hornColors, 3));
    const eye = new T.Group();
    eye.name = `Patron_Eye_${s}`;
    eye.position.set(s * 0.082, 0.009, 0.132);
    eye.rotation.y = s * 0.2;
    face.add(eye);
    const eg = new T.SphereGeometry(1, 64, 40),
      p = eg.attributes.position,
      colors: number[] = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i),
        r = Math.sqrt(x * x + y * y);
      colors.push(
        ...new T.Color('#93819f')
          .lerp(new T.Color('#d3c0e3'), (1 - smooth(r, 0.1, 0.92)) * smooth(z, 0, 0.5))
          .lerp(
            new T.Color('#2b2625'),
            (1 - smooth(Math.abs(x), 0.07, 0.12)) *
              (1 - smooth(Math.abs(y), 0.58, 0.76)) *
              smooth(z, 0.3, 0.65),
          )
          .toArray(),
      );
    }
    eg.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    const globe = add(
      eye,
      eg,
      new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.47 }),
      `Patron_Eyeball_${s}`,
    );
    globe.scale.set(0.043, 0.022, 0.024);
    for (const l of [-1, 1]) eyelid(face, s, l, flesh);
    const nx = s * 0.021,
      ny = -0.109;
    oval(face, `Patron_Nostril_${s}`, [nx, ny, hz(nx, ny) + 0.001], [0.009, 0.005, 0.004], dark);
    const tx = s * 0.069,
      ty = -0.158;
    stroke(
      face,
      `Patron_Fang_${s}`,
      [
        [tx, ty, hz(tx, ty)],
        [tx, ty - 0.017, hz(tx, ty) + 0.008],
        [tx * 0.94, ty - 0.024, hz(tx, ty) + 0.009],
      ],
      [0.006, 0.004, 0.0006],
      new T.MeshStandardMaterial({ color: '#d7c7a6', roughness: 0.7 }),
    );
  }
  const mouth = Array.from({ length: 31 }, (_, i) => {
    const x = -0.104 + (i / 30) * 0.208,
      y = -0.16 + 0.035 * x;
    return [x, y, hz(x, y) + 0.001];
  });
  stroke(face, 'Patron_Mouth', mouth, [0.0007, 0.003, 0.0007], dark);
  for (let i = 0; i < 2; i++) hand(root, i, flesh, dark);
  root.updateMatrixWorld(true);
}
export function patronMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((o) => {
    const motion = o.userData.motion as string | undefined;
    if (!motion?.startsWith('patron')) return;
    const rest = o.quaternion.clone(),
      values: number[] = [];
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'patronNeck') {
        e.y = Math.sin(a) * 0.024;
        e.z = Math.sin(a - 0.3) * 0.009;
      }
      if (motion === 'patronHead') {
        e.y = Math.sin(a - 0.5) * 0.039;
        e.x = Math.sin(a * 2 - 0.2) * 0.012;
      }
      if (motion === 'patronLid')
        e.x =
          (((o.userData.side as number) * Math.PI) / 2) *
          (1 - smooth(Math.abs(time - 3.9), 0.035, 0.17));
      values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    values.splice(values.length - 4, 4, ...values.slice(0, 4));
    tracks.push(new T.QuaternionKeyframeTrack(`${o.name}.quaternion`, times, values));
  });
  return tracks;
}
