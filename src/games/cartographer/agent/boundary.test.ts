import { describe, expect, it } from 'vitest';
import { auditRollout, recordEpisode } from '../../../shared/policy/rollout';
import type { Json, PolicyFactory } from '../../../shared/policy/types';
import { dispatch, newSession, type Session } from '../application/session';
import { activeRoom, applyCommand, type Command } from '../domain/game';
import { adapter, at, type EpisodeState } from './adapter';
import { emptyAliases, observe, type Observation, type PolicyCommand } from './observation';
const toJson = (value: unknown): Json => JSON.parse(JSON.stringify(value)) as Json;
function firstRoom(seed = 'CARTOGRAPHER-BOUNDARY'): Session {
  let session = newSession(seed);
  for (let n = 0; n < 3; n++)
    session = dispatch(session, { type: 'move', direction: 'north' }).session;
  session = dispatch(session, { type: 'explore', direction: 'north' }).session;
  const command = observe(session.state, emptyAliases()).actions.find((c) => c.type === 'draft')!;
  return dispatch(session, command).session;
}
const journey: PolicyFactory<Observation, PolicyCommand> = {
  id: 'boundary-public-journey',
  version: '1',
  create: () => {
    let index = 0;
    return (input) => {
      const initial: Command[] = [
        { type: 'move', direction: 'north' },
        { type: 'move', direction: 'north' },
        { type: 'move', direction: 'north' },
        { type: 'explore', direction: 'north' },
      ];
      let command = initial[index++];
      if (!command)
        command =
          input.actions.find((c) => c.type === 'draft') ??
          input.actions.find((c) => c.type === 'relic') ??
          [...input.forecasts].sort(
            (a, b) =>
              b.hpAfter * 10 +
              b.damageDealt * 3 +
              b.kills * 8 -
              (a.hpAfter * 10 + a.damageDealt * 3 + a.kills * 8),
          )[0].command;
      return { command, work: input.forecasts.length };
    };
  },
};

