import * as T from 'three';
import { loft } from './newStudies';

// Thin flight vanes and exportable feather maps adapted locally from Phoenix.
// Storm Roc owns its anatomy, wing plan, fitted plumage and motion.

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
        (0.22 + T.MathUtils.smoothstep(t, 0, 0.19) * 0.78) *
        Math.sqrt(1 - T.MathUtils.smoothstep(t, 0.8, 1) ** 2);
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
      indices.push(
        ...(j === 0
          ? [a, a + sheet, b, b, a + sheet, b + sheet]
          : [a, b, a + sheet, b, b + sheet, a + sheet]),
      );
    }
  for (const row of [0, rows])
    for (let j = 0; j < cols; j++) {
      const a = row * stride + j;
      indices.push(
        ...(row === 0
          ? [a, a + 1, a + sheet, a + 1, a + sheet + 1, a + sheet]
          : [a, a + sheet, a + 1, a + 1, a + sheet, a + sheet + 1]),
      );
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
        (0.22 + T.MathUtils.smoothstep(t, 0, 0.19) * 0.78) *
        Math.sqrt(1 - T.MathUtils.smoothstep(t, 0.8, 1) ** 2);
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
    normalScale: new T.Vector2(body ? 0.42 : 0.48, body ? -0.42 : -0.48),
    roughness: 0.96,
    roughnessMap: rough,
    metalnessMap: rough,
    metalness: 0,
  });
}

const smooth = T.MathUtils.smoothstep;
const HEAD = new T.Vector3(0.12, 1.84, 0.46);
const sections = [
  [0.99, -0.07, -0.17, 0.012, 0.015],
  [1.11, -0.07, -0.17, 0.16, 0.2],
  [1.28, -0.03, -0.08, 0.245, 0.255],
  [1.5, 0, 0.06, 0.28, 0.29],
  [1.65, 0.025, 0.19, 0.19, 0.2],
  [1.76, 0.07, 0.31, 0.12, 0.13],
  [1.85, 0.12, 0.49, 0.15, 0.2],
  [1.94, 0.13, 0.54, 0.165, 0.21],
  [2.035, 0.12, 0.515, 0.13, 0.17],
  [2.07, 0.11, 0.49, 0.005, 0.006],
];
const centers = new T.CatmullRomCurve3(sections.map(([y, x, z]) => new T.Vector3(x, y, z)));
const radii = new T.CatmullRomCurve3(sections.map((s) => new T.Vector3(s[3], s[4], 0)));
function surface(t: number, a: number) {
  const c = centers.getPoint(t),
    r = radii.getPoint(t);
  const p = new T.Vector3(c.x + Math.cos(a) * r.x, c.y, c.z + Math.sin(a) * r.y);
  const orbit =
    Math.exp(-Math.pow((c.y - 1.965) / 0.031, 2) - Math.pow((p.z - 0.577) / 0.062, 2)) * 0.014;
  p.x -= Math.sign(Math.cos(a)) * orbit;
  return p;
}
function atHeight(y: number, a: number) {
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (centers.getPoint(mid).y < y) lo = mid;
    else hi = mid;
  }
  return surface((lo + hi) / 2, a);
}
function bodyColor(p: T.Vector3, a: number) {
  const front = smooth(Math.sin(a), -0.3, 0.8);
  const c = new T.Color('#233c49').lerp(new T.Color('#688a91'), front * 0.66);
  const pale = smooth(p.y, 1.6, 1.85) * (1 - smooth(p.y, 1.965, 2.02)) * front;
  c.lerp(new T.Color('#d9ddd1'), pale * 0.93);
  const orbit = Math.exp(-Math.pow((p.y - 1.966) / 0.033, 2) - Math.pow((p.z - 0.57) / 0.1, 2));
  c.lerp(new T.Color('#182e39'), orbit * 0.75);
  return c;
}
function skinWeights(y: number) {
  const neck = smooth(y, 1.56, 1.83),
    head = smooth(y, 1.78, 1.88);
  return [1 - neck, neck * (1 - head), neck * head, 0];
}
function bodySurface() {
  const rows = 112,
    sides = 64,
    positions: number[] = [],
    uv: number[] = [],
    colors: number[] = [],
    indices: number[] = [],
    weights: number[] = [],
    joints: number[] = [];
  for (let i = 0; i <= rows; i++)
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2,
        p = surface(i / rows, a);
      positions.push(...p.toArray());
      uv.push(j / sides, (i / rows) * 1.15);
      colors.push(...bodyColor(p, a).toArray());
      weights.push(...skinWeights(p.y));
      joints.push(0, 1, 2, 0);
      if (i < rows && j < sides) {
        const k = i * (sides + 1) + j;
        indices.push(k, k + sides + 1, k + 1, k + 1, k + sides + 1, k + sides + 2);
      }
    }
  for (const end of [0, rows]) {
    const p = centers.getPoint(end / rows),
      cap = positions.length / 3;
    positions.push(...p.toArray());
    uv.push(0.5, end / rows);
    colors.push(...bodyColor(p, 0).toArray());
    weights.push(...skinWeights(p.y));
    joints.push(0, 1, 2, 0);
    for (let j = 0; j < sides; j++) {
      const k = end * (sides + 1) + j;
      indices.push(...(end === 0 ? [cap, k, k + 1] : [cap, k + 1, k]));
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  g.setIndex(indices);
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let i = 0; i <= rows; i++) {
    const a = i * (sides + 1),
      b = a + sides;
    const q = new T.Vector3()
      .fromBufferAttribute(n, a)
      .add(new T.Vector3().fromBufferAttribute(n, b))
      .normalize();
    n.setXYZ(a, q.x, q.y, q.z);
    n.setXYZ(b, q.x, q.y, q.z);
  }
  return g;
}

