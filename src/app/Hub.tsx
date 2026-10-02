import { lazy, Suspense, useEffect, useState } from 'react';
import { GamePicker, type GameId } from './GamePicker';
import './Hub.css';

const BalatroApp = lazy(() => import('./App'));
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
    document.title = `${names[game]} · Card Workshop`;
  }, [game]);
  const change = (id: GameId) => {
    setGame(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* Game saves report storage failure separately. */
    }
  };
  return (
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
        <SpireApp onSwitch={change} />
      ) : game === 'battlegrounds' ? (
        <BattlegroundsApp onSwitch={change} />
      ) : (
        <BalatroApp onSwitch={change} />
      )}
    </Suspense>
  );
}
