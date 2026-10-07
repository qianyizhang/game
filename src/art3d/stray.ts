import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';

const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const smooth = T.MathUtils.smoothstep;
const HEAD = new T.Vector3(-0.77, 1.31, 0.18);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(-0.025, -0.95, -0.035));
const INVERSE_TURN = TURN.clone().invert();
const PAWS = [
  [-0.6, 0.375, 0.325],
  [-0.49, 0.16, -0.25],
  [0.53, 0.16, 0.26],
  [0.68, 0.16, -0.25],
];
const TAIL = [
  [0.63, 0.89, -0.06],
  [0.99, 0.74, -0.09],
  [1.15, 0.45, -0.02],
  [1.27, 0.29, 0.12],
  [1.35, 0.26, 0.24],
  [1.4, 0.31, 0.4],
];

/** A light canid pauses mid-step: one reaching forepaw, three supports, low outward tail. */
function anatomyField(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([-0.13, 0.985, -0.008], [0.45, 0.255, 0.207], -0.02), 0.105],
    [ellipsoid([0.22, 0.953, -0.015], [0.35, 0.164, 0.163], -0.07), 0.09],
    [ellipsoid([0.51, 0.902, -0.035], [0.239, 0.205, 0.197], -0.17), 0.086],
    [ellipsoid([-0.35, 0.981, 0.133], [0.17, 0.24, 0.124], -0.1), 0.075],
    [ellipsoid([-0.29, 0.962, -0.153], [0.154, 0.23, 0.112], -0.01), 0.072],
    [
      taperedSpineField(
        [[-0.35, 1.02, 0.15], [-0.26, 0.68, 0.215], [-0.58, 0.53, 0.315], PAWS[0]],
        [0.108, 0.074, 0.047, 0.054],
      ),
      0.056,
    ],
    [
      taperedSpineField(
        [[-0.29, 0.992, -0.157], [-0.22, 0.6, -0.225], [-0.42, 0.285, -0.255], PAWS[1]],
        [0.1, 0.073, 0.043, 0.05],
      ),
      0.055,
    ],
    [ellipsoid([0.49, 0.73, 0.142], [0.139, 0.212, 0.112], -0.38), 0.065],
    [
      taperedSpineField(
        [[0.5, 0.82, 0.154], [0.36, 0.565, 0.2], [0.59, 0.335, 0.235], PAWS[2]],
        [0.092, 0.071, 0.044, 0.049],
      ),
      0.06,
    ],
    [ellipsoid([0.56, 0.732, -0.163], [0.142, 0.203, 0.105], -0.32), 0.062],
    [
      taperedSpineField(
        [[0.57, 0.83, -0.165], [0.46, 0.553, -0.221], [0.77, 0.305, -0.25], PAWS[3]],
        [0.09, 0.07, 0.043, 0.048],
      ),
      0.056,
    ],
    [
      taperedSpineField(
        [[-0.36, 1.06, 0.015], [-0.47, 1.17, 0.074], [-0.64, 1.285, 0.13], HEAD.toArray()],
        [0.203, 0.162, 0.141, 0.14],
      ),
      0.1,
    ],
    [ellipsoid([-0.49, 1.062, 0.087], [0.145, 0.225, 0.16], 0.36), 0.072],
    [
      taperedSpineField(
        [
          [-0.54, 1.11, 0.16],
          [-0.61, 0.96, 0.185],
          [-0.53, 0.92, 0.183],
        ],
        [0.068, 0.047, 0.004],
      ),
      0.065,
    ],
    [
      taperedSpineField(
        [
          [-0.44, 1.1, 0.22],
          [-0.42, 0.95, 0.242],
          [-0.31, 0.879, 0.23],
        ],
        [0.058, 0.036, 0.003],
      ),
      0.059,
    ],
  ];
  for (let foot = 0; foot < PAWS.length; foot++) {
    const [x, y, z] = PAWS[foot],
      lift = foot === 0;
    shapes.push([
      ellipsoid(
        [x - 0.015, y + 0.003, z],
        lift ? [0.09, 0.059, 0.076] : [0.108, 0.06, 0.076],
        lift ? 0.88 : 0,
      ),
      0.027,
    ]);
    for (let i = 0; i < 4; i++)
      shapes.push([
        ellipsoid(
          [
            x - (lift ? 0.046 : 0.083) - 0.009 * Math.sin((i * Math.PI) / 3),
            y - (lift ? 0.045 : 0.005),
            z + (i - 1.5) * 0.033,
          ],
          [0.048, 0.05, 0.024],
          lift ? 0.88 : 0,
        ),
        0.013,
      ]);
  }
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.02, -0.024], [0.174, 0.158, 0.186]), 0.047],
    [ellipsoid([0, -0.062, 0.047], [0.148, 0.1, 0.132]), 0.038],
    [ellipsoid([0, -0.003, 0.225], [0.089, 0.081, 0.197]), 0.041],
    [ellipsoid([0, -0.09, 0.23], [0.083, 0.036, 0.181]), 0.024],
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
    if (Math.abs(dx) < 0.61 && Math.abs(dy) < 0.41 && Math.abs(dz) < 0.61) {
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
  const bib = smooth(-p.x, 0.33, 0.58) * (1 - smooth(p.y, 1.07, 1.25)) * smooth(p.z, -0.1, 0.2);
  const belly = (1 - smooth(p.y, 0.84, 1.02)) * (1 - smooth(Math.abs(p.x - 0.1), 0.2, 0.55)) * 0.48;
  const dorsal =
    smooth(p.y, 0.96, 1.21) *
    (1 - smooth(Math.abs(p.z + 0.015), 0.055, 0.22)) *
    (1 - smooth(-p.x, 0.42, 0.65));
  return new T.Color('#596c50')
    .lerp(new T.Color('#293e31'), dorsal * 0.86)
    .lerp(new T.Color('#d5d2ad'), Math.max(muzzle * 0.94, mask * 0.84, bib * 0.92, belly));
}

