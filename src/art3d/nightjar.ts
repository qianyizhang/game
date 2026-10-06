import * as T from 'three';
import { loft } from './newStudies';

const v = (p: number[]) => new T.Vector3(...(p as [number, number, number]));
const clamp = T.MathUtils.clamp;
const smooth = T.MathUtils.smoothstep;

function material(color: string, roughness = 0.86) {
  return new T.MeshStandardMaterial({ color, roughness, metalness: 0 });
}
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
/** Locally painted feather fields: anatomy supplies color regions, the atlas supplies
 * overlapping tips, broken shaft markings and barbs at a readable physical scale. */
function patternedMaterial(color: string, kind: 'body' | 'flight' | 'bark', phase = 0) {
  const size = 1024,
    pigment = new Uint8Array(size * size * 4),
    normals = pigment.slice(),
    heights = new Float32Array(size * size);
  const wrap = (n: number, period: number) => ((n % period) + period) % period;
  const noise = (x: number, y: number, pitch: number) => {
    const fx = x / pitch,
      fy = y / pitch,
      ix = Math.floor(fx),
      iy = Math.floor(fy);
    const u = smooth(fx - ix, 0, 1),
      w = smooth(fy - iy, 0, 1);
    const h = (a: number, b: number) => hash(wrap(a, size / pitch), wrap(b, size / pitch));
    return T.MathUtils.lerp(
      T.MathUtils.lerp(h(ix, iy), h(ix + 1, iy), u),
      T.MathUtils.lerp(h(ix, iy + 1), h(ix + 1, iy + 1), u),
      w,
    );
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let tone = 0,
        height = 0;
      const n = noise(x, y, 64) * 0.58 + noise(x, y, 16) * 0.29 + noise(x, y, 4) * 0.13;
      if (kind === 'body') {
        tone = 176 + n * 48;
        // Rows follow the skin, but feather lengths, tips and pigmentation differ.
        // Evaluate neighboring feather stamps continuously; there are no cell-edge phase jumps.
        const row = Math.floor(y / 32),
          column = Math.floor(x / 32);
        for (let r = row - 1; r <= row + 1; r++)
          for (let c = column - 1; c <= column + 1; c++) {
            const seed = hash(wrap(c, 32), wrap(r, 32));
            const cx = c * 32 + wrap(r, 2) * 16 + (seed - 0.5) * 12,
              cy = r * 32 + (hash(c + 71, r) - 0.5) * 12;
            const dx = (x - cx) / (23 + seed * 10),
              dy = (y - cy) / (13 + seed * 4);
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1.4) continue;
            const width = Math.pow(Math.max(0, 1 - dx * dx), 0.65),
              edge = Math.abs(dy) / Math.max(0.03, width);
            const mask = (1 - smooth(edge, 0.73, 1.06)) * (1 - smooth(Math.abs(dx), 0.86, 1));
            const shaft = Math.exp(-dy * dy * 110) * (1 - smooth(Math.abs(dx), 0.65, 0.97));
            const tip = smooth(-dx, 0.1, 0.85),
              shoulder = smooth(edge, 0.55, 0.94);
            const barbs = Math.sin(dx * 49 + Math.abs(dy) * 29 + seed * 4);
            const featherTone =
              164 +
              seed * 33 +
              tip * 34 +
              shoulder * 13 -
              shaft * (30 + seed * 30) +
              barbs * 9 +
              (n - 0.5) * 30;
            tone = T.MathUtils.lerp(tone, featherTone, mask * 0.89);
            height = Math.max(
              height,
              mask * (0.12 + tip * 0.14) * (1 - edge * 0.6) + shaft * 0.06 + barbs * mask * 0.018,
            );
          }
      } else if (kind === 'flight') {
        const u = x / size,
          t = y / size,
          d = u - 0.49;
        const shaft = Math.exp(-Math.pow(d / 0.023, 2));
        const barbs = Math.sin(t * 260 + Math.abs(d) * 108 + (noise(x, y, 64) - 0.5) * 2);
        const band = Math.pow(
          Math.max(0, Math.sin(t * 34 + phase * 1.2 + Math.abs(d) * 5 + noise(x, y, 128) * 1.2)),
          7,
        );
        const pale = Math.exp(
          -Math.pow((t - 0.67 - phase * 0.032 + Math.abs(d) * 0.14) / 0.035, 2),
        );
        const fringe = smooth(Math.abs(d), 0.35, 0.5);
        tone =
          148 +
          n * 32 -
          band * (25 + Math.abs(d) * 18) +
          pale * 46 +
          shaft * 37 +
          fringe * 17 +
          barbs * 22;
        height = shaft * 0.4 + barbs * 0.08 + fringe * 0.06;
      } else {
        const warp = (noise(x, y * 0.6, 128) - 0.5) * 60,
          fibre = noise(x + warp, y * 0.18, 32),
          crack = Math.pow(1 - noise(x + warp, y * 0.14, 16), 4);
        const crossBreak = smooth(noise(x * 0.7, y * 1.4, 64), 0.33, 0.7);
        const knot = Math.exp(-Math.pow((x - 345) / 70, 2) - Math.pow((y - 430) / 145, 2));
        tone = 131 + fibre * 75 + n * 30 - crack * 95 * crossBreak - knot * 20;
        height = fibre * 0.35 - crack * 0.6 * crossBreak + knot * 0.08;
      }
      const i = y * size + x;
      heights[i] = height;
      const warm = kind === 'bark' ? 0.91 : kind === 'flight' ? 0.975 : 1;
      pigment.set(
        [
          clamp(tone, 0, 255),
          clamp(tone * warm, 0, 255),
          clamp(tone * (kind === 'bark' ? 0.79 : 0.94), 0, 255),
          255,
        ],
        i * 4,
      );
    }
  const at = (x: number, y: number) => heights[wrap(y, size) * size + wrap(x, size)];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const n = new T.Vector3(
        (at(x - 1, y) - at(x + 1, y)) * 3,
        (at(x, y - 1) - at(x, y + 1)) * 3,
        1,
      ).normalize();
      normals.set([128 + n.x * 127, 128 - n.y * 127, n.z * 255, 255], (y * size + x) * 4);
    }
  const texture = (bytes: Uint8Array) => {
    const map = new T.DataTexture(bytes, size, size);
    map.wrapS = map.wrapT = T.RepeatWrapping;
    map.magFilter = T.LinearFilter;
    map.minFilter = T.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.needsUpdate = true;
    return map;
  };
  const map = texture(pigment);
  map.colorSpace = T.SRGBColorSpace;
  const strength = kind === 'bark' ? 0.9 : kind === 'body' ? 0.48 : 0.8;
  return new T.MeshStandardMaterial({
    color,
    roughness: kind === 'bark' ? 0.96 : 0.84,
    metalness: 0,
    map,
    normalMap: texture(normals),
    normalScale: new T.Vector2(strength, -strength),
    vertexColors: kind === 'body',
  });
}

