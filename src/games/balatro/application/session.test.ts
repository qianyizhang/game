import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { replayCodec } from '../../../shared/replay';
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

describe('versioned Blindside difficulty and recovery', () => {
  it('retains frozen v4 fixture bytes and exact reconstructed state, navigation and continuation', () => {
    const fixtures = [
      [
        'win',
        'ea85ee9a4a0655e0cd1f11b149282c82e90c6eee1136110fac413a459cdfdc0b',
        'f77edd3c2e56682d6fdb39b19346a2329d9182b307f3987eaecc02306402b1dc',
      ],
      [
        'loss',
        '87962a606c7a17b7e47426f9ec186a3aacda7b8cce88f6d4e1f7595bc5aad63f',
        'd8c971037da95779fd5e08ae5ae3ae054d6ed1c1dfab86686802f9c95fdd1c24',
      ],
    ] as const;
    const hash = (text: string) => createHash('sha256').update(text).digest('hex');
    for (const [name, fixtureHash, stateHash] of fixtures) {
      const bytes = readFileSync(`tests/fixtures/blindside-${name}.json`, 'utf8');
      expect(hash(bytes)).toBe(fixtureHash);
      const historical = blindsideSession.decode(bytes);
      expect(hash(JSON.stringify(historical.state))).toBe(stateHash);
      expect(historical.state).not.toHaveProperty('difficulty');
      expect(historical.state).not.toHaveProperty('setupLocked');
      expect(historical.replay.version).toBe(4);
      expect(blindsideSession.rulesForVersion(4).version).toBe(4);
      const beforeLast = blindsideSession.at(historical, historical.replay.commands.length - 1);
      const continued = blindsideSession.act(
        beforeLast,
        historical.replay.commands.at(-1)!,
      ).session;
      expect(continued).toEqual(historical);
      expect(blindsideSession.decode(blindsideSession.encode(continued))).toEqual(continued);
      const lab = replayCodec(blindsideSession.rules, true);
      const branch = lab.decode(JSON.stringify({ ...beforeLast.replay, mode: 'practice' }));
      const alternative = lab.act(branch, historical.replay.commands.at(-1)!).session;
      expect(alternative.state).toEqual(historical.state);
      expect(alternative.replay.version).toBe(4);
      expect(lab.decode(lab.encode(alternative))).toEqual(alternative);
      const first = blindsideSession.at(historical, 0);
      expect(
        blindsideSession.act(first, { type: 'configure', difficulty: 'relaxed' }).error,
      ).toBeTruthy();
      expect(() =>
        blindsideSession.decode(
          JSON.stringify({
            ...first.replay,
            commands: [{ type: 'configure', difficulty: 'standard' }],
          }),
        ),
      ).toThrow(/Invalid command/);
    }
  });

  it('round-trips configured v5 runs and separately validates practice difficulty', () => {
    const initial = blindsideSession.create('SEVERE');
    expect(initial.state.difficulty).toBe('standard');
    expect(initial.replay.version).toBe(5);
    expect(blindsideSession.key).toBe('card-workshop.blindside.v5');
    const configured = blindsideSession.act(initial, {
      type: 'configure',
      difficulty: 'severe',
    }).session;
    expect(configured.state.target).toBe(270);
    expect(blindsideSession.decode(blindsideSession.encode(configured))).toEqual(configured);
    const lab = replayCodec(blindsideSession.rules, true);
    const scenario = lab.create('CUSTOM', { difficulty: 'relaxed', ante: 2 });
    expect(scenario.state.target).toBe(375);
    expect(scenario.state.setupLocked).toBe(true);
    expect(lab.decode(lab.encode(scenario))).toEqual(scenario);
    expect(() => lab.create('INVALID', { difficulty: 'imaginary' })).toThrow(/difficulty/);
    expect(() => lab.create('OLD', { difficulty: 'standard' }, 4)).toThrow(/Unknown setup field/);
  });
});
