import { isMesh, isSkinnedMesh } from '../../src/shared/three/objects';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createStudy } from '../../src/art3d/procedural/factory';
import type { StudyId } from '../../src/art3d/catalogue';
import { disposeObject } from '../../src/shared/three/resources';
import { createStudyClip } from '../../src/art3d/procedural/animation';
import { galleryDelivery } from '../../src/art3d/delivery';
import { compareSavedPoses } from './dcc-roundtrip';
import { loadPoseEvidence } from '../../packages/dcc-workbench/src/pose-evidence';

// Identical neutral lighting exposes exported material/mapping differences without
// requiring the gallery's display plinth or reflection room in the delivered GLB.
function renderPair(original: T.Object3D, imported: T.Object3D) {
  const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1100, 1100);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new T.Scene();
  scene.background = new T.Color('#252d2c');
  scene.add(new T.HemisphereLight('#f0e6d5', '#24313a', 1.2));
  for (const [position, color, intensity] of [
    [[-3, 7, 5], '#ffe9ce', 2.1],
    [[3, 3, -3], '#b0c9de', 1.8],
    [[2, 2, 5], '#d4e0df', 0.9],
  ] as [number[], string, number][]) {
    const light = new T.DirectionalLight(color, intensity);
    light.position.set(position[0], position[1], position[2]);
    scene.add(light);
  }
  const bounds = new T.Box3().setFromObject(original),
    center = bounds.getCenter(new T.Vector3()),
    radius = bounds.getBoundingSphere(new T.Sphere()).radius;
  const camera = new T.PerspectiveCamera(32, 1, 0.01, 100);
  camera.position
    .copy(new T.Vector3(0.27, 0.18, 1).normalize())
    .multiplyScalar((radius * 1.05) / Math.sin(T.MathUtils.degToRad(16)))
    .add(center);
  camera.lookAt(center);
  const capture = (object: T.Object3D) => {
    scene.add(object);
    renderer.render(scene, camera);
    const png = renderer.domElement.toDataURL('image/png');
    scene.remove(object);
    return png;
  };
  try {
    return { liveImage: capture(original), exportedImage: capture(imported) };
  } finally {
    renderer.dispose();
    renderer.forceContextLoss();
  }
}

