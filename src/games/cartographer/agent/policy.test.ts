import { describe, expect, it } from 'vitest';
import { adapter } from './adapter';
import { builtins, STRATEGIES } from './policy';
import example from './example';
import { combatForecast, type Observation } from './observation';
const config = { setup: {}, options: {}, policySeed: 'INDEPENDENT-POLICY-1' };
const fresh = (): Observation => adapter.observe(adapter.create('POLICY-ADOPTION-1-DEV-01', {}));
describe('Cartographer public priorities', () => {
  it('completes legal expeditions across all three tiers and strategies, with exact native replay', () => {
    for (const difficulty of ['relaxed', 'standard', 'severe'])
      for (const strategy of STRATEGIES) {
        let state = adapter.create('POLICY-ADOPTION-1-DEV-01', { difficulty });
        const choose = builtins[strategy].create(config);
        let steps = 0;
        const counts: Record<string, number> = {};
        while (steps++ < 2000 && !adapter.terminal(state)) {
          const input = adapter.observe(state),
            proposal = choose(input);
          expect(input.actions).toContainEqual(proposal.command);
          expect(proposal.work).toBeGreaterThanOrEqual(input.actions.length);
          counts[proposal.command.type] = (counts[proposal.command.type] ?? 0) + 1;
          const next = adapter.act(state, proposal.command);
          expect(next.error).toBeUndefined();
          state = next.state;
        }
        expect(adapter.terminal(state), `${difficulty}/${strategy}`).toBe(true);
        expect(adapter.restore(adapter.replay(state)).session).toEqual(state.session);
      }
  }, 120000);
  it('chooses different offered relics for current damage, survival and future drafting', () => {
    const input = fresh();
    input.phase = 'relic';
    input.relicOffers = ['chisel', 'shell', 'lens'];
    input.actions = input.relicOffers.map((id) => ({ type: 'relic', id }));
    for (const strategy of STRATEGIES)
      expect(builtins[strategy].create(config)(input).command).toEqual({
        type: 'relic',
        id: { immediate: 'chisel', survival: 'shell', growth: 'lens' }[strategy],
      });
  });
  it('trades an immediate kill against avoiding a second announced hit', () => {
    const input = fresh(),
      p = input.player;
    p.hp = 12;
    input.enemies = [
      {
        id: 100,
        kind: 'keeper',
        hp: 4,
        room: input.room.id,
        x: p.x + 1,
        y: p.y,
        intent: { kind: 'attack', damage: 3, cells: [{ x: p.x, y: p.y }] },
      },
      {
        id: 101,
        kind: 'archer',
        hp: 4,
        room: input.room.id,
        x: p.x,
        y: p.y + 3,
        intent: { kind: 'attack', damage: 3, cells: [{ x: p.x, y: p.y }] },
      },
    ];
    input.actions = [
      { type: 'flare', target: 100 },
      { type: 'move', direction: 'north' },
    ];
    input.forecasts = input.actions.map((command) => combatForecast(input, command)!);
    expect(builtins.immediate.create(config)(input).command).toEqual({
      type: 'flare',
      target: 100,
    });
    expect(builtins.survival.create(config)(input).command).toEqual({
      type: 'move',
      direction: 'north',
    });
  });
  it('values permanent room upgrades for growth and offered healing when injured', () => {
    const input = fresh();
    input.phase = 'draft';
    input.draft = input.frontiers[0];
    input.offers = ['gallery', 'armory', 'shrine'];
    input.actions = input.offers.map((_, offer) => ({ type: 'draft', offer, rotation: 0 }));
    expect(builtins.immediate.create(config)(input).command).toEqual({
      type: 'draft',
      offer: 0,
      rotation: 0,
    });
    expect(builtins.growth.create(config)(input).command).toEqual({
      type: 'draft',
      offer: 1,
      rotation: 0,
    });
    input.player.hp -= 8;
    expect(builtins.survival.create(config)(input).command).toEqual({
      type: 'draft',
      offer: 2,
      rotation: 0,
    });
  });
  it('resets every factory and example counter for a fresh expedition', () => {
    const input = fresh(),
      choose = example.create(config),
      first = choose(input);
    expect(first.command).toEqual(builtins.immediate.create(config)(input).command);
    expect(choose(input)).not.toEqual(first);
    expect(example.create(config)(input)).toEqual(first);
  });
});
