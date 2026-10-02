import { useEffect, useRef, useState, type ReactNode } from 'react';
import { GamePicker, type GameId } from './GamePicker';

interface Controls {
  error: string;
  clearError: () => void;
  saveStatus: string;
  download: () => void;
  restore: (text: string) => boolean;
  restart: (seed: string) => void;
}
export function GameShell({
  title,
  subtitle,
  gameId,
  onSwitch,
  controls,
  children,
  view,
  onView,
  defaultSeed,
  tools,
  onChallenges,
}: {
  title: string;
  subtitle: string;
  gameId: GameId;
  onSwitch: (id: GameId) => void;
  controls: Controls;
  children: ReactNode;
  view: 'play' | 'collection' | 'guide';
  onView: (view: 'play' | 'collection' | 'guide') => void;
  defaultSeed: string;
  tools?: ReactNode;
  onChallenges: () => void;
}) {
  const [newRun, setNewRun] = useState(false);
  const [seed, setSeed] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (newRun) dialog.current?.showModal();
    else dialog.current?.close();
  }, [newRun]);
  return (
    <div className={`app-shell ${gameId}-theme`}>
      <nav className="sidebar" aria-label="Main navigation">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onView('play');
          }}
        >
          <span className="brand-mark">▧</span>
          <span>
            CARD
            <br />
            WORKSHOP<span className="brand-period">.</span>
          </span>
        </a>
        <GamePicker current={gameId} onSwitch={onSwitch} />
        <button
          className={`game-choice ${view === 'play' ? 'selected' : ''}`}
          onClick={() => onView('play')}
        >
          <span>{gameId === 'spire' ? '↑' : '⚑'}</span>
          <div>
            <strong>{title}</strong>
            <small>{subtitle}</small>
          </div>
        </button>
        <div className="nav-divider" />
        <button className="nav-link" data-challenge-entry onClick={onChallenges}>
          ◇ Challenges
        </button>
        <button
          aria-label="Collection"
          className={`nav-link ${view === 'collection' ? 'active' : ''}`}
          onClick={() => onView('collection')}
        >
          ▦ Collection
        </button>
        <button
          aria-label="Rules & workshop"
          className={`nav-link ${view === 'guide' ? 'active' : ''}`}
          onClick={() => onView('guide')}
        >
          ⌘ Rules & workshop
        </button>
        <div className="sidebar-bottom">
          <span className="sidebar-flower">✳</span>
          <p>
            Learn the rules.
            <br />
            Find the edges.
            <br />
            <strong>Make something fun.</strong>
          </p>
          <small>LOCAL PLAY · READABLE RULES</small>
        </div>
      </nav>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            CARD WORKSHOP <span>/</span>
            <strong>{title.toUpperCase()}</strong>
          </div>
          <div className="topbar-actions">
            {tools}
            <span className="save-status">
              <i />
              {controls.saveStatus}
            </span>
            <button onClick={controls.download}>Export</button>
            <button onClick={() => file.current?.click()}>Import</button>
            <button className="new-run" onClick={() => setNewRun(true)}>
              + New run
            </button>
          </div>
        </header>
        {controls.error && (
          <div role="alert" className="error-banner">
            <span>{controls.error}</span>
            <button onClick={controls.clearError} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}
        <input
          ref={file}
          aria-label="Import replay file"
          className="visually-hidden"
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const input = e.currentTarget;
            const selected = input.files?.[0];
            if (!selected) return;
            const text = selected.size > 2_000_000 ? ' '.repeat(2_000_001) : await selected.text();
            if (controls.restore(text)) onView('play');
            input.value = '';
          }}
        />
        {children}
        <footer className="footer">
          <span>{title.toUpperCase()} / CARD WORKSHOP</span>
          <span>Built to be played. Made to be changed.</span>
        </footer>
      </div>
      <dialog
        ref={dialog}
        className="new-run-dialog"
        aria-label="Start a new run"
        onCancel={() => setNewRun(false)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            controls.restart(seed.trim() || defaultSeed);
            onView('play');
            setNewRun(false);
          }}
        >
          <button
            className="dialog-close"
            type="button"
            aria-label="Close new run"
            onClick={() => setNewRun(false)}
          >
            ×
          </button>
          <p className="eyebrow">A NEW BEGINNING</p>
          <h2>Start a new {title} run</h2>
          <p className="muted">
            This replaces this game’s current save. Other games keep their own saves. Export first
            if you want to keep this run.
          </p>
          <label htmlFor="new-seed">Run seed</label>
          <input
            id="new-seed"
            maxLength={64}
            value={seed}
            placeholder={defaultSeed}
            onChange={(e) => setSeed(e.target.value)}
          />
          <div className="dialog-actions">
            <button className="secondary" type="button" onClick={controls.download}>
              Export current run
            </button>
            <button className="primary">Start new run →</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
