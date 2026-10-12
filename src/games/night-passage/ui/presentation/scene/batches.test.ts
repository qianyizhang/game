import * as T from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { expect, it, vi } from 'vitest';
import { disposeObject } from '../../../../../shared/three/resources';
import { isSkinnedMesh } from '../../../../../shared/three/objects';
import { batchEnemyAsset, shareSkeletons } from './batches';

// Two-bone weighted triangles expose lost weights, wrong bind space and index offsets.
// Native/browser coverage compares the delivered family assets at every authored frame.
function geometry(x: number) {
  const result = new T.BufferGeometry();
  result.setAttribute('position', new T.Float32BufferAttribute([x, 0, 0, x + 1, 0, 0, x, 1, 0], 3));
  result.setAttribute('normal', new T.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  result.setAttribute(
    'skinIndex',
    new T.Uint8BufferAttribute([0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0], 4),
  );
  result.setAttribute(
    'skinWeight',
    new T.Float32BufferAttribute([1, 0, 0, 0, 0.25, 0.75, 0, 0, 0, 1, 0, 0], 4),
  );
  result.setIndex([0, 1, 2]);
  return result;
}

function asset() {
  const scene = new T.Group(),
    body = new T.MeshStandardMaterial();
  body.name = 'body';
  const light = new T.MeshStandardMaterial({ emissive: 0xff7700, emissiveIntensity: 1.2 });
  light.name = 'lantern';
  const root = new T.Bone(),
    joint = new T.Bone();
  root.name = 'RigRoot';
  joint.name = 'Joint';
  joint.position.y = 1;
  root.add(joint);
  scene.add(root);
  scene.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([root, joint]);
  function surface(name: string, x: number, material = body) {
    const mesh = new T.SkinnedMesh(geometry(x), material);
    mesh.name = name;
    mesh.bind(skeleton, new T.Matrix4());
    scene.add(mesh);
    return mesh;
  }
  const a = surface('arm', 0),
    b = surface('body', 2);
  const arrow = surface('Reed_arrow', 4),
    lantern = surface('lantern', 6, light);
  const animations = [
    new T.AnimationClip('attack', 1, [
      new T.NumberKeyframeTrack('RigRoot.position[x]', [0, 1], [0, 1]),
      new T.NumberKeyframeTrack('Joint.position[x]', [0, 1], [0, 2]),
    ]),
  ];
  return { gltf: { scene, animations } as GLTF, a, b, arrow, lantern, body, light, skeleton };
}

function meshes(root: T.Object3D) {
  const result: T.SkinnedMesh[] = [];
  root.traverse((object) => {
    if (isSkinnedMesh(object)) result.push(object);
  });
  return result;
}

function worldVertex(mesh: T.SkinnedMesh, index: number) {
  const result = new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.position, index);
  return mesh.applyBoneTransform(index, result).applyMatrix4(mesh.matrixWorld);
}