/** A covered wing is a continuous flattened shoulder/forearm surface, not a round spar. */
function wingSurface(arm: T.CatmullRomCurve3, t: number, a: number) {
  const c = arm.getPoint(t),
    tangent = arm.getTangent(t).normalize();
  const up = new T.Vector3(0, 1, 0).addScaledVector(tangent, -tangent.y).normalize();
  const out = new T.Vector3().crossVectors(up, tangent).normalize();
  const breadth = 0.14 * (1 - t) + 0.033,
    thickness = 0.075 * (1 - t) + 0.022;
  return c
    .addScaledVector(up, (Math.cos(a) - 0.6) * breadth)
    .addScaledVector(out, Math.sin(a) * thickness);
}
function wingEnvelope(arm: T.CatmullRomCurve3, s: T.Vector3) {
  const rows = 72,
    cols = 40,
    p: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  for (let i = 0; i <= rows; i++)
    for (let j = 0; j <= cols; j++) {
      p.push(
        ...wingSurface(arm, i / rows, (j / cols) * Math.PI * 2)
          .sub(s)
          .toArray(),
      );
      uv.push(j / cols, i / rows);
      if (i < rows && j < cols) {
        const k = i * (cols + 1) + j;
        idx.push(k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2);
      }
    }
  for (const end of [0, rows]) {
    const c = new T.Vector3();
    for (let j = 0; j < cols; j++) c.add(wingSurface(arm, end / rows, (j / cols) * Math.PI * 2));
    c.divideScalar(cols).sub(s);
    const cap = p.length / 3;
    p.push(...c.toArray());
    uv.push(0.5, end / rows);
    for (let j = 0; j < cols; j++) {
      const k = end * (cols + 1) + j;
      idx.push(...(end === 0 ? [cap, k, k + 1] : [cap, k + 1, k]));
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function mantle(
  parent: T.Group,
  arm: T.CatmullRomCurve3,
  origin: T.Vector3,
  material: T.Material,
  side: number,
) {
  for (let r = 0; r < 10; r++)
    for (let col = 0; col < 7; col++) {
      const start = 0.01 + r * 0.088,
        angle = (col / 7) * Math.PI * 2 + (r % 2) * 0.2;
      const nr = 14,
        nc = 6,
        p: number[] = [],
        uv: number[] = [],
        colors: number[] = [],
        idx: number[] = [];
      for (let i = 0; i <= nr; i++)
        for (let j = 0; j <= nc; j++) {
          const t = i / nr,
            u = (j / nc) * 2 - 1,
            along = Math.min(0.999, start + t * (0.17 + 0.015 * Math.sin(col + r))),
            a = angle + u * 0.52 * Math.sqrt(1 - smooth(t, 0.7, 1) ** 2);
          const q = wingSurface(arm, along, a),
            center = arm.getPoint(along),
            n = q.clone().sub(center).normalize();
          q.addScaledVector(n, 0.0015 + Math.sin(t * Math.PI) * 0.004 * (1 - u * u)).sub(origin);
          p.push(...q.toArray());
          uv.push(j / nc, t);
          const color = new T.Color('#456773').lerp(
            new T.Color('#8aa7aa'),
            0.25 + col * 0.025 + smooth(t, 0.5, 1) * 0.1,
          );
          colors.push(...color.toArray());
          if (i < nr && j < nc) {
            const k = i * (nc + 1) + j;
            idx.push(k, k + nc + 1, k + 1, k + 1, k + nc + 1, k + nc + 2);
          }
        }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      mesh(parent, g, material, `Stormroc_Mantle_${side}_${r}_${col}`).receiveShadow = false;
    }
}
function fittedContours(parent: T.Group, skin: T.SkinnedMesh, material: T.Material) {
  const designs: number[][] = [];
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 6; col++)
        designs.push([
          1.66 - row * 0.12 - col * 0.009,
          Math.PI / 2 + side * (0.19 + col * 0.46 + row * 0.035),
          0.16 + 0.014 * Math.sin(col + row),
          0.17 + col * 0.008,
        ]);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++)
        designs.push([
          2.026 - row * 0.082 - col * 0.006,
          Math.PI / 2 + side * (1.45 + col * 0.56),
          0.1,
          0.16,
        ]);
  }
  designs.forEach(([top, angle, length, width], index) => {
    const nr = 18,
      nc = 6,
      p: number[] = [],
      uv: number[] = [],
      colors: number[] = [],
      idx: number[] = [],
      w: number[] = [],
      joints: number[] = [];
    for (let i = 0; i <= nr; i++)
      for (let j = 0; j <= nc; j++) {
        const t = i / nr,
          u = (j / nc) * 2 - 1,
          y = top - length * t,
          a =
            angle +
            u * width * Math.sqrt(1 - smooth(t, 0.64, 1) ** 2) +
            Math.sign(angle - Math.PI / 2) * t * 0.1;
        const q = atHeight(y, a),
          n = new T.Vector3(Math.cos(a), 0, Math.sin(a)),
          relief = 0.0015 + Math.sin(t * Math.PI) * (top > 1.8 ? 0.003 : 0.0035) * (1 - u * u);
        q.addScaledVector(n, relief);
        p.push(...q.toArray());
        uv.push(j / nc, t);
        const c = bodyColor(q, a).multiplyScalar(
          0.98 + 0.022 * Math.sin(index * 1.71) + smooth(t, 0.6, 1) * 0.035,
        );
        colors.push(...c.toArray());
        w.push(...skinWeights(y));
        joints.push(0, 1, 2, 0);
        if (i < nr && j < nc) {
          const k = i * (nc + 1) + j;
          idx.push(k, k + 1, k + nc + 1, k + 1, k + nc + 2, k + nc + 1);
        }
      }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    g.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
    g.setAttribute('skinWeight', new T.Float32BufferAttribute(w, 4));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new T.SkinnedMesh(g, material);
    m.name = `Stormroc_FittedContour_${index}`;
    m.castShadow = true;
    m.receiveShadow = false;
    parent.add(m);
    m.bind(skin.skeleton, skin.bindMatrix);
  });
}

