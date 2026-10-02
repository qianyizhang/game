import { EvidencePanel } from './EvidencePanel';
import { useEffect, useRef, useState } from 'react';
import type { useLocalGame } from './useLocalGame';
import { PracticeLab } from './PracticeLab';
import '../shared/workshop.css';
import type { ContentPack } from '../shared/contentPack';
import { ModsPanel } from './ModsPanel';

type Game<S extends { seed: string }, C> = ReturnType<typeof useLocalGame<S, C>>;
export function WorkshopTools<S extends { seed: string }, C>({
  game,
  scenarios,
  summary,
  packs,
}: {
  game: Game<S, C>;
  scenarios: readonly { name: string; setup: unknown }[];
  summary: (state: S) => Record<string, string | number>;
  packs: readonly ContentPack<unknown>[];
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'practice' | 'mods' | 'evidence'>('practice');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <>
      <button onClick={() => setOpen(true)}>Practice lab</button>
      {game.isPractice && (
        <span className="practice-banner">
          <strong>PRACTICE</strong>
          <button onClick={game.returnToNormal}>Return to normal run</button>
        </span>
      )}
      <dialog
        className="workshop-dialog"
        ref={dialog}
        aria-label="Practice lab"
        onCancel={() => setOpen(false)}
      >
        <button
          className="dialog-close"
          aria-label="Close practice lab"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
        <div className="lab-actions">
          <button aria-pressed={tab === 'practice'} onClick={() => setTab('practice')}>
            Replay & scenarios
          </button>
          <button aria-pressed={tab === 'mods'} onClick={() => setTab('mods')}>
            Content packs
          </button>
          <button aria-pressed={tab === 'evidence'} onClick={() => setTab('evidence')}>
            Playtesting
          </button>
        </div>
        {open &&
          (tab === 'practice' ? (
            <PracticeLab
              game={game}
              scenarios={scenarios}
              summary={summary}
              close={() => setOpen(false)}
            />
          ) : tab === 'evidence' ? (
            <EvidencePanel game={game.session.replay.game} />
          ) : (
            <ModsPanel packs={packs} pinned={game.session.replay.content ?? []} />
          ))}
      </dialog>
    </>
  );
}
