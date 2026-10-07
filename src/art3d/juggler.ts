import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';
const smooth = T.MathUtils.smoothstep;
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const HEAD = new T.Vector3(-0.13, 1.42, 0.13);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(-0.05, -0.19, 0.075, 'YXZ'));
const FEET = [
  [-0.21, 0.16, 0.27],
  [0.22, 0.16, -0.015],
];
const HANDS = [
  { p: [-0.61, 1.26, 0.17], wrist: [-0.585, 1.18, 0.125], twist: -0.2 },
  { p: [0.57, 1.16, 0.24], wrist: [0.51, 1.105, 0.185], twist: 0.28 },
];
/** A staggered stance carries a tilted chest; open elbows frame two raised palms. */
function anatomy(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([0.025, 0.65, -0.025], [0.165, 0.15, 0.14], -0.12), 0.043],
    [ellipsoid([-0.02, 0.83, -0.02], [0.156, 0.24, 0.14], -0.12), 0.05],
    [ellipsoid([-0.065, 1.055, 0.005], [0.225, 0.22, 0.17], -0.12), 0.055],
    [
      taperedSpineField(
        [[-0.085, 0.64, -0.015], [-0.235, 0.435, 0.13], [-0.215, 0.28, 0.12], FEET[0]],
        [0.102, 0.077, 0.049, 0.059],
      ),
      0.045,
    ],
    [
      taperedSpineField(
        [[0.125, 0.63, -0.045], [0.28, 0.425, 0.055], [0.27, 0.245, -0.095], FEET[1]],
        [0.1, 0.071, 0.046, 0.058],
      ),
      0.04,
    ],
    [
      taperedSpineField(
        [[-0.245, 1.12, 0], [-0.45, 0.93, 0.05], [-0.49, 1.025, 0.095], HANDS[0].wrist, HANDS[0].p],
        [0.079, 0.066, 0.056, 0.034, 0.031],
      ),
      0.042,
    ],
    [
      taperedSpineField(
        [
          [0.125, 1.085, -0.015],
          [0.375, 0.93, 0.005],
          [0.425, 0.99, 0.075],
          HANDS[1].wrist,
          HANDS[1].p,
        ],
        [0.077, 0.063, 0.051, 0.035, 0.031],
      ),
      0.042,
    ],
    [
      taperedSpineField(
        [[-0.08, 1.105, 0], [-0.105, 1.235, 0.055], HEAD.toArray()],
        [0.145, 0.125, 0.137],
      ),
      0.055,
    ],
  ];
  for (const [x, y, z] of FEET) {
    shapes.push([ellipsoid([x, y + 0.014, z], [0.095, 0.078, 0.145]), 0.024]);
    for (let i = 0; i < 3; i++)
      shapes.push([
        taperedSpineField(
          [
            [x + (i - 1) * 0.05, y, z + 0.03],
            [x + (i - 1) * 0.067, y - 0.007, z + 0.135],
            [x + (i - 1) * 0.077, y - 0.008, z + 0.185 + (i === 1 ? 0.018 : 0)],
          ],
          [0.032, 0.027, 0.019],
        ),
        0.014,
      ]);
  }
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.035, -0.03], [0.205, 0.22, 0.185]), 0.044],
    [ellipsoid([0, -0.09, 0.028], [0.151, 0.139, 0.149]), 0.033],
    [ellipsoid([0, -0.042, 0.14], [0.125, 0.078, 0.1]), 0.024],
    [ellipsoid([0, -0.172, 0.087], [0.078, 0.043, 0.068]), 0.027],
    [ellipsoid([0, 0.013, 0.158], [0.052, 0.088, 0.07]), 0.028],
    [ellipsoid([0, -0.032, 0.219], [0.073, 0.047, 0.065]), 0.022],
  ];
  for (const side of [-1, 1]) {
    skull.push([ellipsoid([side * 0.11, -0.04, 0.092], [0.085, 0.073, 0.075], side * 0.3), 0.025]);
    skull.push([ellipsoid([side * 0.099, 0.09, 0.105], [0.093, 0.041, 0.057], side * 0.27), 0.023]);
    skull.push([ellipsoid([side * 0.122, 0.202, -0.035], [0.062, 0.075, 0.07]), 0.025]);
  }
  const orbits = [-1, 1].map((side) =>
    ellipsoid([side * 0.106, 0.041, 0.15], [0.058, 0.037, 0.055]),
  );
  const inv = new T.Matrix4().makeRotationFromQuaternion(TURN.clone().invert()).elements;
  return (x, y, z) => {
    let f = 10;
    for (const [field, k] of shapes) f = union(f, field(x, y, z), k);
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    if (Math.abs(dx) < 0.48 && Math.abs(dy) < 0.42 && Math.abs(dz) < 0.46) {
      const hx = inv[0] * dx + inv[4] * dy + inv[8] * dz,
        hy = inv[1] * dx + inv[5] * dy + inv[9] * dz,
        hz = inv[2] * dx + inv[6] * dy + inv[10] * dz;
      let h = 10;
      for (const [field, k] of skull) h = union(h, field(hx, hy, hz), k);
      for (const orbit of orbits) h = -union(-h, orbit(hx, hy, hz), 0.011);
      f = union(f, h, 0.045);
    }
    return Math.max(f, 0.105 - y);
  };
}
/** Wider finite differences suppress centerline sampling bands on broad skin planes. */
function skinGeometry(field: Field) {
  const g = sculptField(
    field,
    { step: 0.015, origin: [-0.75, 0.025, -0.31], cells: [96, 113, 62] },
    pigment,
  );
  const p = g.attributes.position,
    n = g.attributes.normal,
    e = 0.012;
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
function pigment(p: T.Vector3) {
  const h = p.clone().sub(HEAD).applyQuaternion(TURN.clone().invert());
  const face = smooth(p.y, 1.22, 1.34) * (1 - smooth(Math.abs(p.x - HEAD.x), 0.19, 0.3));
  const mask = face * smooth(h.z, 0.02, 0.14);
  const socket =
    face *
    smooth(h.z, 0.08, 0.15) *
    Math.exp(-(((Math.abs(h.x) - 0.108) / 0.058) ** 2) - ((h.y - 0.047) / 0.039) ** 2);
  const chest =
    smooth(p.z, 0.05, 0.155) *
    (1 - smooth(Math.abs(p.x + 0.025), 0.09, 0.2)) *
    (1 - smooth(p.y, 1.1, 1.26)) *
    smooth(p.y, 0.62, 0.85);
  return new T.Color('#806581')
    .lerp(new T.Color('#bc9bab'), mask * 0.78)
    .lerp(new T.Color('#47354e'), socket * 0.65)
    .lerp(new T.Color('#b08a91'), chest * 0.68)
    .lerp(new T.Color('#51405d'), (1 - smooth(p.z, -0.1, 0.08)) * 0.25)
    .lerp(new T.Color('#58455d'), (1 - smooth(p.y, 0.2, 0.45)) * 0.34);
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
  // Raised arms stay anchored: height alone must not assign them to the head.
  const center = 1 - smooth(Math.abs(p.x + 0.12), 0.3, 0.42);
  const head = smooth(p.y, 1.2, 1.3) * center;
  const neck = smooth(p.y, 1.11, 1.28) * (1 - head) * center;
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

/** A cupped, pointed pinna with a rolled edge and a closed back. */
function ear(face: T.Group, side: number, material: T.Material) {
  const group = new T.Group();
  group.name = `Juggler_Ear_${side}`;
  group.position.set(side * 0.18, 0.085, -0.034);
  group.rotation.z = side < 0 ? -0.11 : 0.17;
  group.userData.motion = 'jugglerEar';
  group.userData.side = side;
  face.add(group);
  const rows = 36,
    cols = 40,
    pos: number[] = [],
    uv: number[] = [],
    colors: number[] = [],
    idx: number[] = [];
  const profile = new T.CatmullRomCurve3(
    [
      [0, 0.004],
      [0.58, 0.011],
      [0.86, 0.029],
      [1, 0.034],
      [1.025, 0.02],
      [0.95, 0.004],
      [0.55, -0.022],
      [0, -0.029],
    ].map(([r, z]) => v([r, z, 0])),
  );
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++) {
      const q = profile.getPoint(j / rows),
        r = Math.max(0, q.x),
        a = (i / cols) * Math.PI * 2;
      const spread = (1 + Math.cos(a)) / 2,
        x = side * (0.11 + r * Math.cos(a) * 0.16),
        y = 0.028 + r * Math.sin(a) * 0.069 + Math.pow(spread, 2) * r * 0.087;
      pos.push(x, y, q.y - 0.11 * r * spread);
      uv.push(x * 3 + 0.5, y * 3 + 0.5);
      colors.push(
        ...new T.Color(j < rows * 0.45 ? '#b98b94' : '#7a546b')
          .lerp(new T.Color('#8f6376'), smooth(r, 0.65, 1) * 0.65)
          .toArray(),
      );
      if (j < rows && i < cols) {
        const k = j * (cols + 1) + i,
          t = k + cols + 1;
        idx.push(...(side > 0 ? [k, t, k + 1, k + 1, t, t + 1] : [k, k + 1, t, k + 1, t + 1, t]));
      }
    }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  add(group, g, material, `Juggler_CuppedEar_${side}`);
  return group;
}
function hand(root: T.Group, index: number, flesh: T.Material, nail: T.Material) {
  const data = HANDS[index],
    group = new T.Group();
  group.name = `Juggler_Hand_${index}`;
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
      () => new T.Color('#a2839e'),
    ),
    flesh,
    `Juggler_HandSkin_${index}`,
  );
  for (let i = 0; i < tips.length; i++) {
    const [rawX, y, z] = tips[i];
    const x = rawX * (index === 1 ? -1 : 1);
    stroke(
      group,
      `Juggler_HandClaw_${index}_${i}`,
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
/** Opaque, closed flame volumes retain their silhouette in every exported view. */
function spirit(root: T.Group, index: number) {
  const group = new T.Group();
  group.name = `Juggler_Spirit_${index}`;
  group.position.set(
    HANDS[index].p[0] + (index === 0 ? -0.015 : 0.045),
    HANDS[index].p[1] + 0.245,
    HANDS[index].p[2] + 0.025,
  );
  group.rotation.z = index === 0 ? -0.16 : 0.21;
  group.userData.motion = 'jugglerSpirit';
  group.userData.side = index === 0 ? -1 : 1;
  root.add(group);
  const fields: [Field, number][] = [
    [ellipsoid([0, 0.025, 0], [0.06, 0.075, 0.041]), 0.02],
    [
      taperedSpineField(
        [
          [0, 0.015, 0],
          [-0.035, 0.105, 0],
          [0.035, 0.19, -0.01],
          [index === 0 ? 0.015 : -0.006, index === 0 ? 0.285 : 0.235, -0.015],
        ],
        [0.057, 0.041, 0.022, 0.0035],
      ),
      0.02,
    ],
    [
      taperedSpineField(
        [
          [0.033, 0.006, 0.006],
          [0.089, 0.054, 0.01],
          [0.096, index === 0 ? 0.125 : 0.095, -0.005],
          [0.083, index === 0 ? 0.17 : 0.137, -0.012],
        ],
        [0.034, 0.026, 0.013, 0.0035],
      ),
      0.021,
    ],
  ];
  const field: Field = (x, y, z) => {
    let f = 10;
    for (const [shape, k] of fields) f = union(f, shape(x, y, z), k);
    return f;
  };
  const outer = new T.MeshStandardMaterial({
    vertexColors: true,
    emissive: '#89669b',
    emissiveIntensity: 0.23,
    roughness: 0.65,
  });
  add(
    group,
    sculptField(field, { step: 0.005, origin: [-0.105, -0.075, -0.09], cells: [49, 75, 37] }, (p) =>
      new T.Color('#594464').lerp(new T.Color('#c5a8c9'), smooth(p.y, -0.025, 0.22) * 0.72),
    ),
    outer,
    `Juggler_Flame_${index}`,
  );
  // A smaller front lobe emerges from the outer volume, with its root buried.
  const core = loft(
    [
      [0, -0.026, 0.012],
      [-0.018, 0.025, 0.047],
      [0.018, 0.085, 0.047],
      [0.021, 0.14, 0.031],
    ],
    [0.016, 0.029, 0.018, 0.0009],
    [0.009, 0.013, 0.011, 0.0007],
    36,
    24,
  );
  add(
    group,
    core,
    new T.MeshStandardMaterial({
      color: '#eed5c1',
      emissive: '#d7aeae',
      emissiveIntensity: 0.38,
      roughness: 0.68,
    }),
    `Juggler_FlameCore_${index}`,
  );
}
export function juggler(root: T.Group) {
  const flesh = surface('skin'),
    horn = surface('horn');
  const tooth = horn.clone();
  tooth.vertexColors = false;
  tooth.color.set('#dac5aa');
  const nail = tooth.clone();
  nail.color.set('#958278');
  const dark = new T.MeshStandardMaterial({ color: '#332837', roughness: 0.7 });
  const anchor = new T.Bone();
  anchor.name = 'Juggler_Anchor';
  root.add(anchor);
  const neck = new T.Bone();
  neck.name = 'Juggler_Neck';
  neck.position.set(-0.105, 1.235, 0.055);
  neck.userData.motion = 'jugglerNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'Juggler_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'jugglerHead';
  neck.add(head);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, neck, head]);
  const field = anatomy();
  skin(root, skinGeometry(field), flesh, 'Juggler_ContinuousAnatomy', skeleton, weights);
  const face = new T.Group();
  face.name = 'Juggler_Face';
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
    ear(face, side, flesh);
    const hornMesh = stroke(
      face,
      `Juggler_Horn_${side}`,
      [
        [side * 0.123, 0.19, -0.035],
        [side * 0.217, 0.29, -0.078],
        [side * 0.237, 0.39, -0.09],
        [side * 0.2, side < 0 ? 0.46 : 0.49, -0.073],
      ],
      [0.056, 0.043, 0.024, 0.0009],
      horn,
    );
    const hornUV = hornMesh.geometry.attributes.uv,
      colors: number[] = [];
    for (let i = 0; i < hornUV.count; i++) {
      const t = hornUV.getY(i);
      colors.push(
        ...new T.Color('#4d3945')
          .lerp(new T.Color('#bfa68c'), smooth(t, 0.08, 0.64))
          .lerp(new T.Color('#dbc6a7'), smooth(t, 0.6, 0.98) * 0.7)
          .toArray(),
      );
    }
    hornMesh.geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    const eye = new T.Group();
    eye.name = `Juggler_Eye_${side}`;
    eye.position.set(side * 0.106, 0.041, 0.133);
    eye.rotation.y = side * 0.27;
    eye.rotation.z = side * 0.08;
    eye.userData.motion = 'jugglerBlink';
    face.add(eye);
    oval(eye, `Juggler_Orbit_${side}`, [0, 0, 0], [0.047, 0.021, 0.012], dark);
    oval(
      eye,
      `Juggler_Iris_${side}`,
      [0, 0, 0.014],
      [0.031, 0.014, 0.006],
      new T.MeshStandardMaterial({ color: '#d0a86e', roughness: 0.4 }),
    );
    oval(eye, `Juggler_Pupil_${side}`, [0, 0, 0.021], [0.006, 0.012, 0.002], dark);
    const y = -0.042,
      x = side * 0.04;
    oval(
      face,
      `Juggler_Nostril_${side}`,
      [x, y, surfaceZ(x, y) + 0.001],
      [0.014, 0.007, 0.006],
      dark,
    );
    const xTooth = side * 0.078,
      yTooth = -0.117,
      zTooth = surfaceZ(xTooth, yTooth) + 0.003;
    stroke(
      face,
      `Juggler_Fang_${side}`,
      [
        [xTooth, yTooth, zTooth],
        [xTooth * 0.96, yTooth - 0.024, zTooth + 0.01],
        [xTooth * 0.92, yTooth - 0.037, zTooth + 0.005],
      ],
      [0.009, 0.007, 0.0007],
      tooth,
    );
  }
  const mouth = Array.from({ length: 33 }, (_, i) => {
    const x = -0.137 + (i / 32) * 0.274,
      y = -0.106 - 0.016 * Math.sin((i / 32) * Math.PI) + x * 0.03;
    return [x, y, surfaceZ(x, y) + 0.0015];
  });
  stroke(face, 'Juggler_Mouth', mouth, [0.0008, 0.0035, 0.0009], dark);
  for (let index = 0; index < 2; index++) hand(root, index, flesh, nail);
  for (let f = 0; f < FEET.length; f++)
    for (let i = 0; i < 3; i++) {
      const [x, y, z] = FEET[f],
        tx = x + (i - 1) * 0.077,
        tz = z + 0.185 + (i === 1 ? 0.018 : 0);
      stroke(
        root,
        `Juggler_ToeClaw_${f}_${i}`,
        [
          [tx, y, tz - 0.007],
          [tx, y - 0.007, tz + 0.028],
          [tx, y - 0.039, tz + 0.049],
        ],
        [0.017, 0.013, 0.0008],
        nail,
      );
    }
  for (let i = 0; i < 2; i++) spirit(root, i);
  root.updateMatrixWorld(true);
}
export function jugglerMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((object) => {
    const motion = object.userData.motion as string | undefined;
    if (!motion?.startsWith('juggler')) return;
    const rest = object.quaternion.clone(),
      values: number[] = [],
      side = object.userData.side as number;
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'jugglerNeck') {
        e.y = Math.sin(a) * 0.035;
        e.z = Math.sin(a - 0.3) * 0.012;
      }
      if (motion === 'jugglerHead') {
        e.y = Math.sin(a - 0.4) * 0.06;
        e.x = Math.sin(a * 2 - 0.2) * 0.014;
      }
      if (motion === 'jugglerSpirit') {
        e.y = Math.sin(a + side * 0.7) * 0.16;
        e.z = Math.sin(a - side * 0.3) * 0.07;
      }
      if (motion === 'jugglerEar') e.y = Math.sin(a + side * 0.8) ** 9 * 0.09 * side;
      if (motion === 'jugglerBlink') {
        const b = Math.max(0, 1 - Math.abs(time - 3.75) / 0.15);
        values.push(1, 1 - b * 0.94, 1);
      } else values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    if (motion === 'jugglerSpirit') {
      const position: number[] = [];
      for (const time of times) {
        const a = (time / duration) * Math.PI * 2;
        position.push(
          object.position.x + Math.sin(a + side * 0.7) * 0.012,
          object.position.y + Math.sin(a + side) * 0.026,
          object.position.z + Math.sin(a - side) * 0.009,
        );
      }
      position.splice(position.length - 3, 3, ...position.slice(0, 3));
      tracks.push(new T.VectorKeyframeTrack(`${object.name}.position`, times, position));
    }
    const size = motion === 'jugglerBlink' ? 3 : 4;
    values.splice(values.length - size, size, ...values.slice(0, size));
    tracks.push(
      motion === 'jugglerBlink'
        ? new T.VectorKeyframeTrack(`${object.name}.scale`, times, values)
        : new T.QuaternionKeyframeTrack(`${object.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
