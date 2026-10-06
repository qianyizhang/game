import * as T from 'three';
import { spiral, vajra } from './newStudies';
import { hydra } from './hydra';
import { phoenix } from './phoenix';
import { nightjar } from './nightjar';

export type StudyId = 'nightjar' | 'catalyst' | 'phoenix' | 'hydra' | 'spiral' | 'vajra';
export type Study = {
  id: StudyId;
  name: string;
  family: string;
  material: string;
  accent: string;
  description: string;
  details: [string, string, string];
};
export const STUDIES: Study[] = [
  {
    id: 'nightjar',
    name: 'Nightjar',
    family: 'BLINDSIDE / JOKER',
    material: 'Dusk plumage · ash, umber & pale throat',
    accent: '#c69b57',
    description:
      'A dusk-plumaged nightjar crouches along a rising branch, listening with its small bill turned toward the open air. Layered folded wings follow the body into a descending tail, above short toes wrapped around the bark.',
    details: [
      'Listening posture & fitted folded wings',
      'Continuous crown, chest & layered plumage',
      'Head turn, brief blink & quiet feather response',
    ],
  },
  {
    id: 'catalyst',
    name: 'Catalyst',
    family: 'SLAY THE SPIRE / SILENT',
    material: 'Smoked glass · olive tincture · copper',
    accent: '#a9cb89',
    description:
      'A flattened glass decanter and a slender sample vial. Fitted copper collars and a suspended seal surround a dark olive tincture, with the liquid level visible through the glass.',
    details: [
      'Thin glass & distinct meniscus',
      'Rising bubbles in both vessels',
      'Fitted copper & a slender sample vial',
    ],
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    family: 'LAST HEARTH / ELEMENTAL',
    material: 'Ember plumage · charcoal vanes · warm ochre',
    accent: '#e39a61',
    description:
      'A living firebird settles from a wing stretch, lifting its breast as unequal wings open around it. Ember plumage turns to charcoal at the long flight feathers; a falling tail answers the sweep above a firm basalt grip.',
    details: [
      'Connected wings & overlapping flight planes',
      'Living breast, fitted bill & swept crest',
      'Rooted grip, neck turn & delayed tail motion',
    ],
  },
  {
    id: 'hydra',
    name: 'Hydra',
    family: 'LAST HEARTH / BEAST',
    material: 'Moss scales · weathered horn · living anatomy',
    accent: '#9daa89',
    description:
      'An ancient marsh predator gathers its weight into a heavy coil. Three armored necks rise in opposing gestures: one searches, one watches, one bares its teeth. Worn horn crowns, hooded amber eyes and a pale plated throat frame the living skin.',
    details: [
      'Rooted coil & independently bending necks',
      'Horn crowns, recessed eyes & hinged jaws',
      'Layered scales, worn keratin & watchful motion',
    ],
  },
  {
    id: 'spiral',
    name: 'Spiral',
    family: 'BLINDSIDE / JOKER',
    material: 'Cream shell · umber growth bands',
    accent: '#d0b486',
    description:
      'An expanding shell whorl with a deep open aperture and restrained umber bands, held by a small asymmetric museum mount.',
    details: [
      'Expanding lenticular whorl',
      'Open aperture & double shell wall',
      'Slow rigid display oscillation',
    ],
  },
  {
    id: 'vajra',
    name: 'Vajra',
    family: 'SLAY THE SPIRE / RELIC',
    material: 'Aged brass · recessed bronze',
    accent: '#c5ad77',
    description:
      'An aged metal instrument with a fitted grip and pierced curved lobes. Continuous joined tips enclose quiet negative spaces at either end.',
    details: [
      'Fitted central grip',
      'Pierced lobes & continuous joined tips',
      'Slow rigid display oscillation',
    ],
  },
];
const v = (p: number[]) => new T.Vector3(p[0], p[1], p[2]);
function noise(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function fieldNoise(x: number, y: number) {
  const ix = Math.floor(x),
    iy = Math.floor(y);
  const fx = T.MathUtils.smoothstep(x - ix, 0, 1),
    fy = T.MathUtils.smoothstep(y - iy, 0, 1);
  return T.MathUtils.lerp(
    T.MathUtils.lerp(noise(ix, iy), noise(ix + 1, iy), fx),
    T.MathUtils.lerp(noise(ix, iy + 1), noise(ix + 1, iy + 1), fx),
    fy,
  );
}
/** Local repeatable pigment/grain maps, embedded in GLB exports. */
function surface(
  color: string,
  kind: 'feather' | 'mottled' | 'plumage' | 'metal' | 'bark' | 'cork',
  roughness = 0.8,
) {
  const base = new T.Color(color).convertLinearToSRGB();
  const size = kind === 'plumage' ? 512 : 128;
  const pixels = new Uint8Array(size * size * 4),
    normals = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const grain = noise(x, y);
      const vein =
        kind === 'feather' || kind === 'mottled'
          ? Math.sin((y + Math.abs(x - size / 2) * 0.6) * 1.7)
          : Math.sin(x * 0.8 + Math.sin(y * 0.04) * 3);
      const fleck =
        (kind === 'feather' || kind === 'mottled') &&
        noise(Math.floor(x / 5), Math.floor(y / 8)) > 0.73;
      const mottling =
        kind === 'mottled'
          ? 0.2 * Math.sin(y * 0.26 + Math.abs(x - size / 2) * 0.09) +
            0.14 * (noise(Math.floor(x / 13), Math.floor(y / 10)) - 0.5)
          : 0;
      // Cryptic markings vary at several scales; avoid sinusoidal bands on the torso.
      const plumage =
        kind === 'plumage'
          ? (fieldNoise(x / 21, y / 31) - 0.5) * 0.34 +
            (fieldNoise(x / 4, y / 13) - 0.5) * 0.25 +
            (grain > 0.88 ? 0.09 : 0) +
            Math.sin(x * 1.9 + y * 0.7) * 0.014
          : 0;
      const shade =
        plumage +
        (fleck ? 0.77 : 0.9) +
        grain * (kind === 'metal' ? 0.04 : 0.07) +
        (kind === 'metal' ? (fieldNoise(x / 18, y / 24) - 0.5) * 0.1 : 0) +
        vein * (kind === 'metal' ? 0.009 : 0.025) +
        mottling;
      const k = (y * size + x) * 4;
      pixels[k] = Math.round(base.r * 255 * shade);
      pixels[k + 1] = Math.round(base.g * 255 * shade);
      pixels[k + 2] = Math.round(base.b * 255 * shade);
      pixels[k + 3] = 255;
      normals[k] = 128 + Math.round(vein * (kind === 'metal' || kind === 'plumage' ? 3 : 12));
      normals[k + 1] =
        128 + Math.round((grain - 0.5) * (kind === 'metal' || kind === 'plumage' ? 4 : 16));
      normals[k + 2] = 252;
      normals[k + 3] = 255;
    }
  const map = new T.DataTexture(pixels, size, size);
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.magFilter = T.LinearFilter;
  map.minFilter = T.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.needsUpdate = true;
  const normalMap = new T.DataTexture(normals, size, size);
  normalMap.wrapS = normalMap.wrapT = T.RepeatWrapping;
  normalMap.magFilter = T.LinearFilter;
  normalMap.minFilter = T.LinearMipmapLinearFilter;
  normalMap.generateMipmaps = true;
  normalMap.needsUpdate = true;
  return new T.MeshStandardMaterial({
    color: '#ffffff',
    map,
    normalMap,
    // OpenGL normal convention; Three's derivative tangent basis reverses Y.
    // The same convention lets GLTFExporter embed these DataTextures directly.
    normalScale: new T.Vector2(0.18, -0.18),
    roughness,
    metalness: kind === 'metal' ? 0.8 : 0,
  });
}
function material(color: string, metalness = 0, roughness = 0.75) {
  return new T.MeshStandardMaterial({ color, metalness, roughness });
}
function mesh(
  parent: T.Object3D,
  geometry: T.BufferGeometry,
  mat: T.Material,
  name: string,
  position = [0, 0, 0],
) {
  const object = new T.Mesh(geometry, mat);
  object.name = name;
  object.position.copy(v(position));
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
function oval(
  parent: T.Object3D,
  mat: T.Material,
  name: string,
  position: number[],
  scale: number[],
  tilt = 0,
) {
  const object = mesh(parent, new T.SphereGeometry(1, 24, 16), mat, name, position);
  object.scale.copy(v(scale));
  object.rotation.z = tilt;
  return object;
}
function tube(
  parent: T.Object3D,
  points: number[][],
  radius: number,
  mat: T.Material,
  name: string,
  segments = 28,
  radialSegments = 6,
) {
  return mesh(
    parent,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map(v)),
      segments,
      radius,
      radialSegments,
      false,
    ),
    mat,
    name,
  );
}
function part(root: T.Group, name: string, explode: number[]) {
  const group = new T.Group();
  group.name = name;
  group.userData.explode = explode;
  root.add(group);
  return group;
}
function ring(
  parent: T.Object3D,
  radius: number,
  thickness: number,
  mat: T.Material,
  name: string,
  y: number,
) {
  const object = mesh(parent, new T.TorusGeometry(radius, thickness, 8, 64), mat, name, [0, y, 0]);
  object.rotation.x = Math.PI / 2;
  return object;
}
function bottle(parent: T.Object3D, scale: number, position: number[], name: string) {
  const group = new T.Group();
  group.name = name;
  group.position.copy(v(position));
  group.scale.set(scale * 0.82, scale, scale * 0.7);
  parent.add(group);
  const copper = surface('#986b46', 'metal', 0.36),
    darkCopper = surface('#5c4935', 'metal', 0.5);
  const cork = surface('#69543b', 'cork', 0.95);
  const glass = new T.MeshPhysicalMaterial({
    color: '#f3f6ec',
    roughness: 0.025,
    transmission: 1,
    transparent: true,
    depthWrite: false,
    thickness: 0.035,
    ior: 1.46,
    metalness: 0,
    side: T.FrontSide,
    attenuationColor: new T.Color('#d7e6d1'),
    attenuationDistance: 3,
  });
  const outer = [
    [0, 0.16],
    [0.32, 0.16],
    [0.57, 0.19],
    [0.72, 0.31],
    [0.81, 0.57],
    [0.83, 0.83],
    [0.81, 1.04],
    [0.69, 1.27],
    [0.5, 1.46],
    [0.29, 1.63],
    [0.205, 1.76],
    [0.2, 2.16],
    [0.23, 2.18],
    [0.23, 2.25],
  ];
  const inner = [
    [0.177, 2.25],
    [0.171, 1.78],
    [0.26, 1.65],
    [0.47, 1.47],
    [0.65, 1.29],
    [0.775, 1.03],
    [0.795, 0.82],
    [0.777, 0.58],
    [0.69, 0.34],
    [0.55, 0.235],
    [0.31, 0.218],
    [0, 0.218],
  ];
  const profile = new T.SplineCurve([...outer, ...inner].map((p) => new T.Vector2(p[0], p[1])))
    .getPoints(200)
    .map((p) => new T.Vector2(Math.max(0, p.x), p.y));
  const vesselGeometry = new T.LatheGeometry(profile, 128);
  const positions = vesselGeometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      y = positions.getY(i),
      z = positions.getZ(i),
      angle = Math.atan2(x, z);
    // Subtle hand-blown fluting catches the softboxes without distorting the liquid level.
    const waviness =
      1 + 0.0018 * Math.sin(angle * 16 + y * 4) + 0.0007 * Math.cos(angle * 27 - y * 5);
    positions.setXYZ(i, x * waviness, y, z * waviness);
  }
  vesselGeometry.computeVertexNormals();
  mesh(group, vesselGeometry, glass, `${name}_BlownGlass`);
  const poison = new T.MeshPhysicalMaterial({
    color: '#343d20',
    roughness: 0.07,
    transmission: 0,
    transparent: true,
    opacity: 0.64,
    depthWrite: false,
    thickness: 1.1,
    ior: 1.333,
    metalness: 0,
    attenuationColor: new T.Color('#88973c'),
    attenuationDistance: 0.55,
    side: T.FrontSide,
  });
  const liquidProfile = [
    [0, 0.225],
    [0.3, 0.225],
    [0.54, 0.245],
    [0.68, 0.35],
    [0.763, 0.59],
    [0.783, 0.83],
    [0.76, 1.02],
    [0.745, 1.03],
    [0.71, 1.015],
    [0, 1.015],
  ];
  mesh(
    group,
    new T.LatheGeometry(
      liquidProfile.map((p) => new T.Vector2(p[0], p[1])),
      96,
    ),
    poison,
    `${name}_Liquid`,
  );
  ring(group, 0.739, 0.0035, material('#646849', 0.1, 0.2), `${name}_Meniscus`, 1.02);
  const ripple = ring(
    group,
    0.42,
    0.002,
    material('#7e8260', 0.1, 0.22),
    `${name}_SurfaceRipple`,
    1.023,
  );
  ripple.userData.motion = 'ripple';
  // A close-fitting chased collar and a capped cork stopper, rather than loose decorative rings.
  mesh(
    group,
    new T.LatheGeometry(
      [
        [0.21, 1.91],
        [0.23, 1.925],
        [0.23, 2.06],
        [0.209, 2.07],
        [0.207, 1.91],
      ].map((p) => new T.Vector2(...(p as [number, number]))),
      64,
    ),
    copper,
    `${name}_CopperSleeve`,
  );
  for (const y of [1.927, 1.947, 2.046, 2.065])
    ring(group, 0.23, 0.004, darkCopper, `${name}_CollarBead_${y}`, y);
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    tube(
      group,
      [
        [Math.cos(angle) * 0.232, 1.974, Math.sin(angle) * 0.232],
        [Math.cos(angle + 0.045) * 0.232, 2.018, Math.sin(angle + 0.045) * 0.232],
      ],
      0.0015,
      darkCopper,
      `${name}_CollarChasing_${i}`,
    );
  }
  mesh(group, new T.CylinderGeometry(0.176, 0.162, 0.19, 48), cork, `${name}_Cork`, [0, 2.275, 0]);
  mesh(
    group,
    new T.LatheGeometry(
      [
        [0, 2.353],
        [0.185, 2.353],
        [0.22, 2.373],
        [0.229, 2.396],
        [0.212, 2.419],
        [0.15, 2.429],
        [0, 2.429],
      ].map((p) => new T.Vector2(...(p as [number, number]))),
      64,
    ),
    copper,
    `${name}_StopperCrown`,
  );
  ring(group, 0.213, 0.004, darkCopper, `${name}_StopperRim`, 2.407);
  const finial = mesh(
    group,
    new T.TorusGeometry(0.062, 0.012, 12, 40),
    copper,
    `${name}_StopperHandle`,
    [0, 2.486, 0],
  );
  finial.rotation.y = -0.28;
  // Six ribs cradle the glass; their curved shoulders leave most of the vessel visible.
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.1;
    const point = (r: number, y: number, twist = 0) => [
      Math.sin(angle + twist) * r,
      y,
      Math.cos(angle + twist) * r,
    ];
    tube(
      group,
      [
        point(0.56, 0.206),
        point(0.752, 0.34),
        point(0.842, 0.78),
        point(0.713, 1.265),
        point(0.226, 1.785),
      ],
      0.011,
      copper,
      `${name}_CopperRib_${i}`,
    );
    oval(group, copper, `${name}_FootRivet_${i}`, point(0.735, 0.34), [0.016, 0.016, 0.016]);
  }
  ring(group, 0.564, 0.012, copper, `${name}_FootBead`, 0.206);
  ring(group, 0.725, 0.008, darkCopper, `${name}_LowerGirdle`, 0.326);
  const bubble = new T.MeshPhysicalMaterial({
    color: '#9eaa81',
    roughness: 0.03,
    transmission: 0,
    thickness: 0.014,
    ior: 1.05,
    transparent: true,
    opacity: 0.45,
  });
  for (let i = 0; i < 9; i++) {
    const a = i * 2.399,
      r = 0.006 + (i % 3) * 0.004;
    const object = oval(
      group,
      bubble,
      `${name}_Bubble_${i}`,
      [Math.cos(a) * (0.15 + (i % 3) * 0.12), 0.3 + (i / 9) * 0.67, Math.sin(a) * 0.31],
      [r, r, r],
    );
    object.userData.motion = 'bubble';
    object.userData.phase = i / 9;
    object.userData.liquidRange = [0.29, 1.01];
  }
  const etched = material('#abb6a4', 0.1, 0.67);
  for (let i = 0; i < 6; i++) {
    const y = 1.08 + i * 0.056,
      z = 0.81 - i * 0.045;
    tube(
      group,
      [
        [-0.045 - (i % 2 ? 0 : 0.025), y, z],
        [0.05, y, z],
      ],
      0.0015,
      etched,
      `${name}_Graduation_${i}`,
    );
  }
  // A small stamped, suspended seal keeps the front of the glass uncluttered.
  const seal = mesh(
    group,
    new T.CylinderGeometry(0.081, 0.081, 0.012, 48),
    darkCopper,
    `${name}_Seal`,
    [0.3, 1.797, 0.225],
  );
  seal.rotation.x = Math.PI / 2;
  seal.rotation.z = -0.2;
  const rim = mesh(
    group,
    new T.TorusGeometry(0.076, 0.003, 8, 40),
    copper,
    `${name}_SealRim`,
    [0.3, 1.797, 0.234],
  );
  rim.rotation.z = -0.2;
  tube(
    group,
    [
      [0.12, 2.03, 0.19],
      [0.25, 1.975, 0.24],
      [0.3, 1.875, 0.228],
    ],
    0.003,
    darkCopper,
    `${name}_SealChain`,
  );
  tube(
    group,
    [
      [0.26, 1.766, 0.235],
      [0.3, 1.837, 0.235],
      [0.34, 1.766, 0.235],
      [0.26, 1.766, 0.235],
    ],
    0.002,
    copper,
    `${name}_AlchemicalSeal`,
  );
  return group;
}
function catalyst(root: T.Group) {
  const vessel = part(root, 'CatalystVessel', [0.2, 0.3, 0]);
  bottle(vessel, 1, [0.27, 0.01, -0.025], 'Main');
  const companion = part(root, 'CatalystCompanion', [-0.5, 0.05, 0.2]);
  const vial = bottle(companion, 0.52, [-0.68, 0.05, 0.24], 'Companion');
  vial.scale.x *= 0.57;
  vial.scale.z *= 0.65;
  const stand = part(root, 'CatalystStand', [0, -0.1, 0]);
  const copper = surface('#8a704b', 'metal', 0.44),
    slate = surface('#232c2a', 'metal', 0.63);
  mesh(
    stand,
    new T.CylinderGeometry(1.15, 1.15, 0.028, 96),
    slate,
    'EngravedAlchemyPlate',
    [0, 0.124, 0],
  );
  ring(stand, 1.07, 0.004, copper, 'AlchemyCircle', 0.14);
  ring(stand, 1.135, 0.003, copper, 'OuterCircle', 0.14);
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    tube(
      stand,
      [
        [
          Math.cos(a) * (i % 4 === 0 ? 1.078 : 1.107),
          0.14,
          Math.sin(a) * (i % 4 === 0 ? 1.078 : 1.107),
        ],
        [Math.cos(a) * 1.13, 0.14, Math.sin(a) * 1.13],
      ],
      0.0015,
      copper,
      `PlateDivision_${i}`,
    );
  }
}
/** Construct the registered asset and preserve its assembled inspection transforms. */
export function createStudy(id: StudyId) {
  const root = new T.Group();
  root.name = `Study_${id}`;
  ({ nightjar, catalyst, phoenix, hydra, spiral, vajra })[id](root);
  const geometries = new Set<T.BufferGeometry>();
  const normal = new T.Vector3();
  root.traverse((object) => {
    if (object instanceof T.Mesh && !geometries.has(object.geometry)) {
      geometries.add(object.geometry);
      const normals = object.geometry.getAttribute('normal');
      if (normals)
        for (let i = 0; i < normals.count; i++) {
          normal.fromBufferAttribute(normals, i);
          // Collapsed tips and lathe seams can leave zero or short normals.
          // Match GLTFExporter's correction here so preview and export agree.
          if (normal.lengthSq() === 0) normal.set(1, 0, 0);
          else normal.normalize();
          normals.setXYZ(i, normal.x, normal.y, normal.z);
        }
    }
    object.userData.home = object.position.toArray();
    object.userData.restScale = object.scale.toArray();
    object.userData.restQuaternion = object.quaternion.toArray();
  });
  return root;
}
export function explodeStudy(root: T.Group, amount: number) {
  for (const child of root.children) {
    const home = child.userData.home as number[],
      offset = child.userData.explode as number[];
    if (home && offset) child.position.copy(v(home)).addScaledVector(v(offset), amount);
  }
}
export function disposeObject(root: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>(),
    textures = new Set<T.Texture>(),
    skeletons = new Set<T.Skeleton>();
  root.traverse((object) => {
    if (object instanceof T.SkinnedMesh) skeletons.add(object.skeleton);
    if (object instanceof T.Mesh) {
      geometries.add(object.geometry);
      for (const mat of Array.isArray(object.material) ? object.material : [object.material])
        materials.add(mat);
    }
  });
  materials.forEach((mat) => {
    for (const value of Object.values(mat)) if (value instanceof T.Texture) textures.add(value);
    mat.dispose();
  });
  textures.forEach((texture) => texture.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  skeletons.forEach((skeleton) => skeleton.dispose());
}
