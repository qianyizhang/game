import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';

const smooth = T.MathUtils.smoothstep;
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const HEAD = new T.Vector3(-0.69, 1.13, 0.13);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(0.12, -1.04, -0.12, 'YXZ'));
const FEET = [
  [-0.64, 0.16, 0.43],
  [-0.31, 0.16, -0.34],
  [0.41, 0.16, 0.49],
  [0.65, 0.16, -0.34],
];

function wingFrame(side: number) {
  const near = side > 0;
  return {
    shoulder: v(near ? [-0.1, 0.92, 0.15] : [-0.05, 0.9, -0.15]),
    elbow: v(near ? [-0.22, 1.25, 0.3] : [-0.16, 1.14, -0.29]),
    wrist: v(near ? [0.31, 1.65, 0.44] : [0.38, 1.38, -0.4]),
  };
}
/** A low guarded crouch answers the reaching muzzle and lifted near wing. */
function anatomy(): Field {
  const fields: [Field, number][] = [
    [ellipsoid([-0.19, 0.79, 0], [0.31, 0.34, 0.28], -0.16), 0.095],
    [ellipsoid([0.1, 0.74, -0.025], [0.34, 0.225, 0.225], -0.08), 0.09],
    [ellipsoid([0.39, 0.72, -0.035], [0.28, 0.28, 0.25], 0.2), 0.075],
    [ellipsoid([-0.25, 0.67, 0.2], [0.15, 0.26, 0.15], -0.27), 0.07],
    [ellipsoid([-0.15, 0.67, -0.2], [0.14, 0.24, 0.14], 0.12), 0.07],
    [ellipsoid([0.28, 0.51, 0.24], [0.23, 0.27, 0.18], -0.4), 0.065],
    [ellipsoid([0.44, 0.53, -0.2], [0.2, 0.26, 0.17], 0.12), 0.06],
    [
      taperedSpineField(
        [[-0.23, 0.8, 0.19], [-0.32, 0.47, 0.33], [-0.48, 0.25, 0.41], FEET[0]],
        [0.13, 0.095, 0.063, 0.065],
      ),
      0.065,
    ],
    [
      taperedSpineField(
        [[-0.17, 0.79, -0.18], [-0.09, 0.45, -0.34], [-0.23, 0.25, -0.33], FEET[1]],
        [0.12, 0.085, 0.058, 0.062],
      ),
      0.063,
    ],
    [
      taperedSpineField(
        [[0.37, 0.69, 0.2], [0.2, 0.41, 0.35], [0.53, 0.25, 0.42], FEET[2]],
        [0.145, 0.115, 0.073, 0.066],
      ),
      0.062,
    ],
    [
      taperedSpineField(
        [[0.43, 0.68, -0.2], [0.49, 0.42, -0.33], [0.73, 0.24, -0.3], FEET[3]],
        [0.13, 0.11, 0.065, 0.063],
      ),
      0.062,
    ],
    [
      taperedSpineField(
        [[-0.2, 0.89, 0], [-0.39, 1.035, 0.025], [-0.54, 1.13, 0.085], HEAD.toArray()],
        [0.24, 0.2, 0.17, 0.16],
      ),
      0.07,
    ],
    [
      taperedSpineField(
        [
          [0.51, 0.73, -0.04],
          [0.82, 0.64, -0.035],
          [1.03, 0.46, 0.18],
          [0.95, 0.33, 0.44],
          [0.66, 0.3, 0.67],
          [0.4, 0.39, 0.75],
          [0.52, 0.51, 0.79],
        ],
        [0.15, 0.12, 0.084, 0.057, 0.036, 0.024, 0.02],
      ),
      0.06,
    ],
  ];
  for (const side of [-1, 1]) {
    const { shoulder, elbow, wrist } = wingFrame(side),
      curve = new T.CatmullRomCurve3([shoulder, elbow, wrist]);
    fields.push([
      taperedSpineField(
        Array.from({ length: 8 }, (_, i) => curve.getPoint(i / 7).toArray()),
        [0.12, 0.07, 0.03],
      ),
      0.055,
    ]);
  }
  for (const [x, y, z] of FEET) {
    fields.push([ellipsoid([x, y + 0.008, z], [0.14, 0.075, 0.115]), 0.026]);
    for (let i = 0; i < 3; i++)
      fields.push([
        taperedSpineField(
          [
            [x - 0.03, y, z + (i - 1) * 0.052],
            [x - 0.12, y - 0.005, z + (i - 1) * 0.082],
            [x - 0.18 + (i === 1 ? -0.025 : 0), y - 0.014, z + (i - 1) * 0.098],
          ],
          [0.037, 0.031, 0.02],
        ),
        0.015,
      ]);
  }
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.02, -0.025], [0.2, 0.165, 0.235]), 0.055],
    [ellipsoid([0, -0.072, 0.135], [0.16, 0.105, 0.26]), 0.044],
    [
      (x, y, z) =>
        (Math.pow(
          Math.pow(Math.abs(x) / 0.132, 4) +
            Math.pow(Math.abs(y + 0.003) / 0.066, 4) +
            Math.pow(Math.abs(z - 0.3) / 0.205, 4),
          0.25,
        ) -
          1) *
        0.066,
      0.04,
    ],
    [ellipsoid([0, -0.078, 0.275], [0.126, 0.036, 0.24]), 0.032],
    [ellipsoid([0, 0.1, 0.045], [0.12, 0.079, 0.185]), 0.044],
  ];
  skull.push([ellipsoid([0, 0.15, -0.055], [0.097, 0.087, 0.1]), 0.04]);
  const sockets = [-1, 1].map((side) =>
    ellipsoid([side * 0.156, 0.058, 0.103], [0.044, 0.031, 0.055]),
  );
  const inverse = new T.Matrix4().makeRotationFromQuaternion(TURN.clone().invert()).elements;
  return (x, y, z) => {
    let f = 10;
    for (const [field, k] of fields) f = union(f, field(x, y, z), k);
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    if (Math.abs(dx) < 0.8 && Math.abs(dy) < 0.4 && Math.abs(dz) < 0.7) {
      const hx = inverse[0] * dx + inverse[4] * dy + inverse[8] * dz,
        hy = inverse[1] * dx + inverse[5] * dy + inverse[9] * dz,
        hz = inverse[2] * dx + inverse[6] * dy + inverse[10] * dz;
      let h = 10;
      for (const [field, k] of skull) h = union(h, field(hx, hy, hz), k);
      for (const socket of sockets) h = -union(-h, socket(hx, hy, hz), 0.011);
      f = union(f, h, 0.05);
    }
    return Math.max(f, 0.105 - y);
  };
}
function pigment(p: T.Vector3) {
  const h = p.clone().sub(HEAD).applyQuaternion(TURN.clone().invert());
  const face = smooth(-p.x, 0.5, 0.65) * smooth(p.y, 0.8, 0.97);
  const muzzle = face * smooth(h.z, 0.1, 0.27) * (1 - smooth(h.y, 0.065, 0.16));
  const cap = face * smooth(h.y, -0.02, 0.11) * (1 - smooth(h.z, 0.24, 0.34));
  const tail = smooth(p.x, 0.56, 0.9) + smooth(p.z, 0.51, 0.62) * smooth(p.y, 0.23, 0.29);
  return new T.Color('#73866d')
    .lerp(new T.Color('#465c51'), smooth(p.y, 0.72, 1.09) * 0.43)
    .lerp(new T.Color('#aca686'), (1 - smooth(p.y, 0.4, 0.65)) * 0.2)
    .lerp(new T.Color('#b8ac8c'), cap * 0.92)
    .lerp(new T.Color('#83728c'), muzzle * 0.92)
    .lerp(new T.Color('#83a6a6'), Math.min(1, tail) * 0.91)
    .lerp(
      new T.Color('#918390'),
      smooth(p.x, -0.43, -0.31) * smooth(Math.abs(p.z), 0.14, 0.23) * smooth(p.y, 0.96, 1.27),
    );
}
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
/** Local pigment, relief and packed roughness; no external images or nondeterministic noise. */
function material(kind: 'skin' | 'membrane' | 'horn' | 'bronze') {
  const size = 512,
    paint = new Uint8Array(size * size * 4),
    normal = paint.slice(),
    packed = paint.slice(),
    height = new Float32Array(size * size),
    tone = height.slice();
  const wrap = (x: number) => ((x % size) + size) % size;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1),
        v = y / (size - 1);
      let h = 0,
        t = 238;
      if (kind === 'skin') {
        const row = Math.floor(y / 32),
          col = Math.floor(x / 32);
        let best = 4,
          second = 4;
        for (let j = row - 1; j <= row + 1; j++)
          for (let i = col - 1; i <= col + 1; i++) {
            const r = ((j % 16) + 16) % 16,
              c = ((i % 16) + 16) % 16;
            const cx = (i + 0.5) * 32 + (hash(c, r) - 0.5) * 12,
              cy = (j + 0.5) * 32 + (hash(c + 18, r) - 0.5) * 12;
            const d = Math.hypot((x - cx) / 20, (y - cy) / 17);
            if (d < best) {
              second = best;
              best = d;
            } else if (d < second) second = d;
          }
        const seam = 1 - smooth(second - best, 0.01, 0.11);
        h = 0.12 * (1 - smooth(best, 0.15, 0.95)) - seam * 0.065;
        t = 236 + (1 - best) * 7 - seam * 11 + (hash(x, y) - 0.5) * 4;
      } else if (kind === 'membrane') {
        const fold = Math.sin(u * 65 + Math.sin(v * 10) * 1.6) * Math.sin(v * Math.PI);
        const fiber = Math.sin(u * 390 + v * 17) * Math.sin(v * Math.PI);
        h = fold * 0.01 + fiber * 0.004;
        t = 235 + fold * 2.5 + fiber * 1.3 + (hash(x, y) - 0.5) * 4;
      } else if (kind === 'horn') {
        const growth = Math.sin(v * 142 + Math.sin(u * 6.28) * 1.3);
        const grain = Math.sin(u * 220 + Math.sin(v * 17));
        h = growth * 0.025 + grain * 0.009;
        t = 226 + growth * 5 + grain * 2 + v * 16;
      } else {
        // A shallow incised central stem, two branching chevrons and a worn border.
        const px = (u - 0.5) * 2,
          py = (v - 0.5) * 2;
        const diamond = Math.abs(Math.abs(px) * 0.78 + Math.abs(py) * 0.69 - 0.63);
        const stem = Math.abs(px + py * 0.08);
        const branch = Math.min(
          Math.abs(py - 0.2 + Math.abs(px) * 0.8),
          Math.abs(py + 0.21 + Math.abs(px) * 0.8),
        );
        const etch = Math.max(
          Math.exp(-((diamond / 0.013) ** 2)),
          Math.exp(-((stem / 0.009) ** 2)) * (1 - smooth(Math.abs(py), 0.62, 0.72)),
          Math.exp(-((branch / 0.012) ** 2)) * (1 - smooth(Math.abs(px), 0.4, 0.47)),
        );
        const grain = hash(x, y) - 0.5;
        h = -etch * 0.24 + grain * 0.01;
        t = 230 - etch * 44 + grain * 12 + Math.sin(x * 0.04 + y * 0.08) * 4;
      }
      height[y * size + x] = h;
      tone[y * size + x] = t;
    }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4,
        t = tone[y * size + x];
      paint.set([t, t, t, 255], i);
      const n = new T.Vector3(
        (height[y * size + wrap(x - 1)] - height[y * size + wrap(x + 1)]) * 3,
        (height[wrap(y - 1) * size + x] - height[wrap(y + 1) * size + x]) * 3,
        1,
      ).normalize();
      normal.set([128 + n.x * 127, 128 - n.y * 127, n.z * 255, 255], i);
      packed.set(
        [255, kind === 'bronze' ? 192 + hash(x, y) * 22 : 220 + hash(x, y) * 16, 255, 255],
        i,
      );
    }
  const texture = (data: Uint8Array, srgb = false) => {
    const tex = new T.DataTexture(data, size, size);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.magFilter = T.LinearFilter;
    tex.minFilter = T.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    if (srgb) tex.colorSpace = T.SRGBColorSpace;
    return tex;
  };
  const rough = texture(packed);
  return new T.MeshStandardMaterial({
    map: texture(paint, true),
    normalMap: texture(normal),
    normalScale: new T.Vector2(0.4, -0.4),
    roughnessMap: rough,
    metalnessMap: rough,
    metalness: kind === 'bronze' ? 0.6 : 0,
    roughness: kind === 'bronze' ? 0.67 : kind === 'horn' ? 0.74 : 0.9,
    vertexColors: kind === 'skin' || kind === 'membrane',
  });
}
function add(parent: T.Object3D, g: T.BufferGeometry, m: T.Material, name: string) {
  const mesh = new T.Mesh(g, m);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function oval(parent: T.Object3D, name: string, p: number[], s: number[], m: T.Material) {
  const mesh = add(parent, new T.SphereGeometry(1, 32, 24), m, name);
  mesh.position.copy(v(p));
  mesh.scale.copy(v(s));
  return mesh;
}
function stroke(parent: T.Object3D, name: string, p: number[][], r: number[], m: T.Material) {
  return add(parent, loft(p, r, r, 48, name === 'Amalgam_SweptHorn' ? 32 : 12), m, name);
}
function bodyWeights(p: T.Vector3) {
  const head = smooth(-p.x, 0.45, 0.59) * smooth(p.y, 0.56, 0.89);
  const neck = (1 - head) * smooth(-p.x, 0.22, 0.54) * smooth(p.y, 0.62, 1.0);
  const tail =
    (1 - head - neck) *
    Math.max(smooth(p.x, 0.6, 0.87), smooth(p.z, 0.53, 0.63)) *
    smooth(p.y, 0.24, 0.31);
  const tip = tail * Math.max(smooth(p.z, 0.2, 0.56), 0);
  const wing =
    smooth(p.x, -0.43, -0.31) * smooth(Math.abs(p.z), 0.13, 0.22) * smooth(p.y, 0.94, 1.17);
  return {
    j: [0, 1, 2, 3, 4, p.z > 0 ? 5 : 6, p.z > 0 ? 7 : 8],
    w: [
      (1 - head - neck - tail) * (1 - wing),
      neck * (1 - wing),
      head * (1 - wing),
      (tail - tip) * (1 - wing),
      tip * (1 - wing),
      wing * (1 - smooth(p.x, 0.22, 0.55)),
      wing * smooth(p.x, 0.22, 0.55),
    ],
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
          ...new T.Color('#595061')
            .lerp(
              new T.Color('#907b8c'),
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
function wing(root: T.Group, side: number, membrane: T.Material, rib: T.Material) {
  const near = side > 0;
  const { shoulder, elbow, wrist } = wingFrame(side);
  const ends = (
    near
      ? [
          [1.12, 1.73, 0.6],
          [1.09, 1.04, 0.83],
          [0.79, 0.6, 0.65],
          [0.28, 0.75, 0.26],
        ]
      : [
          [1.16, 1.41, -0.44],
          [1.02, 0.98, -0.6],
          [0.7, 0.67, -0.51],
          [0.26, 0.72, -0.24],
        ]
  ).map(v);
  const base = new T.Bone();
  base.name = `Amalgam_WingRoot_${side}`;
  base.position.copy(shoulder);
  base.userData.motion = 'amalgamWing';
  base.userData.side = side;
  root.add(base);
  const hand = new T.Bone();
  hand.name = `Amalgam_Wrist_${side}`;
  hand.position.copy(wrist).sub(shoulder);
  hand.userData.motion = 'amalgamWrist';
  hand.userData.side = side;
  base.add(hand);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([base, hand]);
  const weights = (p: T.Vector3) => {
    const w = smooth(p.x, 0.22, 0.55);
    return { j: [0, 1], w: [1 - w, w] };
  };
  const curves = ends.map(
    (tip, i) =>
      new T.CatmullRomCurve3([
        wrist,
        wrist
          .clone()
          .lerp(tip, 0.48)
          .add(new T.Vector3(i === 0 ? 0.055 : 0.07, i === 0 ? 0.055 : 0.03, side * 0.05)),
        tip,
      ]),
  );
  for (let i = 0; i < curves.length; i++) {
    const path = Array.from({ length: 8 }, (_, j) => curves[i].getPoint(j / 7).toArray());
    skin(
      root,
      loft(path, [0.026, 0.02, 0.007], [0.022, 0.016, 0.005], 40, 12),
      rib,
      `Amalgam_WingFinger_${side}_${i}`,
      skeleton,
      weights,
    );
    if (i < curves.length - 1)
      skin(
        root,
        web(curves[i], curves[i + 1], side),
        membrane,
        `Amalgam_Membrane_${side}_${i}`,
        skeleton,
        weights,
      );
  }
  const leading = new T.CatmullRomCurve3([wrist, elbow, shoulder]);
  skin(
    root,
    web(leading, curves[3], side),
    membrane,
    `Amalgam_Membrane_${side}_3`,
    skeleton,
    weights,
  );
  return { base, hand };
}

export function amalgam(root: T.Group) {
  const flesh = material('skin');
  const membrane = material('membrane');
  const rib = material('horn');
  rib.color.set('#918390');
  const horn = rib.clone();
  horn.color.set('#ada2b6');
  const dark = new T.MeshStandardMaterial({ color: '#242c29', roughness: 0.7 });
  const bronze = material('bronze');
  bronze.color.set('#95805d');
  const base = new T.Bone();
  base.name = 'Amalgam_Anchor';
  root.add(base);
  const neck = new T.Bone();
  neck.name = 'Amalgam_Neck';
  neck.position.set(-0.39, 1.035, 0.025);
  neck.userData.motion = 'amalgamNeck';
  base.add(neck);
  const head = new T.Bone();
  head.name = 'Amalgam_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'amalgamHead';
  neck.add(head);
  const tail = new T.Bone();
  tail.name = 'Amalgam_TailBase';
  tail.position.set(0.66, 0.7, -0.03);
  tail.userData.motion = 'amalgamTail';
  base.add(tail);
  const tip = new T.Bone();
  tip.name = 'Amalgam_TailTip';
  tip.position.copy(v([1.0, 0.42, 0.24])).sub(tail.position);
  tip.userData.motion = 'amalgamTip';
  tail.add(tip);
  root.updateMatrixWorld(true);
  const nearWing = wing(root, 1, membrane, rib),
    farWing = wing(root, -1, membrane, rib);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([
    base,
    neck,
    head,
    tail,
    tip,
    nearWing.base,
    farWing.base,
    nearWing.hand,
    farWing.hand,
  ]);
  const field = anatomy();
  skin(
    root,
    sculptField(
      field,
      { step: 0.018, origin: [-1.4, 0.015, -0.58], cells: [148, 95, 88] },
      pigment,
    ),
    flesh,
    'Amalgam_ContinuousAnatomy',
    skeleton,
    bodyWeights,
  );
  const face = new T.Group();
  face.name = 'Amalgam_Face';
  face.quaternion.copy(TURN);
  head.add(face);
  stroke(
    face,
    'Amalgam_SweptHorn',
    [
      [0, 0.145, -0.055],
      [0.015, 0.32, -0.09],
      [0.025, 0.52, -0.25],
      [0.0, 0.69, -0.33],
    ],
    [0.091, 0.079, 0.043, 0.001],
    horn,
  );
  const sideX = (y: number, z: number) => {
    const sample = (x: number) => {
      const p = new T.Vector3(x, y, z).applyQuaternion(TURN).add(HEAD);
      return field(p.x, p.y, p.z);
    };
    let outside = 0.4,
      inside = outside;
    while (sample(inside) > 0 && inside > 0) inside -= 0.004;
    outside = inside + 0.004;
    for (let i = 0; i < 12; i++) {
      const mid = (outside + inside) / 2;
      if (sample(mid) > 0) outside = mid;
      else inside = mid;
    }
    return (outside + inside) / 2;
  };
  for (const side of [-1, 1]) {
    const eye = new T.Group();
    eye.name = `Amalgam_Eye_${side}`;
    eye.position.set(side * 0.159, 0.058, 0.103);
    eye.rotation.y = side * 0.99;
    eye.rotation.z = side * 0.08;
    eye.userData.motion = 'amalgamBlink';
    face.add(eye);
    oval(eye, `Amalgam_Orbit_${side}`, [0, 0, 0], [0.035, 0.018, 0.017], dark);
    oval(
      eye,
      `Amalgam_Iris_${side}`,
      [0, 0, 0.014],
      [0.026, 0.014, 0.01],
      new T.MeshStandardMaterial({ color: '#c5b57d', roughness: 0.4 }),
    );
    oval(eye, `Amalgam_Pupil_${side}`, [0, 0, 0.024], [0.005, 0.013, 0.003], dark);
    const mouth = Array.from({ length: 18 }, (_, i) => {
      const z = 0.035 + (i / 17) * 0.455,
        y = -0.072 + z * 0.012;
      return [side * (sideX(y, z) + 0.0015), y, z];
    });
    stroke(face, `Amalgam_Mouth_${side}`, mouth, [0.0009, 0.003, 0.001], dark);
    const nostril = oval(
      face,
      `Amalgam_Nostril_${side}`,
      [side * 0.078, 0.056, 0.458],
      [0.02, 0.006, 0.015],
      dark,
    );
    nostril.rotation.z = side * -0.28;
  }
  for (let foot = 0; foot < FEET.length; foot++)
    for (let i = 0; i < 3; i++) {
      const [x, y, z] = FEET[foot],
        lead = x - 0.18 - (i === 1 ? 0.025 : 0),
        tz = z + (i - 1) * 0.098;
      stroke(
        root,
        `Amalgam_Claw_${foot}_${i}`,
        [
          [lead + 0.012, y - 0.004, tz],
          [lead - 0.039, y - 0.012, tz],
          [lead - 0.066, y - 0.042, tz],
        ],
        [0.02, 0.013, 0.001],
        horn,
      );
    }
  // The single source chest plate conforms to the actual living surface.
  const frontX = (y: number, z: number) => {
    let x = -1.4;
    while (field(x, y, z) > 0 && x < 0.3) x += 0.005;
    let outside = x - 0.005,
      inside = x;
    for (let i = 0; i < 14; i++) {
      const mid = (inside + outside) / 2;
      if (field(mid, y, z) > 0) outside = mid;
      else inside = mid;
    }
    return (outside + inside) / 2 - 0.01;
  };
  const rows = 32,
    cols = 48,
    pos: number[] = [],
    idx: number[] = [],
    uv: number[] = [];
  for (const layer of [0, 1])
    for (let j = 0; j <= rows; j++)
      for (let i = 0; i <= cols; i++) {
        const r = j / rows,
          a = (i / cols) * Math.PI * 2,
          y = 0.715 + Math.cos(a) * r * 0.21,
          z = Math.sin(a) * r * 0.138;
        pos.push(frontX(y, z) + layer * 0.018, y, z);
        uv.push(z / 0.276 + 0.5, (y - 0.505) / 0.42);
        if (j < rows && i < cols) {
          const k = layer * (rows + 1) * (cols + 1) + j * (cols + 1) + i,
            q = k + cols + 1;
          idx.push(
            ...(layer === 0 ? [k, k + 1, q, k + 1, q + 1, q] : [k, q, k + 1, k + 1, q, q + 1]),
          );
        }
      }
  const n = (rows + 1) * (cols + 1);
  for (let i = 0; i < cols; i++) {
    const a = rows * (cols + 1) + i,
      b = a + 1;
    idx.push(a, n + a, b, b, n + a, n + b);
  }
  const plate = new T.BufferGeometry();
  plate.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  plate.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  // Radial front/back faces already face outward; only the connecting rim reverses.
  for (let i = 2 * rows * cols * 6; i < idx.length; i += 3)
    [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
  plate.setIndex(idx);
  plate.computeVertexNormals();
  skin(root, plate, bronze, 'Amalgam_FittedChestPlate', skeleton, bodyWeights);
  root.updateMatrixWorld(true);
}

export function amalgamMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((object) => {
    const motion = object.userData.motion as string | undefined;
    if (!motion?.startsWith('amalgam')) return;
    const values: number[] = [],
      rest = object.quaternion.clone(),
      side = object.userData.side as number;
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'amalgamNeck') {
        e.y = Math.sin(a) * 0.035;
        e.z = Math.sin(a - 0.3) * 0.012;
      }
      if (motion === 'amalgamHead') {
        e.y = Math.sin(a - 0.4) * 0.055;
        e.x = Math.sin(a * 2 - 0.4) * 0.015;
      }
      if (motion === 'amalgamTail') e.y = Math.sin(a - 0.7) * 0.03;
      if (motion === 'amalgamTip') e.y = Math.sin(a - 1.1) * 0.085;
      if (motion === 'amalgamWing') {
        e.x = Math.sin(a + side * 0.35) * side * 0.025;
        e.z = Math.sin(a + side * 0.35) * 0.014;
      }
      if (motion === 'amalgamWrist') e.x = Math.sin(a - 0.5 + side * 0.35) * side * 0.055;
      if (motion === 'amalgamBlink') {
        const b = Math.max(0, 1 - Math.abs(time - 3.7) / 0.16);
        values.push(1, 1 - b * 0.94, 1);
      } else values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const size = motion === 'amalgamBlink' ? 3 : 4;
    values.splice(values.length - size, size, ...values.slice(0, size));
    tracks.push(
      motion === 'amalgamBlink'
        ? new T.VectorKeyframeTrack(`${object.name}.scale`, times, values)
        : new T.QuaternionKeyframeTrack(`${object.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
