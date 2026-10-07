import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';

const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const smooth = T.MathUtils.smoothstep;
const HEAD = new T.Vector3(-0.64, 0.59, 0.16);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(-0.025, -1.04, 0.025));
const INVERSE_TURN = TURN.clone().invert();
const TAIL = [
  [0.5, 0.38, -0.055],
  [0.87, 0.29, -0.005],
  [1.13, 0.255, 0.17],
  [1.23, 0.265, 0.48],
  [1.02, 0.32, 0.72],
  [0.68, 0.37, 0.8],
  [0.46, 0.39, 0.68],
];
const TAIL_RADII = [0.205, 0.158, 0.114, 0.083, 0.052, 0.029, 0.005];
const FEET = [
  [-0.7, 0.152, 0.59],
  [-0.43, 0.152, -0.58],
  [0.68, 0.155, 0.58],
  [0.46, 0.153, -0.57],
];
const JAW_HINGE = new T.Vector3(0, -0.074, -0.14);

/** Long, low skull with an elevated orbital plane and a broad flattened muzzle. */
function skullField(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([0, 0.014, -0.055], [0.255, 0.153, 0.275]), 0.057],
    [ellipsoid([0, -0.011, 0.28], [0.208, 0.112, 0.44]), 0.052],
    [ellipsoid([0, -0.017, 0.643], [0.165, 0.083, 0.175]), 0.043],
  ];
  for (const side of [-1, 1]) {
    shapes.push([ellipsoid([side * 0.186, 0.119, -0.045], [0.096, 0.061, 0.15]), 0.038]);
    shapes.push([ellipsoid([side * 0.071, 0.047, 0.695], [0.06, 0.04, 0.075]), 0.026]);
  }
  return (x, y, z) => {
    let f = 10;
    for (const [s, k] of shapes) f = union(f, s(x, y, z), k);
    const lip = -0.079 + Math.sin(z * 11) * 0.006;
    return Math.max(f, lip - y);
  };
}
function anatomyField(skull: Field): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([-0.055, 0.425, -0.045], [0.68, 0.238, 0.328], -0.035), 0.1],
    [ellipsoid([0.37, 0.39, -0.05], [0.37, 0.22, 0.27], -0.1), 0.11],
    [ellipsoid([-0.43, 0.5, 0.057], [0.34, 0.207, 0.27], 0.14), 0.1],
  ];
  const limbs = [
    [[-0.35, 0.45, 0.22], [-0.27, 0.245, 0.51], [-0.5, 0.19, 0.58], FEET[0]],
    [[-0.32, 0.44, -0.24], [-0.14, 0.235, -0.51], [-0.23, 0.18, -0.57], FEET[1]],
    [[0.39, 0.43, 0.16], [0.72, 0.28, 0.36], [0.85, 0.17, 0.48], FEET[2]],
    [[0.37, 0.41, -0.21], [0.65, 0.25, -0.38], [0.65, 0.17, -0.56], FEET[3]],
  ];
  limbs.forEach((points, i) =>
    shapes.push([
      taperedSpineField(points, i < 2 ? [0.105, 0.079, 0.057, 0.052] : [0.18, 0.125, 0.066, 0.058]),
      0.055,
    ]),
  );
  for (const [x, y, z] of FEET)
    shapes.push([ellipsoid([x - 0.01, y, z], [0.105, 0.057, 0.097]), 0.025]);
  const tail = taperedSpineField(
    TAIL.map(([x, y, z]) => [x, y / 1.3, z]),
    TAIL_RADII,
  );
  const inv = new T.Matrix4().makeRotationFromQuaternion(INVERSE_TURN).elements;
  return (x, y, z) => {
    let f = 10;
    for (const [s, k] of shapes) f = union(f, s(x, y, z), k);
    f = union(f, tail(x, y / 1.3, z), 0.07);
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    const hx = inv[0] * dx + inv[4] * dy + inv[8] * dz;
    const hy = inv[1] * dx + inv[5] * dy + inv[9] * dz;
    const hz = inv[2] * dx + inv[6] * dy + inv[10] * dz;
    f = union(f, skull(hx, hy, hz), 0.067);
    return Math.max(f, 0.105 - y);
  };
}
function pigment(p: T.Vector3) {
  const head = p.clone().sub(HEAD).applyQuaternion(INVERSE_TURN);
  const under = 1 - smooth(p.y, 0.27, 0.48);
  const jaw = smooth(head.z, 0.13, 0.35) * (1 - smooth(head.y, -0.05, 0.025));
  const mottling = noiseField(p.x * 5.1 + p.y * 1.7, p.z * 5.3 - p.y * 2.1);
  return new T.Color('#6f8063')
    .lerp(new T.Color('#364c3c'), smooth(p.y, 0.45, 0.78) * 0.47)
    .lerp(new T.Color('#45563e'), smooth(mottling, 0.45, 0.77) * 0.46)
    .lerp(new T.Color('#919676'), (1 - smooth(mottling, 0.18, 0.4)) * 0.3)
    .lerp(new T.Color('#a5ac84'), Math.max(under * 0.55, jaw * 0.65));
}
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function noiseField(x: number, y: number) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    fx = smooth(x - ix, 0, 1),
    fy = smooth(y - iy, 0, 1);
  return T.MathUtils.lerp(
    T.MathUtils.lerp(hash(ix, iy), hash(ix + 1, iy), fx),
    T.MathUtils.lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), fx),
    fy,
  );
}
/** Small, irregular skin scales; dorsal armor remains modeled at a larger scale. */
function skinMaterial() {
  const size = 512,
    cols = 12,
    rows = 16,
    heights = new Float32Array(size * size),
    tones = heights.slice();
  const pixels = new Uint8Array(size * size * 4),
    normals = pixels.slice(),
    packed = pixels.slice();
  const wrap = (n: number, count: number) => ((n % count) + count) % count;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const px = (x / size) * cols,
        py = (y / size) * rows,
        cx = Math.floor(px),
        cy = Math.floor(py);
      let first = Infinity,
        second = Infinity,
        seed = 0;
      for (let a = cx - 1; a <= cx + 1; a++)
        for (let b = cy - 1; b <= cy + 1; b++) {
          const ax = wrap(a, cols),
            by = wrap(b, rows);
          const dx = px - (a + 0.5 + (hash(ax, by) - 0.5) * 0.44),
            dy = py - (b + 0.5 + (hash(ax + 21, by + 5) - 0.5) * 0.44);
          const d = Math.hypot(dx, dy);
          if (d < first) {
            second = first;
            first = d;
            seed = hash(ax + 9, by + 19);
          } else if (d < second) second = d;
        }
      const edge = smooth(second - first, 0.013, 0.085);
      const pit = hash(x, y) < 0.06 ? -0.07 : 0;
      heights[y * size + x] = edge * (0.55 + seed * 0.25) + pit;
      tones[y * size + x] = 228 + edge * 18 + (seed - 0.5) * 11 + pit * 30;
    }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4,
        tone = tones[y * size + x],
        height = heights[y * size + x];
      pixels.set([tone, tone, tone, 255], index);
      const normal = new T.Vector3(
        (heights[y * size + wrap(x - 1, size)] - heights[y * size + wrap(x + 1, size)]) * 2.4,
        (heights[wrap(y - 1, size) * size + x] - heights[wrap(y + 1, size) * size + x]) * 2.4,
        1,
      ).normalize();
      normals.set([128 + normal.x * 127, 128 - normal.y * 127, normal.z * 255, 255], index);
      packed.set([255, 241 - height * 25, 255, 255], index);
    }
  const tex = (bytes: Uint8Array, srgb = false) => {
    const map = new T.DataTexture(bytes, size, size);
    map.wrapS = map.wrapT = T.RepeatWrapping;
    map.generateMipmaps = true;
    map.minFilter = T.LinearMipmapLinearFilter;
    map.magFilter = T.LinearFilter;
    if (srgb) map.colorSpace = T.SRGBColorSpace;
    map.needsUpdate = true;
    return map;
  };
  const rough = tex(packed);
  return new T.MeshStandardMaterial({
    vertexColors: true,
    map: tex(pixels, true),
    normalMap: tex(normals),
    normalScale: new T.Vector2(0.72, -0.72),
    roughnessMap: rough,
    metalnessMap: rough,
    roughness: 0.88,
    metalness: 0,
  });
}
function colored(g: T.BufferGeometry, color: (p: T.Vector3) => T.Color = pigment) {
  const p = g.attributes.position,
    colors: number[] = [];
  for (let i = 0; i < p.count; i++)
    colors.push(...color(new T.Vector3().fromBufferAttribute(p, i)).toArray());
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  return g;
}
function add(parent: T.Object3D, g: T.BufferGeometry, m: T.Material, name: string) {
  const mesh = new T.Mesh(g, m);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function oval(parent: T.Object3D, p: number[], r: number[], m: T.Material, name: string) {
  const g = new T.SphereGeometry(1, 36, 24);
  g.scale(r[0], r[1], r[2]);
  g.translate(p[0], p[1], p[2]);
  return add(parent, g, m, name);
}
/** A low keeled plate, fitted to the living surface with its entire rim buried. */
function scutePatch(
  field: Field,
  center: T.Vector3,
  length: number,
  width: number,
  angle: number,
  height: number,
) {
  const positions: number[] = [],
    indices: number[] = [],
    rings = 8,
    sides = 32;
  const surfaceY = (x: number, z: number) => {
    let inside = Math.max(1, center.y + 0.3);
    while (field(x, inside, z) > 0 && inside > 0.09) inside -= 0.012;
    if (inside <= 0.09) return Number.NaN;
    let outside = inside + 0.012;
    for (let i = 0; i < 12; i++) {
      const mid = (inside + outside) / 2;
      if (field(x, mid, z) < 0) inside = mid;
      else outside = mid;
    }
    return (inside + outside) / 2;
  };
  const c = Math.cos(angle),
    s = Math.sin(angle);
  if (!Number.isFinite(surfaceY(center.x, center.z))) return null;
  // Keep the entire footprint on the surface, including narrow shoulders/tail.
  let footprint = 1;
  for (let attempt = 0; attempt < 10; attempt++) {
    let fits = true;
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const u = Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** 0.65 * footprint;
      const w = Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** 0.65 * footprint;
      if (
        !Number.isFinite(
          surfaceY(
            center.x + u * length * 0.5 * c - w * width * 0.5 * s,
            center.z + u * length * 0.5 * s + w * width * 0.5 * c,
          ),
        )
      )
        fits = false;
    }
    if (fits) break;
    footprint *= 0.8;
  }
  length *= footprint;
  width *= footprint;
  for (let layer = 0; layer < 2; layer++) {
    const base = positions.length / 3;
    positions.push(center.x, surfaceY(center.x, center.z) + (layer ? -0.022 : height), center.z);
    for (let r = 1; r <= rings; r++)
      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * Math.PI * 2,
          radius = r / rings;
        const u = Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** 0.65 * radius;
        const w = Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** 0.65 * radius;
        const x = center.x + u * length * 0.5 * c - w * width * 0.5 * s;
        const z = center.z + u * length * 0.5 * s + w * width * 0.5 * c;
        const relief =
          height *
          (0.12 * (1 - radius * radius) +
            0.88 * Math.exp(-w * w * 16) * Math.max(0, 1 - u * u) ** 0.7) *
          (1 - smooth(radius, 0.76, 1)) *
          (1 - u * 0.12);
        positions.push(x, surfaceY(x, z) + (layer ? -0.022 : relief - 0.006), z);
      }
    for (let j = 0; j < sides; j++) {
      const a = base + 1 + j,
        b = base + 1 + ((j + 1) % sides);
      indices.push(...(layer ? [base, a, b] : [base, b, a]));
    }
    for (let r = 1; r < rings; r++)
      for (let j = 0; j < sides; j++) {
        const a = base + 1 + (r - 1) * sides + j,
          b = base + 1 + (r - 1) * sides + ((j + 1) % sides);
        const d = base + 1 + r * sides + j,
          e = base + 1 + r * sides + ((j + 1) % sides);
        indices.push(...(layer ? [a, d, e, a, e, b] : [a, e, d, a, b, e]));
      }
  }
  const stride = 1 + rings * sides;
  for (let j = 0; j < sides; j++) {
    const a = 1 + (rings - 1) * sides + j,
      b = 1 + (rings - 1) * sides + ((j + 1) % sides);
    indices.push(a, a + stride, b + stride, a, b + stride, b);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  const uv: number[] = [];
  for (let i = 0; i < positions.length; i += 3)
    uv.push(positions[i] * 2.6, positions[i + 2] * 1.75);
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  return colored(g, (p) => pigment(p).multiplyScalar(0.93));
}
/** Fixed feet, local neck motion and a delayed distal tail; no whole-body rocking. */
export function crocolisk(root: T.Group) {
  const skin = skinMaterial();
  const pale = skin.clone();
  pale.vertexColors = false;
  pale.color.set('#a4aa85');
  pale.normalScale.set(0.4, -0.4);
  const mouth = new T.MeshStandardMaterial({ color: '#39352b', roughness: 0.76 });
  const tooth = new T.MeshStandardMaterial({ color: '#c7bb93', roughness: 0.64 });
  const claw = new T.MeshStandardMaterial({ color: '#4b4c39', roughness: 0.68 });
  const anchor = new T.Bone();
  anchor.name = 'Crocolisk_Anchor';
  root.add(anchor);
  const head = new T.Bone();
  head.name = 'Crocolisk_Head';
  head.position.copy(HEAD);
  anchor.add(head);
  head.userData.motion = 'crocHead';
  const breath = new T.Bone();
  breath.name = 'Crocolisk_Breath';
  breath.position.set(-0.1, 0.49, 0);
  anchor.add(breath);
  breath.userData.motion = 'crocBreath';
  const tailBones = [2, 3, 5].map((index, i) => {
    const bone = new T.Bone();
    bone.name = `Crocolisk_Tail_${i}`;
    bone.userData.motion = 'crocTail';
    bone.userData.phase = i;
    bone.position.copy(v(TAIL[index]));
    anchor.add(bone);
    return bone;
  });
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, head, breath, ...tailBones]);
  const curve = new T.CatmullRomCurve3(TAIL.map(v));
  const tailSamples = Array.from({ length: 65 }, (_, i) => curve.getPoint(i / 64));
  const weightsAt = (p: T.Vector3) => {
    const local = p.clone().sub(HEAD).applyQuaternion(INVERSE_TURN);
    const h =
      smooth(local.z, -0.26, -0.04) * smooth(p.y, 0.32, 0.48) * (1 - smooth(p.x, -0.47, -0.23));
    let t = 0,
      distance = Infinity;
    if (p.z > 0.67 || p.x > 1.0) {
      for (let i = 0; i < tailSamples.length; i++) {
        const d = p.distanceToSquared(tailSamples[i]);
        if (d < distance) {
          distance = d;
          t = i / 64;
        }
      }
    }
    const tail =
      smooth(t, 0.29, 0.42) *
      smooth(p.y, 0.14, 0.22) *
      (1 - smooth(Math.sqrt(distance), 0.12, 0.2));
    if (tail > 0) {
      const a = smooth(t, 0.44, 0.6),
        b = smooth(t, 0.7, 0.9);
      return {
        joints: [0, 3, 4, 5],
        weights: [1 - tail, tail * (1 - a), tail * a * (1 - b), tail * a * b],
      };
    }
    const b = (1 - h) * smooth(p.y, 0.35, 0.58) * (1 - smooth(Math.abs(p.x + 0.03), 0.22, 0.5));
    return { joints: [0, 1, 2, 0], weights: [1 - h - b, h, b, 0] };
  };
  const bind = (g: T.BufferGeometry | null, material: T.Material, name: string) => {
    if (!g) return;
    const joints: number[] = [],
      weights: number[] = [],
      p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const data = weightsAt(new T.Vector3().fromBufferAttribute(p, i));
      joints.push(...data.joints);
      weights.push(...data.weights);
    }
    g.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
    g.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
    const mesh = new T.SkinnedMesh(g, material);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
    mesh.bind(skeleton);
    return mesh;
  };
  const skull = skullField(),
    field = anatomyField(skull);
  bind(
    sculptField(
      field,
      { step: 0.019, origin: [-1.6, 0.029, -0.83], cells: [162, 49, 96] },
      pigment,
    ),
    skin,
    'Crocolisk_ContinuousAnatomy',
  );
  // Broad dorsal plates have quieter flank skin between them; the tail keels taper with it.
  for (let row = 0; row < 6; row++)
    for (let lane = 0; lane < 4; lane++) {
      const x = -0.46 + row * 0.2 + (lane % 2 ? 0.016 : 0);
      const z = -0.245 + lane * 0.137 + Math.sin(row * 0.9) * 0.01;
      bind(
        scutePatch(
          field,
          new T.Vector3(x, 0.6, z),
          0.185 + (row % 2) * 0.01,
          0.123,
          -0.025,
          0.018 + (lane === 1 || lane === 2 ? 0.017 : 0.001),
        ),
        skin,
        `Crocolisk_BackScute_${row}_${lane}`,
      );
    }
  for (let i = 0; i < 9; i++) {
    const t = 0.16 + i * 0.087,
      center = curve.getPoint(t),
      tangent = curve.getTangent(t);
    const angle = Math.atan2(tangent.z, tangent.x);
    const radius = T.MathUtils.lerp(0.145, 0.023, t);
    const lanes = t < 0.6 ? [-1, 1] : [0];
    for (const lane of lanes) {
      const p = center
        .clone()
        .add(
          new T.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(lane * radius * 0.4),
        );
      bind(
        scutePatch(
          field,
          p,
          0.137 - t * 0.046,
          radius * (lanes.length === 1 ? 1.3 : 0.88),
          angle,
          0.052 - t * 0.024,
        ),
        skin,
        `Crocolisk_TailScute_${i}_${lane}`,
      );
    }
  }
  const face = new T.Group();
  face.name = 'Crocolisk_Face';
  face.quaternion.copy(TURN);
  head.add(face);
  const jaw = new T.Group();
  jaw.name = 'Crocolisk_Jaw';
  jaw.position.copy(JAW_HINGE);
  jaw.rotation.x = 0.045;
  jaw.userData.motion = 'crocJaw';
  face.add(jaw);
  const jawField = (x: number, y: number, z: number) => {
    const bottom = ellipsoid([0, -0.013, 0.44], [0.2, 0.052, 0.44])(x, y, z);
    const base = ellipsoid([0, -0.005, 0.135], [0.235, 0.075, 0.2])(x, y, z);
    return Math.max(union(bottom, base, 0.032), y - 0.018);
  };
  add(
    jaw,
    sculptField(jawField, { step: 0.009, origin: [-0.26, -0.1, -0.09], cells: [58, 16, 110] }),
    pale,
    'Crocolisk_LowerJaw',
  );
  oval(jaw, [0, 0.019, 0.43], [0.184, 0.009, 0.399], mouth, 'Crocolisk_MouthFloor');
  oval(face, [0, -0.08, 0.31], [0.193, 0.008, 0.43], mouth, 'Crocolisk_Palate');
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const z = 0.12 + i * 0.078,
        x = side * (0.187 - smooth(z, 0.44, 0.75) * 0.077);
      const length = [0.025, 0.044, 0.025, 0.03, 0.037, 0.028, 0.025, 0.025][i];
      add(
        face,
        loft(
          [
            [x, -0.075, z],
            [x * 0.98, -0.085 - length * 0.56, z - 0.004],
            [x * 0.95, -0.079 - length, z - 0.009],
          ],
          [0.014, 0.009, 0.0005],
          [0.012, 0.008, 0.0004],
          14,
          10,
        ),
        tooth,
        `Crocolisk_UpperTooth_${side}_${i}`,
      );
      add(
        jaw,
        loft(
          [
            [x * 0.94, 0.014, z + 0.167],
            [x * 0.91, 0.02 + length * 0.42, z + 0.17],
            [x * 0.89, 0.02 + length * 0.74, z + 0.167],
          ],
          [0.011, 0.007, 0.0004],
          [0.01, 0.006, 0.0004],
          14,
          10,
        ),
        tooth,
        `Crocolisk_LowerTooth_${side}_${i}`,
      );
    }
    const eye = new T.Group();
    eye.name = `Crocolisk_Eye_${side}`;
    eye.userData.motion = 'crocBlink';
    const normal = new T.Vector3(side * 0.75, 0.38, 0.45).normalize();
    const center = new T.Vector3(side * 0.177, 0.111, 0.003);
    let s = 0;
    while (
      skull(...(center.clone().addScaledVector(normal, s).toArray() as [number, number, number])) <
        0 &&
      s < 0.2
    )
      s += 0.002;
    eye.position.copy(center.addScaledVector(normal, s - 0.006));
    eye.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), normal);
    face.add(eye);
    const g = new T.SphereGeometry(1, 48, 32),
      p = g.attributes.position,
      colors: number[] = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i),
        r = Math.hypot(x, y);
      const color = new T.Color('#b6a55d').lerp(new T.Color('#34402c'), smooth(r, 0.77, 0.95));
      color.lerp(new T.Color('#17251c'), 1 - smooth(Math.hypot(x / 0.15, y / 0.76), 0.85, 1.05));
      color.lerp(
        new T.Color('#dfd7ac'),
        1 - smooth(Math.hypot((x + 0.26) / 0.07, (y - 0.26) / 0.07), 0.5, 1),
      );
      colors.push(...color.toArray());
      p.setXYZ(i, x * 0.052, y * 0.038, z * 0.019);
    }
    g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    add(
      eye,
      g,
      new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.36 }),
      `Crocolisk_AmberEye_${side}`,
    ).castShadow = false;
    let noseTop = 0.14;
    while (skull(side * 0.074, noseTop, 0.71) > 0 && noseTop > 0) noseTop -= 0.001;
    oval(
      face,
      [side * 0.074, noseTop + 0.002, 0.71],
      [0.025, 0.004, 0.019],
      mouth,
      `Crocolisk_Nostril_${side}`,
    );
  }
  for (let foot = 0; foot < FEET.length; foot++) {
    const [x, y, z] = FEET[foot],
      side = z > 0 ? 1 : -1,
      count = foot < 2 ? 5 : 4;
    for (let digit = 0; digit < count; digit++) {
      const fan = digit / (count - 1) - 0.5;
      const reach = (foot < 2 ? 0.22 : 0.255) * [0.65, 0.9, 1, 0.86, 0.62][digit];
      const tip = [x - reach, 0.122, z + fan * 0.23 + side * 0.045];
      const points = [
        [x - 0.045, y, z + fan * 0.1],
        [x - reach * 0.66, 0.135, z + fan * 0.19 + side * 0.026],
        tip,
      ];
      let g = loft(points, [0.025, 0.023, 0.014], [0.026, 0.019, 0.012], 26, 10);
      if (digit >= 3) {
        const end = new T.SphereGeometry(1, 20, 14);
        end.scale(0.017, 0.012, 0.014);
        end.translate(tip[0], tip[1], tip[2]);
        const merged = mergeGeometries([g, end]);
        g.dispose();
        end.dispose();
        g = merged;
      }
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.105) p.setY(i, 0.105);
      g.computeVertexNormals();
      add(root, colored(g), skin, `Crocolisk_Toe_${foot}_${digit}`);
      if (digit < 3)
        add(
          root,
          loft(
            [tip, [tip[0] - 0.035, 0.115, tip[2]], [tip[0] - 0.065, 0.107, tip[2] + side * 0.008]],
            [0.017, 0.011, 0.0005],
            [0.015, 0.009, 0.0005],
            16,
            10,
          ),
          claw,
          `Crocolisk_Claw_${foot}_${digit}`,
        );
    }
  }
  root.updateMatrixWorld(true);
}

export function crocoliskMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((node) => {
    const motion = node.userData.motion as string | undefined;
    if (!motion?.startsWith('croc')) return;
    const values: number[] = [],
      rest = node.quaternion.clone();
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2;
      if (motion === 'crocBlink') {
        const blink = Math.max(0, 1 - Math.abs(time - 4.1) / 0.19);
        values.push(1, 1 - blink * 0.94, 1);
      } else if (motion === 'crocBreath')
        values.push(1 + Math.sin(a) * 0.004, 1 + Math.sin(a) * 0.008, 1 + Math.sin(a) * 0.012);
      else {
        const e =
          motion === 'crocHead'
            ? new T.Euler(Math.sin(a - 0.3) * 0.007, Math.sin(a) * 0.024, Math.sin(a - 0.4) * 0.007)
            : motion === 'crocJaw'
              ? new T.Euler((0.5 - Math.cos(a - 0.5) * 0.5) * 0.055, 0, 0)
              : new T.Euler(0, Math.sin(a - Number(node.userData.phase) * 0.5) * 0.033, 0);
        values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
      }
    }
    const scale = motion === 'crocBlink' || motion === 'crocBreath',
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
