import type { CombatFrame } from '../domain/types';

/** Read adjacent snapshots. Missing/reborn units are not evidence of a shield break. */
export function shieldLosses(previous: CombatFrame | undefined, current: CombatFrame) {
  if (!previous) return [];
  return ([0, 1] as const).flatMap((side) =>
    current.boards[side].flatMap((unit, position) => {
      const before = previous.boards[side].find((candidate) => candidate.id === unit.id);
      return before?.keywords.includes('shield') && !unit.keywords.includes('shield')
        ? [{ side, position, unit }]
        : [];
    }),
  );
}
