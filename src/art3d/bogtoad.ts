import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const smooth = T.MathUtils.smoothstep;
const HEAD = new T.Vector3(-0.045, 0.73, 0.4);
const HEAD_ROTATION = new T.Quaternion().setFromEuler(new T.Euler(-0.025, -0.16, 0.035));
const WARTS = [
  [-0.22, -0.36, 0.075, 0.062, 0.018],
  [0.12, -0.5, 0.082, 0.068, 0.016],
  [0.3, -0.27, 0.065, 0.086, 0.021],
  [-0.12, -0.04, 0.073, 0.06, 0.013],
  [0.13, -0.18, 0.06, 0.07, 0.016],
  [-0.35, -0.19, 0.062, 0.078, 0.017],
  [-0.38, -0.48, 0.085, 0.06, 0.02],
  [0.35, -0.59, 0.068, 0.07, 0.014],
  [0.01, -0.66, 0.063, 0.072, 0.016],
];
const FEET = [
  [-0.54, 0.145, 0.64],
  [0.52, 0.145, 0.55],
  [-0.7, 0.145, -0.43],
  [0.76, 0.145, -0.52],
];

/** Broad jaw over an unequal planted crouch; the folded thighs carry most of the mass. */
function anatomyField(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([0.04, 0.59, -0.17], [0.49, 0.35, 0.59], 0.02), 0.13],
    [ellipsoid([0.04, 0.46, -0.12], [0.4, 0.28, 0.5]), 0.1],
    [ellipsoid([-0.055, 0.67, 0.23], [0.4, 0.25, 0.36], -0.03), 0.13],
    [ellipsoid([-0.5, 0.39, -0.35], [0.31, 0.3, 0.38], 0.24), 0.1],
    [ellipsoid([0.53, 0.38, -0.43], [0.3, 0.285, 0.36], -0.16), 0.1],
    [
      taperedSpineField(
        [[-0.31, 0.64, 0.27], [-0.5, 0.43, 0.25], [-0.49, 0.27, 0.43], FEET[0]],
        [0.11, 0.082, 0.065, 0.059],
      ),
      0.065,
    ],
    [
      taperedSpineField(
        [[0.28, 0.63, 0.22], [0.52, 0.38, 0.12], [0.48, 0.22, 0.37], FEET[1]],
        [0.105, 0.078, 0.061, 0.06],
      ),
      0.065,
    ],
    [
      taperedSpineField(
        [
          [-0.53, 0.43, -0.25],
          [-0.75, 0.3, -0.25],
          [-0.75, 0.17, -0.74],
          [-0.68, 0.14, -0.68],
          FEET[2],
        ],
        [0.16, 0.12, 0.08, 0.06, 0.052],
      ),
      0.065,
    ],
    [
      taperedSpineField(
        [
          [0.52, 0.42, -0.32],
          [0.76, 0.27, -0.37],
          [0.79, 0.16, -0.85],
          [0.76, 0.14, -0.76],
          FEET[3],
        ],
        [0.145, 0.107, 0.077, 0.06, 0.052],
      ),
      0.063,
    ],
  ];
  for (const [x, y, z] of FEET)
    shapes.push([ellipsoid([x, y + 0.008, z], [0.093, 0.062, 0.114]), 0.037]);
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.015, 0], [0.397, 0.185, 0.285]), 0.075],
    [ellipsoid([0, -0.062, 0.164], [0.355, 0.115, 0.221]), 0.062],
    [ellipsoid([0, -0.126, 0.155], [0.324, 0.061, 0.192]), 0.033],
    [ellipsoid([0, -0.235, 0.064], [0.245, 0.153, 0.212]), 0.075],
  ];
  for (const side of [-1, 1]) {
    skull.push([
      ellipsoid([side * 0.277, 0.16, 0.055], [0.149, 0.135, 0.182], side * -0.06),
      0.065,
    ]);
    skull.push([ellipsoid([side * 0.32, 0.065, -0.17], [0.139, 0.09, 0.215], side * -0.12), 0.06]);
  }
  const inv = new T.Matrix4().makeRotationFromQuaternion(HEAD_ROTATION.clone().invert()).elements;
  return (x, y, z) => {
    let f = 10;
    for (const [shape, k] of shapes) f = union(f, shape(x, y, z), k);
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    if (Math.abs(dx) < 0.7 && Math.abs(dy) < 0.5 && Math.abs(dz) < 0.6) {
      const hx = inv[0] * dx + inv[4] * dy + inv[8] * dz,
        hy = inv[1] * dx + inv[5] * dy + inv[9] * dz,
        hz = inv[2] * dx + inv[6] * dy + inv[10] * dz;
      let h = 10;
      for (const [shape, k] of skull) h = union(h, shape(hx, hy, hz), k);
      f = union(f, h, 0.08);
    }
    if (y > 0.57 && z < 0.32) {
      let relief = 0;
      for (const [cx, cz, rx, rz, height] of WARTS) {
        const q = ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2;
        if (q < 9) relief += height * Math.exp(-q * 1.4);
      }
      f -= relief * smooth(y, 0.57, 0.82) * (1 - smooth(z, 0.08, 0.32));
    }
    return Math.max(f, 0.105 - y);
  };
}
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function fieldNoise(x: number, y: number) {
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
function pigment(p: T.Vector3) {
  const local = p.clone().sub(HEAD).applyQuaternion(HEAD_ROTATION.clone().invert());
  const pale =
    smooth(local.y, -0.38, -0.26) *
    (1 - smooth(local.y, -0.13, -0.055)) *
    smooth(local.z, 0.03, 0.25) *
    (1 - smooth(Math.abs(local.x), 0.25, 0.4));
  const belly = (1 - smooth(p.y, 0.27, 0.49)) * (1 - smooth(Math.abs(p.x), 0.24, 0.43));
  const mottling = fieldNoise(p.x * 5.7 + p.y * 2, p.z * 6.1 - p.y * 1.7);
  const fine = fieldNoise(p.x * 14 - p.z * 3, p.y * 16 + p.z * 7);
  let spot = 0;
  for (const [cx, cz, rx, rz] of WARTS)
    spot = Math.max(
      spot,
      Math.exp(-(((p.x - cx) / (rx * 1.35)) ** 2 + ((p.z - cz) / (rz * 1.35)) ** 2)),
    );
  const dorsal = smooth(p.y, 0.49, 0.85) * (1 - smooth(p.z, 0.09, 0.37));
  return new T.Color('#718466')
    .lerp(new T.Color('#465c42'), smooth(mottling, 0.45, 0.78) * 0.61)
    .lerp(new T.Color('#8b966d'), (1 - smooth(mottling, 0.21, 0.46)) * 0.48)
    .lerp(new T.Color('#3b513c'), spot * dorsal * 0.56)
    .lerp(new T.Color('#b6bc8f'), Math.max(pale * 0.92, belly * 0.7))
    .multiplyScalar(0.98 + fine * 0.065);
}
/** Locally generated granular skin; prepacked normal convention matches live and GLB rendering. */
function skinMaterial() {
  const size = 512,
    heights = new Float32Array(size * size),
    tones = new Float32Array(size * size);
  const pixels = new Uint8Array(size * size * 4),
    normals = pixels.slice(),
    packed = pixels.slice();
  const wrap = (x: number, n: number) => ((x % n) + n) % n;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const col = Math.floor(x / 16),
        row = Math.floor(y / 16);
      let h = 0;
      for (let c = col - 1; c <= col + 1; c++)
        for (let r = row - 1; r <= row + 1; r++) {
          const seed = hash(wrap(c, 32), wrap(r, 32));
          const cx = c * 16 + hash(wrap(c + 17, 32), wrap(r, 32)) * 12,
            cy = r * 16 + hash(wrap(c, 32), wrap(r + 9, 32)) * 12;
          const radius = 2.5 + seed * 3.5,
            q = ((x - cx) / radius) ** 2 + ((y - cy) / radius) ** 2;
          h += Math.exp(-q) * (0.24 + seed * 0.6);
        }
      heights[y * size + x] = h;
      tones[y * size + x] = 225 + h * 20 + (hash(x, y) - 0.5) * 7;
    }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const k = (y * size + x) * 4,
        h = heights[y * size + x],
        tone = tones[y * size + x];
      pixels.set([tone, tone, tone, 255], k);
      const n = new T.Vector3(
        (heights[y * size + wrap(x - 1, size)] - heights[y * size + wrap(x + 1, size)]) * 1.4,
        (heights[wrap(y - 1, size) * size + x] - heights[wrap(y + 1, size) * size + x]) * 1.4,
        1,
      ).normalize();
      normals.set([128 + n.x * 127, 128 - n.y * 127, n.z * 255, 255], k);
      packed.set([255, 232 - h * 18, 255, 255], k);
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
    vertexColors: true,
    map: tex(pixels, true),
    normalMap: tex(normals),
    normalScale: new T.Vector2(0.58, -0.58),
    roughnessMap: rough,
    metalnessMap: rough,
    metalness: 0,
    roughness: 0.92,
  });
}
function add(parent: T.Object3D, g: T.BufferGeometry, m: T.Material, name: string) {
  const mesh = new T.Mesh(g, m);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function oval(parent: T.Object3D, name: string, p: number[], r: number[], m: T.Material) {
  const mesh = add(parent, new T.SphereGeometry(1, 36, 28), m, name);
  mesh.position.copy(v(p));
  mesh.scale.copy(v(r));
  return mesh;
}
function colorGeometry(g: T.BufferGeometry) {
  const p = g.attributes.position,
    colors: number[] = [];
  for (let i = 0; i < p.count; i++)
    colors.push(...pigment(new T.Vector3().fromBufferAttribute(p, i)).toArray());
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  return g;
}
export function bogtoad(root: T.Group) {
  const skin = skinMaterial();
  const rim = new T.MeshStandardMaterial({ color: '#2c3622', roughness: 0.63 });
  const eyeMaterial = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.32 });
  const rig = new T.Bone();
  rig.name = 'Bogtoad_Anchor';
  root.add(rig);
  const head = new T.Bone();
  head.name = 'Bogtoad_Head';
  head.position.copy(HEAD);
  head.userData.motion = 'toadHead';
  rig.add(head);
  const throat = new T.Bone();
  throat.name = 'Bogtoad_Throat';
  throat.position.set(-0.045, 0.515, 0.5);
  throat.userData.motion = 'toadBreath';
  rig.add(throat);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([rig, head, throat]);
  const field = anatomyField();
  const geometry = sculptField(
    field,
    { step: 0.019, origin: [-1.02, 0.025, -1.1], cells: [110, 61, 118] },
    pigment,
  );
  const p = geometry.attributes.position,
    joints: number[] = [],
    weights: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const h = smooth(y, 0.56, 0.615) * smooth(z, 0.05, 0.23);
    const b =
      (1 - h) *
      smooth(z, 0.38, 0.59) *
      (1 - smooth(Math.abs(x + 0.045), 0.17, 0.3)) *
      smooth(y, 0.3, 0.43) *
      (1 - smooth(y, 0.62, 0.69));
    joints.push(0, 1, 2, 0);
    weights.push(1 - h - b, h, b, 0);
  }
  geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  const body = new T.SkinnedMesh(geometry, skin);
  body.name = 'Bogtoad_ContinuousAnatomy';
  body.castShadow = body.receiveShadow = true;
  root.add(body);
  body.bind(skeleton);
  const face = new T.Group();
  face.name = 'Bogtoad_Face';
  face.quaternion.copy(HEAD_ROTATION);
  head.add(face);
  const surfaceZ = (x: number, y: number) => {
    const sample = (z: number) => {
      const p = new T.Vector3(x, y, z).applyQuaternion(HEAD_ROTATION).add(HEAD);
      return field(p.x, p.y, p.z);
    };
    let inside = 0.6;
    while (sample(inside) > 0 && inside > -0.4) inside -= 0.005;
    let outside = inside + 0.005;
    for (let i = 0; i < 16; i++) {
      const mid = (inside + outside) / 2;
      if (sample(mid) > 0) outside = mid;
      else inside = mid;
    }
    return (inside + outside) / 2 + 0.002;
  };
  for (const side of [-1, 1]) {
    const eye = new T.Group();
    eye.name = `Bogtoad_Eye_${side}`;
    const cx = side * 0.302,
      cy = 0.172,
      cz = surfaceZ(cx, cy);
    eye.position.set(cx, cy, cz);
    eye.userData.motion = 'toadBlink';
    face.add(eye);
    const g = new T.SphereGeometry(1, 64, 40),
      positions = g.attributes.position,
      colors: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        y = positions.getY(i),
        z = positions.getZ(i);
      const px = cx + x * 0.086,
        py = cy + y * 0.061;
      positions.setXYZ(
        i,
        x * 0.086,
        y * 0.061,
        surfaceZ(px, py) - cz + z * (z > 0 ? 0.018 : 0.042),
      );
      const radial = Math.hypot(x, y);
      const color = new T.Color('#beaa5b').lerp(new T.Color('#253324'), smooth(radial, 0.79, 0.91));
      color.lerp(
        pigment(new T.Vector3(px, py, cz).applyQuaternion(HEAD_ROTATION).add(HEAD)),
        smooth(radial, 0.93, 1),
      );
      const slit = Math.hypot(x / 0.83, (y + 0.015) / 0.13);
      color.lerp(new T.Color('#12221b'), 1 - smooth(slit, 0.88, 1.05));
      const glint = Math.hypot((x + 0.29) / 0.055, (y - 0.25) / 0.06);
      color.lerp(new T.Color('#e8ddac'), 1 - smooth(glint, 0.6, 1));
      colors.push(...color.toArray());
    }
    g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const lens = add(eye, g, eyeMaterial, `Bogtoad_FittedEye_${side}`);
    lens.castShadow = false;
    const x = side * 0.15,
      y = 0.013,
      z = surfaceZ(x, y);
    const nostril = oval(face, `Bogtoad_Nostril_${side}`, [x, y, z], [0.017, 0.005, 0.0035], rim);
    nostril.rotation.z = side * -0.22;
  }
  const mouthPoints = Array.from({ length: 41 }, (_, i) => {
    const t = i / 40,
      x = (t - 0.5) * 0.76,
      y = -0.109 + 0.022 * (Math.abs(t - 0.5) * 2) ** 1.5;
    return [x, y, surfaceZ(x, y)];
  });
  add(
    face,
    loft(
      mouthPoints,
      [0.001, 0.0032, 0.0036, 0.0032, 0.001],
      [0.001, 0.0032, 0.0036, 0.0032, 0.001],
      90,
      10,
    ),
    rim,
    'Bogtoad_FittedMouth',
  );
  for (let foot = 0; foot < FEET.length; foot++) {
    const [x, y, z] = FEET[foot],
      count = foot < 2 ? 4 : 5,
      side = x < 0 ? -1 : 1;
    for (let digit = 0; digit < count; digit++) {
      const fan = (digit - (count - 1) / 2) / (count - 1),
        reach =
          foot < 2 ? 0.29 * [0.75, 1, 1.1, 0.82][digit] : 0.33 * [0.55, 0.8, 1, 1.15, 0.85][digit];
      const points = [
        [x + fan * 0.12, y + 0.006, z + 0.048],
        [x + fan * 0.23, y - 0.004, z + reach * 0.58],
        [x + fan * 0.3 + side * (foot < 2 ? 0 : 0.07), 0.117, z + reach],
      ];
      const shaft = loft(points, [0.026, 0.021, 0.013], [0.022, 0.019, 0.012], 36, 12);
      const tip = new T.SphereGeometry(1, 20, 14);
      tip.scale(0.013, 0.012, 0.018);
      tip.translate(...(points.at(-1)! as [number, number, number]));
      const g = mergeGeometries([shaft, tip]);
      shaft.dispose();
      tip.dispose();
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.105) p.setY(i, 0.105);
      g.computeVertexNormals();
      add(root, colorGeometry(g), skin, `Bogtoad_Toe_${foot}_${digit}`);
    }
  }
  root.updateMatrixWorld(true);
}
export function bogtoadMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((node) => {
    const motion = node.userData.motion as string | undefined;
    if (!motion?.startsWith('toad')) return;
    const values: number[] = [],
      rest = node.quaternion.clone();
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2;
      if (motion === 'toadBlink') {
        const blink = Math.max(0, 1 - Math.abs(time - 3.35) / 0.18);
        values.push(1, 1 - blink * 0.94, 1);
      } else if (motion === 'toadBreath') {
        const breath = Math.sin(a);
        values.push(1 + breath * 0.018, 1 + breath * 0.028, 1 + breath * 0.035);
      } else {
        const e = new T.Euler(
          Math.sin(a - 0.3) * 0.012,
          Math.sin(a) * 0.018,
          Math.sin(a - 0.5) * 0.005,
        );
        values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
      }
    }
    const scalar = motion !== 'toadHead',
      size = scalar ? 3 : 4;
    values.splice(-size, size, ...values.slice(0, size));
    tracks.push(
      scalar
        ? new T.VectorKeyframeTrack(`${node.name}.scale`, times, values)
        : new T.QuaternionKeyframeTrack(`${node.name}.quaternion`, times, values),
    );
  });
  return tracks;
}
