import { useState } from 'react';
import BalatroApp from './App';
import type { GameId } from './GamePicker';
import { SpireApp } from '../games/spire/ui/SpireApp';
import { BattlegroundsApp } from '../games/battlegrounds/ui/BattlegroundsApp';

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
  const change = (id: GameId) => {
    setGame(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* Game saves report storage failure separately. */
    }
  };
  return game === 'spire' ? (
    <SpireApp onSwitch={change} />
  ) : game === 'battlegrounds' ? (
    <BattlegroundsApp onSwitch={change} />
  ) : (
    <BalatroApp onSwitch={change} />
  );
}
