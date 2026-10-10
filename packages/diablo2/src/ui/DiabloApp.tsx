import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_CONTENT } from '../domain/content';
import { stats, validateContent } from '../domain/game';
import { distance, lineOfSight } from '../domain/maps';
import type { Attribute, Command, Content, Item, Point } from '../domain/types';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  SAVE_KEY,
  type Session,
} from '../application/session';
import { figure, render, screenToWorld, VIEW_HEIGHT, VIEW_WIDTH } from './render';
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
function itemSummary(item: Item): string {
  return [
    item.damage ? `${item.damage} damage` : null,
    item.armor ? `${item.armor} armor` : null,
    item.vitality ? `+${item.vitality} vitality` : null,
    item.energy ? `+${item.energy} energy` : null,
    item.resist ? `+${item.resist}% resist` : null,
    item.leech ? `${item.leech}% melee leech` : null,
    `${item.runes}/${item.sockets} sockets`,
  ]
    .filter(Boolean)
    .join(' · ');
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
const attributes: Attribute[] = ['strength', 'dexterity', 'vitality', 'energy'];
export default function DiabloApp() {
  const [initial] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
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
  const [content, setContent] = useState<Content>(initial.session?.replay.content ?? BASE_CONTENT);
  const [selecting, setSelecting] = useState(!initial.session);
  const [chosen, setChosen] = useState(content.heroes[0].id);
  const [seed, setSeed] = useState('lantern-1');
  const [message, setMessage] = useState(initial.error);
  const [saved, setSaved] = useState('');
  const [paused, setPaused] = useState(initial.session?.state.location === 'field');
  const [panel, setPanel] = useState<'inventory' | 'skills' | 'journal' | null>(null);
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
      localStorage.setItem(SAVE_KEY, exportSession(next));
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
      current.current = result.session;
      setSession(result.session);
      if (command.type !== 'advance' || result.session.state.tick % 50 === 0) save(result.session);
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
  useEffect(() => {
    if (!ticking) return;
    const timer = setInterval(() => {
      if (!document.hidden) send({ type: 'advance', ticks: 1 });
    }, 100);
    return () => clearInterval(timer);
  }, [ticking, send]);
  useEffect(() => {
    if (canvas.current && session && session.state.location === 'field')
      render(canvas.current, session.state, session.replay.content, mapVisible);
  }, [session, mapVisible]);
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
      if (
        selecting ||
        !current.current ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      )
        return;
      const key = event.key.toLowerCase();
      if (key === 'escape') {
        event.preventDefault();
        release();
        if (panel) setPanel(null);
        else setPaused((p) => !p);
        return;
      }
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
        send({ type: 'cast', skill: h.skills[index], target: aim.current });
      } else if (key === ' ') {
        event.preventDefault();
        const state = current.current.state;
        const world = state.worlds[state.act];
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
  const start = () => {
    const next = newSession(seed, chosen, content);
    current.current = next;
    setSession(next);
    setSelecting(false);
    setPaused(false);
    setPanel(null);
    setActive(0);
    setMessage('Speak with Elian, then take the road into Briarfen.');
    save(next);
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
            {content.maps.map((m, i) => (
              <div key={m.id}>
                <span>0{i + 1}</span>
                <strong>{m.name}</strong>
                <small>{content.monsters.find((b) => b.id === m.boss)?.name}</small>
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
          <button className="ew-primary" onClick={start}>
            Begin journey
          </button>
          {session && (
            <button onClick={() => setSelecting(false)}>Return to current journey</button>
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
    map = pack.maps[state.act],
    world = state.worlds[state.act],
    s = stats(state, pack);
  const uiCast = (index: number) => {
    setActive(index);
    const skill = pack.skills.find((s) => s.id === h.skills[index])!;
    const target = skill.range === 0 ? { x: p.x, y: p.y } : aim.current;
    send({ type: 'cast', skill: skill.id, target });
  };
  const pointer = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const point = screenToWorld(
      state,
      ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH,
      ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
    );
    aim.current = point;
    return point;
  };
  const click = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (paused || panel || state.status !== 'playing') return;
    canvas.current?.focus();
    const target = pointer(event);
    if (event.button === 2) {
      send({ type: 'cast', skill: h.skills[active], target });
      return;
    }
    const enemy = world.enemies.find((e) => e.hp > 0 && distance(e, target) < 0.9);
    if (enemy) send({ type: 'attack', target: enemy.uid });
    else send({ type: 'move', target });
  };
  const gearCard = (item: Item, source: 'bag' | 'gear' | 'stash') => (
    <article className={`ew-item ${item.rarity}`} key={item.uid}>
      <strong>{item.name}</strong>
      <small>
        {item.rarity} {item.slot} · {item.width}×{item.height}
        {item.requiredStrength ? ` · requires ${item.requiredStrength} STR` : ''}
      </small>
      <p>{itemSummary(item)}</p>
      <div>
        {source === 'bag' ? (
          <>
            <button onClick={() => send({ type: 'equip', uid: item.uid })}>Equip</button>
            {state.location === 'town' ? (
              <>
                <button onClick={() => send({ type: 'sell', uid: item.uid })}>
                  Sell · {item.value}g
                </button>
                <button onClick={() => send({ type: 'stash', uid: item.uid })}>Stash</button>
              </>
            ) : (
              <button onClick={() => send({ type: 'drop', uid: item.uid })}>Drop</button>
            )}
          </>
        ) : source === 'stash' ? (
          <button onClick={() => send({ type: 'withdraw', uid: item.uid })}>Withdraw</button>
        ) : state.location === 'town' ? (
          <button
            disabled={p.runes === 0 || item.runes >= item.sockets}
            onClick={() => send({ type: 'socket', uid: item.uid })}
          >
            Socket ember rune
          </button>
        ) : null}
      </div>
    </article>
  );
  return (
    <main className="emberwake ew-game">
      {importControls}
      <header className="ew-header">
        <div>
          <span className="ew-kicker">EMBERWAKE</span>
          <h1>{state.location === 'town' ? 'Lantern Refuge' : map.name}</h1>
          <p>{state.location === 'town' ? 'A fire worth returning to.' : map.subtitle}</p>
        </div>
        <div className="ew-header-actions">
          <button onClick={() => openPanel('inventory')}>Inventory · I</button>
          <button onClick={() => openPanel('skills')}>
            Character · K{p.skillPoints + p.statPoints > 0 ? ' +' : ''}
          </button>
          <button onClick={() => openPanel('journal')}>Journal · J</button>
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
            <p>{world.bossDefeated ? map.conclusion : map.introduction}</p>
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
            {pack.maps.map((m, i) => (
              <button
                className="ew-route"
                key={m.id}
                disabled={i > state.unlocked}
                onClick={() => send({ type: 'travel', act: i })}
              >
                <span>{worldsLabel(state.worlds[i].bossDefeated, i <= state.unlocked)}</span>
                <strong>{m.name}</strong>
                <small>
                  {i > state.unlocked
                    ? 'Defeat the previous guardian'
                    : state.worlds[i].waypoint
                      ? 'Attuned waypoint'
                      : 'Enter from the road'}
                </small>
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
              {world.seals.filter(Boolean).length}/{map.seals.length} wards
            </span>
            <strong>
              {world.bossDefeated ? 'Guardian defeated — take the road onward.' : map.objective}
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
                    <p>{map.conclusion}</p>
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
                disabled={!rank || state.location === 'town' || !!p.cooldowns[id]}
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
            panel === 'inventory'
              ? 'Inventory and stash'
              : panel === 'skills'
                ? 'Character and skills'
                : 'Quest journal'
          }
        >
          <header>
            <h2>
              {panel === 'inventory'
                ? 'Inventory & stash'
                : panel === 'skills'
                  ? `${h.name} · ${h.className}`
                  : 'The lantern chain'}
            </h2>
            <button autoFocus onClick={() => setPanel(null)}>
              Close · Esc
            </button>
          </header>
          {panel === 'inventory' ? (
            <>
              <p>
                {p.gold} gold · {p.runes} ember runes · 8×4 inventory.{' '}
                {state.location === 'town'
                  ? 'Quartermaster and stash available.'
                  : 'Return to the refuge to sell, stash, or socket.'}
              </p>
              <h3>Equipped</h3>
              <div className="ew-items">
                {Object.values(p.equipment).map((item) => gearCard(item, 'gear'))}
              </div>
              <h3>Backpack</h3>
              <div className="ew-bag" aria-label="8 by 4 backpack">
                {Array.from({ length: 32 }, (_, cell) => (
                  <span
                    key={cell}
                    style={{ gridColumn: (cell % 8) + 1, gridRow: Math.floor(cell / 8) + 1 }}
                  />
                ))}
                {p.inventory.map((item) => (
                  <button
                    title={item.name + ' · ' + itemSummary(item)}
                    className={item.rarity}
                    key={item.uid}
                    style={{
                      gridColumn: `${(item.cell % 8) + 1} / span ${item.width}`,
                      gridRow: `${Math.floor(item.cell / 8) + 1} / span ${item.height}`,
                    }}
                    onClick={() => send({ type: 'equip', uid: item.uid })}
                  >
                    {item.slot === 'weapon' ? '⚔' : item.slot === 'armor' ? '◇' : '✧'}
                    <small>{item.name}</small>
                  </button>
                ))}
              </div>
              <div className="ew-items">
                {p.inventory.map((item) => gearCard(item, 'bag'))}
                {p.inventory.length === 0 && (
                  <p>Your backpack is empty. Walk over dropped loot to collect it.</p>
                )}
              </div>
              {state.location === 'town' && (
                <>
                  <h3>Personal stash · {p.stash.length}/64</h3>
                  <div className="ew-items">
                    {p.stash.map((item) => gearCard(item, 'stash'))}
                    {!p.stash.length && <p>Your stash is empty.</p>}
                  </div>
                </>
              )}
            </>
          ) : panel === 'skills' ? (
            <>
              <p>
                Level {p.level} · {s.damage} basic damage · {s.armor} armor · {s.resist}% elemental
                resistance
              </p>
              <h3>Attributes · {p.statPoints} points available</h3>
              <div className="ew-attributes">
                {attributes.map((a) => (
                  <div key={a}>
                    <strong>{a}</strong>
                    <span>{p.attributes[a]}</span>
                    <small>
                      {a === 'strength'
                        ? 'Physical damage and gear requirements'
                        : a === 'dexterity'
                          ? 'Attack speed and armor'
                          : a === 'vitality'
                            ? '5 life per point'
                            : '3 mana per point and spell damage'}
                    </small>
                    <button
                      aria-label={`Increase ${a}`}
                      disabled={!p.statPoints}
                      onClick={() => send({ type: 'attribute', attribute: a })}
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
              <h3>Skills · {p.skillPoints} points available</h3>
              <div className="ew-skill-tree">
                {h.skills.map((id) => {
                  const skill = pack.skills.find((s) => s.id === id)!;
                  return (
                    <article key={id}>
                      <strong>
                        {skill.name} <span>Rank {p.skills[id] ?? 0}/10</span>
                      </strong>
                      <p>{skill.description}</p>
                      <small>
                        Level {skill.level} · {skill.mana} mana · {(skill.cooldown / 10).toFixed(1)}
                        s recovery · {skill.element}
                      </small>
                      <button
                        disabled={
                          !p.skillPoints || p.level < skill.level || (p.skills[id] ?? 0) >= 10
                        }
                        onClick={() => send({ type: 'learn', skill: id })}
                      >
                        Invest skill point
                      </button>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {pack.maps.map((m, i) => (
                <article className="ew-journal-act" key={m.id}>
                  <span className="ew-kicker">
                    {m.subtitle} ·{' '}
                    {i > state.unlocked
                      ? 'SEALED'
                      : state.worlds[i].bossDefeated
                        ? 'CLEARED'
                        : 'OPEN'}
                  </span>
                  <h3>{m.name}</h3>
                  <p>{m.introduction}</p>
                  <strong>{m.objective}</strong>
                  {state.worlds[i].bossDefeated && <p>{m.conclusion}</p>}
                </article>
              ))}
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
