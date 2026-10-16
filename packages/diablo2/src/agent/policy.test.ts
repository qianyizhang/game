import { describe, expect, it } from 'vitest';
import { adapter } from './adapter';
import type { Observation, PolicyCommand } from './observation';
import { builtins, STRATEGIES, type Strategy } from './policy';
import example from './example';

const config = { setup: {}, options: {}, policySeed: 'INDEPENDENT-POLICY-1' };
const fresh = (): Observation => adapter.observe(adapter.create('POLICY-ADOPTION-1-DEV-01', {}));
function run(hero: string, strategy: Strategy) {
  let state = adapter.create('POLICY-ADOPTION-1-DEV-01', { hero, difficulty: 'standard' });
  const decide = builtins[strategy].create(config);
  const counts: Record<string, number> = {};
  for (let turn = 0; turn < 4000 && !adapter.terminal(state); turn++) {
    const input = adapter.observe(state),
      proposal = decide(input);
    expect(input.actions).toContainEqual(proposal.command);
    expect(Number.isSafeInteger(proposal.work) && proposal.work >= input.actions.length).toBe(true);
    const key =
      proposal.command.type === 'cast' ? `cast:${proposal.command.skill}` : proposal.command.type;
    counts[key] = (counts[key] ?? 0) + 1;
    const result = adapter.act(state, proposal.command);
    expect(
      result.error,
      `${hero}/${strategy}: ${JSON.stringify(proposal.command)}`,
    ).toBeUndefined();
    state = result.state;
  }
  return { state, counts };
}
function moves(input: Observation): PolicyCommand[] {
  const p = input.player;
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].flatMap(([dx, dy]) => {
    const target = { x: Math.floor(p.x) + dx + 0.5, y: Math.floor(p.y) + dy + 0.5 };
    return '.,:;='.includes(input.region.tiles[Math.floor(target.y)]?.[Math.floor(target.x)] ?? '#')
      ? [{ type: 'move' as const, target }]
      : [];
  });
}

describe('Emberwake public policies', () => {
  it('plays the same bounded first-death contract across all heroes and priorities using offered actions', () => {
    for (const hero of ['barbarian', 'sorceress', 'necromancer']) {
      const used = new Set<string>();
      for (const strategy of STRATEGIES) {
        const { state, counts } = run(hero, strategy);
        // Budget stops remain living attempts. These are progression witnesses, not wins.
        expect(adapter.metrics(state).bosses).toBeGreaterThanOrEqual(1);
        expect(adapter.metrics(state).regions).toBeGreaterThanOrEqual(5);
        expect(['playing', 'dead', 'victory']).toContain(state.input.status);
        for (const key of Object.keys(counts)) used.add(key);
      }
      const skills = fresh().definitions.heroes.find(
        (definition) => definition.id === hero,
      )!.skills;
      for (const skill of skills) expect(used.has(`cast:${skill}`), `${hero}/${skill}`).toBe(true);
    }
  }, 120000);

  it('distinguishes immediate damage, defensive armor and growth energy on the same public equipment choices', () => {
    const input = fresh(),
      item = input.player.equipment.weapon!;
    input.player.equipment = {};
    input.player.inventory = [
      { ...item, uid: 400, damage: 14, armor: 0, energy: 0 },
      { ...item, uid: 401, damage: 1, armor: 8, energy: 0 },
      { ...item, uid: 402, damage: 4, armor: 0, energy: 14 },
    ];
    input.actions = input.player.inventory.map((value) => ({ type: 'equip', uid: value.uid }));
    const expected = { immediate: 400, survival: 401, growth: 402 };
    for (const strategy of STRATEGIES)
      expect(builtins[strategy].create(config)(input).command).toEqual({
        type: 'equip',
        uid: expected[strategy],
      });
  });

  it('retains a known loot route which first moves outside the acquisition radius around a wall', () => {
    const input = fresh();
    input.location = 'field';
    input.player.x = 1.5;
    input.player.y = 1.5;
    input.player.running = true;
    input.region = {
      ...input.region,
      width: 7,
      height: 7,
      tiles: ['#######', '#..#..#', '#..#..#', '#..#..#', '#..#..#', '#.....#', '#######'],
    };
    input.drops = [{ x: 4.5, y: 1.5, uid: 100, kind: 'gold', amount: 10 }];
    input.actions = [...moves(input), { type: 'advance', ticks: 20 }];
    const decide = builtins.immediate.create(config);
    expect(decide(input).diagnostics).toMatchObject({ reason: 'known gold loot' });
    input.player.y = 4.5;
    input.tick = 5;
    input.actions = [...moves(input), { type: 'advance', ticks: 20 }];
    const continued = decide(input);
    expect(continued.command.type).toBe('move');
    expect(input.actions).toContainEqual(continued.command);
    expect(continued.diagnostics).toMatchObject({ reason: 'known gold loot' });
    // A fresh policy has never acquired this distant item and does not pursue it.
    expect(builtins.immediate.create(config)(input).diagnostics).toMatchObject({
      reason: 'no reachable revealed objective or frontier',
    });
  });

  it('permits ordinary refuge healing while preventing a stationary heal-return loop', () => {
    const input = fresh();
    input.location = 'field';
    input.player.running = true;
    input.player.hp = input.stats.maxHp * 0.55;
    input.player.healthPotions = 0;
    input.actions = [{ type: 'portal' }, { type: 'advance', ticks: 20 }];
    const decide = builtins.survival.create(config);
    expect(decide(input).command).toEqual({ type: 'portal' });
    input.location = 'town';
    input.player.hp = input.stats.maxHp;
    input.actions = [{ type: 'return' }];
    expect(decide(input).command).toEqual({ type: 'return' });
    input.location = 'field';
    input.tick = 100;
    input.player.hp = input.stats.maxHp * 0.55;
    input.actions = [{ type: 'portal' }, { type: 'advance', ticks: 20 }];
    expect(decide(input).command.type).toBe('advance');
  });

  it('uses a remaining native tick and reports native time-budget exhaustion explicitly', () => {
    const input = fresh();
    input.location = 'field';
    input.player.running = true;
    input.actions = [{ type: 'advance', ticks: 1 }];
    expect(builtins.immediate.create(config)(input).command).toEqual({ type: 'advance', ticks: 1 });
    input.actions = [];
    expect(() => builtins.immediate.create(config)(input)).toThrow(
      'Native requested-tick budget exhausted',
    );
  });

  it('resets factory-local extension memory and reproduces deterministic decisions', () => {
    const input = fresh(),
      choose = example.create(config),
      first = choose(input);
    expect(first.command).toEqual(builtins.immediate.create(config)(input).command);
    expect(choose(input)).not.toEqual(first);
    expect(example.create(config)(input)).toEqual(first);
  });
});
