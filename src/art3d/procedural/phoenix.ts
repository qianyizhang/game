import * as T from 'three';
import { loft } from './newStudies';

const v = (p: number[]) => new T.Vector3(...(p as [number, number, number]));
const mix = T.MathUtils.lerp;
function mesh(parent: T.Object3D, g: T.BufferGeometry, m: T.Material, name: string) {
  const object = new T.Mesh(g, m);
  object.name = name;
  object.castShadow = object.receiveShadow = true;
  parent.add(object);
  return object;
}
function part(parent: T.Object3D, name: string, explode: number[]) {
  const group = new T.Group();
  group.name = name;
  group.userData.explode = explode;
  parent.add(group);
  return group;
}
function pivot(parent: T.Object3D, name: string, p: number[], kind: string, side = 1) {
  const group = new T.Group();
  group.name = name;
  group.position.copy(v(p));
  group.userData.motion = kind;
  group.userData.side = side;
  parent.add(group);
  return group;
}
function solid(
  parent: T.Object3D,
  name: string,
  pts: number[][],
  widths: number[],
  depths: number[],
  m: T.Material,
) {
  return mesh(parent, loft(pts, widths, depths, 48, 24), m, name);
}
function oval(parent: T.Object3D, name: string, p: number[], s: number[], m: T.Material) {
  const o = mesh(parent, new T.SphereGeometry(1, 28, 20), m, name);
  o.position.copy(v(p));
  o.scale.copy(v(s));
  return o;
}

