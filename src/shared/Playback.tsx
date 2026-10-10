import { Fragment, useState, type ReactNode } from 'react';
import { usePlaybackClock } from './usePlaybackClock';
import './workshop.css';

/** A presentation-only clock. The game has already resolved every frame. */
export function Playback<T>({
  frames,
  sequence,
  label,
  render,
  children,
}: {
  frames: readonly T[];
  sequence: string | number;
  label: string;
  render: (frame: T, index: number) => ReactNode;
  children: ReactNode;
}) {
  const [speed, setSpeed] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('card-workshop.playback-speed'));
      return [1000, 600, 300, 100].includes(saved) ? saved : 600;
    } catch {
      return 600;
    }
  });
  const { index, last, playing, inspect, finished, seek, toggle, finish } = usePlaybackClock(
    sequence,
    frames.length,
    speed,
  );
  const result = <Fragment key={sequence}>{children}</Fragment>;
  if (!frames.length) return result;
  const active = !finished || inspect;
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
              <button onClick={toggle}>{playing && !finished ? 'Pause' : 'Play'}</button>
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
              <button onClick={finish}>Skip to result</button>
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
      {!active && result}
    </>
  );
}
