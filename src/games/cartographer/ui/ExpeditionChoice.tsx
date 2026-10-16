import { useEffect, useRef, useState } from 'react';
import { rotated, type Direction, type Rotation } from '../../../shared/layout/layout';
import { chamber, RELICS } from '../domain/content';
import {
  chamberDescription,
  combatProfile,
  draftRotations,
  type Command,
  type State,
} from '../domain/game';

const arrows: Record<Direction, string> = { north: '↑', east: '→', south: '↓', west: '←' };

/** Preview rotation is presentation state; only a placed room enters the replay. */
export function ExpeditionChoice({
  state: s,
  send,
}: {
  state: State;
  send: (command: Command) => void;
}) {
  const decision = useRef<HTMLElement>(null);
  const [rotations, setRotations] = useState<Record<string, Rotation>>({});
  useEffect(() => {
    decision.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, []);
  return (
    <>
      {s.draft && (
        <section ref={decision} className="dc-draft" aria-label="Room draft">
          <div className="dc-section-heading">
            <div>
              <p className="dc-eyebrow">BEYOND THE {s.draft.direction.toUpperCase()} DOOR</p>
              <h2>Choose what comes next.</h2>
            </div>
            <button onClick={() => send({ type: 'cancel-draft' })}>Back to the room</button>
          </div>
          <p>Rotate a room to fit its doorway. Your choice becomes part of the dungeon.</p>
          <div className="dc-offers">
            {s.offers.map((id, index) => {
              const definition = chamber(id),
                allowed = draftRotations(s, index),
                rotation = allowed.includes(rotations[id]) ? rotations[id] : allowed[0];
              const preview = rotated(definition, rotation);
              return (
                <article key={id}>
                  <div
                    className="dc-mini"
                    aria-label={`${definition.name} preview, ${rotation * 90} degrees`}
                  >
                    {preview.tiles.flatMap((row, y) =>
                      [...row].map((tile, x) => {
                        const door = preview.doors.find(
                          (d) =>
                            (d === 'north' && y === 0 && x === 4) ||
                            (d === 'south' && y === 8 && x === 4) ||
                            (d === 'east' && y === 4 && x === 8) ||
                            (d === 'west' && y === 4 && x === 0),
                        );
                        return (
                          <span
                            key={`${x},${y}`}
                            className={
                              door
                                ? 'door'
                                : tile === '#'
                                  ? 'wall'
                                  : tile === '~'
                                    ? 'water'
                                    : 'floor'
                            }
                          >
                            {door ? arrows[door] : ''}
                          </span>
                        );
                      }),
                    )}
                  </div>
                  <h3>{definition.name}</h3>
                  <p>{chamberDescription(id, combatProfile(s))}</p>
                  <small>
                    Threat +{definition.danger} · {preview.doors.length} exits
                  </small>
                  <div className="dc-offer-actions">
                    <button
                      aria-label={`Rotate ${definition.name}`}
                      onClick={() =>
                        setRotations({
                          ...rotations,
                          [id]: allowed[(allowed.indexOf(rotation) + 1) % allowed.length],
                        })
                      }
                    >
                      ↻ {rotation * 90}°
                    </button>
                    <button
                      className="dc-primary"
                      onClick={() => send({ type: 'draft', offer: index, rotation })}
                    >
                      Place {definition.name}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
      {s.relicOffers.length > 0 && (
        <section ref={decision} className="dc-draft" aria-label="Relic choice">
          <p className="dc-eyebrow">A TOOL FOR THE ROAD AHEAD</p>
          <h2>Keep one relic.</h2>
          <div className="dc-offers">
            {s.relicOffers.map((id) => {
              const r = RELICS.find((r) => r.id === id)!;
              return (
                <article key={id}>
                  <h3>{r.name}</h3>
                  <p>{r.text}</p>
                  <button className="dc-primary" onClick={() => send({ type: 'relic', id })}>
                    Take {r.name}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
