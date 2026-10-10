import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';

const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const smooth = T.MathUtils.smoothstep;
const HEAD = new T.Vector3(-0.34, 1.235, 0.1);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(-0.1, -0.68, -0.025));
const INVERSE_TURN = TURN.clone().invert();
const FEET = [
  [0.17, 0.15, 0.29],
  [0.33, 0.15, -0.25],
];
const HANDS = [
  [-0.4, 0.7, 0.31],
  [-0.47, 0.89, -0.16],
];
const TAIL = [
  [0.48, 0.42, -0.04],
  [0.74, 0.18, -0.03],
  [0.91, 0.15, 0.15],
  [0.91, 0.135, 0.48],
  [0.59, 0.145, 0.66],
  [0.2, 0.145, 0.58],
  [-0.02, 0.145, 0.43],
];

function anatomyField(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([0.21, 0.6, -0.025], [0.37, 0.46, 0.29], 0.19), 0.1],
    [ellipsoid([-0.025, 0.91, 0.012], [0.262, 0.34, 0.224], 0.29), 0.1],
    [ellipsoid([0.225, 0.37, 0.2], [0.245, 0.26, 0.17], -0.35), 0.09],
    [ellipsoid([0.32, 0.37, -0.22], [0.215, 0.25, 0.15], -0.24), 0.08],
    [
      taperedSpineField(
        [[-0.1, 1.08, 0.04], [-0.25, 1.16, 0.08], HEAD.toArray()],
        [0.23, 0.2, 0.175],
      ),
      0.09,
    ],
    [
      taperedSpineField(
        [[-0.065, 0.97, 0.21], [-0.11, 0.76, 0.29], HANDS[0]],
        [0.089, 0.071, 0.033],
      ),
      0.055,
    ],
    [
      taperedSpineField(
        [[-0.08, 1.0, -0.195], [-0.22, 0.84, -0.25], HANDS[1]],
        [0.076, 0.06, 0.031],
      ),
      0.05,
    ],
  ];
  for (const [x, y, z] of FEET) {
    shapes.push([
      taperedSpineField(
        [
          [x + 0.19, 0.37, z - 0.03],
          [x + 0.11, 0.19, z],
          [x - 0.025, y, z],
        ],
        [0.094, 0.071, 0.07],
      ),
      0.05,
    ]);
    shapes.push([ellipsoid([x - 0.015, y, z], [0.13, 0.051, 0.073], 0.015), 0.023]);
  }
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.018, -0.012], [0.183, 0.177, 0.21]), 0.04],
    [ellipsoid([0, -0.051, 0.107], [0.155, 0.112, 0.175]), 0.032],
    [ellipsoid([0, -0.026, 0.254], [0.082, 0.067, 0.173]), 0.03],
    [ellipsoid([0, -0.08, 0.232], [0.091, 0.037, 0.135]), 0.024],
  ];
  const orbits = [-1, 1].map((side) =>
    ellipsoid([side * 0.145, 0.055, 0.164], [0.044, 0.038, 0.051]),
  );
  const inverse = new T.Matrix4().makeRotationFromQuaternion(INVERSE_TURN).elements;
  return (x, y, z) => {
    let f = 10;
    for (const [shape, k] of shapes) f = union(f, shape(x, y, z), k);
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    if (Math.abs(dx) < 0.62 && Math.abs(dy) < 0.35 && Math.abs(dz) < 0.62) {
      const hx = inverse[0] * dx + inverse[4] * dy + inverse[8] * dz;
      const hy = inverse[1] * dx + inverse[5] * dy + inverse[9] * dz;
      const hz = inverse[2] * dx + inverse[6] * dy + inverse[10] * dz;
      let h = 10;
      for (const [shape, k] of skull) h = union(h, shape(hx, hy, hz), k);
      for (const orbit of orbits) h = Math.max(h, -orbit(hx, hy, hz));
      f = union(f, h, 0.045);
    }
    return Math.max(f, 0.105 - y);
  };
}
function coatColor(p: T.Vector3) {
  const local = p.clone().sub(HEAD).applyQuaternion(INVERSE_TURN);
  const muzzle = smooth(local.z, 0.09, 0.35) * (1 - smooth(Math.abs(local.x), 0.08, 0.2));
  const chest =
    smooth(-p.x, -0.09, 0.22) *
    (1 - smooth(Math.abs(p.z), 0.07, 0.24)) *
    (1 - smooth(p.y, 1.06, 1.29));
  const lower = 1 - smooth(p.y, 0.2, 0.36);
  return new T.Color('#7b7468')
    .lerp(new T.Color('#aca28a'), Math.max(muzzle * 0.83, chest * 0.6))
    .lerp(new T.Color('#997b6b'), lower * 0.5);
}
const hash = (x: number, y: number) => {
  const f = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return f - Math.floor(f);
};
function surfaceMaterial(kind: 'fur' | 'tail' = 'fur') {
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
        const ring = (y / size) * 96 + Math.sin((x / size) * Math.PI * 8) * 0.035;
        const groove = Math.exp(-((Math.sin(ring * Math.PI) / 0.34) ** 2));
        const cell = hash(Math.floor(x / 9), Math.floor(y / 6));
        relief = -groove * 0.2 + cell * 0.025;
        tone = 240 - groove * 23 + cell * 6;
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
    normalScale: new T.Vector2(kind === 'fur' ? 0.34 : 0.45, kind === 'fur' ? -0.34 : -0.45),
    roughnessMap: rough,
    metalnessMap: rough,
    metalness: 0,
    roughness: kind === 'tail' ? 0.86 : 0.97,
    vertexColors: true,
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
function ear(parent: T.Object3D, side: number, fur: T.Material) {
  const group = new T.Group();
  group.name = `Guardian_Ear_${side}`;
  group.position.set(side * 0.155, 0.165, -0.077);
  group.rotation.z = -side * 0.24;
  group.rotation.y = side === 1 ? 0.22 : -0.08;
  group.userData.motion = 'guardianEar';
  group.userData.side = side;
  parent.add(group);
  const rows = 16,
    cols = 48,
    sheet = (rows + 1) * (cols + 1);
  const points: number[] = [],
    indices: number[] = [],
    colors: number[] = [],
    uv: number[] = [];
  for (let face = 0; face < 2; face++)
    for (let i = 0; i <= rows; i++)
      for (let j = 0; j <= cols; j++) {
        const r = i / rows,
          a = (j / cols) * Math.PI * 2;
        const x = Math.cos(a) * r * 0.14,
          y = 0.043 + Math.sin(a) * r * 0.16;
        const z = face === 0 ? 0.02 + r * r * 0.032 : -0.038 + r * r * 0.08;
        points.push(x, y, z);
        uv.push(x * 3 + 0.5, y * 3 + 0.5);
        colors.push(
          ...(face === 0
            ? new T.Color('#b49385')
                .lerp(new T.Color('#756355'), smooth(r, 0.75, 1) * 0.55)
                .lerp(new T.Color('#8b6a5d'), (1 - r) * 0.35)
            : new T.Color('#8b7768')
          ).toArray(),
        );
        if (i < rows && j < cols) {
          const k = face * sheet + i * (cols + 1) + j;
          indices.push(
            ...(face === 0
              ? [k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2]
              : [k, k + 1, k + cols + 1, k + 1, k + cols + 2, k + cols + 1]),
          );
        }
      }
  for (let j = 0; j < cols; j++) {
    const a = rows * (cols + 1) + j;
    indices.push(a, a + 1, a + sheet, a + 1, a + sheet + 1, a + sheet);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  mesh(group, g, fur, `Guardian_RoundedPinna_${side}`);
  return group;
}

export function guardian(root: T.Group) {
  const coat = surfaceMaterial();
  const tailMaterial = surfaceMaterial('tail');
  const earMaterial = new T.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.88,
    vertexColors: true,
  });
  const skin = new T.MeshStandardMaterial({ color: '#9b786a', roughness: 0.87 });
  const rim = new T.MeshStandardMaterial({ color: '#28251f', roughness: 0.72 });
  const claw = new T.MeshStandardMaterial({ color: '#b9a48b', roughness: 0.76 });
  const anchor = new T.Bone();
  anchor.name = 'Guardian_Anchor';
  root.add(anchor);
  const neck = new T.Bone();
  neck.name = 'Guardian_Neck';
  neck.position.set(-0.17, 1.11, 0.055);
  neck.userData.motion = 'guardianNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'Guardian_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'guardianHead';
  neck.add(head);
  const tail = new T.Bone();
  tail.name = 'Guardian_Tail';
  tail.position.copy(v(TAIL[3]));
  tail.userData.motion = 'guardianTail';
  anchor.add(tail);
  const tip = new T.Bone();
  tip.name = 'Guardian_TailTip';
  tip.position.copy(v(TAIL[5])).sub(tail.position);
  tip.userData.motion = 'guardianTailTip';
  tail.add(tip);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, neck, head, tail, tip]);
  const field = anatomyField();
  const geometry = sculptField(
    field,
    { step: 0.019, origin: [-1.03, 0.029, -0.56], cells: [101, 93, 72] },
    coatColor,
  );
  const joints: number[] = [],
    weights: number[] = [],
    p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const point = new T.Vector3().fromBufferAttribute(p, i),
      local = point.clone().sub(HEAD).applyQuaternion(INVERSE_TURN);
    const h = smooth(local.z, -0.2, -0.07) * smooth(point.y, 1.015, 1.1);
    const n = (1 - h) * smooth(point.y, 1.015, 1.23);
    joints.push(0, 1, 2, 0);
    weights.push(1 - h - n, n, h, 0);
  }
  geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  const body = new T.SkinnedMesh(geometry, coat);
  body.name = 'Guardian_ContinuousAnatomy';
  body.castShadow = body.receiveShadow = true;
  root.add(body);
  body.bind(skeleton);
  const tailGeometry = loft(
    TAIL,
    [0.075, 0.056, 0.043, 0.03, 0.019, 0.011, 0.001],
    [0.072, 0.05, 0.036, 0.027, 0.018, 0.01, 0.001],
    128,
    16,
  );
  const ti: number[] = [],
    tw: number[] = [],
    uv = tailGeometry.attributes.uv;
  // Loft cap centers use neutral UVs; skinning must still bind each cap to its end.
  uv.setY(uv.count - 2, 0);
  uv.setY(uv.count - 1, 1);
  const tailPositions = tailGeometry.attributes.position;
  for (let i = 0; i < tailPositions.count; i++)
    tailPositions.setY(i, Math.max(0.105, tailPositions.getY(i)));
  tailGeometry.computeVertexNormals();
  for (let i = 0; i < uv.count; i++) {
    const t = uv.getY(i),
      base = smooth(t, 0.35, 0.64),
      end = smooth(t, 0.66, 0.94);
    ti.push(0, 3, 4, 0);
    tw.push(1 - base, base * (1 - end), base * end, 0);
  }
  tailGeometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(ti, 4));
  tailGeometry.setAttribute('skinWeight', new T.Float32BufferAttribute(tw, 4));
  const tailColors: number[] = [];
  for (let i = 0; i < uv.count; i++)
    tailColors.push(
      ...new T.Color('#7b7468')
        .lerp(new T.Color('#987669'), smooth(uv.getY(i), 0.015, 0.16))
        .toArray(),
    );
  tailGeometry.setAttribute('color', new T.Float32BufferAttribute(tailColors, 3));
  const tailSkin = new T.SkinnedMesh(tailGeometry, tailMaterial);
  tailSkin.name = 'Guardian_TaperedTail';
  tailSkin.castShadow = tailSkin.receiveShadow = true;
  root.add(tailSkin);
  tailSkin.bind(skeleton);
  const face = new T.Group();
  face.name = 'Guardian_Face';
  face.quaternion.copy(TURN);
  head.add(face);
  const surfaceZ = (x: number, y: number) => {
    const sample = (z: number) => {
      const p = new T.Vector3(x, y, z).applyQuaternion(TURN).add(HEAD);
      return field(p.x, p.y, p.z);
    };
    let inside = 0.6;
    while (sample(inside) > 0 && inside > -0.2) inside -= 0.003;
    let outside = inside + 0.003;
    for (let i = 0; i < 14; i++) {
      const mid = (inside + outside) / 2;
      if (sample(mid) > 0) outside = mid;
      else inside = mid;
    }
    return (inside + outside) / 2 + 0.001;
  };
  const fitted = (points: number[][]) => {
    const curve = new T.CatmullRomCurve3(points.map(v));
    return Array.from({ length: 24 }, (_, i) => {
      const p = curve.getPoint(i / 23);
      p.z = surfaceZ(p.x, p.y);
      return p.toArray();
    });
  };
  for (const side of [-1, 1]) {
    ear(face, side, earMaterial);
    const eye = new T.Group();
    eye.name = `Guardian_Eye_${side}`;
    const x = side * 0.131,
      y = 0.051;
    eye.position.set(x, y, surfaceZ(x, y) - 0.009);
    eye.rotation.y = side * 0.56;
    eye.rotation.z = side * 0.13;
    eye.userData.motion = 'guardianBlink';
    face.add(eye);
    oval(eye, `Guardian_Orbit_${side}`, [0, 0, 0], [0.037, 0.028, 0.024], rim);
    oval(
      eye,
      `Guardian_Eyeball_${side}`,
      [0, -0.001, 0.013],
      [0.026, 0.022, 0.014],
      new T.MeshStandardMaterial({ color: '#302b21', roughness: 0.32 }),
    );
    oval(
      eye,
      `Guardian_EyeGlint_${side}`,
      [-0.009, 0.009, 0.024],
      [0.004, 0.004, 0.002],
      new T.MeshStandardMaterial({ color: '#c8b99c', roughness: 0.22 }),
    );
    stroke(
      face,
      `Guardian_Lip_${side}`,
      fitted([
        [0, -0.068, 0],
        [side * 0.06, -0.098, 0],
        [side * 0.114, -0.086, 0],
      ]),
      [0.0014, 0.0018, 0.0003],
      rim,
    );
    const whiskers = new T.Group();
    whiskers.name = `Guardian_Whiskers_${side}`;
    whiskers.userData.motion = 'guardianWhisker';
    whiskers.userData.side = side;
    whiskers.position.set(side * 0.057, -0.035, 0.33);
    face.add(whiskers);
    for (let i = 0; i < 4; i++)
      stroke(
        whiskers,
        `Guardian_Whisker_${side}_${i}`,
        [
          [0, 0, 0],
          [side * (0.12 + i * 0.012), 0.012 - i * 0.017, 0.035 - i * 0.018],
          [side * (0.24 + i * 0.014), 0.027 - i * 0.034, 0.02 - i * 0.043],
        ],
        [0.0015, 0.001, 0.00012],
        new T.MeshStandardMaterial({ color: '#9f9583', roughness: 0.9 }),
      );
  }
  oval(face, 'Guardian_Nose', [0, -0.026, 0.415], [0.045, 0.03, 0.026], skin);
  for (const side of [-1, 1])
    oval(
      face,
      `Guardian_Nostril_${side}`,
      [side * 0.022, -0.02, 0.434],
      [0.008, 0.005, 0.003],
      rim,
    );
  stroke(
    face,
    'Guardian_Philtrum',
    fitted([
      [0, -0.044, 0],
      [0, -0.072, 0],
    ]),
    [0.0014, 0.0012],
    rim,
  );
  // Small exposed hands and long hind toes belong to the same braced pose.
  for (let limb = 0; limb < 4; limb++) {
    const front = limb < 2,
      [x, y, z] = front ? HANDS[limb] : FEET[limb - 2];
    const palm = new T.Group();
    palm.name = `Guardian_Paw_${limb}`;
    palm.position.set(x, y, z);
    root.add(palm);
    if (front) {
      palm.rotation.x = limb === 0 ? 0.72 : -0.45;
      const pad = oval(
        palm,
        `Guardian_Palm_${limb}`,
        [-0.02, -0.007, 0],
        [0.067, 0.032, 0.046],
        skin,
      );
      pad.rotation.z = 0.12;
    } else {
      oval(palm, `Guardian_Palm_${limb}`, [-0.105, -0.005, 0], [0.08, 0.031, 0.065], skin);
    }
    const count = front ? 4 : 5;
    for (let digit = 0; digit < count; digit++) {
      const dz = (digit - (count - 1) / 2) * (front ? 0.022 : 0.029),
        spread = dz * (front ? 0.7 : 0.4),
        length =
          (front ? 0.082 : 0.12) *
          (1 - (0.28 * Math.abs(digit - (count - 1) / 2)) / ((count - 1) / 2));
      const points = front
        ? [
            [-0.02, -0.013, dz],
            [-0.07, -0.029, dz + spread * 0.3],
            [-0.055 - length, -0.036, dz + spread],
          ]
        : [
            [-0.1, 0, dz],
            [-0.15, -0.02, dz + spread * 0.3],
            [-0.13 - length, -0.029, dz + spread],
          ];
      const radius = front ? 0.012 : 0.014;
      stroke(
        palm,
        `Guardian_Digit_${limb}_${digit}`,
        points,
        [radius * 1.15, radius, radius * 0.55],
        skin,
      );
      const end = v(points[2]);
      stroke(
        palm,
        `Guardian_Claw_${limb}_${digit}`,
        [
          end.toArray(),
          end
            .clone()
            .add(new T.Vector3(-0.016, -0.003, 0))
            .toArray(),
          end
            .clone()
            .add(new T.Vector3(-0.026, -0.009, 0))
            .toArray(),
        ],
        [radius * 0.55, radius * 0.36, 0.0004],
        claw,
      );
    }
  }
  root.updateMatrixWorld(true);
}
export function guardianMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((node) => {
    const motion = node.userData.motion as string | undefined;
    if (!motion?.startsWith('guardian')) return;
    const values: number[] = [],
      rest = node.quaternion.clone();
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'guardianNeck') {
        e.y = Math.sin(a) * 0.024;
        e.z = Math.sin(a - 0.4) * 0.01;
      }
      if (motion === 'guardianHead') {
        e.y = Math.sin(a - 0.35) * 0.075;
        e.x = Math.sin(a - 0.8) * 0.024;
      }
      if (motion === 'guardianEar')
        e.y = Math.sin(a + Number(node.userData.side) * 0.9) ** 9 * 0.12;
      if (motion === 'guardianTail') e.y = Math.sin(a - 0.7) * 0.025;
      if (motion === 'guardianTailTip') e.y = Math.sin(a - 1.2) * 0.04;
      if (motion === 'guardianWhisker') {
        e.y = Math.sin(a * 2 + Number(node.userData.side) * 0.3) * 0.035;
        e.z = Math.sin(a - 0.3) * 0.018;
      }
      if (motion === 'guardianBlink') {
        const blink = Math.max(0, 1 - Math.abs(time - 3.55) / 0.18);
        values.push(1, 1 - blink * 0.94, 1);
      } else values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const scale = motion === 'guardianBlink',
      size = scale ? 3 : 4;
    values.splice(-size, size, ...values.slice(0, size));
    tracks.push(
      scale
        ? new T.VectorKeyframeTrack(`${node.name}.scale`, times, values)
        : new T.QuaternionKeyframeTrack(`${node.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