function mesh(parent: T.Object3D, geometry: T.BufferGeometry, mat: T.Material, name: string) {
  const object = new T.Mesh(geometry, mat);
  object.name = name;
  object.castShadow = true;
  object.receiveShadow = !geometry.userData.feather;
  parent.add(object);
  return object;
}
function group(parent: T.Object3D, name: string, explode?: number[]) {
  const object = new T.Group();
  object.name = name;
  if (explode) object.userData.explode = explode;
  parent.add(object);
  return object;
}
function oval(parent: T.Object3D, mat: T.Material, name: string, p: number[], s: number[]) {
  const object = mesh(parent, new T.SphereGeometry(1, 32, 20), mat, name);
  object.position.copy(v(p));
  object.scale.copy(v(s));
  return object;
}

// x / centre y / vertical radius / lateral radius / centre z.
// The low skull grows from a compressed shoulder; no independent head sphere or neck tube.
const SECTIONS = [
  [-0.94, 0.84, 0.005, 0.005, -0.025],
  [-0.76, 0.895, 0.115, 0.135, -0.022],
  [-0.48, 0.98, 0.18, 0.225, -0.015],
  [-0.15, 1.015, 0.208, 0.255, 0],
  [0.12, 1.077, 0.23, 0.229, 0.014],
  [0.34, 1.176, 0.196, 0.208, 0.035],
  [0.49, 1.245, 0.148, 0.205, 0.074],
  [0.64, 1.264, 0.139, 0.204, 0.105],
  [0.78, 1.249, 0.098, 0.152, 0.128],
  [0.825, 1.23, 0.071, 0.115, 0.135],
  [0.851, 1.223, 0.048, 0.088, 0.138],
  [0.868, 1.222, 0.027, 0.068, 0.14],
  [0.885, 1.222, 0.002, 0.002, 0.142],
];
const centre = new T.CatmullRomCurve3(SECTIONS.map((s) => new T.Vector3(s[0], s[1], s[4])));
const radius = new T.CatmullRomCurve3(SECTIONS.map((s) => new T.Vector3(s[2], s[3], 0)));
function skinPoint(t: number, angle: number) {
  const c = centre.getPoint(clamp(t, 0, 1)),
    r = radius.getPoint(clamp(t, 0, 1));
  const p = c.clone().add(new T.Vector3(0, Math.cos(angle) * r.x, Math.sin(angle) * r.y));
  // Broad orbital depression and a low hood are authored into the skin, rather than attached tubes.
  for (const side of [-1, 1]) {
    const d = ((p.x - 0.713) / 0.093) ** 2 + ((p.y - 1.288) / 0.065) ** 2;
    const hood = ((p.x - 0.694) / 0.085) ** 2 + ((p.y - 1.326) / 0.029) ** 2;
    if ((p.z - c.z) * side > 0)
      p.z +=
        side *
        smooth(Math.abs(Math.sin(angle)), 0.3, 0.68) *
        (-0.016 * Math.exp(-d * 1.5) + 0.006 * Math.exp(-hood));
  }
  p.x -= 0.14 * smooth(p.x, 0.23, 0.57);
  p.y -= 0.025 * smooth(p.x, 0.31, 0.46);
  return p;
}
function anatomy() {
  const positions: number[] = [],
    normals: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const weights: number[] = [],
    joints: number[] = [],
    colors: number[] = [];
  const rings = 136,
    sides = 80;
  const back = new T.Color('#676961'),
    breast = new T.Color('#9b9c8e'),
    throat = new T.Color('#e4dfc9');
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2,
        p = skinPoint(t, a);
      const along = skinPoint(t + 0.0002, a).sub(skinPoint(t - 0.0002, a));
      const around = skinPoint(t, a + 0.0002).sub(skinPoint(t, a - 0.0002));
      const n = around.cross(along).normalize();
      positions.push(...p.toArray());
      normals.push(...n.toArray());
      uvs.push((p.x + 1) * 0.75 + smooth(p.x, 0.38, 0.69) * 0.32, j / sides);
      const neck = smooth(p.x, 0.3, 0.53);
      joints.push(0, 1, 0, 0);
      weights.push(1 - neck, neck, 0, 0);
      const underside = smooth(-Math.cos(a), -0.25, 0.8);
      const c = back.clone().lerp(breast, underside * 0.75);
      c.lerp(throat, Math.exp(-(((p.x - 0.3) / 0.185) ** 2)) * underside * 0.94);
      const faceRegion =
        Math.exp(-(((p.x - 0.57) / 0.15) ** 2)) * smooth(Math.abs(Math.sin(a)), 0.42, 0.88);
      const eyeMask = faceRegion * Math.exp(-(((p.y - 1.26) / 0.043) ** 2));
      const moustache = faceRegion * Math.exp(-(((p.y - 1.205) / 0.018) ** 2));
      c.lerp(new T.Color('#3c413b'), eyeMask * 0.69);
      c.lerp(new T.Color('#e1d8bc'), moustache * 0.8);
      colors.push(...c.toArray());
      if (i < rings && j < sides) {
        const q = i * (sides + 1) + j;
        indices.push(q, q + 1, q + sides + 1, q + 1, q + sides + 2, q + sides + 1);
      }
    }
  }
  // Tiny end radii cap inside the feather and bill roots.
  for (const end of [0, rings]) {
    const index = positions.length / 3,
      c = skinPoint(end / rings, 0)
        .add(skinPoint(end / rings, Math.PI))
        .multiplyScalar(0.5);
    positions.push(...c.toArray());
    normals.push(end ? 1 : -1, 0, 0);
    uvs.push(0.5, 0.5);
    joints.push(0, 1, 0, 0);
    weights.push(end ? 0 : 1, end ? 1 : 0, 0, 0);
    colors.push(...back.toArray());
    for (let j = 0; j < sides; j++) {
      const q = end * (sides + 1) + j;
      indices.push(...(end ? [index, q, q + 1] : [index, q + 1, q]));
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  geometry.setIndex(indices);
  return geometry;
}

/** A thin closed vane. Width is unequal across the shaft and taper is continuous. */
function vane(points: number[][], width: number, normal: T.Vector3, asymmetry = 0.7) {
  const curve = new T.CatmullRomCurve3(points.map(v));
  const positions: number[] = [],
    indices: number[] = [],
    uvs: number[] = [];
  const rows = 36,
    columns = 8;
  for (const face of [1, -1])
    for (let i = 0; i <= rows; i++) {
      const t = i / rows,
        p = curve.getPoint(t),
        tangent = curve.getTangent(t);
      const side = new T.Vector3().crossVectors(tangent, normal).normalize();
      const w = width * Math.sin(Math.PI * t) ** 0.58 * (1 - 0.24 * t);
      for (let j = 0; j <= columns; j++) {
        const f = (j / columns) * 2 - 1;
        const q = p.clone().addScaledVector(side, w * f * (f < 0 ? asymmetry : 1));
        q.addScaledVector(
          normal,
          (0.002 * (1 - f * f) + 0.0012 * Math.exp(-f * f * 100)) * Math.sin(Math.PI * t) +
            face * 0.0012,
        );
        positions.push(...q.toArray());
        uvs.push(j / columns, t);
      }
    }
  const faceSize = (rows + 1) * (columns + 1);
  for (let face = 0; face < 2; face++)
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < columns; j++) {
        const q = face * faceSize + i * (columns + 1) + j;
        const tri = [q, q + 1, q + columns + 1, q + 1, q + columns + 2, q + columns + 1];
        indices.push(...(face ? tri.reverse() : tri));
      }
  for (let i = 0; i < rows; i++)
    for (const j of [0, columns]) {
      const a = i * (columns + 1) + j,
        b = a + columns + 1;
      const tri = [a, b, a + faceSize, b, b + faceSize, a + faceSize];
      indices.push(...(j ? tri.reverse() : tri));
    }
  for (const i of [0, rows])
    for (let j = 0; j < columns; j++) {
      const a = i * (columns + 1) + j;
      const tri = [a, a + faceSize, a + 1, a + 1, a + faceSize, a + faceSize + 1];
      indices.push(...(i ? tri.reverse() : tri));
    }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData.feather = true;
  return geometry;
}

