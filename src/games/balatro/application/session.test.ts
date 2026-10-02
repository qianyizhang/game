import { describe, expect, it } from 'vitest';
import { act, exportReplay, importReplay, newSession } from './session';

describe('save/replay boundary', () => {
  it('reconstructs identical state across export and import', () => {
    let session = act(newSession('REPLAY'), { type: 'startBlind' }).session;
    session = act(session, { type: 'discard', cards: session.run.hand.slice(0, 3) }).session;
    session = act(session, { type: 'play', cards: session.run.hand.slice(0, 5) }).session;
    expect(importReplay(exportReplay(session))).toEqual(session);
  });
  it('does not record rejected commands', () => {
    const session = newSession('REJECT');
    const result = act(session, { type: 'play', cards: [] });
    expect(result.session).toBe(session);
    expect(result.error).toBeTruthy();
    expect(session.replay.commands).toHaveLength(0);
  });
  it('rejects incompatible, corrupt and illegal replays', () => {
    expect(() => importReplay('{')).toThrow();
    expect(() => importReplay(JSON.stringify({ ...newSession('V').replay, version: 999 }))).toThrow(
      'version',
    );
    expect(() =>
      importReplay(
        JSON.stringify({
          ...newSession('V').replay,
          commands: [{ type: 'moveJoker', id: 'x', direction: 9 }],
        }),
      ),
    ).toThrow('Invalid command');
    expect(() =>
      importReplay(
        JSON.stringify({ ...newSession('V').replay, commands: [{ type: 'play', cards: ['x'] }] }),
      ),
    ).toThrow('step 1');
    expect(() => importReplay(' '.repeat(2_000_001))).toThrow('large');
  });
});
