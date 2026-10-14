import { expect, test } from 'vitest';
import { createGame, applyCommand } from './game';
import { attackShapes, attackPattern } from './threats';
import { importSession, exportSession, newSession, dispatch } from '../application/session';

test('difficulty is recorded per passage and produces a visible hunter lane rather than hidden damage', () => {
  const a = dispatch(newSession('difficulty-contract'), {
    type: 'start',
    weapon: 'sword',
    runes: [],
    difficulty: 'veteran',
  }).session;
  const hunter = a.state.enemies.find((e) => e.kind === 'hunter')!;
  expect(attackPattern(hunter, 0)).toMatchObject({ kind: 'charge', range: 180, windup: 38 });
  expect(attackShapes(hunter, 0)).toMatchObject([{ kind: 'line' }]);
  expect(importSession(exportSession(a)).state).toEqual(a.state);
  const legacy = createGame('difficulty-contract', 'night-passage-4');
  expect(
    applyCommand(legacy, { type: 'start', weapon: 'sword', runes: [], difficulty: 'veteran' }),
  ).toMatchObject({
    state: legacy,
    error:
      'Legacy chronicles keep their original Standard rules. Begin a new chronicle for difficulty selection.',
  });
  const standard = applyCommand(createGame('difficulty-contract'), {
    type: 'start',
    weapon: 'sword',
    runes: [],
  }).state;
  expect(
    attackPattern(
      standard.enemies.find((e) => e.kind === 'hunter')!,
      0,
    ).kind,
  ).toBe('burst');
});
