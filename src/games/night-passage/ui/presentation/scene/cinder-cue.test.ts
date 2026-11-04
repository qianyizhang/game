import { expect, test } from 'vitest';
import { cinderCueStyle } from './cinder-cue';

test('confirmed Cinder impact is immediately visible, holds briefly, then cools and expires', () => {
  expect(cinderCueStyle(1, false)).toEqual({ cooling: 0, opacity: 0.8 });
  expect(cinderCueStyle(14 / 16, false)).toEqual({ cooling: 0, opacity: 0.8 });
  const frames = Array.from({ length: 14 }, (_, tick) => cinderCueStyle((13 - tick) / 16, false));
  for (let tick = 0; tick < frames.length; tick++) {
    expect(frames[tick].cooling).toBeGreaterThan(0);
    expect(frames[tick].opacity).toBeGreaterThanOrEqual(0);
    expect(frames[tick].opacity).toBeLessThan(0.8);
    if (tick > 0) {
      expect(frames[tick].cooling).toBeGreaterThan(frames[tick - 1].cooling);
      expect(frames[tick].opacity).toBeLessThan(frames[tick - 1].opacity);
    }
  }
  expect(frames.at(-1)).toEqual({ cooling: 1, opacity: 0 });
});

test('paused frames and out-of-order seeks reconstruct the same style without a private clock', () => {
  const middle = cinderCueStyle(0.5, false);
  cinderCueStyle(0, false);
  cinderCueStyle(1, false);
  expect(cinderCueStyle(0.5, false)).toEqual(middle);
  expect(cinderCueStyle(2, false)).toEqual(cinderCueStyle(1, false));
  expect(cinderCueStyle(-1, false)).toEqual(cinderCueStyle(0, false));
});

test('reduced motion retains the original fixed color and linear fade throughout the cue', () => {
  for (let life = 16; life >= 0; life--)
    expect(cinderCueStyle(life / 16, true)).toEqual({ cooling: 0, opacity: (life / 16) * 0.8 });
});
