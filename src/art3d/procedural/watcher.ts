import * as T from 'three';
import { loft } from './newStudies';
import {
  ellipsoid,
  taperedSpineField as makeSpineField,
  union,
  sculptField,
  type Field,
} from './surfaceSculpt';
const smooth = T.MathUtils.smoothstep;
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const HEAD = new T.Vector3(-0.11, 1.57, 0.135);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(0.09, -0.26, 0.045, 'YXZ'));
const FEET = [
  [-0.255, 0.16, 0.265],
  [0.22, 0.16, -0.04],
];
const HANDS = [
  { p: [-0.55, 0.66, 0.245], wrist: [-0.535, 0.75, 0.21], twist: -0.2 },
  { p: [0.12, 0.955, 0.235], wrist: [0.23, 0.965, 0.24], twist: 0.65 },
];
/** Tight conservative bounds skip distant limb samples without changing the zero surface. */
function taperedSpineField(points: number[][], radii: number[]): Field {
  const field = makeSpineField(points, radii),
    curve = new T.CatmullRomCurve3(points.map(v));
  const samples = Array.from({ length: 65 }, (_, i) => curve.getPoint(i / 64));
  const margin = Math.max(...radii) + 0.15;
  const low = [0, 1, 2].map((a) => Math.min(...samples.map((p) => p.getComponent(a))) - margin);
  const high = [0, 1, 2].map((a) => Math.max(...samples.map((p) => p.getComponent(a))) + margin);
  return (x, y, z) =>
    x < low[0] || x > high[0] || y < low[1] || y > high[1] || z < low[2] || z > high[2]
      ? 10
      : field(x, y, z);
}
function join(shapes: [Field, number][]): Field {
  return (x, y, z) => {
    let f = 10;
    for (const [shape, k] of shapes) f = union(f, shape(x, y, z), k);
    return f;
  };
}
function torso(): Field {
  return join([
    [ellipsoid([0.035, 0.65, -0.025], [0.24, 0.19, 0.19], -0.1), 0.06],
    [ellipsoid([0, 0.885, -0.04], [0.255, 0.25, 0.2], -0.12), 0.055],
    [ellipsoid([-0.025, 1.125, -0.025], [0.34, 0.235, 0.225], -0.09), 0.066],
    [ellipsoid([-0.03, 1.255, -0.075], [0.28, 0.14, 0.19], -0.065), 0.05],
  ]);
}
/** A heavy, forward listening head is supported by broad shoulders and staggered legs. */
function anatomy(lowerOnly = false): Field {
  const shapes: [Field, number][] = [
    [torso(), 0.055],
    [
      taperedSpineField(
        [[-0.125, 0.67, -0.035], [-0.265, 0.455, 0.1], [-0.275, 0.265, 0.105], FEET[0]],
        [0.138, 0.113, 0.067, 0.073],
      ),
      0.056,
    ],
    [
      taperedSpineField(
        [[0.17, 0.65, -0.045], [0.3, 0.45, 0.035], [0.265, 0.24, -0.11], FEET[1]],
        [0.135, 0.11, 0.064, 0.071],
      ),
      0.055,
    ],
    [
      taperedSpineField(
        [
          [-0.3, 1.205, -0.035],
          [-0.445, 1.015, 0.01],
          [-0.485, 0.85, 0.16],
          HANDS[0].wrist,
          HANDS[0].p,
        ],
        [0.115, 0.104, 0.076, 0.047, 0.038],
      ),
      0.056,
    ],
    [
      taperedSpineField(
        [
          [0.27, 1.195, -0.045],
          [0.445, 0.99, 0.04],
          [0.375, 0.935, 0.215],
          HANDS[1].wrist,
          HANDS[1].p,
        ],
        [0.113, 0.1, 0.073, 0.046, 0.034],
      ),
      0.055,
    ],
    [
      taperedSpineField(
        [[-0.045, 1.24, -0.055], [-0.075, 1.38, 0.025], HEAD.toArray()],
        [0.21, 0.173, 0.18],
      ),
      0.065,
    ],
  ];
  for (const [x, y, z] of FEET) {
    shapes.push([ellipsoid([x, y + 0.015, z], [0.114, 0.086, 0.165]), 0.032]);
    for (let i = 0; i < 3; i++)
      shapes.push([
        taperedSpineField(
          [
            [x + (i - 1) * 0.06, y, z + 0.055],
            [x + (i - 1) * 0.081, y - 0.006, z + 0.165],
            [x + (i - 1) * 0.087, y - 0.012, z + 0.208 + (i === 1 ? 0.018 : 0)],
          ],
          [0.039, 0.034, 0.024],
        ),
        0.018,
      ]);
  }
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.025, -0.034], [0.253, 0.244, 0.199]), 0.045],
    [ellipsoid([0, -0.14, 0.027], [0.193, 0.136, 0.153]), 0.037],
    [ellipsoid([0, -0.218, 0.07], [0.113, 0.044, 0.101]), 0.026],
    [ellipsoid([0, -0.137, 0.135], [0.12, 0.031, 0.03]), 0.02],
    [ellipsoid([0, 0.111, 0.082], [0.219, 0.075, 0.083]), 0.039],
  ];
  for (const side of [-1, 1]) {
    skull.push([
      ellipsoid([side * 0.145, -0.077, 0.108], [0.071, 0.054, 0.041], side * -0.4),
      0.025,
    ]);
    skull.push([ellipsoid([side * 0.216, 0.047, -0.045], [0.07, 0.103, 0.082]), 0.025]);
  }
  const hfield = join(skull),
    body = join(lowerOnly ? shapes.slice(0, 3) : shapes),
    socket = ellipsoid([0, 0.032, 0.16], [0.203, 0.074, 0.075]);
  const inv = new T.Matrix4().makeRotationFromQuaternion(TURN.clone().invert()).elements;
  return (x, y, z) => {
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    let f = body(x, y, z);
    if (lowerOnly) return Math.max(f, 0.105 - y);
    if (Math.abs(dx) < 0.48 && Math.abs(dy) < 0.42 && Math.abs(dz) < 0.42) {
      const hx = inv[0] * dx + inv[4] * dy + inv[8] * dz,
        hy = inv[1] * dx + inv[5] * dy + inv[9] * dz,
        hz = inv[2] * dx + inv[6] * dy + inv[10] * dz;
      const h = hfield(hx, hy, hz);
      f = union(f, h, 0.05);
      // The neck joins before the socket is cut, so it cannot refill the eye opening.
      f = -union(-f, socket(hx, hy, hz), 0.012);
    }
    return Math.max(f, 0.105 - y);
  };
}
function pigment(p: T.Vector3) {
  const h = p.clone().sub(HEAD).applyQuaternion(TURN.clone().invert());
  const head = smooth(p.y, 1.34, 1.48);
  const plane = head * smooth(h.z, 0.04, 0.15);
  const orbit = head * Math.exp(-(((h.y - 0.035) / 0.115) ** 2)) * smooth(h.z, 0.09, 0.17);
  const chest =
    smooth(p.z, 0.04, 0.19) *
    (1 - smooth(Math.abs(p.x + 0.025), 0.12, 0.28)) *
    smooth(p.y, 0.8, 1.14);
  return new T.Color('#75637d')
    .lerp(new T.Color('#b7a3af'), plane * 0.68)
    .lerp(new T.Color('#514153'), orbit * 0.38)
    .lerp(new T.Color('#a48b9f'), chest * 0.44)
    .lerp(new T.Color('#574b65'), (1 - smooth(p.y, 0.25, 0.55)) * 0.3);
}
function skinGeometry(field: Field) {
  const g = sculptField(
    field,
    { step: 0.014, origin: [-0.73, 0.025, -0.37], cells: [101, 134, 78] },
    pigment,
  );
  const p = g.attributes.position,
    n = g.attributes.normal,
    e = 0.013;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const normal = new T.Vector3(
      field(x + e, y, z) - field(x - e, y, z),
      field(x, y + e, z) - field(x, y - e, z),
      field(x, y, z + e) - field(x, y, z - e),
    ).normalize();
    n.setXYZ(i, normal.x, normal.y, normal.z);
  }
  return g;
}
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
/** Fine pores on flesh and axial grain on keratin. */
function surface(kind: 'skin' | 'horn') {
  const size = 512,
    bytes = new Uint8Array(size * size * 4),
    normals = bytes.slice(),
    packed = bytes.slice();
  const heights = new Float32Array(size * size),
    tones = heights.slice();
  const wrap = (n: number) => (n + size) % size;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / size,
        t = y / size;
      const fine = hash(x, y),
        broad =
          Math.sin(u * Math.PI * 16 + Math.sin(t * Math.PI * 10)) * Math.sin(t * Math.PI * 14);
      let h = 0,
        tone = 238;
      if (kind === 'skin') {
        const cellX = Math.floor(x / 6),
          cellY = Math.floor(y / 6);
        const pore = Math.exp(
          -(
            ((x % 6) - 2 - hash(cellX, cellY)) ** 2 +
            ((y % 6) - 2 - hash(cellX + 13, cellY)) ** 2
          ) / 1.8,
        );
        const fold = Math.max(0, Math.sin(u * Math.PI * 50 + Math.sin(t * Math.PI * 6) * 2)) ** 22;
        h = -pore * 0.22 - fold * 0.1 + broad * 0.022;
        tone = 239 - pore * 9 - fold * 2 + broad * 2 + (fine - 0.5) * 3;
      } else {
        const grain = Math.sin(u * Math.PI * 112 + Math.sin(t * Math.PI * 8) * 0.75);
        const ring = Math.sin(t * Math.PI * 42 + Math.sin(u * Math.PI * 12) * 0.7);
        h = grain * 0.09 + ring * 0.045 + (fine - 0.5) * 0.035;
        tone = 231 + grain * 7 + ring * 3 + broad * 2;
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
        (heights[y * size + wrap(x - 1)] - heights[y * size + wrap(x + 1)]) * 1.6,
        (heights[wrap(y - 1) * size + x] - heights[wrap(y + 1) * size + x]) * 1.6,
        1,
      ).normalize();
      // Green is pre-inverted with a negative live Y scale for portable DataTexture export.
      normals.set([128 + n.x * 127, 128 - n.y * 127, n.z * 255, 255], i);
      packed.set([255, (kind === 'horn' ? 210 : 237) + (tone - 236) * 0.6, 255, 255], i);
    }
  const texture = (data: Uint8Array, srgb = false) => {
    const map = new T.DataTexture(data, size, size);
    map.wrapS = map.wrapT = T.RepeatWrapping;
    map.magFilter = T.LinearFilter;
    map.minFilter = T.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.needsUpdate = true;
    if (srgb) map.colorSpace = T.SRGBColorSpace;
    return map;
  };
  const rough = texture(packed);
  return new T.MeshStandardMaterial({
    vertexColors: true,
    map: texture(bytes, true),
    normalMap: texture(normals),
    normalScale: new T.Vector2(0.25, -0.25),
    roughness: kind === 'horn' ? 0.78 : 0.94,
    roughnessMap: rough,
    metalnessMap: rough,
    metalness: 0,
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
  m: T.Material,
) {
  return add(parent, loft(points, radii, radii, 40, 20), m, name);
}
function weights(p: T.Vector3) {
  const center = 1 - smooth(Math.abs(p.x + 0.1), 0.3, 0.42);
  const head = smooth(p.y, 1.33, 1.43) * center;
  const neck = smooth(p.y, 1.24, 1.41) * (1 - head) * center;
  return { j: [0, 1, 2], w: [1 - head - neck, neck, head] };
}
function skin(
  parent: T.Object3D,
  g: T.BufferGeometry,
  m: T.Material,
  name: string,
  skeleton: T.Skeleton,
  weights: (p: T.Vector3) => { j: number[]; w: number[] },
) {
  const joints: number[] = [],
    values: number[] = [],
    p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const data = weights(new T.Vector3().fromBufferAttribute(p, i));
    const selected = data.w
      .map((w, k) => ({ w, j: data.j[k] }))
      .filter((a) => a.w > 0)
      .sort((a, b) => b.w - a.w)
      .slice(0, 4);
    while (selected.length < 4) selected.push({ w: 0, j: 0 });
    const sum = selected.reduce((s, a) => s + a.w, 0);
    for (const a of selected) {
      joints.push(a.j);
      values.push(a.w / sum);
    }
  }
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(values, 4));
  const mesh = new T.SkinnedMesh(g, m);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  mesh.bind(skeleton);
  return mesh;
}

