import { expect, it } from 'vitest';
import { stepFrame } from './field-runtime';
import { displayPoint } from './render';
it('delivers the same simulation time at 30, 60 and 144 Hz, and excludes suspended time', () => {
  for (const hz of [30, 60, 144]) {
    const clock = { last: null as number | null, remainder: 0 };
    let ticks = 0;
    for (let n = 0; n <= hz; n++) ticks += stepFrame(clock, (n * 1000) / hz, true).ticks;
    expect(ticks).toBe(20);
    expect(stepFrame(clock, 10000, false).ticks).toBe(0);
    expect(stepFrame(clock, 10001, true).ticks).toBe(0);
    expect(stepFrame(clock, 20000, true).ticks).toBe(5);
  }
  expect(displayPoint({ x: 2, y: 2 }, { x: 1, y: 2 }, 0.5)).toEqual({ x: 1.5, y: 2 });
  expect(displayPoint({ x: 50, y: 2 }, { x: 1, y: 2 }, 0.5)).toEqual({ x: 50, y: 2 });
});
