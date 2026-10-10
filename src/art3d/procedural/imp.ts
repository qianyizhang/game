import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';
const smooth = T.MathUtils.smoothstep;
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const HEAD = new T.Vector3(-0.18, 1.25, 0.13);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(-0.07, -0.28, -0.12, 'YXZ'));
const FEET = [
  [-0.28, 0.16, 0.26],
  [0.23, 0.16, 0.14],
];
const HANDS = [
  { p: [-0.55, 0.63, 0.29], wrist: [-0.53, 0.69, 0.26], twist: 0.2 },
  { p: [0.23, 0.64, 0.3], wrist: [0.28, 0.7, 0.27], twist: -0.3 },
];
function wingFrame(side: number) {
  return side < 0
    ? {
        shoulder: v([-0.29, 0.95, -0.075]),
        elbow: v([-0.53, 1.11, -0.15]),
        wrist: v([-0.67, 1.25, -0.18]),
      }
    : {
        shoulder: v([0.11, 0.98, -0.085]),
        elbow: v([0.31, 1.2, -0.2]),
        wrist: v([0.48, 1.36, -0.25]),
      };
}
/** Unequal bent legs carry the tilted chest and an attentive, forward-projecting head. */
function anatomy(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([-0.035, 0.5, -0.045], [0.2, 0.205, 0.175], -0.16), 0.057],
    [ellipsoid([-0.085, 0.7, -0.005], [0.18, 0.25, 0.16], 0.15), 0.056],
    [ellipsoid([-0.11, 0.89, 0.008], [0.25, 0.23, 0.19], -0.1), 0.07],
    [ellipsoid([-0.25, 0.405, 0.095], [0.12, 0.17, 0.115], -0.48), 0.043],
    [ellipsoid([0.19, 0.41, 0.065], [0.12, 0.175, 0.105], 0.5), 0.043],
    [
      taperedSpineField(
        [[-0.18, 0.49, 0.005], [-0.34, 0.36, 0.23], [-0.33, 0.235, 0.16], FEET[0]],
        [0.105, 0.077, 0.048, 0.059],
      ),
      0.05,
    ],
    [
      taperedSpineField(
        [[0.12, 0.49, -0.005], [0.31, 0.37, 0.19], [0.285, 0.24, 0.05], FEET[1]],
        [0.105, 0.073, 0.052, 0.06],
      ),
      0.05,
    ],
    [
      taperedSpineField(
        [[-0.3, 0.91, 0.02], [-0.45, 0.72, 0.14], [-0.53, 0.69, 0.26], HANDS[0].p],
        [0.086, 0.063, 0.039, 0.032],
      ),
      0.055,
    ],
    [
      taperedSpineField(
        [[0.115, 0.93, 0.025], [0.34, 0.75, 0.15], [0.28, 0.7, 0.27], HANDS[1].p],
        [0.087, 0.064, 0.043, 0.035],
      ),
      0.053,
    ],
    [
      taperedSpineField(
        [[-0.12, 0.94, 0], [-0.16, 1.075, 0.055], HEAD.toArray()],
        [0.17, 0.14, 0.145],
      ),
      0.06,
    ],
  ];
  for (const [x, y, z] of FEET) {
    shapes.push([ellipsoid([x, y + 0.014, z], [0.1, 0.078, 0.16]), 0.024]);
    for (let i = 0; i < 3; i++)
      shapes.push([
        taperedSpineField(
          [
            [x + (i - 1) * 0.055, y, z + 0.03],
            [x + (i - 1) * 0.075, y - 0.007, z + 0.135],
            [x + (i - 1) * 0.087, y - 0.008, z + 0.19 + (i === 1 ? 0.023 : 0)],
          ],
          [0.034, 0.028, 0.02],
        ),
        0.015,
      ]);
  }
  for (const side of [-1, 1]) {
    const { shoulder, elbow, wrist } = wingFrame(side);
    shapes.push([
      taperedSpineField(
        [shoulder.toArray(), elbow.toArray(), wrist.toArray()],
        [0.08, 0.046, 0.025],
      ),
      0.045,
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
function pigment(p: T.Vector3) {
  const h = p.clone().sub(HEAD).applyQuaternion(TURN.clone().invert());
  const face = smooth(p.y, 1.05, 1.16) * (1 - smooth(Math.abs(p.x - HEAD.x), 0.19, 0.3));
  const mask = face * smooth(h.z, 0.02, 0.14);
  const socket =
    face *
    smooth(h.z, 0.08, 0.15) *
    Math.exp(-(((Math.abs(h.x) - 0.108) / 0.058) ** 2) - ((h.y - 0.047) / 0.039) ** 2);
  const temple = face * (1 - smooth(h.z, 0.01, 0.15));
  const chest =
    smooth(p.z, 0.06, 0.19) *
    (1 - smooth(Math.abs(p.x + 0.08), 0.12, 0.25)) *
    (1 - smooth(p.y, 0.93, 1.1));
  const wing = smooth(-p.z, 0.05, 0.16) * smooth(Math.abs(p.x + 0.1), 0.18, 0.38);
  return new T.Color('#896475')
    .lerp(new T.Color('#ba929b'), mask * 0.83)
    .lerp(new T.Color('#574055'), socket * 0.68)
    .lerp(new T.Color('#674a63'), temple * 0.38)
    .lerp(new T.Color('#ba909a'), chest * 0.48)
    .lerp(new T.Color('#553c53'), wing * 0.72)
    .lerp(new T.Color('#574152'), (1 - smooth(p.y, 0.2, 0.45)) * 0.4);
}
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
/** Fine pores on flesh, tension wrinkles on webbing, axial grain on keratin. */
function surface(kind: 'skin' | 'membrane' | 'horn') {
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
      } else if (kind === 'membrane') {
        const tension = Math.sin(u * Math.PI * 64 + Math.sin(t * Math.PI * 8) * 1.8);
        const cross = Math.sin(t * Math.PI * 42 + Math.sin(u * Math.PI * 12));
        h = tension * 0.08 + cross * 0.025 + (fine - 0.5) * 0.015;
        tone = 236 + broad * 3 + tension * 5 + cross * 1.5;
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
  const wing =
    smooth(-p.z, 0.025, 0.12) * smooth(Math.abs(p.x + 0.1), 0.16, 0.32) * smooth(p.y, 0.87, 1.04);
  const head = smooth(p.y, 1.03, 1.13) * (1 - wing),
    neck = smooth(p.y, 0.94, 1.11) * (1 - head - wing);
  const wrist = wing * smooth(Math.abs(p.x + 0.1), 0.36, 0.65);
  return {
    j: [0, 1, 2, p.x < -0.1 ? 3 : 4, p.x < -0.1 ? 5 : 6],
    w: [1 - wing - head - neck, neck, head, wing - wrist, wrist],
  };
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

/** Closed sheet with thickness, camber and scalloped trailing edges between curved fingers. */
function web(a: T.CatmullRomCurve3, b: T.CatmullRomCurve3, side: number) {
  const cols = 16,
    rows = 32,
    n = (cols + 1) * (rows + 1),
    pos: number[] = [],
    uv: number[] = [],
    colors: number[] = [],
    idx: number[] = [];
  for (const layer of [-1, 1])
    for (let j = 0; j <= rows; j++)
      for (let i = 0; i <= cols; i++) {
        const u = i / cols,
          t = 0.025 + (j / rows) * 0.975;
        const aa = a.getPoint(t),
          bb = b.getPoint(t),
          p = aa.clone().lerp(bb, u);
        const wrist = a.getPoint(0);
        p.lerp(wrist, Math.sin(u * Math.PI) * Math.pow(t, 5) * 0.18);
        p.z += side * Math.sin(u * Math.PI) * Math.sin(t * Math.PI) * 0.048 + layer * 0.003;
        pos.push(...p.toArray());
        uv.push(u, t);
        colors.push(
          ...new T.Color('#503548')
            .lerp(
              new T.Color('#9a6479'),
              Math.pow(Math.abs(u - 0.5) * 2, 5) * 0.4 + Math.sin(t * Math.PI) * 0.14,
            )
            .toArray(),
        );
      }
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const k = j * (cols + 1) + i,
        q = k + cols + 1;
      idx.push(k, q, k + 1, k + 1, q, q + 1, n + k, n + k + 1, n + q, n + k + 1, n + q + 1, n + q);
    }
  const border: number[] = [];
  for (let i = 0; i <= cols; i++) border.push(i);
  for (let j = 1; j <= rows; j++) border.push(j * (cols + 1) + cols);
  for (let i = cols - 1; i >= 0; i--) border.push(rows * (cols + 1) + i);
  for (let j = rows - 1; j > 0; j--) border.push(j * (cols + 1));
  for (let i = 0; i < border.length; i++) {
    const a = border[i],
      b = border[(i + 1) % border.length];
    idx.push(a, b, n + a, b, n + b, n + a);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // Both authored wings can reverse their projected handedness. Correct the whole solid.
  let volume = 0;
  for (let i = 0; i < idx.length; i += 3) {
    const a = v(pos.slice(idx[i] * 3, idx[i] * 3 + 3)),
      b = v(pos.slice(idx[i + 1] * 3, idx[i + 1] * 3 + 3)),
      c = v(pos.slice(idx[i + 2] * 3, idx[i + 2] * 3 + 3));
    volume += a.dot(b.cross(c));
  }
  if (volume < 0) {
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
    g.setIndex(idx);
    g.computeVertexNormals();
  }
  return g;
}
function wing(root: T.Group, side: number, membrane: T.Material, rib: T.Material, anchor: T.Bone) {
  const { shoulder, elbow, wrist } = wingFrame(side);
  const ends = (
    side < 0
      ? [
          [-0.98, 1.46, -0.21],
          [-1.0, 0.98, -0.28],
          [-0.65, 0.64, -0.23],
          [-0.3, 0.7, -0.09],
        ]
      : [
          [0.88, 1.57, -0.32],
          [1.0, 1.05, -0.36],
          [0.6, 0.7, -0.27],
          [0.15, 0.73, -0.12],
        ]
  ).map(v);
  const base = new T.Bone();
  base.name = `Imp_WingRoot_${side}`;
  base.position.copy(shoulder);
  base.userData.motion = 'impWing';
  base.userData.side = side;
  root.add(base);
  const wristBone = new T.Bone();
  wristBone.name = `Imp_Wrist_${side}`;
  wristBone.position.copy(wrist).sub(shoulder);
  wristBone.userData.motion = 'impWrist';
  wristBone.userData.side = side;
  base.add(wristBone);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, base, wristBone]);
  const fit = (p: T.Vector3) => {
    const influence =
      smooth(-p.z, 0.025, 0.12) * smooth(Math.abs(p.x + 0.1), 0.16, 0.32) * smooth(p.y, 0.87, 1.04);
    const hand = influence * smooth(Math.abs(p.x + 0.1), 0.36, 0.65);
    return { j: [0, 1, 2], w: [1 - influence, influence - hand, hand] };
  };
  const curves = ends.map(
    (tip, i) =>
      new T.CatmullRomCurve3([
        wrist,
        wrist
          .clone()
          .lerp(tip, 0.5)
          .add(new T.Vector3(side * 0.025, i === 0 ? 0.035 : 0, 0.027)),
        tip,
      ]),
  );
  for (let i = 0; i < curves.length; i++) {
    const path = Array.from({ length: 8 }, (_, j) => curves[i].getPoint(j / 7).toArray());
    skin(
      root,
      loft(path, [0.02, 0.013, 0.003], [0.017, 0.011, 0.0025], 32, 12),
      rib,
      `Imp_FingerSpar_${side}_${i}`,
      skeleton,
      fit,
    );
    if (i < 3)
      skin(
        root,
        web(curves[i], curves[i + 1], 1),
        membrane,
        `Imp_WingMembrane_${side}_${i}`,
        skeleton,
        fit,
      );
  }
  skin(
    root,
    web(new T.CatmullRomCurve3([wrist, elbow, shoulder]), curves[3], 1),
    membrane,
    `Imp_WingMembrane_${side}_3`,
    skeleton,
    fit,
  );
  return { base, wrist: wristBone };
}
/** A cupped, pointed pinna with a rolled edge and a closed back. */
function ear(face: T.Group, side: number, material: T.Material) {
  const group = new T.Group();
  group.name = `Imp_Ear_${side}`;
  group.position.set(side * 0.18, 0.085, -0.034);
  group.rotation.z = side < 0 ? -0.11 : 0.17;
  group.userData.motion = 'impEar';
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
  add(group, g, material, `Imp_CuppedEar_${side}`);
  return group;
}
function hand(root: T.Group, index: number, flesh: T.Material, nail: T.Material) {
  const data = HANDS[index],
    group = new T.Group();
  group.name = `Imp_Hand_${index}`;
  group.position.copy(v(data.p));
  // Orient the wrist along its actual forearm, then twist around that axis.
  group.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    v(data.wrist).sub(v(data.p)).normalize(),
  );
  group.quaternion.multiply(
    new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), data.twist),
  );
  root.add(group);
  const shapes: [Field, number][] = [
    [ellipsoid([0, 0.005, 0], [0.069, 0.084, 0.042]), 0.02],
    [
      taperedSpineField(
        [
          [0, 0.071, 0],
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
    const x = (finger - 1) * 0.044,
      length = finger === 1 ? 0.135 : 0.112;
    const path = [
      [x, -0.025, 0.009],
      [x * 1.18, -0.092, 0.02],
      [x * 1.1, -length, 0.064],
      [x * 0.95, -length + 0.016, 0.083],
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
    let f = 10;
    for (const [shape, k] of shapes) f = union(f, shape(x, y, z), k);
    return f;
  };
  add(
    group,
    sculptField(
      field,
      { step: 0.0065, origin: [-0.13, -0.17, -0.068], cells: [42, 46, 29] },
      () => new T.Color('#986f80'),
    ),
    flesh,
    `Imp_HandSkin_${index}`,
  );
  for (let i = 0; i < tips.length; i++) {
    const [x, y, z] = tips[i];
    stroke(
      group,
      `Imp_HandClaw_${index}_${i}`,
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
export function imp(root: T.Group) {
  const flesh = surface('skin'),
    membrane = surface('membrane'),
    horn = surface('horn');
  const rib = flesh.clone();
  rib.vertexColors = false;
  rib.color.set('#956779');
  const tooth = horn.clone();
  tooth.vertexColors = false;
  tooth.color.set('#dac5aa');
  const nail = tooth.clone();
  nail.color.set('#958278');
  const dark = new T.MeshStandardMaterial({ color: '#332837', roughness: 0.7 });
  const anchor = new T.Bone();
  anchor.name = 'Imp_Anchor';
  root.add(anchor);
  const neck = new T.Bone();
  neck.name = 'Imp_Neck';
  neck.position.set(-0.16, 1.075, 0.055);
  neck.userData.motion = 'impNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'Imp_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'impHead';
  neck.add(head);
  const left = wing(root, -1, membrane, rib, anchor),
    right = wing(root, 1, membrane, rib, anchor);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([
    anchor,
    neck,
    head,
    left.base,
    right.base,
    left.wrist,
    right.wrist,
  ]);
  const field = anatomy();
  skin(
    root,
    sculptField(
      field,
      { step: 0.016, origin: [-0.83, 0.025, -0.37], cells: [94, 98, 58] },
      pigment,
    ),
    flesh,
    'Imp_ContinuousAnatomy',
    skeleton,
    weights,
  );
  const face = new T.Group();
  face.name = 'Imp_Face';
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
      `Imp_Horn_${side}`,
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
    eye.name = `Imp_Eye_${side}`;
    eye.position.set(side * 0.106, 0.041, 0.145);
    eye.rotation.y = side * 0.27;
    eye.rotation.z = side * 0.08;
    eye.userData.motion = 'impBlink';
    face.add(eye);
    oval(eye, `Imp_Orbit_${side}`, [0, 0, 0], [0.047, 0.023, 0.016], dark);
    oval(
      eye,
      `Imp_Iris_${side}`,
      [0, 0, 0.014],
      [0.032, 0.016, 0.009],
      new T.MeshStandardMaterial({ color: '#d0a86e', roughness: 0.4 }),
    );
    oval(eye, `Imp_Pupil_${side}`, [0, 0, 0.022], [0.007, 0.014, 0.003], dark);
    const y = -0.042,
      x = side * 0.04;
    oval(face, `Imp_Nostril_${side}`, [x, y, surfaceZ(x, y) + 0.001], [0.014, 0.007, 0.006], dark);
    const xTooth = side * 0.078,
      yTooth = -0.117,
      zTooth = surfaceZ(xTooth, yTooth) + 0.003;
    stroke(
      face,
      `Imp_Fang_${side}`,
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
  stroke(face, 'Imp_Mouth', mouth, [0.0008, 0.0035, 0.0009], dark);
  for (let index = 0; index < 2; index++) hand(root, index, flesh, nail);
  for (let f = 0; f < FEET.length; f++)
    for (let i = 0; i < 3; i++) {
      const [x, y, z] = FEET[f],
        tx = x + (i - 1) * 0.087,
        tz = z + 0.19 + (i === 1 ? 0.023 : 0);
      stroke(
        root,
        `Imp_ToeClaw_${f}_${i}`,
        [
          [tx, y, tz - 0.007],
          [tx, y - 0.007, tz + 0.028],
          [tx, y - 0.039, tz + 0.049],
        ],
        [0.017, 0.013, 0.0008],
        nail,
      );
    }
  root.updateMatrixWorld(true);
}
export function impMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((object) => {
    const motion = object.userData.motion as string | undefined;
    if (!motion?.startsWith('imp')) return;
    const rest = object.quaternion.clone(),
      values: number[] = [],
      side = object.userData.side as number;
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'impNeck') {
        e.y = Math.sin(a) * 0.035;
        e.z = Math.sin(a - 0.3) * 0.012;
      }
      if (motion === 'impHead') {
        e.y = Math.sin(a - 0.4) * 0.06;
        e.x = Math.sin(a * 2 - 0.2) * 0.014;
      }
      if (motion === 'impEar') e.y = Math.sin(a + side * 0.8) ** 9 * 0.09 * side;
      if (motion === 'impWing') {
        e.y = Math.sin(a + side * 0.5) * 0.023 * side;
        e.x = Math.sin(a + side * 0.5) * 0.015;
      }
      if (motion === 'impWrist') e.y = Math.sin(a - 0.7 + side * 0.5) * 0.052 * side;
      if (motion === 'impBlink') {
        const b = Math.max(0, 1 - Math.abs(time - 3.6) / 0.15);
        values.push(1, 1 - b * 0.94, 1);
      } else values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const size = motion === 'impBlink' ? 3 : 4;
    values.splice(values.length - size, size, ...values.slice(0, size));
    tracks.push(
      motion === 'impBlink'
        ? new T.VectorKeyframeTrack(`${object.name}.scale`, times, values)
        : new T.QuaternionKeyframeTrack(`${object.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
