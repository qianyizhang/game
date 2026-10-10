import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';

const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const smooth = T.MathUtils.smoothstep;
const HEAD = new T.Vector3(-0.38, 1.55, 0.12);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(-0.7, -1.0, -0.045, 'YXZ'));
const INVERSE_TURN = TURN.clone().invert();
const PAWS = [
  [-0.47, 0.16, 0.32],
  [-0.27, 0.16, -0.28],
  [0.24, 0.16, 0.34],
  [0.35, 0.16, -0.33],
];
const TAIL = [
  [0.65, 0.36, -0.03],
  [0.88, 0.27, 0.14],
  [0.84, 0.23, 0.44],
  [0.6, 0.225, 0.6],
  [0.2, 0.225, 0.66],
  [-0.04, 0.26, 0.63],
];

/** Seated caller: weight settles over folded haunches; chest and muzzle reach upward. */
function anatomyField(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([-0.13, 1.0, 0], [0.29, 0.45, 0.27], -0.14), 0.09],
    [ellipsoid([0.18, 0.72, -0.01], [0.34, 0.31, 0.25], -0.36), 0.1],
    [ellipsoid([0.42, 0.39, -0.03], [0.37, 0.26, 0.32], -0.08), 0.1],
    [ellipsoid([-0.26, 0.92, 0.185], [0.135, 0.28, 0.115], 0.07), 0.075],
    [ellipsoid([-0.15, 0.92, -0.19], [0.135, 0.27, 0.11], -0.02), 0.075],
    [
      taperedSpineField(
        [[-0.26, 0.98, 0.2], [-0.35, 0.57, 0.27], [-0.4, 0.28, 0.3], PAWS[0]],
        [0.096, 0.071, 0.05, 0.055],
      ),
      0.05,
    ],
    [
      taperedSpineField(
        [[-0.15, 0.98, -0.2], [-0.17, 0.57, -0.23], [-0.19, 0.29, -0.27], PAWS[1]],
        [0.092, 0.068, 0.047, 0.053],
      ),
      0.05,
    ],
    [ellipsoid([0.37, 0.36, 0.22], [0.31, 0.24, 0.15], 0.25), 0.07],
    [
      taperedSpineField(
        [[0.44, 0.5, 0.2], [0.64, 0.31, 0.29], [0.39, 0.18, 0.34], PAWS[2]],
        [0.13, 0.103, 0.07, 0.067],
      ),
      0.055,
    ],
    [ellipsoid([0.45, 0.39, -0.25], [0.28, 0.25, 0.15], 0.21), 0.07],
    [
      taperedSpineField(
        [[0.47, 0.55, -0.18], [0.7, 0.31, -0.28], [0.52, 0.18, -0.31], PAWS[3]],
        [0.125, 0.1, 0.07, 0.065],
      ),
      0.055,
    ],
    [
      taperedSpineField(
        [[-0.12, 1.17, 0], [-0.2, 1.33, 0.04], [-0.33, 1.52, 0.1], HEAD.toArray()],
        [0.22, 0.178, 0.157, 0.145],
      ),
      0.085,
    ],
    [ellipsoid([-0.29, 1.01, 0.035], [0.14, 0.28, 0.225], 0.1), 0.065],
    [
      taperedSpineField(
        [
          [-0.31, 1.12, 0.16],
          [-0.37, 0.91, 0.17],
          [-0.31, 0.83, 0.2],
        ],
        [0.07, 0.049, 0.008],
      ),
      0.055,
    ],
  ];
  for (const [x, y, z] of PAWS) {
    shapes.push([ellipsoid([x - 0.024, y + 0.003, z], [0.116, 0.061, 0.079]), 0.025]);
    for (let i = 0; i < 4; i++)
      shapes.push([
        ellipsoid(
          [x - 0.09 - 0.009 * Math.sin((i * Math.PI) / 3), y - 0.005, z + (i - 1.5) * 0.035],
          [0.05, 0.05, 0.025],
        ),
        0.013,
      ]);
  }
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.02, -0.024], [0.181, 0.157, 0.185]), 0.047],
    [ellipsoid([0, -0.045, 0.025], [0.145, 0.089, 0.126]), 0.038],
    [ellipsoid([0, 0.003, 0.225], [0.092, 0.077, 0.193]), 0.04],
    [ellipsoid([-0.112, 0.078, 0.104], [0.075, 0.031, 0.055], -0.12), 0.039],
    [ellipsoid([0.112, 0.078, 0.104], [0.075, 0.031, 0.055], 0.12), 0.039],
  ];
  const inv = new T.Matrix4().makeRotationFromQuaternion(INVERSE_TURN).elements;
  return (x, y, z) => {
    let f = 10;
    for (const [field, k] of shapes) f = union(f, field(x, y, z), k);
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    if (Math.abs(dx) < 0.61 && Math.abs(dy) < 0.61 && Math.abs(dz) < 0.61) {
      const hx = inv[0] * dx + inv[4] * dy + inv[8] * dz,
        hy = inv[1] * dx + inv[5] * dy + inv[9] * dz,
        hz = inv[2] * dx + inv[6] * dy + inv[10] * dz;
      let h = 10;
      for (const [field, k] of skull) h = union(h, field(hx, hy, hz), k);
      for (const side of [-1, 1]) {
        const socket =
          (Math.hypot((hx - side * 0.134) / 0.056, (hy - 0.049) / 0.028, (hz - 0.134) / 0.052) -
            1) *
          0.028;
        h = -union(-h, socket, 0.012);
      }
      f = union(f, h, 0.05);
    }
    return Math.max(f, 0.105 - y);
  };
}
function coatColor(p: T.Vector3) {
  const h = p.clone().sub(HEAD).applyQuaternion(INVERSE_TURN);
  const muzzle =
    smooth(h.z, 0.08, 0.31) *
    (1 - smooth(h.y, -0.005, 0.054)) *
    (1 - smooth(Math.abs(h.x), 0.09, 0.17));
  const mask =
    smooth(h.z, -0.012, 0.065) *
    (1 - smooth(h.z, 0.19, 0.31)) *
    smooth(h.y, -0.041, 0.015) *
    (1 - smooth(h.y, 0.071, 0.12));
  const bib = smooth(-p.x, 0.2, 0.36) * (1 - smooth(p.y, 1.39, 1.57));
  const belly = (1 - smooth(p.y, 0.55, 0.85)) * smooth(-p.x, -0.2, 0.1) * 0.36;
  const dorsal = smooth(p.x, -0.05, 0.32) * smooth(p.y, 0.45, 0.84);
  return new T.Color('#486657')
    .lerp(new T.Color('#263e35'), dorsal * 0.8)
    .lerp(new T.Color('#c4c1a0'), Math.max(muzzle * 0.95, mask * 0.8, bib * 0.82, belly));
}

