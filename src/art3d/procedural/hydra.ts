import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loft } from './newStudies';

const vec = (p: number[]) => new T.Vector3(...(p as [number, number, number]));
type NeckDesign = {
  points: number[][];
  yaw: number;
  pitch: number;
  roll: number;
  size: number;
  gape: number;
};
const NECK_RADII = [0.31, 0.255, 0.19, 0.151, 0.133, 0.139];

const TAIL_POINTS = [
  [0, 0.38, -0.32],
  [0.57, 0.31, -0.62],
  [0.91, 0.27, -0.33],
  [0.86, 0.23, 0.25],
  [0.35, 0.22, 0.64],
  [-0.31, 0.2, 0.68],
  [-0.91, 0.18, 0.39],
  [-1.03, 0.145, -0.18],
  [-0.79, 0.11, -0.65],
  [-0.32, 0.085, -0.86],
];

/** Smoothly joined shoulder and neck volume; the implicit union removes visible tube end planes. */
function hydraAnatomy(necks: NeckDesign[]) {
  const paths = necks.map((n) => ({
    points: n.points,
    radii: NECK_RADII,
    blend: 0.16,
  }));
  paths.push({
    points: TAIL_POINTS,
    radii: [0.33, 0.3, 0.26, 0.22, 0.18, 0.13, 0.095, 0.06, 0.033, 0.003],
    blend: 0.1,
  });
  const spines = paths.map((n) => {
    const curve = new T.CatmullRomCurve3(n.points.map(vec));
    return {
      blend: n.blend,
      points: Array.from({ length: 48 }, (_, i) => {
        const t = i / 47,
          p = curve.getPointAt(t),
          f = t * (n.radii.length - 1),
          j = Math.min(n.radii.length - 2, Math.floor(f));
        return { x: p.x, y: p.y, z: p.z, r: T.MathUtils.lerp(n.radii[j], n.radii[j + 1], f - j) };
      }),
    };
  });
  const smooth = (a: number, b: number, k: number) => {
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
  };
  const field = (x: number, y: number, z: number) => {
    let f =
      (Math.sqrt((x / 0.4) ** 2 + ((y - 0.39) / 0.23) ** 2 + ((z - 0.04) / 0.4) ** 2) - 1) * 0.3;
    for (const path of spines) {
      let d = 100;
      for (let i = 0; i < path.points.length - 1; i++) {
        const a = path.points[i],
          b = path.points[i + 1],
          dx = b.x - a.x,
          dy = b.y - a.y,
          dz = b.z - a.z;
        const t = T.MathUtils.clamp(
          ((x - a.x) * dx + (y - a.y) * dy + (z - a.z) * dz) / (dx * dx + dy * dy + dz * dz),
          0,
          1,
        );
        d = Math.min(
          d,
          Math.hypot(x - a.x - dx * t, y - a.y - dy * t, z - a.z - dz * t) -
            T.MathUtils.lerp(a.r, b.r, t),
        );
      }
      f = smooth(f, d, path.blend);
    }
    return f;
  };
  const step = 0.044,
    nx = 82,
    ny = 80,
    nz = 67,
    origin = [-1.8, -0.2, -1.4];
  const sample = (i: number, j: number, k: number) => [
    origin[0] + i * step,
    origin[1] + j * step,
    origin[2] + k * step,
  ];
  const values = new Float32Array((nx + 1) * (ny + 1) * (nz + 1));
  const key = (i: number, j: number, k: number) => (i * (ny + 1) + j) * (nz + 1) + k;
  for (let i = 0; i <= nx; i++)
    for (let j = 0; j <= ny; j++)
      for (let k = 0; k <= nz; k++) {
        const p = sample(i, j, k);
        values[key(i, j, k)] = field(p[0], p[1], p[2]);
      }
  const offsets = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1],
  ];
  const tetra = [
    [0, 5, 1, 6],
    [0, 1, 2, 6],
    [0, 2, 3, 6],
    [0, 3, 7, 6],
    [0, 7, 4, 6],
    [0, 4, 5, 6],
  ];
  const vertices: number[] = [],
    indices: number[] = [],
    cache = new Map<string, number>();
  const vertex = (p: T.Vector3) => {
    const k = p
      .toArray()
      .map((n) => Math.round(n * 1e6))
      .join(',');
    let index = cache.get(k);
    if (index === undefined) {
      index = vertices.length / 3;
      vertices.push(...p.toArray());
      cache.set(k, index);
    }
    return index;
  };
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++)
      for (let k = 0; k < nz; k++) {
        const v = offsets.map(([a, b, c]) => values[key(i + a, j + b, k + c)]);
        if (v.every((f) => f < 0) || v.every((f) => f >= 0)) continue;
        const positions = offsets.map(([a, b, c]) => vec(sample(i + a, j + b, k + c)));
        for (const tet of tetra) {
          const crossing: T.Vector3[] = [];
          for (let a = 0; a < 4; a++)
            for (let b = a + 1; b < 4; b++) {
              const u = tet[a],
                w = tet[b];
              if (v[u] < 0 === v[w] < 0) continue;
              crossing.push(positions[u].clone().lerp(positions[w], v[u] / (v[u] - v[w])));
            }
          if (crossing.length < 3) continue;
          const center = crossing
              .reduce((a, p) => a.add(p), new T.Vector3())
              .multiplyScalar(1 / crossing.length),
            e = 0.001;
          const normal = new T.Vector3(
            field(center.x + e, center.y, center.z) - field(center.x - e, center.y, center.z),
            field(center.x, center.y + e, center.z) - field(center.x, center.y - e, center.z),
            field(center.x, center.y, center.z + e) - field(center.x, center.y, center.z - e),
          ).normalize();
          const u = crossing[0].clone().sub(center).normalize(),
            w = new T.Vector3().crossVectors(normal, u);
          crossing.sort(
            (a, b) =>
              Math.atan2(a.clone().sub(center).dot(w), a.clone().sub(center).dot(u)) -
              Math.atan2(b.clone().sub(center).dot(w), b.clone().sub(center).dot(u)),
          );
          for (let t = 1; t < crossing.length - 1; t++)
            indices.push(vertex(crossing[0]), vertex(crossing[t]), vertex(crossing[t + 1]));
        }
      }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  const normals: number[] = [];
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i],
      y = vertices[i + 1],
      z = vertices[i + 2],
      e = 0.002;
    const n = new T.Vector3(
      field(x + e, y, z) - field(x - e, y, z),
      field(x, y + e, z) - field(x, y - e, z),
      field(x, y, z + e) - field(x, y, z - e),
    ).normalize();
    normals.push(...n.toArray());
  }
  g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  const uvs: number[] = [];
  for (let i = 0; i < vertices.length; i += 3)
    uvs.push(vertices[i] * 0.5 + 0.5, vertices[i + 1] * 0.45 + vertices[i + 2] * 0.2);
  g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  return g;
}