function mixer(root: T.Object3D, clip: T.AnimationClip) {
  const result = new T.AnimationMixer(root),
    action = result.clipAction(clip);
  action.setLoop(T.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  return result;
}

it('preserves weighted surfaces, topology, normals and materials while reducing drawable meshes', () => {
  const reference = asset(),
    candidate = asset();
  const oldA = candidate.a.geometry,
    oldB = candidate.b.geometry;
  const releasedA = vi.spyOn(oldA, 'dispose'),
    releasedB = vi.spyOn(oldB, 'dispose');
  const materialRelease = vi.spyOn(candidate.body, 'dispose');
  // Deliberately cached component bounds must not survive as the batch bounds.
  candidate.a.computeBoundingBox();
  candidate.a.computeBoundingSphere();
  batchEnemyAsset(candidate.gltf);
  const merged = meshes(candidate.gltf.scene).find(
    (mesh) => mesh !== candidate.arrow && mesh !== candidate.lantern,
  )!;
  expect(meshes(candidate.gltf.scene)).toHaveLength(3);
  expect(merged.material).toBe(candidate.body);
  expect(candidate.lantern.material).toBe(candidate.light);
  expect(candidate.light.emissive.getHex()).toBe(0xff7700);
  expect(candidate.light.emissiveIntensity).toBe(1.2);
  expect(Array.from(merged.geometry.index!.array)).toEqual([0, 1, 2, 3, 4, 5]);
  for (const name of ['position', 'normal', 'skinIndex', 'skinWeight']) {
    expect(Array.from(merged.geometry.attributes[name].array)).toEqual([
      ...Array.from(reference.a.geometry.attributes[name].array),
      ...Array.from(reference.b.geometry.attributes[name].array),
    ]);
  }
  expect(merged.boundingBox.max.x).toBe(3);
  expect(releasedA).toHaveBeenCalledOnce();
  expect(releasedB).toHaveBeenCalledOnce();
  expect(materialRelease).not.toHaveBeenCalled();
  const referenceMixer = mixer(reference.gltf.scene, reference.gltf.animations[0]);
  const candidateMixer = mixer(candidate.gltf.scene, candidate.gltf.animations[0]);
  for (const phase of [0, 0.2, 0.45, 0.5, 0.9, 1]) {
    for (const [fixture, clock] of [
      [reference, referenceMixer],
      [candidate, candidateMixer],
    ] as const) {
      fixture.gltf.scene.position.set(7, 3, 2);
      fixture.gltf.scene.rotation.y = 0.31;
      fixture.gltf.scene.scale.setScalar(28);
      clock.setTime(phase);
      fixture.gltf.scene.updateMatrixWorld(true);
    }
    for (let i = 0; i < 6; i++) {
      const component = i < 3 ? reference.a : reference.b;
      const actual = worldVertex(merged, i),
        expected = worldVertex(component, i % 3);
      expect(actual.distanceTo(expected)).toBeLessThan(1e-5);
      // Independent analytical oracle: root translation + weighted child translation.
      const local = new T.Vector3().fromBufferAttribute(
        component.geometry.attributes.position,
        i % 3,
      );
      const childWeight = component.geometry.attributes.skinWeight.getY(i % 3);
      local.x += phase * (1 + 2 * childWeight);
      expect(actual.distanceTo(local.applyMatrix4(reference.gltf.scene.matrixWorld))).toBeLessThan(
        1e-5,
      );
    }
  }
  const releasedBatch = vi.spyOn(merged.geometry, 'dispose');
  const releasedArrow = vi.spyOn(candidate.arrow.geometry, 'dispose');
  batchEnemyAsset(candidate.gltf); // A second call cannot duplicate or release the live batch.
  expect(releasedBatch).not.toHaveBeenCalled();
  disposeObject(candidate.gltf.scene);
  expect(releasedA).toHaveBeenCalledOnce();
  expect(releasedB).toHaveBeenCalledOnce();
  expect(releasedBatch).toHaveBeenCalledOnce();
  expect(releasedArrow).toHaveBeenCalledOnce();
  expect(materialRelease).toHaveBeenCalledOnce();
});

it('keeps the nocked arrow independently visible and retains geometry still owned by it', () => {
  const fixture = asset();
  fixture.arrow.geometry.dispose();
  fixture.arrow.geometry = fixture.a.geometry;
  const retained = vi.spyOn(fixture.a.geometry, 'dispose');
  batchEnemyAsset(fixture.gltf);
  expect(fixture.gltf.scene.getObjectByName('Reed_arrow')).toBe(fixture.arrow);
  const batch = meshes(fixture.gltf.scene).find(
    (mesh) => mesh !== fixture.arrow && mesh !== fixture.lantern,
  )!;
  fixture.arrow.visible = false;
  expect(batch.visible).toBe(true);
  expect(retained).not.toHaveBeenCalled();
  disposeObject(fixture.gltf.scene);
  expect(retained).toHaveBeenCalledOnce();
});

type Fixture = ReturnType<typeof asset>;
const incompatible: [string, (fixture: Fixture) => void][] = [
  [
    'mesh animation by name',
    (f) =>
      f.gltf.animations.push(
        new T.AnimationClip('mesh', 1, [
          new T.NumberKeyframeTrack('body.position[x]', [0, 1], [0, 1]),
        ]),
      ),
  ],
  [
    'mesh animation by UUID',
    (f) =>
      f.gltf.animations.push(
        new T.AnimationClip('mesh', 1, [
          new T.NumberKeyframeTrack(`${f.b.uuid}.visible`, [0, 1], [1, 0]),
        ]),
      ),
  ],
  [
    'local transform mismatch',
    (f) => {
      f.b.position.x = 1;
    },
  ],
  [
    'bind transform mismatch',
    (f) => {
      f.b.bindMatrix.makeTranslation(1, 0, 0);
    },
  ],
  [
    'different sibling parent',
    (f) => {
      const parent = new T.Group();
      f.gltf.scene.add(parent);
      parent.add(f.b);
    },
  ],
  [
    'different skeleton',
    (f) => {
      f.b.skeleton = f.skeleton.clone();
    },
  ],
  [
    'transparent material',
    (f) => {
      f.body.transparent = true;
    },
  ],
  [
    'mesh children',
    (f) => {
      f.a.add(new T.Object3D());
    },
  ],
  [
    'morph target',
    (f) => {
      f.b.geometry.morphAttributes.position = [f.b.geometry.attributes.position.clone()];
    },
  ],
  [
    'attribute layout mismatch',
    (f) => {
      f.b.geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(new Uint16Array(12), 4));
    },
  ],
];
it.each(incompatible)('leaves an incompatible delivery unchanged: %s', (_reason, change) => {
  const fixture = asset();
  change(fixture);
  const surfaces = meshes(fixture.gltf.scene),
    parents = surfaces.map((mesh) => mesh.parent);
  const releases = surfaces.map((mesh) => vi.spyOn(mesh.geometry, 'dispose'));
  batchEnemyAsset(fixture.gltf);
  expect(meshes(fixture.gltf.scene)).toEqual(surfaces);
  expect(surfaces.map((mesh) => mesh.parent)).toEqual(parents);
  for (const release of releases) expect(release).not.toHaveBeenCalled();
});

