import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_CONTENT } from '../domain/content';
import { stats, validateContent } from '../domain/game';
import { bodyFits, distance, lineOfSight } from '../domain/maps';
import type { Command, Content, Point, SkillDef } from '../domain/types';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  SAVE_KEY,
  SANDBOX_SAVE_KEY,
  ACTIVE_MODE_KEY,
  saveKey,
  type Session,
} from '../application/session';
import { figure, screenToWorld, VIEW_HEIGHT, VIEW_WIDTH } from './render';
import { currentWorld, currentRegion, bossCleared } from '../domain/world';
import { useFieldRuntime } from './field-runtime';
import { WorldAtlas } from './WorldAtlas';
import { InventoryPanel, CharacterPanel } from './CharacterPanels';
import type { State } from '../domain/types';
import { DeveloperTools } from './DeveloperTools';
import { SkillEffects } from './skill-effects';
import './styles.css';

function Portrait({ id, color }: { id: string; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 200, 160);
    const glow = ctx.createRadialGradient(100, 95, 8, 100, 95, 85);
    glow.addColorStop(0, color + '35');
    glow.addColorStop(1, color + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 200, 160);
    ctx.save();
    ctx.translate(100, 95);
    figure(ctx, id, color, 3.2);
    ctx.restore();
  }, [id, color]);
  return <canvas ref={ref} width={200} height={160} aria-hidden="true" />;
}
function download(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function DiabloApp() {
  const [initial] = useState(() => {
    try {
      const saved = localStorage.getItem(
        localStorage.getItem(ACTIVE_MODE_KEY) === 'sandbox' ? SANDBOX_SAVE_KEY : SAVE_KEY,
      );
      return { session: saved ? importSession(saved) : null, error: '' };
    } catch (error) {
      return {
        session: null,
        error: `Saved journey could not load: ${String(error)}. It remains in storage until you start a new journey.`,
      };
    }
  });
  const [session, setSession] = useState<Session | null>(initial.session);
  const current = useRef(session);
  const previous = useRef<State | null>(null);
  const effects = useRef(new SkillEffects());
  const viewCamera = useRef<Point | undefined>(undefined);
  const hudTime = useRef(0);
  const [content, setContent] = useState<Content>(initial.session?.replay.content ?? BASE_CONTENT);
  const [selecting, setSelecting] = useState(!initial.session);
  const [chosen, setChosen] = useState(content.heroes[0].id);
  const [seed, setSeed] = useState('lantern-1');
  const [message, setMessage] = useState(initial.error);
  const [saved, setSaved] = useState('');
  const [legacySave] = useState(() => {
    try {
      return localStorage.getItem('card-workshop.emberwake.v1');
    } catch {
      return null;
    }
  });
  const [paused, setPaused] = useState(initial.session?.state.location === 'field');
  const [panel, setPanel] = useState<'inventory' | 'skills' | 'journal' | 'developer' | null>(null);
  const [mapVisible, setMapVisible] = useState(true);
  const [active, setActive] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const aim = useRef<Point>({ x: 6, y: 5 });
  const pressed = useRef(new Set<string>());
  const replayInput = useRef<HTMLInputElement>(null),
    modInput = useRef<HTMLInputElement>(null);
  const save = useCallback((next: Session) => {
    try {
      localStorage.setItem(saveKey(next), exportSession(next));
      localStorage.setItem(ACTIVE_MODE_KEY, next.replay.mode ?? 'campaign');
      setSaved('Journey saved');
    } catch {
      setSaved('Storage unavailable — export your journey');
    }
  }, []);
  const send = useCallback(
    (command: Command) => {
      const before = current.current;
      if (!before) return;
      const result = dispatch(before, command);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      effects.current.record(before.state, result.session.state, command, before.replay.content);
      if (command.type !== 'advance') setMessage('');
      previous.current = command.type === 'advance' ? before.state : null;
      current.current = result.session;
      if (
        before.state.region !== result.session.state.region ||
        before.state.location !== result.session.state.location
      )
        aim.current = clearAim(result.session.state);
      const now = performance.now();
      if (
        command.type !== 'advance' ||
        now - hudTime.current >= 100 ||
        before.state.location !== result.session.state.location ||
        before.state.status !== result.session.state.status
      ) {
        hudTime.current = now;
        setSession(result.session);
      }
      if (
        command.type !== 'advance' ||
        Math.floor(before.state.tick / 100) !== Math.floor(result.session.state.tick / 100)
      )
        save(result.session);
    },
    [save],
  );
  const release = useCallback(() => {
    pressed.current.clear();
    const state = current.current?.state;
    if (state?.status === 'playing' && state.location === 'field')
      send({ type: 'steer', direction: { x: 0, y: 0 } });
  }, [send]);
  const openPanel = useCallback(
    (next: typeof panel) => {
      release();
      setPanel((old) => (old === next ? null : next));
    },
    [release],
  );
  useEffect(() => {
    const dialog = panelRef.current;
    if (!panel || !dialog) return;
    const previous = document.activeElement;
    const siblings = Array.from(dialog.parentElement?.children ?? []).filter(
      (node): node is HTMLElement => node instanceof HTMLElement && node !== dialog,
    );
    for (const node of siblings) node.inert = true;
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select, [tabindex="0"]',
        ),
      );
      const first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    dialog.addEventListener('keydown', trap);
    dialog.querySelector<HTMLElement>('button')?.focus();
    return () => {
      for (const node of siblings) node.inert = false;
      dialog.removeEventListener('keydown', trap);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [panel]);
  const ticking =
    !!session &&
    !selecting &&
    !paused &&
    !panel &&
    session.state.status === 'playing' &&
    session.state.location === 'field';
  useFieldRuntime(
    canvas,
    current,
    previous,
    viewCamera,
    send,
    ticking,
    mapVisible,
    !selecting && session?.state.location === 'field',
    effects,
  );
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) {
        release();
        setPaused(true);
      }
    };
    const blur = () => {
      release();
      setPaused(true);
    };
    const unload = () => {
      if (current.current) save(current.current);
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', blur);
    window.addEventListener('pagehide', unload);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', blur);
      window.removeEventListener('pagehide', unload);
      if (current.current) save(current.current);
    };
  }, [release, save]);
  useEffect(() => {
    const movement = () => {
      const keys = pressed.current;
      send({
        type: 'steer',
        direction: {
          x:
            Number(keys.has('d') || keys.has('arrowright')) -
            Number(keys.has('a') || keys.has('arrowleft')),
          y:
            Number(keys.has('s') || keys.has('arrowdown')) -
            Number(keys.has('w') || keys.has('arrowup')),
        },
      });
    };
    const keydown = (event: KeyboardEvent) => {
      if (selecting || !current.current) return;
      const key = event.key.toLowerCase();
      if (event.repeat && ['escape', 'i', 'k', 'j', 'f8', 'tab'].includes(key)) return;
      if (key === 'f8') {
        event.preventDefault();
        openPanel('developer');
        return;
      }
      if (key === 'escape') {
        event.preventDefault();
        release();
        if (panel) setPanel(null);
        else setPaused((p) => !p);
        return;
      }
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      )
        return;
      if (key === 'i' || key === 'k' || key === 'j') {
        event.preventDefault();
        openPanel(key === 'i' ? 'inventory' : key === 'k' ? 'skills' : 'journal');
        return;
      }
      if (key === 'tab' && !panel) {
        event.preventDefault();
        setMapVisible((v) => !v);
        return;
      }
      if (
        panel ||
        paused ||
        current.current.state.status !== 'playing' ||
        current.current.state.location !== 'field'
      )
        return;
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault();
        if (!pressed.current.has(key)) {
          pressed.current.add(key);
          movement();
        }
        return;
      }
      if (event.repeat) return;
      if (key === 'shift') {
        event.preventDefault();
        send({ type: 'run', enabled: !current.current.state.player.running });
      } else if (key === '1' || key === '2') {
        event.preventDefault();
        send({ type: 'potion', kind: key === '1' ? 'health' : 'mana' });
      } else if (key === 'f') {
        event.preventDefault();
        send({ type: 'interact' });
      } else if (key === 't') {
        event.preventDefault();
        release();
        send({ type: 'portal' });
      } else if (['q', 'e', 'r'].includes(key)) {
        event.preventDefault();
        const index = ['q', 'e', 'r'].indexOf(key);
        setActive(index);
        const state = current.current.state;
        const h = current.current.replay.content.heroes.find((h) => h.id === state.hero)!;
        const skill = current.current.replay.content.skills.find((s) => s.id === h.skills[index])!;
        send({ type: 'cast', skill: skill.id, target: castAim(state, skill, aim.current) });
      } else if (key === ' ') {
        event.preventDefault();
        const state = current.current.state;
        const world = currentWorld(state);
        const nearest = world.enemies
          .filter(
            (e) => e.hp > 0 && distance(e, state.player) < 7 && lineOfSight(world, state.player, e),
          )
          .sort((a, b) => distance(a, state.player) - distance(b, state.player))[0];
        if (nearest) send({ type: 'attack', target: nearest.uid });
        else setMessage('No visible enemy nearby.');
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (
        pressed.current.delete(event.key.toLowerCase()) &&
        current.current?.state.location === 'field'
      )
        movement();
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
    };
  }, [selecting, panel, paused, send, release, openPanel]);
  const start = (sandbox = false, hero = chosen) => {
    const next = newSession(seed, hero, content, sandbox);
    effects.current.clear();
    previous.current = null;
    viewCamera.current = undefined;
    current.current = next;
    setSession(next);
    setSelecting(false);
    setPaused(false);
    setPanel(null);
    setActive(0);
    setMessage(
      sandbox ? 'Developer sandbox ready.' : 'Speak with Elian, then take the road into Briarfen.',
    );
    save(next);
  };
  const startSandbox = (hero = chosen) => {
    start(true, hero);
  };
  const returnCampaign = () => {
    release();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const next = raw ? importSession(raw) : null;
      current.current = next;
      previous.current = null;
      viewCamera.current = undefined;
      effects.current.clear();
      setSession(next);
      setContent(next?.replay.content ?? BASE_CONTENT);
      setSelecting(!next);
      setPanel(null);
      setPaused(next?.state.location === 'field');
      setMessage('');
      localStorage.setItem(ACTIVE_MODE_KEY, 'campaign');
    } catch (error) {
      setMessage(`Campaign could not load: ${String(error)}. Its save remains preserved.`);
    }
  };
  const importFile = async (file: File | undefined, mod: boolean) => {
    if (!file) return;
    try {
      if (file.size > 16_000_000) throw new Error('File exceeds 16 MB.');
      const text = await file.text();
      if (mod) {
        const parsed: unknown = JSON.parse(text);
        const pack = validateContent(parsed);
        setContent(pack);
        setChosen(pack.heroes[0].id);
        setSelecting(true);
        release();
        setMessage(`${pack.id} ${pack.version} loaded. Choose a hero to start this content pack.`);
      } else {
        const next = importSession(text);
        effects.current.clear();
        previous.current = null;
        viewCamera.current = undefined;
        current.current = next;
        setSession(next);
        setContent(next.replay.content);
        setSelecting(false);
        setPaused(true);
        setPanel(null);
        setActive(0);
        setMessage('Journey reconstructed. Resume when ready.');
        save(next);
      }
    } catch (error) {
      setMessage(`Import rejected: ${String(error)}`);
    }
  };
  const importControls = (
    <>
      <input
        ref={replayInput}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          void importFile(e.target.files?.[0], false);
          e.target.value = '';
        }}
      />
      <input
        ref={modInput}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          void importFile(e.target.files?.[0], true);
          e.target.value = '';
        }}
      />
    </>
  );
  if (selecting || !session)
    return (
      <main className="emberwake ew-selection">
        {importControls}
        <div className="ew-intro">
          <span className="ew-kicker">DIABLO II GAMEPLAY STUDY</span>
          <h1>EMBERWAKE</h1>
          <p className="ew-tagline">
            Four stolen lights.
            <br />
            One road to the dawn.
          </p>
          <p>
            Choose the survivor who will follow the lantern chain. Explore, fight, collect gear, and
            shape a build across four connected acts.
          </p>
          <div className="ew-campaign-preview">
            {content.acts.map((m, i) => (
              <div key={m.id}>
                <span>0{i + 1}</span>
                <strong>{m.name}</strong>
                <small>
                  {
                    content.monsters.find(
                      (b) => b.id === content.regions.find((r) => r.id === m.bossRegion)?.boss,
                    )?.name
                  }
                </small>
              </div>
            ))}
          </div>
        </div>
        <section className="ew-hero-selection">
          <h2>Choose your hero</h2>
          <div className="ew-heroes">
            {content.heroes.map((h) => (
              <button
                key={h.id}
                className={`ew-hero ${chosen === h.id ? 'selected' : ''}`}
                aria-pressed={chosen === h.id}
                onClick={() => setChosen(h.id)}
              >
                <Portrait id={h.id} color={h.color} />
                <span>{h.className}</span>
                <strong>{h.name}</strong>
                <p>{h.description}</p>
                <small>
                  {h.hp} life · {h.mana} mana
                </small>
              </button>
            ))}
          </div>
          <label className="ew-seed">
            World seed{' '}
            <input value={seed} maxLength={100} onChange={(e) => setSeed(e.target.value)} />
          </label>
          <button className="ew-primary" onClick={() => start()}>
            Begin journey
          </button>
          <button
            onClick={() => {
              startSandbox();
              setPanel('developer');
            }}
          >
            Developer sandbox · Lv. 20
          </button>
          {session && (
            <button
              onClick={() => {
                setContent(session.replay.content);
                setChosen(session.state.hero);
                setSelecting(false);
              }}
            >
              Return to current journey
            </button>
          )}
          {legacySave && (
            <p className="ew-fine">
              Your original demo journey is preserved separately. This expanded world starts a new
              journey.{' '}
              <button onClick={() => download(legacySave, 'emberwake-demo-v1.json')}>
                Export original demo save
              </button>
            </p>
          )}
          <div className="ew-selection-tools">
            <button onClick={() => replayInput.current?.click()}>Import journey</button>
            <button onClick={() => modInput.current?.click()}>Load content mod</button>
            <button
              onClick={() => download(JSON.stringify(content, null, 2), 'emberwake-content.json')}
            >
              Export content pack
            </button>
          </div>
          <p className="ew-fine">
            Original story and simplified assets. A single-player action RPG baseline for future
            mods.
          </p>
        </section>
        <p role="status" className="ew-message">
          {message}
        </p>
      </main>
    );
  const state = session.state,
    p = state.player,
    pack = session.replay.content,
    h = pack.heroes.find((h) => h.id === state.hero)!,
    map = currentRegion(state, pack),
    chapter = pack.acts[state.act],
    world = currentWorld(state),
    s = stats(state, pack);
  const uiCast = (index: number) => {
    setActive(index);
    const skill = pack.skills.find((s) => s.id === h.skills[index])!;
    const target = castAim(current.current!.state, skill, aim.current);
    send({ type: 'cast', skill: skill.id, target });
  };
  const pointer = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const point = screenToWorld(
      current.current?.state ?? state,
      ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH,
      ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
      viewCamera.current,
    );
    aim.current = point;
    return point;
  };
  const click = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (paused || panel || state.status !== 'playing') return;
    canvas.current?.focus();
    const target = pointer(event);
    if (event.button === 2) {
      const skill = pack.skills.find((s) => s.id === h.skills[active])!;
      send({
        type: 'cast',
        skill: skill.id,
        target: castAim(current.current!.state, skill, target),
      });
      return;
    }
    const enemy = currentWorld(current.current?.state ?? state).enemies.find(
      (e) => e.hp > 0 && distance(e, target) < 0.9,
    );
    if (enemy) send({ type: 'attack', target: enemy.uid });
    else send({ type: 'move', target });
  };
  return (
    <main className="emberwake ew-game">
      {importControls}
      <header className="ew-header">
        <div>
          <span className="ew-kicker">EMBERWAKE</span>
          <h1>{state.location === 'town' ? 'Lantern Refuge' : map.name}</h1>
          <p>
            {state.location === 'town'
              ? 'A fire worth returning to.'
              : `${chapter.name} · ${map.dungeon ? pack.dungeons.find((d) => d.id === map.dungeon)?.name + ' · Floor ' + map.floor : 'Wilderness'}`}
          </p>
        </div>
        <div className="ew-header-actions">
          <button onClick={() => openPanel('inventory')}>Inventory · I</button>
          <button onClick={() => openPanel('skills')}>
            Character · K{p.skillPoints + p.statPoints > 0 ? ' +' : ''}
          </button>
          <button onClick={() => openPanel('journal')}>Journal · J</button>
          <button onClick={() => openPanel('developer')}>Developer tools · F8</button>
          <button
            onClick={() => {
              release();
              setPaused((v) => !v);
            }}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </header>
      {state.sandbox && (
        <aside className="ew-sandbox-banner">
          <strong>DEVELOPER SANDBOX</strong>
          <span>
            Lv. 20 · all skills rank 10 · {state.sandbox.god ? 'God mode' : 'Normal damage'} ·{' '}
            {state.sandbox.reveal ? 'Map revealed' : 'Fog enabled'}
          </span>
          <button onClick={returnCampaign}>Return to campaign</button>
        </aside>
      )}
      <div className="ew-topline">
        <strong>
          {h.name} · {h.className} <span>Lv. {p.level}</span>
        </strong>
        <span>
          {p.gold} gold · {p.runes} runes
        </span>
        <small>{saved}</small>
        <button
          onClick={() => {
            release();
            setSelecting(true);
          }}
        >
          New journey
        </button>
        <button
          onClick={() => {
            release();
            download(exportSession(session), 'emberwake-journey.json');
          }}
        >
          Export journey
        </button>
        <button
          onClick={() => {
            release();
            setPaused(true);
            replayInput.current?.click();
          }}
        >
          Import journey
        </button>
      </div>
      {state.location === 'town' ? (
        <section className="ew-town">
          <div className="ew-town-scene">
            <div className="ew-lantern" />
            <span className="ew-kicker">WARDEN ELIAN</span>
            <h2>The fire is still ours.</h2>
            <p>{bossCleared(state, pack) ? chapter.conclusion : chapter.introduction}</p>
            <p className="ew-fine">
              Life, mana, and stamina restored at the refuge. The field stays as you left it.
            </p>
            {state.portal && (
              <button className="ew-primary" onClick={() => send({ type: 'return' })}>
                Return through your portal
              </button>
            )}
          </div>
          <div className="ew-town-services">
            <h2>The road ahead</h2>
            {pack.acts.map((m, i) => (
              <button
                className="ew-route"
                key={m.id}
                disabled={i > state.unlocked}
                onClick={() => send({ type: 'travel', act: i })}
              >
                <span>
                  {worldsLabel(state.worlds[m.bossRegion].bossDefeated, i <= state.unlocked)}
                </span>
                <strong>{m.name}</strong>
                <small>
                  {i > state.unlocked
                    ? 'Defeat the previous guardian'
                    : state.worlds[m.entry].waypoint
                      ? 'Attuned waypoint'
                      : 'Enter from the road'}
                </small>
              </button>
            ))}
            {pack.regions
              .filter(
                (r) =>
                  r.id !== pack.acts.find((a) => a.id === r.act)?.entry &&
                  state.worlds[r.id].waypoint,
              )
              .map((r) => (
                <button
                  className="ew-route"
                  key={r.id}
                  onClick={() =>
                    send({
                      type: 'travel',
                      act: pack.acts.findIndex((a) => a.id === r.act),
                      region: r.id,
                    })
                  }
                >
                  <strong>{r.name}</strong>
                  <small>Attuned waypoint · {r.floor ? `floor ${r.floor}` : 'wilderness'}</small>
                </button>
              ))}
            <h3>Quartermaster</h3>
            <div className="ew-shop">
              <button onClick={() => send({ type: 'buy', kind: 'health' })}>
                Life potion · 12g
              </button>
              <button onClick={() => send({ type: 'buy', kind: 'mana' })}>Mana potion · 12g</button>
              <button onClick={() => send({ type: 'buy', kind: 'gear' })}>
                Mystery gear · {65 + state.act * 20}g
              </button>
            </div>
            <button onClick={() => openPanel('inventory')}>Open stash & socket gear</button>
            <p className="ew-fine">
              Ember runes add weapon damage, armor, and resistance. Equipped items show their free
              sockets.
            </p>
          </div>
        </section>
      ) : (
        <section className="ew-field">
          <div className="ew-quest">
            <span>
              {chapter.wards.filter((id) => state.worlds[id].ward).length}/{chapter.wards.length}{' '}
              wards
            </span>
            <strong>
              {bossCleared(state, pack)
                ? 'Guardian defeated — take the road onward.'
                : chapter.objective}
            </strong>
            <button onClick={() => send({ type: 'interact' })}>Interact · F</button>
            <button
              onClick={() => {
                release();
                send({ type: 'portal' });
              }}
            >
              Town portal · T
            </button>
          </div>
          <div className="ew-canvas-wrap">
            <canvas
              ref={canvas}
              width={VIEW_WIDTH}
              height={VIEW_HEIGHT}
              tabIndex={0}
              aria-label="Exploration field. Use WASD or arrows to move, Space to attack, Q E R to cast, and F to interact."
              onMouseMove={(e) => pointer(e)}
              onClick={click}
              onContextMenu={(e) => {
                e.preventDefault();
                click(e);
              }}
            />
            <span className="ew-field-label">
              {map.name}{' '}
              <small>
                · {world.bossDefeated ? 'The road is open' : 'Explore the lantern road'}
              </small>
            </span>
            {(paused || panel || state.status !== 'playing') && (
              <div className="ew-screen-state">
                {state.status === 'dead' ? (
                  <>
                    <h2>Your lantern went dark.</h2>
                    <p>{state.log.at(-1)}</p>
                    <button className="ew-primary" onClick={() => send({ type: 'respawn' })}>
                      Return to the refuge
                    </button>
                  </>
                ) : state.status === 'victory' ? (
                  <>
                    <span className="ew-kicker">THE LANTERN CHAIN IS BROKEN</span>
                    <h2>Dawn belongs to everyone.</h2>
                    <p>{chapter.conclusion}</p>
                    <button
                      onClick={() => download(exportSession(session), 'emberwake-victory.json')}
                    >
                      Export completed journey
                    </button>
                    <button onClick={() => setSelecting(true)}>Begin another journey</button>
                  </>
                ) : (
                  <>
                    <h2>{panel ? 'Journey paused' : 'Paused'}</h2>
                    {!panel && (
                      <button
                        className="ew-primary"
                        onClick={() => {
                          release();
                          setPaused(false);
                        }}
                      >
                        Resume journey
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      )}
      <footer className="ew-hud">
        <div className="ew-resource">
          <span>
            Life{' '}
            <strong>
              {Math.ceil(p.hp)} / {s.maxHp}
            </strong>
          </span>
          <meter min={0} max={s.maxHp} value={p.hp} aria-label="Life" />
          <button
            disabled={p.healthPotions === 0}
            onClick={() => send({ type: 'potion', kind: 'health' })}
          >
            1 · Life potion ×{p.healthPotions}
          </button>
        </div>
        <div className="ew-hotbar">
          {h.skills.map((id, i) => {
            const skill = pack.skills.find((s) => s.id === id)!;
            const rank = p.skills[id] ?? 0;
            return (
              <button
                key={id}
                className={active === i ? 'active' : ''}
                disabled={
                  !rank ||
                  paused ||
                  !!panel ||
                  state.status !== 'playing' ||
                  state.location === 'town' ||
                  !!p.cooldowns[id]
                }
                title={`${skill.description} ${skill.mana} mana. Rank ${rank}.`}
                onClick={() => uiCast(i)}
              >
                <kbd>{['Q', 'E', 'R'][i]}</kbd>
                <strong>{skill.name}</strong>
                <small>
                  {rank
                    ? `${p.cooldowns[id] ? `${(p.cooldowns[id] / 10).toFixed(1)}s` : `${skill.mana} mana`} · rank ${rank}`
                    : `Unlock at Lv. ${skill.level}`}
                </small>
              </button>
            );
          })}
          <div className="ew-progress">
            <span>
              Experience {p.xp}/{s.xpNext}
            </span>
            <meter min={0} max={s.xpNext} value={p.xp} aria-label="Experience" />
          </div>
        </div>
        <div className="ew-resource mana">
          <span>
            Mana{' '}
            <strong>
              {Math.floor(p.mana)} / {s.maxMana}
            </strong>
          </span>
          <meter min={0} max={s.maxMana} value={p.mana} aria-label="Mana" />
          <button
            disabled={p.manaPotions === 0}
            onClick={() => send({ type: 'potion', kind: 'mana' })}
          >
            2 · Mana potion ×{p.manaPotions}
          </button>
        </div>
      </footer>
      <div className="ew-controls">
        <span>WASD / arrows · move</span>
        <span>Click · walk / attack</span>
        <span>Space · nearest foe</span>
        <span>Q E R / right click · cast</span>
        <span>F · interact</span>
        <button onClick={() => send({ type: 'run', enabled: !p.running })}>
          Shift · {p.running ? 'Run' : 'Walk'} · {Math.floor(p.stamina)} stamina
        </button>
        <button onClick={() => setMapVisible((v) => !v)}>Tab · map</button>
      </div>
      <div className="ew-events">
        <p role="status" className="ew-message">
          {message}
        </p>
        <p key={state.log.length + state.log.join('').length}>{state.log.at(-1)}</p>
      </div>
      {panel && (
        <div
          ref={panelRef}
          className="ew-panel"
          role="dialog"
          aria-modal="true"
          aria-label={
            panel === 'developer'
              ? 'Developer tools'
              : panel === 'inventory'
                ? 'Inventory and stash'
                : panel === 'skills'
                  ? 'Character and skills'
                  : 'Quest journal'
          }
        >
          <header>
            <h2>
              {panel === 'developer'
                ? 'Developer tools'
                : panel === 'inventory'
                  ? 'Inventory & stash'
                  : panel === 'skills'
                    ? `${h.name} · ${h.className}`
                    : 'The lantern chain'}
            </h2>
            <button autoFocus onClick={() => setPanel(null)}>
              Close · Esc
            </button>
          </header>
          {panel === 'developer' ? (
            <DeveloperTools
              state={state}
              content={pack}
              send={send}
              start={(hero) => startSandbox(hero)}
              close={() => {
                setPanel(null);
                setPaused(false);
              }}
            />
          ) : panel === 'inventory' ? (
            <InventoryPanel state={state} content={pack} send={send} />
          ) : panel === 'skills' ? (
            <CharacterPanel state={state} content={pack} send={send} />
          ) : (
            <>
              <WorldAtlas state={state} content={pack} />
              <h3>Recent events</h3>
              {state.log.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              <h3>Content mods</h3>
              <p>
                Export a content pack, change definitions, give it a new identity/version, then load
                it to begin a new journey.
              </p>
              <button
                onClick={() => download(JSON.stringify(pack, null, 2), 'emberwake-content.json')}
              >
                Export content pack
              </button>
              <button onClick={() => modInput.current?.click()}>Load content mod</button>
            </>
          )}
        </div>
      )}
    </main>
  );
}
function worldsLabel(cleared: boolean, open: boolean): string {
  return cleared ? '✓' : open ? '→' : '·';
}

function clearAim(state: State): Point {
  const p = state.player,
    world = currentWorld(state);
  return (
    [
      { x: p.x + 2, y: p.y },
      { x: p.x - 2, y: p.y },
      { x: p.x, y: p.y + 2 },
      { x: p.x, y: p.y - 2 },
    ].find((at) => bodyFits(world, at) && lineOfSight(world, p, at)) ?? { x: p.x, y: p.y }
  );
}

function castAim(state: State, skill: SkillDef, aim: Point): Point {
  return skill.range === 0 || skill.effect === 'melee'
    ? { x: state.player.x, y: state.player.y }
    : aim;
}