const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
function texture(bytes: Uint8Array, size: number) {
  const map = new T.DataTexture(bytes, size, size);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.magFilter = T.LinearFilter;
  map.minFilter = T.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.needsUpdate = true;
  return map;
}
/** Small overlapping keratin scales: pigment, relief and roughness use one height field. */
function skinMaterial() {
  const size = 512,
    pigment = new Uint8Array(size * size * 4),
    normal = pigment.slice(),
    packed = pigment.slice();
  const height = (x: number, y: number) => {
    x = (x + size) % size;
    y = (y + size) % size;
    const row = Math.floor(y / 16),
      u = ((x + (row % 2) * 8) % 16) / 16,
      v = (y % 16) / 16;
    const outline = Math.abs(u - 0.5) * 1.65 + Math.abs(v - 0.42) * 0.91;
    return (1 - T.MathUtils.smoothstep(outline, 0.42, 0.65)) * (0.35 + v * 0.65);
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4,
        h = height(x, y);
      const row = Math.floor(y / 16),
        cell = Math.floor((x + (row % 2) * 8) / 16);
      const fleck = hash(cell, row),
        grain = hash(x, y);
      const tone = 204 + h * 25 + fleck * 18 + grain * 5;
      pigment.set([tone, tone + 4, tone - 4, 255], i);
      const n = new T.Vector3(
        (height(x - 1, y) - height(x + 1, y)) * 1.35,
        (height(x, y - 1) - height(x, y + 1)) * 1.35,
        1,
      ).normalize();
      normal.set([128 + n.x * 127, 128 - n.y * 127, n.z * 255, 255], i);
      packed.set([255, 180 + (1 - h) * 55 + fleck * 18, 255, 255], i);
    }
  const map = texture(pigment, size),
    rough = texture(packed, size);
  map.colorSpace = T.SRGBColorSpace;
  return new T.MeshStandardMaterial({
    color: '#ffffff',
    vertexColors: true,
    map,
    normalMap: texture(normal, size),
    // glTF's tangent convention needs negative Y for geometry without tangents.
    // Bake the green-channel inversion locally so live shading is unchanged and
    // GLTFExporter can embed the DataTexture without its canvas conversion path.
    normalScale: new T.Vector2(0.48, -0.48),
    roughnessMap: rough,
    metalnessMap: rough,
    metalness: 0,
    roughness: 0.78,
  });
}
function add(parent: T.Object3D, geo: T.BufferGeometry, mat: T.Material, name: string) {
  const mesh = new T.Mesh(geo, mat);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function oval(parent: T.Object3D, mat: T.Material, name: string, p: number[], s: number[]) {
  const mesh = add(parent, new T.SphereGeometry(1, 32, 20), mat, name);
  mesh.position.copy(vec(p));
  mesh.scale.copy(vec(s));
  return mesh;
}
function tint(geo: T.BufferGeometry, sample: (p: T.Vector3) => T.Color) {
  const p = geo.getAttribute('position'),
    colors: number[] = [],
    point = new T.Vector3();
  for (let i = 0; i < p.count; i++)
    colors.push(...sample(point.fromBufferAttribute(p, i)).toArray());
  geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  return geo;
}
function uniformTint(geo: T.BufferGeometry, color: string) {
  const c = new T.Color(color);
  return tint(geo, () => c);
}
function batch(geometries: T.BufferGeometry[]) {
  const merged = mergeGeometries(geometries);
  geometries.forEach((g) => g.dispose());
  return merged;
}

/** Closed sculpted sections; broad cranial planes, recessed orbits and a narrow nasal bridge. */
function skull(sections: number[][], sculpt = false) {
  const center = new T.CatmullRomCurve3(sections.map((s) => new T.Vector3(0, s[1], s[0])));
  const radius = new T.CatmullRomCurve3(sections.map((s) => new T.Vector3(s[2], s[3], 0)));
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  const rows = 88,
    sides = 64;
  for (let i = 0; i <= rows; i++) {
    const t = i / rows,
      c = center.getPoint(t),
      r = radius.getPoint(t);
    for (let j = 0; j <= sides; j++) {
      const angle = (j / sides) * Math.PI * 2,
        cos = Math.cos(angle),
        sin = Math.sin(angle);
      let x = Math.sign(cos) * Math.pow(Math.abs(cos), 0.8) * Math.max(0.0001, r.x);
      let y = c.y + Math.sign(sin) * Math.pow(Math.abs(sin), 0.7) * Math.max(0.0001, r.y);
      if (sculpt) {
        const orbit = Math.exp(-(((c.z - 0.16) / 0.095) ** 2));
        const side = Math.abs(cos) ** 8;
        x *= 1 - orbit * side * Math.exp(-(((sin - 0.17) / 0.29) ** 2)) * 0.15;
        y += orbit * Math.exp(-(((Math.abs(cos) - 0.86) / 0.15) ** 2)) * Math.max(0, sin) * 0.09;
        y += Math.max(0, sin) ** 14 * Math.exp(-(((c.z - 0.36) / 0.33) ** 2)) * 0.036;
        y += Math.sin(c.z * 39 + Math.abs(x) * 13) * 0.003 * Math.max(0, sin);
      }
      positions.push(x, y, c.z);
      uv.push((j / sides) * 0.63, t * 0.55);
      if (i < rows && j < sides) {
        const n = i * (sides + 1) + j;
        indices.push(n, n + 1, n + sides + 1, n + 1, n + sides + 2, n + sides + 1);
      }
    }
  }
  for (const end of [0, rows]) {
    const n = positions.length / 3;
    positions.push(...center.getPoint(end / rows).toArray());
    uv.push(0.5, 0.5);
    for (let j = 0; j < sides; j++) {
      const k = end * (sides + 1) + j;
      indices.push(...(end === 0 ? [n, k + 1, k] : [n, k, k + 1]));
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Horn growth rings run around its taper; the tip wears pale instead of reflecting like metal. */
function horn(points: number[][], radii: number[], depth = 0.76) {
  const geo = loft(
    points,
    radii,
    radii.map((r) => r * depth),
    48,
    16,
  );
  const p = geo.getAttribute('position'),
    uv = geo.getAttribute('uv');
  const curve = new T.CatmullRomCurve3(points.map(vec));
  const colors: number[] = [],
    root = new T.Color('#4a5040'),
    tip = new T.Color('#c4b58a');
  for (let i = 0; i < p.count; i++) {
    const t = uv.getY(i),
      c = curve.getPointAt(t),
      v = new T.Vector3().fromBufferAttribute(p, i);
    const ridge = 1 + Math.sin(t * 95) * 0.042 * (1 - t);
    v.sub(c).multiplyScalar(ridge).add(c);
    p.setXYZ(i, v.x, v.y, v.z);
    colors.push(
      ...root
        .clone()
        .lerp(tip, T.MathUtils.smoothstep(t, 0.2, 0.95))
        .toArray(),
    );
  }
  geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

const DESIGNS: NeckDesign[] = [
  {
    points: [
      [-0.23, 0.46, 0.07],
      [-0.69, 0.76, 0.12],
      [-0.94, 1.1, 0.01],
      [-0.79, 1.5, -0.08],
      [-1.02, 1.69, 0.17],
      [-1.19, 1.59, 0.51],
    ],
    yaw: -0.82,
    pitch: 0.15,
    roll: -0.12,
    size: 0.9,
    gape: 0.12,
  },
  {
    points: [
      [0.1, 0.47, -0.08],
      [0.45, 0.96, -0.37],
      [0.4, 1.61, -0.46],
      [0.04, 2.15, -0.3],
      [-0.25, 2.57, -0.08],
      [-0.1, 2.82, 0.22],
    ],
    yaw: -0.23,
    pitch: -0.16,
    roll: 0.08,
    size: 1.08,
    gape: 0.37,
  },
  {
    points: [
      [0.26, 0.46, 0.16],
      [0.68, 0.76, 0.25],
      [0.86, 1.18, 0.03],
      [0.73, 1.62, -0.16],
      [0.98, 1.96, -0.03],
      [1.19, 2.04, 0.28],
    ],
    yaw: 0.86,
    pitch: 0.04,
    roll: -0.08,
    size: 0.95,
    gape: 0.2,
  },
];

export function hydra(root: T.Group) {
  const display = new T.Group();
  display.name = 'Hydra_Living';
  root.add(display);
  const skin = skinMaterial();
  const armor = skin.clone();
  armor.roughness = 0.86;
  const hornMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.58 });
  const belly = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.74 });
  const mouth = new T.MeshStandardMaterial({ color: '#442327', roughness: 0.5 });
  const gum = new T.MeshStandardMaterial({ color: '#72504a', roughness: 0.48 });
  const teeth = new T.MeshStandardMaterial({ color: '#c7b990', roughness: 0.36 });
  const recess = new T.MeshStandardMaterial({ color: '#121e19', roughness: 0.85 });
  const iris = new T.MeshStandardMaterial({
    color: '#dca344',
    emissive: '#9e510c',
    emissiveIntensity: 0.11,
    roughness: 0.24,
  });
  const pupil = new T.MeshStandardMaterial({ color: '#080c09', roughness: 0.12 });
  const anatomy = hydraAnatomy(DESIGNS);
  anatomy.computeBoundingBox();
  display.position.y = 0.105 - anatomy.boundingBox!.min.y;

  const curves = DESIGNS.map((d) => new T.CatmullRomCurve3(d.points.map(vec)));
  const rootBone = new T.Bone();
  rootBone.name = 'Hydra_Root';
  display.add(rootBone);
  const bones = [rootBone],
    chains: T.Bone[][] = [];
  const jointCount = 9;
  for (let n = 0; n < 3; n++) {
    const chain: T.Bone[] = [];
    let parent = rootBone,
      previous = new T.Vector3();
    for (let j = 0; j < jointCount; j++) {
      const bone = new T.Bone(),
        point = curves[n].getPointAt(j / (jointCount - 1));
      bone.name = `Hydra_Neck_${n}_Joint_${j}`;
      bone.position.copy(point).sub(previous);
      if (j > 1) {
        bone.userData.motion = 'hydraNeck';
        bone.userData.neck = n;
        bone.userData.joint = j;
      }
      parent.add(bone);
      bones.push(bone);
      chain.push(bone);
      parent = bone;
      previous = point;
    }
    chains.push(chain);
  }
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton(bones);
  const samples = curves.map((c) => Array.from({ length: 81 }, (_, i) => c.getPointAt(i / 80)));
  const nearest = (p: T.Vector3) => {
    let best = Infinity,
      neck = 0,
      at = 0;
    for (let n = 0; n < 3; n++)
      for (let i = 0; i <= 80; i++) {
        const d = p.distanceToSquared(samples[n][i]);
        if (d < best) {
          best = d;
          neck = n;
          at = i / 80;
        }
      }
    return { neck, at };
  };
  const skinned = (geo: T.BufferGeometry, mat: T.Material, name: string, neckHint?: number) => {
    const p = geo.getAttribute('position'),
      weights: number[] = [],
      indices: number[] = [];
    for (let i = 0; i < p.count; i++) {
      const point = new T.Vector3().fromBufferAttribute(p, i);
      let { neck, at } = nearest(point);
      if (neckHint !== undefined) {
        neck = neckHint;
        let best = Infinity;
        for (let j = 0; j <= 80; j++) {
          const d = point.distanceToSquared(samples[neck][j]);
          if (d < best) {
            best = d;
            at = j / 80;
          }
        }
      }
      const f = at * (jointCount - 1),
        j = Math.min(jointCount - 2, Math.floor(f));
      const moving = T.MathUtils.smoothstep(point.y, 0.55, 0.96);
      indices.push(0, 1 + neck * jointCount + j, 2 + neck * jointCount + j, 0);
      weights.push(1 - moving, moving * (1 - f + j), moving * (f - j), 0);
    }
    geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(indices, 4));
    geo.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
    const mesh = new T.SkinnedMesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    display.add(mesh);
    root.updateMatrixWorld(true);
    mesh.bind(skeleton);
    return mesh;
  };
  const dorsal = new T.Color('#244e48'),
    flank = new T.Color('#536a4d'),
    ventral = new T.Color('#a19b71');
  tint(anatomy, (p) => {
    const { neck, at } = nearest(p),
      c = curves[neck].getPointAt(at);
    const front = T.MathUtils.smoothstep(p.z - c.z, -0.06, 0.23);
    const value = dorsal
      .clone()
      .lerp(flank, front)
      .lerp(ventral, front ** 7 * 0.56);
    const mottle = Math.sin(p.x * 24 + Math.sin(p.y * 13) * 2) * Math.sin(p.y * 19 + p.z * 15);
    return value.multiplyScalar(0.9 + mottle * 0.11 + Math.sin(p.y * 62 + p.x * 18) * 0.024);
  });
  // Cylindrical mapping follows each anatomical curve, including the horizontal coil.
  // Projecting XY onto a coil stretches every scale at its silhouette.
  const tailCurve = new T.CatmullRomCurve3(TAIL_POINTS.map(vec));
  const surfaceCurves = [...curves, tailCurve];
  const surfaceSamples = surfaceCurves.map((c) =>
    Array.from({ length: 121 }, (_, i) => c.getPointAt(i / 120)),
  );
  const surfaceFrames = surfaceCurves.map((c) =>
    Array.from({ length: 121 }, (_, i) => {
      const tangent = c.getTangentAt(i / 120);
      const outward = (c === tailCurve ? new T.Vector3(0, 1, 0) : new T.Vector3(0, 0, 1))
        .addScaledVector(tangent, c === tailCurve ? -tangent.y : -tangent.z)
        .normalize();
      return { outward, across: new T.Vector3().crossVectors(tangent, outward).normalize() };
    }),
  );
  const lengths = surfaceCurves.map((c) => c.getLength());
  const uv = anatomy.getAttribute('uv'),
    positions = anatomy.getAttribute('position');
  for (let vertex = 0; vertex < positions.count; vertex++) {
    const p = new T.Vector3().fromBufferAttribute(positions, vertex);
    let best = Infinity,
      path = 0,
      at = 0;
    for (let n = 0; n < 4; n++)
      for (let i = 0; i <= 120; i++) {
        const distance = p.distanceToSquared(surfaceSamples[n][i]);
        if (distance < best) {
          best = distance;
          path = n;
          at = i;
        }
      }
    const offset = p.clone().sub(surfaceSamples[path][at]);
    const frame = surfaceFrames[path][at];
    const angle = Math.atan2(offset.dot(frame.across), offset.dot(frame.outward));
    const neckBlend = T.MathUtils.smoothstep(p.y, 0.7, 1.12);
    const bodyAngle = Math.atan2(p.x, p.z);
    // The fused shoulder is one volume, so use one continuous projection there.
    // Blend into each neck only after the branches have physically separated.
    let localAngle = angle;
    while (localAngle - bodyAngle > Math.PI) localAngle -= Math.PI * 2;
    while (localAngle - bodyAngle < -Math.PI) localAngle += Math.PI * 2;
    const uBody = (bodyAngle / (Math.PI * 2)) * 4;
    const uNeck = (localAngle / (Math.PI * 2)) * 2;
    uv.setXY(
      vertex,
      T.MathUtils.lerp(uBody, uNeck, neckBlend),
      T.MathUtils.lerp(p.y * 2.1, (at / 120) * lengths[path] * 1.6 + 0.84, neckBlend),
    );
    const colorAttribute = anatomy.getAttribute('color');
    const neckColor = new T.Color().setRGB(
      colorAttribute.getX(vertex),
      colorAttribute.getY(vertex),
      colorAttribute.getZ(vertex),
    );
    const facing = T.MathUtils.smoothstep(p.z, -0.15, 0.58);
    const chest = T.MathUtils.smoothstep(p.y, 0.34, 0.82);
    const bodyColor = new T.Color('#2b5145').lerp(
      new T.Color('#8d956d'),
      facing * (0.24 + chest * 0.56),
    );
    bodyColor.multiplyScalar(
      0.92 + Math.sin(p.x * 17 + p.y * 7) * Math.sin(p.z * 19 + p.y * 23) * 0.045,
    );
    bodyColor.lerp(neckColor, neckBlend);
    colorAttribute.setXYZ(vertex, bodyColor.r, bodyColor.g, bodyColor.b);
  }

  skinned(anatomy, skin, 'Hydra_Joined_Shoulder_And_Necks');
  // Low interlocking shields continue the three necks' armor onto the muscular coil.
  const tailArmor: T.BufferGeometry[] = [];
  const tailRadii = [0.33, 0.3, 0.26, 0.22, 0.18, 0.13, 0.095, 0.06, 0.033, 0.003];
  for (let row = 0; row < 48; row++) {
    const t = 0.035 + (row / 48) * 0.87,
      c = tailCurve.getPointAt(t),
      up = tailCurve.getTangentAt(t);
    const outward = new T.Vector3(0, 1, 0).addScaledVector(up, -up.y).normalize();
    const across = new T.Vector3().crossVectors(up, outward).normalize();
    const f = t * 9,
      j = Math.min(8, Math.floor(f)),
      r = T.MathUtils.lerp(tailRadii[j], tailRadii[j + 1], f - j);
    for (let col = 0; col < 5; col++) {
      const angle = (col - 2) * 0.36 + (row % 2) * 0.13;
      const radial = outward
        .clone()
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(across, Math.sin(angle));
      const side = across
        .clone()
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(outward, -Math.sin(angle));
      const width = r * 0.26,
        length = 0.06 * (1 - t * 0.65);
      const positions: number[] = [],
        indices: number[] = [],
        uv: number[] = [];
      for (let y = 0; y <= 6; y++)
        for (let x = 0; x <= 6; x++) {
          const v = y / 6,
            u = x / 3 - 1,
            w = Math.sin(v * Math.PI) ** 0.55 * width;
          const lift = Math.sin(Math.PI * v) * (1 - u * u) * 0.009 + 0.002;
          const p = c
            .clone()
            .addScaledVector(up, (v - 0.5) * length * 2)
            .addScaledVector(side, u * w)
            .addScaledVector(radial, Math.sqrt(Math.max(0, r * r - u * u * w * w)) + lift);
          positions.push(...p.toArray());
          uv.push((x / 6) * 0.027, (y / 6) * 0.032);
          if (y < 6 && x < 6) {
            const k = y * 7 + x;
            indices.push(k, k + 7, k + 1, k + 1, k + 7, k + 8);
          }
        }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      if (new T.Vector3().fromBufferAttribute(geo.getAttribute('normal'), 24).dot(radial) < 0) {
        const a = geo.index!.array;
        for (let i = 0; i < a.length; i += 3) {
          const swap = a[i + 1];
          a[i + 1] = a[i + 2];
          a[i + 2] = swap;
        }
        geo.computeVertexNormals();
      }
      uniformTint(geo, hash(row, col) > 0.85 ? '#546b4c' : '#345648');
      tailArmor.push(geo);
    }
  }
  skinned(batch(tailArmor), armor, 'Hydra_CoilArmor');

  for (let n = 0; n < 3; n++) {
    const curve = curves[n];
    const frame = (t: number) => {
      const c = curve.getPointAt(t),
        up = curve.getTangentAt(t);
      const front = new T.Vector3(0, 0, 1).addScaledVector(up, -up.z).normalize();
      const across = new T.Vector3().crossVectors(up, front).normalize();
      const f = t * (NECK_RADII.length - 1),
        j = Math.min(NECK_RADII.length - 2, Math.floor(f));
      return { c, up, front, across, r: T.MathUtils.lerp(NECK_RADII[j], NECK_RADII[j + 1], f - j) };
    };
    const plates: T.BufferGeometry[] = [];
    for (let row = 0; row < 56; row++) {
      const t = 0.2 + (row / 56) * 0.773,
        { c, up, front, across, r } = frame(t);
      const positions: number[] = [],
        indices: number[] = [];
      const half = ((curve.getLength() * 0.773) / 56) * 0.51;
      for (let y = 0; y < 5; y++)
        for (let a = 0; a <= 20; a++) {
          const angle = (a / 20 - 0.5) * 1.7 * Math.min(1, 0.35 + row * 0.1);
          const v = y / 4,
            relief = Math.sin(v * Math.PI) * 0.0035;
          const p = c
            .clone()
            .addScaledVector(across, Math.sin(angle) * (r + 0.002 + relief))
            .addScaledVector(front, Math.cos(angle) * (r + 0.002 + relief))
            .addScaledVector(up, (v * 2 - 1) * half + Math.abs(angle) * 0.014);
          positions.push(...p.toArray());
          if (y < 4 && a < 20) {
            const k = y * 21 + a;
            indices.push(k, k + 1, k + 21, k + 1, k + 22, k + 21);
          }
        }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      tint(geo, (p) =>
        new T.Color('#919274')
          .lerp(new T.Color('#647453'), Math.min(1, (Math.abs(p.x - c.x) / r) * 0.62))
          .multiplyScalar(0.81 + hash(row, n) * 0.08),
      );
      plates.push(geo);
    }
    skinned(batch(plates), belly, `Hydra_VentralScutes_${n}`, n);

    // Larger, overlapping shoulder and dorsal armor supplies broken contours; the throat stays quiet.
    const scales: T.BufferGeometry[] = [];
    for (let row = 0; row < 36; row++) {
      const t = 0.22 + (row / 36) * 0.72;
      const { c, up, front, across, r } = frame(t);
      for (let col = 0; col < 9; col++) {
        const angle = 1.02 + (col / 8) * (Math.PI * 2 - 2.04) + (row % 2) * 0.12;
        const radial = front
          .clone()
          .multiplyScalar(Math.cos(angle))
          .addScaledVector(across, Math.sin(angle));
        const sideways = across
          .clone()
          .multiplyScalar(Math.cos(angle))
          .addScaledVector(front, -Math.sin(angle));
        const len = 0.053 * (1 - t * 0.27) * (0.88 + hash(row, col) * 0.24),
          width = r * 0.205;
        const positions: number[] = [],
          indices: number[] = [],
          uvs: number[] = [];
        const rows = 6,
          sides = 6;
        for (let y = 0; y <= rows; y++)
          for (let x = 0; x <= sides; x++) {
            const v = y / rows,
              u = (x / sides) * 2 - 1,
              w = Math.sin(Math.PI * v) ** 0.55 * width;
            const lift = 0.004 + Math.sin(Math.PI * v) * (1 - u * u) * 0.011;
            const p = c
              .clone()
              .addScaledVector(up, (v - 0.55) * len * 2)
              .addScaledVector(sideways, u * w)
              .addScaledVector(radial, Math.sqrt(Math.max(0, r * r - u * u * w * w)) + lift);
            positions.push(...p.toArray());
            uvs.push((x / sides) * 0.024, (y / rows) * 0.03);
            if (y < rows && x < sides) {
              const k = y * (sides + 1) + x;
              indices.push(k, k + 1, k + sides + 1, k + 1, k + sides + 2, k + sides + 1);
            }
          }
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
        g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
        g.setIndex(indices);
        g.computeVertexNormals();
        // Radial patches use the transported frame; enforce their outward winding once at construction.
        const normals = g.getAttribute('normal');
        if (new T.Vector3().fromBufferAttribute(normals, 24).dot(radial) < 0) {
          const a = g.index!.array;
          for (let k = 0; k < a.length; k += 3) {
            const swap = a[k + 1];
            a[k + 1] = a[k + 2];
            a[k + 2] = swap;
          }
          g.computeVertexNormals();
        }
        uniformTint(g, hash(row, col + n) > 0.87 ? '#5a6c4e' : '#36574a');
        scales.push(g);
      }
    }
    skinned(batch(scales), armor, `Hydra_ImbricatedArmor_${n}`, n);
    const crests: T.BufferGeometry[] = [];
    for (let i = 0; i < 17; i++) {
      const t = 0.29 + (i / 17) * 0.68,
        { c, up, front, r } = frame(t);
      const length = 0.05 + Math.sin((i / 17) * Math.PI) * 0.16;
      const base = c.clone().addScaledVector(front, -r * 0.84);
      const tip = c
        .clone()
        .addScaledVector(front, -r - length)
        .addScaledVector(up, -length * 0.63);
      crests.push(
        horn(
          [
            base.toArray(),
            base.clone().lerp(tip, 0.55).addScaledVector(up, 0.018).toArray(),
            tip.toArray(),
          ],
          [0.034, 0.026, 0.001],
          1.4,
        ),
      );
    }
    skinned(batch(crests), hornMat, `Hydra_DorsalCrest_${n}`, n);
    const head = new T.Group();
    head.name = `Hydra_Head_${n}`;
    head.rotation.set(DESIGNS[n].pitch, DESIGNS[n].yaw, DESIGNS[n].roll);
    head.scale.set(
      DESIGNS[n].size * (n === 0 ? 0.92 : n === 2 ? 1.06 : 1),
      DESIGNS[n].size,
      DESIGNS[n].size * (n === 0 ? 1.06 : n === 2 ? 0.92 : 1),
    );
    head.userData.motion = 'hydraHead';
    head.userData.neck = n;
    chains[n].at(-1)!.add(head);
    buildHead(head, n, DESIGNS[n].gape, {
      skin,
      armor,
      hornMat,
      belly,
      mouth,
      gum,
      teeth,
      recess,
      iris,
      pupil,
    });
  }
}

