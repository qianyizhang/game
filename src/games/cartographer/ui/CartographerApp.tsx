import { downloadFile } from '../../../shared/download';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DIRECTIONS,
  DELTA,
  frontiers,
  renderLayout,
  ROOM_SIZE,
  sameCell,
  threshold,
  type Direction,
} from '../../../shared/layout/layout';
import { CHAMBERS, chamber, ENEMIES, RELICS, ROOM_LIMIT } from '../domain/content';
import {
  activeRoom,
  distance,
  DIFFICULTIES,
  RULES_VERSION,
  combatProfile,
  chamberDescription,
  type Difficulty,
  type Command,
} from '../domain/game';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  SAVE_KEY,
  LEGACY_SAVE_KEY,
  PREVIOUS_SAVE_KEY,
  ACTIVE_SAVE_KEY,
  saveKey,
  type Session,
} from '../application/session';
import { ExpeditionChoice } from './ExpeditionChoice';
import { FrontierCue, ThreatCue } from './MapCues';
import './styles.css';

const arrows: Record<Direction, string> = { north: '↑', east: '→', south: '↓', west: '←' };
const wetRooms = new Set(['bridge', 'cistern']);
const overgrownRooms = new Set(['shrine', 'garden', 'archive']);
const roomMaterial = (template: string) =>
  wetRooms.has(template) ? 'wet' : overgrownRooms.has(template) ? 'overgrown' : 'dry';
