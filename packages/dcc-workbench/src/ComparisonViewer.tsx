import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { isMesh, isSkinnedMesh, isTexture } from '../../../src/art3d/objects';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import acceptedUrl from '../references/comparison/accepted-hydra.glb?url';
import beforeUrl from '../references/comparison/blender-before.glb?url';
import gestureUrl from '../references/comparison/blender-gesture.glb?url';
import { getPublishedAsset } from './delivery';
const { modelUrl: candidateUrl } = getPublishedAsset('briar-hydra');
import type { View } from './Viewer';

export type ComparisonOptions = {
  playing: boolean;
  time: number;
  seek: number;
  view: View;
  surface: 'Silhouette' | 'Clay' | 'Material';
  pair: 'direction' | 'revision' | 'pilot';
  swapped: boolean;
  reset: number;
};
type Subject = {
  root: T.Group;
  scene: T.Scene;
  mixer: T.AnimationMixer;
};
function disposeObject(root: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>();
  const materials = new Set<T.Material>();
  const textures = new Set<T.Texture>();
  const skeletons = new Set<T.Skeleton>();
  root.traverse((node) => {
    if (!isMesh(node)) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (isTexture(value)) textures.add(value);
    }
    if (isSkinnedMesh(node)) skeletons.add(node.skeleton);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
  skeletons.forEach((skeleton) => skeleton.dispose());
}

/** One camera, renderer and clock serve both panels; changing a pair never refits it. */
export default function ComparisonViewer({
  options,
  onTime,
}: {
  options: ComparisonOptions;
  onTime: (time: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef(options);
  const report = useRef(onTime);
  state.current = options;
  report.current = onTime;
  const [status, setStatus] = useState('Loading the preserved versions…');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = host.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    } catch {
      setFailed(true);
      setStatus('WebGL is unavailable. Return to the workbench to download the assets.');
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setScissorTest(true);
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute(
      'aria-label',
      'Matched Hydra comparison. Drag either panel to orbit both; use named views for keyboard camera controls.',
    );
    element.appendChild(renderer.domElement);
    const camera = new T.PerspectiveCamera(35, 1, 0.05, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.maxPolarAngle = Math.PI * 0.52;
    const pmrem = new T.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    room.dispose();
    const clay = new T.MeshStandardMaterial({ color: '#b0b4a8', roughness: 0.8 });
    const silhouette = new T.MeshBasicMaterial({ color: '#172326' });
    const subjects: Subject[] = [];
    const bounds = new T.Box3();
    const target = new T.Vector3();
    let radius = 2;
    let disposed = false;
    let loaded = false;
    let width = 1;
    let height = 1;
    let stacked = false;
    let viewWidth = 1;
    let viewHeight = 1;
    let lastView = '';
    let previous = performance.now();
    let time = 0;
    let lastSeek = -1;
    let lastReport = 0;
    let frame = 0;
    const resize = new ResizeObserver(() => {
      width = element.clientWidth;
      height = element.clientHeight;
      stacked = matchMedia('(max-width: 760px)').matches;
      viewWidth = stacked ? width : (width - 12) / 2;
      viewHeight = stacked ? (height - 12) / 2 : height;
      renderer.setSize(width, height);
      camera.aspect = viewWidth / Math.max(1, viewHeight);
      camera.updateProjectionMatrix();
      lastView = '';
    });
    resize.observe(element);
    const makeSubject = async (url: string) => {
      const gltf = await new GLTFLoader().loadAsync(url);
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }
      const clip = gltf.animations[0];
      if (!clip || Math.abs(clip.duration - 6) > 0.001) {
        disposeObject(gltf.scene);
        throw new Error('Each comparison asset must have a six-second animation.');
      }
      const root = gltf.scene;
      const mixer = new T.AnimationMixer(root);
      mixer.clipAction(clip).play();
      mixer.setTime(0);
      root.updateMatrixWorld(true);
      // Ground at the frozen first pose only. Never re-ground moving anatomy.
      root.position.y -= new T.Box3().setFromObject(root, true).min.y;
      const scene = new T.Scene();
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.32;
      scene.add(new T.HemisphereLight('#c7e2ed', '#403b25', 0.65));
      const key = new T.DirectionalLight('#ffecd5', 2.1);
      key.position.set(3, 5, 4);
      const rim = new T.DirectionalLight('#a9d9d2', 1.8);
      rim.position.set(-3, 3, -3);
      scene.add(key, rim, root);
      return { root, scene, mixer };
    };
    // allSettled lets cleanup own every successful allocation even after another load fails.
    void Promise.allSettled(
      [acceptedUrl, beforeUrl, gestureUrl, candidateUrl].map(makeSubject),
    ).then((results) => {
      for (const result of results)
        if (result.status === 'fulfilled' && result.value) subjects.push(result.value);
      if (disposed) {
        subjects.forEach(({ root, mixer }) => {
          mixer.stopAllAction();
          mixer.uncacheRoot(root);
          disposeObject(root);
        });
        subjects.length = 0;
        return;
      }
      if (results.some((result) => result.status === 'rejected') || subjects.length !== 4) {
        setFailed(true);
        setStatus(
          'A comparison asset could not be loaded. Reload to retry, or return to the workbench.',
        );
        return;
      }
      // Fit the union of all versions and sampled poses once; no per-subject magnification.
      for (const subject of subjects) {
        for (const seconds of [0, 1.5, 3, 4.5, 6]) {
          subject.mixer.setTime(seconds);
          subject.root.updateMatrixWorld(true);
          bounds.union(new T.Box3().setFromObject(subject.root, true));
        }
        subject.mixer.setTime(0);
      }
      bounds.getCenter(target);
      radius = bounds.getSize(new T.Vector3()).length() / 2;
      loaded = true;
      lastView = '';
      setReady(true);
    });
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(0.05, Math.max(0, (now - previous) / 1000));
      previous = now;
      if (!loaded || document.hidden) return;
      const current = state.current;
      const viewKey = `${current.view}:${current.reset}`;
      if (lastView !== viewKey) {
        const halfFov = T.MathUtils.degToRad(camera.fov / 2);
        const limitingFov = Math.min(halfFov, Math.atan(Math.tan(halfFov) * camera.aspect));
        const distance = (radius / Math.sin(limitingFov)) * 1.08;
        const directions: Record<View, [number, number, number]> = {
          Portrait: [0.6, 0.24, 1],
          Front: [0, 0.06, 1],
          Side: [1, 0.06, 0],
          Back: [0, 0.06, -1],
        };
        camera.position
          .copy(target)
          .add(new T.Vector3(...directions[current.view]).normalize().multiplyScalar(distance));
        controls.target.copy(target);
        controls.minDistance = radius * 1.1;
        controls.maxDistance = distance * 2;
        controls.update();
        lastView = viewKey;
      }
      if (lastSeek !== current.seek) {
        time = Math.max(0, Math.min(6, current.time));
        lastSeek = current.seek;
      } else if (current.playing) time = (time + dt) % 6;
      subjects.forEach(({ mixer }) => mixer.setTime(time));
      let pair = [current.pair === 'direction' ? 0 : current.pair === 'pilot' ? 1 : 2, 3];
      if (current.swapped) pair = pair.reverse();
      const override =
        current.surface === 'Clay' ? clay : current.surface === 'Silhouette' ? silhouette : null;
      renderer.setScissorTest(false);
      renderer.setClearColor('#111a1d');
      renderer.clear();
      renderer.setScissorTest(true);
      pair.forEach((index, panel) => {
        const x = stacked ? 0 : panel * (viewWidth + 12);
        const y = stacked ? (1 - panel) * (viewHeight + 12) : 0;
        renderer.setViewport(x, y, viewWidth, viewHeight);
        renderer.setScissor(x, y, viewWidth, viewHeight);
        renderer.setClearColor(current.surface === 'Silhouette' ? '#bec9c1' : '#263538');
        renderer.clear();
        subjects[index].scene.overrideMaterial = override;
        renderer.render(subjects[index].scene, camera);
      });
      element.dataset.time = time.toFixed(3);
      element.dataset.pair = pair.join(',');
      element.dataset.camera = camera.position
        .toArray()
        .map((n) => n.toFixed(5))
        .join(',');
      element.dataset.surface = current.surface;
      if (now - lastReport > 100) {
        report.current(time);
        lastReport = now;
      }
    };
    frame = requestAnimationFrame(draw);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      subjects.forEach(({ root, mixer }) => {
        mixer.stopAllAction();
        mixer.uncacheRoot(root);
        disposeObject(root);
      });
      subjects.length = 0;
      clay.dispose();
      silhouette.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div className="dcc-comparison-render" ref={host} data-ready={ready}>
      {!ready && (
        <p className="dcc-load" role={failed ? 'alert' : 'status'}>
          {status}
        </p>
      )}
    </div>
  );
}