/** Thin closed feather, with unequal vanes and a broad shoulder rather than a leaf point. */
function feather(
  parent: T.Object3D,
  name: string,
  points: number[][],
  width: number,
  m: T.Material,
  colors: string[],
  normal = new T.Vector3(0, 0, 1),
) {
  const curve = new T.CatmullRomCurve3(points.map(v));
  const rows = 36,
    cols = 8,
    stride = cols + 1,
    sheet = (rows + 1) * stride;
  const positions: number[] = [],
    uv: number[] = [],
    tint: number[] = [],
    indices: number[] = [];
  const palette = colors.map((c) => new T.Color(c));
  for (let face = 0; face < 2; face++)
    for (let i = 0; i <= rows; i++) {
      const t = i / rows,
        p = curve.getPoint(t),
        tangent = curve.getTangent(t).normalize();
      const across = new T.Vector3().crossVectors(normal, tangent).normalize();
      const out = new T.Vector3().crossVectors(tangent, across).normalize();
      const w =
        (0.62 + T.MathUtils.smoothstep(t, 0, 0.13) * 0.38) *
        (1 - T.MathUtils.smoothstep(t, 0.7, 1));
      const color = palette[0]
        .clone()
        .lerp(palette[1], T.MathUtils.smoothstep(t, 0.1, 0.65))
        .lerp(palette[2] ?? palette[1], T.MathUtils.smoothstep(t, 0.48, 0.91));
      for (let j = 0; j <= cols; j++) {
        const u = (j / cols) * 2 - 1;
        // A cupped vane catches broad light. The central ridge stays subordinate.
        const ridge = Math.pow(1 - Math.abs(u), 3) * 0.0018;
        const q = p
          .clone()
          .addScaledVector(
            across,
            u *
              width *
              w *
              (u < 0 ? 0.62 : 1) *
              (Math.abs(u) > 0.8 ? 1 - 0.035 * Math.sin(t * 81 + points[0][0] * 17) ** 14 : 1),
          )
          .addScaledVector(out, (-u * u * 0.003 + (face === 0 ? 0.0012 + ridge : -0.0012)) * w);
        positions.push(...q.toArray());
        uv.push(j / cols, t);
        tint.push(...color.toArray());
        if (i < rows && j < cols) {
          const k = face * sheet + i * stride + j;
          indices.push(
            ...(face === 0
              ? [k, k + stride, k + 1, k + 1, k + stride, k + stride + 1]
              : [k, k + 1, k + stride, k + 1, k + stride + 1, k + stride]),
          );
        }
      }
    }
  for (let i = 0; i < rows; i++)
    for (const j of [0, cols]) {
      const a = i * stride + j,
        b = a + stride;
      indices.push(a, b, a + sheet, b, b + sheet, a + sheet);
    }
  for (const row of [0, rows])
    for (let j = 0; j < cols; j++) {
      const a = row * stride + j;
      indices.push(a, a + sheet, a + 1, a + 1, a + sheet, a + sheet + 1);
    }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(tint, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  const vane = mesh(parent, g, m, name);
  vane.receiveShadow = false;
  if (/Primary|Secondary|Rectrix/.test(name)) {
    const detail: number[] = [],
      detailsUV: number[] = [],
      detailColors: number[] = [],
      detailIndices: number[] = [];
    const at = (t: number, u: number, face: number) => {
      const p = curve.getPoint(t),
        tangent = curve.getTangent(t).normalize(),
        across = new T.Vector3().crossVectors(normal, tangent).normalize(),
        out = new T.Vector3().crossVectors(tangent, across).normalize();
      const w =
        (0.62 + T.MathUtils.smoothstep(t, 0, 0.13) * 0.38) *
        (1 - T.MathUtils.smoothstep(t, 0.7, 1));
      return p
        .addScaledVector(across, u * width * w * (u < 0 ? 0.62 : 1))
        .addScaledVector(out, (-u * u * 0.003 + face * 0.0022) * w);
    };
    const strip = (
      t0: number,
      u0: number,
      t1: number,
      u1: number,
      thick: number,
      face: number,
      tone: number,
    ) => {
      const a = at(t0, u0, face),
        b = at(t1, u1, face),
        dir = b.clone().sub(a).normalize(),
        edge = new T.Vector3().crossVectors(normal, dir).normalize().multiplyScalar(thick);
      const k = detail.length / 3;
      for (const p of [
        a.clone().sub(edge),
        a.clone().add(edge),
        b.clone().sub(edge),
        b.clone().add(edge),
      ])
        detail.push(...p.toArray());
      const col = palette[0].clone().lerp(palette[1], 0.4).multiplyScalar(tone);
      for (let i = 0; i < 4; i++) {
        detailColors.push(...col.toArray());
        detailsUV.push(0.47, (t0 + t1) * 0.5);
      }
      detailIndices.push(
        ...(face > 0
          ? [k, k + 2, k + 1, k + 1, k + 2, k + 3]
          : [k, k + 1, k + 2, k + 1, k + 3, k + 2]),
      );
    };
    for (const face of [-1, 1]) {
      for (let i = 0; i < 27; i++) {
        const t = 0.04 + i * 0.032;
        strip(t, 0, t + 0.034, 0, 0.00065 * (1 - t * 0.7), face, 0.9);
      }
    }
    const dg = new T.BufferGeometry();
    dg.setAttribute('position', new T.Float32BufferAttribute(detail, 3));
    dg.setAttribute('uv', new T.Float32BufferAttribute(detailsUV, 2));
    dg.setAttribute('color', new T.Float32BufferAttribute(detailColors, 3));
    dg.setIndex(detailIndices);
    dg.computeVertexNormals();
    mesh(parent, dg, m, `${name}_FineShaft`).receiveShadow = false;
  }
  return vane;
}

const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
/** Exportable local feather texture. Fine barbs follow each vane's longitudinal UV. */
function featherMaterial(body = false) {
  const size = 512,
    color = new Uint8Array(size * size * 4),
    normals = color.slice(),
    packed = color.slice(),
    heights = new Float32Array(size * size);
  const wrap = (x: number, period: number) => ((x % period) + period) % period;
  const smooth = T.MathUtils.smoothstep;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / size,
        t = y / size;
      let tone = 208,
        height = 0;
      if (body) {
        const row = Math.floor(y / 24),
          col = Math.floor(x / 32);
        for (let r = row - 1; r <= row + 1; r++)
          for (let c = col - 1; c <= col + 1; c++) {
            const seed = hash(wrap(c, 16), wrap(r, 22));
            const cx = c * 32 + (r % 2) * 16 + (seed - 0.5) * 8;
            const cy = r * 24 + (hash(c + 41, r) - 0.5) * 7;
            const dx = (x - cx) / (18 + seed * 6),
              dy = (y - cy) / (28 + seed * 8);
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) continue;
            const edge = Math.abs(dx) / Math.max(0.04, Math.pow(1 - dy * dy, 0.65));
            const mask = (1 - smooth(edge, 0.7, 1.02)) * (1 - smooth(Math.abs(dy), 0.83, 1));
            const shaft = Math.exp(-dx * dx * 150) * (1 - smooth(Math.abs(dy), 0.5, 1));
            const barbs = Math.sin(dy * 49 + Math.abs(dx) * 19 + seed * 2);
            const tip = smooth(-dy, 0.1, 0.8);
            const f =
              184 + seed * 35 + tip * 22 + smooth(edge, 0.55, 0.95) * 16 - shaft * 32 + barbs * 11;
            tone = mix(tone, f, mask);
            height = Math.max(
              height,
              mask * (0.1 + tip * 0.1) + shaft * 0.04 + barbs * mask * 0.025,
            );
          }
      } else {
        const d = u - 0.47;
        const shaft = Math.exp(-Math.pow(d / 0.016, 2));
        const barbs = Math.sin(t * 286 + Math.abs(d) * 82 + Math.sin(t * 31) * 0.5);
        const wear = Math.sin(t * 27 + Math.abs(d) * 4) * Math.sin(t * 19 - d * 7);
        tone = 218 + barbs * 19 + shaft * 19 + wear * 8 + smooth(Math.abs(d), 0.35, 0.5) * 8;
        height = shaft * 0.18 + barbs * 0.045;
      }
      const i = (y * size + x) * 4;
      heights[y * size + x] = height;
      color.set([tone, tone - 1, tone - 3, 255], i);
      packed.set([255, 228 + hash(x, y) * 15, 255, 255], i);
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
  const texture = (data: Uint8Array) => {
    const t = new T.DataTexture(data, size, size);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.magFilter = T.LinearFilter;
    t.minFilter = T.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
  };
  const map = texture(color);
  map.colorSpace = T.SRGBColorSpace;
  const rough = texture(packed);
  return new T.MeshStandardMaterial({
    color: '#ffffff',
    vertexColors: true,
    map,
    normalMap: texture(normals),
    normalScale: new T.Vector2(body ? 0.7 : 0.6, body ? -0.7 : -0.6),
    roughness: 0.87,
    roughnessMap: rough,
    metalnessMap: rough,
    metalness: 0,
  });
}

