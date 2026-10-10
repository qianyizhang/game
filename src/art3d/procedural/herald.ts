import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';
const smooth = T.MathUtils.smoothstep;
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const HEAD = new T.Vector3(-0.075, 1.98, 0.095);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(0.045, -0.27, -0.055, 'YXZ'));
const HANDS = [
  { p: [-0.56, 1.27, 0.235], wrist: [-0.435, 1.27, 0.15], up: [0, 1, 0] },
  { p: [0.465, 1.4, 0.345], wrist: [0.465, 1.3, 0.31], up: [0, 0, 1] },
];
const FEET = [
  [-0.19, 0.155, 0.16],
  [0.18, 0.155, -0.015],
];
const STAFF = { x: -0.6, z: 0.215, radius: 0.019 };
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
    [ellipsoid([-0.065, 1.59, 0.015], [0.22, 0.16, 0.125], -0.09), 0.035],
    [
      spine([[-0.065, 1.57, 0.015], [-0.09, 1.76, 0.035], HEAD.toArray()], [0.115, 0.097, 0.102]),
      0.04,
    ],
  ]);
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.025, -0.025], [0.173, 0.208, 0.149]), 0.024],
    [ellipsoid([0, -0.116, 0.018], [0.139, 0.122, 0.121]), 0.025],
    [ellipsoid([0, -0.215, 0.027], [0.078, 0.053, 0.065]), 0.024],
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
    return Math.max(
      f,
      1.449 - y,
      y < 1.72 ? Math.abs(x + 0.065) - (y - 1.455) * 0.62 + 0.003 : -10,
    );
  };
}
function bodiceField(): Field {
  const base = join([
    [ellipsoid([-0.03, 1.16, -0.02], [0.222, 0.23, 0.158], -0.08), 0.04],
    [ellipsoid([-0.063, 1.405, -0.012], [0.281, 0.28, 0.16], -0.11), 0.045],
    [ellipsoid([-0.073, 1.635, -0.015], [0.35, 0.12, 0.144], -0.04), 0.04],
  ]);
  const arms = join([
    [
      spine(
        [
          [-0.345, 1.62, 0],
          [-0.46, 1.425, 0.035],
          [-0.445, 1.3, 0.115],
          HANDS[0].wrist,
          HANDS[0].p,
        ],
        [0.115, 0.098, 0.073, 0.066, 0.046],
      ),
      0.04,
    ],
    [
      spine(
        [[0.2, 1.62, 0.0], [0.36, 1.385, 0.005], [0.425, 1.22, 0.15], HANDS[1].wrist, HANDS[1].p],
        [0.116, 0.097, 0.08, 0.065, 0.038],
      ),
      0.04,
    ],
  ]);
  const axes = HANDS.map((h) => v(h.wrist).sub(v(h.p)).normalize());
  return (x, y, z) => {
    let a = arms(x, y, z);
    for (let h = 0; h < 2; h++) {
      const dx = x - HANDS[h].p[0],
        dy = y - HANDS[h].p[1],
        dz = z - HANDS[h].p[2],
        axis = axes[h];
      if (dx * dx + dy * dy + dz * dz < 0.18 ** 2)
        a = Math.max(a, 0.067 - (dx * axis.x + dy * axis.y + dz * axis.z));
    }
    const f = union(Math.max(base(x, y, z), 1.165 - y), a, 0.04);
    const opening = Math.max(1.455 - y, Math.abs(x + 0.065) - (y - 1.455) * 0.62, -z - 0.01);
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
  return new T.Color('#a89c84')
    .lerp(new T.Color('#dbc6a1'), front * 0.67)
    .lerp(new T.Color('#796a5d'), cheek * 0.3);
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
function skirt(coat: Field) {
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
        const xCenter = 0.055 - 0.095 * t,
          zCenter = -0.02 - 0.035 * (1 - t);
        const width = 0.21 + 0.17 * (1 - t) ** 1.2 + 0.046 * Math.sin(t * Math.PI) ** 2;
        const depth = 0.156 + 0.11 * (1 - t) ** 1.2;
        const waves =
          Math.sin(a * 9 + t * 0.9) * 0.62 +
          Math.sin(a * 13 - t * 1.5) * 0.25 +
          Math.sin(a * 5 + t * 3) * 0.3;
        const fold = waves * (0.013 + 0.019 * (1 - t));
        const gathered =
          Math.exp(-((Math.atan2(Math.sin(a - 0.72), Math.cos(a - 0.72)) / 0.43) ** 2)) *
          smooth(t, 0.55, 0.97);
        const r = (inner ? -0.013 : 0) + fold * (1 - t * 0.58);
        let x = xCenter + Math.sin(a) * (width + r),
          z = zCenter + Math.cos(a) * (depth + r);
        // The top ring follows the coat's actual waist, with thickness retained.
        if (t > 0.72) {
          let lo = 0,
            hi = 0.4;
          for (let k = 0; k < 17; k++) {
            const mid = (lo + hi) / 2;
            if (
              coat(
                -0.04 + Math.sin(a) * mid,
                Math.max(1.169, 0.19 + t * 1.015),
                -0.02 + Math.cos(a) * mid,
              ) < 0
            )
              lo = mid;
            else hi = mid;
          }
          const radius = (lo + hi) / 2 + (inner ? -0.007 : 0.0065),
            blend = smooth(t, 0.72, 1);
          x = T.MathUtils.lerp(x, -0.04 + Math.sin(a) * radius, blend);
          z = T.MathUtils.lerp(z, -0.02 + Math.cos(a) * radius, blend);
        }
        const y =
          0.19 +
          t * 1.015 +
          0.012 * (1 - t) * Math.sin(a * 5) ** 2 +
          gathered * 0.035 * Math.sin(t * Math.PI);
        pos.push(x, y, z);
        uv.push((i / cols) * 2, t * 2.5);
        colors.push(
          ...new T.Color('#4c312e')
            .lerp(
              new T.Color('#976951'),
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
function hand(root: T.Group, index: number, flesh: T.Material, nail: T.Material) {
  const h = HANDS[index],
    group = new T.Group();
  group.name = `Herald_Hand_${index}`;
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
      curl = 0.024;
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
      () => new T.Color('#c5b391'),
    ),
    flesh,
    `Herald_HandSkin_${index}`,
  );
  for (let i = 0; i < tips.length; i++) {
    const [tx, ty, tz] = tips[i];
    oval(
      group,
      `Herald_Nail_${index}_${i}`,
      [tx, ty + 0.001, tz - 0.007],
      [0.0055, 0.01, 0.0025],
      nail,
    );
  }
}
/** The staff grip is built around the actual shaft, with four curled digits and an opposed thumb. */
function grip(root: T.Group, flesh: T.Material) {
  const shapes: [Field, number][] = [
    [ellipsoid([-0.548, 1.271, 0.232], [0.048, 0.065, 0.033]), 0.012],
    [
      spine([HANDS[0].wrist, [-0.49, 1.27, 0.19], [-0.55, 1.27, 0.235]], [0.033, 0.036, 0.036]),
      0.016,
    ],
  ];
  for (let i = 0; i < 4; i++) {
    const y = 1.226 + i * 0.028;
    shapes.push([
      spine(
        [
          [-0.556, y, 0.247],
          [-0.595, y - 0.004, 0.255],
          [-0.63, y - 0.002, 0.232],
          [-0.625, y + 0.004, 0.198],
          [-0.601, y + 0.008, 0.181],
        ],
        [0.0145, 0.014, 0.013, 0.011, 0.009],
      ),
      0.008,
    ]);
  }
  shapes.push([
    spine(
      [
        [-0.516, 1.304, 0.235],
        [-0.54, 1.338, 0.225],
        [-0.583, 1.338, 0.22],
        [-0.603, 1.315, 0.244],
      ],
      [0.021, 0.019, 0.014, 0.01],
    ),
    0.013,
  ]);
  add(
    root,
    sculptField(
      join(shapes),
      { step: 0.0045, origin: [-0.665, 1.17, 0.11], cells: [64, 45, 40] },
      () => new T.Color('#c5b391'),
    ),
    flesh,
    'Herald_StaffHand',
  );
}
function staff(root: T.Group, wood: T.Material, metal: T.Material) {
  const shaft = stroke(
    root,
    'Herald_StaffShaft',
    [
      [STAFF.x, 0.105, STAFF.z],
      [STAFF.x, 1.1, STAFF.z],
      [STAFF.x, 1.99, STAFF.z],
    ],
    [0.019, 0.019, 0.017],
    wood,
  );
  shaft.userData.support = true;
  const ferrule = new T.Mesh(new T.CylinderGeometry(0.022, 0.023, 0.075, 24), metal);
  ferrule.name = 'Herald_StaffFerrule';
  ferrule.position.set(STAFF.x, 0.1425, STAFF.z);
  root.add(ferrule);
  for (const side of [-1, 1])
    stroke(
      root,
      `Herald_StaffFork_${side}`,
      [
        [STAFF.x, 1.955, STAFF.z],
        [STAFF.x + side * 0.115, 2.025, STAFF.z],
        [STAFF.x + side * 0.153, 2.155, STAFF.z],
        [STAFF.x + side * 0.132, 2.24 + (side > 0 ? 0.015 : 0), STAFF.z],
      ],
      [0.035, 0.026, 0.016, 0.0008],
      metal,
    );
  stroke(
    root,
    'Herald_StaffCentralProng',
    [
      [STAFF.x, 1.96, STAFF.z],
      [STAFF.x + 0.012, 2.07, STAFF.z],
      [STAFF.x + 0.009, 2.157, STAFF.z],
    ],
    [0.026, 0.021, 0.0008],
    metal,
  );
}
function eyelid(face: T.Group, side: number, lid: number, material: T.Material) {
  const group = new T.Group();
  group.name = `Herald_Lid_${side}_${lid}`;
  group.position.set(side * 0.082, 0.009, 0.132);
  group.rotation.y = side * 0.2;
  const pivot = new T.Group();
  pivot.name = `Herald_LidPivot_${side}_${lid}`;
  pivot.rotation.x = (-lid * Math.PI) / 2;
  pivot.userData.motion = 'heraldLid';
  pivot.userData.side = lid;
  group.add(pivot);
  face.add(group);
  const f = ellipsoid([0, 0, 0], [0.046, 0.024, 0.025]);
  const g = sculptField(
    (x, y, z) => Math.max(f(x, y, z), -lid * y - 0.0003),
    { step: 0.003, origin: [-0.055, -0.032, -0.033], cells: [37, 22, 23] },
    () => new T.Color('#c6b491'),
  );
  add(pivot, g, material, `Herald_LidSkin_${side}_${lid}`);
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
          y = 1.475 + t * 0.18,
          x = -0.065 + side * ((y - 1.455) * 0.62 + 0.038) + (u - 0.5) * (0.038 + 0.026 * t);
        let z = 0.3;
        while (coat(x, y, z) > 0 && z > -0.1) z -= 0.0015;
        z += back ? -0.003 : 0.005;
        pos.push(x, y, z);
        uv.push(u, t * 3);
        colors.push(
          ...new T.Color('#aa8254')
            .lerp(new T.Color('#72503c'), (1 - smooth(Math.min(u, 1 - u), 0, 0.2)) * 0.35)
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
export function herald(root: T.Group) {
  const flesh = surface('skin'),
    cloth = surface('cloth'),
    horn = surface('horn'),
    metal = surface('bronze');
  horn.vertexColors = true;
  horn.color.set('#ffffff');
  metal.color.set('#9d8050');
  const dark = new T.MeshStandardMaterial({ color: '#352c29', roughness: 0.83 });
  const wood = new T.MeshStandardMaterial({ color: '#655041', roughness: 0.85 });
  const anchor = new T.Bone();
  anchor.name = 'Herald_Anchor';
  root.add(anchor);
  const neck = new T.Bone();
  neck.name = 'Herald_Neck';
  neck.position.set(-0.09, 1.76, 0.035);
  neck.userData.motion = 'heraldNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'Herald_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'heraldHead';
  neck.add(head);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, neck, head]),
    field = anatomy();
  skin(
    root,
    sculptField(
      field,
      { step: 0.009, origin: [-0.36, 1.395, -0.255], cells: [70, 99, 68] },
      fleshColor,
    ),
    flesh,
    'Herald_FaceNeck',
    skeleton,
    (p) => {
      const h = smooth(p.y, 1.77, 1.855),
        n = smooth(p.y, 1.63, 1.79) * (1 - h);
      return [1 - h - n, n, h];
    },
  );
  const body = bodiceField();
  add(
    root,
    broadNormals(
      sculptField(body, { step: 0.011, origin: [-0.68, 0.9, -0.265], cells: [116, 81, 75] }, (p) =>
        new T.Color('#6e5147')
          .lerp(new T.Color('#373237'), smooth(p.y, 1.53, 1.65) * 0.86)
          .lerp(new T.Color('#99745b'), smooth(p.z, 0, 0.17) * 0.16),
      ),
      body,
    ),
    cloth,
    'Herald_CoatSleeves',
  );
  add(root, skirt(body), cloth, 'Herald_FoldedRobe');
  for (const side of [-1, 1]) add(root, lapel(body, side), cloth, `Herald_Lapel_${side}`);
  for (let f = 0; f < 2; f++) {
    const [x, y, z] = FEET[f],
      shoe = join([
        [ellipsoid([x, y, z], [0.077, 0.074, 0.153]), 0.022],
        [ellipsoid([x, y, z + 0.105], [0.062, 0.052, 0.092]), 0.02],
        [ellipsoid([x, y + 0.042, z - 0.095], [0.063, 0.084, 0.067]), 0.024],
      ]);
    add(
      root,
      sculptField(
        (x, y, z) => Math.max(shoe(x, y, z), 0.105 - y),
        { step: 0.008, origin: [x - 0.12, 0.065, z - 0.22], cells: [31, 48, 63] },
        () => new T.Color('#3d302b'),
      ),
      cloth,
      `Herald_Boot_${f}`,
    );
  }
  const face = new T.Group();
  face.name = 'Herald_Face';
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
      `Herald_CurledHorn_${s}`,
      [
        [s * 0.095, 0.115, -0.045],
        [s * 0.298, 0.153, -0.069],
        [s * 0.413, 0.239, -0.078],
        [s * 0.425, 0.358, -0.052],
        [s * 0.33, 0.409, -0.025],
        [s * 0.257, 0.363, 0.023],
        [s * 0.277, 0.302, 0.05],
      ],
      [0.067, 0.06, 0.045, 0.032, 0.023, 0.014, 0.0007],
      horn,
    );
    const uv = hornMesh.geometry.attributes.uv,
      hornColors: number[] = [];
    for (let i = 0; i < uv.count; i++) {
      const t = uv.getY(i);
      hornColors.push(
        ...new T.Color('#685945')
          .lerp(new T.Color('#af9a75'), smooth(t, 0.05, 0.65))
          .lerp(new T.Color('#d6c29a'), smooth(t, 0.68, 1) * 0.7)
          .toArray(),
      );
    }
    hornMesh.geometry.setAttribute('color', new T.Float32BufferAttribute(hornColors, 3));
    const eye = new T.Group();
    eye.name = `Herald_Eye_${s}`;
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
        ...new T.Color('#a78351')
          .lerp(new T.Color('#e8c27c'), (1 - smooth(r, 0.1, 0.92)) * smooth(z, 0, 0.5))
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
      `Herald_Eyeball_${s}`,
    );
    globe.scale.set(0.043, 0.022, 0.024);
    for (const l of [-1, 1]) eyelid(face, s, l, flesh);
    const nx = s * 0.021,
      ny = -0.109;
    oval(face, `Herald_Nostril_${s}`, [nx, ny, hz(nx, ny) + 0.001], [0.009, 0.005, 0.004], dark);
    const tx = s * 0.069,
      ty = -0.158;
    stroke(
      face,
      `Herald_Fang_${s}`,
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
  stroke(face, 'Herald_Mouth', mouth, [0.0007, 0.003, 0.0007], dark);
  hand(root, 1, flesh, dark);
  grip(root, flesh);
  staff(root, wood, metal);
  root.updateMatrixWorld(true);
}
export function heraldMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((o) => {
    const motion = o.userData.motion as string | undefined;
    if (!motion?.startsWith('herald')) return;
    const rest = o.quaternion.clone(),
      values: number[] = [];
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'heraldNeck') {
        e.y = Math.sin(a) * 0.024;
        e.z = Math.sin(a - 0.3) * 0.009;
      }
      if (motion === 'heraldHead') {
        e.y = Math.sin(a - 0.5) * 0.039;
        e.x = Math.sin(a * 2 - 0.2) * 0.012;
      }
      if (motion === 'heraldLid')
        e.x =
          (((o.userData.side as number) * Math.PI) / 2) *
          (1 - smooth(Math.abs(time - 3.7), 0.035, 0.17));
      values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    values.splice(values.length - 4, 4, ...values.slice(0, 4));
    tracks.push(new T.QuaternionKeyframeTrack(`${o.name}.quaternion`, times, values));
  });
  return tracks;
}
