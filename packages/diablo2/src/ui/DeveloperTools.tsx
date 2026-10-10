import { useState } from 'react';
import type { Command, Content, State } from '../domain/types';
export function DeveloperTools({
  state,
  content,
  send,
  start,
  close,
}: {
  state: State;
  content: Content;
  send: (command: Command) => void;
  start: (hero: string) => void;
  close: () => void;
}) {
  const [act, setAct] = useState(state.act);
  const [region, setRegion] = useState(state.region);
  const [hero, setHero] = useState(state.hero);
  const [landing, setLanding] = useState<'entrance' | 'ward' | 'boss'>('entrance');
  const [reset, setReset] = useState(false);
  const target = content.regions.find((r) => r.id === region)!;
  const chapter = content.acts[act];
  const choose = (id: string) => {
    setRegion(id);
    setLanding('entrance');
  };
  return (
    <section className="ew-dev-tools">
      <p className="ew-fine">
        A separate test journey. Level 20 · every skill rank 10 · trial gear. Your campaign save
        stays separate.
      </p>
      <div className="ew-dev-heroes" aria-label="Test hero">
        {content.heroes.map((h) => (
          <button key={h.id} aria-pressed={hero === h.id} onClick={() => setHero(h.id)}>
            {h.className}
            <strong>{h.name}</strong>
          </button>
        ))}
      </div>
      <nav className="ew-dev-acts" aria-label="Choose act">
        {content.acts.map((a, i) => (
          <button
            key={a.id}
            aria-pressed={act === i}
            onClick={() => {
              setAct(i);
              choose(a.entry);
            }}
          >
            <small>ACT {i + 1}</small>
            {a.name}
          </button>
        ))}
      </nav>
      <h3>Wilderness regions</h3>
      <div className="ew-dev-regions">
        {content.regions
          .filter((r) => r.act === chapter.id && !r.dungeon)
          .map((r) => (
            <button key={r.id} aria-pressed={region === r.id} onClick={() => choose(r.id)}>
              <strong>{r.name}</strong>
              <small>
                {r.width} × {r.height} · {r.ward ? 'Ward' : 'Waypoint'}
              </small>
            </button>
          ))}
      </div>
      {content.dungeons
        .filter((d) => d.act === chapter.id)
        .map((d) => (
          <div key={d.id}>
            <h3>{d.name}</h3>
            <div className="ew-dev-floors">
              {d.floors.map((id) => {
                const r = content.regions.find((r) => r.id === id)!;
                return (
                  <button key={id} aria-pressed={region === id} onClick={() => choose(id)}>
                    <span className="ew-dev-floor-number">{r.floor}</span>
                    <strong>{r.name}</strong>
                    <small>
                      {r.boss ? 'Final boss' : r.ward ? 'Ward chamber' : 'Dungeon entrance'}
                    </small>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      <div className="ew-dev-options">
        <fieldset>
          <legend>Arrive at</legend>
          {(['entrance', 'ward', 'boss'] as const).map((at) => (
            <button
              key={at}
              aria-pressed={landing === at}
              disabled={at === 'ward' ? !target.ward : at === 'boss' ? !target.boss : false}
              onClick={() => setLanding(at)}
            >
              {at[0].toUpperCase() + at.slice(1)}
            </button>
          ))}
        </fieldset>
        <label>
          <input type="checkbox" checked={reset} onChange={(e) => setReset(e.target.checked)} />{' '}
          Fresh encounter on arrival
        </label>
        {state.sandbox && (
          <>
            <label>
              <input
                type="checkbox"
                checked={state.sandbox.god}
                onChange={(e) =>
                  send({
                    type: 'dev-options',
                    god: e.target.checked,
                    reveal: state.sandbox!.reveal,
                  })
                }
              />{' '}
              God mode · infinite life, mana & stamina
            </label>
            <label>
              <input
                type="checkbox"
                checked={state.sandbox.reveal}
                onChange={(e) =>
                  send({ type: 'dev-options', god: state.sandbox!.god, reveal: e.target.checked })
                }
              />{' '}
              Reveal map · no fog
            </label>
          </>
        )}
      </div>
      <button
        className="ew-primary"
        onClick={() => {
          if (!state.sandbox || hero !== state.hero) start(hero);
          send({ type: 'dev-jump', region, landing, reset });
          close();
        }}
      >
        Jump to {target.name}
        {target.floor ? ` · Floor ${target.floor}` : ''}
      </button>
      {state.sandbox && (
        <div className="ew-dev-utilities">
          <button onClick={() => send({ type: 'dev-refill' })}>Refill & clear cooldowns</button>
          <button
            disabled={state.location !== 'field'}
            onClick={() => send({ type: 'dev-corpses' })}
          >
            Place practice bodies
          </button>
          <button
            onClick={() =>
              send({ type: 'dev-jump', region: state.region, landing: 'entrance', reset: true })
            }
          >
            Reset current region
          </button>
        </div>
      )}
    </section>
  );
}
