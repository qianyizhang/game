import type { State } from './types';

export interface PassageScore {
  version: 'night-passage-score-1';
  value: number;
  combatClears: number;
  escaped: boolean;
}

/** Score the current passage only. Returning to the quay ends its score display. */
export function passageScore(state: State): PassageScore {
  const combatClears = state.phase === 'hub' ? 0 : state.roomsCleared;
  const escaped = state.phase === 'won';
  return {
    version: 'night-passage-score-1',
    value: combatClears * 100 + (escaped ? 10_000 : 0),
    combatClears,
    escaped,
  };
}
