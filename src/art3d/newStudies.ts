import * as T from 'three';

const vec = (p: number[]) => new T.Vector3(...(p as [number, number, number]));
function metal(color: string, roughness = 0.48) {
  const size = 128,
    pigment = new Uint8Array(size * size * 4),
    normals = new Uint8Array(size * size * 4),
    rough = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const grain = (Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
      const cast = Math.sin(x * 0.087 + Math.sin(y * 0.065)) * Math.cos(y * 0.11 + x * 0.033);
      const tone = 237 + cast * 10 + grain * 4;
      pigment.set([tone, tone + cast * 2, tone - 2, 255], i);
      normals.set([128 + grain * 3, 128 + Math.sin(x * 0.4 + y * 0.6) * 2, 254, 255], i);
      const r = 218 + cast * 28 + grain * 6;
      // Prepack glTF's roughness (G) and metalness (B) channels. Full B
      // preserves the authored scalar metalness in live Three.js and exports.
      rough.set([255, r, 255, 255], i);
    }
  const texture = (bytes: Uint8Array) => {
    const t = new T.DataTexture(bytes, size, size);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.magFilter = T.LinearFilter;
    t.minFilter = T.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
  };
  const map = texture(pigment);
  map.colorSpace = T.SRGBColorSpace;
  const metalRoughness = texture(rough);
  // A shared packed map bypasses GLTFExporter's drawImage-based merger,
  // which cannot consume a DataTexture's typed-array image. Direct image
  // export already supports DataTextures and remains portable in unit tests.
  return new T.MeshStandardMaterial({
    color,
    metalness: 0.72,
    roughness: Math.min(1, roughness + 0.12),
    map,
    roughnessMap: metalRoughness,
    metalnessMap: metalRoughness,
    normalMap: texture(normals),
    normalScale: new T.Vector2(0.13, -0.13),
  });
}

