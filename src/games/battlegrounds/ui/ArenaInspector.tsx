import { HeroArt } from './HeroArt';
import { WorkshopArt, WorkshopSymbol } from '../../../shared/art/WorkshopArt';
import { rivalArtKind } from './rivalArt';
import { useEffect, useRef, useState } from 'react';
import { inspectArena } from '../application/arena';
import { RIVAL_STYLES, type ArenaState } from '../domain/arena';
import { HEROES } from '../content/minions';

export function ArenaInspector({ state }: { state: ArenaState }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <>
      <button onClick={() => setOpen(true)}>Rival inspector</button>
      <dialog
        ref={dialog}
        className="workshop-dialog"
        aria-label="Mixed Rivals inspector"
        onCancel={() => setOpen(false)}
      >
        <button
          className="dialog-close"
          aria-label="Close rival inspector"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
        {open && (
          <section className="arena-inspector">
            <WorkshopArt kind="arena" />
            <h2>Mixed Rivals inspector</h2>
            <p>
              Recruitment priority rotates each round. Every rival command is included in Export.
            </p>
            <p>
              These styles describe recruitment preferences. They remain inspectable even when a
              policy experiment hides their labels.
            </p>
            {state.arena.config ? (
              <ol>
                {state.arena.config.seats.map((seat, id) => (
                  <li key={id}>
                    <HeroArt id={seat.hero} />
                    <strong>
                      {state.players[id].name} · {HEROES.find((h) => h.id === seat.hero)!.name}
                    </strong>
                    <p>
                      {id !== 0 && <WorkshopSymbol kind={rivalArtKind(seat.style)} />}
                      {id === 0
                        ? 'Your seat'
                        : `${RIVAL_STYLES[seat.style].label}: ${RIVAL_STYLES[seat.style].description}`}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p>Choose a hero to create this lobby.</p>
            )}
            <details>
              <summary>Engine configuration</summary>
              <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {JSON.stringify(inspectArena(state), null, 2)}
              </pre>
            </details>
          </section>
        )}
      </dialog>
    </>
  );
}
