import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loft } from './newStudies';
import { ellipsoid, sculptField, union } from './surfaceSculpt';

const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
const smooth = T.MathUtils.smoothstep;
const ORIGIN = new T.Vector3(0, 1.79, 0.02);
type WingKind = 'fore' | 'hind';

function add(parent: T.Object3D, geometry: T.BufferGeometry, material: T.Material, name: string) {
  const mesh = new T.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function oval(
  parent: T.Object3D,
  name: string,
  p: number[],
  scale: number[],
  material: T.Material,
) {
  const mesh = add(parent, new T.SphereGeometry(1, 32, 24), material, name);
  mesh.position.copy(v(p));
  mesh.scale.copy(v(scale));
  return mesh;
}
function outline(kind: WingKind) {
  const s = new T.Shape();
  s.moveTo(0, 0);
  if (kind === 'fore') {
    s.bezierCurveTo(0.24, 0.29, 0.86, 0.82, 1.45, 0.7);
    s.bezierCurveTo(1.52, 0.5, 1.51, 0.22, 1.39, 0.02);
    s.bezierCurveTo(1.21, -0.29, 0.93, -0.36, 0.67, -0.32);
    s.bezierCurveTo(0.43, -0.27, 0.15, -0.19, 0, -0.055);
  } else {
    s.bezierCurveTo(0.31, 0.07, 0.88, 0.12, 1.02, -0.17);
    s.bezierCurveTo(1.11, -0.37, 0.83, -0.57, 0.66, -0.59);
    s.bezierCurveTo(0.57, -0.75, 0.78, -1.02, 0.81, -1.13);
    s.bezierCurveTo(0.78, -1.24, 0.65, -1.3, 0.55, -1.27);
    s.bezierCurveTo(0.71, -1.07, 0.51, -0.88, 0.43, -0.7);
    s.bezierCurveTo(0.37, -0.58, 0.16, -0.53, 0.07, -0.29);
    s.bezierCurveTo(0.04, -0.2, 0.02, -0.1, 0, 0);
  }
  s.closePath();
  return s;
}
function distanceToSegment(x: number, y: number, a: T.Vector2, b: T.Vector2) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const t = T.MathUtils.clamp(((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
}
function texture(data: Uint8Array, size: number, color = false) {
  const map = new T.DataTexture(data, size, size);
  map.colorSpace = color ? T.SRGBColorSpace : T.NoColorSpace;
  map.magFilter = T.LinearFilter;
  map.minFilter = T.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.needsUpdate = true;
  return map;
}
function normalTexture(data: Uint8Array, size: number) {
  // Bake the green-channel convention for derivative tangents. Paired with a
  // negative Y scale this preserves the live relief and avoids the exporter's
  // canvas-only conversion of DataTextures, as in the existing creatures.
  for (let k = 1; k < data.length; k += 4) data[k] = 255 - data[k];
  return texture(data, size);
}
/** Pigment follows wing regions. Eyespots and veins live in the membrane, not raised appliques. */
function wingMaterial(kind: WingKind) {
  const size = 512,
    pigment = new Uint8Array(size * size * 4),
    relief = new Uint8Array(size * size * 4),
    packed = new Uint8Array(size * size * 4);
  const boundary = outline(kind).getSpacedPoints(130);
  const paths =
    kind === 'fore'
      ? [
          [
            [0.08, -0.02],
            [0.5, 0.34],
            [1.41, 0.64],
          ],
          [
            [0.14, 0],
            [0.5, 0.17],
            [0.94, 0.38],
            [1.46, 0.42],
          ],
          [
            [0.18, -0.02],
            [0.48, 0.06],
            [0.94, 0.1],
            [1.42, 0.09],
          ],
          [
            [0.15, -0.05],
            [0.46, 0],
            [0.82, -0.12],
            [1.17, -0.21],
          ],
          [
            [0.1, -0.07],
            [0.39, -0.16],
            [0.66, -0.3],
          ],
          [
            [0.48, 0.06],
            [0.67, 0],
            [0.95, -0.29],
          ],
          [
            [0.5, 0.17],
            [0.8, 0.22],
            [1.43, 0.26],
          ],
        ]
      : [
          [
            [0.08, -0.02],
            [0.48, -0.04],
            [0.98, -0.18],
          ],
          [
            [0.1, -0.05],
            [0.5, -0.17],
            [0.97, -0.36],
          ],
          [
            [0.12, -0.1],
            [0.44, -0.29],
            [0.8, -0.5],
          ],
          [
            [0.08, -0.15],
            [0.32, -0.4],
            [0.57, -0.62],
            [0.56, -0.9],
            [0.72, -1.2],
          ],
        ];
  const veins: [T.Vector2, T.Vector2][] = [];
  for (const path of paths) {
    const curve = new T.CatmullRomCurve3(path.map(([x, y]) => new T.Vector3(x, y, 0)));
    const points = curve.getPoints(12).map((p) => new T.Vector2(p.x, p.y));
    for (let j = 0; j < points.length - 1; j++) veins.push([points[j], points[j + 1]]);
  }
  const pale = new T.Color('#c4cca5'),
    sage = new T.Color('#839a78'),
    rim = new T.Color('#756d54');
  const ochre = new T.Color('#b8a15f'),
    dark = new T.Color('#354841'),
    center = new T.Color('#9cb6b1');
  const ex = kind === 'fore' ? 0.79 : 0.56,
    ey = kind === 'fore' ? 0.23 : -0.34;
  const rx = kind === 'fore' ? 0.135 : 0.096,
    ry = kind === 'fore' ? 0.115 : 0.086;
  for (let iy = 0; iy < size; iy++)
    for (let ix = 0; ix < size; ix++) {
      const x = (ix / (size - 1)) * 1.6,
        y = (iy / (size - 1)) * 2.2 - 1.35;
      let edge = 10,
        vein = 10;
      for (let j = 0; j < boundary.length - 1; j++)
        edge = Math.min(edge, distanceToSegment(x, y, boundary[j], boundary[j + 1]));
      for (const [a, b] of veins) vein = Math.min(vein, distanceToSegment(x, y, a, b));
      const radial = Math.hypot(x, y * 0.8),
        angle = Math.atan2(y, x);
      const cells = Math.sin(radial * 470 + Math.floor(angle * 175) * 0.9) * Math.sin(angle * 350);
      const mottling = Math.sin(x * 23 + y * 17) * Math.sin(y * 37 - x * 9);
      const color = pale.clone().lerp(sage, 0.22 + 0.45 * smooth(edge, 0.025, 0.32));
      color.lerp(sage, (1 - smooth(vein, 0.001, 0.012)) * 0.34);
      color.lerp(rim, (1 - smooth(edge, 0.005, 0.02)) * (kind === 'fore' && y > 0.2 ? 0.82 : 0.42));
      // A quiet submarginal echo breaks the broad plane without outlining every region.
      color.lerp(sage, Math.exp(-(((edge - 0.075) / 0.022) ** 2)) * 0.1);
      const eyeAngle = Math.atan2((y - ey) / ry, (x - ex) / rx);
      const eye =
        Math.hypot((x - ex + (y - ey) * 0.15) / rx, (y - ey) / ry) *
        (1 +
          0.025 * Math.sin(eyeAngle * 3 + (kind === 'fore' ? 0.4 : 1.2)) +
          0.009 * Math.sin(eyeAngle * 7));
      color.lerp(dark, 1 - smooth(eye, 1.13, 1.27));
      color.lerp(ochre, 1 - smooth(eye, 0.92, 1.12));
      color.lerp(dark, 1 - smooth(eye, 0.62, 0.82));
      color.lerp(center, 1 - smooth(eye, 0.29, 0.45));
      const crescent = Math.hypot((x - ex + 0.018) / rx, (y - ey - 0.018) / ry);
      if (eye < 0.48) color.lerp(pale, Math.exp(-(((crescent - 0.32) / 0.09) ** 2)) * 0.65);
      color.multiplyScalar(1 + cells * 0.035 + mottling * 0.018).convertLinearToSRGB();
      const k = (iy * size + ix) * 4;
      pigment.set(
        [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255), 255],
        k,
      );
      relief.set(
        [128 + Math.round(cells * 5), 128 + Math.round(Math.cos(radial * 470) * 4), 254, 255],
        k,
      );
      packed.set([255, Math.round(225 + cells * 5), 255, 255], k);
    }
  const roughnessMap = texture(packed, size);
  return new T.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    map: texture(pigment, size, true),
    normalMap: normalTexture(relief, size),
    normalScale: new T.Vector2(0.22, -0.22),
    roughness: 1,
    metalness: 0,
    roughnessMap,
    metalnessMap: roughnessMap,
  });
}
function fibrousMaterial(base: string, kind: 'down' | 'bark') {
  const size = 256,
    pigment = new Uint8Array(size * size * 4),
    normal = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const long =
        kind === 'down'
          ? Math.sin(x * 1.8 + Math.sin(y * 0.04) * 1.2)
          : Math.sin(x * 0.38 + Math.sin(y * 0.033) * 1.5) * Math.sin(x * 0.075 + y * 0.009) +
            Math.sin(x * 0.13 - y * 0.021) * 0.3;
      const grain = Math.sin(x * 4.7 + y * 3.9) * Math.sin(x * 2.1 - y * 5.8);
      const value = 1 + long * (kind === 'down' ? 0.04 : 0.11) + grain * 0.02;
      const c = new T.Color(base).multiplyScalar(value).convertLinearToSRGB(),
        k = (y * size + x) * 4;
      pigment.set([Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255), 255], k);
      normal.set(
        [
          128 + Math.round(long * (kind === 'down' ? 6 : 15)),
          128 + Math.round(grain * 4),
          254,
          255,
        ],
        k,
      );
    }
  const map = texture(pigment, size, true),
    normalMap = normalTexture(normal, size);
  for (const t of [map, normalMap]) {
    t.wrapS = T.RepeatWrapping;
    t.wrapT = T.RepeatWrapping;
  }
  return new T.MeshStandardMaterial({
    map,
    normalMap,
    roughness: 0.95,
    normalScale: new T.Vector2(0.25, -0.25),
  });
}
function thoraxDown(parent: T.Object3D, material: T.Material) {
  const pieces: T.BufferGeometry[] = [];
  for (let ring = 0; ring < 13; ring++)
    for (let j = 0; j < 29; j++) {
      const y = 0.03 + ring * 0.028,
        angle = ((j + ring * 0.38) / 29) * Math.PI * 2;
      const r = Math.sqrt(Math.max(0.1, 1 - ((y - 0.19) / 0.255) ** 2));
      const p = new T.Vector3(Math.cos(angle) * 0.15 * r, y, 0.025 + Math.sin(angle) * 0.135 * r);
      const n = new T.Vector3(Math.cos(angle), 0.15, Math.sin(angle));
      const root = p.clone().addScaledVector(n, -0.01),
        end = p.clone().addScaledVector(n, 0.009);
      end.y -= 0.022 + 0.008 * Math.sin(j * 2.3 + ring);
      pieces.push(
        loft(
          [root.toArray(), p.toArray(), end.toArray()],
          [0.0017, 0.0012, 0.00015],
          [0.0012, 0.0008, 0.00015],
          7,
          5,
        ),
      );
    }
  const g = mergeGeometries(pieces);
  pieces.forEach((p) => p.dispose());
  add(parent, g, material, 'Moonmoth_ThoraxDown');
}
/** A curved, closed thin wing; subdivided interior triangles carry continuous flex. */
function wingGeometry(kind: WingKind, side: number) {
  const base = new T.ShapeGeometry(outline(kind), 28);
  const a = base.attributes.position;
  const points = Array.from({ length: a.count }, (_, i) => new T.Vector2(a.getX(i), a.getY(i)));
  let faces = Array.from(base.index!.array);
  base.dispose();
  for (let pass = 0; pass < 3; pass++) {
    const midpoint = new Map<string, number>();
    const mid = (a: number, b: number) => {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (!midpoint.has(key)) {
        midpoint.set(key, points.length);
        points.push(points[a].clone().lerp(points[b], 0.5));
      }
      return midpoint.get(key)!;
    };
    const next: number[] = [];
    for (let i = 0; i < faces.length; i += 3) {
      const [a, b, c] = faces.slice(i, i + 3),
        ab = mid(a, b),
        bc = mid(b, c),
        ca = mid(c, a);
      next.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    faces = next;
  }
  const edges = new Map<string, { a: number; b: number; count: number }>();
  for (let i = 0; i < faces.length; i += 3)
    for (let j = 0; j < 3; j++) {
      const a = faces[i + j],
        b = faces[i + ((j + 1) % 3)],
        key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const edge = edges.get(key);
      if (edge) edge.count++;
      else edges.set(key, { a, b, count: 1 });
    }
  const pos: number[] = [],
    uv: number[] = [],
    colors: number[] = [];
  const centerZ = (x: number, y: number) =>
    kind === 'fore'
      ? 0.1 * Math.sin(x * 2.0) + 0.12 * y * y - 0.07 * x * x
      : 0.075 * Math.sin(x * 2.5) - 0.06 * y * y + 0.065 * Math.sin(-y * 4) * smooth(-y, 0.65, 1.3);
  for (const face of [1, -1])
    for (const p of points) {
      pos.push(p.x * side, p.y, centerZ(p.x, p.y) + face * 0.004);
      uv.push(p.x / 1.6, (p.y + 1.35) / 2.2);
      const c = new T.Color(face === 1 ? '#ffffff' : '#c0c9aa');
      colors.push(...c.toArray());
    }
  const n = points.length,
    indices: number[] = [];
  for (let i = 0; i < faces.length; i += 3) {
    const [a, b, c] = faces.slice(i, i + 3);
    indices.push(a, b, c, n + a, n + c, n + b);
  }
  for (const e of edges.values())
    if (e.count === 1) indices.push(e.a, e.a + n, e.b, e.b, e.a + n, e.b + n);
  if (side < 0)
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
function wing(parent: T.Object3D, side: number, kind: WingKind, material: T.Material) {
  const label = `${kind === 'fore' ? 'Fore' : 'Hind'}_${side > 0 ? 'R' : 'L'}`;
  const hinge = new T.Group();
  hinge.name = `Moonmoth_${label}_Hinge`;
  hinge.position.set(side * 0.085, kind === 'fore' ? 0.24 : 0.105, kind === 'fore' ? 0.01 : -0.045);
  hinge.rotation.y = side * (side > 0 ? 0.64 : 0.16);
  hinge.rotation.z = side * (side > 0 ? -0.1 : 0.045);
  hinge.userData.motion = 'mothHinge';
  hinge.userData.side = side;
  hinge.userData.phase = kind === 'fore' ? 0 : -0.24;
  parent.add(hinge);
  const g = wingGeometry(kind, side);
  const anchor = new T.Bone();
  anchor.name = `Moonmoth_${label}_Anchor`;
  const flex = new T.Bone();
  flex.name = `Moonmoth_${label}_Flex`;
  flex.position.set(side * 0.47, -0.05, 0);
  anchor.add(flex);
  flex.userData.motion = 'mothFlex';
  flex.userData.side = side;
  flex.userData.phase = kind === 'fore' ? -0.3 : -0.5;
  const tail = new T.Bone();
  tail.name = `Moonmoth_${label}_Tail`;
  tail.position.set(side * 0.07, -0.66, 0);
  flex.add(tail);
  tail.userData.motion = kind === 'hind' ? 'mothTail' : undefined;
  tail.userData.side = side;
  const skeleton = new T.Skeleton([anchor, flex, tail]);
  const weights: number[] = [],
    joints: number[] = [];
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const flexWeight = smooth(Math.abs(p.getX(i)), 0.18, 1.2);
    const tailWeight = kind === 'hind' ? smooth(-p.getY(i), 0.65, 1.07) : 0;
    joints.push(0, 1, 2, 0);
    weights.push((1 - flexWeight) * (1 - tailWeight), flexWeight * (1 - tailWeight), tailWeight, 0);
  }
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(joints, 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
  const skin = new T.SkinnedMesh(g, material);
  skin.name = `Moonmoth_${label}_Wing`;
  skin.castShadow = true;
  skin.receiveShadow = true;
  hinge.add(skin);
  skin.add(anchor);
  parent.updateMatrixWorld(true);
  skin.bind(skeleton);
  return skin;
}
function antenna(parent: T.Object3D, side: number, material: T.Material) {
  const group = new T.Group();
  group.name = `Moonmoth_Antenna_${side > 0 ? 'R' : 'L'}`;
  group.position.set(side * 0.067, 0.51, 0.14);
  group.rotation.z = side > 0 ? -0.09 : 0.06;
  group.userData.motion = 'mothAntenna';
  group.userData.side = side;
  parent.add(group);
  const path = [
    [0, 0, 0],
    [side * 0.075, 0.15, 0.025],
    [side * 0.2, 0.31, 0.04],
    [side * 0.33, 0.4, 0.025],
    [side * 0.38, 0.39, 0],
  ];
  const curve = new T.CatmullRomCurve3(path.map(v));
  const pieces = [
    loft(path, [0.018, 0.017, 0.012, 0.007, 0.001], [0.014, 0.014, 0.01, 0.006, 0.001], 50, 12),
  ];
  for (let i = 0; i < 25; i++) {
    const t = 0.08 + (i / 25) * 0.83,
      p = curve.getPointAt(t),
      tangent = curve.getTangentAt(t);
    const perpendicular = new T.Vector3(tangent.y, -tangent.x, 0).normalize();
    const length = 0.085 * Math.sin(t * Math.PI) ** 0.65;
    for (const direction of [-1, 1]) {
      const end = p
        .clone()
        .addScaledVector(perpendicular, length * direction)
        .addScaledVector(tangent, 0.035);
      const middle = p.clone().lerp(end, 0.5);
      middle.z += 0.014;
      pieces.push(
        loft(
          [p.toArray(), middle.toArray(), end.toArray()],
          [0.0048, 0.003, 0.0004],
          [0.0034, 0.002, 0.0004],
          10,
          6,
        ),
      );
    }
  }
  const g = mergeGeometries(pieces);
  pieces.forEach((g) => g.dispose());
  add(group, g, material, `${group.name}_Comb`);
}
export function moonmoth(root: T.Group) {
  const moth = new T.Group();
  moth.name = 'Moonmoth_LivingAssembly';
  moth.position.copy(ORIGIN);
  root.add(moth);
  const cream = fibrousMaterial('#d6d5b3', 'down');
  const foreMaterial = wingMaterial('fore'),
    hindMaterial = wingMaterial('hind');
  const bark = fibrousMaterial('#514b3c', 'bark');
  const shell = new T.MeshStandardMaterial({ color: '#71755a', roughness: 0.76 });
  const eye = new T.MeshStandardMaterial({ color: '#1e2924', roughness: 0.44 });
  const thorax = ellipsoid([0, 0.19, 0.025], [0.15, 0.255, 0.135]);
  const abdomenBase = ellipsoid([0, -0.275, -0.015], [0.115, 0.4, 0.105], -0.06);
  const abdomen = (x: number, y: number, z: number) =>
    abdomenBase(x, y, z) + (1 - Math.cos((y + 0.04) * 58)) * 0.0018 * smooth(-y, 0.06, 0.2);
  const head = ellipsoid([-0.018, 0.46, 0.08], [0.104, 0.12, 0.105]);
  const field = (x: number, y: number, z: number) =>
    union(union(thorax(x, y, z), abdomen(x, y, z), 0.1), head(x, y, z), 0.07);
  const skin = sculptField(field, {
    step: 0.012,
    origin: [-0.23, -0.74, -0.2],
    cells: [39, 112, 43],
  });
  add(moth, skin, cream, 'Moonmoth_ContinuousBody');
  thoraxDown(moth, cream);
  for (const side of [-1, 1]) {
    wing(moth, side, 'hind', hindMaterial);
    wing(moth, side, 'fore', foreMaterial);
    const eyeMesh = oval(
      moth,
      `Moonmoth_CompoundEye_${side}`,
      [side * 0.075 - 0.018, 0.472, 0.14],
      [0.029, 0.045, 0.025],
      eye,
    );
    eyeMesh.rotation.y = side * 0.38;
    antenna(moth, side, cream);
    for (let i = 0; i < 3; i++) {
      const y = 0.29 - i * 0.13,
        endY = y + (i === 0 ? 0.1 : i === 2 ? -0.17 : -0.025);
      const branchX = -0.16 + endY * 0.1;
      const points = [
        [side * 0.1, y, -0.045],
        [side * (0.18 + i * 0.012), y - 0.05, -0.055],
        [side * (0.22 - i * 0.025), endY - 0.015, -0.13],
        [branchX + side * 0.066, endY, -0.105],
        [branchX + side * 0.022, endY - 0.027, -0.155],
      ];
      const leg = add(
        moth,
        loft(
          points,
          [0.016, 0.014, 0.009, 0.006, 0.002],
          [0.014, 0.012, 0.008, 0.005, 0.002],
          50,
          10,
        ),
        shell,
        `Moonmoth_ClaspingLeg_${side}_${i}`,
      );
      leg.userData.grip = points.at(-1);
    }
  }
  // The quiet twig is part of the exported assembly; six tarsi clasp its upper surface.
  const branch = [
    [0.25, 0.105, -0.32],
    [0.25, 0.2, -0.32],
    [0.24, 0.31, -0.32],
    [0.13, 0.55, -0.29],
    [-0.15, 1.28, -0.21],
    [-0.16, 1.79, -0.17],
    [-0.12, 2.18, -0.16],
    [-0.1, 2.28, -0.18],
  ];
  const perchGeometry = loft(
    branch,
    [0.09, 0.082, 0.07, 0.062, 0.042, 0.006],
    [0.09, 0.082, 0.07, 0.062, 0.042, 0.006],
    100,
    20,
  );
  const perchPositions = perchGeometry.attributes.position;
  for (let i = 0; i < perchPositions.count; i++)
    if (perchPositions.getY(i) < 0.106) perchPositions.setY(i, 0.105);
  perchGeometry.computeVertexNormals();
  add(root, perchGeometry, bark, 'Moonmoth_Perch');
  add(
    root,
    loft(
      [
        [-0.09, 1.17, -0.21],
        [-0.36, 1.36, -0.28],
        [-0.5, 1.48, -0.31],
      ],
      [0.048, 0.025, 0.003],
      [0.048, 0.025, 0.003],
      35,
      12,
    ),
    bark,
    'Moonmoth_ShortTwig',
  );
}
export function moonmothMotionTracks(root: T.Group, times: number[], duration: number) {
  const tracks: T.KeyframeTrack[] = [];
  root.traverse((node) => {
    const kind = node.userData.motion as string | undefined;
    if (!kind?.startsWith('moth')) return;
    const side = node.userData.side as number,
      phase = (node.userData.phase as number | undefined) ?? 0;
    const rest = node.quaternion.clone(),
      values: number[] = [];
    for (const time of times) {
      const a = (time / duration) * Math.PI * 2,
        e = new T.Euler();
      const wave = Math.sin(a + phase) - Math.sin(phase);
      if (kind === 'mothHinge') e.y = side * wave * 0.055;
      if (kind === 'mothFlex') e.y = side * wave * 0.04;
      if (kind === 'mothTail') {
        e.x = (Math.sin(a - 0.8) - Math.sin(-0.8)) * 0.055;
        e.y = side * (Math.sin(a - 1.0) - Math.sin(-1.0)) * 0.025;
      }
      if (kind === 'mothAntenna') {
        e.z = side * Math.sin(a + side * 0.4) * 0.035;
        e.x = Math.sin(a - 0.4) * 0.025;
      }
      values.push(...rest.clone().multiply(new T.Quaternion().setFromEuler(e)).toArray());
    }
    values.splice(-4, 4, ...values.slice(0, 4));
    tracks.push(new T.QuaternionKeyframeTrack(`${node.name}.quaternion`, times, values));
  });
  return tracks;
}