type Section = [number, number, number, number, number];
/** One fitted surface from compressed pelvis to crown; no separate spherical head. */
function bodySurface() {
  const sections: Section[] = [
    [1.07, -0.05, -0.1, 0.013, 0.018],
    [1.19, -0.055, -0.04, 0.125, 0.145],
    [1.4, -0.035, 0.02, 0.19, 0.23],
    [1.64, -0.02, 0.07, 0.255, 0.29],
    [1.83, 0.025, 0.055, 0.24, 0.255],
    [1.99, 0.015, -0.012, 0.15, 0.18],
    [2.13, 0.025, 0.025, 0.085, 0.115],
    [2.25, 0.07, 0.16, 0.085, 0.123],
    [2.34, 0.115, 0.285, 0.112, 0.197],
    [2.425, 0.12, 0.305, 0.132, 0.197],
    [2.485, 0.107, 0.29, 0.096, 0.151],
    [2.51, 0.096, 0.27, 0.005, 0.006],
  ];
  const centers = new T.CatmullRomCurve3(sections.map(([y, x, z]) => new T.Vector3(x, y, z)));
  const radii = new T.CatmullRomCurve3(sections.map((s) => new T.Vector3(s[3], s[4], 0)));
  const rows = 112,
    sides = 64,
    positions: number[] = [],
    uv: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  const weights: number[] = [],
    bones: number[] = [];
  const dark = new T.Color('#381c20'),
    rust = new T.Color('#913b22'),
    ochre = new T.Color('#bc752e'),
    throat = new T.Color('#d99543');
  for (let i = 0; i <= rows; i++) {
    const t = i / rows,
      c = centers.getPoint(t),
      r = radii.getPoint(t);
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2,
        front = Math.sin(a);
      const x = c.x + Math.cos(a) * r.x,
        z = c.z + front * r.y;
      // The keel is broad; the orbit is a fitted recess in the cranial plane.
      const orbit = Math.exp(-(((c.y - 2.419) / 0.037) ** 2) - ((z - 0.372) / 0.067) ** 2) * 0.013;
      const p = new T.Vector3(x - Math.sign(Math.cos(a)) * orbit, c.y, z);
      positions.push(...p.toArray());
      uv.push(j / sides, t * 1.3);
      const warm = T.MathUtils.smoothstep(front, -0.4, 0.85);
      const col = dark
        .clone()
        .lerp(rust, 0.6 + warm * 0.4)
        .lerp(ochre, warm * 0.4);
      if (c.y > 1.91) col.lerp(throat, warm * 0.46 * T.MathUtils.smoothstep(c.y, 1.91, 2.33));
      // Soot-dark orbital mask and copper cheek frame the gaze; crown stays ochre.
      const face = Math.exp(-Math.pow((c.y - 2.412) / 0.047, 2) - Math.pow((z - 0.31) / 0.11, 2));
      col.lerp(new T.Color('#332327'), face * 0.79);
      const bib = Math.exp(-Math.pow((c.y - 2.12) / 0.17, 2)) * Math.max(0, front);
      col.lerp(new T.Color('#d5a052'), bib * 0.4);
      colors.push(...col.toArray());
      const neck = T.MathUtils.smoothstep(c.y, 1.92, 2.24),
        head = T.MathUtils.smoothstep(c.y, 2.23, 2.34);
      bones.push(0, 1, 2, 0);
      weights.push(1 - neck, neck * (1 - head), neck * head, 0);
      if (i < rows && j < sides) {
        const k = i * (sides + 1) + j;
        indices.push(k, k + sides + 1, k + 1, k + 1, k + sides + 1, k + sides + 2);
      }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(new Float32Array(positions.length), 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(bones, 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  g.setIndex(indices);
  g.computeVertexNormals();
  // Coincident ring ends need the same normal; no UV seam in broad highlights.
  const n = g.getAttribute('normal');
  for (let i = 0; i <= rows; i++) {
    const a = i * (sides + 1),
      b = a + sides,
      s = new T.Vector3()
        .fromBufferAttribute(n, a)
        .add(new T.Vector3().fromBufferAttribute(n, b))
        .normalize();
    n.setXYZ(a, s.x, s.y, s.z);
    n.setXYZ(b, s.x, s.y, s.z);
  }
  return g;
}

/** Low-relief plumage follows the actual fitted body, with the same deformation weights. */
function fittedPlumage(parent: T.Group, skin: T.SkinnedMesh, material: T.Material) {
  const source = skin.geometry.getAttribute('position'),
    sourceColor = skin.geometry.getAttribute('color');
  const sides = 64,
    rows = 112;
  const sample = (y: number, angle: number) => {
    let row = 0;
    while (row < rows - 1 && source.getY((row + 1) * (sides + 1)) < y) row++;
    const y0 = source.getY(row * (sides + 1)),
      y1 = source.getY((row + 1) * (sides + 1));
    const f = T.MathUtils.clamp((y - y0) / (y1 - y0), 0, 1),
      a = ((((angle / (Math.PI * 2)) % 1) + 1) % 1) * sides,
      j = Math.floor(a),
      u = a - j;
    const p = new T.Vector3(),
      c = new T.Color();
    for (const [r, wr] of [
      [row, 1 - f],
      [row + 1, f],
    ])
      for (const [col, wc] of [
        [j, 1 - u],
        [j + 1, u],
      ]) {
        const i = r * (sides + 1) + col,
          w = wr * wc;
        p.addScaledVector(new T.Vector3().fromBufferAttribute(source, i), w);
        c.r += sourceColor.getX(i) * w;
        c.g += sourceColor.getY(i) * w;
        c.b += sourceColor.getZ(i) * w;
      }
    // Color initializes white; subtract that initial state after interpolation.
    c.r -= 1;
    c.g -= 1;
    c.b -= 1;
    return { p, c };
  };
  const designs: number[][] = [];
  for (const side of [-1, 1]) {
    // Small head and neck feathering flows rearward into the breast.
    for (let row = 0; row < 4; row++)
      for (let i = 0; i < 6; i++) {
        const top = 2.47 - row * 0.095 - i * 0.007,
          angle = Math.PI / 2 + side * (0.2 + i * 0.39);
        designs.push([
          top,
          top - (0.105 + 0.02 * Math.sin(i + row)),
          angle,
          side * (0.12 + i * 0.017),
          0.16,
        ]);
      }
    // Body contour lengths, starts and flow vary by region; the keel retains gaps.
    for (let row = 0; row < 5; row++)
      for (let i = 0; i < 7; i++) {
        const top = 1.985 - row * 0.125 - i * 0.011 + 0.028 * Math.sin(i * 1.9 + row),
          angle = Math.PI / 2 + side * (0.16 + i * 0.23 + row * 0.07);
        designs.push([
          top,
          top - (0.16 + 0.025 * Math.sin(i * 0.8 + row)),
          angle,
          side * (0.16 + i * 0.023),
          0.15 + i * 0.007,
        ]);
      }
    for (let row = 0; row < 5; row++)
      for (let i = 0; i < 5; i++) {
        const top = 1.98 - row * 0.125 - i * 0.017,
          angle = Math.PI * 1.5 + side * (0.14 + i * 0.29 + row * 0.08);
        designs.push([top, top - (0.17 + 0.025 * Math.sin(i + row)), angle, side * 0.14, 0.21]);
      }
  }
  designs.forEach(([top, bottom, angle, twist, width], index) => {
    const nr = 28,
      nc = 6,
      stride = nc + 1,
      positions: number[] = [],
      colors: number[] = [],
      uv: number[] = [],
      indices: number[] = [],
      weights: number[] = [],
      joints: number[] = [];
    for (let row = 0; row <= nr; row++) {
      const t = row / nr,
        y = mix(top, bottom, t),
        taper = 1 - T.MathUtils.smoothstep(t, 0.63, 1);
      for (let col = 0; col <= nc; col++) {
        const u = (col / nc) * 2 - 1,
          a = angle + twist * t + u * width * taper;
        const { p, c } = sample(y, a);
        const relief = 0.001 + Math.sin(t * Math.PI) * (top > 2.1 ? 0.004 : 0.005) * (1 - u * u);
        p.x += Math.cos(a) * relief;
        p.z += Math.sin(a) * relief;
        positions.push(...p.toArray());
        const quiet =
          0.94 + 0.1 * Math.sin(index * 1.73) + T.MathUtils.smoothstep(t, 0.65, 1) * 0.09;
        c.multiplyScalar(quiet);
        colors.push(...c.toArray());
        uv.push(col / nc, t);
        const neck = T.MathUtils.smoothstep(y, 1.92, 2.24),
          head = T.MathUtils.smoothstep(y, 2.23, 2.34);
        joints.push(0, 1, 2, 0);
        weights.push(1 - neck, neck * (1 - head), neck * head, 0);
        if (row < nr && col < nc) {
          const k = row * stride + col;
          indices.push(k, k + 1, k + stride, k + 1, k + stride + 1, k + stride);
        }
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
    g.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
    g.setIndex(indices);
    g.computeVertexNormals();
    const plume = new T.SkinnedMesh(g, material);
    plume.name = `PhoenixFittedPlumage_${index}`;
    plume.castShadow = true;
    plume.receiveShadow = false;
    parent.add(plume);
    plume.bind(skin.skeleton, skin.bindMatrix);
  });
}

export function phoenix(root: T.Group): void {
  const plumage = featherMaterial(true);
  const vanes = featherMaterial();
  const shoulderMat = plumage.clone();
  shoulderMat.vertexColors = false;
  shoulderMat.color.set('#6b3229');
  const keratin = new T.MeshStandardMaterial({ color: '#292b2d', roughness: 0.77 });
  const talonMat = new T.MeshStandardMaterial({ color: '#67543b', roughness: 0.88 });
  const eyeDark = new T.MeshStandardMaterial({ color: '#17100b', roughness: 0.38 });
  const iris = new T.MeshStandardMaterial({
    color: '#df9b34',
    roughness: 0.35,
    emissive: '#763308',
    emissiveIntensity: 0.16,
  });
  const body = part(root, 'PhoenixLivingBody', [0, 0.08, 0.22]);
  const skin = new T.SkinnedMesh(bodySurface(), plumage);
  skin.name = 'PhoenixContinuousPlumage';
  skin.castShadow = skin.receiveShadow = true;
  body.add(skin);
  const anchor = new T.Bone();
  anchor.name = 'PhoenixPelvisAnchor';
  anchor.position.set(-0.03, 1.36, 0.02);
  const neck = new T.Bone();
  neck.name = 'PhoenixNeckRoot';
  neck.position.set(0.055, 0.59, 0.08);
  neck.userData.motion = 'phoenixNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'PhoenixHeadTurn';
  head.position.set(0.09, 0.385, 0.19);
  head.userData.motion = 'phoenixLook';
  neck.add(head);
  skin.add(anchor);
  skin.bind(new T.Skeleton([anchor, neck, head]));
  fittedPlumage(body, skin, vanes);
  const h = (p: number[]) => [p[0] - 0.08, p[1] - 2.335, p[2] - 0.21];
  // The upper bill begins inside the cere and turns downward at the tip.
  solid(
    head,
    'PhoenixHookedUpperBill',
    [
      [0.08, 2.4, 0.345],
      [0.095, 2.385, 0.45],
      [0.108, 2.345, 0.555],
      [0.11, 2.28, 0.55],
    ].map(h),
    [0.067, 0.063, 0.04, 0.002],
    [0.04, 0.044, 0.03, 0.002],
    keratin,
  );
  solid(
    head,
    'PhoenixLowerBill',
    [
      [0.08, 2.35, 0.35],
      [0.099, 2.333, 0.43],
      [0.108, 2.31, 0.505],
    ].map(h),
    [0.047, 0.042, 0.004],
    [0.02, 0.015, 0.001],
    keratin,
  );
  for (const side of [-1, 1]) {
    const x = 0.08 + side * 0.121;
    oval(head, `PhoenixOrbit_${side}`, h([x, 2.416, 0.289]), [0.004, 0.021, 0.029], eyeDark);
    oval(
      head,
      `PhoenixIris_${side}`,
      h([x + side * 0.003, 2.417, 0.299]),
      [0.004, 0.009, 0.011],
      iris,
    );
    oval(
      head,
      `PhoenixPupil_${side}`,
      h([x + side * 0.008, 2.417, 0.304]),
      [0.0025, 0.007, 0.006],
      eyeDark,
    );
    // The orbital brow is a shaped feather plane, fitted into the skull.
    feather(
      head,
      `PhoenixBrow_${side}`,
      [
        [0.08 + side * 0.08, 2.445, 0.195],
        [0.08 + side * 0.115, 2.436, 0.273],
        [0.08 + side * 0.102, 2.424, 0.344],
      ].map(h),
      0.014,
      vanes,
      ['#552623', '#c0702d', '#794322'],
      new T.Vector3(side, 0, 0),
    );
  }
  // A single backward stream of crest feathers; none rises like a paired ear.
  for (let i = 0; i < 5; i++)
    feather(
      head,
      `PhoenixCrest_${i}`,
      [
        [0.07 + (i - 2) * 0.017, 2.471, 0.065],
        [0.07 + (i - 2) * 0.028, 2.489 - i * 0.006, -0.1],
        [0.025 + (i - 2) * 0.047, 2.5 - i * 0.011, -0.36 - i * 0.042],
      ].map(h),
      0.018 + (i % 2) * 0.004,
      vanes,
      ['#9e4526', '#c28738', '#36262c'],
    );
  // A few long scapular planes grow out of the back. The central breast remains quiet.
  for (const side of [-1, 1])
    for (let i = 0; i < 4; i++)
      feather(
        body,
        `PhoenixScapular_${side}_${i}`,
        [
          [side * (0.14 + i * 0.018), 1.93, -0.08],
          [side * (0.2 + i * 0.018), 1.67, -0.12],
          [side * 0.15 - 0.03, 1.29 - i * 0.023, -0.16],
        ],
        0.05,
        vanes,
        ['#662526', '#8f4029', '#3c2226'],
      );

  for (const side of [-1, 1]) {
    const left = side < 0;
    const shoulder = [side * 0.18, 1.91, -0.015];
    const wingPart = part(root, `PhoenixWingLayers_${side}`, [side * 0.48, 0.08, -0.1]);
    const wing = pivot(wingPart, `PhoenixShoulder_${side}`, shoulder, 'phoenixWing', side);
    wing.rotation.z = left ? -0.58 : -0.23;
    wing.rotation.y = left ? 0.1 : -0.48;
    wing.scale.x = left ? 0.95 : 0.81;
    const point = (x: number, y: number, z: number) => [
      side * x - shoulder[0],
      y - shoulder[1],
      z - shoulder[2],
    ];
    const elbow = left ? [0.65, 2.22, -0.085] : [0.66, 2.02, -0.15];
    const wrist = left ? [1.09, 2.21, -0.16] : [1.12, 2.2, -0.23];
    // This broad covered muscle/tendon volume ties the shoulder, elbow and wrist.
    solid(
      wing,
      `PhoenixCoveredWingLeading_${side}`,
      [
        point(0.055, 1.85, 0.0),
        point(0.23, 2.015, -0.01),
        point(0.4, left ? 2.13 : 2.01, -0.01),
        point(...(elbow as [number, number, number])),
        point(...(wrist as [number, number, number])),
      ],
      [0.018, 0.035, 0.035, 0.024, 0.012],
      [0.016, 0.03, 0.025, 0.016, 0.008],
      shoulderMat,
    );
    // Short overlapping coverts wrap the complete upper arm, including the rear.
    // Their axes follow the bone path instead of crossing it as separate straps.
    const arm = new T.CatmullRomCurve3(
      [
        point(0.075, 1.88, 0),
        point(0.23, 2.015, -0.01),
        point(0.4, left ? 2.13 : 2.01, -0.01),
        point(...(elbow as [number, number, number])),
        point(...(wrist as [number, number, number])),
      ].map(v),
    );
    for (let ring = 0; ring < 12; ring++)
      for (let face = 0; face < 7; face++) {
        const start = ring * 0.073;
        const angle = (face * Math.PI * 2) / 7 + (ring % 2) * 0.26;
        const nr = 16,
          nc = 8,
          positions: number[] = [],
          colors: number[] = [],
          uv: number[] = [],
          indices: number[] = [];
        for (let row = 0; row <= nr; row++) {
          const t = row / nr,
            along = Math.min(0.999, start + t * 0.19);
          const tangent = arm.getTangent(along).normalize();
          const across = new T.Vector3().crossVectors(new T.Vector3(0, 0, 1), tangent).normalize();
          const taper =
            (0.78 + T.MathUtils.smoothstep(t, 0, 0.15) * 0.22) *
            (1 - T.MathUtils.smoothstep(t, 0.7, 1));
          for (let col = 0; col <= nc; col++) {
            const u = (col / nc) * 2 - 1,
              a = angle + u * 0.56 * taper;
            const normal = across
              .clone()
              .multiplyScalar(Math.cos(a))
              .add(new T.Vector3(0, 0, Math.sin(a)));
            const radius = mix(0.062, 0.027, along) + Math.sin(t * Math.PI) * 0.004 * (1 - u * u);
            const q = arm.getPoint(along).addScaledVector(normal, radius);
            positions.push(...q.toArray());
            const c = new T.Color('#783c2c').lerp(
              new T.Color('#ad6238'),
              t * 0.38 + (face % 3) * 0.055,
            );
            colors.push(...c.toArray());
            uv.push(col / nc, t);
            if (row < nr && col < nc) {
              const k = row * (nc + 1) + col;
              indices.push(k, k + 1, k + nc + 1, k + 1, k + nc + 2, k + nc + 1);
            }
          }
        }
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
        g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
        g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
        g.setIndex(indices);
        g.computeVertexNormals();
        const mantle = mesh(wing, g, vanes, `PhoenixMantle_${side}_${ring}_${face}`);
        mantle.receiveShadow = false;
      }
    // A continuous broad secondary plane comes before separated terminal primaries.
    for (let i = 0; i < 12; i++) {
      const t = (i + Math.sin(i * 1.7) * 0.12) / 11;
      const x = mix(0.2, 1.09, t),
        y = left ? 1.98 + 0.25 * Math.sin(t * Math.PI * 0.65) : 1.94 + 0.27 * t;
      const endX = x + 0.04 + 0.12 * t,
        endY = y - (0.62 - 0.1 * t + 0.066 * Math.sin(i * 0.94));
      feather(
        wing,
        `PhoenixSecondary_${side}_${i}`,
        [
          point(x, y, -0.025 - 0.12 * t),
          point(x + 0.067 + 0.025 * Math.sin(i), y - 0.29, -0.025 - 0.14 * t),
          point(endX, endY, -0.04 - 0.19 * t + 0.013 * Math.cos(i * 0.7)),
        ],
        0.067 - 0.015 * t + 0.004 * Math.sin(i * 0.8),
        vanes,
        ['#622a26', '#a8502b', '#33242b'],
      );
    }
    const wp = point(...(wrist as [number, number, number]));
    const hand = pivot(wing, `PhoenixWrist_${side}`, wp, 'phoenixWrist', side);
    const hp = (x: number, y: number, z: number) => {
      const p = point(x, y, z);
      return [p[0] - wp[0], p[1] - wp[1], p[2] - wp[2]];
    };
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const tipX = left
        ? 1.12 + 0.62 * Math.sin(t * Math.PI * 0.64)
        : 1.23 + 0.58 * Math.sin(t * Math.PI * 0.61);
      const tipY = (left ? 1.84 + 0.86 * t : 1.74 + 0.74 * t) + 0.03 * Math.sin(i * 1.6);
      const rootX = 1.02 + 0.21 * t,
        rootY = wrist[1] + 0.06 * t;
      feather(
        hand,
        `PhoenixPrimary_${side}_${i}`,
        [
          hp(rootX, rootY, wrist[2]),
          hp(mix(rootX, tipX, 0.56), mix(rootY, tipY, 0.56) - 0.018, wrist[2] - 0.045),
          hp(tipX, tipY, wrist[2] - 0.15 - 0.06 * t),
        ],
        0.083 - 0.018 * t + 0.003 * Math.sin(i),
        vanes,
        ['#7c3327', '#cb843b', '#292632'],
      );
    }
    // Fitted rows of broad coverts bridge the vane roots, without marching leaf garlands.
    for (let row = 0; row < 1; row++)
      for (let i = 0; i < 13; i++) {
        const t = i / 12,
          x = 0.19 + 0.87 * t,
          y = left ? 1.99 + 0.245 * Math.sin(t * Math.PI * 0.65) : 1.95 + 0.25 * t;
        feather(
          wing,
          `PhoenixCovert_${side}_${row}_${i}`,
          [
            point(x, y + 0.015 - row * 0.1, 0.044 - 0.12 * t),
            point(x + 0.028, y - 0.17 - row * 0.09, 0.046 - 0.12 * t),
            point(x + 0.07, y - 0.39 - row * 0.08, 0.036 - 0.12 * t),
          ],
          0.053,
          vanes,
          ['#7e3024', '#b7632c', '#6d3028'],
        );
      }
  }

  const tailPart = part(root, 'PhoenixTailLayers', [0, -0.06, -0.32]);
  const tail = pivot(tailPart, 'PhoenixTailRoot', [-0.055, 1.24, -0.13], 'phoenixTailFollow');
  // Unequal rectrices fall first, then trail to the side: no mirrored ribbon bouquet.
  const tailDesigns = [
    {
      points: [
        [-0.03, 0, -0.01],
        [-0.14, -0.49, -0.07],
        [-0.37, -0.96, 0.0],
        [-0.82, -1.045, 0.13],
        [-1.11, -0.86, 0.21],
      ],
      width: 0.039,
      colors: ['#74342b', '#a56c37', '#322b34'],
    },
    {
      points: [
        [0.0, 0.02, -0.03],
        [-0.12, -0.47, -0.14],
        [-0.35, -0.92, -0.1],
        [-0.78, -0.91, 0.05],
        [-0.91, -0.73, 0.1],
      ],
      width: 0.033,
      colors: ['#54282b', '#a05e35', '#322733'],
    },
    {
      points: [
        [0.05, 0.02, -0.035],
        [-0.04, -0.43, -0.18],
        [-0.25, -0.92, -0.22],
        [-0.58, -1.02, -0.14],
      ],
      width: 0.03,
      colors: ['#51272b', '#8d4a2e', '#2c2733'],
    },
    {
      points: [
        [0.07, 0.0, -0.04],
        [0.14, -0.48, -0.2],
        [0.41, -0.76, -0.29],
        [0.68, -0.64, -0.33],
      ],
      width: 0.032,
      colors: ['#592a2a', '#9c5c35', '#2c2834'],
    },
    {
      points: [
        [0.09, 0.025, -0.06],
        [0.13, -0.38, -0.21],
        [0.28, -0.65, -0.33],
        [0.43, -0.81, -0.31],
      ],
      width: 0.028,
      colors: ['#55292c', '#84432e', '#282531'],
    },
  ];
  tailDesigns.forEach((design, i) =>
    feather(tail, `PhoenixRectrix_${i}`, design.points, design.width, vanes, design.colors),
  );

  const support = part(root, 'PhoenixBasaltAndGrip', [0, -0.12, 0]);
  const rockBytes = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      const tone = 173 + Math.sin(x * 0.1 + Math.sin(y * 0.08)) * 19 + hash(x, y) * 21;
      rockBytes.set([tone, tone + 2, tone + 7, 255], (y * 128 + x) * 4);
    }
  const rockMap = new T.DataTexture(rockBytes, 128, 128);
  rockMap.colorSpace = T.SRGBColorSpace;
  rockMap.wrapS = rockMap.wrapT = T.RepeatWrapping;
  rockMap.needsUpdate = true;
  const basalt = new T.MeshStandardMaterial({
    color: '#77777c',
    vertexColors: true,
    flatShading: true,
    map: rockMap,
    roughness: 0.96,
  });
  // Main rock ends at .86; feet wrap its side faces instead of hovering above it.
  for (const [i, x, h, r] of [
    [0, 0, 0.75, 0.245],
    [1, -0.19, 0.47, 0.14],
    [2, 0.16, 0.33, 0.16],
    [3, -0.1, 0.24, 0.17],
  ]) {
    const g = new T.CylinderGeometry(r * 0.83, r, h, 7, 4);
    const p = g.getAttribute('position');
    for (let j = 0; j < p.count; j++) {
      const x0 = p.getX(j),
        y0 = p.getY(j),
        z0 = p.getZ(j);
      const level = Math.round((y0 / h + 0.5) * 4);
      const angle = Math.atan2(z0, x0);
      // Flat gripping summit; broken side courses and an irregular wider foot.
      const fracture = level === 4 ? 1 : 1 + 0.24 * Math.sin(angle * 3 + level * 2.3 + i);
      p.setXYZ(
        j,
        x0 * fracture + (level === 4 ? 0 : 0.035 * Math.sin(level * 2 + i)),
        y0 + (level === 0 || level === 4 ? 0 : 0.036 * Math.sin(angle * 2 + level + i)),
        z0 * fracture,
      );
    }
    const rock = g.toNonIndexed();
    g.dispose();
    rock.computeVertexNormals();
    const pos = rock.getAttribute('position'),
      colors = [];
    for (let j = 0; j < pos.count; j += 3) {
      const tone = 0.75 + hash(Math.floor(j / 3), i) * 0.45;
      const c = new T.Color('#777879').multiplyScalar(tone);
      for (let k = 0; k < 3; k++) colors.push(...c.toArray());
    }
    rock.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    const o = mesh(support, rock, basalt, `PhoenixBasalt_${i}`);
    o.position.set(x, 0.11 + h / 2, -0.06);
    o.rotation.y = 0.18 + i * 0.4;
  }

  for (const side of [-1, 1]) {
    const x = side * 0.115,
      y = side < 0 ? 0.85 : 0.83;
    solid(
      support,
      `PhoenixFeatheredThigh_${side}`,
      [
        [side * 0.07, 1.5, 0.02],
        [side * 0.1, 1.24, 0.04],
        [x, 1.06, 0.05],
      ],
      [0.025, 0.053, 0.027],
      [0.023, 0.052, 0.026],
      shoulderMat,
    );
    solid(
      support,
      `PhoenixTarsus_${side}`,
      [
        [x, 1.12, 0.03],
        [x, 1.0, 0.065],
        [x, y, 0.075],
      ],
      [0.025, 0.019, 0.024],
      [0.025, 0.018, 0.021],
      talonMat,
    );
    for (let i = 0; i < 3; i++) {
      const spread = (i - 1) * 0.049;
      solid(
        support,
        `PhoenixToe_${side}_${i}`,
        [
          [x, y, 0.064],
          [x + spread * 0.8, y - 0.014, 0.125],
          [x + spread, y - 0.065, 0.132],
          [x + spread * 0.92, y - 0.107, 0.112],
        ],
        [0.017, 0.014, 0.011, 0.002],
        [0.013, 0.012, 0.009, 0.002],
        talonMat,
      );
      solid(
        support,
        `PhoenixClaw_${side}_${i}`,
        [
          [x + spread, y - 0.068, 0.132],
          [x + spread * 0.94, y - 0.113, 0.112],
          [x + spread * 0.87, y - 0.126, 0.096],
        ],
        [0.01, 0.007, 0.001],
        [0.01, 0.006, 0.001],
        keratin,
      );
    }
    solid(
      support,
      `PhoenixRearToe_${side}`,
      [
        [x, y, -0.004],
        [x + side * 0.025, y - 0.035, -0.135],
        [x + side * 0.03, y - 0.095, -0.165],
      ],
      [0.016, 0.012, 0.001],
      [0.014, 0.009, 0.001],
      keratin,
    );
  }
}

/** Fitted small idle gestures. The supporting pelvis and both grips remain fixed. */
export function phoenixMotionTracks(
  root: T.Group,
  times: number[],
  duration: number,
): T.KeyframeTrack[] {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((object) => {
    const kind = object.userData.motion as string | undefined;
    if (!kind?.startsWith('phoenix')) return;
    const rest = object.quaternion.clone(),
      side = object.userData.side as number | undefined,
      values: number[] = [];
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (kind === 'phoenixNeck') {
        e.x = Math.sin(a) * 0.019;
        e.y = (Math.sin(a - 0.32) + Math.sin(0.32)) * 0.015;
      }
      if (kind === 'phoenixLook') {
        e.y = Math.sin(a) ** 3 * 0.085;
        e.x = (Math.sin(a - 0.4) + Math.sin(0.4)) * 0.015;
      }
      if (kind === 'phoenixWing') {
        e.y = (side ?? 1) * Math.sin(a) * 0.035;
        e.z = (side ?? 1) * Math.sin(a) * 0.021;
        e.x = (Math.sin(a - 0.23) + Math.sin(0.23)) * 0.015;
      }
      if (kind === 'phoenixWrist') {
        e.y = (side ?? 1) * (Math.sin(a - 0.4) + Math.sin(0.4)) * 0.02;
        e.z = (side ?? 1) * (Math.sin(a - 0.4) + Math.sin(0.4)) * 0.014;
      }
      if (kind === 'phoenixTailFollow') {
        e.y = (Math.sin(a - 0.75) + Math.sin(0.75)) * 0.028;
        e.x = (Math.sin(a - 0.9) + Math.sin(0.9)) * 0.019;
      }
      values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    values.splice(values.length - 4, 4, ...values.slice(0, 4));
    tracks.push(new T.QuaternionKeyframeTrack(`${object.name}.quaternion`, times, values));
  });
  return tracks;
}