function add(
  parent: T.Object3D,
  geometry: T.BufferGeometry,
  material: T.Material | T.Material[],
  name: string,
) {
  const m = new T.Mesh(geometry, material);
  m.name = name;
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
function oval(
  parent: T.Object3D,
  mat: T.Material,
  name: string,
  position: number[],
  scale: number[],
) {
  const m = add(parent, new T.SphereGeometry(1, 40, 28), mat, name);
  m.position.copy(vec(position));
  m.scale.copy(vec(scale));
  return m;
}
/** A closed, varying elliptic loft; sections follow the transported curve frame. */
export function loft(
  points: number[][],
  widths: number[],
  depths: number[],
  segments = 90,
  sides = 24,
) {
  const curve = new T.CatmullRomCurve3(points.map(vec));
  const frames = curve.computeFrenetFrames(segments, false),
    vertices: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const initial = new T.Vector3(1, 0, 0)
    .addScaledVector(frames.tangents[0], -frames.tangents[0].x)
    .normalize();
  const twist = Math.atan2(initial.dot(frames.binormals[0]), initial.dot(frames.normals[0]));
  for (let i = 0; i <= segments; i++) {
    const n = frames.normals[i].clone(),
      b = frames.binormals[i].clone();
    frames.normals[i].copy(n).multiplyScalar(Math.cos(twist)).addScaledVector(b, Math.sin(twist));
    frames.binormals[i]
      .copy(b)
      .multiplyScalar(Math.cos(twist))
      .addScaledVector(n, -Math.sin(twist));
  }
  for (let i = 0; i <= segments; i++) {
    const t = i / segments,
      p = curve.getPointAt(t),
      f = t * (widths.length - 1),
      j = Math.min(widths.length - 2, Math.floor(f));
    const w = T.MathUtils.lerp(widths[j], widths[j + 1], f - j),
      d = T.MathUtils.lerp(depths[j], depths[j + 1], f - j);
    for (let k = 0; k <= sides; k++) {
      const a = (k / sides) * Math.PI * 2;
      vertices.push(
        ...p
          .clone()
          .addScaledVector(frames.normals[i], Math.cos(a) * w)
          .addScaledVector(frames.binormals[i], Math.sin(a) * d)
          .toArray(),
      );
      uvs.push(k / sides, i / segments);
      if (i < segments && k < sides) {
        const n = i * (sides + 1) + k;
        indices.push(n, n + 1, n + sides + 1, n + 1, n + sides + 2, n + sides + 1);
      }
    }
  }
  for (const end of [0, segments]) {
    const c = vertices.length / 3;
    vertices.push(...curve.getPointAt(end / segments).toArray());
    uvs.push(0.5, 0.5);
    for (let k = 0; k < sides; k++) {
      const n = end * (sides + 1) + k;
      indices.push(...(end === 0 ? [c, n + 1, n] : [c, n, n + 1]));
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  return g;
}
function presentation(root: T.Group, name: string) {
  const g = new T.Group();
  g.name = name;
  g.userData.motion = 'display';
  root.add(g);
  return g;
}
export function spiral(root: T.Group) {
  const display = presentation(root, 'Spiral_Display'),
    shell = new T.Group();
  shell.name = 'Nautilus_Shell';
  shell.position.set(-0.12, 1.37, 0);
  shell.rotation.z = 0.19;
  shell.rotation.y = 1.12;
  display.add(shell);
  const vertices: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  const steps = 560,
    sides = 64;
  const cream = new T.Color('#d7c5a1'),
    umber = new T.Color('#8c6c48');
  // Expanding whorl with a broad lenticular section; double wall leaves a genuine aperture.
  for (let wall = 0; wall < 2; wall++)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps,
        a = -Math.PI * 4.1 + t * Math.PI * 4.65,
        r = 0.045 * Math.exp(t * 3.22) * (1 + 0.0025 * Math.sin(a * 55)),
        thickness = wall === 0 ? 1 : 0.956;
      for (let k = 0; k <= sides; k++) {
        const b = (k / sides) * Math.PI * 2,
          radial = r + Math.cos(b) * r * 0.76 * thickness;
        vertices.push(
          Math.cos(a) * radial,
          Math.sin(a) * radial,
          Math.sin(b) * r * 0.56 * thickness,
        );
        const stripe = Math.max(0, Math.sin(a * 12 + Math.sin(b) * 0.8)) ** 12;
        colors.push(
          ...cream
            .clone()
            .lerp(umber, wall ? 0.3 : stripe * 0.63)
            .toArray(),
        );
        if (i < steps && k < sides) {
          const n = wall * (steps + 1) * (sides + 1) + i * (sides + 1) + k;
          const q = [n, n + sides + 1, n + 1, n + 1, n + sides + 1, n + sides + 2];
          indices.push(...(wall === 0 ? q : q.reverse()));
        }
      }
    }
  const off = (steps + 1) * (sides + 1);
  for (const i of [0, steps])
    for (let k = 0; k < sides; k++) {
      const n = i * (sides + 1) + k;
      const lip = [n, n + 1, n + off, n + 1, n + off + 1, n + off];
      indices.push(...(i === steps ? lip.reverse() : lip));
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const surfaceIndices = steps * sides * 6;
  geo.addGroup(0, surfaceIndices, 0);
  geo.addGroup(surfaceIndices, surfaceIndices, 1);
  geo.addGroup(surfaceIndices * 2, sides * 12, 1);
  add(
    shell,
    geo,
    [
      new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.56 }),
      new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.12 }),
    ],
    'Shell_Whorl_And_Aperture',
  );
  const brass = metal('#645441', 0.6);
  oval(display, brass, 'Shell_Mount_Foot', [-0.55, 0.125, -0.16], [0.095, 0.02, 0.09]);
  shell.updateMatrix();
  const positions = geo.getAttribute('position');
  let contact = new T.Vector3(0, Infinity, 0);
  for (let i = 0; i < positions.count; i++) {
    const point = new T.Vector3().fromBufferAttribute(positions, i).applyMatrix4(shell.matrix);
    if (point.y < contact.y) contact = point;
  }
  add(
    display,
    loft(
      [
        [-0.55, 0.14, -0.16],
        [-0.48, contact.y * 0.58, -0.16],
        [contact.x, contact.y - 0.015, contact.z],
      ],
      [0.042, 0.034, 0.024],
      [0.042, 0.034, 0.024],
    ),
    brass,
    'Shell_Display_Arm',
  );
  oval(display, brass, 'Shell_Fitted_Saddle', contact.toArray(), [0.14, 0.04, 0.11]);
}
export function vajra(root: T.Group) {
  const display = presentation(root, 'Vajra_Display');
  const g = new T.Group();
  g.name = 'Vajra_Instrument';
  display.add(g);
  g.rotation.z = -0.28;
  g.position.y = 1.4;
  const bronze = metal('#897554', 0.47),
    dark = metal('#534d3c', 0.64);
  const profile = [
    [0.075, -0.355],
    [0.1, -0.32],
    [0.135, -0.23],
    [0.155, 0],
    [0.135, 0.23],
    [0.1, 0.32],
    [0.075, 0.355],
  ].map(([r, y]) => new T.Vector2(r, y));
  add(g, new T.LatheGeometry(profile, 48), bronze, 'Vajra_Fitted_Grip');
  for (const end of [-1, 1]) {
    const collar = [
      [0.085, 0.3],
      [0.16, 0.34],
      [0.22, 0.41],
      [0.225, 0.455],
      [0.19, 0.49],
      [0.12, 0.52],
    ].map(([r, y]) => new T.Vector2(r, end * y));
    if (end < 0) collar.reverse();
    add(g, new T.LatheGeometry(collar, 48), dark, `Vajra_Lotus_Collar_${end}`);
    for (let petal = 0; petal < 8; petal++) {
      const a = (petal * Math.PI) / 4;
      const leaf = oval(
        g,
        bronze,
        `Vajra_Collar_Relief_${end}_${petal}`,
        [Math.cos(a) * 0.188, end * 0.415, Math.sin(a) * 0.188],
        [0.043, 0.1, 0.012],
      );
      leaf.rotation.y = -a + Math.PI / 2;
    }
    add(
      g,
      loft(
        [
          [0, end * 0.47, 0],
          [0, end * 0.9, 0],
          [0, end * 1.29, 0],
        ],
        [0.052, 0.035, 0.01],
        [0.052, 0.035, 0.01],
        40,
        12,
      ),
      bronze,
      `Vajra_Axial_Prong_${end}`,
    );
    for (let k = 0; k < 4; k++) {
      const angle = (k * Math.PI) / 2 + 0.3;
      const points = [
        [Math.cos(angle) * 0.13, end * 0.49, Math.sin(angle) * 0.13],
        [Math.cos(angle) * 0.24, end * 0.63, Math.sin(angle) * 0.24],
        [Math.cos(angle) * 0.35, end * 0.93, Math.sin(angle) * 0.35],
        [Math.cos(angle) * 0.19, end * 1.2, Math.sin(angle) * 0.19],
        [0, end * 1.31, 0],
      ];
      add(
        g,
        loft(points, [0.06, 0.061, 0.05, 0.035, 0.014], [0.035, 0.038, 0.028, 0.022, 0.012], 70, 8),
        bronze,
        `Vajra_Pierced_Lobe_${end}_${k}`,
      );
    }
    oval(g, bronze, `Vajra_Joined_Tip_${end}`, [0, end * 1.3, 0], [0.055, 0.09, 0.055]);
  }
  const support = metal('#504d43', 0.72);
  oval(display, support, 'Vajra_Mount_Foot', [0.19, 0.125, -0.18], [0.075, 0.02, 0.075]);
  add(
    display,
    loft(
      [
        [0.19, 0.14, -0.18],
        [0.19, 0.63, -0.18],
        [-0.08, 1.1, -0.1],
      ],
      [0.035, 0.03, 0.024],
      [0.035, 0.03, 0.024],
    ),
    support,
    'Vajra_Museum_Support',
  );
}
