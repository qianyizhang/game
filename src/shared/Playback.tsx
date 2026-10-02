import { useEffect, useState, type ReactNode } from 'react';
import './workshop.css';

/** A presentation-only clock. The game has already resolved every frame. */
export function Playback<T>({
  frames,
  label,
  render,
  children,
}: {
  frames: readonly T[];
  label: string;
  render: (frame: T, index: number) => ReactNode;
  children: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [inspect, setInspect] = useState(false);
  const [speed, setSpeed] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('card-workshop.playback-speed'));
      return [1000, 600, 300, 100].includes(saved) ? saved : 600;
    } catch {
      return 600;
    }
  });
  const last = Math.max(0, frames.length - 1);
  const finished = index >= last;
  useEffect(() => {
    if (!playing || finished) return;
    const timer = setTimeout(() => setIndex((i) => Math.min(last, i + 1)), speed);
    return () => clearTimeout(timer);
  }, [playing, finished, last, speed, index]);
  if (!frames.length) return <>{children}</>;
  const active = !finished || inspect;
  const seek = (value: number) => {
    setIndex(value);
    setPlaying(false);
    setInspect(true);
  };
  return (
    <>
      <section
        className={`resolution-player ${active ? 'is-playing' : 'is-finished'}`}
        aria-label={label}
      >
        <div className="resolution-heading">
          <strong>{label}</strong>
          <span>
            Event {index + 1}/{frames.length}
          </span>
          {!active && <button onClick={() => seek(0)}>Inspect last action</button>}
        </div>
        {active && (
          <>
            <div className="resolution-frame" key={index}>
              {render(frames[index], index)}
            </div>
            <div className="playback-controls">
              <button
                aria-label="Previous event"
                disabled={index === 0}
                onClick={() => seek(index - 1)}
              >
                ←
              </button>
              <button
                onClick={() => {
                  if (finished) setIndex(0);
                  setInspect(false);
                  setPlaying(!playing || finished);
                }}
              >
                {playing && !finished ? 'Pause' : 'Play'}
              </button>
              <button aria-label="Next event" disabled={finished} onClick={() => seek(index + 1)}>
                →
              </button>
              <label>
                Speed{' '}
                <select
                  aria-label="Resolution speed"
                  value={speed}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setSpeed(next);
                    try {
                      localStorage.setItem('card-workshop.playback-speed', String(next));
                    } catch {
                      /* Playback remains available. */
                    }
                  }}
                >
                  <option value={1000}>0.6×</option>
                  <option value={600}>1×</option>
                  <option value={300}>2×</option>
                  <option value={100}>6×</option>
                </select>
              </label>
              <button
                onClick={() => {
                  setIndex(last);
                  setInspect(false);
                  setPlaying(false);
                }}
              >
                Skip to result
              </button>
            </div>
            <input
              type="range"
              aria-label="Resolution event"
              min={0}
              max={last}
              value={index}
              onChange={(e) => seek(Number(e.target.value))}
            />
            <p className="muted small">Playback changes the view, never the outcome.</p>
          </>
        )}
      </section>
      {!active && children}
    </>
  );
}