type Materials = Record<
  'skin' | 'armor' | 'hornMat' | 'belly' | 'mouth' | 'gum' | 'teeth' | 'recess' | 'iris' | 'pupil',
  T.MeshStandardMaterial
>;
function buildHead(head: T.Group, n: number, gape: number, m: Materials) {
  const cranium = skull(
    [
      [-0.27, -0.01, 0.025, 0.03],
      [-0.17, 0.035, 0.163, 0.155],
      [-0.035, 0.065, 0.276, 0.184],
      [0.12, 0.048, 0.27, 0.125],
      [0.26, 0.0, 0.19, 0.084],
      [0.47, -0.018, 0.146, 0.065],
      [0.66, -0.028, 0.113, 0.055],
      [0.72, -0.037, 0.062, 0.041],
      [0.739, -0.038, 0.001, 0.003],
    ],
    true,
  );
  tint(cranium, (p) =>
    new T.Color('#2b5145')
      .lerp(new T.Color('#82906c'), T.MathUtils.smoothstep(-p.y, -0.1, 0.08))
      .multiplyScalar(0.91 + Math.sin(p.z * 52 + p.x * 17) * 0.06),
  );
  add(head, cranium, m.skin, `Hydra_Cranium_${n}`);
  add(
    head,
    skull([
      [-0.09, -0.077, 0.09, 0.018],
      [0.13, -0.074, 0.21, 0.028],
      [0.38, -0.077, 0.138, 0.018],
      [0.65, -0.07, 0.083, 0.014],
      [0.7, -0.07, 0.001, 0.003],
    ]),
    m.mouth,
    `Hydra_Palate_${n}`,
  );
  const jaw = new T.Group();
  jaw.name = `Hydra_Jaw_${n}`;
  jaw.position.set(0, -0.065, 0.015);
  jaw.rotation.x = gape;
  jaw.userData.motion = 'hydraJaw';
  jaw.userData.neck = n;
  head.add(jaw);
  const mandible = skull([
    [-0.14, 0.003, 0.06, 0.035],
    [-0.025, -0.048, 0.222, 0.064],
    [0.17, -0.064, 0.195, 0.036],
    [0.4, -0.053, 0.139, 0.025],
    [0.63, -0.039, 0.094, 0.022],
    [0.709, -0.031, 0.03, 0.02],
    [0.72, -0.029, 0.001, 0.001],
  ]);
  tint(mandible, (p) =>
    new T.Color('#677b57').lerp(new T.Color('#b5ad80'), T.MathUtils.smoothstep(-p.y, 0.035, 0.105)),
  );
  add(jaw, mandible, m.skin, `Hydra_Mandible_${n}`);
  add(
    jaw,
    skull([
      [-0.08, -0.003, 0.08, 0.025],
      [0.1, -0.022, 0.184, 0.016],
      [0.38, -0.019, 0.122, 0.014],
      [0.65, -0.017, 0.072, 0.009],
      [0.68, -0.015, 0.001, 0.001],
    ]),
    m.mouth,
    `Hydra_MouthFloor_${n}`,
  );
  add(
    jaw,
    loft(
      [
        [0, -0.012, 0.01],
        [0, -0.003, 0.23],
        [0, -0.004, 0.43],
        [0, 0.008, 0.54],
      ],
      [0.046, 0.055, 0.029, 0.007],
      [0.015, 0.015, 0.008, 0.003],
      38,
      16,
    ),
    m.gum,
    `Hydra_Tongue_${n}`,
  );
  for (const side of [-1, 1]) {
    add(
      jaw,
      loft(
        [
          [0, 0.008, 0.5],
          [side * 0.017, 0.01, 0.55],
          [side * 0.03, 0.006, 0.6],
        ],
        [0.011, 0.006, 0.0008],
        [0.003, 0.003, 0.0006],
        18,
        10,
      ),
      m.gum,
      `Hydra_Fork_${n}_${side}`,
    );
    // Hooded eyes sit in the temporal hollow, partly hidden by the slanted brow.
    oval(
      head,
      m.recess,
      `Hydra_Orbit_${n}_${side}`,
      [side * 0.242, 0.043, 0.16],
      [0.025, 0.041, 0.079],
    );
    const eye = oval(
      head,
      m.iris,
      `Hydra_Eye_${n}_${side}`,
      [side * 0.26, 0.05, 0.174],
      [0.01, 0.024, 0.042],
    );
    eye.rotation.y = side * -0.18;
    oval(
      head,
      m.pupil,
      `Hydra_Pupil_${n}_${side}`,
      [side * 0.27, 0.05, 0.18],
      [0.002, 0.023, 0.006],
    );
    const brow = loft(
      [
        [side * 0.16, 0.164, -0.018],
        [side * 0.258, 0.112, 0.082],
        [side * 0.266, 0.075, 0.19],
        [side * 0.2, 0.038, 0.285],
      ],
      [0.052, 0.054, 0.025, 0.004],
      [0.041, 0.044, 0.022, 0.003],
      40,
      16,
    );
    uniformTint(brow, '#33533d');
    add(head, brow, m.armor, `Hydra_SupraorbitalRidge_${n}_${side}`);
    // Two differently swept horn pairs and a flattened cheek blade root into the cranial planes.
    add(
      head,
      horn(
        [
          [side * 0.16, 0.17, -0.08],
          [side * 0.26, 0.3, -0.22],
          [side * 0.33, 0.42, -0.45],
          [
            side * 0.29,
            n === 0 && side === -1 ? 0.39 : 0.46,
            n === 0 && side === -1 ? -0.47 : -0.64,
          ],
        ],
        [0.089, 0.067, 0.032, n === 0 && side === -1 ? 0.019 : 0.0009],
      ),
      m.hornMat,
      `Hydra_CrownHorn_${n}_${side}`,
    );
    add(
      head,
      horn(
        [
          [side * 0.234, 0.079, -0.038],
          [side * 0.37, 0.13, -0.2],
          [side * 0.45, 0.21, -0.36],
        ],
        [0.074, 0.041, 0.001],
        0.62,
      ),
      m.hornMat,
      `Hydra_TemporalHorn_${n}_${side}`,
    );
    add(
      head,
      horn(
        [
          [side * 0.205, -0.012, -0.08],
          [side * 0.3, -0.035, -0.21],
          [side * 0.32, 0.016, -0.31],
        ],
        [0.045, 0.032, 0.001],
        0.62,
      ),
      m.hornMat,
      `Hydra_CheekSpur_${n}_${side}`,
    );
    oval(
      head,
      m.recess,
      `Hydra_Nostril_${n}_${side}`,
      [side * 0.092, 0.016, 0.624],
      [0.025, 0.01, 0.037],
    );
    const rim = loft(
      [
        [side * 0.13, 0.016, 0.58],
        [side * 0.106, 0.04, 0.62],
        [side * 0.072, 0.028, 0.653],
      ],
      [0.009, 0.015, 0.005],
      [0.007, 0.012, 0.004],
      22,
      10,
    );
    uniformTint(rim, '#718061');
    add(head, rim, m.skin, `Hydra_NasalRim_${n}_${side}`);
    const gumPath = [
      [side * 0.21, -0.064, 0.07],
      [side * 0.179, -0.079, 0.25],
      [side * 0.13, -0.073, 0.46],
      [side * 0.083, -0.067, 0.66],
    ];
    add(
      head,
      loft(gumPath, [0.015, 0.013, 0.011, 0.009], [0.012, 0.012, 0.01, 0.008], 38, 10),
      m.gum,
      `Hydra_UpperGum_${n}_${side}`,
    );
    add(
      jaw,
      loft(
        [
          [side * 0.19, -0.005, 0.08],
          [side * 0.164, -0.01, 0.26],
          [side * 0.117, -0.008, 0.46],
          [side * 0.076, -0.007, 0.65],
        ],
        [0.012, 0.013, 0.011, 0.008],
        [0.01, 0.01, 0.009, 0.008],
        38,
        10,
      ),
      m.gum,
      `Hydra_LowerGum_${n}_${side}`,
    );
    const upper: T.BufferGeometry[] = [],
      lower: T.BufferGeometry[] = [];
    for (let i = 0; i < 12; i++) {
      const t = i / 11,
        z = 0.115 + t * 0.515,
        x = side * (0.202 - 0.121 * t),
        len = (i === 2 ? 0.119 : 0.04 + Math.sin(t * Math.PI) * 0.027) * (0.9 + hash(i, n) * 0.2);
      upper.push(
        loft(
          [
            [x, -0.069, z],
            [x * 0.96, -0.078 - len * 0.58, z + 0.009],
            [x * 0.88, -0.076 - len, z + 0.028],
          ],
          [i === 2 ? 0.018 : 0.012, 0.008, 0.0006],
          [i === 2 ? 0.014 : 0.01, 0.006, 0.0006],
          18,
          10,
        ),
      );
      lower.push(
        loft(
          [
            [x * 0.91, -0.009, z + 0.018],
            [x * 0.89, len * 0.37, z + 0.018],
            [x * 0.83, len * 0.59, z + 0.027],
          ],
          [0.01, 0.005, 0.0006],
          [0.009, 0.004, 0.0006],
          16,
          10,
        ),
      );
    }
    add(head, batch(upper), m.teeth, `Hydra_UpperDentition_${n}_${side}`);
    add(jaw, batch(lower), m.teeth, `Hydra_LowerDentition_${n}_${side}`);
    // The jaw adductor fills the hinge, rather than leaving two disconnected floating wedges.
    const muscle = oval(
      head,
      m.skin,
      `Hydra_JawAdductor_${n}_${side}`,
      [side * 0.176, -0.025, -0.057],
      [0.082, 0.11, 0.125],
    );
    uniformTint(muscle.geometry, '#53644a');
    for (let i = 0; i < 5; i++) {
      const z = 0.055 + i * 0.097,
        x = side * (0.22 - i * 0.024),
        y = -0.013 - i * 0.003;
      const plate = loft(
        [
          [x * 0.86, y + 0.04, z - 0.048],
          [x, y + 0.016, z],
          [x * 0.96, y - 0.006, z + 0.065],
        ],
        [0.027, 0.037, 0.003],
        [0.012, 0.017, 0.002],
        20,
        12,
      );
      uniformTint(plate, i % 2 ? '#647657' : '#435b42');
      add(head, plate, m.armor, `Hydra_LabialPlate_${n}_${side}_${i}`);
    }
  }
  // Interlocking crown plates break the smooth forehead into directional bony planes.
  for (let i = 0; i < 6; i++) {
    const z = -0.13 + i * 0.102,
      y = 0.225 - Math.max(0, i - 1) * 0.035,
      w = 0.082 - i * 0.009;
    const plate = loft(
      [
        [0, y - 0.031, z - 0.073],
        [0, y, z],
        [0, y - 0.018, z + 0.081],
      ],
      [w * 0.28, w, w * 0.1],
      [0.005, 0.025, 0.003],
      24,
      16,
    );
    uniformTint(plate, i % 2 ? '#506c4e' : '#3c5c43');
    add(head, plate, m.armor, `Hydra_CrownPlate_${n}_${i}`);
  }
}