// Loaded by the browser through Vite so the loader, model and mixer share one Three runtime.
export async function compareStudyRoundtrip(id: StudyId, url: string) {
  const loaded = await new GLTFLoader().loadAsync(url);
  const delivery = galleryDelivery(id);
  const evidence = delivery ? await loadPoseEvidence(delivery) : undefined;
  const native = evidence && 'objects' in evidence ? evidence : undefined;
  if (delivery && !native)
    throw new Error('Native gallery delivery lacks independent source pose evidence');
  const nativeResult = native ? await compareSavedPoses(url, native) : undefined;
  const originalDelivery = delivery
    ? await new GLTFLoader().loadAsync(delivery.modelUrl)
    : undefined;
  const original = originalDelivery?.scene ?? createStudy(id);
  const live = new T.AnimationMixer(original),
    exported = new T.AnimationMixer(loaded.scene);
  const clip = originalDelivery?.animations[0] ?? createStudyClip(original, id);
  live.clipAction(clip).play();
  exported.clipAction(loaded.animations[0]).play();
  const bodies: T.SkinnedMesh[] = [];
  original.traverse((node) => {
    if (isSkinnedMesh(node)) bodies.push(node);
  });
  const animated = [
    ...new Set(clip.tracks.map((track) => T.PropertyBinding.parseTrackName(track.name).nodeName)),
  ];
  let maxVertexError = nativeResult?.maxPoseError ?? 0,
    maxNodeError = 0;
  try {
    for (const time of [
      0,
      id === 'bannerbearer'
        ? 3.85
        : id === 'squire'
          ? 3.8
          : id === 'patron'
            ? 3.9
            : id === 'herald'
              ? 3.7
              : id === 'watcher'
                ? 3.8
                : id === 'juggler'
                  ? 3.75
                  : id === 'matron'
                    ? 3.85
                    : id === 'imp'
                      ? 3.6
                      : id === 'amalgam'
                        ? 3.7
                        : id === 'cub'
                          ? 3.65
                          : id === 'packcaller'
                            ? 3.8
                            : id === 'stray'
                              ? 3.95
                              : id === 'stormroc'
                                ? 3.65
                                : id === 'tortoise'
                                  ? 3.9
                                  : id === 'guardian'
                                    ? 3.55
                                    : id === 'scavenger'
                                      ? 3.75
                                      : id === 'crocolisk'
                                        ? 4.1
                                        : id === 'bogtoad'
                                          ? 3.35
                                          : id === 'nightjar'
                                            ? 23 / 6
                                            : id === 'prowler'
                                              ? 3.8
                                              : id === 'thornstag'
                                                ? 4.3
                                                : id === 'matriarch'
                                                  ? 3.6
                                                  : id === 'wolf'
                                                    ? 4.15
                                                    : 1.5,
      4.5,
    ]) {
      live.setTime(time);
      exported.setTime(time);
      original.updateMatrixWorld(true);
      loaded.scene.updateMatrixWorld(true);
      for (const source of bodies) {
        const imported = loaded.scene.getObjectByName(source.name);
        if (!isSkinnedMesh(imported)) throw new Error(`Missing imported skin: ${source.name}`);
        if (
          imported.geometry.attributes.position.count !== source.geometry.attributes.position.count
        )
          throw new Error(`Changed vertex count: ${source.name}`);
        for (let i = 0; i < source.geometry.attributes.position.count; i += 97) {
          const a = source.getVertexPosition(i, new T.Vector3()).applyMatrix4(source.matrixWorld);
          const b = imported
            .getVertexPosition(i, new T.Vector3())
            .applyMatrix4(imported.matrixWorld);
          maxVertexError = Math.max(maxVertexError, a.distanceTo(b));
        }
      }
      for (const name of animated) {
        const source = original.getObjectByName(name),
          imported = loaded.scene.getObjectByName(name);
        if (!source || !imported) throw new Error(`Missing imported animation target: ${name}`);
        source.matrixWorld.elements.forEach((value, i) => {
          maxNodeError = Math.max(maxNodeError, Math.abs(value - imported.matrixWorld.elements[i]));
        });
      }
    }
    return {
      maxVertexError,
      maxNodeError,
      skinCount: bodies.length,
      animatedCount: animated.length,
      ...renderPair(original, loaded.scene),
    };
  } finally {
    live.stopAllAction();
    exported.stopAllAction();
    live.uncacheRoot(original);
    exported.uncacheRoot(loaded.scene);
    disposeObject(original);
    disposeObject(loaded.scene);
  }
}

/** Neutral construction views separate sculpture from pigment and cast shadows. */
export function captureStudyStructure(id: StudyId) {
  const root = createStudy(id),
    materials = new Map<T.Mesh, T.Material | T.Material[]>();
  const clay = new T.MeshStandardMaterial({ color: '#8b8d85', roughness: 0.9 });
  const silhouette = new T.MeshBasicMaterial({ color: '#bbc1b6' });
  root.traverse((node) => {
    if (isMesh(node)) {
      materials.set(node, node.material);
      node.material = clay;
    }
  });
  try {
    const images: Record<string, string> = {};
    for (const [name, angle] of [
      ['clay-front', 0],
      ['clay-side', Math.PI / 2],
      ['clay-back', Math.PI],
    ] as [string, number][]) {
      root.rotation.y = angle;
      root.updateMatrixWorld(true);
      images[name] = renderPair(root, root).liveImage;
      if (id === 'amalgam' && name === 'clay-side') {
        for (const [mesh, material] of materials) mesh.material = material;
        images['material-face'] = renderPair(root, root).liveImage;
        for (const mesh of materials.keys()) mesh.material = clay;
      }
    }
    root.rotation.y = 0;
    if (id === 'tortoise') {
      root.rotation.x = -Math.PI / 2;
      root.updateMatrixWorld(true);
      images['clay-underside'] = renderPair(root, root).liveImage;
      for (const [mesh, material] of materials) mesh.material = material;
      images.underside = renderPair(root, root).liveImage;
      root.rotation.x = 0;
    }
    root.updateMatrixWorld(true);
    for (const mesh of materials.keys()) mesh.material = silhouette;
    images.silhouette = renderPair(root, root).liveImage;
    return images;
  } finally {
    for (const [mesh, material] of materials) mesh.material = material;
    clay.dispose();
    silhouette.dispose();
    disposeObject(root);
  }
}
