import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import assetUrl from '../assets/briar-hydra.glb?url';

// Explicit guards keep Three.js generic defaults from widening scene values to any.
function isMesh(object: T.Object3D): object is T.Mesh {
  return object instanceof T.Mesh;
}
function isTexture(value: unknown): value is T.Texture {
  return value instanceof T.Texture;
}

export type View = 'Portrait' | 'Front' | 'Side' | 'Back';
export type Surface = 'Material' | 'Clay' | 'Wire';
export type Playback = {
  playing: boolean;
  time: number;
  seek: number;
  view: View;
  surface: Surface;
  rig: boolean;
};
export default function Viewer({
  options,
  onTime,
}: {
  options: Playback;
  onTime: (time: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef(options);
  const report = useRef(onTime);
  state.current = options;
  report.current = onTime;
  const [status, setStatus] = useState('Loading the sculpture…');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = host.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch {
      setFailed(true);
      setStatus(
        'WebGL is unavailable. The model and editable Blender source can still be downloaded.',
      );
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor('#172124', 0);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.domElement.setAttribute(
      'aria-label',
      'Animated Briar Hydra. Drag to orbit; scroll to zoom. Named view buttons provide keyboard camera controls.',
    );
    renderer.domElement.setAttribute('role', 'img');
    element.appendChild(renderer.domElement);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(35, 1, 0.05, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 3.5;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI * 0.54;
    const pmrem = new T.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.32;
    room.dispose();
    scene.add(new T.HemisphereLight('#c7e2ed', '#403b25', 0.65));
    const key = new T.DirectionalLight('#ffecd5', 2.1);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, {
      left: -3,
      right: 3,
      top: 4,
      bottom: -3,
      near: 0.1,
      far: 16,
    });
    key.shadow.bias = -0.0003;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    const rim = new T.DirectionalLight('#a9d9d2', 1.8);
    rim.position.set(-3, 3, -3);
    scene.add(rim);
    const floor = new T.Mesh(
      new T.CylinderGeometry(1.6, 1.64, 0.09, 96),
      new T.MeshStandardMaterial({ color: '#263235', roughness: 0.8, metalness: 0.15 }),
    );
    floor.position.y = -0.055;
    floor.receiveShadow = true;
    scene.add(floor);
    const edge = new T.Mesh(
      new T.TorusGeometry(1.6, 0.006, 5, 100),
      new T.MeshStandardMaterial({ color: '#b5ac7a', roughness: 0.5, metalness: 0.6 }),
    );
    edge.rotation.x = Math.PI / 2;
    edge.position.y = -0.008;
    scene.add(edge);
    let disposed = false;
    let asset: T.Group | undefined;
    let skeleton: T.SkeletonHelper | undefined;
    let mixer: T.AnimationMixer | undefined;
    let duration = 6;
    let time = 0;
    let lastSeek = -1;
    let lastView: View | undefined;
    let lastSurface: Surface | undefined;
    let previous = performance.now();
    let lastReport = 0;
    const originals = new Map<T.Mesh, T.Material | T.Material[]>();
    const clay = new T.MeshStandardMaterial({ color: '#aab4ad', roughness: 0.78 });
    const wire = new T.MeshBasicMaterial({ color: '#bdd5c3', wireframe: true });
    const fit = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      lastView = undefined;
    };
    const resize = new ResizeObserver(fit);
    resize.observe(element);
    fit();
    const disposeAsset = (object: T.Object3D) => {
      const textures = new Set<T.Texture>();
      const materials = new Set<T.Material>();
      object.traverse((child) => {
        if (isMesh(child)) {
          child.geometry.dispose();
          const material = originals.get(child) ?? child.material;
          for (const m of Array.isArray(material) ? material : [material]) materials.add(m);
          if (child instanceof T.SkinnedMesh) child.skeleton.dispose();
        }
      });
      materials.forEach((material) => {
        Object.values(material).forEach((v) => {
          if (isTexture(v)) textures.add(v);
        });
        material.dispose();
      });
      textures.forEach((texture) => texture.dispose());
    };
    new GLTFLoader().load(
      assetUrl,
      (gltf) => {
        if (disposed) {
          disposeAsset(gltf.scene);
          return;
        }
        asset = gltf.scene;
        asset.traverse((child) => {
          if (isMesh(child)) {
            child.castShadow = true;
            child.receiveShadow = true;
            originals.set(child, child.material);
          }
        });
        const bounds = new T.Box3().setFromObject(asset);
        asset.position.y -= bounds.min.y;
        scene.add(asset);
        skeleton = new T.SkeletonHelper(asset);
        skeleton.visible = false;
        scene.add(skeleton);
        mixer = new T.AnimationMixer(asset);
        const clip = gltf.animations[0];
        if (!clip) {
          setFailed(true);
          setStatus('The published asset has no animation.');
          return;
        }
        duration = clip.duration;
        mixer.clipAction(clip).play();
        element.dataset.duration = String(duration);
        element.dataset.clips = String(gltf.animations.length);
        setStatus('Ready');
        setReady(true);
      },
      undefined,
      () => {
        if (!disposed) {
          setFailed(true);
          setStatus('The sculpture could not be loaded. Reload the workbench to try again.');
        }
      },
    );
    let frame = 0;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(0.05, Math.max(0, (now - previous) / 1000));
      previous = now;
      if (document.hidden) return;
      const current = state.current;
      if (lastView !== current.view) {
        const distance = camera.aspect < 1 ? 8.6 : 6.7;
        const positions: Record<View, [number, number, number]> = {
          Portrait: [distance * 0.63, 2.9, distance],
          Front: [0, 1.8, distance * 1.1],
          Side: [distance * 1.1, 1.9, 0],
          Back: [0, 2.0, -distance * 1.1],
        };
        camera.position.set(...positions[current.view]);
        controls.target.set(0, 1.48, 0);
        controls.update();
        lastView = current.view;
      }
      if (current.seek !== lastSeek) {
        time = Math.min(duration, Math.max(0, current.time));
        lastSeek = current.seek;
      } else if (current.playing) time = (time + dt) % duration;
      if (mixer) mixer.setTime(time);
      element.dataset.time = time.toFixed(3);
      if (now - lastReport > 100) {
        report.current(time);
        lastReport = now;
      }
      if (skeleton) skeleton.visible = current.rig;
      if (current.surface !== lastSurface) {
        originals.forEach((material, mesh) => {
          mesh.material =
            current.surface === 'Clay' ? clay : current.surface === 'Wire' ? wire : material;
        });
        lastSurface = current.surface;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      if (asset) {
        mixer?.stopAllAction();
        mixer?.uncacheRoot(asset);
        disposeAsset(asset);
      }
      skeleton?.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      edge.geometry.dispose();
      edge.material.dispose();
      clay.dispose();
      wire.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div className="dcc-render" ref={host} data-ready={ready}>
      {!ready && (
        <p className="dcc-load" role={failed ? 'alert' : 'status'}>
          {status}
        </p>
      )}
    </div>
  );
}