// Broad flight planes and short fitted contours retain distinct regional construction.
/** Small transverse toe shields stay subordinate to the talon silhouette. */
function footMaterial() {
  const size = 256,
    bytes = new Uint8Array(size * size * 4),
    normals = bytes.slice();
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const row = (y / size) * 11,
        seam = Math.exp(-Math.pow((row - Math.round(row)) / 0.095, 2)),
        grain = hash(x, y);
      const tone = 224 - seam * 36 + grain * 9;
      bytes.set([tone, tone - 9, tone - 26, 255], (y * size + x) * 4);
      const n = new T.Vector3(0, Math.sin(row * Math.PI * 2) * 0.12, 1).normalize();
      normals.set([128, 128 - n.y * 127, n.z * 255, 255], (y * size + x) * 4);
    }
  const map = new T.DataTexture(bytes, size, size);
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.magFilter = T.LinearFilter;
  map.minFilter = T.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.needsUpdate = true;
  const normal = new T.DataTexture(normals, size, size);
  normal.wrapS = normal.wrapT = T.RepeatWrapping;
  normal.magFilter = T.LinearFilter;
  normal.minFilter = T.LinearMipmapLinearFilter;
  normal.generateMipmaps = true;
  normal.needsUpdate = true;
  return new T.MeshStandardMaterial({
    color: '#aa965f',
    map,
    normalMap: normal,
    normalScale: new T.Vector2(0.25, -0.25),
    roughness: 0.94,
  });
}

