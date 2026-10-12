import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { createCamera, fitCamera, groundDirection, groundFromNdc } from './camera';

describe('orthographic combat plane', () => {
  it('fits standing silhouettes and round-trips ground aim across viewport shapes', () => {
    const camera = createCamera();
    for (const aspect of [0.65, 1.6, 2.4]) {
      fitCamera(camera, aspect);
      for (const [x, z] of [
        [0, 0],
        [960, 0],
        [0, 600],
        [960, 600],
        [480, 300],
        [234, 478],
      ]) {
        for (const y of [0, 100]) {
          const view = new Vector3(x, y, z).project(camera);
          expect(Math.abs(view.x)).toBeLessThan(1);
          expect(Math.abs(view.y)).toBeLessThan(1);
        }
        const view = new Vector3(x, 0, z).project(camera);
        const hit = groundFromNdc(camera, view)!;
        expect(hit.x).toBeCloseTo(x, 8);
        expect(hit.y).toBeCloseTo(z, 8);
      }
    }
  });
  it('maps right/up controls to right/up on screen without diagonal speed gain', () => {
    const camera = createCamera();
    const origin = new Vector3(480, 0, 300).project(camera);
    for (const input of [
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
    ]) {
      const direction = groundDirection(camera, input);
      expect(Math.hypot(direction.x, direction.y)).toBeCloseTo(1);
      const moved = new Vector3(480 + direction.x * 100, 0, 300 + direction.y * 100).project(
        camera,
      );
      if (!input.x) expect(moved.x).toBeCloseTo(origin.x, 8);
      else expect(moved.x).toBeGreaterThan(origin.x);
      if (!input.y) expect(moved.y).toBeCloseTo(origin.y, 8);
      else expect(moved.y).toBeGreaterThan(origin.y);
    }
  });
});
