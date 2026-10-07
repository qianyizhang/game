import { isMesh } from './objects';
import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createStudy, disposeObject, explodeStudy, type StudyId } from './models';
import { createStudyClip, LOOP_SECONDS } from './animation';
import { recordLoop } from './recording';

export type ViewerOptions = {
  spin: boolean;
  motion: boolean;
  speed: number;
  seek: number;
  seekVersion: number;
  wireframe: boolean;
  exploded: boolean;
  light: 'studio' | 'moon' | 'ember';
  view: 'perspective' | 'front' | 'side';
  reset: number;
};
export type ViewerAPI = {
  png: () => string;
  model: () => Promise<ArrayBuffer>;
  video: () => Promise<Blob>;
};
export function download(data: Blob | string, name: string) {
  const url = typeof data === 'string' ? data : URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  if (typeof data !== 'string') setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function StudyViewer({
  id,
  options,
  api,
  onTime,
}: {
  id: StudyId;
  options: ViewerOptions;
  api: React.RefObject<ViewerAPI | null>;
  onTime: (seconds: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(options);
  current.current = options;
  const reportTime = useRef(onTime);
  reportTime.current = onTime;
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = host.current!;
    let renderer: T.WebGLRenderer;
    setReady(false);
    setFailed(false);
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.setAttribute(
      'aria-label',
      `Interactive ${id} sculpture. Drag to orbit; scroll or pinch to zoom. Use the view buttons for keyboard controls.`,
    );
    renderer.domElement.setAttribute('role', 'img');
    element.append(renderer.domElement);
    const scene = new T.Scene();
    const backdropCanvas = document.createElement('canvas');
    backdropCanvas.width = backdropCanvas.height = 256;
    const backdropContext = backdropCanvas.getContext('2d')!;
    const gradient = backdropContext.createRadialGradient(128, 115, 15, 128, 128, 180);
    gradient.addColorStop(0, '#39413f');
    gradient.addColorStop(0.55, '#252d2c');
    gradient.addColorStop(1, '#171e20');
    backdropContext.fillStyle = gradient;
    backdropContext.fillRect(0, 0, 256, 256);
    const backdrop = new T.CanvasTexture(backdropCanvas);
    backdrop.colorSpace = T.SRGBColorSpace;
    scene.background = backdrop;
    const asset = createStudy(id);
    scene.add(asset);
    const bounds = new T.Box3().setFromObject(asset);
    bounds.expandByPoint(new T.Vector3(-1.35, -0.016, -1.35));
    bounds.expandByPoint(new T.Vector3(1.35, 0.11, 1.35));
    const center = bounds.getCenter(new T.Vector3());
    const framingPoints: T.Vector3[] = [];
    const corners = (box: T.Box3, transform = new T.Matrix4()) => {
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z])
            framingPoints.push(new T.Vector3(x, y, z).applyMatrix4(transform));
    };
    corners(new T.Box3(new T.Vector3(-1.35, -0.016, -1.35), new T.Vector3(1.35, 0.11, 1.35)));
    asset.traverse((object) => {
      if (isMesh(object)) {
        object.geometry.computeBoundingBox();
        corners(object.geometry.boundingBox!, object.matrixWorld);
      }
    });
    const camera = new T.PerspectiveCamera(32, 1, 0.1, 60);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 2.5;
    controls.maxDistance = 24;
    controls.maxPolarAngle = Math.PI * 0.78;
    controls.enablePan = false;
    const resetCamera = (view: ViewerOptions['view']) => {
      const direction =
        view === 'front'
          ? new T.Vector3(0, 0.045, 1)
          : view === 'side'
            ? new T.Vector3(1, 0.16, 0)
            : new T.Vector3(0.27, 0.18, 1);
      direction.normalize();
      const right = new T.Vector3().crossVectors(camera.up, direction).normalize();
      const up = new T.Vector3().crossVectors(direction, right).normalize();
      const tangent = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
      let distance = 0;
      for (const sample of framingPoints) {
        const point = sample.clone().sub(center);
        distance = Math.max(
          distance,
          point.dot(direction) + (Math.abs(point.dot(right)) * 1.08) / (tangent * camera.aspect),
          point.dot(direction) + (Math.abs(point.dot(up)) * 1.12) / tangent,
        );
      }
      controls.target.copy(center);
      camera.position.copy(direction.multiplyScalar(distance).add(center));
      controls.update();
    };
    resetCamera(current.current.view);
    const pmrem = new T.PMREMGenerator(renderer);
    // Large luminous cards create soft, readable reflections in bronze and glass.
    const room = new T.Scene();
    room.background = new T.Color('#292a29');
    for (const [position, dimensions, color] of [
      [
        [-4, 3.5, 3],
        [3, 5],
        [3.4, 2.9, 2.35],
      ],
      [
        [3.5, 2.8, 2],
        [1, 4],
        [1.55, 1.8, 2.1],
      ],
      [
        [0, 5.5, -1],
        [4, 3],
        [2.5, 2.4, 2.2],
      ],
      [
        [1, 2.5, -4],
        [3, 3],
        [1.2, 1.45, 1.55],
      ],
      [
        [0, 2.5, 5],
        [3, 3],
        [0.7, 0.75, 0.8],
      ],
    ] as [number[], number[], number[]][]) {
      const panel = new T.Mesh(
        new T.PlaneGeometry(...(dimensions as [number, number])),
        new T.MeshBasicMaterial({
          color: new T.Color().setRGB(...(color as [number, number, number])),
          side: T.DoubleSide,
        }),
      );
      panel.position.set(...(position as [number, number, number]));
      panel.lookAt(0, 1.5, 0);
      room.add(panel);
    }
    const environment = pmrem.fromScene(room, 0.06);
    scene.environment = environment.texture;
    scene.environmentIntensity = 1.2;
    disposeObject(room);
    pmrem.dispose();
    const ambient = new T.HemisphereLight('#f0e6d5', '#24313a', 0.45);
    scene.add(ambient);
    const key = new T.DirectionalLight('#ffe9ce', 2.1);
    key.position.set(-3, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.radius = 6;
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.normalBias = 0.025;
    scene.add(key);
    const rim = new T.DirectionalLight('#b0c9de', 1.8);
    rim.position.set(3, 3, -3);
    scene.add(rim);
    const fill = new T.DirectionalLight('#d4e0df', 0.9);
    fill.position.set(2, 2, 5);
    scene.add(fill);
    const mixer = new T.AnimationMixer(asset);
    const clip = createStudyClip(asset, id);
    mixer.clipAction(clip).play();
    const recordingAbort = new AbortController();
    let recording = false;
    let mounted = true;
    const pedestal = new T.Group();
    pedestal.name = 'Display plinth';
    const base = new T.Mesh(
      new T.CylinderGeometry(1.32, 1.34, 0.12, 96),
      new T.MeshStandardMaterial({ color: '#171c1d', metalness: 0.25, roughness: 0.48 }),
    );
    base.position.y = 0.045;
    base.receiveShadow = true;
    base.castShadow = true;
    pedestal.add(base);
    const trim = new T.Mesh(
      new T.TorusGeometry(1.32, 0.004, 8, 96),
      new T.MeshStandardMaterial({ color: '#8c7656', metalness: 0.8, roughness: 0.4 }),
    );
    trim.rotation.x = Math.PI / 2;
    trim.position.y = 0.109;
    pedestal.add(trim);
    scene.add(pedestal);
    const floor = new T.Mesh(new T.PlaneGeometry(200, 200), new T.ShadowMaterial({ opacity: 0.2 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.016;
    floor.receiveShadow = true;
    scene.add(floor);
    const resize = new ResizeObserver(() => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      resetCamera(current.current.view);
      dirty = true;
    });
    let dirty = true;
    resize.observe(element);
    controls.addEventListener('change', () => {
      dirty = true;
    });
    const contextLost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
      setReady(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    api.current = {
      png: () => {
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL('image/png');
      },
      model: async () => {
        const clean = createStudy(id);
        try {
          return (await new GLTFExporter().parseAsync(clean, {
            binary: true,
            animations: [createStudyClip(clean, id)],
          })) as ArrayBuffer;
        } finally {
          disposeObject(clean);
        }
      },
      video: async () => {
        if (recording) throw new Error('An animation is already recording.');
        recording = true;
        const savedTime = mixer.time;
        const savedRotation = asset.rotation.y;
        controls.enabled = false;
        asset.rotation.y = 0;
        try {
          return await recordLoop(
            renderer.domElement,
            (seconds) => {
              mixer.setTime(seconds);
              renderer.render(scene, camera);
              reportTime.current(seconds);
            },
            LOOP_SECONDS,
            recordingAbort.signal,
          );
        } finally {
          recording = false;
          if (mounted) {
            mixer.setTime(savedTime);
            asset.rotation.y = savedRotation;
            controls.enabled = true;
            dirty = true;
          }
        }
      },
    };
    let frame = 0,
      last = performance.now(),
      previous: ViewerOptions | null = null,
      first = true;
    const animate = (time: number) => {
      frame = requestAnimationFrame(animate);
      // A costly model build can finish after the current RAF timestamp.
      const delta = Math.max(0, Math.min((time - last) / 1000, 0.05));
      last = time;
      if (document.hidden || recording) return;
      const value = current.current;
      if (previous !== value) {
        if (!previous || previous.seekVersion !== value.seekVersion) mixer.setTime(value.seek);
        explodeStudy(asset, value.exploded ? 1 : 0);
        asset.traverse((object) => {
          if (isMesh(object)) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials)
              if (material instanceof T.MeshStandardMaterial) material.wireframe = value.wireframe;
          }
        });
        const colors = {
          studio: ['#ffe9ce', '#b0c9de'],
          moon: ['#aabfe9', '#82bbaa'],
          ember: ['#ff9b61', '#e3b056'],
        };
        key.color.set(colors[value.light][0]);
        rim.color.set(colors[value.light][1]);
        if (!previous || previous.view !== value.view || previous.reset !== value.reset) {
          asset.rotation.y = 0;
          resetCamera(value.view);
        }
        previous = value;
        dirty = true;
      }
      if (value.motion && !value.exploded) {
        mixer.update(delta * value.speed);
        dirty = true;
      }
      if (time - lastReport > 120) {
        reportTime.current(mixer.time % LOOP_SECONDS);
        lastReport = time;
      }
      if (value.spin) {
        asset.rotation.y += delta * 0.17;
        dirty = true;
      }
      controls.update();
      if (dirty) {
        renderer.render(scene, camera);
        dirty = false;
        if (first) {
          setReady(true);
          first = false;
        }
      }
    };
    let lastReport = 0;
    frame = requestAnimationFrame(animate);
    return () => {
      mounted = false;
      recordingAbort.abort();
      mixer.stopAllAction();
      mixer.uncacheRoot(asset);
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      api.current = null;
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      disposeObject(scene);
      environment.dispose();
      backdrop.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [id, api]);
  return (
    <div className="study-render" ref={host} data-ready={ready}>
      {!ready && !failed && (
        <p className="study-render-message" role="status">
          Preparing the sculpture…
        </p>
      )}
      {failed && (
        <p className="study-render-message" role="alert">
          The 3D view needs WebGL. Try reopening the gallery in a browser with graphics acceleration
          enabled. The original artwork is below.
        </p>
      )}
    </div>
  );
}