// Local coat maps adapted from the earlier canids, without modifying those assets.
const hash = (x: number, y: number) => {
  const f = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return f - Math.floor(f);
};
function surfaceMaterial(kind: 'fur' | 'nose' = 'fur') {
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
    roughness: kind === 'nose' ? 0.67 : 0.97,
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
  group.name = `Stray_Ear_${side}`;
  group.position.set(side * 0.104, 0.098, -0.055);
  group.rotation.z = side < 0 ? 0.43 : -0.09;
  group.rotation.y = side * 0.25;
  group.userData.motion = 'strayEar';
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
          y = -0.06 + t * 0.33;
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
  mesh(group, g, fur, `Stray_CuppedEar_${side}`);
  return group;
}
export function stray(root: T.Group) {
  const coat = surfaceMaterial(),
    noseMat = surfaceMaterial('nose');
  noseMat.color.set('#26362b');
  const rim = new T.MeshStandardMaterial({ color: '#23362a', roughness: 0.79 });
  const whisker = new T.MeshStandardMaterial({ color: '#b0b69a', roughness: 0.85 });
  const claw = new T.MeshStandardMaterial({ color: '#6b7057', roughness: 0.81 });
  const anchor = new T.Bone();
  anchor.name = 'Stray_Anchor';
  root.add(anchor);
  const neck = new T.Bone();
  neck.name = 'Stray_Neck';
  neck.position.set(-0.48, 1.15, 0.085);
  neck.userData.motion = 'strayNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'Stray_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'strayHead';
  neck.add(head);
  const curve = new T.CatmullRomCurve3(TAIL.map(v));
  const tailBone = new T.Bone();
  tailBone.name = 'Stray_Tail';
  tailBone.position.copy(curve.getPointAt(0.43));
  tailBone.userData.motion = 'strayTail';
  anchor.add(tailBone);
  const tip = new T.Bone();
  tip.name = 'Stray_TailTip';
  tip.position.copy(curve.getPointAt(0.77)).sub(tailBone.position);
  tip.userData.motion = 'strayTailTip';
  tailBone.add(tip);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, neck, head, tailBone, tip]);
  const field = anatomyField(),
    g = sculptField(
      field,
      { step: 0.018, origin: [-1.33, 0.015, -0.49], cells: [132, 87, 70] },
      coatColor,
    );
  const joints: number[] = [],
    weights: number[] = [],
    positions = g.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const p = new T.Vector3().fromBufferAttribute(positions, i),
      h = p.clone().sub(HEAD).applyQuaternion(INVERSE_TURN);
    const hw =
      smooth(h.z, -0.22, -0.07) * smooth(p.y, 0.89, 1.01) * (1 - smooth(Math.abs(h.x), 0.16, 0.3));
    const nw = (1 - hw) * smooth(-p.x, 0.3, 0.55) * smooth(p.y, 0.89, 1.18);
    joints.push(0, 1, 2, 0);
    weights.push(1 - hw - nw, nw, hw, 0);
  }
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  const body = new T.SkinnedMesh(g, coat);
  body.name = 'Stray_ContinuousAnatomy';
  body.castShadow = body.receiveShadow = true;
  root.add(body);
  body.bind(skeleton);
  const tg = loft(
      TAIL,
      [0.072, 0.105, 0.112, 0.09, 0.064, 0.003],
      [0.07, 0.095, 0.103, 0.085, 0.06, 0.003],
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
      ...new T.Color('#617353')
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
  tail.name = 'Stray_BrushTail';
  tail.castShadow = tail.receiveShadow = true;
  root.add(tail);
  tail.bind(skeleton);
  const face = new T.Group();
  face.name = 'Stray_Face';
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
    eye.name = `Stray_Eye_${side}`;
    eye.position.set(side * 0.134, 0.049, 0.133);
    eye.rotation.y = side * 0.59;
    eye.rotation.z = side * 0.12;
    eye.userData.motion = 'strayBlink';
    face.add(eye);
    oval(eye, `Stray_Orbit_${side}`, [0, 0, 0], [0.034, 0.016, 0.019], rim);
    oval(
      eye,
      `Stray_Iris_${side}`,
      [0, -0.001, 0.017],
      [0.023, 0.012, 0.01],
      new T.MeshStandardMaterial({ color: '#b4a06b', roughness: 0.35 }),
    );
    oval(eye, `Stray_Pupil_${side}`, [0, -0.001, 0.027], [0.009, 0.009, 0.003], rim);
    oval(
      eye,
      `Stray_Glint_${side}`,
      [-0.009, 0.006, 0.029],
      [0.0035, 0.003, 0.0015],
      new T.MeshStandardMaterial({ color: '#d6d8b6', roughness: 0.25 }),
    );
    const lipCurve = new T.CatmullRomCurve3(
      [
        [0, -0.078, 0.405],
        [0, -0.071, 0.323],
        [0, -0.06, 0.226],
        [0, -0.046, 0.133],
      ].map(v),
    );
    const points = Array.from({ length: 24 }, (_, i) => {
      const p = lipCurve.getPoint(i / 23);
      p.x = surfaceX(p.y, p.z, side);
      return p.toArray();
    });
    stroke(face, `Stray_Lip_${side}`, points, [0.001, 0.0025, 0.002, 0.0005], rim);
    for (let i = 0; i < 3; i++) {
      const y = -0.043 + i * 0.012,
        z = 0.31 + i * 0.009,
        x = surfaceX(y, z, side);
      stroke(
        face,
        `Stray_Whisker_${side}_${i}`,
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
  const nose = mesh(face, noseGeometry, noseMat, 'Stray_Nose');
  nose.position.set(0, -0.005, 0.407);
  nose.scale.set(0.07, 0.05, 0.035);
  nose.rotation.x = -0.12;

  for (const side of [-1, 1])
    oval(face, `Stray_Nostril_${side}`, [side * 0.035, 0.001, 0.435], [0.016, 0.009, 0.007], rim);
  stroke(
    face,
    'Stray_Philtrum',
    [
      [0, -0.032, 0.442],
      [0, -0.054, 0.43],
      [0, -0.077, 0.406],
    ],
    [0.002, 0.0017, 0.0008],
    rim,
  );
  for (let foot = 0; foot < 4; foot++) {
    const [x, y, z] = PAWS[foot];
    for (let i = 0; i < 4; i++) {
      const dz = (i - 1.5) * 0.033,
        tipX = x - (foot === 0 ? 0.046 : 0.083) - 0.009 * Math.sin((i * Math.PI) / 3) - 0.039,
        tipY = y - (foot === 0 ? 0.055 : 0.016);
      stroke(
        root,
        `Stray_Claw_${foot}_${i}`,
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
  root.updateMatrixWorld(true);
}
export function strayMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((o) => {
    const kind = o.userData.motion as string | undefined;
    if (!kind?.startsWith('stray')) return;
    const rest = o.quaternion.clone(),
      values: number[] = [];
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (kind === 'strayBlink') {
        const b = Math.max(0, 1 - Math.abs(time - 3.95) / 0.17);
        values.push(1, 1 - 0.94 * Math.sin((b * Math.PI) / 2) ** 2, 1);
        continue;
      }
      if (kind === 'strayNeck') {
        e.y = Math.sin(a) * 0.022;
        e.z = (Math.sin(a - 0.2) + Math.sin(0.2)) * 0.01;
      }
      if (kind === 'strayHead') {
        e.y = Math.sin(a) ** 3 * 0.068;
        e.x = (Math.sin(a - 0.35) + Math.sin(0.35)) * 0.016;
      }
      if (kind === 'strayTail') e.y = (Math.sin(a - 0.6) + Math.sin(0.6)) * 0.063;
      if (kind === 'strayTailTip') e.y = (Math.sin(a - 0.95) + Math.sin(0.95)) * 0.078;
      if (kind === 'strayEar') {
        const side = o.userData.side as number;
        e.y = (Math.sin(a + side * 0.8) ** 7 - Math.sin(side * 0.8) ** 7) * side * 0.105;
      }
      values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const size = kind === 'strayBlink' ? 3 : 4;
    values.splice(values.length - size, size, ...values.slice(0, size));
    tracks.push(
      kind === 'strayBlink'
        ? new T.VectorKeyframeTrack(`${o.name}.scale`, times, values)
        : new T.QuaternionKeyframeTrack(`${o.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
