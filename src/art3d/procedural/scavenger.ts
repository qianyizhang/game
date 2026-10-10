import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';

const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const smooth = T.MathUtils.smoothstep;
const HEAD = new T.Vector3(-0.67, 1.25, 0.18);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(0.035, -0.6, -0.035));
const INVERSE_TURN = TURN.clone().invert();
const PAWS = [
  [-0.61, 0.16, 0.31],
  [-0.24, 0.16, -0.27],
  [0.66, 0.16, 0.26],
  [0.42, 0.16, -0.3],
];
const TAIL = [
  [0.59, 0.85, -0.04],
  [0.83, 0.72, -0.1],
  [1.0, 0.52, -0.05],
  [1.02, 0.36, 0.08],
  [0.91, 0.33, 0.19],
];
/** Heavy, high forequarters descend into a tucked flank and leaner hindquarters. */
function anatomyField(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([-0.22, 0.965, -0.025], [0.5, 0.315, 0.277], -0.13), 0.12],
    [ellipsoid([0.17, 0.86, -0.043], [0.4, 0.22, 0.215], -0.14), 0.09],
    [ellipsoid([0.49, 0.81, -0.058], [0.29, 0.235, 0.22], -0.12), 0.09],
    [ellipsoid([-0.38, 1.11, -0.022], [0.275, 0.23, 0.235], -0.18), 0.09],
    [ellipsoid([-0.38, 0.98, 0.16], [0.2, 0.28, 0.175], -0.17), 0.09],
    [ellipsoid([-0.28, 0.96, -0.19], [0.18, 0.27, 0.155], 0.04), 0.08],
    [ellipsoid([0.48, 0.67, 0.13], [0.165, 0.23, 0.13], -0.39), 0.075],
    [ellipsoid([0.48, 0.66, -0.21], [0.15, 0.22, 0.12], -0.27), 0.07],
    [
      taperedSpineField(
        [[-0.36, 1.02, 0.17], [-0.33, 0.66, 0.245], [-0.54, 0.29, 0.29], PAWS[0]],
        [0.13, 0.092, 0.047, 0.058],
      ),
      0.066,
    ],
    [
      taperedSpineField(
        [[-0.27, 1.01, -0.2], [-0.13, 0.62, -0.235], [-0.17, 0.28, -0.26], PAWS[1]],
        [0.12, 0.086, 0.047, 0.056],
      ),
      0.06,
    ],
    [
      taperedSpineField(
        [[0.49, 0.78, 0.16], [0.4, 0.51, 0.21], [0.6, 0.29, 0.25], PAWS[2]],
        [0.12, 0.081, 0.05, 0.055],
      ),
      0.064,
    ],
    [
      taperedSpineField(
        [[0.5, 0.75, -0.21], [0.37, 0.47, -0.27], [0.48, 0.28, -0.31], PAWS[3]],
        [0.11, 0.076, 0.046, 0.051],
      ),
      0.06,
    ],
    [
      taperedSpineField(
        [[-0.36, 1.1, 0.01], [-0.49, 1.16, 0.07], [-0.59, 1.22, 0.13], HEAD.toArray()],
        [0.255, 0.24, 0.218, 0.19],
      ),
      0.11,
    ],
    [taperedSpineField(TAIL, [0.095, 0.075, 0.086, 0.088, 0.006]), 0.055],
  ];
  for (const [x, y, z] of PAWS) {
    shapes.push([ellipsoid([x - 0.026, y + 0.007, z], [0.126, 0.075, 0.091]), 0.032]);
    for (let digit = 0; digit < 4; digit++)
      shapes.push([
        ellipsoid(
          [
            x - 0.089 - 0.012 * Math.sin((digit * Math.PI) / 3),
            y - 0.004,
            z + (digit - 1.5) * 0.04,
          ],
          [0.057, 0.059, 0.029],
        ),
        0.014,
      ]);
  }
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.035, -0.015], [0.232, 0.213, 0.23]), 0.058],
    [ellipsoid([0, -0.064, 0.095], [0.205, 0.142, 0.209]), 0.05],
    [ellipsoid([0, -0.004, 0.242], [0.139, 0.108, 0.19]), 0.045],
    [ellipsoid([0, -0.105, 0.247], [0.13, 0.046, 0.169]), 0.023],
  ];
  for (const side of [-1, 1])
    skull.push([ellipsoid([side * 0.15, 0.099, 0.12], [0.097, 0.04, 0.079], side * 0.1), 0.039]);
  const inverse = new T.Matrix4().makeRotationFromQuaternion(INVERSE_TURN).elements;
  return (x, y, z) => {
    let f = 10;
    for (const [shape, k] of shapes) f = union(f, shape(x, y, z), k);
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    if (Math.abs(dx) < 0.65 && Math.abs(dy) < 0.48 && Math.abs(dz) < 0.65) {
      const hx = inverse[0] * dx + inverse[4] * dy + inverse[8] * dz;
      const hy = inverse[1] * dx + inverse[5] * dy + inverse[9] * dz;
      const hz = inverse[2] * dx + inverse[6] * dy + inverse[10] * dz;
      let h = 10;
      for (const [shape, k] of skull) h = union(h, shape(hx, hy, hz), k);
      f = union(f, h, 0.06);
    }
    if (x > -0.64 && x < 0.41 && y > 0.94) {
      const crest = smooth(x, -0.64, -0.43) * (1 - smooth(x, 0.18, 0.41));
      const width = 0.078 - smooth(x, -0.1, 0.38) * 0.035;
      const rise = 0.043 + Math.sin(x * 25 + 0.7) * 0.006 + Math.sin(x * 47) * 0.003;
      f -=
        crest *
        rise *
        Math.exp(-(((z + 0.025 + x * 0.04) / width) ** 2)) *
        smooth(y, 0.98 - x * 0.3, 1.17 - x * 0.3);
    }
    return Math.max(f, 0.105 - y);
  };
}
function coatColor(p: T.Vector3) {
  const local = p.clone().sub(HEAD).applyQuaternion(INVERSE_TURN);
  const muzzle = smooth(local.z, 0.14, 0.36) * (1 - smooth(Math.abs(local.x), 0.1, 0.22));
  const darkFeet = 1 - smooth(p.y, 0.23, 0.67);
  const mane =
    smooth(p.y, 1.0 - p.x * 0.32, 1.23 - p.x * 0.27) *
    (1 - smooth(Math.abs(p.z + 0.025), 0.035, 0.17));
  const tail = smooth(p.x, 0.76, 0.95);
  const px = p.x * 6.5,
    py = p.y * 7.4,
    ix = Math.floor(px),
    iy = Math.floor(py);
  const side = p.z < 0 ? 17 : 3;
  let spots = 0;
  for (let a = ix - 1; a <= ix + 1; a++)
    for (let b = iy - 1; b <= iy + 1; b++) {
      const seed = hash(a + side, b + 11);
      if (seed < 0.27) continue;
      const cx = a + 0.15 + hash(a + side + 4, b - 7) * 0.7;
      const cy = b + 0.15 + hash(a + side - 5, b + 23) * 0.7;
      const dx = (px - cx) / (0.17 + seed * 0.2);
      const dy = (py - cy) / (0.2 + hash(a + side, b - 19) * 0.23);
      const angle = Math.atan2(dy, dx);
      const q =
        Math.hypot(dx + dy * (seed - 0.5) * 0.65, dy) /
        (1 + Math.sin(angle * 3 + seed * 7) * 0.13 + Math.sin(angle * 5 - seed * 4) * 0.07);
      spots = Math.max(spots, 1 - smooth(q, 0.68, 1.14));
    }
  const patterned =
    smooth(p.x, -0.6, -0.38) *
    smooth(p.y, 0.28, 0.48) *
    (1 - smooth(p.y, 1.1, 1.3)) *
    smooth(Math.abs(p.z), 0.06, 0.2);
  return new T.Color('#8e8a66')
    .lerp(new T.Color('#454132'), spots * patterned * 0.82)
    .lerp(new T.Color('#b8ad86'), muzzle * 0.76)
    .lerp(new T.Color('#464737'), Math.max(darkFeet * 0.7, mane * 0.94, tail * 0.91));
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
    normalScale: new T.Vector2(0.48, -0.48),
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
  group.name = `Scavenger_Ear_${side}`;
  group.position.set(side * 0.18, 0.18, -0.063);
  group.rotation.z = -side * 0.24;
  group.rotation.y = side === 1 ? 0.22 : -0.62;
  group.userData.motion = 'scavengerEar';
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
        const x = Math.cos(a) * r * 0.111,
          y = 0.043 + Math.sin(a) * r * 0.147;
        const z = face === 0 ? 0.02 + r * r * 0.032 : -0.038 + r * r * 0.08;
        points.push(x, y, z);
        uv.push(x * 3 + 0.5, y * 3 + 0.5);
        colors.push(...new T.Color(face === 0 ? '#79745a' : '#57513e').toArray());
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
  mesh(group, g, fur, `Scavenger_RoundedPinna_${side}`);
  const bowl = oval(
    group,
    `Scavenger_EarBowl_${side}`,
    [0, 0.052, 0.023],
    [0.067, 0.092, 0.008],
    inner,
  );
  bowl.castShadow = false;
  return group;
}

