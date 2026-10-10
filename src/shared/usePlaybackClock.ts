import { useEffect, useState } from 'react';

/** One clock over resolved frames. Identity comes from the timeline, not array allocation. */
export function usePlaybackClock(sequence: unknown, frameCount: number, speed: number) {
  const [stored, setClock] = useState({ sequence, index: 0, playing: true, inspect: false });
  let clock = stored;
  if (!Object.is(stored.sequence, sequence)) {
    clock = { sequence, index: 0, playing: true, inspect: false };
    setClock(clock);
  }
  const last = Math.max(0, frameCount - 1);
  const index = Math.min(clock.index, last);
  const { playing, inspect } = clock;
  const finished = index >= last;
  useEffect(() => {
    if (!playing || finished) return;
    const timer = setTimeout(() => {
      setClock((current) =>
        Object.is(current.sequence, sequence)
          ? { ...current, index: Math.min(last, current.index + 1) }
          : current,
      );
    }, speed);
    return () => clearTimeout(timer);
  }, [sequence, index, last, playing, finished, speed]);
  return {
    index,
    last,
    playing,
    inspect,
    finished,
    seek: (value: number) =>
      setClock({
        sequence,
        index: Math.max(0, Math.min(last, value)),
        playing: false,
        inspect: true,
      }),
    toggle: () =>
      setClock({
        sequence,
        index: finished ? 0 : index,
        playing: !playing || finished,
        inspect: false,
      }),
    finish: () => setClock({ sequence, index: last, playing: false, inspect: false }),
  };
}
