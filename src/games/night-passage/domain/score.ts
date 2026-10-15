import type { StateView as State } from './types';

export interface PassageScore {
  version: 'night-passage-score-1' | 'night-passage-score-2';
  value: number;
  combatClears: number;
  escaped: boolean;
  speedBonus?: number;
  finishingTicks?: number;
}
/** Only executed combat time counts, including controller delays. Legacy scores stay frozen. */
export function passageScore(state: State): PassageScore {
  const combatClears = state.phase === 'hub' ? 0 : state.roomsCleared;
  const escaped = state.phase === 'won';
  const legacy = state.rulesVersion === 'night-passage-4';
  const speedBonus = !legacy && escaped ? Math.floor((2000 * 36000) / (36000 + state.tick)) : 0;
  return {
    version: legacy ? 'night-passage-score-1' : 'night-passage-score-2',
    value: combatClears * 100 + (escaped ? 10000 : 0) + speedBonus,
    combatClears,
    escaped,
    ...(!legacy ? { speedBonus, finishingTicks: escaped ? state.tick : 0 } : {}),
  };
}
