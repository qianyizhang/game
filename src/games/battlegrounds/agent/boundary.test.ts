import { describe, expect, it, vi } from 'vitest';
import { auditRollout, recordEpisode } from '../../../shared/policy/rollout';
import type { PolicyFactory } from '../../../shared/policy/types';
import { arenaSession } from '../application/arena';
import * as rivals from '../ai/spell-policy';
import { makeUnit } from '../domain/units';
import { adapter, at, type EpisodeState } from './adapter';
import { emptyAliases } from './aliases';
import { observe, type Observation, type PolicyCommand } from './observation';
import { builtins } from './policy';

const endOnly: PolicyFactory<Observation, PolicyCommand> = {
  id: 'boundary-end-only',
  version: '1',
  create: () => (input) => ({
    command: input.actions.find((entry) => entry.command.type === 'endRecruit')!.command,
    work: 1,
  }),
};
const fresh = () =>
  adapter.create('HEARTH-POLICY-BOUNDARY', { hero: 'forgekeeper', difficulty: 'standard' });
function update(state: EpisodeState): EpisodeState {
  return { session: state.session, ...observe(state.session, state.aliases) };
}

describe('current Hearth restricted policy boundary', () => {
  it('withholds hidden state, global journal counts and entity allocation gaps, including legal-menu probes', () => {
    const state = fresh();
    // The menu simulates these random/supply-consuming actions solely to check public acceptance.
    state.session.state.players[0].gold = 10;
    const golden = makeUnit('imp', 'unit-900', true);
    golden.tripleReward = true;
    state.session.state.players[0].hand.push(golden);
    const initial = observe(state.session, emptyAliases());
    const hidden = structuredClone(state.session);
    hidden.state.seed = hidden.replay.seed = 'PRIVATE-OTHER-SEED';
    hidden.state.rng += 123;
    hidden.state.nextId += 50000;
    for (const key of Object.keys(hidden.state.pool)) hidden.state.pool[key] = 0;
    hidden.replay.commands.push({ type: 'seat', seat: 3, action: { type: 'freeze' } });
    for (const player of hidden.state.players.slice(1)) {
      player.gold = 999;
      player.hand = [makeUnit('amalgam', 'private-hand')];
      player.board = [makeUnit('amalgam', 'private-board')];
      hidden.state.arena.config!.seats[player.id].style = 'economy-v1';
    }
    const self = hidden.state.players[0];
    for (const zone of [self.board, self.hand, self.shop, self.discover])
      for (const unit of zone) unit.id = `offset-${unit.id}`;
    if (self.tavern?.offer) self.tavern.offer.id = `offset-${self.tavern.offer.id}`;
    const other = observe(hidden, emptyAliases());
    expect(other.input).toEqual(initial.input);
    expect(initial.input.actions.some((entry) => entry.command.type === 'refresh')).toBe(true);
    expect(initial.input.actions.some((entry) => entry.command.type === 'play')).toBe(true);
    for (const policy of Object.values(builtins)) {
      const config = { setup: {}, policySeed: 'PUBLIC-POLICY-RNG', options: {} };
      expect(policy.create(config)(other.input)).toEqual(policy.create(config)(initial.input));
    }
    const text = JSON.stringify(initial.input);
    expect(text).not.toMatch(
      /unit-900|unit-\d|spell-\d|PRIVATE-OTHER-SEED|private-hand|private-board/,
    );
    expect(initial.input).not.toHaveProperty('step');
    expect(initial.input.observation).not.toHaveProperty('rng');
    expect(initial.input.observation.lobby.every((row) => !('style' in row))).toBe(true);
  });

  it('detects leaked evaluator RNG in an otherwise valid recorded policy episode', async () => {
    const leaky = {
      ...adapter,
      observe: (state: EpisodeState) => ({
        ...adapter.observe(state),
        evaluatorRng: state.session.state.rng,
      }),
    };
    const run = await recordEpisode(leaky, endOnly, {
      seed: 'HEARTH-LEAK-COUNTEREXAMPLE',
      setup: { hero: 'forgekeeper', difficulty: 'standard' },
      policySeed: 'INDEPENDENT-POLICY-SEED',
      policyOptions: {},
      maxDecisions: 1,
    });
    expect(run.decisions[0].accepted).toBe(true);
    expect(run.decisions[0].input).toHaveProperty('evaluatorRng');
    const audit = await auditRollout(adapter, run, endOnly);
    expect(audit).toMatchObject({
      integrity: 'passed',
      replay: 'passed',
      inputs: 'failed',
      decisions: 'passed',
      firstMismatch: { decision: 0, path: 'input' },
    });
  });

  it('keeps first-seen aliases stable after hidden rival allocations and accepts reordered command properties', () => {
    const initial = fresh();
    initial.session.state.players[0].gold = 10;
    const left = update(initial);
    const right = structuredClone(left);
    right.session.state.nextId += 10000;
    right.session.replay.commands.push({ type: 'seat', seat: 4, action: { type: 'freeze' } });
    const a = adapter.act(left, { type: 'refresh' });
    const b = adapter.act(right, { type: 'refresh' });
    expect(a.error).toBeUndefined();
    expect(b.error).toBeUndefined();
    expect(adapter.observe(a.state)).toEqual(adapter.observe(b.state));
    const choice = a.state.input.actions.find((entry) => entry.command.type === 'buy')!.command;
    if (!('id' in choice)) throw new Error('Expected a buy choice.');
    const selectedId = choice.id;
    const bought = adapter.act(a.state, { id: selectedId, type: 'buy' });
    expect(bought.error).toBeUndefined();
    expect(bought.state.input.observation.self.hand.some((unit) => unit.id === selectedId)).toBe(
      true,
    );
    expect(bought.state.session.replay.commands.at(-1)).toMatchObject({
      type: 'seat',
      seat: 0,
      action: { type: 'buy' },
    });
    expect(JSON.stringify(bought.state.session.replay.commands.at(-1))).not.toContain(selectedId);
  });

  it('detaches nested knowledge and rejects foreign or stale aliases without changing state or replay', () => {
    const state = fresh();
    const input = adapter.observe(state);
    input.observation.self.shop[0].attack = 9999;
    input.observation.lobby[1].hp = -100;
    input.actions.length = 0;
    expect(adapter.observe(state)).toEqual(state.input);
    expect(state.session.state.players[0].shop[0].attack).not.toBe(9999);
    for (const command of [
      { type: 'buy', id: 'unit-1' },
      { type: 'buy', id: 'entity-999999' },
    ] as const) {
      const rejected = adapter.act(state, command);
      expect(rejected.error).toBeTruthy();
      expect(rejected.state).toBe(state);
    }
  });

  it('journals complete eight-seat outcomes and audits original spans without invoking any current policy', async () => {
    const run = await recordEpisode(adapter, endOnly, {
      seed: 'HEARTH-ALL-ACTORS',
      setup: { hero: 'archivist', difficulty: 'severe' },
      policySeed: 'INDEPENDENT-POLICY-SEED',
      policyOptions: {},
      maxDecisions: 100,
    });
    expect(run.episode.status).toBe('terminal');
    const restored = adapter.restore(run.replay);
    expect(
      restored.session.state.players.map((player) => player.placement).sort((a, b) => a! - b!),
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(restored.session.state.players[0].placement).toBeGreaterThan(1);
    expect(run.decisions.some((row) => row.after - row.before > 1)).toBe(true);
    const spy = vi.spyOn(rivals, 'decideSpellRecruitment').mockImplementation(() => {
      throw new Error('Fresh rivals forbidden during audit.');
    });
    try {
      const audit = await auditRollout(
        {
          ...adapter,
          act: () => {
            throw new Error('Fresh act forbidden during audit.');
          },
        },
        run,
      );
      expect(audit).toMatchObject({
        integrity: 'passed',
        replay: 'passed',
        inputs: 'passed',
        decisions: 'unavailable',
      });
      expect(spy).not.toHaveBeenCalled();
      for (const row of run.decisions) {
        const before = at(restored, row.before);
        expect(adapter.observe(before)).toEqual(row.input);
        const proposal = row.output as unknown as { command: PolicyCommand };
        const next = adapter.replayDecision!(before, proposal.command, run.replay, row.after);
        expect(next.error).toBeUndefined();
        expect(adapter.cursor(next.state)).toBe(row.after);
      }
      const first = run.decisions[0];
      const before = at(restored, first.before);
      const command = (first.output as unknown as { command: PolicyCommand }).command;
      expect(
        adapter.replayDecision!(before, command, run.replay, first.after - 1).error,
      ).toBeTruthy();
      expect(
        adapter.replayDecision!(before, command, run.replay, run.decisions[1].after).error,
      ).toBeTruthy();
      const changed = structuredClone(run.replay) as { commands: unknown[] };
      changed.commands[first.before] = { type: 'seat', seat: 0, action: { type: 'freeze' } };
      expect(
        adapter.replayDecision!(before, command, changed as never, first.after).error,
      ).toBeTruthy();
    } finally {
      spy.mockRestore();
    }
    expect(arenaSession.encode(restored.session)).toBe(JSON.stringify(run.replay, null, 2));
  }, 30000);
});
