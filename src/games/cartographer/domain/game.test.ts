import { expect, it } from 'vitest';
import { placeRoom } from '../../../shared/layout/layout';
import { ENTRANCE } from './content';
import { dispatch, exportSession, importSession, newSession } from '../application/session';
import { applyCommand, createGame, type Enemy } from './game';

it('rejects actions atomically and restores drafts and accepted decisions exactly', () => {
  let session = newSession('journal');
  const original = structuredClone(session);
  expect(dispatch(session, { type: 'strike', target: 999 }).session).toBe(session);
  expect(session).toEqual(original);
  for (let n = 0; n < 3; n++)
    session = dispatch(session, { type: 'move', direction: 'north' }).session;
  session = dispatch(session, { type: 'explore', direction: 'north' }).session;
  expect(session.state.offers).toHaveLength(3);
  expect(importSession(exportSession(session))).toEqual(session);
  const corrupt = JSON.parse(exportSession(session)) as { commands: unknown[] };
  corrupt.commands.push({ type: 'draft', offer: 999, rotation: 0 });
  expect(() => importSession(JSON.stringify(corrupt))).toThrow();
  expect(() => importSession(exportSession(session).replace('rooms-1', 'rooms-future'))).toThrow(
    'Unsupported',
  );
});

// Controlled intentions isolate attack timing; a winning policy could avoid this ordering defect.
it('resolves marked cells without retargeting, cancels a shoved attack, and ends a lethal run', () => {
  const state = createGame('intent');
  const p = state.player;
  const enemy: Enemy = {
    id: 1,
    room: state.layout.rooms[0].id,
    kind: 'keeper',
    hp: 6,
    x: p.x + 1,
    y: p.y,
    intent: { kind: 'attack', cells: [{ x: p.x, y: p.y }], damage: 4 },
  };
  state.enemies = [enemy];
  state.cleared = [];
  const moved = applyCommand(state, { type: 'move', direction: 'north' }).state;
  expect(moved.player.hp).toBe(36);
  const shoved = applyCommand(state, { type: 'shove', target: 1 }).state;
  expect(shoved.player.hp).toBe(36);
  expect(shoved.enemies[0].hp).toBe(4);
  expect(shoved.enemies[0].x).toBe(enemy.x + 1);
  expect(applyCommand(state, { type: 'brace' }).state.player.hp).toBe(34);
  state.player.hp = 1;
  const lost = applyCommand(state, { type: 'brace' }).state;
  expect(lost.status).toBe('lost');
  expect(applyCommand(lost, { type: 'move', direction: 'north' }).state).toBe(lost);
});

it('keeps a shoved guardian inside the sealed room at an already connected doorway', () => {
  const state = createGame('sealed-door');
  state.layout = placeRoom(state.layout, ENTRANCE, { x: 1, y: 2 });
  state.player.x = 19;
  state.player.y = 22;
  state.enemies = [
    {
      id: 1,
      kind: 'keeper',
      hp: 6,
      room: '2,2',
      x: 18,
      y: 22,
      intent: { kind: 'attack', cells: [{ x: 19, y: 22 }], damage: 3 },
    },
  ];
  const result = applyCommand(state, { type: 'shove', target: 1 });
  expect(result.error).toBeNull();
  expect(result.state.enemies[0].x).toBe(18);
  expect(result.state.enemies[0].hp).toBe(2);
  expect(result.state.player.hp).toBe(36);
});