it('shares each cloned rig privately and releases only its redundant skeletons', () => {
  const fixture = asset();
  batchEnemyAsset(fixture.gltf);
  const first = clone(fixture.gltf.scene),
    second = clone(fixture.gltf.scene);
  const originals = meshes(first).map((mesh) => mesh.skeleton);
  const releases = originals.map((skeleton) => vi.spyOn(skeleton, 'dispose'));
  const libraryRelease = vi.spyOn(fixture.skeleton, 'dispose');
  shareSkeletons(first);
  shareSkeletons(second);
  const firstSurfaces = meshes(first),
    secondSurfaces = meshes(second);
  expect(new Set(firstSurfaces.map((mesh) => mesh.skeleton)).size).toBe(1);
  expect(new Set(secondSurfaces.map((mesh) => mesh.skeleton)).size).toBe(1);
  expect(firstSurfaces[0].skeleton).not.toBe(secondSurfaces[0].skeleton);
  expect(firstSurfaces[0].skeleton.bones[0]).not.toBe(secondSurfaces[0].skeleton.bones[0]);
  expect(firstSurfaces[0].geometry).toBe(secondSurfaces[0].geometry);
  expect(firstSurfaces[0].geometry).toBe(meshes(fixture.gltf.scene)[0].geometry);
  expect(releases[0]).not.toHaveBeenCalled();
  for (const release of releases.slice(1)) expect(release).toHaveBeenCalledOnce();
  expect(libraryRelease).not.toHaveBeenCalled();
  const firstMixer = mixer(first, fixture.gltf.animations[0]);
  firstMixer.setTime(0.2);
  first.updateMatrixWorld(true);
  const before = worldVertex(firstSurfaces[0], 1);
  const secondMixer = mixer(second, fixture.gltf.animations[0]);
  secondMixer.setTime(0.9);
  second.updateMatrixWorld(true);
  expect(worldVertex(firstSurfaces[0], 1).distanceTo(before)).toBe(0);
  expect(worldVertex(secondSurfaces[0], 1).distanceTo(before)).toBeGreaterThan(1);
  shareSkeletons(first);
  for (const release of releases.slice(1)) expect(release).toHaveBeenCalledOnce();
  firstSurfaces[0].skeleton.dispose();
  for (const release of releases) expect(release).toHaveBeenCalledOnce();
  expect(libraryRelease).not.toHaveBeenCalled();
});

it('retains skeletons with different bones or inverse binds without rebinding meshes', () => {
  const fixture = asset(),
    copy = clone(fixture.gltf.scene),
    surfaces = meshes(copy);
  surfaces[1].skeleton.boneInverses = surfaces[1].skeleton.boneInverses.map((inverse) =>
    inverse.clone(),
  );
  surfaces[1].skeleton.boneInverses[0].makeTranslation(1, 0, 0);
  surfaces[2].skeleton.bones = surfaces[2].skeleton.bones.map((bone) => bone.clone());
  const before = surfaces.map((mesh) => mesh.skeleton),
    inverseBind = surfaces[1].bindMatrixInverse.clone();
  const releases = before.map((skeleton) => vi.spyOn(skeleton, 'dispose'));
  shareSkeletons(copy);
  expect(surfaces[1].skeleton).toBe(before[1]);
  expect(surfaces[2].skeleton).toBe(before[2]);
  expect(surfaces[1].bindMatrixInverse.equals(inverseBind)).toBe(true);
  expect(releases[0]).not.toHaveBeenCalled();
  expect(releases[1]).not.toHaveBeenCalled();
  expect(releases[2]).not.toHaveBeenCalled();
  expect(releases[3]).toHaveBeenCalledOnce();
});
