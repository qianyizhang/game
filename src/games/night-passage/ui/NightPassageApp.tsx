import { useEffect, useRef, useState } from 'react';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  SAVE_KEY,
  type Session,
} from '../application/session';
import {
  boon,
  CHAMBERS_PER_REGION,
  GODS,
  REGIONS,
  RUNES,
  WEAPONS,
  weapon,
} from '../domain/content';
import type { Command, Input, Point, RuneId, WeaponId } from '../domain/types';
import { createCanvasRenderer } from './presentation/canvas';
import { createSceneRenderer } from './presentation/scene';
import type { Renderer } from './presentation/renderer';
import { PassageAudio } from './audio';
import { PatronArt, RewardArt, RuneArt, WeaponArt } from './Artwork';
import './night-passage.css';

const VIEW_KEY = 'card-workshop.night-passage.view.v1';
type Presentation = 'scene' | 'canvas';
function preferredView(): Presentation {
  try {
    return localStorage.getItem(VIEW_KEY) === 'canvas' ? 'canvas' : 'scene';
  } catch {
    return 'scene';
  }
}

function load(): { session: Session; error: string; preserve: boolean; original: string | null } {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(SAVE_KEY);
    return {
      session: saved ? importSession(saved) : newSession(),
      error: '',
      preserve: false,
      original: null,
    };
  } catch {
    return {
      session: newSession(),
      error:
        saved === null
          ? 'Storage unavailable. Export this chronicle to keep your progress; any existing stored save is left untouched.'
          : 'Saved chronicle could not load. Its bytes are preserved until you explicitly start a new chronicle or import a valid one.',
      preserve: true,
      original: saved,
    };
  }
}
const emptyInput = (): Input => ({
  x: 0,
  y: 0,
  aim: -Math.PI / 2,
  attack: false,
  special: false,
  dash: false,
  cast: false,
  call: false,
});
function downloadText(text: string, name = 'night-passage.json'): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function NightPassageApp() {
  const [initial] = useState(load);
  const session = useRef(initial.session);
  const preserve = useRef(initial.preserve);
  const [view, setView] = useState(initial.session.state);
  const [error, setError] = useState(initial.error);
  const [storage, setStorage] = useState('');
  const [paused, setPaused] = useState(true);
  const [presentation, setPresentation] = useState<Presentation>(preferredView);
  const [presentationNotice, setPresentationNotice] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [newSeed, setNewSeed] = useState('a-light-in-the-dark');
  const [sound, setSound] = useState(true);
  const soundEnabled = useRef(true);
  const audio = useRef<PassageAudio | null>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponId>('sword');
  const [runes, setRunes] = useState<RuneId[]>(['vigor', 'fleet']);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<Renderer | null>(null);
  const controls = useRef(emptyInput());
  const pointer = useRef<Point | null>(null);
  const keys = useRef(new Set<string>());
  const lastSave = useRef(0);
  useEffect(() => {
    if (resetOpen) resetDialog.current?.showModal();
  }, [resetOpen]);
  useEffect(() => () => audio.current?.close(), []);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const unavailable = () => {
      setPaused(true);
      setPresentationNotice(
        'The 2.5D view became unavailable. Your passage is paused in 2D; you can resume here.',
      );
      setPresentation('canvas');
    };
    let viewRenderer: Renderer;
    try {
      viewRenderer =
        presentation === 'scene'
          ? createSceneRenderer(element, unavailable)
          : createCanvasRenderer(element);
    } catch {
      if (presentation === 'scene') unavailable();
      else
        setPresentationNotice(
          'The arena could not be drawn. Reload to try again; your chronicle remains exportable.',
        );
      return;
    }
    renderer.current = viewRenderer;
    viewRenderer.draw(session.current.state);
    return () => {
      renderer.current = null;
      viewRenderer.dispose();
    };
  }, [presentation]);
  const save = () => {
    if (preserve.current) return;
    try {
      localStorage.setItem(SAVE_KEY, exportSession(session.current));
      setStorage('Chronicle saved locally');
    } catch {
      setStorage('Storage unavailable. Export your chronicle to keep this passage.');
    }
  };
  const send = (command: Command) => {
    const result = dispatch(session.current, command);
    if (result.error) {
      setError(result.error);
      return;
    }
    session.current = result.session;
    setView(result.session.state);
    setError('');
    save();
  };
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    if (paused) setView(session.current.state);
    let frame = 0;
    let previous = 0;
    let accumulator = 0;
    let lastHud = 0;
    const saveCurrent = () => {
      if (preserve.current) return;
      try {
        localStorage.setItem(SAVE_KEY, exportSession(session.current));
        setStorage('Chronicle saved locally');
      } catch {
        setStorage('Storage unavailable. Export your chronicle to keep this passage.');
      }
    };
    const clearControls = () => {
      keys.current.clear();
      controls.current = emptyInput();
    };
    const stop = () => {
      clearControls();
      setPaused(true);
      saveCurrent();
    };
    const visibility = () => {
      if (document.hidden) stop();
    };
    const release = () => {
      controls.current.attack = false;
      controls.current.special = false;
    };
    const tick = (now: number) => {
      const elapsed = previous ? Math.min(100, now - previous) : 0;
      previous = now;
      if (!paused && renderer.current && session.current.state.phase === 'combat') {
        accumulator += elapsed;
        const steps = Math.min(6, Math.floor(accumulator / (1000 / 60)));
        if (steps) {
          accumulator -= (steps * 1000) / 60;
          const held = keys.current;
          const ground = pointer.current ? renderer.current?.groundPoint(pointer.current) : null;
          const direction = renderer.current.groundDirection({
            x:
              Number(held.has('d') || held.has('arrowright')) -
              Number(held.has('a') || held.has('arrowleft')),
            y:
              Number(held.has('s') || held.has('arrowdown')) -
              Number(held.has('w') || held.has('arrowup')),
          });
          const input: Input = {
            ...controls.current,
            aim: ground
              ? Math.atan2(
                  ground.y - session.current.state.player.y,
                  ground.x - session.current.state.player.x,
                )
              : controls.current.aim,
            x: direction.x,
            y: direction.y,
            attack: controls.current.attack || held.has('j'),
            special: controls.current.special || held.has('k'),
            cast: held.has('q'),
            call: held.has('r'),
            dash: held.has(' ') || held.has('shift'),
          };
          const before = session.current.state;
          const result = dispatch(session.current, { type: 'frame', input, ticks: steps });
          if (result.error) {
            setError(result.error);
            setPaused(true);
          } else session.current = result.session;
          if (soundEnabled.current) audio.current?.update(before, session.current.state);
          if (session.current.state.phase !== before.phase || now - lastSave.current > 3000) {
            saveCurrent();
            lastSave.current = now;
          }
          if (now - lastHud > 100 || session.current.state.phase !== before.phase) {
            setView(session.current.state);
            lastHud = now;
          }
          if (session.current.state.phase !== 'combat') clearControls();
        }
      } else accumulator = 0;
      renderer.current?.draw(session.current.state);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener('blur', stop);
    window.addEventListener('pointerup', release);
    window.addEventListener('pagehide', saveCurrent);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(frame);
      clearControls();
      saveCurrent();
      window.removeEventListener('blur', stop);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pagehide', saveCurrent);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [paused, presentation]);
  const focusPlay = () => {
    if (soundEnabled.current) {
      audio.current ??= new PassageAudio();
      void audio.current.start();
    }
    setPaused(false);
    canvas.current?.focus();
  };
  const start = () => {
    send({ type: 'start', weapon: selectedWeapon, runes });
    focusPlay();
  };
  const p = view.player;
  const region = REGIONS[view.region];
  const overlay = view.phase !== 'combat' || paused;
  return (
    <main className="np-app">
      <header className="np-header">
        <div>
          <p className="np-eyebrow">A ROGUELITE OF BORROWED LIGHT</p>
          <h1>Night Passage</h1>
        </div>
        <div className="np-tools">
          <label>
            <span className="np-eyebrow">View</span>
            <select
              aria-label="Arena view"
              value={presentation}
              onChange={(event) => {
                const next = event.target.value as Presentation;
                setPaused(true);
                setPresentation(next);
                setPresentationNotice('');
                pointer.current = null;
                try {
                  localStorage.setItem(VIEW_KEY, next);
                } catch {
                  /* Preference is optional. */
                }
              }}
            >
              <option value="scene">2.5D view</option>
              <option value="canvas">2D view</option>
            </select>
          </label>
          <button
            aria-pressed={sound}
            onClick={() => {
              soundEnabled.current = !sound;
              setSound(!sound);
              if (!sound) {
                audio.current ??= new PassageAudio();
                void audio.current.start();
              } else audio.current?.mute();
            }}
          >
            Sound {sound ? 'on' : 'off'}
          </button>
          <button
            onClick={() => {
              setPaused(true);
              downloadText(exportSession(session.current));
            }}
          >
            Export chronicle
          </button>
          <button
            onClick={() => {
              setPaused(true);
              setResetOpen(true);
            }}
          >
            New chronicle
          </button>
          <label className="np-import">
            Import
            <input
              type="file"
              accept=".json,application/json"
              aria-label="Import Night Passage chronicle"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                setPaused(true);
                void file
                  .text()
                  .then((text) => {
                    const restored = importSession(text);
                    session.current = restored;
                    preserve.current = false;
                    setView(restored.state);
                    setSelectedWeapon(restored.state.player.weapon);
                    setRunes(
                      restored.state.player.runes.filter((id) =>
                        restored.state.profile.unlockedRunes.includes(id),
                      ),
                    );
                    setError('Chronicle restored.');
                    save();
                  })
                  .catch((e: unknown) =>
                    setError(e instanceof Error ? e.message : 'Import failed.'),
                  );
              }}
            />
          </label>
          {view.phase === 'combat' && (
            <button
              onClick={() => {
                if (paused) focusPlay();
                else setPaused(true);
              }}
            >
              {paused ? 'Resume passage' : 'Pause'}
            </button>
          )}
        </div>
      </header>
      {resetOpen && (
        <dialog
          ref={resetDialog}
          className="np-reset"
          onCancel={() => setResetOpen(false)}
          aria-label="Start a new chronicle"
        >
          <h2>Begin a new chronicle</h2>
          <p>
            This resets all ash, unlocks and passages. Your current chronicle will download before
            the reset, so you can import it later. Any preserved unreadable original will download
            separately.
          </p>
          <label>
            Chronicle seed
            <input
              maxLength={120}
              value={newSeed}
              onChange={(event) => setNewSeed(event.target.value)}
            />
          </label>
          <div>
            <button onClick={() => setResetOpen(false)}>Keep current chronicle</button>
            <button
              disabled={!newSeed.trim()}
              onClick={() => {
                if (preserve.current && initial.original !== null)
                  downloadText(initial.original, 'night-passage-unreadable.json');
                downloadText(exportSession(session.current));
                session.current = newSession(newSeed.trim());
                preserve.current = false;
                pointer.current = null;
                setView(session.current.state);
                setRunes(['vigor', 'fleet']);
                setResetOpen(false);
                setError('');
                save();
              }}
            >
              Export and reset
            </button>
          </div>
        </dialog>
      )}
      {error && (
        <p role="alert" className="np-notice">
          {error}
        </p>
      )}
      {presentationNotice && (
        <p role="alert" className="np-notice">
          {presentationNotice}
        </p>
      )}
      {preserve.current && (
        <div>
          {initial.original !== null && (
            <button
              onClick={() => downloadText(initial.original!, 'night-passage-unreadable.json')}
            >
              Download original save
            </button>
          )}
          <button
            onClick={() => {
              session.current = newSession();
              preserve.current = false;
              setView(session.current.state);
              setError('');
              save();
            }}
          >
            Replace unreadable save with a new chronicle
          </button>
        </div>
      )}
      <div className="np-layout">
        <section className="np-main" aria-label="Passage">
          <div className="np-hud">
            <div>
              <span className="np-eyebrow">
                {view.phase === 'hub'
                  ? 'BETWEEN PASSAGES'
                  : `REGION ${view.region + 1} OF ${REGIONS.length} · CHAMBER ${view.chamber + 1} OF ${CHAMBERS_PER_REGION}`}
              </span>
              <h2>{view.phase === 'hub' ? 'The Lantern Quay' : view.room.name}</h2>
            </div>
            <div className="np-resources">
              <span data-testid="np-health">
                {Math.ceil(p.hp)} / {p.maxHp} HP
              </span>
              <span>{view.gold} gold</span>
              <span>{p.casts} / 3 casts</span>
              <span>{Math.floor(p.charge)}% call</span>
            </div>
          </div>
          <div className="np-health">
            <div style={{ width: `${(p.hp / p.maxHp) * 100}%` }} />
          </div>
          <div className="np-stage">
            <canvas
              key={presentation}
              ref={canvas}
              tabIndex={0}
              aria-label="Night Passage combat arena"
              data-phase={view.phase}
              data-tick={view.tick}
              data-view={presentation}
              onContextMenu={(event) => event.preventDefault()}
              onPointerMove={(event) => {
                pointer.current = { x: event.clientX, y: event.clientY };
              }}
              onPointerDown={(event) => {
                event.currentTarget.focus();
                if (event.button === 0) controls.current.attack = true;
                if (event.button === 2) controls.current.special = true;
              }}
              onKeyDown={(event) => {
                const key = event.key.toLowerCase();
                if (event.ctrlKey || event.metaKey || event.altKey) return;
                if (key === 'escape') {
                  event.preventDefault();
                  setPaused((value) => !value);
                  return;
                }
                if (
                  [
                    'w',
                    'a',
                    's',
                    'd',
                    'arrowup',
                    'arrowdown',
                    'arrowleft',
                    'arrowright',
                    ' ',
                    'shift',
                    'j',
                    'k',
                    'q',
                    'r',
                  ].includes(key)
                ) {
                  event.preventDefault();
                  keys.current.add(key);
                }
              }}
              onKeyUp={(event) => keys.current.delete(event.key.toLowerCase())}
              onBlur={() => {
                keys.current.clear();
                controls.current = emptyInput();
              }}
            />
            {overlay && (
              <div className={`np-overlay ${view.phase === 'hub' ? 'np-quay' : ''}`}>
                {view.phase === 'hub' ? (
                  <>
                    <p className="np-eyebrow">THE FERRY LEAVES WHEN YOU ARE READY</p>
                    <h2>Carry a light into the dark.</h2>
                    <p>
                      Four realms stand between the quay and morning. Choose a weapon, bind two
                      runes, and accept what the gods offer.
                    </p>
                    <div className="np-weapons" role="group" aria-label="Choose weapon">
                      {WEAPONS.map((w) => (
                        <button
                          key={w.id}
                          aria-pressed={w.id === selectedWeapon}
                          onClick={() => setSelectedWeapon(w.id)}
                        >
                          <WeaponArt id={w.id} />
                          <strong>{w.name}</strong>
                          <span>{w.id}</span>
                        </button>
                      ))}
                    </div>
                    <p className="np-weapon-description">{weapon(selectedWeapon).description}</p>
                    <div className="np-runes" role="group" aria-label="Choose up to two runes">
                      {RUNES.map((r) => (
                        <button
                          key={r.id}
                          disabled={!view.profile.unlockedRunes.includes(r.id)}
                          aria-pressed={runes.includes(r.id)}
                          title={r.description}
                          onClick={() =>
                            setRunes((selected) =>
                              selected.includes(r.id)
                                ? selected.filter((id) => id !== r.id)
                                : selected.length < 2
                                  ? [...selected, r.id]
                                  : [selected[1], r.id],
                            )
                          }
                        >
                          <RuneArt id={r.id} />
                          {r.name}
                          {!view.profile.unlockedRunes.includes(r.id)
                            ? ` · region ${r.unlock}`
                            : ''}
                        </button>
                      ))}
                    </div>
                    <p className="np-rune-description">
                      {runes.map((id) => RUNES.find((r) => r.id === id)!.description).join(' ')}
                    </p>
                    <div className="np-quay-actions">
                      <button className="np-primary" onClick={start}>
                        Begin passage
                      </button>
                      <button
                        disabled={
                          view.profile.vitality >= 3 ||
                          view.profile.ash < (view.profile.vitality + 1) * 15
                        }
                        onClick={() => send({ type: 'train' })}
                      >
                        Train vitality · {(view.profile.vitality + 1) * 15} ash
                      </button>
                    </div>
                    <p className="np-meta">
                      {view.profile.ash} ash · Vitality {view.profile.vitality}/3 ·{' '}
                      {view.profile.runs} passages · {view.profile.wins} escapes
                    </p>
                  </>
                ) : view.phase === 'reward' ? (
                  <>
                    <p className="np-eyebrow">A LIGHT ANSWERS YOURS</p>
                    <h2>Choose a blessing</h2>
                    <div className="np-choices">
                      {view.offers.map((id) => {
                        const b = boon(id);
                        const owned = p.boons.find((entry) => entry.id === id);
                        const replacing = p.boons.find(
                          (entry) =>
                            boon(entry.id).slot === b.slot && entry.id !== id && b.slot !== 'duo',
                        );
                        return (
                          <button key={id} onClick={() => send({ type: 'choose', id })}>
                            <PatronArt
                              god={b.god}
                              partner={b.requires?.find((god) => god !== b.god)}
                            />
                            <span
                              className="np-eyebrow"
                              style={{ color: GODS.find((g) => g.id === b.god)!.color }}
                            >
                              {b.slot} · {owned ? `Upgrade to ${owned.level + 1}` : 'New blessing'}
                            </span>
                            <strong>{b.name}</strong>
                            <span>{b.description}</span>
                            {replacing && <small>Replaces {boon(replacing.id).name}</small>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : view.phase === 'route' ? (
                  <>
                    <p className="np-eyebrow">THE PASSAGE FORKS</p>
                    <h2>Choose your next chamber</h2>
                    <p>{view.message}</p>
                    <div className="np-choices">
                      {view.routes.map((route, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            send({ type: 'travel', index });
                            focusPlay();
                          }}
                        >
                          <RewardArt kind={route.reward} />
                          <strong>{route.label}</strong>
                          <span>{route.detail}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : view.phase === 'shop' ? (
                  <>
                    <p className="np-eyebrow">THE WANDERING MARKET</p>
                    <h2>Something for the road?</h2>
                    <p>{view.gold} gold available</p>
                    <div className="np-choices">
                      {(['heal', 'heart', 'boon'] as const).map((item) => (
                        <button
                          key={item}
                          disabled={
                            view.purchases.includes(item) ||
                            view.gold < { heal: 35, heart: 60, boon: 80 }[item] ||
                            (item === 'heal' && p.hp === p.maxHp)
                          }
                          onClick={() => send({ type: 'buy', item })}
                        >
                          <RewardArt kind={item === 'heal' ? 'fountain' : item} />
                          <strong>
                            {
                              {
                                heal: 'Restore 40 health',
                                heart: '+20 maximum health',
                                boon: 'Divine audience',
                              }[item]
                            }
                          </strong>
                          <span>{{ heal: 35, heart: 60, boon: 80 }[item]} gold</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => send({ type: 'leave' })}>Leave market</button>
                  </>
                ) : view.phase === 'won' || view.phase === 'lost' ? (
                  <>
                    <p className="np-eyebrow">
                      {view.phase === 'won' ? 'MORNING, AT LAST' : 'ANOTHER LIGHT REMEMBERED'}
                    </p>
                    <h2>
                      {view.phase === 'won'
                        ? 'Beyond the Starless Gate'
                        : 'The quay calls you home'}
                    </h2>
                    <p>{view.message}</p>
                    <p>
                      {view.roomsCleared} chambers cleared · {view.kills} foes defeated ·{' '}
                      {view.earnedAsh} ash earned
                    </p>
                    <button className="np-primary" onClick={() => send({ type: 'return' })}>
                      Return to the quay
                    </button>
                  </>
                ) : (
                  <>
                    <p className="np-eyebrow">TAKE A BREATH</p>
                    <h2>Passage paused</h2>
                    <p>Time stands still while you are away.</p>
                    <button className="np-primary" onClick={focusPlay}>
                      Resume passage
                    </button>
                    <button onClick={() => send({ type: 'retire' })}>
                      End passage and keep earned ash
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="np-controls">
            <span>
              <kbd>WASD</kbd> move
            </span>
            <span>
              <kbd>Mouse</kbd> aim
            </span>
            <span>
              <kbd>Click / J</kbd> attack
            </span>
            <span>
              <kbd>Right click / K</kbd> special
            </span>
            <span>
              <kbd>Space</kbd> dodge
            </span>
            <span>
              <kbd>Q</kbd> cast
            </span>
            <span>
              <kbd>R</kbd> call
            </span>
            <span>
              <kbd>Esc</kbd> pause
            </span>
          </div>
          <p className="np-status" role="status">
            {preserve.current
              ? 'Automatic saving is paused to preserve your stored save. Export your current chronicle to keep this passage.'
              : storage || 'Your passage stays on this device.'}
          </p>
        </section>
        <aside className="np-sidebar" aria-label="Your build">
          <p className="np-eyebrow">
            {view.phase === 'hub' ? 'THE ROAD AHEAD' : 'YOUR BORROWED LIGHT'}
          </p>
          <h2>{view.phase === 'hub' ? 'Four realms. One dawn.' : weapon(p.weapon).name}</h2>
          {view.phase === 'hub' ? (
            <ol className="np-realms">
              {REGIONS.map((r) => (
                <li key={r.name}>
                  <strong>{r.name}</strong>
                  <span>{r.subtitle}</span>
                </li>
              ))}
            </ol>
          ) : (
            <>
              <p>{region.subtitle}</p>
              <p>
                {view.phase === 'combat'
                  ? `Wave ${view.room.wave} / ${view.room.waves} · ${view.enemies.length} foes`
                  : 'Combat rests while you choose.'}
              </p>
              <div className="np-build">
                {p.boons.length ? (
                  p.boons.map((b) => (
                    <article key={b.id}>
                      <PatronArt
                        god={boon(b.id).god}
                        partner={boon(b.id).requires?.find((god) => god !== boon(b.id).god)}
                      />
                      <small>
                        {boon(b.id).slot} · level {b.level}
                      </small>
                      <strong>{boon(b.id).name}</strong>
                      <p>{boon(b.id).description}</p>
                    </article>
                  ))
                ) : (
                  <p>Clear your first chamber to receive a god’s blessing.</p>
                )}
              </div>
              <div className="np-equipped-runes">
                {p.runes.map((id) => (
                  <span key={id}>
                    <RuneArt id={id} />
                    {RUNES.find((r) => r.id === id)!.name}
                  </span>
                ))}
              </div>
            </>
          )}
          <details>
            <summary>Combat field notes</summary>
            <p>
              Dodge through danger. Attack during a dodge for your weapon’s dash move. Orange marks
              show where enemies will strike; move before they resolve.
            </p>
            <p>
              Hold attack to chain strikes. Attacks briefly slow movement. Casts recover over time;
              a god’s call needs both its blessing and a full charge.
            </p>
            <p>
              One blessing fits each action slot. A new god in that slot replaces the old blessing.
              Duos require both patrons to remain equipped.
            </p>
            <p>
              In 2.5D, red diamonds are enemy shots. Patron light marks use a bolt for Aster, waves
              for Neris, a flame for Vesta, a shard for Isen and an eye for Nyra.
            </p>
            <p>
              Flame, frost and eye marks around foes show scorch, chill and exposure together. A
              broken pale ring around you means you cannot currently take damage.
            </p>
            <p>
              Desktop keyboard and mouse controls. The layout fits small screens; touch combat is
              not implemented.
            </p>
          </details>
        </aside>
      </div>
    </main>
  );
}