function weatheredBranch(
  points: number[][],
  widths: number[],
  depths: number[],
  segments: number,
  sides: number,
) {
  const geometry = loft(points, widths, depths, segments, sides);
  const position = geometry.getAttribute('position'),
    normal = geometry.getAttribute('normal'),
    uv = geometry.getAttribute('uv');
  for (let i = 0; i < position.count - 2; i++) {
    const a = uv.getX(i) * Math.PI * 2,
      t = uv.getY(i);
    const f = t * (widths.length - 1),
      j = Math.min(widths.length - 2, Math.floor(f));
    const width = T.MathUtils.lerp(widths[j], widths[j + 1], f - j);
    const relief =
      (Math.sin(a * 3 + t * 13) * 0.0027 + Math.sin(a * 17 + Math.sin(t * 9)) * 0.0012) *
      smooth(t, 0.02, 0.08) *
      (1 - smooth(t, 0.84, 1)) *
      Math.min(1, width / 0.02);
    position.setXYZ(
      i,
      position.getX(i) + normal.getX(i) * relief,
      position.getY(i) + normal.getY(i) * relief,
      position.getZ(i) + normal.getZ(i) * relief,
    );
  }
  position.needsUpdate = true;
  return geometry;
}

export function nightjar(root: T.Group): void {
  const bodyLayer = group(root, 'Nightjar_LivingPlumage', [0, 0.14, 0]);
  bodyLayer.position.y = -0.055;
  const plumage = patternedMaterial('#ffffff', 'body');
  plumage.vertexColors = true;
  const skin = new T.SkinnedMesh(anatomy(), plumage);
  skin.name = 'Nightjar_ContinuousAnatomy';
  skin.castShadow = skin.receiveShadow = true;
  bodyLayer.add(skin);
  const fixed = new T.Bone();
  fixed.name = 'Nightjar_AnchoredBody';
  const neck = new T.Bone();
  neck.name = 'Nightjar_ListeningNeck';
  neck.position.set(0.31, 1.19, 0.04);
  neck.userData.motion = 'nightjarListen';
  fixed.add(neck);
  skin.add(fixed);
  skin.bind(new T.Skeleton([fixed, neck]));
  neck.rotation.y = -0.09;
  const horn = material('#242625', 0.66),
    orbital = material('#373632', 0.94);
  const iris = material('#61503a', 0.46),
    pupil = material('#100f0e', 0.15);
  const face = group(neck, 'Nightjar_FittedFace');
  face.position.copy(neck.position).multiplyScalar(-1);
  face.position.x -= 0.14;
  face.position.y -= 0.025;
  for (const side of [-1, 1]) {
    const z = 0.119 + side * 0.171;
    oval(face, orbital, `Nightjar_OrbitalPlane_${side}`, [0.713, 1.286, z], [0.033, 0.026, 0.005]);
    oval(
      face,
      iris,
      `Nightjar_RecessedIris_${side}`,
      [0.714, 1.288, z + side * 0.006],
      [0.025, 0.019, 0.0035],
    );
    oval(
      face,
      pupil,
      `Nightjar_Pupil_${side}`,
      [0.717, 1.288, z + side * 0.01],
      [0.022, 0.018, 0.003],
    );
    for (const name of ['OrbitalPlane', 'RecessedIris', 'Pupil'])
      face.getObjectByName(`Nightjar_${name}_${side}`)!.userData.motion = 'nightjarBlink';
  }
  mesh(
    face,
    loft(
      [
        [0.836, 1.232, 0.14],
        [0.902, 1.23, 0.155],
        [0.957, 1.214, 0.164],
      ],
      [0.05, 0.026, 0.001],
      [0.025, 0.019, 0.001],
      30,
      18,
    ),
    horn,
    'Nightjar_SmallFittedBill',
  );
  // A nightjar's tiny bill sits within a much wider gape. The seam and fine
  // rictal bristles give the face a focal passage without enlarging the eye.
  for (const side of [-1, 1]) {
    mesh(
      face,
      loft(
        [
          [0.758, 1.23, 0.14 + side * 0.135],
          [0.814, 1.225, 0.14 + side * 0.108],
          [0.883, 1.216, 0.15 + side * 0.033],
          [0.943, 1.212, 0.162],
        ],
        [0.0028, 0.0024, 0.002, 0.0005],
        [0.0023, 0.002, 0.0018, 0.0005],
        30,
        8,
      ),
      horn,
      `Nightjar_Gape_${side}`,
    );
    for (let i = 0; i < 4; i++) {
      const x = 0.784 + i * 0.014,
        z = 0.14 + side * (0.123 - i * 0.012);
      mesh(
        face,
        loft(
          [
            [x, 1.231, z],
            [x + 0.01, 1.247 + i * 0.006, z + side * 0.026],
            [x + 0.001, 1.256 + i * 0.007, z + side * (0.05 - i * 0.006)],
          ],
          [0.0017, 0.001, 0.00015],
          [0.0017, 0.001, 0.00015],
          15,
          6,
        ),
        horn,
        `Nightjar_RictalBristle_${side}_${i}`,
      );
    }
  }
  const flights = [
    patternedMaterial('#8a8172', 'flight', 0),
    patternedMaterial('#aaa08b', 'flight', 1),
    patternedMaterial('#7d7468', 'flight', -1),
  ];
  const coverts = [flights[1].clone(), flights[2].clone(), flights[0].clone()];
  coverts[0].color.set('#938a78');
  coverts[1].color.set('#b9ac91');
  coverts[2].color.set('#897f70');
  for (const side of [-1, 1]) {
    const wingLayer = group(root, `Nightjar_WingLayer_${side}`, [-0.1, 0.06, side * 0.16]);
    wingLayer.position.y = -0.055;
    const wing = group(wingLayer, `Nightjar_FoldedWing_${side}`);
    wing.position.set(0.06, 1.135, side * 0.21);
    wing.userData.motion = 'nightjarWing';
    wing.userData.side = side;
    const local = (p: number[]) => v(p).sub(wing.position).toArray();
    const normal = new T.Vector3(0, 0.24, side).normalize();
    // Hidden shoulder / elbow / wrist structure under the overlapping closed vanes.
    mesh(
      wing,
      vane(
        [
          local([0.09, 1.19, side * 0.195]),
          local([-0.4, 1.01, side * 0.226]),
          local([-1.23, 0.636, side * 0.096]),
        ],
        0.122,
        normal,
      ),
      flights[0],
      `Nightjar_WingMantle_${side}`,
    );
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      mesh(
        wing,
        vane(
          [
            local([-0.24 - 0.27 * t, 1.059 - 0.066 * t, side * (0.294 + 0.014 * t)]),
            local([-0.68 - 0.14 * t, 0.912 - 0.054 * t, side * (0.267 + 0.013 * t)]),
            local([-1.285 + 0.27 * t, 0.629 + 0.066 * t, side * (0.077 + 0.107 * t)]),
          ],
          0.033 + 0.013 * t,
          normal,
        ),
        flights[i % 3],
        `Nightjar_Primary_${side}_${i}`,
      );
    }
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      mesh(
        wing,
        vane(
          [
            local([0.065 - 0.34 * t, 1.213 - 0.061 * t, side * (0.192 + 0.07 * t)]),
            local([-0.17 - 0.39 * t, 1.092 - 0.077 * t, side * (0.298 + 0.027 * t)]),
            local([-0.51 - 0.37 * t, 0.919 - 0.078 * t, side * (0.287 - 0.015 * t)]),
          ],
          0.042 + 0.014 * t,
          normal,
        ),
        flights[(i + 1) % 3],
        `Nightjar_Secondary_${side}_${i}`,
      );
    }
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      mesh(
        wing,
        vane(
          [
            local([0.07 - 0.35 * t, 1.218 - 0.027 * t, side * (0.159 + 0.049 * t)]),
            local([-0.16 - 0.33 * t, 1.133 - 0.056 * t, side * (0.27 + 0.029 * t)]),
            local([-0.45 - 0.32 * t, 1.008 - 0.043 * t, side * (0.305 - 0.017 * t)]),
          ],
          0.041 + 0.008 * Math.sin(t * Math.PI),
          normal,
        ),
        coverts[i % 3],
        `Nightjar_Scapular_${side}_${i}`,
      );
    }
  }
  const tailLayer = group(root, 'Nightjar_DescendingTailLayer', [-0.2, -0.08, -0.05]);
  tailLayer.position.y = -0.055;
  const tail = group(tailLayer, 'Nightjar_RectrixHinge');
  tail.position.set(-0.75, 0.869, -0.025);
  tail.userData.motion = 'nightjarTail';
  for (let i = 0; i < 8; i++) {
    const f = (i - 3.5) / 3.5;
    mesh(
      tail,
      vane(
        [
          [0.045, 0.007, f * 0.014],
          [-0.45, -0.175, f * 0.068],
          [-0.96 + Math.abs(f) * 0.092, -0.48 + Math.abs(f) * 0.039, f * 0.134],
        ],
        0.045,
        new T.Vector3(0, 0.7, 1).normalize(),
        0.85,
      ),
      flights[i % 3],
      `Nightjar_Rectrix_${i}`,
    );
  }
  const support = group(root, 'Nightjar_AnchoredRoost', [0, -0.16, 0]);
  const bark = patternedMaterial('#8a8b7d', 'bark');
  mesh(
    support,
    weatheredBranch(
      [
        [-0.39, 0.094, -0.06],
        [-0.36, 0.32, -0.03],
        [-0.13, 0.52, 0],
        [0.23, 0.619, 0.011],
        [0.77, 0.706, -0.013],
        [1.1, 0.826, -0.055],
      ],
      [0.079, 0.07, 0.057, 0.046, 0.032, 0.003],
      [0.072, 0.058, 0.047, 0.041, 0.027, 0.002],
      90,
      20,
    ),
    bark,
    'Nightjar_NaturalThinBranch',
  );
  mesh(
    support,
    weatheredBranch(
      [
        [-0.1, 0.52, 0],
        [-0.65, 0.464, 0.02],
        [-1.05, 0.514, 0.045],
      ],
      [0.048, 0.029, 0.001],
      [0.04, 0.025, 0.001],
      45,
      16,
    ),
    bark,
    'Nightjar_TaperedBranchFork',
  );
  // Each short tarsus ends on the actual local branch. Three front toes pass over and curl under it.
  for (const [index, x, z] of [
    [0, 0.14, 0.108],
    [1, -0.015, -0.097],
  ]) {
    const branchY = 0.58 + x * 0.17;
    mesh(
      support,
      loft(
        [
          [x - 0.028, 0.869, z],
          [x - 0.034, 0.772, z * 0.85],
          [x - 0.015, 0.705, z * 0.6],
        ],
        [0.044, 0.035, 0.019],
        [0.037, 0.029, 0.016],
        30,
        18,
      ),
      coverts[index],
      `Nightjar_TuckedFeatheredThigh_${index}`,
    );
    mesh(
      support,
      loft(
        [
          [x - 0.015, 0.72, z * 0.6],
          [x - 0.009, 0.68, z * 0.5],
          [x, branchY + 0.042, z * 0.37],
        ],
        [0.017, 0.014, 0.011],
        [0.014, 0.012, 0.009],
        30,
        14,
      ),
      horn,
      `Nightjar_ShortTarsus_${index}`,
    );
    for (let toe = 0; toe < 3; toe++) {
      const spread = (toe - 1) * 0.033,
        side = Math.sign(z);
      mesh(
        support,
        loft(
          [
            [x, branchY + 0.05, z * 0.37],
            [x + spread, branchY + 0.027, side * 0.065],
            [x + spread + 0.012, branchY - 0.01, side * 0.049],
            [x + spread + 0.006, branchY - 0.022, side * 0.012],
          ],
          [0.01, 0.008, 0.006, 0.001],
          [0.008, 0.007, 0.005, 0.001],
          28,
          10,
        ),
        horn,
        `Nightjar_WrappedToe_${index}_${toe}`,
      );
    }
    mesh(
      support,
      loft(
        [
          [x, branchY + 0.047, z * 0.35],
          [x - 0.047, branchY + 0.018, -Math.sign(z) * 0.036],
          [x - 0.046, branchY - 0.019, -Math.sign(z) * 0.018],
        ],
        [0.011, 0.008, 0.001],
        [0.009, 0.006, 0.001],
        24,
        10,
      ),
      horn,
      `Nightjar_BackToe_${index}`,
    );
  }
}

