import { expect, it } from 'vitest';
import { playExpedition } from './cartographer-policy';
import { exportSession, importSession } from '../../src/games/cartographer/application/session';

it('completes seeded Relaxed expeditions through the public Survival policy, drafting, relics, combat and the king, then replays exactly', () => {
  for (const seed of ['ink-and-ember', 'atlas-2', 'atlas-3', 'atlas-4', 'atlas-5']) {
    const session = playExpedition(seed);
    expect(
      session.state.status,
      `${seed}: ${JSON.stringify({ hp: session.state.player.hp, rooms: session.state.layout.rooms.length, turn: session.state.turn, log: session.state.log })}`,
    ).toBe('won');
    expect(session.state.difficulty).toBe('relaxed');
    expect(session.state.layout.rooms).toHaveLength(9);
    expect(session.state.relics).toHaveLength(3);
    expect(importSession(exportSession(session))).toEqual(session);
    expect(session.replay.commands.some((c) => c.type === 'shove')).toBe(true);
  }
}, 30000);