export function stormroc(root: T.Group) {
  const plumage = featherMaterial(true),
    vanes = featherMaterial();
  const shoulder = plumage.clone();
  shoulder.vertexColors = false;
  shoulder.color.set('#365563');
  const keratin = new T.MeshStandardMaterial({ color: '#263438', roughness: 0.72 });
  const footMat = footMaterial();
  const dark = new T.MeshStandardMaterial({ color: '#101e25', roughness: 0.37 });
  const iris = new T.MeshStandardMaterial({ color: '#cdb879', roughness: 0.4 });
  const body = part(root, 'Stormroc_Body', [0, 0, 0]);
  const skin = new T.SkinnedMesh(bodySurface(), plumage);
  skin.name = 'Stormroc_ContinuousPlumage';
  skin.castShadow = skin.receiveShadow = true;
  body.add(skin);
  const anchor = new T.Bone();
  anchor.name = 'Stormroc_Anchor';
  const neck = new T.Bone();
  neck.name = 'Stormroc_Neck';
  neck.position.set(0.025, 1.58, 0.18);
  neck.userData.motion = 'stormrocNeck';
  anchor.add(neck);
  const head = new T.Bone();
  head.name = 'Stormroc_Head';
  head.position.copy(HEAD).sub(neck.position);
  head.userData.motion = 'stormrocHead';
  neck.add(head);
  skin.add(anchor);
  skin.bind(new T.Skeleton([anchor, neck, head]));
  fittedContours(body, skin, vanes);
  const hp = (p: number[]) => v(p).sub(HEAD).toArray();
  solid(
    head,
    'Stormroc_UpperBill',
    [
      [0.13, 1.929, 0.674],
      [0.135, 1.922, 0.764],
      [0.145, 1.88, 0.843],
      [0.15, 1.803, 0.827],
    ].map(hp),
    [0.073, 0.065, 0.045, 0.002],
    [0.052, 0.049, 0.034, 0.002],
    keratin,
  );
  solid(
    head,
    'Stormroc_LowerBill',
    [
      [0.13, 1.868, 0.65],
      [0.14, 1.857, 0.75],
      [0.15, 1.835, 0.8],
    ].map(hp),
    [0.052, 0.044, 0.004],
    [0.026, 0.019, 0.002],
    keratin,
  );
  for (const side of [-1, 1]) {
    const a = side === 1 ? 0.2 : Math.PI - 0.2,
      p = atHeight(1.964, a);
    const eye = pivot(
      head,
      `Stormroc_Eye_${side}`,
      p.clone().sub(HEAD).toArray(),
      'stormrocBlink',
      side,
    );
    oval(eye, `Stormroc_Orbit_${side}`, [side * 0.001, 0, 0], [0.008, 0.019, 0.029], dark);
    oval(eye, `Stormroc_Iris_${side}`, [side * 0.008, 0.001, 0.004], [0.004, 0.012, 0.013], iris);
    oval(eye, `Stormroc_Pupil_${side}`, [side * 0.011, 0.001, 0.006], [0.003, 0.008, 0.007], dark);
    // A low eyebrow grows from the cranial plane rather than becoming an attached tube.
    feather(
      head,
      `Stormroc_Brow_${side}`,
      [
        atHeight(1.999, a - 0.13 * side).toArray(),
        atHeight(1.991, a).toArray(),
        atHeight(1.981, a + 0.26 * side).toArray(),
      ].map(hp),
      0.012,
      vanes,
      ['#3b5663', '#90a5a4', '#354c57'],
      new T.Vector3(side, 0, 0),
    );
    oval(
      head,
      `Stormroc_Nostril_${side}`,
      hp([0.13 + side * 0.057, 1.93, 0.747]),
      [0.002, 0.009, 0.018],
      dark,
    );
  }
  for (let i = 0; i < 4; i++)
    feather(
      head,
      `Stormroc_Nape_${i}`,
      [
        [0.1 + (i - 1.5) * 0.031, 2.038, 0.43],
        [0.08 + (i - 1.5) * 0.044, 2.052 - i * 0.012, 0.3],
        [0.02 + (i - 1.5) * 0.07, 2.026 - i * 0.029, 0.13 - i * 0.033],
      ].map(hp),
      0.031,
      vanes,
      ['#547683', '#83a5aa', '#263e4b'],
    );

  for (const side of [-1, 1]) {
    const high = side < 0;
    const s = new T.Vector3(side * 0.2, 1.61, 0);
    const e = new T.Vector3(side * (high ? 0.55 : 0.62), high ? 1.88 : 1.93, high ? -0.12 : -0.29);
    const w = new T.Vector3(side * (high ? 0.98 : 1.28), high ? 2.34 : 1.83, high ? -0.22 : -0.43);
    const wing = pivot(root, `Stormroc_Shoulder_${side}`, s.toArray(), 'stormrocWing', side);
    const local = (p: T.Vector3) => p.clone().sub(s).toArray();
    const arm = new T.CatmullRomCurve3([
      s.clone().add(new T.Vector3(-side * 0.12, -0.03, 0.015)),
      s.clone().lerp(e, 0.4),
      e,
      w,
    ]);
    mesh(wing, wingEnvelope(arm, s), shoulder, `Stormroc_WingLeading_${side}`);
    mantle(wing, arm, s, vanes, side);
    // Secondaries overlap into one trailing surface along the forearm.
    for (let i = 0; i < 14; i++) {
      const t = 0.1 + (i / 13) * 0.85,
        base = arm.getPoint(t);
      const len = mix(0.44, 0.57, t) + 0.027 * Math.sin(i * 1.13);
      const tip = base.clone().add(new T.Vector3(side * (0.06 + 0.17 * t), -len, -0.17 - 0.05 * t));
      feather(
        wing,
        `Stormroc_Secondary_${side}_${i}`,
        [
          base,
          base
            .clone()
            .lerp(tip, 0.52)
            .add(new T.Vector3(0, 0.01, 0.055)),
          tip,
        ].map(local),
        0.1 - 0.012 * t,
        vanes,
        ['#476d7a', '#7499a2', '#324e5f'],
      );
    }
    const wrist = pivot(wing, `Stormroc_Wrist_${side}`, local(w), 'stormrocWrist', side);
    solid(
      wrist,
      `Stormroc_Hand_${side}`,
      [
        [0, 0, 0],
        [side * 0.12, 0.018, -0.005],
        [side * 0.21, 0.04, -0.012],
      ],
      [0.022, 0.027, 0.008],
      [0.016, 0.012, 0.004],
      shoulder,
    );
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const base = w.clone().add(new T.Vector3(side * (0.03 + 0.14 * t), 0.04 * t, -0.02 * t));
      const tip = new T.Vector3(
        side *
          (high
            ? 1.08 + 0.7 * Math.sin(t * Math.PI * 0.68)
            : 1.43 + 0.7 * Math.sin(t * Math.PI * 0.66)),
        high ? 2.0 + 1.02 * t : 1.37 + 0.85 * t,
        high ? -0.3 - 0.16 * t : -0.57 - 0.13 * t,
      );
      feather(
        wrist,
        `Stormroc_Primary_${side}_${i}`,
        [
          base,
          base
            .clone()
            .lerp(tip, 0.6)
            .add(new T.Vector3(0, 0.035, 0.035)),
          tip,
        ].map((p) => p.sub(w).toArray()),
        0.092 - 0.013 * t,
        vanes,
        ['#456a77', '#82aeb4', '#243b4b'],
      );
    }
    // These short feathers wrap the actual covered wing, unlike the flat flight vanes.
    for (const face of [-1, 1])
      for (let i = 0; i < 15; i++) {
        const center = 0.035 + (i / 14) * 0.91,
          nr = 22,
          nc = 8,
          p: number[] = [],
          uv: number[] = [],
          colors: number[] = [],
          indices: number[] = [];
        for (let r = 0; r <= nr; r++)
          for (let col = 0; col <= nc; col++) {
            const t = r / nr,
              u = (col / nc) * 2 - 1;
            const along = T.MathUtils.clamp(
                center + t * 0.021 + u * 0.057 * Math.sqrt(1 - smooth(t, 0.72, 1) ** 2),
                0.001,
                0.999,
              ),
              a = face * (0.18 + t * 2.66);
            const q = wingSurface(arm, along, a),
              centerPoint = arm.getPoint(along),
              n = q.clone().sub(centerPoint).normalize();
            q.addScaledVector(
              n,
              -0.001 + smooth(t, 0.05, 0.22) * 0.002 + Math.sin(t * Math.PI) * 0.003 * (1 - u * u),
            ).sub(s);
            p.push(...q.toArray());
            uv.push(col / nc, t);
            const c = new T.Color('#5d818e')
              .lerp(new T.Color('#4b6d7b'), smooth(t, 0.3, 1) * 0.5)
              .multiplyScalar(0.98 + 0.025 * Math.sin(i * 1.7));
            colors.push(...c.toArray());
            if (r < nr && col < nc) {
              const k = r * (nc + 1) + col;
              indices.push(
                ...(face > 0
                  ? [k, k + 1, k + nc + 1, k + 1, k + nc + 2, k + nc + 1]
                  : [k, k + nc + 1, k + 1, k + 1, k + nc + 1, k + nc + 2]),
              );
            }
          }
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
        g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
        g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
        g.setIndex(indices);
        g.computeVertexNormals();
        mesh(wing, g, vanes, `Stormroc_Covert_${side}_${face}_${i}`).receiveShadow = false;
      }
    for (let i = 0; i < 9; i++) {
      const t = i / 8,
        base = w.clone().add(new T.Vector3(side * (0.03 + 0.14 * t), 0.04 * t, -0.02 * t));
      const end = new T.Vector3(
        side *
          (high
            ? 1.08 + 0.7 * Math.sin(t * Math.PI * 0.68)
            : 1.43 + 0.7 * Math.sin(t * Math.PI * 0.66)),
        high ? 2.0 + 1.02 * t : 1.37 + 0.85 * t,
        high ? -0.3 - 0.16 * t : -0.57 - 0.13 * t,
      );
      feather(
        wrist,
        `Stormroc_HandCovert_${side}_${i}`,
        [
          base.clone().add(new T.Vector3(-side * 0.026, 0, 0)),
          base
            .clone()
            .lerp(end, 0.2)
            .add(new T.Vector3(0, 0.01, 0.022)),
          base
            .clone()
            .lerp(end, 0.45)
            .add(new T.Vector3(0, 0.008, 0.014)),
        ].map((p) => p.sub(w).toArray()),
        0.063,
        vanes,
        ['#4a6d7b', '#6a8d98', '#4d7181'],
      );
    }
  }
  const tail = pivot(root, 'Stormroc_Tail', [-0.065, 1.14, -0.29], 'stormrocTail');
  for (let i = 0; i < 7; i++) {
    const f = (i - 3) / 3;
    feather(
      tail,
      `Stormroc_Rectrix_${i}`,
      [
        [f * 0.029, 0, 0],
        [f * 0.12 - 0.08, -0.18, -0.28],
        [f * 0.2 - 0.14, -0.38 + Math.abs(f) * 0.1, -0.73 + Math.abs(f) * 0.12],
      ],
      0.083,
      vanes,
      ['#294651', '#6b8994', '#293c4c'],
      new T.Vector3(0, 0.88, -0.47),
    );
  }
  const support = part(root, 'Stormroc_RockAndGrip', [0, 0, 0]);
  const rockMat = new T.MeshStandardMaterial({
    color: '#5e6869',
    roughness: 0.98,
    flatShading: true,
  });
  // Low, uneven ledge: both toes wrap the front and rear margins of its flat gripping top.
  const geo = new T.CylinderGeometry(0.31, 0.43, 0.49, 7, 3),
    pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i),
      level = y / 0.49 + 0.5;
    const d = level > 0.99 ? 1 : 1 + 0.13 * Math.sin(Math.atan2(z, x) * 3 + level * 6);
    pos.setXYZ(i, x * d + (level < 0.01 ? -0.045 : 0), y, z * d);
  }
  // glTF carries vertex normals, not Three.js flatShading shader flags.
  const facets = geo.toNonIndexed();
  geo.dispose();
  facets.computeVertexNormals();
  const rock = mesh(support, facets, rockMat, 'Stormroc_Rock');
  rock.position.set(-0.03, 0.105 + 0.49 / 2, -0.08);
  rock.rotation.y = 0.16;
  for (const side of [-1, 1]) {
    const x = side < 0 ? -0.15 : 0.105,
      z = side < 0 ? 0.015 : 0.07;
    solid(
      support,
      `Stormroc_Thigh_${side}`,
      [
        [side * 0.105, 1.29, -0.06],
        [x, 1.05, -0.095],
        [x, 0.88, z - 0.035],
        [x, 0.76, z],
      ],
      [0.065, 0.092, 0.052, 0.018],
      [0.056, 0.08, 0.043, 0.016],
      shoulder,
    );
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      feather(
        support,
        `Stormroc_ThighContour_${side}_${i}`,
        [
          [x + Math.cos(a) * 0.072, 1.065, -0.064 + Math.sin(a) * 0.055],
          [x + Math.cos(a) * 0.05, 0.89, z - 0.025 + Math.sin(a) * 0.042],
          [x + Math.cos(a) * 0.024, 0.75 + (i % 3) * 0.019, z + Math.sin(a) * 0.02],
        ],
        0.027,
        vanes,
        ['#355464', '#536d79', '#4b6570'],
        new T.Vector3(Math.cos(a), 0, Math.sin(a)),
      );
    }
    solid(
      support,
      `Stormroc_Tarsus_${side}`,
      [
        [x, 0.9, z - 0.025],
        [x, 0.73, z],
        [x, 0.608, z + 0.019],
      ],
      [0.029, 0.024, 0.03],
      [0.025, 0.021, 0.024],
      footMat,
    );
    const grip = part(support, `Stormroc_Grip_${side}`, [0, 0, 0]);
    grip.position.y = -0.016;
    for (let i = 0; i < 3; i++) {
      const spread = (i - 1) * 0.055,
        endZ = side < 0 ? 0.164 : 0.196;
      solid(
        grip,
        `Stormroc_Toe_${side}_${i}`,
        [
          [x, 0.638, z],
          [x + spread * 0.7, 0.628, z + 0.062],
          [x + spread, 0.617, endZ],
          [x + spread * 0.95, 0.567, endZ + 0.021],
        ],
        [0.022, 0.02, 0.017, 0.009],
        [0.019, 0.017, 0.014, 0.007],
        footMat,
      );
      solid(
        grip,
        `Stormroc_Claw_${side}_${i}`,
        [
          [x + spread, 0.605, endZ + 0.013],
          [x + spread * 0.95, 0.559, endZ + 0.022],
          [x + spread * 0.9, 0.535, endZ - 0.016],
        ],
        [0.015, 0.011, 0.001],
        [0.013, 0.009, 0.001],
        keratin,
      );
    }
    solid(
      grip,
      `Stormroc_Hallux_${side}`,
      [
        [x, 0.638, z],
        [x + side * 0.038, 0.625, -0.146],
        [x + side * 0.051, 0.593, -0.281],
      ],
      [0.023, 0.019, 0.011],
      [0.019, 0.015, 0.009],
      footMat,
    );
    solid(
      grip,
      `Stormroc_HindClaw_${side}`,
      [
        [x + side * 0.051, 0.599, -0.27],
        [x + side * 0.055, 0.55, -0.299],
        [x + side * 0.055, 0.524, -0.278],
      ],
      [0.015, 0.01, 0.001],
      [0.013, 0.008, 0.001],
      keratin,
    );
  }
}
export function stormrocMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((o) => {
    const kind = o.userData.motion as string | undefined;
    if (!kind?.startsWith('stormroc')) return;
    const rest = o.quaternion.clone(),
      values: number[] = [],
      side = (o.userData.side as number) ?? 1;
    if (kind === 'stormrocBlink') {
      for (const time of times) {
        const b = Math.max(0, 1 - Math.abs(time - 3.65) / 0.19);
        values.push(1, 1 - 0.94 * Math.sin((b * Math.PI) / 2) ** 2, 1);
      }
      tracks.push(new T.VectorKeyframeTrack(`${o.name}.scale`, times, values));
      return;
    }
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      if (kind === 'stormrocNeck') {
        e.x = Math.sin(a) * 0.014;
        e.y = (Math.sin(a - 0.2) + Math.sin(0.2)) * 0.022;
      }
      if (kind === 'stormrocHead') {
        e.y = Math.sin(a) ** 3 * 0.095;
        e.x = (Math.sin(a - 0.4) + Math.sin(0.4)) * 0.016;
      }
      if (kind === 'stormrocWing') {
        e.y = side * Math.sin(a) * 0.035;
        e.z = side * Math.sin(a) * 0.024;
        e.x = (Math.sin(a - 0.2) + Math.sin(0.2)) * 0.013;
      }
      if (kind === 'stormrocWrist') {
        e.y = side * (Math.sin(a - 0.45) + Math.sin(0.45)) * 0.026;
        e.z = side * (Math.sin(a - 0.45) + Math.sin(0.45)) * 0.018;
      }
      if (kind === 'stormrocTail') {
        e.y = (Math.sin(a - 0.7) + Math.sin(0.7)) * 0.024;
        e.x = (Math.sin(a - 0.8) + Math.sin(0.8)) * 0.012;
      }
      values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    values.splice(values.length - 4, 4, ...values.slice(0, 4));
    tracks.push(new T.QuaternionKeyframeTrack(`${o.name}.quaternion`, times, values));
  });
  return tracks;
}
