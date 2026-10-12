import * as T from 'three';
import type { State } from '../../../domain/types';
import type { Renderer } from '../renderer';
import { createCamera, fitCamera, groundFromNdc, groundDirection } from './camera';
import { createRoom } from './room';
import { createGroundEffects } from './ground-effects';
import { createActors } from './actors';

export function createSceneRenderer(canvas: HTMLCanvasElement, unavailable: () => void): Renderer {
  const gl = new T.WebGLRenderer({ canvas, antialias: true, alpha: false });
  gl.setClearColor('#0e1b26');
  gl.outputColorSpace = T.SRGBColorSpace;
  gl.toneMapping = T.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1.2;
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = T.PCFShadowMap;
  const scene = new T.Scene();
  const world = new T.Group();
  scene.add(world);
  const camera = createCamera();
  scene.add(new T.HemisphereLight('#c6e3ec', '#314348', 2.4));
  const sun = new T.DirectionalLight('#ffdfa6', 3);
  sun.position.set(180, 750, 150);
  sun.target.position.set(480, 0, 300);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -750,
    right: 750,
    top: 750,
    bottom: -750,
    near: 1,
    far: 1800,
  });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 1;
  scene.add(sun, sun.target);
  const effects = createGroundEffects(world);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false;
  let dirty = true;
  let width = 0;
  let height = 0;
  let ratio = 0;
  let lastState: State | null = null;
  const redraw = () => {
    dirty = true;
  };
  const room = createRoom(world, redraw);
  const actors = createActors(world, redraw);
  const resize = () => {
    if (disposed) return;
    const box = canvas.getBoundingClientRect();
    width = box.width;
    height = box.height;
    ratio = Math.min(2, window.devicePixelRatio || 1);
    if (!width || !height) return;
    gl.setPixelRatio(ratio);
    gl.setSize(width, height, false);
    fitCamera(camera, width / height);
    dirty = true;
  };
  const lost = (event: Event) => {
    event.preventDefault();
    if (!disposed) unavailable();
  };
  canvas.addEventListener('webglcontextlost', lost);
  motion.addEventListener('change', redraw);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  return {
    draw(state) {
      if (disposed) return;
      if (ratio !== Math.min(2, window.devicePixelRatio || 1)) resize();
      if (!width || !height || (!dirty && lastState === state)) return;
      room.sync(state, camera);
      actors.sync(state, motion.matches);
      effects.sync(state);
      gl.render(scene, camera);
      lastState = state;
      dirty = false;
    },
    groundPoint(client) {
      if (disposed) return null;
      const box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) return null;
      // Match the current CSS viewport even before ResizeObserver's next delivery.
      if (box.width !== width || box.height !== height) resize();
      return groundFromNdc(camera, {
        x: ((client.x - box.left) / box.width) * 2 - 1,
        y: 1 - ((client.y - box.top) / box.height) * 2,
      });
    },
    groundDirection(screen) {
      return groundDirection(camera, screen);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      motion.removeEventListener('change', redraw);
      actors.dispose();
      effects.dispose();
      room.dispose();
      sun.shadow.dispose();
      gl.dispose();
      // React StrictMode reuses the attached canvas for its setup/cleanup probe.
      // Lose the context only once the surface is detached; owned GPU resources are
      // disposed in both cases, and an attached surface can initialize again.
      if (!canvas.isConnected && !gl.getContext().isContextLost()) gl.forceContextLoss();
      scene.clear();
      lastState = null;
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
