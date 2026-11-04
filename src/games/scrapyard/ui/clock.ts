import { STEP_MS } from '../domain/content';
/** Real-time accumulator: cap catch-up; pausing discards elapsed combat time. */
export function createClock() {
  let previous: number | null = null,
    remainder = 0;
  return (now: number, active: boolean) => {
    const elapsed = previous === null ? 0 : Math.max(0, Math.min(100, now - previous));
    previous = now;
    if (!active) {
      remainder = 0;
      return 0;
    }
    remainder += elapsed;
    const ticks = Math.min(6, Math.floor(remainder / STEP_MS));
    remainder -= ticks * STEP_MS;
    return ticks;
  };
}