function hand(root: T.Group, index: number, flesh: T.Material, nail: T.Material) {
  const data = HANDS[index],
    group = new T.Group();
  group.name = `Watcher_Hand_${index}`;
  group.position.copy(v(data.p));
  // The wrist follows the forearm; the palm normal faces the spirit in front.
  const y = v(data.wrist).sub(v(data.p)).normalize();
  const x = y
    .clone()
    .cross(new T.Vector3(0, 0, 1))
    .normalize();
  const z = x.clone().cross(y).normalize();
  group.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z));
  group.quaternion.multiply(
    new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), data.twist),
  );
  root.add(group);
  const shapes: [Field, number][] = [
    [ellipsoid([0, 0.005, 0], [0.069, 0.084, 0.042]), 0.02],
    [
      taperedSpineField(
        [
          [0, 0.085, 0],
          [0, 0.047, 0],
          [0, 0.018, 0],
        ],
        [0.03, 0.036, 0.04],
      ),
      0.02,
    ],
  ];
  const tips: number[][] = [];
  for (let finger = 0; finger < 3; finger++) {
    const x = (finger - 1) * 0.048,
      length = finger === 1 ? 0.135 : 0.112;
    const path = [
      [x, -0.025, 0.009],
      [x * 1.42, -0.092, 0.012],
      [x * 1.52, -length, 0.043],
      [x * 1.4, -length + 0.004, 0.064],
    ];
    shapes.push([taperedSpineField(path, [0.023, 0.02, 0.015, 0.011]), 0.011]);
    tips.push(path[3]);
  }
  shapes.push([
    taperedSpineField(
      [
        [-0.052, 0.024, 0.009],
        [-0.099, -0.008, 0.025],
        [-0.092, -0.045, 0.062],
        [-0.068, -0.052, 0.077],
      ],
      [0.025, 0.021, 0.016, 0.01],
    ),
    0.012,
  ]);
  tips.push([-0.068, -0.052, 0.077]);
  const field: Field = (x, y, z) => {
    x *= index === 1 ? -1 : 1;
    let f = 10;
    for (const [shape, k] of shapes) f = union(f, shape(x, y, z), k);
    return f;
  };
  add(
    group,
    sculptField(
      field,
      { step: 0.0065, origin: [-0.13, -0.17, -0.068], cells: [42, 46, 29] },
      () => new T.Color('#90788f'),
    ),
    flesh,
    `Watcher_HandSkin_${index}`,
  );
  for (let i = 0; i < tips.length; i++) {
    const [rawX, y, z] = tips[i];
    const x = rawX * (index === 1 ? -1 : 1);
    stroke(
      group,
      `Watcher_HandClaw_${index}_${i}`,
      [
        [x, y - 0.006, z - 0.006],
        [x, y + 0.009, z + 0.013],
        [x, y + 0.026, z + 0.018],
      ],
      [0.009, 0.006, 0.0008],
      nail,
    );
  }
}
/** A thick leather jerkin follows the torso, with an open front and real armholes. */
function clothes(root: T.Group, skeleton: T.Skeleton) {
  const core = join([
    [torso(), 0.05],
    [
      taperedSpineField(
        [[-0.045, 1.24, -0.055], [-0.075, 1.38, 0.025], HEAD.toArray()],
        [0.21, 0.173, 0.18],
      ),
      0.065,
    ],
  ]);
  const body = anatomy(true);
  const holes = [-1, 1].map((side) =>
    ellipsoid([side * 0.328 - 0.025, 1.115, -0.025], [0.133, 0.145, 0.3]),
  );
  // Keep the cut between sample layers; a coplanar zero layer collapses tetrahedral caps.
  const garment: Field = (x, y, z) => {
    const d = core(x, y, z);
    let f = Math.max(d - 0.014, -(d + 0.006), 0.785 - y, y - 1.338, Math.abs(x + 0.025) - 0.355);
    // V opening widens toward the neck. The back remains continuous.
    if (z > -0.015) f = Math.max(f, 0.09 + smooth(y, 0.91, 1.31) * 0.12 - Math.abs(x + 0.025));
    for (const hole of holes) f = Math.max(f, -hole(x, y, z));
    return f;
  };
  const leather = surface('skin');
  leather.roughness = 0.94;
  leather.normalScale.set(0.13, -0.13);
  const g = sculptField(
    garment,
    { step: 0.007, origin: [-0.43, 0.745, -0.32], cells: [118, 88, 90] },
    (p) => new T.Color('#443d50').lerp(new T.Color('#6d5d71'), smooth(p.z, -0.13, 0.18) * 0.24),
  );
  skin(root, g, leather, 'Watcher_LeatherJerkin', skeleton, weights);
  // A closed wrap covers the hip and upper thigh, with a sloping closed hem.
  const rows = 40,
    cols = 96,
    pos: number[] = [],
    uv: number[] = [],
    color: number[] = [],
    idx: number[] = [];
  for (const layer of [0, 1])
    for (let j = 0; j <= rows; j++)
      for (let i = 0; i <= cols; i++) {
        const a = (i / cols) * Math.PI * 2,
          t = j / rows,
          y = 0.8 - t * (0.27 + 0.023 * Math.cos(a - 0.5));
        let edge = 0.64;
        while (
          edge > 0.03 &&
          body(0.025 + Math.sin(a) * edge, y, -0.025 + Math.cos(a) * edge) > 0.0
        )
          edge -= 0.012;
        let outside = edge + 0.012;
        for (let k = 0; k < 14; k++) {
          const mid = (edge + outside) / 2;
          if (body(0.025 + Math.sin(a) * mid, y, -0.025 + Math.cos(a) * mid) > 0) outside = mid;
          else edge = mid;
        }
        const ratio = 0.77 - t * 0.1;
        const basic = (0.258 + t * 0.142) / Math.hypot(Math.sin(a), Math.cos(a) / ratio);
        const fit = edge + 0.008 + t * 0.012;
        const r =
          -union(-basic, -fit, 0.025) +
          (layer === 0 ? 0.012 : 0) +
          Math.sin(a * 7 + 0.8) * 0.006 * t;
        const x = 0.025 + Math.sin(a) * r,
          z = -0.025 + Math.cos(a) * r;
        pos.push(x, y, z);
        uv.push((i / cols) * 2, t);
        color.push(...new T.Color('#4c4157').lerp(new T.Color('#796178'), 0.2 * (1 - t)).toArray());
      }
  const n = (rows + 1) * (cols + 1);
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const k = j * (cols + 1) + i,
        q = k + cols + 1;
      idx.push(k, k + 1, q, k + 1, q + 1, q, n + k, n + q, n + k + 1, n + k + 1, n + q, n + q + 1);
    }
  // The angular and downward axes make the side-wall winding opposite the cap winding.
  for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
  for (const j of [0, rows])
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i,
        b = a + 1;
      idx.push(...(j === 0 ? [a, b, n + a, b, n + b, n + a] : [a, n + a, b, b, n + a, n + b]));
    }
  const wrap = new T.BufferGeometry();
  wrap.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  wrap.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  wrap.setAttribute('color', new T.Float32BufferAttribute(color, 3));
  wrap.setIndex(idx);
  wrap.computeVertexNormals();
  for (const layer of [0, 1])
    for (let j = 0; j <= rows; j++) {
      const a = layer * n + j * (cols + 1),
        b = a + cols;
      const normal = new T.Vector3()
        .fromBufferAttribute(wrap.attributes.normal, a)
        .add(new T.Vector3().fromBufferAttribute(wrap.attributes.normal, b))
        .normalize();
      for (const k of [a, b]) wrap.attributes.normal.setXYZ(k, normal.x, normal.y, normal.z);
    }
  add(root, wrap, leather, 'Watcher_HipWrap');
}
export function watcher(root: T.Group) {
  const flesh = surface('skin'),
    horn = surface('horn');
  const nail = horn.clone();
  nail.vertexColors = false;
  nail.color.set('#958278');
  const dark = new T.MeshStandardMaterial({ color: '#332837', roughness: 0.7 });
  const anchor = new T.Bone();
  anchor.name = 'Watcher_Anchor';
  root.add(anchor);
  const neck = new T.Bone();
  neck.name = 'Watcher_Neck';
  neck.position.set(-0.075, 1.38, 0.025);
  neck.userData.motion = 'watcherNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'Watcher_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'watcherHead';
  neck.add(head);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, neck, head]);
  const field = anatomy();
  skin(root, skinGeometry(field), flesh, 'Watcher_ContinuousAnatomy', skeleton, weights);
  const face = new T.Group();
  face.name = 'Watcher_Face';
  face.quaternion.copy(TURN);
  head.add(face);
  const surfaceZ = (x: number, y: number) => {
    const sample = (z: number) => {
      const p = v([x, y, z]).applyQuaternion(TURN).add(HEAD);
      return field(p.x, p.y, p.z);
    };
    let outside = 0.4,
      inside = outside;
    while (sample(inside) > 0 && inside > -0.1) inside -= 0.004;
    outside = inside + 0.004;
    for (let i = 0; i < 14; i++) {
      const m = (outside + inside) / 2;
      if (sample(m) > 0) outside = m;
      else inside = m;
    }
    return (outside + inside) / 2;
  };
  for (const side of [-1, 1]) {
    const h = stroke(
      face,
      `Watcher_Horn_${side}`,
      [
        [side * 0.21, 0.04, -0.048],
        [side * 0.365, 0.005, -0.082],
        [side * 0.455, 0.082, -0.099],
        [side * 0.462, 0.23, -0.083],
        [side * (side < 0 ? 0.385 : 0.412), side < 0 ? 0.34 : 0.315, -0.063],
      ],
      [0.07, 0.064, 0.051, 0.028, 0.0012],
      horn,
    );
    const uv = h.geometry.attributes.uv,
      colors: number[] = [];
    for (let i = 0; i < uv.count; i++) {
      const t = uv.getY(i);
      colors.push(
        ...new T.Color('#61594f')
          .lerp(new T.Color('#afa58d'), smooth(t, 0.12, 0.73))
          .lerp(new T.Color('#d1c5a8'), smooth(t, 0.7, 0.98) * 0.4)
          .toArray(),
      );
    }
    h.geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  }
  const eye = new T.Group();
  eye.name = 'Watcher_Eye';
  eye.position.set(0, 0.033, 0.134);
  face.add(eye);
  oval(eye, 'Watcher_Orbit', [0, 0, -0.006], [0.187, 0.067, 0.026], dark);
  const visible = new T.Group();
  visible.name = 'Watcher_VisibleEye';
  eye.add(visible);
  const iris = new T.Group();
  iris.name = 'Watcher_IrisFrame';
  iris.userData.motion = 'watcherGaze';
  visible.add(iris);
  const eyeGeometry = new T.SphereGeometry(1, 160, 96);
  eyeGeometry.scale(0.182, 0.061, 0.028);
  const ep = eyeGeometry.attributes.position,
    colors: number[] = [];
  for (let i = 0; i < ep.count; i++) {
    const x = ep.getX(i),
      y = ep.getY(i),
      z = ep.getZ(i),
      r = Math.hypot(x / 0.064, y / 0.055),
      a = Math.atan2(y / 0.055, x / 0.064);
    const c = new T.Color('#b89c82');
    if (z > 0) {
      const irisMask = 1 - smooth(r, 0.95, 1.08),
        edge = smooth(r, 0.79, 1);
      const irisColor = new T.Color('#e5c584')
        .lerp(new T.Color('#876244'), edge * 0.72)
        .lerp(new T.Color('#bb9256'), (Math.sin(a * 27 + r * 23) * 0.5 + 0.5) * 0.15);
      c.lerp(irisColor, irisMask);
      const pupil =
        (1 - smooth(Math.abs(x), 0.005, 0.009)) * (1 - smooth(Math.abs(y), 0.047, 0.055));
      c.lerp(new T.Color('#302937'), pupil);
    }
    colors.push(...c.toArray());
  }
  eyeGeometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  add(
    iris,
    eyeGeometry,
    new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.4 }),
    'Watcher_Eyeball',
  );
  // Fitted shutters close over the eye instead of shrinking it into an empty socket.
  const lidMaterial = flesh.clone();
  lidMaterial.vertexColors = false;
  lidMaterial.color.set('#a590a3');
  for (const side of [-1, 1]) {
    const lid = new T.Group();
    lid.name = side > 0 ? 'Watcher_UpperLid' : 'Watcher_LowerLid';
    lid.rotation.x = (-side * Math.PI) / 2;
    lid.userData.motion = side > 0 ? 'watcherUpperLid' : 'watcherLowerLid';
    eye.add(lid);
    const globe = ellipsoid([0, 0, 0], [0.19, 0.068, 0.035]);
    const lidField: Field = (x, y, z) =>
      Math.max(globe(x, y, z), side > 0 ? -0.0007 - y : y + 0.0007);
    const g = sculptField(lidField, {
      step: 0.005,
      origin: [-0.21, -0.09, -0.045],
      cells: [84, 36, 18],
    });
    g.deleteAttribute('color');
    add(lid, g, lidMaterial, side > 0 ? 'Watcher_UpperLidSkin' : 'Watcher_LowerLidSkin');
  }
  const mouth = Array.from({ length: 33 }, (_, i) => {
    const x = -0.124 + (i / 32) * 0.248,
      y = -0.18 + (0.015 * i) / 32;
    return [x, y, surfaceZ(x, y) + 0.0015];
  });
  stroke(face, 'Watcher_Mouth', mouth, [0.0009, 0.0033, 0.0009], dark);
  for (let i = 0; i < 2; i++) hand(root, i, flesh, nail);
  for (let f = 0; f < 2; f++)
    for (let i = 0; i < 3; i++) {
      const [x, y, z] = FEET[f],
        tx = x + (i - 1) * 0.087,
        tz = z + 0.208 + (i === 1 ? 0.018 : 0);
      stroke(
        root,
        `Watcher_ToeClaw_${f}_${i}`,
        [
          [tx, y - 0.003, tz - 0.013],
          [tx, y - 0.012, tz + 0.025],
          [tx, y - 0.041, tz + 0.043],
        ],
        [0.02, 0.014, 0.001],
        nail,
      );
    }
  clothes(root, skeleton);
  root.updateMatrixWorld(true);
}
export function watcherMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((object) => {
    const motion = object.userData.motion as string | undefined;
    if (!motion?.startsWith('watcher')) return;
    const rest = object.quaternion.clone(),
      values: number[] = [];
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'watcherNeck') {
        e.y = Math.sin(a) * 0.027;
        e.x = Math.sin(a - 0.3) * 0.012;
      }
      if (motion === 'watcherHead') {
        e.y = Math.sin(a - 0.45) * 0.052;
        e.z = Math.sin(a - 0.6) * 0.012;
      }
      if (motion === 'watcherUpperLid' || motion === 'watcherLowerLid') {
        const b = 1 - smooth(Math.abs(time - 3.8), 0.035, 0.17);
        e.x = ((motion === 'watcherUpperLid' ? 1 : -1) * b * Math.PI) / 2;
      }
      if (motion === 'watcherGaze')
        values.push(
          object.position.x + Math.sin(a + 0.4) * 0.018,
          object.position.y + Math.sin(a - 0.2) * 0.003,
          object.position.z,
        );
      else values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const vector = motion === 'watcherGaze',
      size = vector ? 3 : 4;
    values.splice(values.length - size, size, ...values.slice(0, size));
    tracks.push(
      vector
        ? new T.VectorKeyframeTrack(`${object.name}.position`, times, values)
        : new T.QuaternionKeyframeTrack(`${object.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
