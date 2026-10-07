import { blindsidePacks } from '../mods/blindside';
import { useEffect, useRef, useState } from 'react';
import { useSession } from './useSession';
import { scoreHand } from '../games/balatro/domain/scoring';
import type { Command } from '../games/balatro/domain/types';
import { Table } from '../games/balatro/ui/Table';
import { Inspector } from '../games/balatro/ui/Inspector';
import { Collection } from '../games/balatro/ui/Collection';
import { JOKERS } from '../games/balatro/content/jokers';
import { CONSUMABLES } from '../games/balatro/content/consumables';
import { GamePicker, type GameId } from './GamePicker';
import { Playback } from '../shared/Playback';
import { WorkshopTools } from './WorkshopTools';
import { BLINDSIDE_SCENARIOS } from '../games/balatro/application/scenario';

type View = 'table' | 'collection' | 'workshop';

function Workshop() {
  return (
    <div className="workshop-page">
      <p className="eyebrow">PLAY · UNDERSTAND · CHANGE</p>
      <h1>
        Make it
        <br />
        <em>your game.</em>
      </h1>
      <p className="lead">
        A little laboratory for big card-game ideas. Start with an effect you can see, then follow
        it into the code.
      </p>
      <div className="workshop-grid">
        <article>
          <span className="section-number">01</span>
          <h3>Change one card</h3>
          <p>
            Jokers live in <code>src/games/balatro/content/jokers.ts</code>. Change a number, save,
            and start a fresh run.
          </p>
          <pre>{`joker({\n  id: 'spark',\n  name: 'Spark',\n  description: '+4 mult.',\n  symbol: '✳',\n  onHand: () => ({ mult: 4 }),\n})`}</pre>
          <p className="small muted">
            Keep the description and effect in agreement. Changing rules changes old replay
            outcomes; bump RULES_VERSION before keeping new saves.
          </p>
        </article>
        <article>
          <span className="section-number">02</span>
          <h3>Follow the layers</h3>
          <ul className="layer-list">
            <li>
              <strong>Content</strong>
              <span>What a card does</span>
            </li>
            <li>
              <strong>Domain</strong>
              <span>What is legal, and in what order</span>
            </li>
            <li>
              <strong>Application</strong>
              <span>Commands, replay and persistence</span>
            </li>
            <li>
              <strong>Interface</strong>
              <span>What you see and interact with</span>
            </li>
          </ul>
          <p>
            The rules have no dependency on React. The score inspector reads the same result that
            resolves the actual hand.
          </p>
        </article>
        <article>
          <span className="section-number">03</span>
          <h3>Try a small experiment</h3>
          <p>
            Move an additive Joker after a multiplier. Compare the same hand. Then make a Joker that
            rewards a choice you currently ignore.
          </p>
          <p>
            See <code>docs/guide/modding.md</code> for a worked example, and{' '}
            <code>docs/research/</code> for mechanisms, timing and design questions.
          </p>
        </article>
        <article>
          <span className="section-number">04</span>
          <h3>Three ways to build a strategy</h3>
          <p>
            <strong>Blindside:</strong> poker, ordered scoring and a growing engine.
          </p>
          <p>
            <strong>Slay the Spire:</strong> energy, enemy intent and deck-building across three
            acts.
          </p>
          <p>
            <strong>Last Hearth:</strong> tavern economy, positioning and automatic combat.
          </p>
          <p className="small muted">
            Use Choose game to switch. Each game keeps its own local save.
          </p>
        </article>
      </div>
    </div>
  );
}

