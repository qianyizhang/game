import { describe, expect, it } from 'vitest';
import { blindsideSession } from './session';

describe('save/replay boundary', () => {
  it('reconstructs identical state across export and import', () => {
    let session = blindsideSession.act(blindsideSession.create('REPLAY'), {
      type: 'startBlind',
    }).session;
    session = blindsideSession.act(session, {
      type: 'discard',
      cards: session.state.hand.slice(0, 3),
    }).session;
    session = blindsideSession.act(session, {
      type: 'play',
      cards: session.state.hand.slice(0, 5),
    }).session;
    expect(blindsideSession.decode(blindsideSession.encode(session))).toEqual(session);
  });
  it('does not record rejected commands', () => {
    const session = blindsideSession.create('REJECT');
    const result = blindsideSession.act(session, { type: 'play', cards: [] });
    expect(result.session).toBe(session);
    expect(result.error).toBeTruthy();
    expect(session.replay.commands).toHaveLength(0);
  });
  it('rejects incompatible, corrupt and illegal replays', () => {
    expect(() => blindsideSession.decode('{')).toThrow();
    expect(() =>
      blindsideSession.decode(
        JSON.stringify({ ...blindsideSession.create('V').replay, version: 999 }),
      ),
    ).toThrow('version');
    expect(() =>
      blindsideSession.decode(
        JSON.stringify({
          ...blindsideSession.create('V').replay,
          commands: [{ type: 'moveJoker', id: 'x', direction: 9 }],
        }),
      ),
    ).toThrow('Invalid command');
    expect(() =>
      blindsideSession.decode(
        JSON.stringify({
          ...blindsideSession.create('V').replay,
          commands: [{ type: 'play', cards: ['x'] }],
        }),
      ),
    ).toThrow('step 1');
    expect(() => blindsideSession.decode(' '.repeat(2_000_001))).toThrow('large');
  });
});
