import { isMesh } from '../../../src/shared/three/objects';
import { disposeObject } from '../../../src/shared/three/resources';
import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { PublishedAsset } from './delivery';

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
  asset: published,
  options,
  onTime,
  onDuration,
}: {
  asset: PublishedAsset;
  options: Playback;
  onTime: (time: number) => void;
  onDuration: (seconds: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef(options);
  const report = useRef(onTime);
  const reportDuration = useRef(onDuration);
  state.current = options;
  report.current = onTime;
  reportDuration.current = onDuration;
  const [status, setStatus] = useState('Loading the sculpture…');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = host.current!;
    setReady(false);
    setFailed(false);
    setStatus('Loading the sculpture…');
    reportDuration.current(0);
    report.current(0);
    element.dataset.time = '0.000';
    element.dataset.duration = '0';
    element.dataset.clips = '0';
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
      `${published.brief.title}. Drag to orbit; scroll to zoom. Named view buttons provide keyboard camera controls.`,
    );
    renderer.domElement.setAttribute('role', 'img');
    element.appendChild(renderer.domElement);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(35, 1, 0.05, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
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
    scene.add(key.target);
    const rim = new T.DirectionalLight('#a9d9d2', 1.8);
    rim.position.set(-3, 3, -3);
    scene.add(rim);
    scene.add(rim.target);
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
    let duration = 0;
    let time = 0;
    let lastSeek = -1;
    let lastView: View | undefined;
    let lastSurface: Surface | undefined;
    let previous = performance.now();
    let lastReport = 0;
    const framing = new T.Box3(new T.Vector3(-1, 0, -1), new T.Vector3(1, 2, 1));
    const fitCamera = (view: View) => {
      const center = framing.getCenter(new T.Vector3());
      const radius = Math.max(0.01, framing.getBoundingSphere(new T.Sphere()).radius);
      const directions: Record<View, [number, number, number]> = {
        Portrait: [0.63, 0.28, 1],
        Front: [0, 0.04, 1],
        Side: [1, 0.04, 0],
        Back: [0, 0.04, -1],
      };
      const direction = new T.Vector3(...directions[view]).normalize();
      const right = new T.Vector3().crossVectors(camera.up, direction).normalize();
      const up = new T.Vector3().crossVectors(direction, right).normalize();
      const tangent = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
      let distance = radius;
      for (const x of [framing.min.x, framing.max.x])
        for (const y of [framing.min.y, framing.max.y])
          for (const z of [framing.min.z, framing.max.z]) {
            const point = new T.Vector3(x, y, z).sub(center);
            distance = Math.max(
              distance,
              point.dot(direction) +
                1.16 *
                  Math.max(
                    Math.abs(point.dot(right)) / (tangent * camera.aspect),
                    Math.abs(point.dot(up)) / tangent,
                  ),
            );
          }
      camera.position.copy(center).addScaledVector(direction, distance);
      camera.near = radius * 0.001;
      camera.far = Math.max(distance * 3 + radius * 2, radius * 20);
      camera.updateProjectionMatrix();
      controls.minDistance = radius * 0.6;
      controls.maxDistance = Math.max(distance * 3, radius * 8);
      controls.target.copy(center);
      controls.update();
    };
    const originals = new Map<T.Mesh, T.Material | T.Material[]>();
    const clay = new T.MeshStandardMaterial({ color: '#aab4ad', roughness: 0.78 });
    const wire = new T.MeshBasicMaterial({ color: '#bdd5c3', wireframe: true });
    const fit = () => {
      const width = Math.max(1, element.clientWidth);
      const height = Math.max(1, element.clientHeight);
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      lastView = undefined;
    };
    const resize = new ResizeObserver(fit);
    resize.observe(element);
    fit();
    new GLTFLoader().load(
      published.modelUrl,
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene, originals);
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
        scene.add(asset);
        skeleton = new T.SkeletonHelper(asset);
        skeleton.visible = false;
        scene.add(skeleton);
        mixer = new T.AnimationMixer(asset);
        const clip =
          gltf.animations.find((item) => item.name === published.brief.animation?.name) ??
          gltf.animations[0];
        if (
          (!clip && published.info.stats.animations.length > 0) ||
          (clip && (!Number.isFinite(clip.duration) || clip.duration <= 0))
        ) {
          setFailed(true);
          setStatus('The published asset has no usable animation.');
          return;
        }
        duration = clip?.duration ?? 0;
        if (clip) mixer.clipAction(clip).play();
        const evaluate = (seconds: number) => {
          mixer!.setTime(seconds);
          asset!.updateMatrixWorld(true);
          asset!.traverse((child) => {
            if (child instanceof T.SkinnedMesh) child.skeleton.update();
          });
        };
        evaluate(0);
        const bounds = new T.Box3().setFromObject(asset, true);
        if (bounds.isEmpty()) {
          setFailed(true);
          setStatus('The published asset has no visible geometry.');
          return;
        }
        asset.position.y -= bounds.min.y;
        // Fit actual deformed geometry across the loop, preserving authored model scale.
        framing.makeEmpty();
        for (const seconds of duration
          ? [0, duration / 4, duration / 2, duration * 0.75, duration]
          : [0]) {
          evaluate(seconds);
          framing.union(new T.Box3().setFromObject(asset, true));
        }
        evaluate(0);
        const size = framing.getSize(new T.Vector3());
        const center = framing.getCenter(new T.Vector3());
        const plinthScale = (Math.max(size.x, size.z, 0.1) * 0.55) / 1.6;
        floor.scale.setScalar(plinthScale);
        floor.position.set(center.x, -0.055 * plinthScale, center.z);
        edge.scale.setScalar(plinthScale);
        edge.position.set(center.x, -0.008 * plinthScale, center.z);
        floor.updateMatrixWorld(true);
        framing.union(new T.Box3().setFromObject(floor));
        const radius = Math.max(0.01, framing.getBoundingSphere(new T.Sphere()).radius);
        key.position.copy(center).add(new T.Vector3(3, 5, 4).multiplyScalar(radius));
        key.target.position.copy(center);
        rim.position.copy(center).add(new T.Vector3(-3, 3, -3).multiplyScalar(radius));
        rim.target.position.copy(center);
        Object.assign(key.shadow.camera, {
          left: -radius * 1.5,
          right: radius * 1.5,
          top: radius * 1.5,
          bottom: -radius * 1.5,
          near: radius * 0.01,
          far: radius * 12,
        });
        key.shadow.camera.updateProjectionMatrix();
        key.shadow.normalBias = radius * 0.005;
        lastView = undefined;
        lastSurface = undefined;
        element.dataset.duration = String(duration);
        element.dataset.clips = String(gltf.animations.length);
        reportDuration.current(duration);
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
        fitCamera(current.view);
        lastView = current.view;
      }
      if (current.seek !== lastSeek) {
        time = Math.min(duration, Math.max(0, current.time));
        lastSeek = current.seek;
      } else if (current.playing && duration > 0) time = (time + dt) % duration;
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
        disposeObject(asset, originals);
      }
      skeleton?.dispose();
      key.shadow.map?.dispose();
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
  }, [published]);
  return (
    <div className="dcc-render" ref={host} data-ready={ready} data-asset={published.id}>
      {!ready && (
        <p className="dcc-load" role={failed ? 'alert' : 'status'}>
          {status}
        </p>
      )}
    </div>
  );
}