export default function CartographerApp() {
  const [initial] = useState(() => {
    try {
      const key =
        [SAVE_KEY, PREVIOUS_SAVE_KEY, LEGACY_SAVE_KEY].find(
          (key) => key === localStorage.getItem(ACTIVE_SAVE_KEY),
        ) ?? SAVE_KEY;
      const text = localStorage.getItem(key);
      return { session: text ? importSession(text) : newSession('ink-and-ember'), error: '' };
    } catch (error) {
      return {
        session: newSession('ink-and-ember'),
        error: `Saved expedition could not load: ${String(error)}. The original remains stored until you explicitly start a new expedition or import a replay. You can explore this unsaved preview safely.`,
      };
    }
  });
  const [session, setSession] = useState<Session>(initial.session);
  const [seed, setSeed] = useState(session.state.seed);
  const [difficulty, setDifficulty] = useState<Difficulty>(session.state.difficulty ?? 'standard');
  const [previousSaves] = useState(() => {
    try {
      return [PREVIOUS_SAVE_KEY, LEGACY_SAVE_KEY].filter((key) => localStorage.getItem(key));
    } catch {
      return [];
    }
  });
  const [message, setMessage] = useState(initial.error);
  const [saved, setSaved] = useState('');
  const [target, setTarget] = useState<number | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const [recovery, setRecovery] = useState(!!initial.error);
  const save = useCallback((next: Session) => {
    setSession(next);
    try {
      localStorage.setItem(saveKey(next), exportSession(next));
      localStorage.setItem(ACTIVE_SAVE_KEY, saveKey(next));
      setSaved('Expedition saved');
    } catch {
      setSaved('Storage unavailable — export your expedition');
    }
  }, []);
  const send = useCallback(
    (command: Command) => {
      const result = dispatch(session, command);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMessage('');
      if (recovery) {
        setSession(result.session);
        setSaved(
          'Preview only — unreadable save preserved. Export or start a new expedition to save.',
        );
      } else save(result.session);
    },
    [session, save, recovery],
  );
  const s = session.state,
    room = activeRoom(s),
    tiles = renderLayout(s.layout);
  const enemies = s.enemies.filter((e) => e.hp > 0 && e.room === room.id);
  const selected = enemies.find((e) => e.id === target) ?? enemies[0];
  const exits = frontiers(s.layout).filter((f) => f.room === room.id);
  const atDoor = exits.find((f) => sameCell(s.player, threshold(room, f.direction)));
  const busy = !!s.draft || s.relicOffers.length > 0 || s.status !== 'playing';
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      if (event.repeat || busy) return;
      const key = event.key.toLowerCase();
      const keys: Record<string, Direction> = {
        arrowup: 'north',
        w: 'north',
        arrowright: 'east',
        d: 'east',
        arrowdown: 'south',
        s: 'south',
        arrowleft: 'west',
        a: 'west',
      };
      if (keys[key]) {
        event.preventDefault();
        send({ type: 'move', direction: keys[key] });
      }
      if (key === ' ' && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        send({ type: 'brace' });
      }
      if (key === 'e' && atDoor && !enemies.length) {
        event.preventDefault();
        send({ type: 'explore', direction: atDoor.direction });
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [send, busy, atDoor, enemies.length]);
  const decisionOpen = !!s.draft || s.relicOffers.length > 0;
  const start = () => {
    try {
      save(newSession(seed.trim(), difficulty));
      setRecovery(false);
      setMessage('');
      setTarget(null);
    } catch (error) {
      setMessage(String(error));
    }
  };
  const restorePrevious = (key: string) => {
    try {
      const text = localStorage.getItem(key);
      if (!text) throw new Error('No previous expedition is saved.');
      const next = importSession(text);
      setSession(next);
      setSeed(next.state.seed);
      setTarget(null);
      setRecovery(false);
      setDifficulty(next.state.difficulty ?? 'standard');
      setMessage(`Previous expedition restored with ${next.replay.rules} rules.`);
      localStorage.setItem(ACTIVE_SAVE_KEY, key);
    } catch (error) {
      setMessage(`Restore failed: ${String(error)}. Its save remains preserved.`);
    }
  };
  return (
    <main className="dc-app">
      <header className="dc-header">
        <div>
          <p className="dc-eyebrow">AN EXPEDITION THROUGH THE SUNKEN ARCHIVE</p>
          <h1>
            Dungeon <em>Cartographer</em>
          </h1>
          <p>The dungeon is unwritten. Choose what lies beyond the next door.</p>
        </div>
        <div className="dc-run-tools">
          <label>
            Expedition seed
            <input
              aria-label="Expedition seed"
              maxLength={80}
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            />
          </label>
          <label>
            Difficulty
            <select
              aria-label="Difficulty"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
            >
              {Object.entries(DIFFICULTIES).map(([id, tier]) => (
                <option key={id} value={id}>
                  {tier.label} · {tier.hp} life
                </option>
              ))}
            </select>
          </label>
          <button onClick={start}>New expedition</button>
          {previousSaves.map((key) => (
            <div key={key}>
              <button onClick={() => restorePrevious(key)}>
                Restore {key === PREVIOUS_SAVE_KEY ? 'v2 expedition' : 'previous expedition'}
              </button>
              <button
                onClick={() =>
                  downloadFile(localStorage.getItem(key) ?? '', 'dungeon-cartographer.json')
                }
              >
                Export {key === PREVIOUS_SAVE_KEY ? 'v2' : 'v1'} expedition
              </button>
            </div>
          ))}
          <div>
            <button
              onClick={() => downloadFile(exportSession(session), 'dungeon-cartographer.json')}
            >
              Export replay
            </button>
            <button onClick={() => file.current?.click()}>Import replay</button>
          </div>
          <small role="status">{saved || 'One hero · nine rooms · one king'}</small>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            aria-label="Import Cartographer replay"
            onChange={(e) => {
              const chosen = e.target.files?.[0];
              e.target.value = '';
              if (chosen)
                void chosen
                  .text()
                  .then((text) => {
                    const next = importSession(text);
                    setRecovery(false);
                    save(next);
                    setSeed(next.state.seed);
                    setMessage('Replay restored.');
                  })
                  .catch((error) => setMessage(`Import failed: ${String(error)}`));
            }}
          />
        </div>
      </header>
      <div className="dc-stats" aria-label="Expedition status">
        <div>
          <span>
            LANTERN KEEPER · {DIFFICULTIES[s.difficulty ?? 'standard'].label}
            {session.replay.rules !== RULES_VERSION
              ? ` · previous rules · ${session.replay.rules}`
              : ''}
          </span>
          <strong>
            {s.player.hp} / {s.player.maxHp} <small>life</small>
          </strong>
          <meter aria-label="Life" min={0} max={s.player.maxHp} value={s.player.hp} />
        </div>
        <div>
          <span>FOCUS</span>
          <strong>
            {'◆'.repeat(s.player.focus)}
            {'◇'.repeat(3 - s.player.focus)}
          </strong>
          <small>Flare costs 1</small>
        </div>
        <div>
          <span>CHARTED</span>
          <strong>
            {s.layout.rooms.length} / {ROOM_LIMIT}
          </strong>
          <small>{s.cleared.length} cleared</small>
        </div>
        <div>
          <span>THREAT</span>
          <strong>{s.threat}</strong>
          <small>{s.threat >= 8 ? 'Enemies deal +1 damage' : '+1 enemy damage at 8'}</small>
        </div>
        <div>
          <span>TURN</span>
          <strong data-testid="dc-turn">{s.turn}</strong>
          <small>
            Strike {s.player.attack} · Shove {s.relics.includes('chisel') ? 4 : 2}
          </small>
        </div>
      </div>
      {message && (
        <p className="dc-message" role="alert">
          {message}
        </p>
      )}
      {s.status !== 'playing' && (
        <section className={`dc-ending ${s.status}`} role="status">
          <p className="dc-eyebrow">EXPEDITION {s.status === 'won' ? 'COMPLETE' : 'ENDED'}</p>
          <h2>
            {s.status === 'won' ? 'A way home, written in light.' : 'The archive keeps your story.'}
          </h2>
          <p>
            {s.status === 'won' ? 'You defeated the Unwritten King.' : 'Your lantern went dark.'}{' '}
            {s.cleared.length} rooms cleared in {s.turn} turns. Export the replay or start another
            expedition.
          </p>
          <button onClick={start}>Retry this seed</button>
        </section>
      )}
      <div className="dc-workspace">
        <section className="dc-board-panel">
          <div className="dc-section-heading">
            <div>
              <p className="dc-eyebrow">
                ROOM {s.layout.rooms.indexOf(room) + 1} · {s.seed}
              </p>
              <h2>{chamber(room.template).name}</h2>
            </div>
            <span className="dc-badge">
              {enemies.length ? `${enemies.length} guardians` : 'Room clear'}
            </span>
          </div>
          <p className="dc-room-copy">
            Encounter pressure: +{combatProfile(s).enemyHp} enemy life, +{combatProfile(s).damage}{' '}
            damage; {combatProfile(s).healing} life at healing rooms.
          </p>
          <p className="dc-room-copy">{chamberDescription(room.template, combatProfile(s))}</p>
          <div
            className="dc-board"
            role="group"
            aria-label="Tactical room"
            tabIndex={0}
            data-room={room.id}
            data-material={roomMaterial(room.template)}
          >
            {Array.from({ length: ROOM_SIZE * ROOM_SIZE }, (_, i) => {
              const x = room.x * ROOM_SIZE + (i % ROOM_SIZE),
                y = room.y * ROOM_SIZE + Math.floor(i / ROOM_SIZE),
                p = { x, y };
              const tile = tiles[y][x],
                hero = sameCell(s.player, p),
                enemy = enemies.find((e) => sameCell(e, p));
              const danger = enemies.filter(
                (e) => e.intent.kind === 'attack' && e.intent.cells.some((c) => sameCell(c, p)),
              );
              const door = exits.find((f) => sameCell(threshold(room, f.direction), p));
              const label = `${x},${y}: ${hero ? 'Keeper (you)' : enemy ? `${ENEMIES[enemy.kind].name}, ${enemy.hp} life` : door ? `${door.direction} doorway` : tile === '#' ? 'wall' : tile === '~' ? 'water' : 'floor'}${door && (hero || enemy) ? `; ${door.direction} doorway` : ''}${danger.length ? `; threatened for ${danger.reduce((sum, e) => sum + e.intent.damage, 0)}` : ''}`;
              return (
                <button
                  key={i}
                  tabIndex={tile === '#' ? -1 : 0}
                  aria-label={label}
                  title={label}
                  disabled={busy || tile === '#'}
                  className={`dc-tile ${tile === '#' ? 'wall' : tile === '~' ? 'water' : 'floor'} ${hero ? 'hero' : ''} ${enemy ? 'enemy' : ''} ${danger.length ? 'danger' : ''} ${door ? 'door' : ''} ${enemy?.id === selected?.id && enemy ? 'selected' : ''}`}
                  onClick={() => {
                    if (enemy) {
                      setTarget(enemy.id);
                      return;
                    }
                    if (hero && door && !enemies.length) {
                      send({ type: 'explore', direction: door.direction });
                      return;
                    }
                    const direction = DIRECTIONS.find(
                      (d) => s.player.x + DELTA[d].x === x && s.player.y + DELTA[d].y === y,
                    );
                    if (direction) send({ type: 'move', direction });
                    else
                      setMessage('Move one tile at a time with arrows, WASD, or adjacent tiles.');
                  }}
                >
                  <span>
                    {hero
                      ? '◈'
                      : enemy
                        ? ENEMIES[enemy.kind].symbol
                        : door
                          ? arrows[door.direction]
                          : tile === '~'
                            ? '≈'
                            : ''}
                  </span>
                  {enemy && <small>{enemy.hp}</small>}
                  {door && (hero || enemy) && <FrontierCue direction={door.direction} />}
                  {danger.length > 0 && <ThreatCue />}
                </button>
              );
            })}
          </div>
          <div className="dc-legend">
            <span>◈ You</span>
            <span className="dc-danger-key">
              <ThreatCue /> Next attack
            </span>
            <span>≈ Water</span>
            <span>↑ Unexplored doorway</span>
          </div>
          <div className="dc-controls">
            <div className="dc-dpad">
              {DIRECTIONS.map((d) => (
                <button
                  key={d}
                  className={d}
                  aria-label={`Move ${d}`}
                  disabled={busy}
                  onClick={() => send({ type: 'move', direction: d })}
                >
                  {arrows[d]}
                </button>
              ))}
            </div>
            <div className="dc-actions">
              <button
                disabled={busy || !selected || distance(s.player, selected) !== 1}
                onClick={() => selected && send({ type: 'strike', target: selected.id })}
              >
                Strike <small>{s.player.attack} damage</small>
              </button>
              <button
                disabled={busy || !selected || distance(s.player, selected) !== 1}
                onClick={() => selected && send({ type: 'shove', target: selected.id })}
              >
                Shove <small>push + interrupt</small>
              </button>
              <button
                disabled={busy || !selected || !s.player.focus}
                onClick={() => selected && send({ type: 'flare', target: selected.id })}
              >
                Flare <small>4 damage · 1 focus</small>
              </button>
              <button disabled={busy} onClick={() => send({ type: 'brace' })}>
                Brace / wait <small>block {combatProfile(s).brace} per hit</small>
              </button>
            </div>
          </div>
          {atDoor && !enemies.length && !busy && (
            <button
              className="dc-primary dc-explore"
              onClick={() => send({ type: 'explore', direction: atDoor.direction })}
            >
              Explore {atDoor.direction} · draft a room
            </button>
          )}
          <p className="dc-hint">
            Arrows / WASD to move · E at a doorway · Space to brace. Select an enemy, then an
            action. Every combat action resolves the displayed enemy intents.
          </p>
        </section>
        <aside className="dc-sidebar">
          <section>
            <p className="dc-eyebrow">YOUR GROWING DUNGEON</p>
            <h2>Expedition atlas</h2>
            <div className="dc-atlas" aria-label="Expedition atlas">
              {Array.from({ length: 25 }, (_, i) => {
                const r = s.layout.rooms.find((r) => r.x === i % 5 && r.y === Math.floor(i / 5));
                return (
                  <div
                    key={i}
                    title={r ? chamber(r.template).name : 'Uncharted'}
                    className={`${r ? 'charted' : ''} ${r?.id === room.id ? 'current' : ''}`}
                  >
                    {r && (
                      <>
                        <strong>{s.layout.rooms.indexOf(r) + 1}</strong>
                        <small>
                          {r.template === 'guardian' ? '♛' : s.cleared.includes(r.id) ? '✓' : '•'}
                        </small>
                        {r.doors.map((d) => (
                          <i key={d} className={d} />
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <p>Room 9 contains the king. Revisit cleared rooms to choose another frontier.</p>
          </section>
          <section>
            <p className="dc-eyebrow">READ BEFORE YOU ACT</p>
            <h2>Enemy intentions</h2>
            {enemies.length ? (
              enemies.map((e) => (
                <button
                  key={e.id}
                  className={`dc-enemy-card ${selected?.id === e.id ? 'selected' : ''}`}
                  onClick={() => setTarget(e.id)}
                  aria-pressed={selected?.id === e.id}
                >
                  <strong>
                    {ENEMIES[e.kind].symbol} {ENEMIES[e.kind].name} <span>{e.hp} life</span>
                  </strong>
                  <small>
                    {e.intent.kind === 'attack'
                      ? `Attack marked tiles · ${e.intent.damage} damage`
                      : e.intent.kind === 'move'
                        ? 'Advance one tile'
                        : 'Waiting'}
                    {selected?.id === e.id ? ' · selected' : ''}
                  </small>
                </button>
              ))
            ) : (
              <p>The room is quiet. Reach a gold arrow to continue charting.</p>
            )}
          </section>
          <section>
            <p className="dc-eyebrow">TOOLS OF THE TRADE</p>
            <h2>
              Relics <small>{s.relics.length} / 3</small>
            </h2>
            {s.relics.length ? (
              s.relics.map((id) => {
                const r = RELICS.find((r) => r.id === id)!;
                return (
                  <p className="dc-relic" key={id}>
                    <strong>{r.name}</strong>
                    <span>{r.text}</span>
                  </p>
                );
              })
            ) : (
              <p>Choose a relic after clearing rooms 3, 5, and 7.</p>
            )}
          </section>
          <details>
            <summary>Field guide</summary>
            <p>
              Clear eight rooms including the entrance, then draft the king’s chamber. Health
              carries between rooms; focus refills after each victory.
            </p>
            <p>
              Red tiles show attacks that resolve after your next action. Killing or shoving an
              enemy cancels its attack. Shoves deal 2 extra damage against walls and 4 extra into
              water.
            </p>
            <p>
              Flare travels in a straight line up to 5 tiles. Brace blocks {combatProfile(s).brace}{' '}
              damage from each hit. Water blocks movement unless you find Reed boots.
            </p>
            <p>
              Rotating a draft rotates both terrain and doorways. Gold arrows mark frontiers;
              connected doors let you return to cleared rooms. Each room increases threat. At 8,
              every enemy hits 1 harder.
            </p>
            <p>
              {CHAMBERS.length} room templates · seeded layouts, encounters and relics · no
              permanent upgrades between runs.
            </p>
          </details>
        </aside>
      </div>
      {decisionOpen && (
        <ExpeditionChoice key={`${s.seed}:${s.layout.rooms.length}`} state={s} send={send} />
      )}
      <section className="dc-journal">
        <p className="dc-eyebrow">FIELD NOTES</p>
        <ol aria-live="polite">
          {s.log.slice(-4).map((entry, i) => (
            <li key={`${i}:${entry}`}>{entry}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
