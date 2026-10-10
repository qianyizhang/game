import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';

const smooth = T.MathUtils.smoothstep;
const HEAD = new T.Vector3(-0.96, 1.19, 0.21);
const HEAD_ROTATION = new T.Quaternion().setFromEuler(new T.Euler(0.08, -0.93, 0.045));
const PAWS = [
  [-0.81, 0.18, 0.43],
  [-0.39, 0.18, -0.36],
  [0.65, 0.18, 0.33],
  [0.83, 0.18, -0.3],
];
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);

/** Braced guardian: high shoulders, lowered head, heavy forequarters over planted feet. */
function anatomyField(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([-0.22, 1.02, 0], [0.62, 0.46, 0.36], -0.08), 0.15],
    [ellipsoid([0.25, 0.93, -0.035], [0.51, 0.39, 0.33], -0.04), 0.15],
    [ellipsoid([0.58, 0.85, -0.06], [0.4, 0.4, 0.32], -0.14), 0.12],
    // Shoulder hump, long scapular planes, lower abdomen and unequal haunches.
    [ellipsoid([-0.36, 1.21, -0.01], [0.39, 0.32, 0.28], -0.16), 0.12],
    [ellipsoid([-0.43, 0.97, 0.22], [0.25, 0.43, 0.2], -0.21), 0.11],
    [ellipsoid([-0.31, 0.97, -0.25], [0.23, 0.39, 0.18], 0.12), 0.11],
    [ellipsoid([0.57, 0.67, 0.19], [0.28, 0.35, 0.21], -0.23), 0.11],
    [ellipsoid([0.68, 0.66, -0.25], [0.26, 0.33, 0.18], -0.11), 0.1],
    [
      taperedSpineField(
        [[-0.48, 1.05, 0.24], [-0.48, 0.64, 0.34], [-0.68, 0.32, 0.41], PAWS[0]],
        [0.19, 0.145, 0.102, 0.105],
      ),
      0.12,
    ],
    [
      taperedSpineField(
        [[-0.3, 1.02, -0.25], [-0.17, 0.59, -0.32], [-0.3, 0.29, -0.36], PAWS[1]],
        [0.18, 0.128, 0.092, 0.1],
      ),
      0.11,
    ],
    [
      taperedSpineField(
        [[0.56, 0.75, 0.21], [0.59, 0.47, 0.3], [0.7, 0.28, 0.33], PAWS[2]],
        [0.19, 0.145, 0.112, 0.1],
      ),
      0.1,
    ],
    [
      taperedSpineField(
        [[0.7, 0.71, -0.25], [0.73, 0.43, -0.3], [0.85, 0.27, -0.3], PAWS[3]],
        [0.16, 0.13, 0.11, 0.1],
      ),
      0.1,
    ],
    [
      taperedSpineField(
        [[-0.4, 1.2, 0], [-0.59, 1.2, 0.06], [-0.78, 1.19, 0.14], HEAD.toArray()],
        [0.31, 0.29, 0.265, 0.24],
      ),
      0.12,
    ],
    [ellipsoid([0.95, 0.8, -0.08], [0.15, 0.13, 0.12], -0.2), 0.06],
  ];
  for (const [x, y, z] of PAWS) {
    shapes.push([ellipsoid([x - 0.025, y + 0.01, z], [0.18, 0.1, 0.135]), 0.055]);
    for (let i = 0; i < 5; i++)
      shapes.push([
        ellipsoid(
          [x - 0.13 - 0.02 * Math.sin((i * Math.PI) / 4), y - 0.007, z + (i - 2) * 0.052],
          [0.075, 0.072, 0.036],
        ),
        0.019,
      ]);
  }
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.055, -0.01], [0.305, 0.24, 0.25]), 0.07],
    [ellipsoid([0, -0.075, 0.085], [0.23, 0.16, 0.22]), 0.06],
    [ellipsoid([0, -0.002, 0.235], [0.178, 0.123, 0.207]), 0.055],
    [ellipsoid([0, -0.126, 0.26], [0.157, 0.068, 0.171]), 0.036],
    [ellipsoid([-0.195, 0.12, 0.12], [0.095, 0.044, 0.088], -0.11), 0.05],
    [ellipsoid([0.195, 0.12, 0.12], [0.095, 0.044, 0.088], 0.11), 0.05],
  ];
  const inverse = new T.Matrix4().makeRotationFromQuaternion(
    HEAD_ROTATION.clone().invert(),
  ).elements;
  return (x, y, z) => {
    let f = 10;
    for (const [shape, blend] of shapes) f = union(f, shape(x, y, z), blend);
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    if (Math.abs(dx) > 0.7 || Math.abs(dy) > 0.49 || Math.abs(dz) > 0.7)
      return Math.max(f, 0.105 - y);
    const hx = inverse[0] * dx + inverse[4] * dy + inverse[8] * dz,
      hy = inverse[1] * dx + inverse[5] * dy + inverse[9] * dz,
      hz = inverse[2] * dx + inverse[6] * dy + inverse[10] * dz;
    let h = 10;
    for (const [shape, blend] of skull) h = union(h, shape(hx, hy, hz), blend);
    for (const side of [-1, 1]) {
      const socket =
        (Math.hypot((hx - side * 0.209) / 0.057, (hy - 0.085) / 0.029, (hz - 0.182) / 0.059) - 1) *
        0.029;
      h = Math.max(h, -socket);
    }
    return Math.max(union(f, h, 0.072), 0.105 - y);
  };
}
function coatColor(p: T.Vector3) {
  const local = p.clone().sub(HEAD).applyQuaternion(HEAD_ROTATION.clone().invert());
  const muzzle = smooth(local.z, 0.12, 0.37) * (1 - smooth(Math.abs(local.x), 0.13, 0.23));
  const shoulder = smooth(p.y, 0.9, 1.5) * (1 - smooth(Math.abs(p.x + 0.42), 0.18, 0.65));
  const feet = 1 - smooth(p.y, 0.25, 0.7);
  return new T.Color('#6c5b43')
    .lerp(new T.Color('#93805d'), shoulder * 0.68)
    .lerp(new T.Color('#39372b'), feet * 0.72)
    .lerp(new T.Color('#b5a27c'), muzzle * 0.88)
    .multiplyScalar(
      1 +
        0.024 *
          Math.sin(p.y * 31 + Math.sin(p.x * 11) + Math.sin(p.z * 17)) *
          Math.sin(p.x * 13 + p.z * 19),
    );
}

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
    normalScale: new T.Vector2(0.3, -0.3),
    roughnessMap: rough,
    metalnessMap: rough,
    metalness: 0,
    roughness: kind === 'nose' ? 0.67 : 0.97,
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
function ear(parent: T.Object3D, side: number, fur: T.Material, inner: T.Material) {
  const group = new T.Group();
  group.name = `Matriarch_Ear_${side}`;
  group.position.set(side * 0.229, 0.202, -0.042);
  group.rotation.z = -side * 0.19;
  group.rotation.y = side * 0.37;
  group.userData.motion = 'matriarchEar';
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
        const x = Math.cos(a) * r * 0.094,
          y = 0.018 + Math.sin(a) * r * 0.109;
        const z = face === 0 ? 0.02 + r * r * 0.032 : -0.038 + r * r * 0.08;
        points.push(x, y, z);
        uv.push(x * 3 + 0.5, y * 3 + 0.5);
        colors.push(...new T.Color(face === 0 ? '#756248' : '#4b4636').toArray());
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
  mesh(group, g, fur, `Matriarch_RoundedPinna_${side}`);
  const bowl = oval(
    group,
    `Matriarch_EarBowl_${side}`,
    [0, 0.024, 0.023],
    [0.058, 0.064, 0.008],
    inner,
  );
  bowl.castShadow = false;
  return group;
}

