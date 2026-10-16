import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { replayCodec } from '../../../shared/replay';
import { activeSeat, DIFFICULTIES, mixedRivalsConfig } from '../domain/arena';
import { decideSpellRecruitment } from '../ai/spell-policy';
import { advanceRivals } from './arena-controller';
import {
  arenaFrame,
  arenaSession,
  arenaSessionForVersion,
  arenaSessionV1,
  arenaSessionV2,
} from './arena';

const hash = (state: unknown) => createHash('sha256').update(JSON.stringify(state)).digest('hex');
const fixtures = JSON.parse(
  readFileSync('tests/fixtures/hearth-arena-continuity.json', 'utf8'),
) as {
  sourceCommit: string;
  witnesses: {
    version: number;
    openingRng: number;
    openingHash: string;
    finalHash: string;
    placements: number[];
    replay: ReturnType<typeof arenaSession.create>['replay'];
  }[];
};

describe('arena difficulty and version continuity', () => {
  it('retains pre-change journals, state, RNG, prefixes, continuation and practice semantics', () => {
    for (const witness of fixtures.witnesses) {
      const codec = arenaSessionForVersion(witness.version);
      const session = codec.decode(JSON.stringify(witness.replay));
      expect(hash(session.state)).toBe(witness.finalHash);
      expect(session.state.players.map((p) => p.placement)).toEqual(witness.placements);
      const opening = codec.at(session, 1);
      expect(hash(opening.state)).toBe(witness.openingHash);
      expect(opening.state.rng).toBe(witness.openingRng);
      if (witness.version === 2) {
        expect(arenaSession.decode(JSON.stringify(witness.replay))).toEqual(session);
        const current = arenaSession.decode(JSON.stringify({ ...witness.replay, version: 3 }));
        const normalized = structuredClone(current.state);
        normalized.arena.version = 2;
        expect(normalized).toEqual(session.state);
        const prefix = arenaSession.at(session, 2);
        expect(prefix.replay.version).toBe(2);
        let resumed = prefix;
        for (const command of advanceRivals(prefix))
          resumed = arenaSession.act(resumed, command).session;
        expect(resumed.replay.version).toBe(2);
        expect(activeSeat(resumed.state) === 0 || resumed.state.phase === 'combat').toBe(true);
        const practice = replayCodec(arenaSession.rules, true);
        const branch = practice.decode(JSON.stringify({ ...prefix.replay, mode: 'practice' }));
        expect(branch.state).toEqual(prefix.state);
        const command = witness.replay.commands[2];
        expect(practice.act(branch, command).session.state).toEqual(codec.at(session, 3).state);
      }
    }
    expect(() => arenaSession.decode(arenaSessionV1.encode(arenaSessionV1.create('OLD')))).toThrow(
      /version/i,
    );
    for (const version of [0, 4, NaN, 1.5])
      expect(() => arenaSessionForVersion(version)).toThrow(/version/i);
  });

  it('keeps Standard identical to v2 and assigns only focal starting HP without consuming RNG', () => {
    const seed = 'HEARTH-STANDARD-WITNESS';
    const historical = arenaSessionV2.act(arenaSessionV2.create(seed), {
      type: 'configure',
      config: mixedRivalsConfig(seed, 'forgekeeper'),
    }).session;
    const standard = arenaSession.act(arenaSession.create(seed), {
      type: 'configure',
      config: mixedRivalsConfig(seed, 'forgekeeper'),
    }).session;
    const normalized = structuredClone(standard.state);
    normalized.arena.version = 2;
    expect(normalized).toEqual(historical.state);
    for (const [difficulty, level] of Object.entries(DIFFICULTIES)) {
      for (const focalSeat of [0, 3, 7]) {
        const config = mixedRivalsConfig(
          seed,
          'forgekeeper',
          'disclosed',
          difficulty as keyof typeof DIFFICULTIES,
          focalSeat,
        );
        const configured = arenaSession.act(arenaSession.create(seed), {
          type: 'configure',
          config,
        });
        expect(configured.error).toBeUndefined();
        expect(configured.session.state.rng).toBe(historical.state.rng);
        expect(configured.session.state.players.map((p) => p.hp)).toEqual(
          Array.from({ length: 8 }, (_, seat) => (seat === focalSeat ? level.hp : 40)),
        );
        expect(configured.session.state.players[focalSeat].hero).toBe('forgekeeper');
        expect(arenaSession.act(configured.session, { type: 'configure', config }).session).toBe(
          configured.session,
        );
      }
    }
  });

  it('does not reinterpret historically accepted extra config fields', () => {
    for (const codec of [arenaSessionV1, arenaSessionV2]) {
      const config = {
        ...mixedRivalsConfig('OLD-EXTRAS', 'forgekeeper'),
        difficulty: 'severe',
        focalSeat: 99,
      } as never;
      const session = codec.act(codec.create('OLD-EXTRAS'), { type: 'configure', config });
      expect(session.error).toBeUndefined();
      expect(session.session.state.players.every((p) => p.hp === 40)).toBe(true);
      expect(codec.decode(codec.encode(session.session))).toEqual(session.session);
    }
    for (const extras of [
      { difficulty: { toString: null } },
      { difficulty: 'unknown' },
      { focalSeat: 8 },
      { focalSeat: -1 },
      { focalSeat: 0.5 },
    ]) {
      const initial = arenaSession.create('BAD-SETUP');
      const result = arenaSession.act(initial, {
        type: 'configure',
        config: { ...mixedRivalsConfig('BAD-SETUP', 'forgekeeper'), ...extras },
      } as never);
      expect(result.session).toBe(initial);
      expect(result.error).toBeTruthy();
    }
  });

  it('finishes and replays all eight placements at every difficulty through ordinary commands', () => {
    for (const difficulty of Object.keys(DIFFICULTIES) as (keyof typeof DIFFICULTIES)[]) {
      const seed = `HEARTH-DIFFICULTY-${difficulty}`;
      const config = mixedRivalsConfig(seed, 'archivist', 'disclosed', difficulty);
      let session = arenaSession.act(arenaSession.create(seed), {
        type: 'configure',
        config,
      }).session;
      while (!['won', 'lost'].includes(session.state.phase)) {
        const seat = activeSeat(session.state);
        const result = arenaSession.act(
          session,
          session.state.phase === 'combat'
            ? { type: 'nextRound' }
            : {
                type: 'seat',
                seat: seat!,
                action: decideSpellRecruitment(
                  arenaFrame(session, seat!),
                  config.seats[seat!].style,
                ).command,
              },
        );
        expect(result.error).toBeUndefined();
        session = result.session;
        expect(session.replay.commands.length).toBeLessThan(10000);
      }
      expect(session.state.players.map((p) => p.placement).sort()).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8,
      ]);
      expect(arenaSession.decode(arenaSession.encode(session))).toEqual(session);
    }
  });
});
