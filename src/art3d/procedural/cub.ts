import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';

const smooth = T.MathUtils.smoothstep;
const HEAD = new T.Vector3(-0.57, 0.72, 0.19);
const HEAD_ROTATION = new T.Quaternion().setFromEuler(new T.Euler(0.24, -0.8, -0.16, 'YXZ'));
const PAWS = [
  [-0.72, 0.172, 0.35],
  [-0.46, 0.172, -0.2],
  [0.28, 0.172, 0.34],
  [0.48, 0.172, -0.25],
];
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);

/** Curious foraging reach: one forepaw stretches beyond the chest; rump stays higher. */
function anatomyField(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([-0.13, 0.65, 0], [0.3, 0.29, 0.27], 0.15), 0.085],
    [ellipsoid([0.1, 0.74, -0.025], [0.3, 0.28, 0.27], 0.13), 0.095],
    [ellipsoid([0.29, 0.8, -0.035], [0.28, 0.31, 0.275], -0.06), 0.09],
    [ellipsoid([-0.2, 0.58, 0.16], [0.145, 0.24, 0.14], -0.35), 0.075],
    [ellipsoid([-0.12, 0.58, -0.17], [0.14, 0.23, 0.13], -0.22), 0.07],
    [ellipsoid([0.3, 0.57, 0.19], [0.17, 0.255, 0.18], -0.1), 0.07],
    [ellipsoid([0.38, 0.59, -0.19], [0.155, 0.25, 0.16], -0.16), 0.07],
    [
      taperedSpineField(
        [[-0.2, 0.66, 0.19], [-0.36, 0.42, 0.28], [-0.58, 0.24, 0.34], PAWS[0]],
        [0.105, 0.085, 0.063, 0.067],
      ),
      0.067,
    ],
    [
      taperedSpineField(
        [[-0.15, 0.68, -0.16], [-0.22, 0.38, -0.23], [-0.36, 0.23, -0.2], PAWS[1]],
        [0.1, 0.08, 0.06, 0.065],
      ),
      0.062,
    ],
    [
      taperedSpineField(
        [[0.3, 0.75, 0.19], [0.24, 0.45, 0.28], [0.33, 0.23, 0.34], PAWS[2]],
        [0.12, 0.09, 0.066, 0.065],
      ),
      0.07,
    ],
    [
      taperedSpineField(
        [[0.39, 0.74, -0.19], [0.43, 0.43, -0.24], [0.51, 0.24, -0.25], PAWS[3]],
        [0.11, 0.09, 0.064, 0.065],
      ),
      0.067,
    ],
    [
      taperedSpineField(
        [[-0.27, 0.73, 0.02], [-0.37, 0.77, 0.06], [-0.48, 0.76, 0.14], HEAD.toArray()],
        [0.22, 0.21, 0.195, 0.18],
      ),
      0.085,
    ],
    [ellipsoid([0.57, 0.8, -0.04], [0.07, 0.06, 0.065], -0.15), 0.045],
  ];
  for (const [x, y, z] of PAWS) {
    shapes.push([ellipsoid([x - 0.02, y + 0.01, z], [0.14, 0.083, 0.106]), 0.035]);
    for (let i = 0; i < 5; i++)
      shapes.push([
        ellipsoid(
          [x - 0.1 - 0.012 * Math.sin((i * Math.PI) / 4), y - 0.008, z + (i - 2) * 0.041],
          [0.058, 0.064, 0.028],
        ),
        0.015,
      ]);
  }
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.037, -0.018], [0.235, 0.224, 0.224]), 0.058],
    [ellipsoid([0, -0.07, 0.07], [0.183, 0.133, 0.167]), 0.046],
    [ellipsoid([0, -0.008, 0.181], [0.144, 0.094, 0.132]), 0.044],
    [ellipsoid([0, -0.107, 0.198], [0.13, 0.048, 0.123]), 0.029],
  ];
  const inv = new T.Matrix4().makeRotationFromQuaternion(HEAD_ROTATION.clone().invert()).elements;
  return (x, y, z) => {
    let f = 10;
    for (const [field, k] of shapes) f = union(f, field(x, y, z), k);
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    if (Math.abs(dx) < 0.62 && Math.abs(dy) < 0.5 && Math.abs(dz) < 0.62) {
      const hx = inv[0] * dx + inv[4] * dy + inv[8] * dz,
        hy = inv[1] * dx + inv[5] * dy + inv[9] * dz,
        hz = inv[2] * dx + inv[6] * dy + inv[10] * dz;
      let h = 10;
      for (const [field, k] of skull) h = union(h, field(hx, hy, hz), k);
      for (const side of [-1, 1]) {
        const socket =
          (Math.hypot((hx - side * 0.163) / 0.042, (hy - 0.06) / 0.023, (hz - 0.143) / 0.045) - 1) *
          0.021;
        h = -union(-h, socket, 0.009);
      }
      f = union(f, h, 0.057);
    }
    return Math.max(f, 0.105 - y);
  };
}
function coatColor(p: T.Vector3) {
  const local = p.clone().sub(HEAD).applyQuaternion(HEAD_ROTATION.clone().invert());
  const muzzle =
    smooth(local.z, 0.07, 0.25) *
    (1 - smooth(Math.abs(local.x), 0.1, 0.18)) *
    smooth(local.y, -0.22, -0.16) *
    (1 - smooth(local.y, 0.11, 0.22));
  const back = smooth(p.y, 0.64, 1.04) * (1 - smooth(Math.abs(p.z), 0.11, 0.31));
  const feet = 1 - smooth(p.y, 0.22, 0.53);
  const crown = smooth(-p.x, 0.52, 0.74) * smooth(local.y, -0.03, 0.15);
  return new T.Color('#806e50')
    .lerp(new T.Color('#9b8560'), back * 0.55)
    .lerp(new T.Color('#494836'), feet * 0.52)
    .lerp(new T.Color('#b9a078'), crown * 0.68)
    .lerp(new T.Color('#d3bc91'), muzzle * 0.91);
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
function ear(parent: T.Object3D, side: number, fur: T.Material) {
  const group = new T.Group();
  group.name = `Cub_Ear_${side}`;
  group.position.set(side * 0.181, 0.185, -0.049);
  group.rotation.z = side < 0 ? 0.22 : -0.13;
  group.rotation.y = side * 0.37;
  group.userData.motion = 'cubEar';
  group.userData.side = side;
  parent.add(group);
  const rows = 48,
    cols = 48,
    points: number[] = [],
    indices: number[] = [],
    colors: number[] = [],
    uv: number[] = [];
  const profile = new T.CatmullRomCurve3(
    [
      [0, 0.018],
      [0.65, 0.024],
      [0.9, 0.044],
      [1, 0.039],
      [1.02, 0.022],
      [0.93, 0],
      [0.55, -0.028],
      [0, -0.034],
    ].map(([r, z]) => new T.Vector3(r, z, 0)),
  );
  for (let i = 0; i <= rows; i++)
    for (let j = 0; j <= cols; j++) {
      const q = profile.getPoint(i / rows),
        r = Math.max(0, q.x),
        a = (j / cols) * Math.PI * 2;
      const x = Math.cos(a) * r * 0.094,
        y = 0.018 + Math.sin(a) * r * 0.106;
      points.push(x, y, q.y);
      uv.push(x * 3 + 0.5, y * 3 + 0.5);
      const color =
        i < rows * 0.43
          ? new T.Color('#78684c').lerp(new T.Color('#b39870'), smooth(r, 0.4, 0.95))
          : new T.Color('#87704e');
      colors.push(...color.toArray());
      if (i < rows && j < cols) {
        const k = i * (cols + 1) + j;
        indices.push(k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2);
      }
    }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let i = 0; i <= rows; i++) {
    const a = i * (cols + 1),
      b = a + cols,
      q = new T.Vector3()
        .fromBufferAttribute(n, a)
        .add(new T.Vector3().fromBufferAttribute(n, b))
        .normalize();
    n.setXYZ(a, q.x, q.y, q.z);
    n.setXYZ(b, q.x, q.y, q.z);
  }
  mesh(group, g, fur, `Cub_RoundedPinna_${side}`);
  return group;
}