export function scavenger(root: T.Group) {
  const coat = surfaceMaterial();
  const leather = surfaceMaterial('nose');
  leather.color.set('#2f3028');
  const rim = new T.MeshStandardMaterial({ color: '#24251f', roughness: 0.76 });
  const inner = new T.MeshStandardMaterial({ color: '#57483b', roughness: 0.95 });
  const claw = new T.MeshStandardMaterial({ color: '#4b4938', roughness: 0.74 });
  const anchor = new T.Bone();
  anchor.name = 'Scavenger_Anchor';
  root.add(anchor);
  const neck = new T.Bone();
  neck.name = 'Scavenger_Neck';
  neck.position.set(-0.46, 1.15, 0.07);
  neck.userData.motion = 'scavengerNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'Scavenger_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'scavengerHead';
  neck.add(head);
  const tail = new T.Bone();
  tail.name = 'Scavenger_Tail';
  tail.position.copy(v(TAIL[1]));
  tail.userData.motion = 'scavengerTail';
  anchor.add(tail);
  const tip = new T.Bone();
  tip.name = 'Scavenger_TailTip';
  tip.position.copy(v(TAIL[3])).sub(tail.position);
  tip.userData.motion = 'scavengerTailTip';
  tail.add(tip);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, neck, head, tail, tip]);
  const field = anatomyField();
  const geometry = sculptField(
    field,
    { step: 0.021, origin: [-1.25, 0.021, -0.55], cells: [117, 78, 70] },
    coatColor,
  );
  const bind = (geometry: T.BufferGeometry, material: T.Material, name: string) => {
    const joints: number[] = [],
      weights: number[] = [],
      p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      const local = new T.Vector3(x, y, z).sub(HEAD).applyQuaternion(INVERSE_TURN);
      const h = smooth(local.z, -0.24, -0.1) * smooth(y, 0.91, 1.06);
      const n = (1 - h) * smooth(-x, 0.29, 0.5) * smooth(y, 0.8, 1.07);
      const t = smooth(x, 0.78, 0.91) * smooth(y, 0.25, 0.39) * smooth(z, -0.23, -0.1);
      const q = (1 - smooth(y, 0.36, 0.58)) * smooth(z, -0.045, 0.15);
      if (t > 0) {
        joints.push(0, 3, 4, 0);
        weights.push(1 - t, t * (1 - q), t * q, 0);
      } else {
        joints.push(0, 1, 2, 0);
        weights.push(1 - h - n, n, h, 0);
      }
    }
    geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
    geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
    const body = new T.SkinnedMesh(geometry, material);
    body.name = name;
    body.castShadow = body.receiveShadow = true;
    root.add(body);
    body.bind(skeleton);
    return body;
  };
  bind(geometry, coat, 'Scavenger_ContinuousAnatomy');
  const fringe: T.BufferGeometry[] = [];
  // Short tapered guard-hair groups break only the dorsal contour; their roots
  // sit inside the same field and use the same skin weights as the neck/body.
  for (let i = 0; i < 340; i++) {
    const seed = hash(i + 14, 9);
    const x = -0.53 + hash(i, 27) * 0.81;
    const spread = 0.044 * (1 - smooth(x, -0.18, 0.38) * 0.65);
    const lateral = (hash(i, 17) - 0.5) * 2;
    const z = -0.025 - x * 0.04 + lateral * spread;
    let y = 1.8;
    while (field(x, y, z) > 0 && y > 0.8) y -= 0.003;
    const length = 0.006 + seed * 0.027,
      lift = (0.014 + hash(i, 43) * 0.025) * (1 - Math.abs(lateral) * 0.36),
      drift = (hash(i, 61) - 0.5) * 0.016,
      width = 0.0008 + hash(i, 32) * 0.0009;
    const points = [
      [x, y - 0.009, z],
      [x + length * 0.25, y + lift * 0.52, z + drift * 0.3],
      [x + length, y + lift, z + drift],
    ];
    fringe.push(loft(points, [width, width * 0.7, 0.00008], [width, width * 0.7, 0.00008], 8, 5));
  }
  const hair = mergeGeometries(fringe);
  fringe.forEach((g) => g.dispose());
  const hairColors: number[] = [],
    hairPositions = hair.attributes.position;
  for (let i = 0; i < hairPositions.count; i++)
    hairColors.push(
      ...coatColor(new T.Vector3().fromBufferAttribute(hairPositions, i))
        .lerp(new T.Color('#343b2c'), 0.25)
        .toArray(),
    );
  hair.setAttribute('color', new T.Float32BufferAttribute(hairColors, 3));
  bind(hair, coat, 'Scavenger_ManeFringe');
  const face = new T.Group();
  face.name = 'Scavenger_Face';
  face.quaternion.copy(TURN);
  head.add(face);
  const surfaceZ = (x: number, y: number) => {
    const sample = (z: number) => {
      const point = new T.Vector3(x, y, z).applyQuaternion(TURN).add(HEAD);
      return field(point.x, point.y, point.z);
    };
    let inside = 0.65;
    while (sample(inside) > 0 && inside > -0.2) inside -= 0.005;
    let outside = inside + 0.005;
    for (let i = 0; i < 14; i++) {
      const mid = (inside + outside) / 2;
      if (sample(mid) > 0) outside = mid;
      else inside = mid;
    }
    return (inside + outside) / 2 + 0.002;
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
    ear(face, side, coat, inner);
    const eye = new T.Group();
    eye.name = `Scavenger_Eye_${side}`;
    const ex = side * 0.163,
      ey = 0.066;
    eye.position.set(ex, ey, surfaceZ(ex, ey) - 0.01);
    eye.rotation.y = side * 0.42;
    eye.rotation.z = side * 0.13;
    eye.userData.motion = 'scavengerBlink';
    face.add(eye);
    oval(eye, `Scavenger_Orbit_${side}`, [0, 0, 0], [0.042, 0.022, 0.022], rim);
    oval(
      eye,
      `Scavenger_Iris_${side}`,
      [0, -0.001, 0.016],
      [0.026, 0.016, 0.011],
      new T.MeshStandardMaterial({ color: '#9e854b', roughness: 0.39 }),
    );
    oval(eye, `Scavenger_Pupil_${side}`, [0, -0.001, 0.025], [0.012, 0.012, 0.004], rim);
    oval(
      eye,
      `Scavenger_Glint_${side}`,
      [-0.008, 0.005, 0.029],
      [0.003, 0.003, 0.0015],
      new T.MeshStandardMaterial({ color: '#dbd2ac', roughness: 0.23 }),
    );
    stroke(
      face,
      `Scavenger_Lip_${side}`,
      fitted([
        [0, -0.097, 0],
        [side * 0.08, -0.112, 0],
        [side * 0.14, -0.102, 0],
        [side * 0.192, -0.093, 0],
      ]),
      [0.0023, 0.0028, 0.0022, 0.0006],
      rim,
    );
  }
  const nose = oval(
    face,
    'Scavenger_LeatherNose',
    [0, 0.007, 0.41],
    [0.105, 0.057, 0.051],
    leather,
  );
  nose.rotation.x = -0.1;
  for (const side of [-1, 1])
    oval(face, `Scavenger_Nostril_${side}`, [side * 0.06, 0.005, 0.45], [0.023, 0.012, 0.008], rim);
  stroke(
    face,
    'Scavenger_Philtrum',
    fitted([
      [0, -0.045, 0],
      [0, -0.097, 0],
    ]),
    [0.0023, 0.0017],
    rim,
  );
  for (let foot = 0; foot < PAWS.length; foot++) {
    const [x, y, z] = PAWS[foot];
    for (let digit = 0; digit < 4; digit++) {
      const lead = x - 0.134 - 0.012 * Math.sin((digit * Math.PI) / 3),
        tz = z + (digit - 1.5) * 0.04;
      stroke(
        root,
        `Scavenger_Claw_${foot}_${digit}`,
        [
          [lead + 0.008, y + 0.006, tz],
          [lead - 0.026, y - 0.004, tz],
          [lead - 0.043, y - 0.022, tz],
        ],
        [0.012, 0.008, 0.001],
        claw,
      );
    }
  }
  root.updateMatrixWorld(true);
}

export function scavengerMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((node) => {
    const motion = node.userData.motion as string | undefined;
    if (!motion?.startsWith('scavenger')) return;
    const values: number[] = [],
      rest = node.quaternion.clone();
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'scavengerNeck') {
        e.y = Math.sin(a) * 0.021;
        e.z = Math.sin(a - 0.4) * 0.008;
      }
      if (motion === 'scavengerHead') {
        e.y = Math.sin(a - 0.35) * 0.065;
        e.x = Math.sin(a - 0.8) * 0.017;
      }
      if (motion === 'scavengerEar')
        e.y = Math.sin(a + Number(node.userData.side) * 0.8) ** 9 * 0.11;
      if (motion === 'scavengerTail') {
        e.y = Math.sin(a - 0.6) * 0.04;
        e.x = Math.sin(a - 0.6) * 0.018;
      }
      if (motion === 'scavengerTailTip') e.y = Math.sin(a - 1.0) * 0.07;
      if (motion === 'scavengerBlink') {
        const blink = Math.max(0, 1 - Math.abs(time - 3.75) / 0.18);
        values.push(1, 1 - blink * 0.94, 1);
      } else values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const scale = motion === 'scavengerBlink',
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
