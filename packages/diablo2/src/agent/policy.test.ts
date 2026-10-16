import { describe, expect, it } from 'vitest';
import { adapter } from './adapter';
import { terrainRows, terrainRuns, type Observation, type PolicyCommand } from './observation';
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
    return '.,:;='.includes(
      terrainRows(input.region)[Math.floor(target.y)]?.[Math.floor(target.x)] ?? '#',
    )
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
      const skills = adapter.observe(adapter.create('POLICY-SKILLS', { hero })).definitions
        .heroes[0].skills;
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
      terrain: terrainRuns([
        '#######',
        '#..#..#',
        '#..#..#',
        '#..#..#',
        '#..#..#',
        '#.....#',
        '#######',
      ]),
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

  it('takes a four-cell offered route prefix and shortens observation intervals around danger', () => {
    const input = fresh();
    input.location = 'field';
    input.player.x = 1.5;
    input.player.y = 1.5;
    input.player.running = true;
    input.region = {
      ...input.region,
      width: 9,
      height: 3,
      terrain: terrainRuns(['#########', '#.......?', '#########']),
    };
    input.enemies = [];
    input.hazards = [];
    input.projectiles = [];
    input.drops = [];
    input.markers = [];
    input.actions = [1, 2, 3, 4].map((length) => ({
      type: 'move',
      target: { x: 1.5 + length, y: 1.5 },
    }));
    input.actions.push({ type: 'advance', ticks: 5 }, { type: 'advance', ticks: 10 });
    const choose = builtins.survival.create(config);
    expect(choose(input).command).toEqual({ type: 'move', target: { x: 5.5, y: 1.5 } });
    expect(choose(input).command).toEqual({ type: 'advance', ticks: 10 });
    const cautious = builtins.survival.create(config);
    cautious(input);
    input.projectiles = [
      { x: 6, y: 1.5, uid: 999, dx: -1, dy: 0, friendly: false, radius: 0.2, element: 'physical' },
    ];
    expect(cautious(input).command).toEqual({ type: 'advance', ticks: 5 });
  });

  it('routes around a known barrier to a visible ranged attacker instead of waiting under fire', () => {
    const input = fresh();
    input.location = 'field';
    input.player.x = 2.5;
    input.player.y = 1.5;
    input.player.running = true;
    input.player.target = null;
    input.player.destination = null;
    input.region = {
      ...input.region,
      width: 7,
      height: 7,
      terrain: terrainRuns([
        '#######',
        '#..~..#',
        '#..~..#',
        '#..~..#',
        '#..~..#',
        '#.....#',
        '#######',
      ]),
    };
    input.enemies = [
      {
        x: 4.5,
        y: 1.5,
        uid: 999,
        kind: 'archer',
        hp: 32,
        maxHp: 32,
        boss: false,
        elite: false,
        slow: 0,
        cursed: 0,
        windup: 0,
        warded: false,
      },
    ];
    input.hazards = [];
    input.actions = [...moves(input), { type: 'advance', ticks: 5 }];
    // A fractional footprint can make the otherwise shortest first step unavailable.
    // Route through another offered edge instead of selecting that blocked step.
    const corner = structuredClone(input);
    corner.actions = [
      { type: 'move', target: { x: 1.5, y: 1.5 } },
      { type: 'advance', ticks: 5 },
    ];
    expect(builtins.survival.create(config)(corner).command).toEqual({
      type: 'move',
      target: { x: 1.5, y: 1.5 },
    });
    const proposal = builtins.survival.create(config)(input);
    expect(proposal.command).toEqual({ type: 'move', target: { x: 2.5, y: 2.5 } });
    expect(proposal.diagnostics).toMatchObject({
      reason: 'route around known terrain to the visible foe',
    });
    // The detour temporarily loses line of sight. Remember the disclosed location,
    // rather than reversing toward an older exploration frontier.
    const pursue = builtins.survival.create(config);
    pursue(input);
    input.player.y = 2.5;
    input.tick += 5;
    input.enemies = [];
    input.actions = [...moves(input), { type: 'advance', ticks: 5 }];
    const continued = pursue(input);
    expect(continued.command).toEqual({ type: 'move', target: { x: 2.5, y: 3.5 } });
    expect(continued.diagnostics).toMatchObject({
      reason: 'pursue the last visible foe through known terrain',
      lastSeenFoe: { region: input.region.id, uid: 999, at: { x: 4.5, y: 1.5 } },
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

  it('returns to sell a full public pack even with healthy resources, then avoids a stationary return loop', () => {
    const input = fresh();
    input.location = 'field';
    input.player.running = true;
    const item = input.player.equipment.weapon!;
    input.player.inventory = [0, 2, 4, 6].map((cell, i) => ({
      ...item,
      uid: 100 + i,
      cell,
      width: 2,
      height: 3,
    }));
    input.actions = [{ type: 'portal' }, { type: 'advance', ticks: 20 }];
    const choose = builtins.immediate.create(config);
    expect(choose(input).command).toEqual({ type: 'portal' });
    expect(choose(input).command).toEqual({ type: 'advance', ticks: 20 });
  });

  it('caps idle time at ten ticks so an eight-thousand-decision attempt stays below the native tick limit', () => {
    const input = fresh();
    input.location = 'field';
    input.player.running = true;
    input.region = {
      ...input.region,
      width: 3,
      height: 3,
      terrain: terrainRuns(['###', '#.#', '###']),
    };
    input.player.x = 1.5;
    input.player.y = 1.5;
    input.markers = [];
    input.drops = [];
    input.enemies = [];
    input.actions = [1, 5, 10, 20, 50].map((ticks) => ({ type: 'advance', ticks }));
    for (const strategy of STRATEGIES)
      expect(builtins[strategy].create(config)(input).command).toEqual({
        type: 'advance',
        ticks: 10,
      });
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
