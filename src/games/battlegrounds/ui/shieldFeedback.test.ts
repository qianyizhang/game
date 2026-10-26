import { describe, expect, it } from 'vitest';
import { makeUnit } from '../domain/units';
import type { CombatFrame, CombatUnit, Keyword } from '../domain/types';
import { shieldLosses } from './shieldFeedback';

const unit = (id: string, keywords: Keyword[] = ['shield'], health = 1): CombatUnit => ({
  ...makeUnit('pup', id),
  keywords,
  health,
  attacksTaken: 0,
});
const frame = (left: CombatUnit[], right: CombatUnit[] = []): CombatFrame => ({
  text: 'Recorded combat event',
  boards: [left, right],
});

describe('shield feedback from immutable combat snapshots', () => {
  it('finds simultaneous losses by side and instance, even after position changes', () => {
    const previous = frame([unit('still-shielded'), unit('left')], [unit('right')]);
    const current = frame(
      [unit('left', []), unit('still-shielded')],
      [unit('other', []), unit('right', [])],
    );
    const unchanged = JSON.stringify({ previous, current });
    expect(
      shieldLosses(previous, current).map(({ side, position, unit }) => [side, position, unit.id]),
    ).toEqual([
      [0, 0, 'left'],
      [1, 1, 'right'],
    ]);
    expect(JSON.stringify({ previous, current })).toBe(unchanged);
  });

  it('does not invent a break from initial state, health damage, removal, rebirth or another side', () => {
    const cases: [CombatFrame | undefined, CombatFrame][] = [
      [undefined, frame([unit('same', [])])],
      [frame([unit('same', [], 5)]), frame([unit('same', [], 2)])],
      [frame([unit('same')]), frame([])],
      [frame([unit('old')]), frame([unit('reborn', [])])],
      [frame([unit('same')]), frame([], [unit('same', [])])],
      [frame([unit('same', ['taunt'])]), frame([unit('same', [])])],
      [frame([unit('same')]), frame([unit('same')])],
    ];
    for (const [previous, current] of cases) expect(shieldLosses(previous, current)).toEqual([]);
  });

  it('can show a later break after a recorded shield regain without carrying prior feedback', () => {
    const absent = frame([unit('same', [])]);
    const regained = frame([unit('same')]);
    expect(shieldLosses(absent, regained)).toEqual([]);
    expect(shieldLosses(regained, absent).map(({ unit }) => unit.id)).toEqual(['same']);
    expect(shieldLosses(absent, absent)).toEqual([]);
  });
});
