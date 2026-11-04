import { useEffect, useRef, useState } from 'react';
import { ARENA, DENSITIES, SHOP, WAVE_TICKS, type Density } from '../domain/content';
import { World, restore, type View } from '../domain/world';
import { createRenderer } from './renderer';
import { createClock } from './clock';
import './scrapyard.css';

/** Copy only display values; the renderer borrows the world's full view. */
function display(state: View) {
  return {
    phase: state.phase,
    tick: state.tick,
    wave: state.wave,
    waveTick: state.waveTick,
    enemyCount: state.enemies.length,
    hostileShotCount: state.hostileShots.length,
    kills: state.kills,
    scrap: state.scrap,
    player: { hp: state.player.hp, x: state.player.x, y: state.player.y },
    purchased: [...state.purchased],
  };
}

export default function ScrapyardApp() {
  const [initialWorld] = useState(() => new World());
  const world = useRef(initialWorld);
  const canvas = useRef<HTMLCanvasElement>(null);
  const keys = useRef(new Set<string>());
  const importSequence = useRef({ value: 0 });
  const paused = useRef(false);
  const [view, setView] = useState(() => display(world.current.view));
  const [ready, setReady] = useState(false);
  const [isPaused, setPaused] = useState(false);
  const [density, setDensity] = useState<Density>(100);
  const [seed, setSeed] = useState('scrap-01');
  const [error, setError] = useState('');
  const publish = () => setView(display(world.current.view));
  const pause = (value: boolean) => {
    paused.current = value;
    setPaused(value);
    keys.current.clear();
    publish();
  };
  const act = (command: unknown) => {
    setError(world.current.dispatch(command) ?? '');
    publish();
  };
  useEffect(() => {
    const heldKeys = keys.current;
    const imports = importSequence.current;
    document.title = 'Scrapyard · Horde prototype';
    if (!canvas.current) return;
    let presentation: ReturnType<typeof createRenderer>;
    try {
      presentation = createRenderer(canvas.current);
    } catch (cause) {
      setError(String(cause));
      return;
    }
    setReady(true);
    let request = 0,
      lastHud = 0;
    const clock = createClock();
    const stop = () => {
      paused.current = true;
      setPaused(true);
      heldKeys.clear();
      setView(display(world.current.view));
    };
    const keydown = (event: KeyboardEvent) => {
      if (!(event.target instanceof HTMLCanvasElement)) return;
      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key))
        event.preventDefault();
      if (key === 'escape' && !event.repeat) {
        paused.current = !paused.current;
        setPaused(paused.current);
        heldKeys.clear();
        setView(display(world.current.view));
      } else heldKeys.add(key);
    };
    const keyup = (event: KeyboardEvent) => {
      heldKeys.delete(event.key.toLowerCase());
    };
    const visibility = () => {
      if (document.hidden) stop();
    };
    const frame = (now: number) => {
      const s = world.current.view,
        phase = s.phase;
      const ticks = clock(now, !paused.current && phase === 'combat');
      if (ticks) {
        const held = heldKeys;
        const failure = world.current.dispatch({
          type: 'frame',
          ticks,
          x:
            Number(held.has('d') || held.has('arrowright')) -
            Number(held.has('a') || held.has('arrowleft')),
          y:
            Number(held.has('s') || held.has('arrowdown')) -
            Number(held.has('w') || held.has('arrowup')),
        });
        if (failure) {
          setError(failure);
          stop();
        }
      }
      presentation.draw(world.current.view);
      if (now - lastHud >= 100 || phase !== world.current.view.phase) {
        setView(display(world.current.view));
        lastHud = now;
      }
      request = requestAnimationFrame(frame);
    };
    request = requestAnimationFrame(frame);
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(request);
      heldKeys.clear();
      imports.value++;
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', visibility);
      presentation.dispose();
      setReady(false);
    };
  }, []);
  const start = () => {
    try {
      importSequence.current.value++;
      world.current = new World(seed, density);
      pause(false);
      act({ type: 'start' });
      canvas.current?.focus();
    } catch (cause) {
      setError(String(cause));
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([world.current.export()], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scrapyard-replay.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <main className="scrapyard">
      <header className="scrap-header">
        <div>
          <p className="scrap-eyebrow">WORKSHOP EXPERIMENT / 01</p>
          <h1>
            Scrapyard<span>Six barrels. One small survivor.</span>
          </h1>
        </div>
        <a href="?game=night-passage">← Workshop</a>
      </header>
      {error && (
        <p className="scrap-error" role="alert">
          {error}
        </p>
      )}
      <div className="scrap-layout">
        <section className="scrap-play" aria-label="Arena">
          <div className="scrap-hud">
            <strong>
              WAVE {view.wave}
              <span> / 3</span>
            </strong>
            <span>{Math.ceil((WAVE_TICKS - view.waveTick) / 60)}s left</span>
            <span>{view.enemyCount} enemies</span>
            <span>{view.hostileShotCount} hostile shots</span>
            <span>{view.kills} kills</span>
            <strong>{view.scrap} scrap</strong>
          </div>
          <div className="scrap-health">
            <span style={{ width: `${view.player.hp}%` }} />
          </div>
          <div className="scrap-stage">
            <canvas
              ref={canvas}
              width={ARENA.width}
              height={ARENA.height}
              tabIndex={0}
              aria-label="Scrapyard arena — WASD or arrow keys to move, Escape to pause"
              data-phase={view.phase}
              data-tick={view.tick}
              data-x={view.player.x}
              data-y={view.player.y}
              data-kills={view.kills}
              data-hp={view.player.hp}
              data-hostile-shots={view.hostileShotCount}
            />
            {(view.phase !== 'combat' || isPaused) && (
              <div className="scrap-overlay">
                <p className="scrap-eyebrow">
                  {view.phase === 'shop'
                    ? 'A MOMENT TO REBUILD'
                    : view.phase === 'won'
                      ? 'THREE WAVES. STILL STANDING.'
                      : 'SURVIVAL / AUTO-FIRE'}
                </p>
                <h2>
                  {view.phase === 'ready'
                    ? 'Make a little room.'
                    : view.phase === 'shop'
                      ? 'Spend your scrap.'
                      : view.phase === 'won'
                        ? 'You made it out.'
                        : view.phase === 'lost'
                          ? 'Overrun.'
                          : 'Take a breath.'}
                </h2>
                <p>
                  {view.phase === 'ready'
                    ? 'Dodge the coral bullets. Your six weapons handle the rest.'
                    : view.phase === 'shop'
                      ? 'Uncollected scrap is banked at the end of each wave.'
                      : view.phase === 'lost'
                        ? `${view.kills} enemies down. Try a wider path.`
                        : view.phase === 'won'
                          ? `${view.kills} kills · ${view.scrap} scrap left`
                          : 'Combat waits for you.'}
                </p>
                {view.phase === 'ready' || view.phase === 'won' || view.phase === 'lost' ? (
                  <button
                    className="scrap-primary"
                    disabled={!seed.trim() || !ready}
                    onClick={start}
                  >
                    {view.phase === 'ready' ? 'Start run' : 'Try again'}
                  </button>
                ) : view.phase === 'shop' ? (
                  <>
                    <div className="scrap-shop">
                      {(Object.keys(SHOP) as (keyof typeof SHOP)[]).map((id) => (
                        <button
                          key={id}
                          disabled={
                            view.purchased.includes(id) ||
                            view.scrap < SHOP[id].cost ||
                            (id === 'repair' && view.player.hp === 100)
                          }
                          onClick={() => act({ type: 'buy', item: id })}
                        >
                          <strong>{SHOP[id].name}</strong>
                          <span>{SHOP[id].detail}</span>
                          <b>{view.purchased.includes(id) ? 'Bought' : `${SHOP[id].cost} scrap`}</b>
                        </button>
                      ))}
                    </div>
                    <button
                      className="scrap-primary"
                      onClick={() => {
                        pause(false);
                        act({ type: 'next' });
                        canvas.current?.focus();
                      }}
                    >
                      Start wave {view.wave + 1}
                    </button>
                  </>
                ) : (
                  <button
                    className="scrap-primary"
                    onClick={() => {
                      pause(false);
                      canvas.current?.focus();
                    }}
                  >
                    Resume
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="scrap-footer">
            <span>
              <kbd>WASD</kbd> / <kbd>↑↓←→</kbd> move · auto-fire · <kbd>Esc</kbd> pause
            </span>
            <span>HP {view.player.hp} / 100</span>
            {view.phase === 'combat' && !isPaused && (
              <button
                onClick={() => {
                  pause(true);
                  canvas.current?.focus();
                }}
              >
                Pause
              </button>
            )}
          </div>
        </section>
        <aside className="scrap-sidebar">
          <section>
            <p className="scrap-eyebrow">YOUR LOADOUT</p>
            <h2>Scrap-built firepower</h2>
            <div className="scrap-loadout">
              <span>|||</span>
              <div>
                <strong>3 × Rivet gun</strong>
                <p>Fast, focused fire</p>
              </div>
            </div>
            <div className="scrap-loadout">
              <span>⋔</span>
              <div>
                <strong>2 × Scattergun</strong>
                <p>Three-round spread</p>
              </div>
            </div>
            <div className="scrap-loadout">
              <span>●</span>
              <div>
                <strong>1 × Scrap cannon</strong>
                <p>Slow, heavy rounds</p>
              </div>
            </div>
          </section>
          <section>
            <p className="scrap-eyebrow">NEXT RUN</p>
            <label>
              Enemy population
              <select
                aria-label="Enemy population"
                value={density}
                onChange={(event) => setDensity(Number(event.target.value) as Density)}
              >
                {DENSITIES.map((count) => (
                  <option key={count} value={count}>
                    {count} enemies
                  </option>
                ))}
              </select>
            </label>
            <label>
              Seed
              <input
                value={seed}
                maxLength={80}
                onChange={(event) => setSeed(event.target.value)}
              />
            </label>
            <p>
              Three 30-second waves. Spitters keep their distance and fire spread volleys. Green
              scrap buys upgrades.
            </p>
            {(view.phase === 'combat' || view.phase === 'shop') && (
              <button onClick={start} disabled={!seed.trim()}>
                Restart run
              </button>
            )}
          </section>
          <details>
            <summary>Prototype & replay</summary>
            <p>
              Session only; reload starts fresh. Export a replay to keep this run. Canvas 2D · fixed
              60 Hz rules.
            </p>
            <button onClick={download}>Export replay</button>
            <label>
              Import replay
              <input
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const input = event.currentTarget;
                  const sequence = ++importSequence.current.value;
                  pause(true);
                  void (async () => {
                    try {
                      if (file.size > 1_000_000) throw new Error('Replay is too large.');
                      const next = restore(await file.text());
                      if (sequence !== importSequence.current.value) return;
                      world.current = next;
                      setDensity(next.view.density);
                      setSeed(next.view.seed);
                      setError('');
                      publish();
                    } catch (cause) {
                      if (sequence === importSequence.current.value) setError(String(cause));
                    }
                    input.value = '';
                  })();
                }}
              />
            </label>
          </details>
        </aside>
      </div>
    </main>
  );
}
