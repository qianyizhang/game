import { ContentBoundary } from './ContentBoundary';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { GamePicker, type GameId } from './GamePicker';
import './Hub.css';

const BalatroApp = lazy(() => import('./App'));
const Challenges = lazy(() => import('./Challenges'));
const ArtStudio = lazy(() => import('../art3d/ArtStudio'));
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
      const saved = localStorage.getItem(KEY);
      return saved === 'spire' || saved === 'battlegrounds' ? saved : 'balatro';
    } catch {
      return 'balatro';
    }
  });
  useEffect(() => {
    const names: Record<GameId, string> = {
      balatro: 'Blindside',
      spire: 'Slay the Spire',
      battlegrounds: 'Last Hearth',
    };
    document.title = `${artOpen ? '3D Object Studies' : challengeOpen ? 'Challenges' : names[game]} · Card Workshop`;
  }, [game, challengeOpen, artOpen]);
  const change = (id: GameId) => {
    setGame(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* Game saves report storage failure separately. */
    }
  };
  return (
    <ContentBoundary key={game}>
      <div hidden={artOpen}>
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
            {game === 'spire' ? (
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
        <button ref={artEntry} className="art-studio-entry" onClick={() => showArt(true)}>
          ↗ 3D art gallery
        </button>
      </div>
      {artOpen && (
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
    </ContentBoundary>
  );
}