export default function App({
  onSwitch,
  onChallenges,
}: {
  onSwitch: (id: GameId) => void;
  onChallenges: () => void;
}) {
  const game = useSession();
  const run = game.session.run;
  const [view, setView] = useState<View>('table');
  const [selected, setSelected] = useState<string[]>([]);
  const [showNewRun, setShowNewRun] = useState(false);
  const [seed, setSeed] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (showNewRun) dialog.current?.showModal();
    else dialog.current?.close();
  }, [showNewRun]);
  const visibleSelection = selected.filter((id) => run.hand.includes(id));
  const preview =
    run.phase === 'playing' && visibleSelection.length ? scoreHand(run, visibleSelection) : null;
  const dispatch = (command: Command) => {
    const ok = game.dispatch(command);
    if (
      ok &&
      ['play', 'discard', 'useConsumable', 'leaveShop', 'startBlind'].includes(command.type)
    )
      setSelected([]);
    return ok;
  };
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((c) => c !== id)
        : current.length < 5
          ? [...current, id]
          : current,
    );
  return (
    <div className="app-shell">
      <nav className="sidebar" aria-label="Main navigation">
        <a
          href="#"
          className="brand"
          onClick={(event) => {
            event.preventDefault();
            setView('table');
          }}
        >
          <span className="brand-mark">▧</span>
          <span>
            CARD
            <br />
            WORKSHOP<span className="brand-period">.</span>
          </span>
        </a>
        <GamePicker current="balatro" onSwitch={onSwitch} />
        <p className="sidebar-label">ON THE TABLE</p>
        <button
          aria-current={view === 'table' ? 'page' : undefined}
          className={`game-choice ${view === 'table' ? 'selected' : ''}`}
          onClick={() => setView('table')}
        >
          <span>♠</span>
          <div>
            <strong>Blindside</strong>
            <small>A Balatro study</small>
          </div>
          <span className="game-dot" />
        </button>
        <div className="nav-divider" />
        <button className="nav-link" data-challenge-entry onClick={onChallenges}>
          ◇ Challenges
        </button>
        <button
          aria-current={view === 'collection' ? 'page' : undefined}
          className={`nav-link ${view === 'collection' ? 'active' : ''}`}
          onClick={() => setView('collection')}
        >
          <span>▦</span>Collection <small>{JOKERS.length + CONSUMABLES.length}</small>
        </button>
        <button
          aria-current={view === 'workshop' ? 'page' : undefined}
          className={`nav-link ${view === 'workshop' ? 'active' : ''}`}
          onClick={() => setView('workshop')}
        >
          <span>⌘</span>The workshop
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
            CARD WORKSHOP <span>/</span>{' '}
            <strong>{view === 'table' ? 'BLINDSIDE' : view.toUpperCase()}</strong>
          </div>
          <div className="topbar-actions">
            <WorkshopTools
              packs={blindsidePacks}
              game={game.workbench}
              scenarios={BLINDSIDE_SCENARIOS}
              summary={(s) => ({
                Phase: s.phase,
                Ante: s.ante,
                Blind: s.blind + 1,
                Cash: s.cash,
                Score: s.roundScore,
                Cards: s.deck.length,
                Jokers: s.jokers.length,
              })}
            />
            <span className="save-status">
              <i />
              {game.saveStatus}
            </span>
            <button onClick={game.download}>Export</button>
            <button onClick={() => file.current?.click()}>Import</button>
            <button className="new-run" onClick={() => setShowNewRun(true)}>
              + New run
            </button>
          </div>
        </header>
        {game.error && (
          <div role="alert" className="error-banner">
            <span>{game.error}</span>
            <button onClick={game.clearError} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}
        <input
          ref={file}
          className="visually-hidden"
          aria-label="Import replay file"
          type="file"
          accept=".json,application/json"
          onChange={(event) => {
            const input = event.currentTarget;
            const picked = input.files?.[0];
            input.value = '';
            if (!picked) return;
            void game.importFile(picked).then((imported) => {
              if (imported) {
                setSelected([]);
                setView('table');
              }
            });
          }}
        />
        {view === 'table' ? (
          <main className="game-layout">
            <div>
              <Playback
                key={`${game.timelineRevision}-${run.seed}-${game.session.replay.commands.reduce((last, c, i) => (c.type === 'play' ? i : last), -1)}`}
                frames={run.lastScore?.steps ?? []}
                label="Scoring resolution"
                render={(step) => (
                  <>
                    <div className="resolution-score">
                      <span>{step.chips}</span> × <span>{Number(step.mult.toFixed(2))}</span>
                    </div>
                    <div className="resolution-explanation">
                      <strong>{step.source}</strong>
                      <p>{step.detail}</p>
                    </div>
                    <p>Scoring effects resolve from left to right.</p>
                  </>
                )}
              >
                <Table
                  run={run}
                  selected={visibleSelection}
                  toggle={toggle}
                  dispatch={dispatch}
                  preview={preview}
                  newRun={() => setShowNewRun(true)}
                />
              </Playback>
            </div>
            <Inspector run={run} preview={preview} />
          </main>
        ) : (
          <main className="content-page">
            {view === 'collection' ? <Collection /> : <Workshop />}
          </main>
        )}
        <footer className="footer">
          <span>BLINDSIDE / A CARD WORKSHOP ORIGINAL</span>
          <span>Built to be played. Made to be changed.</span>
        </footer>
      </div>
      <dialog
        ref={dialog}
        className="new-run-dialog"
        aria-labelledby="blindside-new-run-title"
        onCancel={() => setShowNewRun(false)}
        onClick={(event) => {
          if (event.target === dialog.current) setShowNewRun(false);
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            game.restart(seed.trim() || `WORKSHOP-${Date.now().toString(36).toUpperCase()}`);
            setSelected([]);
            setView('table');
            setShowNewRun(false);
          }}
        >
          <button
            className="dialog-close"
            type="button"
            aria-label="Close new run"
            onClick={() => setShowNewRun(false)}
          >
            ×
          </button>
          <p className="eyebrow">A FRESH DECK</p>
          <h2 id="blindside-new-run-title">What will you build?</h2>
          <p className="muted">
            A seed recreates the same starting conditions. Your current run will be replaced; export
            it first if you want to keep it.
          </p>
          <label htmlFor="seed">
            Run seed <span>(optional)</span>
          </label>
          <input
            id="seed"
            maxLength={64}
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
            placeholder="Try FIRST-LIGHT"
          />
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={game.download}>
              Export current run
            </button>
            <button className="primary" type="submit">
              Start new run →
            </button>
          </div>
        </form>
      </dialog>
      <div className="visually-hidden" role="status" aria-live="polite">
        {run.notice}
      </div>
    </div>
  );
}