/** Fitted, restrained attention and delayed feather settling; the branch and grip stay fixed. */
export function nightjarMotionTracks(
  root: T.Group,
  times: number[],
  duration: number,
): T.KeyframeTrack[] {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((object) => {
    const motion = object.userData.motion as string | undefined;
    if (!motion?.startsWith('nightjar')) return;
    if (motion === 'nightjarBlink') {
      // A brief stylized close to a slit; all eye layers close together, keeping
      // their attachment to the head and the surrounding plumage undisturbed.
      const scales = times.flatMap((time) => {
        const close = Math.exp(-(((time - (duration * 23) / 36) / 0.065) ** 2));
        return [object.scale.x, object.scale.y * (1 - close * 0.97), object.scale.z];
      });
      scales.splice(scales.length - 3, 3, ...scales.slice(0, 3));
      tracks.push(new T.VectorKeyframeTrack(`${object.name}.scale`, times, scales));
      return;
    }

    const values: number[] = [];
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'nightjarListen') {
        e.y = Math.sin(a) ** 3 * 0.075;
        e.z = Math.sin(a * 2) * 0.012;
      }
      if (motion === 'nightjarWing') {
        e.x = (Math.sin(a * 2 - 0.2) + Math.sin(0.2)) * 0.0035 * object.userData.side;
        e.z = Math.sin(a * 2) * 0.002;
      }
      if (motion === 'nightjarTail') {
        e.y = (Math.sin(a - 0.55) + Math.sin(0.55)) * 0.016;
        e.z = (Math.sin(a * 2 - 0.6) + Math.sin(0.6)) * 0.006;
      }
      values.push(
        ...object.quaternion.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray(),
      );
    }
    values.splice(values.length - 4, 4, ...values.slice(0, 4));
    tracks.push(new T.QuaternionKeyframeTrack(`${object.name}.quaternion`, times, values));
  });
  return tracks;
}
