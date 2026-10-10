import * as T from 'three';
import { loft } from './newStudies';
import { ellipsoid, taperedSpineField, union, sculptField, type Field } from './surfaceSculpt';

const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const smooth = T.MathUtils.smoothstep;
const HEAD = new T.Vector3(-0.88, 0.61, 0.17);
const TURN = new T.Quaternion().setFromEuler(new T.Euler(-0.06, -0.94, 0.025));
const INVERSE_TURN = TURN.clone().invert();
const FEET = [
  [-0.66, 0.18, 0.49],
  [-0.39, 0.18, -0.48],
  [0.61, 0.18, 0.46],
  [0.64, 0.18, -0.43],
];
const seeds = [
  ...[-0.69, -0.34, 0.02, 0.37, 0.7].map((u, i) => ({ u, v: 0.015 * Math.sin(i * 2), id: i })),
  ...[-1, 1].flatMap((side) =>
    [-0.53, -0.18, 0.2, 0.55].map((u, i) => ({
      u: u + (side === 1 ? 0.015 : 0),
      v: side * (0.53 + (i % 2) * 0.025),
      id: 5 + (side + 1) * 2 + i,
    })),
  ),
];
function shellCell(u: number, vv: number) {
  const r = Math.hypot(u, vv),
    theta = Math.atan2(vv, u);
  if (r > 0.965) {
    const angular = (theta / Math.PI / 2 + 1) * 22,
      part = angular - Math.floor(angular);
    return {
      edge: Math.min((r - 0.965) * 0.8, (Math.min(part, 1 - part) * Math.PI * 2 * r) / 22),
      id: 13 + (Math.floor(angular) % 22),
      u: Math.cos(((Math.floor(angular) + 0.5) / 22) * Math.PI * 2) * 0.982,
      v: Math.sin(((Math.floor(angular) + 0.5) / 22) * Math.PI * 2) * 0.982,
    };
  }
  let a = seeds[0],
    nearest = Infinity;
  for (const candidate of seeds) {
    const d = (u - candidate.u) ** 2 + (vv - candidate.v) ** 2;
    if (d < nearest) {
      nearest = d;
      a = candidate;
    }
  }
  let edge = 0.965 - r;
  for (const b of seeds)
    if (b !== a) {
      const d = (u - b.u) ** 2 + (vv - b.v) ** 2;
      edge = Math.min(edge, (d - nearest) / (2 * Math.hypot(a.u - b.u, a.v - b.v)));
    }
  return { ...a, edge };
}
function shellMaterial() {
  const size = 512,
    heights = new Float32Array(size * size),
    pixels = new Uint8Array(size * size * 4),
    normalBytes = pixels.slice(),
    packed = pixels.slice();
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = (x / (size - 1)) * 2 - 1,
        vv = (y / (size - 1)) * 2 - 1,
        r = Math.hypot(u, vv),
        cell = shellCell(u, vv);
      const radius = Math.hypot(u - cell.u, (vv - cell.v) * 1.06),
        q = radius / Math.max(0.001, radius + cell.edge);
      const variation = noiseField(u * 17, vv * 17),
        grain = hash(x, y),
        seed = hash(cell.id, 17);
      const wave = Math.sin(
        (Math.pow(q, 0.83) * (5.7 + seed * 1.4) + variation * 0.19) * Math.PI * 2,
      );
      const growth =
        Math.exp(-((wave / 0.27) ** 2)) *
        smooth(q, 0.12, 0.26) *
        (1 - smooth(q, 0.86, 0.98)) *
        (1 - smooth(r, 0.93, 0.98));
      const seam = 1 - smooth(cell.edge, 0.003, 0.014);
      const color = new T.Color('#697656')
        .lerp(new T.Color('#8b8c63'), (1 - smooth(q, 0.2, 0.85)) * 0.55 + seed * 0.1)
        .lerp(new T.Color('#a4956b'), growth * 0.12 * smooth(variation, 0.12, 0.72))
        .lerp(new T.Color('#333e2e'), seam * 0.77)
        .lerp(new T.Color('#94805b'), smooth(r, 0.97, 1) * 0.67);
      color.multiplyScalar(0.9 + variation * 0.16 + grain * 0.025);
      const rgb = color.clone().convertLinearToSRGB();
      pixels.set([rgb.r * 255, rgb.g * 255, rgb.b * 255, 255], (y * size + x) * 4);
      heights[y * size + x] = growth * 0.13 - seam * 0.2 + (variation - 0.5) * 0.024;
      packed.set([255, 228 - growth * 19 + variation * 13, 255, 255], (y * size + x) * 4);
    }
  const at = (x: number, y: number) =>
    heights[Math.max(0, Math.min(size - 1, y)) * size + Math.max(0, Math.min(size - 1, x))];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const n = new T.Vector3(
        (at(x - 1, y) - at(x + 1, y)) * 3,
        (at(x, y - 1) - at(x, y + 1)) * 3,
        1,
      ).normalize();
      normalBytes.set([128 + n.x * 127, 128 - n.y * 127, n.z * 255, 255], (y * size + x) * 4);
    }
  const tex = (bytes: Uint8Array, srgb = false) => {
    const t = new T.DataTexture(bytes, size, size);
    t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
    t.generateMipmaps = true;
    t.minFilter = T.LinearMipmapLinearFilter;
    t.magFilter = T.LinearFilter;
    if (srgb) t.colorSpace = T.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  };
  const rough = tex(packed);
  return new T.MeshStandardMaterial({
    vertexColors: true,
    map: tex(pixels, true),
    normalMap: tex(normalBytes),
    normalScale: new T.Vector2(0.42, -0.42),
    roughnessMap: rough,
    metalnessMap: rough,
    metalness: 0,
    roughness: 0.9,
  });
}
function shell(root: T.Group) {
  const rows = 92,
    cols = 224,
    sheet = (rows + 1) * (cols + 1),
    p: number[] = [],
    uv: number[] = [],
    colors: number[] = [],
    idx: number[] = [];
  for (let inside = 0; inside < 2; inside++)
    for (let row = 0; row <= rows; row++)
      for (let col = 0; col <= cols; col++) {
        const r = row / rows,
          a = (col / cols) * Math.PI * 2,
          u = r * Math.cos(a),
          z = r * Math.sin(a),
          cell = shellCell(u, z);
        const notch = smooth(-Math.cos(a), 0.7, 1) * 0.064 * smooth(r, 0.65, 1);
        const base = 0.47 + notch + Math.sin(a * 3 + 0.3) * 0.008 * r;
        const groove = (1 - smooth(cell.edge, 0.003, 0.014)) * 0.006 * smooth(r, 0.04, 0.18);
        const y = inside
          ? base - 0.045 + Math.pow(1 - r * r, 0.67) * 0.63
          : base + Math.pow(1 - r * r, 0.67) * 0.69 - groove;
        p.push(
          0.12 + Math.pow(1 - r, 1.5) * 0.065 + u * (inside ? 0.764 : 0.81),
          y,
          -0.035 + z * (inside ? 0.571 : 0.61),
        );
        uv.push((u + 1) / 2, (z + 1) / 2);
        const c = inside ? new T.Color('#5b5941') : new T.Color(0xffffff);
        colors.push(...c.toArray());
        if (row < rows && col < cols) {
          const k = inside * sheet + row * (cols + 1) + col;
          idx.push(
            ...(inside
              ? [k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2]
              : [k, k + 1, k + cols + 1, k + 1, k + cols + 2, k + cols + 1]),
          );
        }
      }
  for (let j = 0; j < cols; j++) {
    const a = rows * (cols + 1) + j;
    idx.push(a, a + 1, a + sheet, a + 1, a + sheet + 1, a + sheet);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const faceIndices = rows * cols * 6;
  g.addGroup(0, faceIndices, 0);
  g.addGroup(faceIndices, faceIndices, 1);
  g.addGroup(faceIndices * 2, cols * 6, 0);
  mesh(
    root,
    g,
    [shellMaterial(), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.94 })],
    'Tortoise_Carapace',
  );
  const plastron = undersideMaterial();
  mesh(
    root,
    mapUnderside(
      sculptField(ellipsoid([0.1, 0.315, -0.035], [0.68, 0.075, 0.525]), {
        step: 0.02,
        origin: [-0.7, 0.15, -0.6],
        cells: [85, 18, 60],
      }),
    ),
    plastron,
    'Tortoise_Plastron',
  );
  for (const side of [-1, 1]) mesh(root, bridgeGeometry(side), plastron, `Tortoise_Bridge_${side}`);
}
/** A closed sloping bridge meets the rim above and the plastron below. */
function bridgeGeometry(side: number) {
  const cols = 36,
    rows = 10,
    sheet = (cols + 1) * (rows + 1),
    p: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  for (let inside = 0; inside < 2; inside++)
    for (let row = 0; row <= rows; row++)
      for (let col = 0; col <= cols; col++) {
        const x = -0.3 + (col / cols) * 0.84,
          t = row / rows,
          q = (x - 0.12) / 0.81,
          a = side * Math.acos(q);
        const topY = 0.47 + Math.sin(a * 3 + 0.3) * 0.008 - 0.017;
        const topZ = 0.61 * Math.sqrt(1 - q * q) - 0.006;
        const lowZ = 0.517 * Math.sqrt(1 - ((x - 0.1) / 0.68) ** 2);
        p.push(
          x,
          T.MathUtils.lerp(topY, 0.326, t),
          -0.035 + side * (T.MathUtils.lerp(topZ, lowZ, t) - inside * 0.024),
        );
        uv.push(col / cols, t);
        if (row < rows && col < cols) {
          const k = inside * sheet + row * (cols + 1) + col;
          idx.push(
            ...(inside
              ? [k, k + 1, k + cols + 1, k + 1, k + cols + 2, k + cols + 1]
              : [k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2]),
          );
        }
      }
  const rim: number[] = [];
  for (let r = 0; r < rows; r++) rim.push(r * (cols + 1));
  for (let c = 0; c < cols; c++) rim.push(rows * (cols + 1) + c);
  for (let r = rows; r > 0; r--) rim.push(r * (cols + 1) + cols);
  for (let c = cols; c > 0; c--) rim.push(c);
  for (let j = 0; j < rim.length; j++) {
    const a = rim[j],
      b = rim[(j + 1) % rim.length];
    idx.push(a, a + sheet, b, b, a + sheet, b + sheet);
  }
  if (side < 0)
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  mapUnderside(g);
  return g;
}
function mapUnderside(g: T.BufferGeometry) {
  const p = g.attributes.position,
    uv: number[] = [];
  for (let i = 0; i < p.count; i++)
    uv.push((p.getX(i) - 0.1) / 1.36 + 0.5, (p.getZ(i) + 0.035) / 1.05 + 0.5);
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  return g;
}
function undersideMaterial() {
  const size = 512,
    pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = (x / (size - 1)) * 2 - 1,
        z = (y / (size - 1)) * 2 - 1;
      let edge = Math.abs(z - 0.01 * Math.sin(u * 8));
      for (const cut of [-0.7, -0.42, 0.01, 0.47, 0.77])
        edge = Math.min(edge, Math.abs(u - cut - 0.055 * Math.abs(z) ** 1.4));
      const seam = 1 - smooth(edge, 0.006, 0.021),
        tone = 232 - seam * 79 + noiseField(u * 15, z * 13) * 16 + hash(x, y) * 5;
      pixels.set([tone, tone, tone, 255], (y * size + x) * 4);
    }
  const map = new T.DataTexture(pixels, size, size);
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.ClampToEdgeWrapping;
  map.generateMipmaps = true;
  map.minFilter = T.LinearMipmapLinearFilter;
  map.magFilter = T.LinearFilter;
  map.needsUpdate = true;
  return new T.MeshStandardMaterial({ color: '#a19770', roughness: 0.94, map });
}
function shellSurface(u: number, z: number) {
  const r = Math.hypot(u, z),
    a = Math.atan2(z, u),
    cell = shellCell(u, z);
  const notch = smooth(-Math.cos(a), 0.7, 1) * 0.064 * smooth(r, 0.65, 1);
  const base = 0.47 + notch + Math.sin(a * 3 + 0.3) * 0.008 * r;
  const groove = (1 - smooth(cell.edge, 0.003, 0.014)) * 0.006 * smooth(r, 0.04, 0.18);
  return new T.Vector3(
    0.12 + Math.pow(1 - r, 1.5) * 0.065 + u * 0.81,
    base + Math.pow(1 - r * r, 0.67) * 0.69 - groove,
    -0.035 + z * 0.61,
  );
}
function shellPlants(root: T.Group) {
  const stemMaterial = new T.MeshStandardMaterial({ color: '#485d35', roughness: 0.99 });
  const leaves = [
    new T.MeshStandardMaterial({ color: '#657749', roughness: 0.93 }),
    new T.MeshStandardMaterial({ color: '#849261', roughness: 0.95 }),
  ];
  for (const [patch, uvs] of [
    [
      [0.66, 0.46],
      [0.6, 0.39],
      [0.56, 0.28],
    ],
    [
      [-0.46, -0.61],
      [-0.38, -0.53],
      [-0.27, -0.5],
    ],
  ].entries()) {
    const points = uvs.map(([u, z]) => shellSurface(u, z).add(new T.Vector3(0, 0.001, 0)));
    const curve = new T.CatmullRomCurve3(points);
    mesh(
      root,
      loft(
        points.map((p) => p.toArray()),
        [0.008, 0.005, 0.001],
        [0.006, 0.004, 0.001],
        32,
        8,
      ),
      stemMaterial,
      `Tortoise_ShellStem_${patch}`,
    );

    for (let leaf = 0; leaf < 3; leaf++) {
      const t = 0.26 + leaf * 0.29,
        base = curve.getPoint(t),
        side = leaf % 2 === 0 ? 1 : -1;
      const end = base
        .clone()
        .add(
          new T.Vector3(
            side * (0.075 + leaf * 0.017),
            0.035 + leaf * 0.008,
            (patch === 0 ? 1 : -1) * (0.055 - leaf * 0.024),
          ),
        );
      const mid = base
        .clone()
        .lerp(end, 0.5)
        .add(new T.Vector3(0, 0.022, 0));
      mesh(
        root,
        loft(
          [base.toArray(), mid.toArray(), end.toArray()],
          [0.002, 0.028 + leaf * 0.004, 0.0004],
          [0.002, 0.004, 0.0003],
          28,
          10,
        ),
        leaves[(patch + leaf) % 2],
        `Tortoise_ShellLeaf_${patch}_${leaf}`,
      );
    }
  }
}
function anatomyField(): Field {
  const shapes: [Field, number][] = [
    [ellipsoid([0.12, 0.44, -0.035], [0.65, 0.19, 0.43]), 0.08],
    [
      taperedSpineField(
        [[-0.42, 0.49, 0.025], [-0.63, 0.52, 0.095], [-0.76, 0.56, 0.14], HEAD.toArray()],
        [0.185, 0.153, 0.135, 0.125],
      ),
      0.07,
    ],
    [
      taperedSpineField(
        [
          [0.61, 0.37, -0.04],
          [0.89, 0.3, 0.02],
          [1.02, 0.24, 0.1],
        ],
        [0.078, 0.042, 0.004],
      ),
      0.035,
    ],
  ];
  const limbs = [
    [[-0.34, 0.48, 0.29], [-0.41, 0.34, 0.45], [-0.54, 0.23, 0.49], FEET[0]],
    [[-0.29, 0.46, -0.29], [-0.17, 0.33, -0.45], [-0.28, 0.23, -0.49], FEET[1]],
    [[0.45, 0.44, 0.24], [0.65, 0.3, 0.36], [0.69, 0.21, 0.44], FEET[2]],
    [[0.45, 0.43, -0.27], [0.7, 0.28, -0.37], [0.71, 0.21, -0.43], FEET[3]],
  ];
  limbs.forEach((points, i) =>
    shapes.push([
      taperedSpineField(points, i < 2 ? [0.145, 0.155, 0.137, 0.106] : [0.17, 0.14, 0.113, 0.094]),
      0.052,
    ]),
  );
  for (const [x, y, z] of FEET)
    shapes.push([ellipsoid([x - 0.013, y + 0.007, z], [0.134, 0.087, 0.12]), 0.035]);
  const skull: [Field, number][] = [
    [ellipsoid([0, 0.012, -0.028], [0.179, 0.142, 0.193]), 0.045],
    [ellipsoid([0, -0.017, 0.1], [0.137, 0.092, 0.132]), 0.034],
    [ellipsoid([0, -0.035, 0.23], [0.098, 0.071, 0.085]), 0.025],
    [ellipsoid([0, -0.082, 0.142], [0.134, 0.042, 0.154]), 0.029],
  ];
  const inv = new T.Matrix4().makeRotationFromQuaternion(INVERSE_TURN).elements;
  return (x, y, z) => {
    let f = 10;
    for (const [s, k] of shapes) f = union(f, s(x, y, z), k);
    const dx = x - HEAD.x,
      dy = y - HEAD.y,
      dz = z - HEAD.z;
    if (Math.abs(dx) < 0.55 && Math.abs(dy) < 0.3 && Math.abs(dz) < 0.55) {
      const hx = inv[0] * dx + inv[4] * dy + inv[8] * dz,
        hy = inv[1] * dx + inv[5] * dy + inv[9] * dz,
        hz = inv[2] * dx + inv[6] * dy + inv[10] * dz;
      let h = 10;
      for (const [s, k] of skull) h = union(h, s(hx, hy, hz), k);
      f = union(f, h, 0.046);
    }
    return Math.max(f, 0.105 - y);
  };
}
function skinColor(p: T.Vector3) {
  const h = p.clone().sub(HEAD).applyQuaternion(INVERSE_TURN);
  return new T.Color('#919a78')
    .lerp(new T.Color('#b0b494'), smooth(h.z, 0.01, 0.29) * 0.62)
    .lerp(new T.Color('#5f7055'), (1 - smooth(p.y, 0.17, 0.48)) * 0.45);
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
/** Fine irregular skin scales beneath the larger forelimb plates. */
function skinMaterial() {
  const size = 512,
    cols = 14,
    rows = 18,
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
    normalScale: new T.Vector2(0.58, -0.58),
    roughnessMap: rough,
    metalnessMap: rough,
    roughness: 0.88,
    metalness: 0,
  });
}
function mesh(parent: T.Object3D, g: T.BufferGeometry, m: T.Material | T.Material[], name: string) {
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
  m: T.Material,
) {
  return mesh(parent, loft(points, radii, radii, 24, 8), m, name);
}
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
  // Keep each plate's entire footprint on its supporting forelimb.
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
        const relief = height * Math.max(0, 1 - radius * radius) ** 1.5 * (1 - u * 0.14);
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
  return g;
}
export function tortoise(root: T.Group) {
  shell(root);
  const skin = skinMaterial();
  const horn = new T.MeshStandardMaterial({ color: '#a89d75', roughness: 0.87 });
  const dark = new T.MeshStandardMaterial({ color: '#313629', roughness: 0.79 });
  const anchor = new T.Bone();
  anchor.name = 'Tortoise_Anchor';
  root.add(anchor);
  const neck = new T.Bone();
  neck.name = 'Tortoise_Neck';
  neck.position.set(-0.58, 0.52, 0.075);
  neck.userData.motion = 'tortoiseNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'Tortoise_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'tortoiseHead';
  neck.add(head);
  root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([anchor, neck, head]),
    field = anatomyField();
  const g = sculptField(
    field,
    { step: 0.021, origin: [-1.3, 0.021, -0.69], cells: [119, 40, 77] },
    skinColor,
  );
  const joints: number[] = [],
    weights: number[] = [],
    p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const point = new T.Vector3().fromBufferAttribute(p, i),
      local = point.clone().sub(HEAD).applyQuaternion(INVERSE_TURN);
    const h =
        smooth(local.z, -0.25, -0.09) *
        smooth(point.y, 0.38, 0.47) *
        (1 - smooth(Math.abs(local.x), 0.19, 0.3)),
      n =
        (1 - h) *
        smooth(-point.x, 0.53, 0.82) *
        smooth(point.y, 0.27, 0.53) *
        (1 - smooth(Math.abs(point.z - 0.095), 0.12, 0.25));
    joints.push(0, 1, 2, 0);
    weights.push(1 - h - n, n, h, 0);
  }
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  const body = new T.SkinnedMesh(g, skin);
  body.name = 'Tortoise_ContinuousAnatomy';
  body.castShadow = body.receiveShadow = true;
  root.add(body);
  body.bind(skeleton);
  const placements = [
    [0.08, -0.025, 1.06],
    [0.15, 0.047, 0.8],
    [0.36, -0.048, 1.0],
    [0.42, 0.032, 0.91],
    [0.62, -0.028, 0.97],
    [0.72, 0.044, 0.72],
    [0.88, 0.002, 0.85],
  ];
  for (const side of [-1, 1])
    for (const [plate, [t, offset, size]] of placements.entries()) {
      const x = (side === 1 ? -0.6 + t * 0.18 : -0.35 + t * 0.14) + offset;
      const y = 0.235 + t * 0.175 - offset * 0.32;
      const patch = scutePatch(
        (x, h, y) => field(x, y, side * h),
        new T.Vector3(x, 0.55, y),
        0.102 * size,
        0.073 * size,
        0.76,
        0.011 + size * 0.001,
      );
      if (!patch) continue;
      const positions = patch.attributes.position,
        colors: number[] = [];
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i),
          y = positions.getZ(i),
          z = side * positions.getY(i);
        positions.setXYZ(i, x, y, z);
        colors.push(
          ...skinColor(new T.Vector3(x, y, z))
            .lerp(new T.Color('#a6a982'), 0.18)
            .toArray(),
        );
      }
      if (side === 1) {
        const indices = patch.index!;
        for (let i = 0; i < indices.count; i += 3) {
          const a = indices.getX(i + 1);
          indices.setX(i + 1, indices.getX(i + 2));
          indices.setX(i + 2, a);
        }
      }
      patch.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
      patch.computeVertexNormals();
      mesh(root, patch, skin, `Tortoise_ForelegScute_${side}_${plate}`);
    }
  shellPlants(root);
  const face = new T.Group();
  face.name = 'Tortoise_Face';
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
    const eye = new T.Group();
    eye.name = `Tortoise_Eye_${side}`;
    const ex = side * 0.139,
      ey = 0.057;
    eye.position.set(ex, ey, surfaceZ(ex, ey) - 0.011);
    eye.rotation.y = side * 0.65;
    eye.rotation.z = side * 0.11;
    eye.userData.motion = 'tortoiseBlink';
    face.add(eye);
    oval(eye, `Tortoise_Orbit_${side}`, [0, 0, 0], [0.042, 0.022, 0.022], dark);
    oval(
      eye,
      `Tortoise_Iris_${side}`,
      [0, 0, 0.014],
      [0.025, 0.015, 0.012],
      new T.MeshStandardMaterial({ color: '#a39156', roughness: 0.43 }),
    );
    oval(eye, `Tortoise_Pupil_${side}`, [0, 0, 0.023], [0.009, 0.011, 0.004], dark);
    oval(
      eye,
      `Tortoise_Glint_${side}`,
      [-0.007, 0.005, 0.025],
      [0.003, 0.003, 0.002],
      new T.MeshStandardMaterial({ color: '#d2c6a0', roughness: 0.3 }),
    );
    stroke(
      face,
      `Tortoise_Lip_${side}`,
      fitted([
        [0, -0.07, 0],
        [side * 0.065, -0.08, 0],
        [side * 0.119, -0.064, 0],
        [side * 0.146, -0.052, 0],
      ]),
      [0.0017, 0.0025, 0.002, 0.0004],
      dark,
    );
    const nx = side * 0.047,
      ny = 0.014;
    oval(
      face,
      `Tortoise_Nostril_${side}`,
      [nx, ny, surfaceZ(nx, ny) + 0.0005],
      [0.008, 0.004, 0.003],
      dark,
    );
  }
  for (let foot = 0; foot < FEET.length; foot++) {
    const [x, y, z] = FEET[foot],
      count = foot < 2 ? 5 : 4;
    for (let digit = 0; digit < count; digit++) {
      const offset = (digit - (count - 1) / 2) * 0.04,
        lead = x - 0.12 + Math.abs(offset) * 0.36;
      stroke(
        root,
        `Tortoise_Claw_${foot}_${digit}`,
        [
          [lead + 0.014, y + 0.006, z + offset],
          [lead - 0.025, y - 0.014, z + offset],
          [lead - 0.052, y - 0.043, z + offset],
        ],
        [0.02, 0.015, 0.002],
        horn,
      );
    }
  }
  root.updateMatrixWorld(true);
}
export function tortoiseMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((node) => {
    const motion = node.userData.motion as string | undefined;
    if (!motion?.startsWith('tortoise')) return;
    const values: number[] = [],
      rest = node.quaternion.clone();
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (motion === 'tortoiseNeck') {
        e.y = Math.sin(a) * 0.025;
        e.z = Math.sin(a - 0.4) * 0.009;
      }
      if (motion === 'tortoiseHead') {
        e.y = Math.sin(a - 0.4) * 0.055;
        e.x = Math.sin(a - 0.9) * 0.018;
      }
      if (motion === 'tortoiseBlink') {
        const blink = Math.max(0, 1 - Math.abs(time - 3.9) / 0.2);
        values.push(1, 1 - blink * 0.94, 1);
      } else values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    const scale = motion === 'tortoiseBlink',
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
