import { describe, expect, it } from 'vitest';
import { makeUnit } from '../domain/units';
import { adapter, HEROES } from './adapter';
import example from './example';
import type { Observation, PolicyCommand } from './observation';
import { builtins, STRATEGIES } from './policy';

const config = { setup: {}, options: {}, policySeed: 'INDEPENDENT-POLICY-1' };
const fresh = () => adapter.observe(adapter.create('POLICY-ADOPTION-1-DEV-01', {}));
function menu(view: Observation, commands: PolicyCommand[]) {
  view.actions = commands.map((command, index) => ({ id: `a${index}`, command }));
}

describe('Hearth observation-only priorities', () => {
  it('distinguishes current attack, defensive health and a permanent scaling engine on one public shop', () => {
    const view = fresh(),
      p = view.observation.self;
    p.board = [];
    p.hand = [];
    p.discover = [];
    p.shop = [
      { ...makeUnit('imp', 'e100'), attack: 12, health: 1, maxHealth: 1 },
      { ...makeUnit('squire', 'e101'), attack: 1, health: 10, maxHealth: 10 },
      makeUnit('molten', 'e102'),
    ];
    menu(view, [
      ...p.shop.map((unit): PolicyCommand => ({ type: 'buy', id: unit.id })),
      { type: 'endRecruit' },
    ]);
    const expected = { immediate: 'e100', survival: 'e101', growth: 'e102' };
    for (const strategy of STRATEGIES) {
      const proposal = builtins[strategy].create(config)(view);
      expect(proposal.command).toEqual({ type: 'buy', id: expected[strategy] });
      expect(proposal.work).toBeGreaterThanOrEqual(view.actions.length);
    }
  });

  it('uses a real survival health reserve and an earlier growth investment threshold', () => {
    const view = fresh(),
      o = view.observation,
      p = o.self;
    o.round = 6;
    p.tier = 2;
    p.gold = 5;
    p.upgradeCost = 4;
    p.hp = 24;
    p.board = Array.from({ length: 7 }, (_, index) => makeUnit('imp', `e${100 + index}`));
    p.hand = [];
    p.shop = [];
    p.discover = [];
    menu(view, [{ type: 'upgrade' }, { type: 'endRecruit' }]);
    expect(builtins.immediate.create(config)(view).command.type).toBe('upgrade');
    expect(builtins.survival.create(config)(view).command.type).toBe('endRecruit');
    p.hp = 40;
    p.board = p.board.slice(0, 4);
    o.round = 4;
    expect(builtins.growth.create(config)(view).command.type).toBe('upgrade');
    expect(builtins.immediate.create(config)(view).command.type).toBe('endRecruit');
    expect(builtins.survival.create(config)(view).command.type).toBe('endRecruit');
  });

  it('completes legal Standard episodes for all five heroes and three policies, then replays exactly', () => {
    const spells = Object.fromEntries(
      STRATEGIES.map((strategy) => [strategy, { bought: 0, cast: 0 }]),
    );
    for (const hero of HEROES) {
      for (const strategy of STRATEGIES) {
        const setup = { hero, difficulty: 'standard' };
        let state = adapter.create('POLICY-ADOPTION-1-DEV-01', setup);
        const decide = builtins[strategy].create({ ...config, setup });
        let steps = 0;
        while (steps++ < 3000 && !adapter.terminal(state)) {
          const input = adapter.observe(state),
            proposal = decide(input);
          if (proposal.command.type === 'buySpell') spells[strategy].bought++;
          if (proposal.command.type === 'castSpell') spells[strategy].cast++;
          expect(input.actions.map((entry) => entry.command)).toContainEqual(proposal.command);
          const result = adapter.act(state, proposal.command);
          expect(
            result.error,
            `${hero}/${strategy}: ${JSON.stringify(proposal.command)}`,
          ).toBeUndefined();
          state = result.state;
        }
        expect(adapter.terminal(state), `${hero}/${strategy}`).toBe(true);
        expect(adapter.restore(adapter.replay(state))).toEqual(state);
        expect(adapter.metrics(state).placement).toBeGreaterThanOrEqual(1);
        expect(adapter.metrics(state).placement).toBeLessThanOrEqual(8);
      }
    }
    for (const strategy of STRATEGIES) {
      expect(spells[strategy].bought, strategy).toBeGreaterThan(0);
      expect(spells[strategy].cast, strategy).toBeGreaterThan(0);
    }
  }, 120_000);

  it('resets extension memory per episode without changing the baseline command', () => {
    const view = fresh(),
      choose = example.create(config),
      first = choose(view);
    expect(first.command).toEqual(builtins.immediate.create(config)(view).command);
    expect(choose(view)).not.toEqual(first);
    expect(example.create(config)(view)).toEqual(first);
  });
});
