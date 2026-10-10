import { isMesh } from '../../../src/shared/three/objects';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { disposeObject } from '../../../src/shared/three/resources';
import { travelAt } from '../motion-contract';
import {
  characters,
  baselineCharacters,
  clips,
  baselineClips,
  durationFor,
  type CanidOptions,
} from './canid-assets';

type Subject = {
  asset: (typeof characters)[number];
  revision: 'baseline' | 'refined';
  duration: number;
  root: T.Group;
  scene: T.Scene;
  mixer: T.AnimationMixer;
  animations: T.AnimationClip[];
  grid: T.GridHelper;
  rig: T.SkeletonHelper;
  path: T.Line;
  materials: Map<T.Mesh, T.Material | T.Material[]>;
};

/** Baked playback only. One clock and camera serve every character without rescaling anatomy. */
export function createCanidPlayer(
  element: HTMLDivElement,
  read: () => CanidOptions,
  report: (time: number, complete: boolean) => void,
  status: (message: string, ready: boolean) => void,
) {
  const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute(
    'aria-label',
    'Canid motion comparison. Drag to orbit all characters.',
  );
  element.appendChild(renderer.domElement);
  const camera = new T.PerspectiveCamera(35, 1, 0.05, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 16;
  controls.maxPolarAngle = Math.PI * 0.51;
  const pmrem = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  room.dispose();
  const clay = new T.MeshStandardMaterial({ color: '#b9b7a8', roughness: 0.8 });
  const subjects: Subject[] = [];
  let disposed = false;
  let ready = false;
  let time = 0;
  let elapsed = 0;
  let frame = 0;
  let previous = performance.now();
  const resetTime = () => {
    previous = performance.now();
  };
  document.addEventListener('visibilitychange', resetTime);
  let lastReport = 0;
  let lastSeek = -1;
  let lastClip = '';
  let lastView = '';
  let width = 1;
  let height = 1;
  const resize = new ResizeObserver(() => {
    width = element.clientWidth;
    height = element.clientHeight;
    renderer.setSize(width, height);
    lastView = '';
  });
  resize.observe(element);
  const release = (subject: Subject) => {
    subject.mixer.stopAllAction();
    subject.mixer.uncacheRoot(subject.root);
    for (const [mesh, material] of subject.materials) mesh.material = material;
    subject.rig.dispose();
    subject.scene.remove(subject.rig);
    disposeObject(subject.scene);
  };
  void Promise.allSettled(
    [
      ...baselineCharacters.map((asset) => ({ asset, revision: 'baseline' as const })),
      ...characters.map((asset) => ({ asset, revision: 'refined' as const })),
    ].map(async ({ asset: character, revision }) => {
      const gltf = await new GLTFLoader().loadAsync(character.model);
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }
      const metadata: Record<string, { name: string; seconds: number }> =
        revision === 'baseline' ? baselineClips : clips;
      for (const [name, clip] of Object.entries(metadata)) {
        const found = gltf.animations.find((a) => a.name === name);
        if (!found || Math.abs(found.duration - clip.seconds) > 0.001) {
          disposeObject(gltf.scene);
          throw new Error(`Missing or invalid ${name} clip`);
        }
      }
      const root = gltf.scene;
      const scene = new T.Scene();
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.45;
      scene.add(root, new T.HemisphereLight('#d6ecf2', '#574b39', 1));
      const key = new T.DirectionalLight('#fff1dc', 2.8);
      key.position.set(2, 5, 4);
      const rim = new T.DirectionalLight('#a4c5d0', 1.8);
      rim.position.set(-3, 3, -3);
      scene.add(key, rim);
      const floor = new T.Mesh(
        new T.PlaneGeometry(20, 20),
        new T.MeshStandardMaterial({ color: '#263b3d', roughness: 1 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.012;
      scene.add(floor);
      const grid = new T.GridHelper(20, 80, '#537474', '#405b5b');
      scene.add(grid);
      const rig = new T.SkeletonHelper(root);
      scene.add(rig);
      const path = new T.Line(
        new T.BufferGeometry(),
        new T.LineBasicMaterial({ color: '#e2be70' }),
      );
      scene.add(path);
      const materials = new Map<T.Mesh, T.Material | T.Material[]>();
      root.traverse((obj) => {
        if (isMesh(obj)) materials.set(obj, obj.material);
      });
      return {
        asset: character,
        revision,
        duration: 0,
        root,
        scene,
        mixer: new T.AnimationMixer(root),
        animations: gltf.animations,
        grid,
        rig,
        path,
        materials,
      };
    }),
  ).then((results) => {
    for (const result of results)
      if (result.status === 'fulfilled' && result.value) subjects.push(result.value);
    if (disposed) {
      subjects.forEach(release);
      subjects.length = 0;
      return;
    }
    if (results.some((r) => r.status === 'rejected') || subjects.length !== 6) {
      status(
        'A character could not load. Reload to retry; Blender and GLB downloads remain available.',
        false,
      );
      return;
    }
    ready = true;
    status('', true);
  });
  const draw = (now: number) => {
    frame = requestAnimationFrame(draw);
    const dt = Math.max(0, (now - previous) / 1000);
    previous = now;
    if (!ready || disposed || document.hidden) return;
    const options = read();
    const duration = durationFor(options.revision, options.clip);
    const motion = clips[options.clip];
    const loop =
      options.movement === 'in-place' &&
      (options.revision !== 'refined' || motion.playback === 'loop');
    if (lastClip !== options.clip) {
      for (const subject of subjects) {
        subject.mixer.stopAllAction();
        const action = subject.mixer.clipAction(
          subject.animations.find((a) => a.name === options.clip) ?? subject.animations[0],
        );
        subject.duration = action.getClip().duration;
        action.setLoop(T.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.reset().play();
        const track = subject.asset.motions[options.clip];
        subject.path.geometry.dispose();
        subject.path.geometry = new T.BufferGeometry().setFromPoints(
          track ? track.trajectory.map((p) => new T.Vector3(p[1], 0.015, p[2])) : [],
        );
      }
      time = 0;
      elapsed = 0;
      lastClip = options.clip;
      lastSeek = -1;
    }
    if (lastSeek !== options.seek) {
      time = Math.min(duration, Math.max(0, options.time));
      elapsed = time;
      lastSeek = options.seek;
    } else if (options.playing) {
      elapsed += dt;
      time = loop ? elapsed % duration : Math.min(duration, elapsed);
    }
    const indices = subjects.flatMap((subject, i) =>
      (options.revision === 'comparison' || options.revision === subject.revision) &&
      (options.character === 'all' || options.character === subject.asset.id)
        ? [i]
        : [],
    );
    const stacked = width < 700;
    const panelWidth = stacked ? width : width / indices.length;
    const panelHeight = stacked ? height / indices.length : height;
    const viewKey = `${options.view}:${options.character}:${options.revision}:${options.movement}:${options.clip}:${width}:${height}`;
    if (lastView !== viewKey) {
      camera.aspect = panelWidth / panelHeight;
      camera.updateProjectionMatrix();
      const directions = {
        Portrait: [0.75, 0.38, 1],
        Side: [0, 0.12, 1],
        Front: [1, 0.12, 0],
        Rear: [-1, 0.12, 0],
      };
      const fov = Math.min(
        T.MathUtils.degToRad(17.5),
        Math.atan(Math.tan(T.MathUtils.degToRad(17.5)) * camera.aspect),
      );
      const xs = options.movement === 'travel' ? motion.trajectory.map((p) => p[1]) : [0];
      const zs = options.movement === 'travel' ? motion.trajectory.map((p) => p[2]) : [0];
      const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
      // Keep the whole attack envelope in frame, including Moss's forward muzzle.
      // A fixed radius per clip avoids camera pumping during the strike.
      const radius = ['lunge', 'bite', 'swipe'].includes(options.clip) ? 2.65 : 2.15;
      const distance = (radius + span / 2) / Math.sin(fov);
      controls.target.set(
        (Math.max(...xs) + Math.min(...xs)) / 2,
        1,
        (Math.max(...zs) + Math.min(...zs)) / 2,
      );
      camera.position
        .copy(controls.target)
        .add(new T.Vector3(...directions[options.view]).normalize().multiplyScalar(distance));
      controls.update();
      lastView = viewKey;
    }
    renderer.setScissorTest(true);
    indices.forEach((index, panel) => {
      const subject = subjects[index];
      // Reset clamped actions when scrubbing backwards from the exact final frame.
      for (const animation of subject.animations) {
        const action = subject.mixer.existingAction(animation);
        if (action) action.paused = false;
      }
      const sampleTime =
        options.revision === 'comparison' && elapsed > subject.duration
          ? elapsed % subject.duration
          : time;
      subject.mixer.setTime(Math.min(subject.duration, sampleTime));
      subject.rig.visible = options.rig;
      for (const [mesh, material] of subject.materials)
        mesh.material = options.surface === 'Clay' ? clay : material;
      const track = subject.asset.motions[options.clip];
      const travel = track ? travelAt(track, sampleTime) : { x: 0, z: 0, yaw: 0 };
      if (track && loop) {
        const cycles = Math.floor(elapsed / subject.duration);
        travel.x += cycles * track.trajectory.at(-1)![1];
        travel.z += cycles * track.trajectory.at(-1)![2];
      }
      subject.root.rotation.y = travel.yaw;
      subject.root.position.set(
        options.movement === 'travel' ? travel.x : 0,
        0,
        options.movement === 'travel' ? travel.z : 0,
      );
      subject.grid.position.set(
        options.movement === 'travel' ? 0 : -travel.x % 0.25,
        0,
        options.movement === 'travel' ? 0 : -travel.z % 0.25,
      );
      subject.path.visible = options.movement === 'travel';
      const x = stacked ? 0 : panel * panelWidth;
      const y = stacked ? (indices.length - 1 - panel) * panelHeight : 0;
      renderer.setViewport(x, y, panelWidth, panelHeight);
      renderer.setScissor(x, y, panelWidth, panelHeight);
      renderer.setClearColor('#213438');
      renderer.clear();
      renderer.render(subject.scene, camera);
    });
    element.dataset.time = time.toFixed(3);
    element.dataset.clip = options.clip;
    element.dataset.revision = options.revision;
    element.dataset.character = options.character;
    element.dataset.surface = options.surface;
    element.dataset.movement = options.movement;
    element.dataset.complete = String(!loop && time >= duration);
    if (now - lastReport > 80) {
      report(time, !loop && time >= duration && options.playing);
      lastReport = now;
    }
  };
  frame = requestAnimationFrame(draw);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    document.removeEventListener('visibilitychange', resetTime);
    resize.disconnect();
    controls.dispose();
    subjects.forEach(release);
    subjects.length = 0;
    clay.dispose();
    environment.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
