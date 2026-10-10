import { ContentBoundary } from './ContentBoundary';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { GamePicker, type GameId } from './GamePicker';
import './Hub.css';

const DiabloApp = lazy(() => import('@card-workshop/diablo2'));
const BalatroApp = lazy(() => import('./App'));
const Challenges = lazy(() => import('./Challenges'));
const ArtStudio = lazy(() => import('../art3d/gallery/Studio'));
const DccWorkbench = lazy(() => import('@card-workshop/dcc-workbench'));
const SpireApp = lazy(() =>
  import('../games/spire/ui/SpireApp').then((module) => ({ default: module.SpireApp })),
);
const BattlegroundsApp = lazy(() =>
  import('../games/battlegrounds/ui/BattlegroundsApp').then((module) => ({
    default: module.BattlegroundsApp,
  })),
);

const KEY = 'card-workshop.active-game';
export default function Hub() {
  const [dccOpen, setDccOpen] = useState(
    () => new URLSearchParams(location.search).get('workbench') === 'dcc',
  );
  const dccEntry = useRef<HTMLButtonElement>(null);
  const dccRestoreFocus = useRef(false);
  const showDcc = (open: boolean) => {
    setDccOpen(open);
    const url = new URL(location.href);
    if (open) url.searchParams.set('workbench', 'dcc');
    else {
      url.searchParams.delete('workbench');
      url.searchParams.delete('compare');
      dccRestoreFocus.current = true;
    }
    history.replaceState(null, '', url);
  };
  useEffect(() => {
    if (!dccOpen && dccRestoreFocus.current) {
      dccRestoreFocus.current = false;
      dccEntry.current?.focus();
    }
  }, [dccOpen]);
  const [artOpen, setArtOpen] = useState(
    () => new URLSearchParams(location.search).get('art') === '3d',
  );
  const artEntry = useRef<HTMLButtonElement>(null);
  const artRestoreFocus = useRef(false);
  const showArt = (open: boolean) => {
    setArtOpen(open);
    const url = new URL(location.href);
    if (open) url.searchParams.set('art', '3d');
    else {
      url.searchParams.delete('art');
      artRestoreFocus.current = true;
    }
    history.replaceState(null, '', url);
  };
  useEffect(() => {
    if (!artOpen && artRestoreFocus.current) {
      artRestoreFocus.current = false;
      artEntry.current?.focus();
    }
  }, [artOpen]);
  const challengeEntry = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(false);
  const [challengeOpen, setChallengeOpen] = useState(() => {
    try {
      return localStorage.getItem('card-workshop.screen') === 'challenges';
    } catch {
      return false;
    }
  });
  const showChallenges = (open: boolean) => {
    if (open) challengeEntry.current = document.activeElement as HTMLElement | null;
    else restoreFocus.current = true;
    setChallengeOpen(open);
    try {
      localStorage.setItem('card-workshop.screen', open ? 'challenges' : 'game');
    } catch {
      /* Navigation still works without storage. */
    }
  };
  useEffect(() => {
    if (!challengeOpen && restoreFocus.current) {
      restoreFocus.current = false;
      const entry = challengeEntry.current;
      if (entry?.isConnected && entry !== document.body) entry.focus();
      else document.querySelector<HTMLElement>('[data-challenge-entry]')?.focus();
    }
  }, [challengeOpen]);
  const [game, setGame] = useState<GameId>(() => {
    try {
      if (new URLSearchParams(location.search).get('game') === 'diablo2') return 'diablo2';
      const saved = localStorage.getItem(KEY);
      return saved === 'spire' || saved === 'battlegrounds' || saved === 'diablo2'
        ? saved
        : 'balatro';
    } catch {
      return 'balatro';
    }
  });
  useEffect(() => {
    const names: Record<GameId, string> = {
      balatro: 'Blindside',
      spire: 'Slay the Spire',
      battlegrounds: 'Last Hearth',
      diablo2: 'Emberwake',
    };
    document.title = `${dccOpen ? 'DCC Workbench' : artOpen ? '3D Object Studies' : challengeOpen ? 'Challenges' : names[game]} · Card Workshop`;
  }, [game, challengeOpen, artOpen, dccOpen]);
  const change = (id: GameId) => {
    setGame(id);
    const url = new URL(location.href);
    if (id === 'diablo2') url.searchParams.set('game', 'diablo2');
    else url.searchParams.delete('game');
    history.replaceState(null, '', url);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* Game saves report storage failure separately. */
    }
  };
  return (
    <ContentBoundary key={game}>
      <div hidden={artOpen || dccOpen}>
        <div hidden={challengeOpen}>
          <Suspense
            key={game}
            fallback={
              <main className="game-loading">
                <GamePicker current={game} onSwitch={change} />
                <p role="status">Opening your table…</p>
              </main>
            }
          >
            {game === 'diablo2' ? (
              <div>
                <GamePicker current={game} onSwitch={change} />
                <DiabloApp />
              </div>
            ) : game === 'spire' ? (
              <SpireApp onSwitch={change} onChallenges={() => showChallenges(true)} />
            ) : game === 'battlegrounds' ? (
              <BattlegroundsApp onSwitch={change} onChallenges={() => showChallenges(true)} />
            ) : (
              <BalatroApp onSwitch={change} onChallenges={() => showChallenges(true)} />
            )}
          </Suspense>
        </div>
        {challengeOpen && (
          <Suspense
            fallback={
              <main className="game-loading">
                <button onClick={() => showChallenges(false)}>← Return to my run</button>
                <p role="status">Opening challenges…</p>
              </main>
            }
          >
            <Challenges onExit={() => showChallenges(false)} />
          </Suspense>
        )}
        <button
          hidden={game === 'diablo2'}
          ref={dccEntry}
          className="dcc-workbench-entry"
          onClick={() => showDcc(true)}
        >
          ↗ DCC workbench
        </button>
        <button
          hidden={game === 'diablo2'}
          ref={artEntry}
          className="art-studio-entry"
          onClick={() => showArt(true)}
        >
          ↗ 3D art gallery
        </button>
      </div>
      {artOpen && !dccOpen && (
        <Suspense
          fallback={
            <main className="game-loading">
              <p role="status">Opening object studies…</p>
            </main>
          }
        >
          <ArtStudio onExit={() => showArt(false)} />
        </Suspense>
      )}
      {dccOpen && (
        <Suspense
          fallback={
            <main className="game-loading">
              <button onClick={() => showDcc(false)}>← Return to my table</button>
              <p role="status">Opening the DCC workbench…</p>
            </main>
          }
        >
          <DccWorkbench onExit={() => showDcc(false)} />
        </Suspense>
      )}
    </ContentBoundary>
  );
}
