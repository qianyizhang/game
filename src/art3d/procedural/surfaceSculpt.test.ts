import { expect, it } from 'vitest';
import { taperedSpineField } from './surfaceSculpt';

// Regression for the neck ridges observed under neutral lighting in the first construction.
it('keeps a linearly tapered spine smooth across sample joins', () => {
  const field = taperedSpineField(
    [
      [0, 0, 0],
      [0, 1, 0],
      [0, 2, 0],
    ],
    [0.3, 0.2, 0.1],
  );
  for (let i = 0; i < 40; i++) {
    const y = 0.25 + (i * 1.5) / 39,
      radius = (0.3 - 0.1 * y) / Math.sqrt(0.99);
    expect(Math.abs(field(radius, y, 0))).toBeLessThan(1e-7);
    const e = 1e-5,
      dx = (field(radius + e, y, 0) - field(radius - e, y, 0)) / (2 * e),
      dy = (field(radius, y + e, 0) - field(radius, y - e, 0)) / (2 * e);
    expect(dx).toBeCloseTo(Math.sqrt(0.99), 5);
    expect(dy).toBeCloseTo(0.1, 5);
  }
});
