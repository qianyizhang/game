import { useEffect, useState } from 'react';

/** One clock over resolved frames. Identity comes from the timeline, not array allocation. */
export function usePlaybackClock(
  sequence: unknown,
  frameCount: number,
  speed: number,
  continuous = false,
) {
  const [stored, setClock] = useState({
    sequence,
    index: 0,
    playing: true,
    inspect: false,
    progress: 0,
  });
  let clock = stored;
  if (!Object.is(stored.sequence, sequence)) {
    clock = { sequence, index: 0, playing: true, inspect: false, progress: 0 };
    setClock(clock);
  }
  const last = Math.max(0, frameCount - 1);
  const index = Math.min(clock.index, last);
  const { playing, inspect } = clock;
  const finished = index >= last;
  useEffect(() => {
    if (!continuous || !playing || finished) return;
    let previous = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const delta = Math.min(50, now - previous);
      previous = now;
      if (!document.hidden)
        setClock((current) => {
          if (!Object.is(current.sequence, sequence) || !current.playing) return current;
          const progress = current.progress + delta / speed;
          const index = Math.min(last, current.index + Math.floor(progress));
          return { ...current, index, progress: index === last ? 1 : progress % 1 };
        });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [sequence, last, playing, finished, speed, continuous]);
  useEffect(() => {
    if (continuous || !playing || finished) return;
    const timer = setTimeout(() => {
      setClock((current) =>
        Object.is(current.sequence, sequence)
          ? { ...current, index: Math.min(last, current.index + 1) }
          : current,
      );
    }, speed);
    return () => clearTimeout(timer);
  }, [sequence, index, last, playing, finished, speed, continuous]);
  return {
    index,
    last,
    playing,
    inspect,
    progress: clock.progress,
    finished,
    seek: (value: number) =>
      setClock({
        sequence,
        index: Math.max(0, Math.min(last, value)),
        playing: false,
        inspect: true,
        progress: 0,
      }),
    toggle: () =>
      setClock({
        sequence,
        index: finished ? 0 : index,
        playing: !playing || finished,
        inspect: false,
        progress: finished ? 0 : clock.progress,
      }),
    finish: () => setClock({ sequence, index: last, playing: false, inspect: false, progress: 1 }),
  };
}
