import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObject } from '../../../src/shared/three/resources';
import { isMesh } from '../../../src/shared/three/objects';
import { type Motion } from '../motion-contract';

export type AttackPose = { clip: string; progress: number; side: number; visible: boolean };

/** Presentation samples the combat clock. It never advances or resolves combat. */
export function createAttackStage(
  element: HTMLDivElement,
  model: string,
  library: Record<string, Motion>,
  read: () => AttackPose,
  report: (value: string) => void,
) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Briar Stray performs the resolved attack.');
  element.appendChild(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(34, 1, 0.05, 50);
  scene.add(new T.HemisphereLight('#fff3d7', '#657469', 2));
  const light = new T.DirectionalLight('#fff1dc', 3);
  light.position.set(1, 5, 4);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, {
    left: -4,
    right: 4,
    top: 3,
    bottom: -3,
    near: 0.1,
    far: 20,
  });
  scene.add(light);
  const rim = new T.DirectionalLight('#bcd6df', 2);
  rim.position.set(-3, 3, -3);
  scene.add(rim);
  const floor = new T.Mesh(
    new T.CircleGeometry(3.8, 64),
    new T.MeshStandardMaterial({ color: '#29352b', roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.006;
  floor.receiveShadow = true;
  scene.add(floor);
  const ring = new T.Mesh(
    new T.RingGeometry(0.22, 0.27, 48),
    new T.MeshBasicMaterial({
      color: '#efbd66',
      transparent: true,
      opacity: 0,
      side: T.DoubleSide,
    }),
  );
  ring.position.set(1.8, 1.2, 0.1);
  scene.add(ring);
  let disposed = false,
    frame = 0,
    active = '';
  let root: T.Group | undefined, mixer: T.AnimationMixer | undefined;
  let animations: T.AnimationClip[] = [];
  let action: T.AnimationAction | undefined;
  const resize = new ResizeObserver(() => {
    const width = Math.max(1, element.clientWidth),
      height = Math.max(1, element.clientHeight);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.position.set(0.5, 2.2, Math.max(6.7, 4.5 / camera.aspect));
    camera.lookAt(0.1, 1.0, 0);
    camera.updateProjectionMatrix();
  });
  resize.observe(element);
  void new GLTFLoader()
    .loadAsync(model)
    .then((gltf) => {
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }
      root = gltf.scene;
      root.traverse((object) => {
        if (isMesh(object)) object.castShadow = true;
      });
      scene.add(root);
      animations = gltf.animations;
      mixer = new T.AnimationMixer(root);
      report('ready');
    })
    .catch(() => {
      if (!disposed) report('3D unavailable; the combat replay remains available below.');
    });
  const draw = () => {
    frame = requestAnimationFrame(draw);
    if (!root || !mixer || disposed || document.hidden) return;
    const pose = read();
    if (!pose.visible) return;
    const motion = library[pose.clip];
    if (!motion) return;
    if (active !== pose.clip) {
      mixer.stopAllAction();
      const clip = animations.find((a) => a.name === pose.clip);
      if (!clip) {
        report('Attack animation unavailable; use the card replay below.');
        return;
      }
      action = mixer.clipAction(clip);
      action.setLoop(T.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.reset().play();
      active = pose.clip;
    }
    if (action) action.paused = false;
    const progress = Math.max(0, Math.min(1, pose.progress));
    mixer.setTime(progress * motion.seconds);
    root.rotation.y = pose.side === 1 ? Math.PI : 0;
    root.position.x = pose.side === 1 ? 0.55 : -0.55;
    const contact = motion.markers.find((m) => m.name === 'contact')?.time ?? motion.seconds / 2;
    const distance = Math.abs(progress - contact / motion.seconds);
    ring.material.opacity = Math.max(0, 1 - distance / 0.09) * 0.85;
    ring.scale.setScalar(1 + distance * 6);
    ring.position.x = pose.side === 1 ? -1.8 : 1.8;
    element.dataset.clip = pose.clip;
    element.dataset.progress = progress.toFixed(3);
    element.dataset.side = String(pose.side);
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(draw);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    resize.disconnect();
    mixer?.stopAllAction();
    if (root) mixer?.uncacheRoot(root);
    disposeObject(scene);
    renderer.dispose();
    renderer.domElement.remove();
  };
}
