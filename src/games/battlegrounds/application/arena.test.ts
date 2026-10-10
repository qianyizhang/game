import { describe, expect, it, vi } from 'vitest';
import { activeSeat, mixedRivalsConfig, transitionArena } from '../domain/arena';
import { makeUnit } from '../domain/units';
import { actArenaAgent, arenaFrame, arenaSessionV1 as arenaSession, inspectArena } from './arena';
import { advanceRivals } from './arena-controller';
import { runArenaEpisode } from '../../../engines/hearth/arena-experiment';
import * as policies from '../ai/recruitment-policy';
import { bgSessionV5 as bgSession } from './session';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

function start(seed = 'ARENA-UNIT', visibility: 'hidden' | 'disclosed' = 'hidden') {
  return arenaSession.act(arenaSession.create(seed), {
    type: 'configure',
    config: mixedRivalsConfig(seed, 'forgekeeper', visibility),
  }).session;
}
describe('eight-seat Hearth arena', () => {
  it('rotates initial reservations and complete recruitment turns, skipping eliminated seats', () => {
    let session = start();
    expect(session.state.arena.order).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    for (let seat = 0; seat < 8; seat++) {
      expect(activeSeat(session.state)).toBe(seat);
      expect(
        arenaSession.act(session, {
          type: 'seat',
          seat: (seat + 1) % 8,
          action: { type: 'endRecruit' },
        }).session,
      ).toBe(session);
      session = arenaSession.act(session, {
        type: 'seat',
        seat,
        action: { type: 'endRecruit' },
      }).session;
    }
    expect(session.state.phase).toBe('combat');
    session = arenaSession.act(session, { type: 'nextRound' }).session;
    expect(session.state.arena.order).toEqual([1, 2, 3, 4, 5, 6, 7, 0]);
    const secondRound = arenaFrame(session, 1);
    const end = secondRound.actions.find((a) => a.command.type === 'endRecruit')!;
    const yielded = actArenaAgent(session, 1, { step: secondRound.step, action: end.id });
    expect(yielded.events.some((event) => event.type === 'combat')).toBe(false);
    const state = structuredClone(session.state);
    state.phase = 'combat';
    state.players[2].hp = 0;
    expect(transitionArena(state, { type: 'nextRound' }).state.arena.order).toEqual([
      3, 4, 5, 6, 7, 0, 1,
    ]);
    const rotatedConfig = mixedRivalsConfig('ARENA-UNIT', 'forgekeeper');
    rotatedConfig.firstSeat = 1;
    const rotated = arenaSession.act(arenaSession.create('ARENA-UNIT'), {
      type: 'configure',
      config: rotatedConfig,
    }).session;
    expect(rotated.state.players[1].shop).toEqual(start().state.players[0].shop);
  });

  it('offers an independent inspector and redacts hidden styles and private state for every seat', () => {
    const hidden = start();
    const disclosed = structuredClone(hidden);
    disclosed.state.arena.config!.visibility = 'disclosed';
    for (let seat = 0; seat < 8; seat++) {
      const frame = arenaFrame(hidden, seat);
      expect(frame.observation.lobby.every((r) => !('style' in r))).toBe(true);
      const other = structuredClone(hidden);
      other.state.seed = other.replay.seed = 'SECRET-SEED';
      other.state.rng += 50;
      other.state.nextId += 5000;
      Object.keys(other.state.pool).forEach((id) => {
        other.state.pool[id] = 0;
      });
      for (const p of other.state.players.filter((p) => p.id !== seat)) {
        p.gold = 999;
        p.tier = 6;
        p.board = p.hand = p.shop = p.discover = [makeUnit('amalgam', 'secret-unit')];
        other.state.arena.config!.seats[p.id].style = 'economy-v1';
      }
      expect(arenaFrame(other, seat)).toEqual(frame);
      const visible = arenaFrame(disclosed, seat);
      expect(visible.observation.lobby.every((r) => !!r.style)).toBe(true);
      for (const row of visible.observation.lobby) delete row.style;
      expect(visible).toEqual(frame);
      frame.observation.self.hp = -999;
      expect(hidden.state.players[seat].hp).toBe(40);
    }
    expect(inspectArena(hidden.state).config!.seats).toEqual(
      inspectArena(disclosed.state).config!.seats,
    );
    disclosed.state.arena.config!.visibilitySeat = 3;
    expect(arenaFrame(disclosed, 0).observation.lobby[1]).not.toHaveProperty('style');
    expect(arenaFrame(disclosed, 3).observation.lobby[1]).toHaveProperty('style');
  });

  it('rejects stale, inactive, malformed and pending-Discover actions atomically', () => {
    const session = start();
    expect(actArenaAgent(session, 1, { step: 1, action: 'a0' }).session).toBe(session);
    expect(actArenaAgent(session, 0, { step: 0, action: 'a0' }).session).toBe(session);
    expect(
      arenaSession.act(session, {
        type: 'seat',
        seat: 0,
        action: { type: 'chooseHero', hero: 'archivist' },
      } as never).session,
    ).toBe(session);
    const frame = arenaFrame(session, 0);
    const buy = frame.actions.find((a) => a.command.type === 'buy')!;
    const bought = actArenaAgent(session, 0, { step: frame.step, action: buy.id });
    expect(bought.events).toContainEqual({
      type: 'resource',
      name: 'gold',
      before: 3,
      after: 0,
      delta: -3,
    });
    expect(bought.session.replay.commands[1]).toMatchObject({
      type: 'seat',
      seat: 0,
      action: { type: 'buy' },
    });
    const pending = structuredClone(session);
    pending.state.players[0].discover = [makeUnit('wolf', 'reward')];
    pending.state.arena.turn[0].actions = 120;
    expect(arenaFrame(pending, 0).actions.map((a) => a.command.type)).toEqual(['discover']);
    expect(
      arenaSession.act(pending, { type: 'seat', seat: 0, action: { type: 'endRecruit' } }).session,
    ).toBe(pending);
    expect(
      arenaSession.act(pending, {
        type: 'seat',
        seat: 0,
        action: { type: 'discover', id: 'reward' },
      }).error,
    ).toBeUndefined();
  });

  it('finishes all eight placements and replays without executing any policies', () => {
    const report = runArenaEpisode(
      'ARENA-FULL-TEST',
      mixedRivalsConfig('ARENA-FULL-TEST', 'archivist'),
      6,
    );
    expect(report.status, report.error).toBe('complete');
    expect(report.replayVerified).toBe(true);
    expect([...report.placements].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const spy = vi.spyOn(policies, 'decideRecruitment').mockImplementation(() => {
      throw new Error('Must not replay policies');
    });
    try {
      const session = arenaSession.decode(report.replay);
      expect(session.state.players.map((p) => p.placement)).toEqual(report.placements);
      for (const player of session.state.players)
        expect(arenaFrame(session, player.id).observation.phase).toBe(
          player.placement === 1 ? 'won' : 'lost',
        );
      expect(spy).not.toHaveBeenCalled();
      expect(() => bgSession.decode(report.replay)).toThrow('Incompatible');
      expect(session.replay.commands.filter((c) => c.type === 'seat').map((c) => c.seat)).toContain(
        7,
      );
    } finally {
      spy.mockRestore();
    }
  });

  it('runs a human loss through the remaining lobby and resumes a prefix during another seat’s turn', () => {
    let session = start('ARENA-HUMAN-LOSS');
    let eliminatedAt: number | null = null;
    while (!['won', 'lost'].includes(session.state.phase)) {
      const command =
        session.state.phase === 'combat'
          ? ({ type: 'nextRound' } as const)
          : ({ type: 'seat', seat: 0, action: { type: 'endRecruit' } } as const);
      session = arenaSession.act(session, command).session;
      for (const command of advanceRivals(session)) {
        session = arenaSession.act(session, command).session;
        if (session.state.players[0].hp <= 0 && eliminatedAt === null)
          eliminatedAt = session.state.round;
      }
    }
    expect(eliminatedAt).not.toBeNull();
    expect(session.state.round).toBeGreaterThan(eliminatedAt!);
    expect(new Set(session.state.players.map((p) => p.placement)).size).toBe(8);
    const prefix = arenaSession.at(session, 2);
    expect(activeSeat(prefix.state)).toBe(1);
    expect(advanceRivals(prefix).length).toBeGreaterThan(0);
  });
});

it('preserves exact Classic v5 final states from the pre-arena commit a185240', () => {
  const expected = {
    win: 'ff7d695411b3a0722c5980445a8a5ae49f90c23c51142ad75cb1c0c6d776452e',
    loss: '5b62b0a3219cbd124ef98f5f97cde06887e9b6780d67278dc3f83ead0a63093b',
  };
  for (const [fixture, digest] of Object.entries(expected)) {
    const state = bgSession.decode(
      readFileSync(`tests/fixtures/battlegrounds-${fixture}.json`, 'utf8'),
    ).state;
    expect(createHash('sha256').update(JSON.stringify(state)).digest('hex')).toBe(digest);
  }
});
