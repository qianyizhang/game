import { expect, it } from 'vitest';
import { createClock } from './clock';

it('caps catch-up and discards paused or suspended combat time', () => {
  const clock = createClock();
  expect(clock(0, true)).toBe(0);
  expect(clock(1000, true)).toBe(6);
  expect(clock(2000, false)).toBe(0);
  expect(clock(2010, true)).toBe(0);
  expect(clock(2020, true)).toBe(1);
});