// Local coat maps adapted from the earlier canids, without modifying those assets.
const hash = (x: number, y: number) => {
  const f = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return f - Math.floor(f);
};
function surfaceMaterial(kind: 'fur' | 'nose' | 'leather' = 'fur') {
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
        // Broken, low-contrast undercoat clumps sit beneath the fine guard hairs.
        const clump =
          Math.sin(x * 0.15 + Math.sin(y * 0.041) * 1.8) *
          Math.sin(y * 0.034 + Math.sin(x * 0.067));
        relief += clump * 0.015;
        tone += clump * 1.5 - 15;
        tone += (hash(x, y) - 0.5) * 6;
      } else if (kind === 'leather') {
        const grain = hash(x, y),
          crease = Math.sin(x * 0.12 + Math.sin(y * 0.035) * 2) * Math.sin(y * 0.16);
        relief = (grain - 0.5) * 0.14 + crease * 0.022;
        tone = 222 + (grain - 0.5) * 9 + crease * 3;
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
    normalScale: new T.Vector2(0.29, -0.29),
    roughnessMap: rough,
    metalnessMap: rough,
    metalness: 0,
    roughness: kind === 'nose' ? 0.67 : kind === 'leather' ? 0.91 : 0.97,
    vertexColors: kind !== 'nose',
  });
}

