import { useEffect, useRef, useState } from 'react';
import { createPlayback } from '../application/playback';
import { passageScore } from '../domain/score';
import { weapon } from '../domain/content';
import { createCanvasRenderer } from './presentation/canvas';
import { createSceneRenderer } from './presentation/scene';
import type { Renderer } from './presentation/renderer';
import './night-passage.css';

type Playback = ReturnType<typeof createPlayback>;
const timestamp = (ticks: number) =>
  `${Math.floor(ticks / 3600)}:${String(Math.floor(ticks / 60) % 60).padStart(2, '0')}`;

export default function ReplayViewer() {
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [snapshot, setSnapshot] = useState<ReturnType<Playback['snapshot']> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<'scene' | 'canvas'>('scene');
  const [notice, setNotice] = useState('Choose a chronicle to watch. Your game save is untouched.');
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<Renderer | null>(null);

  function load(text: string) {
    const next = createPlayback(text);
    setPlayback(next);
    setSnapshot(next.snapshot());
    setPlaying(false);
    setNotice('Recorded passage · spectator mode · your game save is untouched.');
  }

  useEffect(() => {
    const path = new URLSearchParams(location.search).get('replay');
    if (!path) return;
    const controller = new AbortController();
    void Promise.resolve()
      .then(() => {
        let url: URL;
        try {
          url = new URL(path, location.href);
        } catch {
          throw new Error('Invalid replay link. Choose a chronicle below.');
        }
        if (url.origin !== location.origin)
          throw new Error('Replay links must use this site. Choose a chronicle below.');
        return fetch(url, { signal: controller.signal });
      })
      .then((response) => {
        if (!response.ok) throw new Error('Replay file unavailable. Choose a chronicle below.');
        return response.text();
      })
      .then(load)
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setNotice(error instanceof Error ? error.message : 'Replay could not load.');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!canvas.current || !playback) return;
    const fallback = () => {
      setPlaying(false);
      setView('canvas');
      setNotice('2.5D unavailable; replay paused in 2D.');
    };
    try {
      renderer.current =
        view === 'scene'
          ? createSceneRenderer(canvas.current, fallback)
          : createCanvasRenderer(canvas.current);
    } catch {
      fallback();
      return;
    }
    const current = renderer.current;
    current.draw(playback.snapshot().state);
    return () => {
      current.dispose();
      renderer.current = null;
    };
  }, [playback, view]);

  useEffect(() => {
    if (!playback) return;
    let frame = 0;
    let previous = performance.now();
    let fraction = 0;
    let hud = 0;
    const resetTime = () => {
      previous = performance.now();
    };
    document.addEventListener('visibilitychange', resetTime);
    const draw = (now: number) => {
      const elapsed = Math.max(0, now - previous);
      previous = now;
      if (playing && !document.hidden) {
        fraction += (elapsed * 60 * speed) / 1000;
        const ticks = Math.floor(fraction);
        fraction -= ticks;
        const next = playback.advance(ticks);
        if (now - hud > 100 || next.finished) {
          setSnapshot(next);
          hud = now;
        }
        if (next.finished) setPlaying(false);
      }
      renderer.current?.draw(playback.snapshot().state);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', resetTime);
    };
  }, [playback, playing, speed]);

  const seek = (tick: number) => {
    if (!playback) return;
    setPlaying(false);
    setSnapshot(playback.seek(tick));
  };
  const state = snapshot?.state;
  const score = state ? passageScore(state) : null;
  return (
    <main className="np-app">
      <header className="np-header">
        <div>
          <p className="np-eyebrow">WATCH THE RECORDED RUN</p>
          <h1>Night Passage · Replay</h1>
        </div>
        <div className="np-tools">
          <label className="np-import">
            Open replay
            <input
              type="file"
              accept=".json,application/json"
              aria-label="Open replay to watch"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                void file
                  .text()
                  .then(load)
                  .catch((error: unknown) =>
                    setNotice(error instanceof Error ? error.message : 'Invalid replay.'),
                  );
              }}
            />
          </label>
          <button
            onClick={() => {
              location.href = '/?game=night-passage';
            }}
          >
            Back to game
          </button>
        </div>
      </header>
      {playback && state && score && snapshot && (
        <>
          <div className="np-hud">
            <div>
              <p className="np-eyebrow">
                REGION {state.region + 1} · CHAMBER {state.chamber + 1} · {state.phase}
              </p>
              <h2>{state.room.name}</h2>
            </div>
            <div className="np-resources">
              <span>{weapon(state.player.weapon).name}</span>
              <span>
                {state.difficulty} ·{' '}
                {state.rulesVersion === 'night-passage-4' ? 'original score' : 'speed score'}
              </span>
              <span>
                {Math.ceil(state.player.hp)} / {state.player.maxHp} HP
              </span>
              <span data-testid="np-replay-score">{score.value} points</span>
            </div>
          </div>
          <div className="np-tools np-replay-controls">
            <button
              onClick={() => {
                if (snapshot.finished) setSnapshot(playback.seek(0));
                setPlaying(!playing || snapshot.finished);
              }}
            >
              {playing ? 'Pause replay' : 'Play replay'}
            </button>
            <button onClick={() => seek(0)}>Restart</button>
            <label>
              Speed{' '}
              <select
                aria-label="Replay speed"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              >
                <option value={1}>1×</option>
                <option value={2}>2×</option>
                <option value={4}>4×</option>
                <option value={8}>8×</option>
              </select>
            </label>
            <label>
              View{' '}
              <select
                aria-label="Replay view"
                value={view}
                onChange={(event) => {
                  setPlaying(false);
                  setView(event.target.value as 'scene' | 'canvas');
                }}
              >
                <option value="scene">2.5D</option>
                <option value="canvas">2D</option>
              </select>
            </label>
            <button onClick={() => seek(snapshot.totalTicks)}>Show result</button>
            <span className="np-replay-time" data-testid="np-replay-time">
              {timestamp(snapshot.position)} / {timestamp(snapshot.totalTicks)}
            </span>
          </div>
          <input
            className="np-replay-position"
            type="range"
            aria-label="Replay position"
            min={0}
            max={snapshot.totalTicks}
            value={snapshot.position}
            onChange={(event) => seek(Number(event.target.value))}
          />
          <div className="np-stage">
            <canvas key={view} ref={canvas} aria-label="Recorded Night Passage arena" />
          </div>
          <p className="np-status">
            {snapshot.finished
              ? `Replay complete · ${state.phase === 'won' ? 'Escaped' : state.phase} · ${score.value} points`
              : state.message}
          </p>
        </>
      )}
      <p className="np-status" role="status">
        {notice}
      </p>
    </main>
  );
}