describe('Cartographer public policy boundary', () => {
  it('withholds seeds, inactive enemies and unoffered drafts, including native ID allocation gaps', () => {
    const session = firstRoom();
    const original = observe(session.state, emptyAliases());
    expect(original.enemies.length).toBeGreaterThan(0);
    const hidden = structuredClone(session.state);
    hidden.seed = 'PRIVATE-SEED';
    hidden.offers = ['guardian', 'archive'];
    hidden.enemies.unshift({
      ...hidden.enemies[0],
      id: 90000,
      room: hidden.layout.rooms[0].id,
      hp: 999,
      x: 22,
      y: 22,
    });
    for (const enemy of hidden.enemies) enemy.id += 10000;
    expect(observe(hidden, emptyAliases())).toEqual(original);
    expect(JSON.stringify(original)).not.toContain('PRIVATE-SEED');
    expect(original).not.toHaveProperty('seed');
    expect(original.offers).toEqual([]);
    const altered = structuredClone(session.state);
    altered.seed = 'OTHER-PRIVATE-SEED';
    const memory = emptyAliases();
    observe(session.state, memory);
    expect(observe(altered, memory)).toEqual(original);
  });

  it('detaches nested input and rejects phase-invalid and stale commands atomically', () => {
    const state = adapter.create('CARTOGRAPHER-ATOMIC', {});
    const copy = adapter.observe(state);
    copy.player.hp = -999;
    copy.layout.rooms[0].tiles[1] = 'PRIVATE';
    copy.definitions.chambers[0].danger = 999;
    expect(state.session.state.player.hp).toBe(36);
    expect(adapter.observe(state).layout.rooms[0].tiles[1]).not.toBe('PRIVATE');
    expect(adapter.observe(state).definitions.chambers[0].danger).not.toBe(999);
    for (const command of [
      { type: 'strike', target: 999 },
      { type: 'draft', offer: 0, rotation: 0 },
      { type: 'explore', direction: 'north' },
    ] as PolicyCommand[]) {
      const result = adapter.act(state, command);
      expect(result.state).toBe(state);
      expect(result.error).toBeTruthy();
    }
    const reordered = { direction: 'north', type: 'move' } as PolicyCommand;
    expect(adapter.act(state, reordered).error).toBeUndefined();
  });

  it('forecasts announced consequences without producing future seeded reward information', () => {
    const session = firstRoom('CARTOGRAPHER-FORECASTS');
    // Every menu forecast is compared at the native accepted-command boundary.
    for (const seed of ['CARTOGRAPHER-FORECASTS', 'CARTOGRAPHER-FORECASTS-2']) {
      const native = firstRoom(seed);
      for (let step = 0; step < 30 && native.state.status === 'playing'; step++) {
        const aliases = emptyAliases();
        const input = observe(native.state, aliases);
        for (const forecast of input.forecasts) {
          let command = forecast.command;
          if ('target' in command) {
            const target = command.target;
            command = {
              ...command,
              target: Number(Object.entries(aliases.ids).find(([, v]) => v === target)![0]),
            };
          }
          const next = applyCommand(native.state, command);
          expect(next.error).toBeNull();
          expect(next.state.player.hp).toBe(forecast.hpAfter);
          expect(next.state.player.focus).toBe(forecast.focusAfter);
          expect(next.state.status === 'won').toBe(forecast.won);
          expect({ x: next.state.player.x, y: next.state.player.y }).toEqual(forecast.playerAfter);
          for (const enemy of forecast.enemiesAfter) {
            const nativeId = Number(
              Object.entries(aliases.ids).find(([, value]) => value === enemy.id)![0],
            );
            const actual = next.state.enemies.find((value) => value.id === nativeId)!;
            expect({ x: actual.x, y: actual.y, hp: actual.hp }).toEqual({
              x: enemy.x,
              y: enemy.y,
              hp: enemy.hp,
            });
          }
          expect(
            input.enemies.reduce((sum, enemy) => {
              const nativeId = Number(
                Object.entries(aliases.ids).find(([, value]) => value === enemy.id)![0],
              );
              return (
                sum +
                enemy.hp -
                Math.max(0, next.state.enemies.find((value) => value.id === nativeId)!.hp)
              );
            }, 0),
          ).toBe(forecast.damageDealt);
        }
        const command = [...input.forecasts].sort(
          (a, b) =>
            b.hpAfter * 10 +
            b.damageDealt * 3 +
            b.kills * 8 -
            (a.hpAfter * 10 + a.damageDealt * 3 + a.kills * 8),
        )[0].command;
        const bound =
          'target' in command
            ? {
                ...command,
                target: Number(
                  Object.entries(aliases.ids).find(([, v]) => v === command.target)![0],
                ),
              }
            : command;
        const result = dispatch(native, bound);
        expect(result.error).toBeNull();
        native.state = result.session.state;
        native.replay = result.session.replay;
      }
    }
    const s = session.state;
    s.cleared = [s.layout.rooms[0].id, 'previous-room'];
    const room = activeRoom(s);
    s.enemies = [
      {
        ...s.enemies[0],
        hp: 1,
        x: s.player.x + 1,
        y: s.player.y,
        intent: { kind: 'wait', cells: [], damage: 0 },
      },
    ];
    const before = observe(s, emptyAliases());
    expect(before.forecasts.some((f) => f.clearedRoom)).toBe(true);
    expect(JSON.stringify(before.forecasts)).not.toMatch(/relicOffers|seed|offers/);
    expect(before.relicOffers).toEqual([]);
    expect(room.id).not.toBe(s.layout.rooms[0].id);
  });

  it('records original inputs and audits/ seeks independently of policy availability', async () => {
    const run = await recordEpisode(adapter, journey, {
      seed: 'CARTOGRAPHER-AUDIT',
      setup: { difficulty: 'standard' },
      policySeed: 'INDEPENDENT',
      policyOptions: {},
      maxDecisions: 18,
    });
    expect(run.decisions.every((row) => row.accepted)).toBe(true);
    expect(await auditRollout(adapter, run, journey)).toMatchObject({
      integrity: 'passed',
      replay: 'passed',
      inputs: 'passed',
      decisions: 'passed',
    });
    expect(await auditRollout(adapter, run)).toMatchObject({
      integrity: 'passed',
      replay: 'passed',
      inputs: 'passed',
      decisions: 'unavailable',
    });
    const final = adapter.restore(run.replay);
    expect(at(final, 0).session.state.turn).toBe(0);
    expect(at(final, 4).input.phase).toBe('draft');
    expect(at(final, 5).input.phase).toBe('field');
    expect(at(final, run.episode.cursor).session).toEqual(final.session);
    expect(adapter.replay(final)).toEqual(run.replay);
  });

  it('flags an intentional seed leak separately from legal replay and decision reproduction', async () => {
    const leaky = {
      ...adapter,
      observe: (state: EpisodeState) => ({
        ...adapter.observe(state),
        privateSeed: state.session.state.seed,
      }),
    };
    const run = await recordEpisode(leaky, journey, {
      seed: 'CARTOGRAPHER-LEAK',
      setup: {},
      policySeed: 'INDEPENDENT',
      policyOptions: {},
      maxDecisions: 6,
    });
    expect(await auditRollout(adapter, run, journey)).toMatchObject({
      integrity: 'passed',
      replay: 'passed',
      inputs: 'failed',
      decisions: 'passed',
      firstMismatch: { decision: 0, path: 'input' },
    });
    const restored = adapter.restore(toJson(run.replay));
    expect(adapter.metrics(restored)).toEqual(run.episode.metrics);
  });
});