function mesh(parent: T.Object3D, g: T.BufferGeometry, m: T.Material, name: string) {
  const o = new T.Mesh(g, m);
  o.name = name;
  o.castShadow = o.receiveShadow = true;
  parent.add(o);
  return o;
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
  material: T.Material,
) {
  return mesh(parent, loft(points, radii, radii, 32, 12), material, name);
}
function ear(parent: T.Object3D, side: number, fur: T.Material) {
  const group = new T.Group();
  group.name = `Packcaller_Ear_${side}`;
  group.position.set(side * 0.104, 0.098, -0.055);
  group.rotation.z = side < 0 ? 0.32 : -0.15;
  group.rotation.y = side * 0.25;
  group.userData.motion = 'packcallerEar';
  group.userData.side = side;
  parent.add(group);
  const rows = 28,
    cols = 24,
    sheet = (rows + 1) * (cols + 1),
    p: number[] = [],
    uv: number[] = [],
    colors: number[] = [],
    idx: number[] = [];
  for (let face = 0; face < 2; face++)
    for (let i = 0; i <= rows; i++)
      for (let j = 0; j <= cols; j++) {
        const t = i / rows,
          u = (j / cols) * 2 - 1,
          width = 0.08 * Math.pow(1 - t, 0.62) * (0.8 + 0.2 * Math.sin(t * Math.PI)),
          x = side * (0.018 * t + 0.025 * Math.sin(t * Math.PI)) + u * width,
          y = -0.06 + t * 0.285;
        const z =
          -0.06 * t +
          0.012 * Math.sin(t * Math.PI) +
          (face === 0
            ? 0.018 + 0.06 * u * u * Math.pow(Math.sin(t * Math.PI), 0.3)
            : -0.024 + 0.048 * u * u) *
            (1 - t);

        p.push(x, y, z);
        uv.push((j / cols) * 0.7, t * 0.9);
        const edge = smooth(Math.abs(u), 0.45, 0.94);
        const color =
          face === 0
            ? new T.Color('#817d68')
                .lerp(new T.Color('#657157'), edge)
                .lerp(new T.Color('#4a5846'), (1 - t) * 0.38)
            : new T.Color('#68765c').lerp(new T.Color('#40563f'), smooth(t, 0.6, 1) * 0.5);
        colors.push(...color.toArray());
        if (i < rows && j < cols) {
          const k = face * sheet + i * (cols + 1) + j;
          idx.push(
            ...(face === 0
              ? [k, k + 1, k + cols + 1, k + 1, k + cols + 2, k + cols + 1]
              : [k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2]),
          );
        }
      }
  for (let i = 0; i < rows; i++)
    for (const j of [0, cols]) {
      const a = i * (cols + 1) + j,
        b = a + cols + 1;
      idx.push(
        ...(j === 0
          ? [a, b, a + sheet, b, b + sheet, a + sheet]
          : [a, a + sheet, b, b, a + sheet, b + sheet]),
      );
    }
  for (const row of [0, rows])
    for (let j = 0; j < cols; j++) {
      const a = row * (cols + 1) + j;
      idx.push(
        ...(row === 0
          ? [a, a + sheet, a + 1, a + 1, a + sheet, a + sheet + 1]
          : [a, a + 1, a + sheet, a + 1, a + sheet + 1, a + sheet]),
      );
    }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  mesh(group, g, fur, `Packcaller_CuppedEar_${side}`);
  return group;
}
function skinWeights(p: T.Vector3) {
  const h = p.clone().sub(HEAD).applyQuaternion(INVERSE_TURN);
  const hw =
    smooth(h.z, -0.2, -0.07) * smooth(p.y, 1.4, 1.53) * (1 - smooth(Math.abs(h.x), 0.17, 0.31));
  const nw = (1 - hw) * smooth(p.y, 1.25, 1.45);
  return [hw, nw];
}
function addJaw(face: T.Group, coat: T.MeshStandardMaterial, rim: T.Material, field: Field) {
  const hinge = new T.Group();
  hinge.name = 'Packcaller_Jaw';
  hinge.position.set(0, -0.079, 0.03);
  hinge.rotation.x = 0.29;
  hinge.userData.motion = 'packcallerJaw';
  face.add(hinge);
  const jawMat = coat.clone();
  const jawRoot = ellipsoid([0, -0.002, 0.016], [0.105, 0.053, 0.078]);
  const jawBody = ellipsoid([0, -0.01, 0.2], [0.079, 0.037, 0.151]);
  const jawTip = ellipsoid([0, -0.007, 0.323], [0.059, 0.03, 0.052]);
  const jawGeometry = sculptField(
    (x, y, z) => union(union(jawRoot(x, y, z), jawBody(x, y, z), 0.028), jawTip(x, y, z), 0.021),
    { step: 0.009, origin: [-0.144, -0.09, -0.081], cells: [32, 21, 52] },
    () => new T.Color('#b8b89c'),
  );
  const jc: number[] = [];
  const jp = jawGeometry.attributes.position;
  for (let i = 0; i < jp.count; i++) {
    const x = jp.getX(i),
      y = jp.getY(i),
      z = jp.getZ(i);
    const interior =
      smooth(y, -0.002, 0.014) *
      (1 - smooth(Math.abs(x), 0.047, 0.069)) *
      smooth(z, 0.035, 0.1) *
      (1 - smooth(z, 0.31, 0.37));
    jc.push(...new T.Color('#b8b89c').lerp(new T.Color('#2b3930'), interior).toArray());
  }
  jawGeometry.setAttribute('color', new T.Float32BufferAttribute(jc, 3));
  mesh(hinge, jawGeometry, jawMat, 'Packcaller_LowerJaw');
  // Fit the oral roof to the actual sculpted muzzle instead of floating an oval beneath it.
  const pp: number[] = [],
    pi: number[] = [];
  const rows = 32,
    cols = 16;
  for (let i = 0; i <= rows; i++)
    for (let j = 0; j <= cols; j++) {
      const z = 0.082 + (i / rows) * 0.29,
        x = ((j / cols) * 2 - 1) * 0.061 * Math.pow(Math.sin((i / rows) * Math.PI), 0.45);
      const sample = (y: number) => {
        const q = new T.Vector3(x, y, z).applyQuaternion(TURN).add(HEAD);
        return field(q.x, q.y, q.z);
      };
      let outside = -0.19;
      while (sample(outside) > 0 && outside < 0.08) outside += 0.002;
      let lo = outside - 0.002,
        hi = outside;
      for (let k = 0; k < 14; k++) {
        const m = (lo + hi) / 2;
        if (sample(m) > 0) lo = m;
        else hi = m;
      }
      pp.push(x, (lo + hi) / 2 - 0.0015, z);
      if (i < rows && j < cols) {
        const k = i * (cols + 1) + j;
        pi.push(k, k + 1, k + cols + 1, k + 1, k + cols + 2, k + cols + 1);
      }
    }
  const pg = new T.BufferGeometry();
  pg.setAttribute('position', new T.Float32BufferAttribute(pp, 3));
  pg.setIndex(pi);
  pg.computeVertexNormals();
  mesh(face, pg, rim, 'Packcaller_FittedPalate');
  const tongue = new T.MeshStandardMaterial({ color: '#80695e', roughness: 0.88 });
  oval(hinge, 'Packcaller_Tongue', [0, 0.017, 0.23], [0.025, 0.006, 0.075], tongue);
  const ivory = new T.MeshStandardMaterial({ color: '#c1c0a6', roughness: 0.63 });
  for (const side of [-1, 1]) {
    stroke(
      face,
      `Packcaller_UpperCanine_${side}`,
      [
        [side * 0.073, -0.061, 0.2],
        [side * 0.072, -0.083, 0.212],
        [side * 0.067, -0.101, 0.227],
      ],
      [0.012, 0.007, 0.0007],
      ivory,
    );
    stroke(
      hinge,
      `Packcaller_LowerCanine_${side}`,
      [
        [side * 0.065, 0.015, 0.25],
        [side * 0.065, 0.036, 0.256],
        [side * 0.06, 0.049, 0.259],
      ],
      [0.009, 0.005, 0.0006],
      ivory,
    );
  }
}
function addCollar(root: T.Group, field: Field, skeleton: T.Skeleton) {
  const center = new T.Vector3(-0.18, 1.2, 0.025),
    axis = new T.Vector3(-0.3, 0.952, 0.055).normalize();
  const u = new T.Vector3(0, 0, 1).addScaledVector(axis, -axis.z).normalize(),
    v = new T.Vector3().crossVectors(axis, u);
  const point = (a: number, t: number, offset: number) => {
    const radial = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v, Math.sin(a));
    const origin = center.clone().addScaledVector(axis, t * 0.09);
    let lo = 0,
      hi = 0.55;
    for (let i = 0; i < 20; i++) {
      const r = (lo + hi) / 2,
        q = origin.clone().addScaledVector(radial, r);
      if (field(q.x, q.y, q.z) > 0) hi = r;
      else lo = r;
    }
    return origin.addScaledVector(radial, (lo + hi) / 2 + offset);
  };
  const p: number[] = [],
    uv: number[] = [],
    idx: number[] = [],
    si: number[] = [],
    sw: number[] = [];
  const cols = 120,
    rows = 4,
    sheet = (cols + 1) * (rows + 1);
  for (let layer = 0; layer < 2; layer++)
    for (let i = 0; i <= rows; i++)
      for (let j = 0; j <= cols; j++) {
        const q = point((j / cols) * Math.PI * 2, i / rows - 0.5, layer === 0 ? 0.018 : 0.003),
          [hw, nw] = skinWeights(q);
        p.push(...q.toArray());
        uv.push((j / cols) * 3, i / rows);
        si.push(0, 1, 2, 0);
        sw.push(1 - hw - nw, nw, hw, 0);
        if (i < rows && j < cols) {
          const k = layer * sheet + i * (cols + 1) + j;
          idx.push(
            ...(layer === 0
              ? [k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2]
              : [k, k + 1, k + cols + 1, k + 1, k + cols + 2, k + cols + 1]),
          );
        }
      }
  for (const row of [0, rows])
    for (let j = 0; j < cols; j++) {
      const k = row * (cols + 1) + j;
      idx.push(
        ...(row === 0
          ? [k, k + 1, k + sheet, k + 1, k + sheet + 1, k + sheet]
          : [k, k + sheet, k + 1, k + 1, k + sheet, k + sheet + 1]),
      );
    }
  for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
  const color: number[] = [];
  for (let i = 0; i < uv.length; i += 2) {
    const edge = smooth(Math.abs(uv[i + 1] - 0.5), 0.29, 0.48);
    color.push(...new T.Color('#645039').lerp(new T.Color('#9b8057'), edge * 0.32).toArray());
  }
  g.setAttribute('color', new T.Float32BufferAttribute(color, 3));
  const leather = surfaceMaterial('leather');
  const band = new T.SkinnedMesh(g, leather);
  band.name = 'Packcaller_FittedCollar';
  band.castShadow = band.receiveShadow = true;
  root.add(band);
  band.bind(skeleton);
  // The front pendant mounts on the lower band edge; a short bail visibly meets both pieces.
  const a = -0.92,
    q = point(a, -0.46, 0.02),
    out = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v, Math.sin(a));
  const frame = new T.Group();
  frame.name = 'Packcaller_PendantAssembly';
  frame.position.copy(q);
  frame.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), out);
  root.add(frame);
  const brass = new T.MeshStandardMaterial({ color: '#a58b53', metalness: 0.73, roughness: 0.48 });
  const shape = new T.Shape();
  shape.moveTo(-0.045, -0.038);
  shape.lineTo(-0.032, 0.004);
  shape.lineTo(0.035, 0.006);
  shape.lineTo(0.049, -0.044);
  shape.lineTo(0, -0.108);
  shape.closePath();
  const hole = new T.Path();
  hole.absellipse(0, -0.021, 0.008, 0.01, 0, Math.PI * 2, true, 0);
  shape.holes.push(hole);
  const pendant = mesh(
    frame,
    new T.ExtrudeGeometry(shape, {
      depth: 0.012,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.003,
      bevelThickness: 0.002,
    }),
    brass,
    'Packcaller_BrassPendant',
  );
  pendant.position.z = 0.005;
  const bail = mesh(
    frame,
    new T.TorusGeometry(0.016, 0.0045, 10, 28),
    brass,
    'Packcaller_PendantBail',
  );
  bail.position.set(0, -0.008, 0.012);
  bail.scale.y = 1.3;
}
export function packcaller(root: T.Group) {
  const coat = surfaceMaterial(),
    noseMat = surfaceMaterial('nose');
  noseMat.color.set('#26362b');
  const rim = new T.MeshStandardMaterial({ color: '#23362a', roughness: 0.79 });
  const whisker = new T.MeshStandardMaterial({ color: '#b0b69a', roughness: 0.85 });
  const claw = new T.MeshStandardMaterial({ color: '#6b7057', roughness: 0.81 });
  const anchor = new T.Bone();
  anchor.name = 'Packcaller_Anchor';
  root.add(anchor);
  const neck = new T.Bone();
  neck.name = 'Packcaller_Neck';
  neck.position.set(-0.22, 1.31, 0.04);
  neck.userData.motion = 'packcallerNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'Packcaller_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'packcallerHead';
  neck.add(head);
  const curve = new T.CatmullRomCurve3(TAIL.map(v));
  const tailBone = new T.Bone();
  tailBone.name = 'Packcaller_Tail';
  tailBone.position.copy(curve.getPointAt(0.43));
  tailBone.userData.motion = 'packcallerTail';
  anchor.add(tailBone);
  const tip = new T.Bone();
  tip.name = 'Packcaller_TailTip';
  tip.position.copy(curve.getPointAt(0.77)).sub(tailBone.position);
  tip.userData.motion = 'packcallerTailTip';
  tailBone.add(tip);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, neck, head, tailBone, tip]);
  const field = anatomyField(),
    g = sculptField(
      field,
      { step: 0.018, origin: [-1.0, 0.015, -0.54], cells: [114, 118, 82] },
      coatColor,
    );
  const joints: number[] = [],
    weights: number[] = [],
    positions = g.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const p = new T.Vector3().fromBufferAttribute(positions, i);
    const [hw, nw] = skinWeights(p);
    joints.push(0, 1, 2, 0);
    weights.push(1 - hw - nw, nw, hw, 0);
  }
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  const body = new T.SkinnedMesh(g, coat);
  body.name = 'Packcaller_ContinuousAnatomy';
  body.castShadow = body.receiveShadow = true;
  root.add(body);
  body.bind(skeleton);
  const tg = loft(
      TAIL,
      [0.09, 0.11, 0.108, 0.085, 0.05, 0.003],
      [0.073, 0.086, 0.086, 0.073, 0.048, 0.003],
      100,
      24,
    ),
    uv = tg.attributes.uv,
    ti: number[] = [],
    tw: number[] = [],
    tc: number[] = [];
  uv.setY(uv.count - 2, 0);
  uv.setY(uv.count - 1, 1);
  for (let i = 0; i < uv.count; i++) {
    const t = uv.getY(i),
      b = smooth(t, 0.28, 0.57),
      e = smooth(t, 0.62, 0.95);
    ti.push(0, 3, 4, 0);
    tw.push(1 - b, b * (1 - e), b * e, 0);
    tc.push(
      ...new T.Color('#536d5b')
        .lerp(new T.Color('#354c3c'), smooth(t, 0.36, 0.96) * 0.78)
        .toArray(),
    );
    uv.setXY(i, uv.getX(i) * 0.8, t * 2.5);
  }
  tg.setAttribute('skinIndex', new T.Uint16BufferAttribute(ti, 4));
  tg.setAttribute('skinWeight', new T.Float32BufferAttribute(tw, 4));
  tg.setAttribute('color', new T.Float32BufferAttribute(tc, 3));
  const tn = tg.attributes.normal;
  for (let row = 0; row <= 100; row++) {
    const a = row * 25,
      b = a + 24,
      n = new T.Vector3()
        .fromBufferAttribute(tn, a)
        .add(new T.Vector3().fromBufferAttribute(tn, b))
        .normalize();
    tn.setXYZ(a, n.x, n.y, n.z);
    tn.setXYZ(b, n.x, n.y, n.z);
  }
  const tail = new T.SkinnedMesh(tg, coat);
  tail.name = 'Packcaller_BrushTail';
  tail.castShadow = tail.receiveShadow = true;
  root.add(tail);
  tail.bind(skeleton);
  const face = new T.Group();
  face.name = 'Packcaller_Face';
  face.quaternion.copy(TURN);
  head.add(face);
  const surfaceX = (y: number, z: number, side: number) => {
    const sample = (x: number) => {
      const q = new T.Vector3(x * side, y, z).applyQuaternion(TURN).add(HEAD);
      return field(q.x, q.y, q.z);
    };
    let inside = 0.33;
    while (sample(inside) > 0 && inside > 0.001) inside -= 0.002;
    let outside = inside + 0.002;
    for (let i = 0; i < 14; i++) {
      const mid = (inside + outside) / 2;
      if (sample(mid) > 0) outside = mid;
      else inside = mid;
    }
    return side * ((inside + outside) / 2 + 0.001);
  };
  for (const side of [-1, 1]) {
    ear(face, side, coat);
    const eye = new T.Group();
    eye.name = `Packcaller_Eye_${side}`;
    eye.position.set(side * 0.134, 0.049, 0.133);
    eye.rotation.y = side * 0.59;
    eye.rotation.z = side * 0.12;
    eye.userData.motion = 'packcallerBlink';
    face.add(eye);
    oval(eye, `Packcaller_Orbit_${side}`, [0, 0, 0], [0.034, 0.016, 0.019], rim);
    oval(
      eye,
      `Packcaller_Iris_${side}`,
      [0, -0.001, 0.017],
      [0.023, 0.012, 0.01],
      new T.MeshStandardMaterial({ color: '#b4a06b', roughness: 0.35 }),
    );
    oval(eye, `Packcaller_Pupil_${side}`, [0, -0.001, 0.027], [0.009, 0.009, 0.003], rim);
    oval(
      eye,
      `Packcaller_Glint_${side}`,
      [-0.009, 0.006, 0.029],
      [0.0035, 0.003, 0.0015],
      new T.MeshStandardMaterial({ color: '#d6d8b6', roughness: 0.25 }),
    );
    for (let i = 0; i < 3; i++) {
      const y = -0.043 + i * 0.012,
        z = 0.31 + i * 0.009,
        x = surfaceX(y, z, side);
      stroke(
        face,
        `Packcaller_Whisker_${side}_${i}`,
        [
          [x, y, z],
          [x + side * 0.049, y - 0.015 + i * 0.008, z + 0.015],
          [x + side * 0.1, y - 0.031 + i * 0.019, z - 0.016],
        ],
        [0.0009, 0.00065, 0.00008],
        whisker,
      );
    }
  }
  const noseGeometry = new T.SphereGeometry(1, 36, 24),
    np = noseGeometry.attributes.position;
  for (let i = 0; i < np.count; i++) {
    const y = np.getY(i);
    np.setXYZ(i, np.getX(i) * (0.82 + 0.18 * smooth(y, -0.4, 0.6)), Math.min(0.72, y), np.getZ(i));
  }
  noseGeometry.computeVertexNormals();
  const nose = mesh(face, noseGeometry, noseMat, 'Packcaller_Nose');
  nose.position.set(0, -0.005, 0.407);
  nose.scale.set(0.07, 0.05, 0.035);
  nose.rotation.x = -0.12;

  for (const side of [-1, 1])
    oval(
      face,
      `Packcaller_Nostril_${side}`,
      [side * 0.035, 0.001, 0.435],
      [0.016, 0.009, 0.007],
      rim,
    );
  stroke(
    face,
    'Packcaller_Philtrum',
    [
      [0, -0.032, 0.442],
      [0, -0.047, 0.42],
      [0, -0.062, 0.394],
    ],
    [0.002, 0.0017, 0.0008],
    rim,
  );
  for (let foot = 0; foot < 4; foot++) {
    const [x, y, z] = PAWS[foot];
    for (let i = 0; i < 4; i++) {
      const dz = (i - 1.5) * 0.033,
        tipX = x - 0.09 - 0.009 * Math.sin((i * Math.PI) / 3) - 0.039,
        tipY = y - 0.016;
      stroke(
        root,
        `Packcaller_Claw_${foot}_${i}`,
        [
          [tipX + 0.012, tipY + 0.016, z + dz],
          [tipX - 0.011, tipY + 0.009, z + dz],
          [tipX - 0.022, tipY - 0.004, z + dz],
        ],
        [0.01, 0.007, 0.0006],
        claw,
      );
    }
  }
  addJaw(face, coat, rim, field);
  addCollar(root, field, skeleton);
  root.updateMatrixWorld(true);
}
export function packcallerMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((o) => {
    const kind = o.userData.motion as string | undefined;
    if (!kind?.startsWith('packcaller')) return;
    const rest = o.quaternion.clone(),
      values: number[] = [];
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (kind === 'packcallerBlink') {
        const b = Math.max(0, 1 - Math.abs(time - 3.8) / 0.17);
        values.push(1, 1 - 0.94 * Math.sin((b * Math.PI) / 2) ** 2, 1);
        continue;
      }
      if (kind === 'packcallerNeck') {
        e.y = Math.sin(a) * 0.022;
        e.z = (Math.sin(a - 0.2) + Math.sin(0.2)) * 0.01;
      }
      if (kind === 'packcallerJaw') e.x = Math.sin(a) * 0.065;
      if (kind === 'packcallerHead') {
        e.y = Math.sin(a) ** 3 * 0.033;
        e.x = (Math.sin(a - 0.35) + Math.sin(0.35)) * 0.016;
      }
      if (kind === 'packcallerTail') e.y = (Math.sin(a - 0.6) + Math.sin(0.6)) * 0.026;
      if (kind === 'packcallerTailTip') e.y = (Math.sin(a - 0.95) + Math.sin(0.95)) * 0.033;
      if (kind === 'packcallerEar') {
        const side = o.userData.side as number;
        e.y = (Math.sin(a + side * 0.8) ** 7 - Math.sin(side * 0.8) ** 7) * side * 0.105;
      }
      values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const size = kind === 'packcallerBlink' ? 3 : 4;
    values.splice(values.length - size, size, ...values.slice(0, size));
    tracks.push(
      kind === 'packcallerBlink'
        ? new T.VectorKeyframeTrack(`${o.name}.scale`, times, values)
        : new T.QuaternionKeyframeTrack(`${o.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