export function matriarch(root: T.Group) {
  const coat = surfaceMaterial(),
    leather = surfaceMaterial('nose');
  leather.color.set('#272821');
  const rim = new T.MeshStandardMaterial({ color: '#211f19', roughness: 0.76 });
  const inner = new T.MeshStandardMaterial({ color: '#483e31', roughness: 0.94 });
  const claw = new T.MeshStandardMaterial({ color: '#403d30', roughness: 0.65 });
  const rig = new T.Bone();
  rig.name = 'Matriarch_Anchor';
  root.add(rig);
  const neck = new T.Bone();
  neck.name = 'Matriarch_Neck';
  neck.position.set(-0.57, 1.18, 0.08);
  neck.userData.motion = 'matriarchNeck';
  rig.add(neck);
  const head = new T.Bone();
  head.name = 'Matriarch_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'matriarchHead';
  neck.add(head);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([rig, neck, head]);
  const field = anatomyField();
  const geometry = sculptField(
    field,
    { step: 0.024, origin: [-1.64, 0.025, -0.63], cells: [117, 76, 69] },
    coatColor,
  );
  const p = geometry.getAttribute('position'),
    joints: number[] = [],
    weights: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i);
    const h = smooth(-x, 0.67, 0.84) * smooth(y, 0.69, 0.85);
    const n = (1 - h) * smooth(-x, 0.39, 0.64) * smooth(y, 0.62, 0.97);
    joints.push(0, 1, 2, 0);
    weights.push(1 - h - n, n, h, 0);
  }
  geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  const body = new T.SkinnedMesh(geometry, coat);
  body.name = 'Matriarch_ContinuousAnatomy';
  body.castShadow = body.receiveShadow = true;
  root.add(body);
  body.bind(skeleton);
  const face = new T.Group();
  face.name = 'Matriarch_Face';
  face.quaternion.copy(HEAD_ROTATION);
  head.add(face);
  const surfaceZ = (x: number, y: number) => {
    const sample = (z: number) => {
      const p = new T.Vector3(x, y, z).applyQuaternion(HEAD_ROTATION).add(HEAD);
      return field(p.x, p.y, p.z);
    };
    let outside = 0.7,
      inside = 0.7;
    while (sample(inside) > 0 && inside > 0) inside -= 0.01;
    outside = inside + 0.01;
    for (let i = 0; i < 16; i++) {
      const middle = (outside + inside) / 2;
      if (sample(middle) > 0) outside = middle;
      else inside = middle;
    }
    return (inside + outside) / 2 + 0.0015;
  };
  const fittedMouth = (points: number[][]) => {
    const curve = new T.CatmullRomCurve3(points.map(v));
    return Array.from({ length: 24 }, (_, i) => {
      const p = curve.getPoint(i / 23);
      p.z = surfaceZ(p.x, p.y);
      return p.toArray();
    });
  };
  for (const side of [-1, 1]) {
    ear(face, side, coat, inner);
    const eye = new T.Group();
    eye.name = `Matriarch_Eye_${side}`;
    eye.position.set(side * 0.209, 0.085, 0.173);
    eye.rotation.y = side * 0.65;
    eye.rotation.z = side * 0.09;
    eye.userData.motion = 'matriarchBlink';
    face.add(eye);
    oval(eye, `Matriarch_EyeSocket_${side}`, [0, 0, 0], [0.043, 0.02, 0.02], rim);
    const iris = new T.MeshStandardMaterial({ color: '#897344', roughness: 0.36 });
    oval(eye, `Matriarch_Iris_${side}`, [0, -0.001, 0.016], [0.026, 0.015, 0.012], iris);
    oval(eye, `Matriarch_Pupil_${side}`, [0, -0.001, 0.026], [0.011, 0.012, 0.005], rim);
    oval(
      eye,
      `Matriarch_Catchlight_${side}`,
      [-0.008, 0.005, 0.03],
      [0.003, 0.003, 0.002],
      new T.MeshStandardMaterial({ color: '#ddd0ae', roughness: 0.2 }),
    );
    stroke(
      face,
      `Matriarch_Lip_${side}`,
      fittedMouth([
        [0, -0.113, 0],
        [side * 0.095, -0.128, 0],
        [side * 0.151, -0.118, 0],
        [side * 0.198, -0.117, 0],
      ]),
      [0.0022, 0.0025, 0.0018, 0.0005],
      rim,
    );
  }
  const nose = oval(
    face,
    'Matriarch_LeatherNose',
    [0, 0.005, 0.426],
    [0.12, 0.062, 0.052],
    leather,
  );
  nose.rotation.x = -0.12;
  for (const side of [-1, 1])
    oval(
      face,
      `Matriarch_Nostril_${side}`,
      [side * 0.07, 0.001, 0.467],
      [0.026, 0.012, 0.009],
      rim,
    );
  stroke(
    face,
    'Matriarch_Philtrum',
    fittedMouth([
      [0, -0.057, 0],
      [0, -0.113, 0],
    ]),
    [0.0025, 0.0015],
    rim,
  );
  for (let foot = 0; foot < PAWS.length; foot++) {
    const [x, y, z] = PAWS[foot];
    for (let i = 0; i < 5; i++) {
      const lead = x - 0.18 - 0.02 * Math.sin((i * Math.PI) / 4),
        tz = z + (i - 2) * 0.052;
      stroke(
        root,
        `Matriarch_Claw_${foot}_${i}`,
        [
          [lead + 0.015, y + 0.005, tz],
          [lead - 0.044, y - 0.008, tz],
          [lead - 0.07, y - 0.033, tz],
        ],
        [0.017, 0.012, 0.001],
        claw,
      );
    }
  }
  root.updateMatrixWorld(true);
}

export function matriarchMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((object) => {
    const motion = object.userData.motion as string | undefined;
    if (!motion?.startsWith('matriarch')) return;
    const values: number[] = [],
      rest = object.quaternion.clone();
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'matriarchNeck') {
        e.y = Math.sin(a) * 0.027;
        e.z = Math.sin(a - 0.4) * 0.008;
      }
      if (motion === 'matriarchHead') {
        e.y = Math.sin(a - 0.45) * 0.062;
        e.x = Math.sin(a * 2 - 0.6) * 0.023;
      }
      if (motion === 'matriarchEar')
        e.y = Math.sin(a + (object.userData.side as number) * 0.7) ** 9 * 0.07;
      if (motion === 'matriarchBlink') {
        const blink = Math.max(0, 1 - Math.abs(time - 3.6) / 0.15);
        values.push(1, 1 - blink * 0.93, 1);
      } else values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const size = motion === 'matriarchBlink' ? 3 : 4;
    values.splice(values.length - size, size, ...values.slice(0, size));
    tracks.push(
      motion === 'matriarchBlink'
        ? new T.VectorKeyframeTrack(`${object.name}.scale`, times, values)
        : new T.QuaternionKeyframeTrack(`${object.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
