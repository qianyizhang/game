import { ContentBoundary } from './ContentBoundary';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { GamePicker, type GameId } from './GamePicker';
import './Hub.css';

const BlindsidePolicyReview = lazy(() => import('../games/balatro/agent/Review'));
const SpirePolicyReview = lazy(() => import('../games/spire/agent/Review'));
const HearthPolicyReview = lazy(() => import('../games/battlegrounds/agent/Review'));
const EmberwakePolicyReview = lazy(() => import('../../packages/diablo2/src/agent/Review'));
const CartographerPolicyReview = lazy(() => import('../games/cartographer/agent/Review'));
const CartographerApp = lazy(() => import('../games/cartographer/ui/CartographerApp'));
const DiabloApp = lazy(() => import('@card-workshop/diablo2'));
const NightPassageApp = lazy(() => import('../games/night-passage/ui/NightPassageApp'));
const BalatroApp = lazy(() =>
  import('../games/balatro/ui/BlindsideApp').then((module) => ({ default: module.BlindsideApp })),
);
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
  const query = new URLSearchParams(location.search);
  if (
    query.get('review') === 'policy' &&
    [
      'balatro',
      'blindside',
      'spire',
      'battlegrounds',
      'hearth',
      'diablo2',
      'emberwake',
      'cartographer',
    ].includes(query.get('game') ?? '')
  )
    return (
      <ContentBoundary>
        <Suspense
          fallback={
            <main className="game-loading">
              <p role="status">Opening policy review…</p>
            </main>
          }
        >
          {query.get('game') === 'cartographer' ? (
            <CartographerPolicyReview />
          ) : ['diablo2', 'emberwake'].includes(query.get('game') ?? '') ? (
            <EmberwakePolicyReview />
          ) : ['battlegrounds', 'hearth'].includes(query.get('game') ?? '') ? (
            <HearthPolicyReview />
          ) : query.get('game') === 'spire' ? (
            <SpirePolicyReview />
          ) : (
            <BlindsidePolicyReview />
          )}
        </Suspense>
      </ContentBoundary>
    );
  return <GameHub />;
}

function GameHub() {
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
      const requested = new URLSearchParams(location.search).get('game');
      if (
        requested === 'balatro' ||
        requested === 'spire' ||
        requested === 'battlegrounds' ||
        requested === 'diablo2' ||
        requested === 'cartographer' ||
        requested === 'night-passage'
      )
        return requested;
      const saved = localStorage.getItem(KEY);
      return saved === 'spire' ||
        saved === 'battlegrounds' ||
        saved === 'diablo2' ||
        saved === 'night-passage' ||
        saved === 'cartographer'
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
      cartographer: 'Dungeon Cartographer',
      'night-passage': 'Night Passage',
    };
    document.title = `${dccOpen ? 'DCC Workbench' : artOpen ? '3D Object Studies' : challengeOpen ? 'Challenges' : names[game]} · Card Workshop`;
  }, [game, challengeOpen, artOpen, dccOpen]);
  const change = (id: GameId) => {
    setGame(id);
    const url = new URL(location.href);
    if (id === 'diablo2' || id === 'cartographer' || id === 'night-passage')
      url.searchParams.set('game', id);
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
            {game === 'night-passage' ? (
              <div>
                <GamePicker current={game} onSwitch={change} />
                <NightPassageApp />
              </div>
            ) : game === 'cartographer' ? (
              <div>
                <GamePicker current={game} onSwitch={change} />
                <CartographerApp />
              </div>
            ) : game === 'diablo2' ? (
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
          hidden={game === 'diablo2' || game === 'cartographer' || game === 'night-passage'}
          ref={dccEntry}
          className="dcc-workbench-entry"
          onClick={() => showDcc(true)}
        >
          ↗ DCC workbench
        </button>
        <button
          hidden={game === 'diablo2' || game === 'cartographer' || game === 'night-passage'}
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