export function cub(root: T.Group) {
  const coat = surfaceMaterial(),
    leather = surfaceMaterial('nose');
  leather.color.set('#272821');
  const rim = new T.MeshStandardMaterial({ color: '#211f19', roughness: 0.76 });
  const claw = new T.MeshStandardMaterial({ color: '#403d30', roughness: 0.65 });
  const rig = new T.Bone();
  rig.name = 'Cub_Anchor';
  root.add(rig);
  const neck = new T.Bone();
  neck.name = 'Cub_Neck';
  neck.position.set(-0.37, 0.75, 0.08);
  neck.userData.motion = 'cubNeck';
  rig.add(neck);
  const head = new T.Bone();
  head.name = 'Cub_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'cubHead';
  neck.add(head);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([rig, neck, head]);
  const field = anatomyField();
  const geometry = sculptField(
    field,
    { step: 0.016, origin: [-1.2, 0.009, -0.49], cells: [132, 76, 81] },
    coatColor,
  );
  const p = geometry.getAttribute('position'),
    joints: number[] = [],
    weights: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i);
    const h = smooth(-x, 0.35, 0.51) * smooth(y, 0.28, 0.37);
    const n = (1 - h) * smooth(-x, 0.22, 0.49) * smooth(y, 0.29, 0.52);
    joints.push(0, 1, 2, 0);
    weights.push(1 - h - n, n, h, 0);
  }
  geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  const body = new T.SkinnedMesh(geometry, coat);
  body.name = 'Cub_ContinuousAnatomy';
  body.castShadow = body.receiveShadow = true;
  root.add(body);
  body.bind(skeleton);
  const face = new T.Group();
  face.name = 'Cub_Face';
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
    ear(face, side, coat);
    const eye = new T.Group();
    eye.name = `Cub_Eye_${side}`;
    eye.position.set(side * 0.163, 0.059, 0.143);
    eye.rotation.y = side * 0.65;
    eye.rotation.z = side * 0.09;
    eye.userData.motion = 'cubBlink';
    face.add(eye);
    oval(eye, `Cub_EyeSocket_${side}`, [0, 0, 0], [0.033, 0.016, 0.017], rim);
    const iris = new T.MeshStandardMaterial({ color: '#897344', roughness: 0.36 });
    oval(eye, `Cub_Iris_${side}`, [0, -0.001, 0.016], [0.021, 0.012, 0.01], iris);
    oval(eye, `Cub_Pupil_${side}`, [0, -0.001, 0.026], [0.01, 0.011, 0.004], rim);
    oval(
      eye,
      `Cub_Catchlight_${side}`,
      [-0.008, 0.005, 0.03],
      [0.003, 0.003, 0.002],
      new T.MeshStandardMaterial({ color: '#ddd0ae', roughness: 0.2 }),
    );
    stroke(
      face,
      `Cub_Lip_${side}`,
      fittedMouth([
        [0, -0.095, 0],
        [side * 0.073, -0.109, 0],
        [side * 0.117, -0.101, 0],
        [side * 0.15, -0.089, 0],
      ]),
      [0.0022, 0.0025, 0.0018, 0.0005],
      rim,
    );
  }
  const nose = oval(face, 'Cub_LeatherNose', [0, 0.001, 0.305], [0.089, 0.05, 0.041], leather);
  nose.rotation.x = -0.12;
  for (const side of [-1, 1])
    oval(face, `Cub_Nostril_${side}`, [side * 0.049, -0.002, 0.338], [0.019, 0.01, 0.007], rim);
  stroke(
    face,
    'Cub_Philtrum',
    fittedMouth([
      [0, -0.048, 0],
      [0, -0.095, 0],
    ]),
    [0.0025, 0.0015],
    rim,
  );
  for (let foot = 0; foot < PAWS.length; foot++) {
    const [x, y, z] = PAWS[foot];
    for (let i = 0; i < 5; i++) {
      const lead = x - 0.14 - 0.012 * Math.sin((i * Math.PI) / 4),
        tz = z + (i - 2) * 0.041;
      stroke(
        root,
        `Cub_Claw_${foot}_${i}`,
        [
          [lead + 0.015, y + 0.005, tz],
          [lead - 0.018, y - 0.005, tz],
          [lead - 0.032, y - 0.019, tz],
        ],
        [0.012, 0.008, 0.0008],
        claw,
      );
    }
  }
  root.updateMatrixWorld(true);
}

export function cubMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((object) => {
    const motion = object.userData.motion as string | undefined;
    if (!motion?.startsWith('cub')) return;
    const values: number[] = [],
      rest = object.quaternion.clone();
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'cubNeck') {
        e.y = Math.sin(a) * 0.027;
        e.z = Math.sin(a - 0.4) * 0.008;
      }
      if (motion === 'cubHead') {
        e.y = Math.sin(a - 0.45) * 0.049;
        e.x = Math.sin(a * 2 - 0.6) * 0.026;
      }
      if (motion === 'cubEar')
        e.y = Math.sin(a + (object.userData.side as number) * 0.7) ** 9 * 0.07;
      if (motion === 'cubBlink') {
        const blink = Math.max(0, 1 - Math.abs(time - 3.65) / 0.15);
        values.push(1, 1 - blink * 0.93, 1);
      } else values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const size = motion === 'cubBlink' ? 3 : 4;
    values.splice(values.length - size, size, ...values.slice(0, size));
    tracks.push(
      motion === 'cubBlink'
        ? new T.VectorKeyframeTrack(`${object.name}.scale`, times, values)
        : new T.QuaternionKeyframeTrack(`${object.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
