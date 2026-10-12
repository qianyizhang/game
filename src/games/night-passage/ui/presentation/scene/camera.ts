import * as T from 'three';
import { ARENA } from '../../../domain/content';
import type { Point } from '../../../domain/types';

export function createCamera(): T.OrthographicCamera {
  const camera = new T.OrthographicCamera(-600, 600, 375, -375, 1, 4000);
  camera.position.set(980, 950, 1020);
  camera.lookAt(480, 0, 300);
  camera.updateMatrixWorld();
  fitCamera(camera, ARENA.width / ARENA.height);
  return camera;
}

/** Fit the arena and standing silhouettes; UI size never changes the combat plane. */
export function fitCamera(camera: T.OrthographicCamera, aspect: number): void {
  const bounds = new T.Box3();
  for (const x of [0, ARENA.width])
    for (const z of [0, ARENA.height])
      for (const y of [0, 100])
        bounds.expandByPoint(new T.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));
  const height = Math.max(
    bounds.max.y - bounds.min.y + 70,
    (bounds.max.x - bounds.min.x + 70) / aspect,
  );
  const cx = (bounds.min.x + bounds.max.x) / 2;
  const cy = (bounds.min.y + bounds.max.y) / 2;
  camera.left = cx - (height * aspect) / 2;
  camera.right = cx + (height * aspect) / 2;
  camera.top = cy + height / 2;
  camera.bottom = cy - height / 2;
  camera.updateProjectionMatrix();
}

const ground = new T.Plane(new T.Vector3(0, 1, 0), 0);
/** NDC is screen x/y in [-1,1]; ground coordinates are rules x/y, without clamping. */
export function groundFromNdc(camera: T.Camera, point: Point): Point | null {
  const ray = new T.Raycaster();
  ray.setFromCamera(new T.Vector2(point.x, point.y), camera);
  const hit = ray.ray.intersectPlane(ground, new T.Vector3());
  return hit ? { x: hit.x, y: hit.z } : null;
}

export function groundDirection(camera: T.Camera, screen: Point): Point {
  const e = camera.matrixWorld.elements;
  const length = Math.hypot(e[0], e[2]);
  const right = { x: e[0] / length, y: e[2] / length };
  const x = right.x * screen.x - right.y * screen.y;
  const y = right.y * screen.x + right.x * screen.y;
  const scale = Math.max(1, Math.hypot(x, y));
  return { x: x / scale, y: y / scale };
}
