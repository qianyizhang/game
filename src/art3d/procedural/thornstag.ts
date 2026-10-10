import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';
const smooth = T.MathUtils.smoothstep;
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const HEAD = new T.Vector3(-0.53, 2.0, 0.14);
const HEAD_ROTATION = new T.Quaternion().setFromEuler(new T.Euler(0.1, -0.46, 0.02));
// Sole origins: three support the halt; the near forehoof remains raised.
const FEET = [
  [-0.47, 0.42, 0.33],
  [-0.4, 0.105, -0.25],
  [0.63, 0.105, 0.24],
  [0.81, 0.105, -0.25],
];

function anatomyField(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([-0.18, 1.29, 0], [0.49, 0.32, 0.245], 0.05), 0.12],
    [ellipsoid([0.2, 1.33, -0.035], [0.41, 0.24, 0.215], -0.04), 0.13],
    [ellipsoid([0.51, 1.28, -0.04], [0.3, 0.3, 0.245], -0.16), 0.1],
    [ellipsoid([-0.36, 1.28, 0.14], [0.18, 0.33, 0.135], -0.08), 0.1],
    [ellipsoid([-0.28, 1.28, -0.18], [0.17, 0.29, 0.12], 0.12), 0.09],
    [
      taperedSpineField(
        [
          [-0.38, 1.28, 0.17],
          [-0.64, 0.83, 0.27],
          [-0.57, 0.67, 0.3],
          [-0.46, 0.54, 0.33],
        ],
        [0.112, 0.07, 0.039, 0.047],
      ),
      0.065,
    ],
    [
      taperedSpineField(
        [
          [-0.3, 1.24, -0.2],
          [-0.21, 0.77, -0.24],
          [-0.36, 0.32, -0.25],
          [-0.39, 0.24, -0.25],
        ],
        [0.097, 0.06, 0.037, 0.042],
      ),
      0.06,
    ],
    [ellipsoid([0.48, 1.12, 0.15], [0.19, 0.3, 0.135], -0.38), 0.09],
    [ellipsoid([0.57, 1.12, -0.2], [0.18, 0.27, 0.13], -0.22), 0.08],
    [
      taperedSpineField(
        [
          [0.5, 1.15, 0.17],
          [0.38, 0.92, 0.21],
          [0.39, 0.83, 0.24],
          [0.53, 0.7, 0.24],
          [0.67, 0.56, 0.24],
          [0.65, 0.39, 0.24],
          [0.63, 0.22, 0.24],
        ],
        [0.105, 0.08, 0.065, 0.05, 0.039, 0.034, 0.044],
      ),
      0.065,
    ],
    [
      taperedSpineField(
        [
          [0.63, 1.14, -0.23],
          [0.57, 0.95, -0.26],
          [0.59, 0.84, -0.25],
          [0.7, 0.69, -0.25],
          [0.84, 0.55, -0.25],
          [0.83, 0.38, -0.25],
          [0.81, 0.22, -0.25],
        ],
        [0.092, 0.075, 0.059, 0.045, 0.038, 0.032, 0.039],
      ),
      0.06,
    ],
    [
      taperedSpineField(
        [[-0.34, 1.34, 0.035], [-0.46, 1.61, 0.065], [-0.54, 1.84, 0.1], HEAD.toArray()],
        [0.22, 0.193, 0.139, 0.124],
      ),
      0.12,
    ],
    [ellipsoid([-0.48, 1.52, 0.16], [0.15, 0.27, 0.16], 0.14), 0.075],
  ];
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.025, -0.006], [0.17, 0.157, 0.17]), 0.045],
    [ellipsoid([0, -0.059, 0.092], [0.13, 0.1, 0.14]), 0.035],
    [ellipsoid([0, -0.021, 0.235], [0.08, 0.086, 0.203]), 0.042],
    [ellipsoid([0, -0.104, 0.241], [0.075, 0.039, 0.157]), 0.021],
    [ellipsoid([-0.123, 0.077, 0.094], [0.063, 0.028, 0.055], -0.13), 0.035],
    [ellipsoid([0.123, 0.077, 0.094], [0.063, 0.028, 0.055], 0.13), 0.035],
  ];
  const inv = new T.Matrix4().makeRotationFromQuaternion(HEAD_ROTATION.clone().invert()).elements;
  return (x, y, z) => {
    let f = 10;
    for (const [shape, k] of shapes) f = union(f, shape(x, y, z), k);
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    if (Math.abs(dx) > 0.62 || Math.abs(dy) > 0.4 || Math.abs(dz) > 0.62) return f;
    const hx = inv[0] * dx + inv[4] * dy + inv[8] * dz,
      hy = inv[1] * dx + inv[5] * dy + inv[9] * dz,
      hz = inv[2] * dx + inv[6] * dy + inv[10] * dz;
    let h = 10;
    for (const [shape, k] of skull) h = union(h, shape(hx, hy, hz), k);
    for (const side of [-1, 1]) {
      const eye =
        (Math.hypot((hx - side * 0.13) / 0.051, (hy - 0.045) / 0.027, (hz - 0.139) / 0.049) - 1) *
        0.027;
      h = Math.max(h, -eye);
    }
    return union(f, h, 0.045);
  };
}
function coatColor(p: T.Vector3) {
  const local = p.clone().sub(HEAD).applyQuaternion(HEAD_ROTATION.clone().invert());
  const throat =
    smooth(p.z, 0.05, 0.22) *
    smooth(-p.x, 0.3, 0.6) *
    smooth(p.y, 1.2, 1.55) *
    (1 - smooth(p.y, 1.87, 2.04));
  const muzzle =
    smooth(local.z, 0.18, 0.34) *
    (1 - smooth(local.y, -0.04, 0.03)) *
    smooth(local.y, -0.22, -0.14);
  const legs = 1 - smooth(p.y, 0.3, 0.9),
    saddle = smooth(p.y, 1.38, 1.62);
  return new T.Color('#807054')
    .lerp(new T.Color('#494c39'), saddle * 0.32)
    .lerp(new T.Color('#3d3c2f'), legs * 0.45)
    .lerp(new T.Color('#c3c5a4'), Math.max(throat * 0.9, muzzle * 0.73));
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
    normalScale: new T.Vector2(0.22, -0.22),
    roughnessMap: rough,
    metalnessMap: rough,
    metalness: 0,
    roughness: kind === 'nose' ? 0.67 : 0.93,
    vertexColors: kind !== 'nose',
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

/** Wide pinnae have a fleshy root, curved rim and an inset inner surface. */
function ear(parent: T.Object3D, side: number, coat: T.Material) {
  const group = new T.Group();
  group.name = `Thornstag_Ear_${side}`;
  group.position.set(side * 0.125, 0.052, -0.05);
  group.rotation.z = -side * 0.87;
  group.rotation.y = side * 0.2;
  group.userData.motion = 'thornstagEar';
  group.userData.side = side;
  parent.add(group);
  const g = loft(
    [
      [0, 0, 0],
      [side * 0.015, 0.14, -0.012],
      [side * 0.02, 0.31, -0.035],
    ],
    [0.041, 0.094, 0.001],
    [0.034, 0.029, 0.001],
    44,
    24,
  );
  // Weld shading at the loft's duplicated longitudinal seam.
  const n = g.getAttribute('normal');
  for (let i = 0; i <= 44; i++) {
    const a = i * 25,
      b = a + 24,
      d = new T.Vector3()
        .fromBufferAttribute(n, a)
        .add(new T.Vector3().fromBufferAttribute(n, b))
        .normalize();
    n.setXYZ(a, d.x, d.y, d.z);
    n.setXYZ(b, d.x, d.y, d.z);
  }
  const outer = mesh(group, g, coat, `Thornstag_EarShell_${side}`);
  outer.material = coat;
  const inner = new T.BufferGeometry(),
    points: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  const rows = 24,
    cols = 12;
  for (let i = 0; i <= rows; i++) {
    const t = i / rows,
      y = 0.045 + t * 0.225,
      w = 0.071 * Math.sin(t * Math.PI) ** 0.74;
    for (let j = 0; j <= cols; j++) {
      const u = (j / cols) * 2 - 1;
      points.push(side * 0.018 * t + u * w, y, 0.021 - 0.047 * t + 0.014 * u * u);
      uv.push(j / cols, t);
      if (i < rows && j < cols) {
        const a = i * (cols + 1) + j;
        indices.push(a, a + 1, a + cols + 1, a + 1, a + cols + 2, a + cols + 1);
      }
    }
  }
  inner.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  inner.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  inner.setIndex(indices);
  inner.computeVertexNormals();
  mesh(
    group,
    inner,
    new T.MeshStandardMaterial({ color: '#777759', roughness: 0.95, side: T.DoubleSide }),
    `Thornstag_InnerEar_${side}`,
  );
}
function antlers(parent: T.Object3D) {
  const branches: [number[][], number[]][] = [
    [
      [
        [-0.11, 0.12, -0.08],
        [-0.29, 0.32, -0.1],
        [-0.56, 0.45, -0.2],
        [-0.83, 0.79, -0.14],
      ],
      [0.052, 0.045, 0.027, 0.002],
    ],
    [
      [
        [-0.39, 0.38, -0.16],
        [-0.4, 0.62, 0.07],
        [-0.35, 0.82, 0.16],
      ],
      [0.035, 0.017, 0.0015],
    ],
    [
      [
        [-0.77, 0.68, -0.16],
        [-0.63, 0.85, -0.2],
        [-0.55, 0.96, -0.18],
      ],
      [0.018, 0.011, 0.001],
    ],
    [
      [
        [0.11, 0.13, -0.09],
        [0.32, 0.35, -0.18],
        [0.57, 0.49, -0.31],
        [0.74, 0.73, -0.35],
      ],
      [0.052, 0.043, 0.025, 0.002],
    ],
    [
      [
        [0.51, 0.47, -0.29],
        [0.52, 0.74, -0.23],
        [0.45, 0.89, -0.11],
      ],
      [0.027, 0.015, 0.001],
    ],
    [
      [
        [0.72, 0.68, -0.35],
        [0.89, 0.72, -0.29],
        [0.94, 0.84, -0.2],
      ],
      [0.016, 0.012, 0.003],
    ],
  ];
  const material = surfaceMaterial('antler');
  const tint = (p: T.Vector3) =>
    new T.Color('#746443').lerp(new T.Color('#ba9a61'), smooth(p.y, 0.15, 0.9));
  // Fused forks carry the broad structure. Analytic tips remain continuous below the field grid scale.
  const fields = branches.map(([points, radii], index) => {
    const curve = new T.CatmullRomCurve3(points.map(v));
    const radius = (t: number) => {
      const f = t * (radii.length - 1),
        i = Math.min(radii.length - 2, Math.floor(f));
      return T.MathUtils.lerp(radii[i], radii[i + 1], f - i);
    };
    const cut = curve.getPoint(0.8),
      direction = curve.getTangent(0.8).normalize();
    const base = taperedSpineField(points, radii);
    const tipPoints: number[][] = [],
      tipRadii: number[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = 0.7 + (0.3 * i) / 12;
      tipPoints.push(curve.getPoint(t).toArray());
      tipRadii.push(radius(t) * T.MathUtils.lerp(0.96, 1.01, smooth(t, 0.7, 0.79)));
    }
    const tip = loft(tipPoints, tipRadii, tipRadii, 42, 16),
      colors: number[] = [];
    const p = tip.getAttribute('position');
    for (let i = 0; i < p.count; i++)
      colors.push(...tint(new T.Vector3().fromBufferAttribute(p, i)).toArray());
    tip.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    mesh(parent, tip, material, `Thornstag_TineTip_${index}`);
    return (x: number, y: number, z: number) =>
      Math.max(
        base(x, y, z),
        (x - cut.x) * direction.x + (y - cut.y) * direction.y + (z - cut.z) * direction.z,
      );
  });
  const field: Field = (x, y, z) => fields.reduce((d, f) => union(d, f(x, y, z), 0.024), 10);
  const geometry = sculptField(
    field,
    { step: 0.013, origin: [-0.98, 0.04, -0.68], cells: [160, 75, 76] },
    tint,
  );
  mesh(parent, geometry, material, 'Thornstag_ThornCrown');
}

/** Two joined-at-the-coronet toe shells preserve a readable cloven front. */
function hoof(parent: T.Object3D, index: number, p: number[], material: T.Material) {
  const group = new T.Group();
  group.name = `Thornstag_Hoof_${index}`;
  group.position.copy(v(p));
  parent.add(group);
  for (const side of [-1, 1]) {
    const vertices: number[] = [],
      indices: number[] = [],
      uv: number[] = [],
      rings = [0, 0.014, 0.085, 0.115],
      sides = 40;
    for (let ring = 0; ring < 4; ring++)
      for (let i = 0; i <= sides; i++) {
        const a = (i / sides) * Math.PI * 2,
          c = Math.cos(a),
          s = Math.sin(a);
        const x =
          [0.059, 0.066, 0.051, 0.044][ring] * Math.sign(c) * Math.abs(c) ** 0.72 +
          [-0.018, -0.019, 0.002, 0.012][ring];
        const z =
          [0.017, 0.021, 0.02, 0.019][ring] * Math.sign(s) * Math.abs(s) ** 0.72 + side * 0.025;
        vertices.push(x, rings[ring], z);
        uv.push(i / sides, ring / 3);
        if (ring < 3 && i < sides) {
          const k = ring * (sides + 1) + i;
          indices.push(k, k + sides + 1, k + 1, k + 1, k + sides + 1, k + sides + 2);
        }
      }
    const bottom = vertices.length / 3;
    vertices.push(-0.018, 0, side * 0.025);
    uv.push(0.5, 0);
    const top = vertices.length / 3;
    vertices.push(0.012, 0.115, side * 0.025);
    uv.push(0.5, 1);
    for (let i = 0; i < sides; i++) {
      indices.push(bottom, i, i + 1);
      const k = 3 * (sides + 1) + i;
      indices.push(top, k + 1, k);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    mesh(group, g, material, `Thornstag_Hoof_${index}_Toe_${side}`);
  }
  return group;
}

export function thornstag(root: T.Group) {
  const coat = surfaceMaterial(),
    plainCoat = coat.clone();
  plainCoat.vertexColors = false;
  plainCoat.color.set('#84785b');
  const leather = surfaceMaterial('nose');
  leather.color.set('#303329');
  const horn = new T.MeshStandardMaterial({ color: '#414034', roughness: 0.69 });
  const rim = new T.MeshStandardMaterial({ color: '#222a22', roughness: 0.76 });
  const anchor = new T.Bone();
  anchor.name = 'Thornstag_Anchor';
  root.add(anchor);
  const neck = new T.Bone();
  neck.name = 'Thornstag_Neck';
  neck.position.set(-0.43, 1.53, 0.075);
  neck.userData.motion = 'thornstagNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'Thornstag_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'thornstagHead';
  neck.add(head);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, neck, head]);
  const field = anatomyField();
  const geometry = sculptField(
    field,
    { step: 0.022, origin: [-1.13, 0.15, -0.56], cells: [102, 97, 58] },
    coatColor,
  );
  const pos = geometry.getAttribute('position'),
    joints: number[] = [],
    weights: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i),
      x = pos.getX(i),
      h = smooth(y, 1.78, 1.87),
      n = (1 - h) * smooth(y, 1.37, 1.75) * smooth(-x, 0.22, 0.37);
    joints.push(0, 1, 2, 0);
    weights.push(1 - h - n, n, h, 0);
  }
  geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  const body = new T.SkinnedMesh(geometry, coat);
  body.name = 'Thornstag_ContinuousAnatomy';
  body.castShadow = body.receiveShadow = true;
  root.add(body);
  body.bind(skeleton);
  const face = new T.Group();
  face.name = 'Thornstag_Face';
  face.quaternion.copy(HEAD_ROTATION);
  head.add(face);
  antlers(face);
  const fittedMouth = (side: number) =>
    Array.from({ length: 24 }, (_, i) => {
      const t = i / 23,
        x = side * (0.006 + t * 0.1),
        y = -0.088 - 0.01 * Math.sin(t * Math.PI);
      const sample = (z: number) => {
        const p = new T.Vector3(x, y, z).applyQuaternion(HEAD_ROTATION).add(HEAD);
        return field(p.x, p.y, p.z);
      };
      let inside = 0.6;
      while (inside > 0 && sample(inside) > 0) inside -= 0.01;
      let outside = inside + 0.01;
      for (let j = 0; j < 16; j++) {
        const m = (outside + inside) / 2;
        if (sample(m) > 0) outside = m;
        else inside = m;
      }
      return [x, y, (inside + outside) / 2 + 0.001];
    });
  for (const side of [-1, 1]) {
    ear(face, side, plainCoat);
    const eye = new T.Group();
    eye.name = `Thornstag_Eye_${side}`;
    eye.position.set(side * 0.13, 0.045, 0.13);
    eye.rotation.y = side * 0.72;
    eye.rotation.z = side * 0.13;
    eye.userData.motion = 'thornstagBlink';
    face.add(eye);
    oval(eye, `Thornstag_EyeSocket_${side}`, [0, 0, 0], [0.041, 0.022, 0.022], rim);
    oval(
      eye,
      `Thornstag_Iris_${side}`,
      [0, 0, 0.018],
      [0.028, 0.016, 0.014],
      new T.MeshStandardMaterial({ color: '#86744b', roughness: 0.35 }),
    );
    oval(eye, `Thornstag_Pupil_${side}`, [0, 0, 0.03], [0.021, 0.007, 0.004], rim);
    oval(
      eye,
      `Thornstag_Catchlight_${side}`,
      [-0.008, 0.006, 0.034],
      [0.003, 0.003, 0.0015],
      new T.MeshStandardMaterial({ color: '#dad9b7', roughness: 0.2 }),
    );
    stroke(face, `Thornstag_Mouth_${side}`, fittedMouth(side), [0.0014, 0.002, 0.0005], rim);
  }
  oval(face, 'Thornstag_LeatherNose', [0, -0.023, 0.42], [0.067, 0.045, 0.036], leather);
  for (const side of [-1, 1])
    oval(
      face,
      `Thornstag_Nostril_${side}`,
      [side * 0.038, -0.014, 0.445],
      [0.013, 0.007, 0.006],
      rim,
    );
  FEET.forEach((p, i) => hoof(root, i, p, horn));
  const tail = new T.Group();
  tail.name = 'Thornstag_Tail';
  tail.position.set(0.74, 1.32, -0.065);
  tail.rotation.z = -0.35;
  tail.userData.motion = 'thornstagTail';
  root.add(tail);
  const tg = loft(
    [
      [0, 0, 0],
      [0.12, 0.055, -0.025],
      [0.22, -0.008, -0.06],
    ],
    [0.085, 0.072, 0.002],
    [0.075, 0.055, 0.002],
    40,
    20,
  );
  const tailColors: number[] = [];
  const normals = tg.getAttribute('normal');
  for (let i = 0; i < normals.count; i++)
    tailColors.push(
      ...new T.Color('#84785b')
        .lerp(new T.Color('#cbc9aa'), smooth(-normals.getY(i), 0.1, 0.75) * 0.95)
        .toArray(),
    );
  tg.setAttribute('color', new T.Float32BufferAttribute(tailColors, 3));
  mesh(tail, tg, coat, 'Thornstag_TailCoat');
  root.updateMatrixWorld(true);
}
export function thornstagMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((object) => {
    const motion = object.userData.motion as string | undefined;
    if (!motion?.startsWith('thornstag')) return;
    const values: number[] = [],
      rest = object.quaternion.clone();
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'thornstagNeck') {
        e.y = Math.sin(a) * 0.025;
        e.z = Math.sin(a - 0.5) * 0.004;
      }
      if (motion === 'thornstagHead') {
        e.y = Math.sin(a - 0.5) * 0.075;
        e.x = Math.sin(a - 0.2) * 0.018;
      }
      if (motion === 'thornstagEar')
        e.y = Math.sin(a + (object.userData.side as number) * 0.8) ** 7 * 0.13;
      if (motion === 'thornstagTail') {
        e.y = Math.sin(a - 0.8) * 0.1;
        e.z = Math.sin(a - 1.1) * 0.06;
      }
      if (motion === 'thornstagBlink') {
        const b = Math.max(0, 1 - Math.abs(time - 4.3) / 0.15);
        values.push(1, 1 - b * 0.93, 1);
      } else values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const size = motion === 'thornstagBlink' ? 3 : 4;
    values.splice(values.length - size, size, ...values.slice(0, size));
    tracks.push(
      motion === 'thornstagBlink'
        ? new T.VectorKeyframeTrack(`${object.name}.scale`, times, values)
        : new T.QuaternionKeyframeTrack(`${object.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
