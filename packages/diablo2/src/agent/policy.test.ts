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

/** Public-only fixture for the retained stationary-casting and recovery traces. */
function combatFixture(hero = 'sorceress'): Observation {
  const input = adapter.observe(adapter.create('PUBLIC-COMBAT-FIXTURE', { hero }));
  input.location = 'field';
  input.player.x = 3.5;
  input.player.y = 3.5;
  input.player.running = true;
  input.player.target = null;
  input.player.destination = null;
  input.region = {
    ...input.region,
    width: 9,
    height: 7,
    terrain: terrainRuns([
      '#########',
      '#.......#',
      '#.......#',
      '#.......#',
      '#.......#',
      '#.......#',
      '#########',
    ]),
  };
  input.enemies = [
    {
      x: 5.5,
      y: 3.5,
      uid: 999,
      kind: 'cultist',
      hp: 32,
      maxHp: 78,
      boss: false,
      elite: false,
      slow: 0,
      cursed: 0,
      windup: 0,
      warded: false,
    },
  ];
  input.hazards = [];
  input.projectiles = [];
  input.drops = [];
  input.markers = [];
  input.actions = [
    ...moves(input),
    { type: 'cast', skill: 'firebolt', target: { x: 5.5, y: 3.5 } },
    { type: 'advance', ticks: 5 },
  ];
  return input;
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

  it('checks current-node loot reach from the actual fractional player position', () => {
    // Exact positions from the retained policy5 DEV02 BarbarianSurvival gold stop.
    const input = fresh();
    input.location = 'field';
    Object.assign(input.player, {
      x: 50.85034503338453,
      y: 13.288720803348419,
      running: true,
      target: null,
      destination: null,
    });
    input.region = {
      ...input.region,
      width: 64,
      height: 44,
      terrain: terrainRuns(Array.from({ length: 44 }, () => '.'.repeat(64))),
    };
    input.enemies = [];
    input.hazards = [];
    input.projectiles = [];
    input.markers = [];
    input.drops = [
      { x: 49.65905338835959, y: 14.023233075959219, uid: 224, kind: 'gold', amount: 10 },
    ];
    input.actions = [...moves(input), { type: 'advance', ticks: 10 }];
    const gold = input.drops[0],
      center = { x: 50.5, y: 13.5 };
    expect(Math.hypot(input.player.x - gold.x, input.player.y - gold.y)).toBeGreaterThan(1.35);
    expect(Math.hypot(center.x - gold.x, center.y - gold.y)).toBeLessThan(1);
    const original = JSON.stringify(input),
      proposal = builtins.survival.create(config)(input);
    expect(proposal.command).toEqual({ type: 'move', target: { x: 49.5, y: 13.5 } });
    expect(input.actions).toContainEqual(proposal.command);
    expect(proposal.diagnostics).toMatchObject({ reason: 'known gold loot' });
    expect(builtins.survival.create(config)(structuredClone(input))).toEqual(proposal);
    expect(JSON.stringify(input)).toBe(original);
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

  it('changes an offered known firing angle after sustained unchanged target HP and reproduces public history', () => {
    const stream = [0, 40, 80, 120].map((tick) => ({ ...combatFixture(), tick }));
    const original = JSON.stringify(stream);
    const replay = () => {
      const decide = builtins.growth.create(config);
      return stream.map((input) => decide(structuredClone(input)));
    };
    const proposals = replay();
    expect(builtins.growth.version).toBe('emberwake-policy-8');
    expect(proposals.slice(0, 3).every((p) => p.command.type === 'cast')).toBe(true);
    const reposition = proposals.at(-1)!;
    expect(reposition.command.type).toBe('move');
    expect(stream.at(-1)!.actions).toContainEqual(reposition.command);
    expect(reposition.diagnostics).toMatchObject({
      reason: 'change known firing angle after stalled damage',
    });
    expect(replay()).toEqual(proposals);
    expect(JSON.stringify(stream)).toBe(original);
    // A new episode has no retained evidence of the failed casts.
    expect(builtins.growth.create(config)(stream.at(-1)!).command.type).toBe('cast');
    const decide = builtins.growth.create(config);
    stream.slice(0, 3).forEach((input) => decide(input));
    const damaged = structuredClone(stream.at(-1)!);
    damaged.enemies[0].hp = 20;
    expect(decide(damaged).command.type).toBe('cast');
  });

  it('retains failed firing origins through sensor loss and clears only on disclosed progress, corpse or region change', () => {
    const history = [0, 40, 80, 120].map((tick) => ({ ...combatFixture(), tick }));
    const hidden: Observation = { ...combatFixture(), tick: 125, enemies: [] };
    const reacquired = { ...combatFixture(), tick: 130 };
    const stream = [...history, hidden, reacquired];
    const run = () => {
      const decide = builtins.growth.create(config);
      return stream.map((input) => decide(structuredClone(input)));
    };
    const before = JSON.stringify(stream),
      proposals = run();
    expect(proposals.at(-1)?.command.type).toBe('move');
    expect(proposals.at(-1)?.diagnostics).toMatchObject({ combatProgress: { failedOrigins: 1 } });
    expect(run()).toEqual(proposals);
    expect(JSON.stringify(stream)).toBe(before);
    const progressed = builtins.growth.create(config);
    stream.forEach((input) => progressed(structuredClone(input)));
    const hurt = structuredClone(reacquired);
    hurt.tick = 135;
    hurt.enemies[0].hp--;
    expect(progressed(hurt).command.type).toBe('cast');
    expect(progressed(hurt).diagnostics).toMatchObject({ combatProgress: { failedOrigins: 0 } });
    const pursuit = builtins.growth.create(config);
    history.forEach((input) => pursuit(structuredClone(input)));
    const returning = structuredClone(hidden);
    returning.player.x = 2.5;
    returning.player.destination = { x: 3.5, y: 3.5 };
    returning.actions.push({ type: 'steer', direction: { x: 0, y: 0 } });
    expect(pursuit(returning).command).toEqual({ type: 'steer', direction: { x: 0, y: 0 } });
    for (const reset of ['corpse', 'region'] as const) {
      const decide = builtins.growth.create(config);
      stream.forEach((input) => decide(structuredClone(input)));
      const cleared = structuredClone(hidden);
      cleared.tick = 135;
      if (reset === 'corpse') cleared.enemies = [{ ...reacquired.enemies[0], hp: 0 }];

      // The reset observation is consumed before a newly disclosed live alias.
      if (reset === 'region')
        cleared.region.id = cleared.atlas.regions.find((r) => r.id !== reacquired.region.id)!.id;
      decide(cleared);
      const seen = structuredClone(reacquired);
      seen.tick = 140;
      if (reset === 'region') seen.region.id = cleared.region.id;
      expect(decide(seen).command.type).toBe('cast');
    }
  });

  it('escapes all simultaneous active warnings rather than the first warning alone', () => {
    const input = combatFixture();
    input.enemies = [];
    input.actions = [
      { type: 'move', target: { x: 2.5, y: 3.5 } },
      { type: 'move', target: { x: 3.5, y: 4.5 } },
      { type: 'advance', ticks: 5 },
    ];
    input.hazards = [
      { x: 3.5, y: 3.5, radius: 0.6, delay: 12, damage: 10, element: 'physical', uid: 1, life: 20 },
      { x: 2.5, y: 3.5, radius: 0.8, delay: 16, damage: 10, element: 'physical', uid: 2, life: 20 },
    ];
    const original = JSON.stringify(input);
    const proposal = builtins.survival.create(config)(input);
    expect(proposal.command).toEqual({ type: 'move', target: { x: 3.5, y: 4.5 } });
    expect(builtins.survival.create(config)(structuredClone(input))).toEqual(proposal);
    expect(JSON.stringify(input)).toBe(original);
  });

  it('preserves healthy melee reach among warning-safe escapes while recovery keeps foe clearance', () => {
    // Combat projection of retained DEV01 decision7969/tick29445. The separate
    // frozen-bundle receipt replays the complete original public input unchanged.
    const input = adapter.observe(
      adapter.create('PUBLIC-MELEE-WARNING', { hero: 'barbarian', difficulty: 'severe' }),
    );
    input.location = 'field';
    input.tick = 29445;
    Object.assign(input.player, {
      x: 40.5,
      y: 11.739999999999998,
      hp: 263.6,
      mana: 87,
      stamina: 0,
      running: true,
      target: null,
      destination: { x: 40.5, y: 12.5 },
    });
    input.stats.maxHp = 311;
    input.enemies = [
      {
        x: 44.90253425599096,
        y: 14.052166779205423,
        uid: 200,
        kind: 'briar',
        hp: 70,
        maxHp: 280,
        boss: true,
        elite: false,
        slow: 0,
        cursed: 0,
        windup: 12,
        warded: false,
      },
    ];
    input.hazards = [
      {
        x: 40.5,
        y: 11.739999999999998,
        uid: 985,
        radius: 1.8,
        delay: 12.5,
        damage: 30.400000000000002,
        element: 'poison',
        life: 15.5,
      },
      {
        x: 44.90253425599096,
        y: 14.052166779205423,
        uid: 986,
        radius: 3,
        delay: 16.5,
        damage: 30.400000000000002,
        element: 'poison',
        life: 19.5,
      },
    ];
    input.projectiles = [];
    input.actions = [
      ...[
        { x: 39.5, y: 11.5 },
        { x: 38.5, y: 11.5 },
        { x: 40.5, y: 12.5 },
        { x: 40.5, y: 13.5 },
        { x: 40.5, y: 14.5 },
        { x: 40.5, y: 10.5 },
        { x: 40.5, y: 9.5 },
        { x: 40.5, y: 8.5 },
        { x: 40.5, y: 7.5 },
      ].map((target) => ({ type: 'move' as const, target })),
      { type: 'advance', ticks: 5 },
    ];
    const original = JSON.stringify(input),
      proposal = builtins.survival.create(config)(input);
    expect(proposal.command).toEqual({ type: 'move', target: { x: 40.5, y: 14.5 } });
    expect(builtins.survival.create(config)(structuredClone(input))).toEqual(proposal);
    expect(JSON.stringify(input)).toBe(original);
    const wounded = structuredClone(input);
    wounded.player.hp = input.stats.maxHp * 0.2;
    wounded.player.cooldowns['@health-potion'] = 300;
    expect(builtins.survival.create(config)(wounded).command).toEqual({
      type: 'move',
      target: { x: 40.5, y: 7.5 },
    });
  });

  it('ranks disclosed moving projectile clearance before foe clearance when retreating', () => {
    const input = combatFixture();
    input.player.x = 38.730793147;
    input.player.y = 25.5001707;
    input.player.hp = 47;
    input.player.stamina = 0;
    input.stats.maxHp = 110;
    input.player.cooldowns['@health-potion'] = 345;
    input.region = {
      ...input.region,
      width: 45,
      height: 33,
      terrain: terrainRuns(Array.from({ length: 33 }, () => '.'.repeat(45))),
    };
    input.enemies = [
      { ...input.enemies[0], x: 38.5, y: 26.5, kind: 'archer' },
      { ...input.enemies[0], uid: 1000, x: 38.5, y: 29.5, kind: 'archer' },
    ];
    input.projectiles = [
      {
        x: 38.30594408668401,
        y: 27.81111211073467,
        dx: -0.09702795665799879,
        dy: -0.8444439446326639,
        radius: 0.2,
        friendly: false,
        element: 'physical',
        uid: 28,
      },
    ];
    input.actions = [
      { type: 'move', target: { x: 34.5, y: 25.5 } },
      { type: 'move', target: { x: 40.5, y: 25.5 } },
      { type: 'move', target: { x: 38.5, y: 24.5 } },
      { type: 'move', target: { x: 38.5, y: 23.5 } },
      { type: 'cast', skill: 'firebolt', target: { x: 38.5, y: 26.5 } },
      { type: 'advance', ticks: 5 },
    ];
    const original = JSON.stringify(input),
      proposal = builtins.survival.create(config)(input);
    // Over two intervals the faster northbound arrow catches a north retreat.
    // The east route instead leaves its disclosed lane.
    expect(proposal.command).toEqual({ type: 'move', target: { x: 40.5, y: 25.5 } });
    expect(proposal.diagnostics).toMatchObject({
      reason: 'escape disclosed danger while awaiting health recovery',
    });
    expect(builtins.survival.create(config)(structuredClone(input))).toEqual(proposal);
    expect(JSON.stringify(input)).toBe(original);
    // Reversing only disclosed velocity changes which route intersects the shot.
    const outgoing = structuredClone(input);
    outgoing.projectiles[0].dy *= -1;
    expect(builtins.survival.create(config)(outgoing).command).toEqual({
      type: 'move',
      target: { x: 34.5, y: 25.5 },
    });
  });

  it('retreats before casting during unavailable healing and does not chase back on losing sight', () => {
    const input = combatFixture();
    input.player.hp = input.stats.maxHp * 0.2;
    input.player.healthPotions = 8;
    input.player.cooldowns['@health-potion'] = 300;
    const decide = builtins.survival.create(config);
    const retreat = decide(input);
    expect(retreat.command.type).toBe('move');
    expect(input.actions).toContainEqual(retreat.command);
    expect(retreat.diagnostics).toMatchObject({
      reason: 'retreat while health recovery is unavailable',
    });
    const hidden = structuredClone(input);
    hidden.tick = 5;
    hidden.enemies = [];
    hidden.actions = [{ type: 'advance', ticks: 5 }];
    expect(decide(hidden).diagnostics).toMatchObject({
      reason: 'hold the known safe position for health recovery',
    });
    // Replay only detached original inputs: no environment handle or private state.
    const replay = builtins.survival.create(config);
    expect(replay(structuredClone(input))).toEqual(retreat);
    expect(replay(structuredClone(hidden))).toEqual(decide(structuredClone(hidden)));
    const ready = structuredClone(input);
    ready.tick = 10;
    ready.player.cooldowns['@health-potion'] = 0;
    ready.actions.push({ type: 'potion', kind: 'health' });
    expect(decide(ready).command).toEqual({ type: 'potion', kind: 'health' });
    expect(builtins.immediate.create(config)(input).command.type).toBe('cast');
  });

  it('does not resume offensive pursuit at a recovery corner with no improving retreat', () => {
    // Mechanically reduced public scene from A198 DEV04 Barbarian Standard d213.
    // Earlier input is reconstructed with the exact retained bundle and full native
    // journal/state parity; the original terminal tail independently shows this fallthrough.
    const input = combatFixture('barbarian');
    Object.assign(input.player, {
      x: 51.47561370393834,
      y: 35.50043330458749,
      hp: 51,
      stamina: 0.325,
      target: null,
      destination: null,
      running: true,
    });
    input.stats.maxHp = 155;
    input.player.cooldowns['@health-potion'] = 15;
    input.region = {
      ...input.region,
      width: 72,
      height: 48,
      terrain: terrainRuns(Array.from({ length: 48 }, () => '.'.repeat(72))),
    };
    input.enemies = [
      {
        ...input.enemies[0],
        uid: 22,
        kind: 'archer',
        x: 47.80027085114824,
        y: 41.8552943224179,
        hp: 32,
      },
    ];
    input.actions = [
      ...[50.5, 49.5, 48.5, 47.5].map((x) => ({ type: 'move' as const, target: { x, y: 35.5 } })),
      ...[36.5, 37.5, 38.5, 39.5].map((y) => ({ type: 'move' as const, target: { x: 51.5, y } })),
      { type: 'steer', direction: { x: 0, y: 0 } },
      { type: 'advance', ticks: 5 },
    ];
    const chasing = structuredClone(input);
    chasing.tick += 5;
    chasing.player.destination = { x: 51.5, y: 39.5 };
    const history = [input, chasing];
    const play = () => {
      const choose = builtins.survival.create(config);
      return history.map((frame) => choose(structuredClone(frame)));
    };
    const original = JSON.stringify(history),
      proposals = play();
    expect(proposals[0].command).toEqual({ type: 'advance', ticks: 5 });
    expect(proposals[1].command).toEqual({ type: 'steer', direction: { x: 0, y: 0 } });
    expect(proposals[0].diagnostics).toMatchObject({
      recovering: true,
      reason: 'await health recovery without offensive pursuit',
    });
    expect(play()).toEqual(proposals);
    expect(JSON.stringify(history)).toBe(original);
    for (let i = 0; i < history.length; i++)
      expect(history[i].actions).toContainEqual(proposals[i].command);
  });

  it('stops pending pursuit instead of using a damaging leap while recovery has no improving retreat', () => {
    // Exact positions, shots and offered movement from the original A198 DEV05
    // saved tail d7660/t38225, reduced to the public controls relevant to this defect.
    const input = combatFixture('barbarian');
    Object.assign(input.player, {
      x: 46.5,
      y: 16.930000000000003,
      hp: 175,
      stamina: 0,
      running: true,
      target: null,
      destination: { x: 46.5, y: 17.5 },
    });
    input.stats.maxHp = 514;
    input.player.cooldowns['@health-potion'] = 155;
    input.region = {
      ...input.region,
      width: 64,
      height: 44,
      terrain: terrainRuns(Array.from({ length: 44 }, () => '.'.repeat(64))),
    };
    input.enemies = [
      {
        ...input.enemies[0],
        uid: 915,
        kind: 'demon',
        x: 46.53100886827329,
        y: 12.032001978927449,
        hp: 258,
      },
      {
        ...input.enemies[0],
        uid: 914,
        kind: 'demon',
        x: 46.063075163059764,
        y: 13.159895542712794,
        hp: 258,
      },
      {
        ...input.enemies[0],
        uid: 919,
        kind: 'lucent',
        x: 51.14043181775607,
        y: 13.794269048475808,
        hp: 420,
      },
      {
        ...input.enemies[0],
        uid: 922,
        kind: 'cultist',
        x: 49.934227421243975,
        y: 19.455470197819153,
        hp: 94,
      },
    ];
    input.projectiles = [
      {
        x: 47.16284625994427,
        y: 15.690490588472896,
        dx: -0.503887483872677,
        dy: -0.6845417471538624,
        uid: 923,
        radius: 0.2,
        element: 'fire',
        friendly: false,
      },
    ];
    input.actions = [
      ...[47.5, 48.5, 49.5, 50.5, 45.5, 44.5, 43.5].map((x) => ({
        type: 'move' as const,
        target: { x, y: 16.5 },
      })),
      ...[17.5, 18.5, 19.5, 20.5, 15.5, 14.5, 13.5, 12.5].map((y) => ({
        type: 'move' as const,
        target: { x: 46.5, y },
      })),
      { type: 'cast', skill: 'leap', target: { x: 46.53100886827329, y: 12.032001978927449 } },
      { type: 'steer', direction: { x: 0, y: 0 } },
      { type: 'advance', ticks: 5 },
    ];
    const original = JSON.stringify(input),
      decide = builtins.survival.create(config),
      proposal = decide(input);
    expect(proposal.command).toEqual({ type: 'steer', direction: { x: 0, y: 0 } });
    expect(proposal.diagnostics).toMatchObject({
      recovering: true,
      reason: 'stop offensive control while awaiting health recovery',
    });
    expect(builtins.survival.create(config)(structuredClone(input))).toEqual(proposal);
    expect(JSON.stringify(input)).toBe(original);
    for (const strategy of ['immediate', 'growth'] as const)
      expect(builtins[strategy].create(config)(input).command.type).toBe('cast');
    const healthy = structuredClone(input);
    healthy.player.hp = healthy.stats.maxHp;
    expect(builtins.survival.create(config)(healthy).command.type).toBe('cast');
    for (const [stock, cooldown] of [
      [0, 155],
      [6, 0],
    ]) {
      const unavailable = structuredClone(input);
      unavailable.player.healthPotions = stock;
      unavailable.player.cooldowns['@health-potion'] = cooldown;
      const choice = builtins.survival.create(config)(unavailable);
      expect(choice.command.type).toBe('cast');
      expect(choice.diagnostics).toMatchObject({ recovering: false });
    }
    const outOfStock = structuredClone(input);
    outOfStock.tick += 5;
    outOfStock.enemies = [];
    outOfStock.projectiles = [];
    outOfStock.player.destination = null;
    outOfStock.player.healthPotions = 0;
    outOfStock.actions = [{ type: 'advance', ticks: 5 }];
    expect(decide(outOfStock).diagnostics).toMatchObject({ recovering: false });
  });

  it('still leaves a disclosed warning during recovery when escape reduces foe clearance', () => {
    const input = combatFixture('barbarian');
    input.player.hp = input.stats.maxHp * 0.2;
    input.player.cooldowns['@health-potion'] = 100;
    input.actions = [{ type: 'advance', ticks: 5 }];
    const decide = builtins.survival.create(config);
    expect(decide(input).diagnostics).toMatchObject({ recovering: true });
    input.tick += 5;
    input.hazards = [
      { x: 3.5, y: 3.5, radius: 1, delay: 10, damage: 10, element: 'fire', life: 20, uid: 1001 },
    ];
    input.actions = [
      { type: 'move', target: { x: 4.5, y: 3.5 } },
      { type: 'advance', ticks: 5 },
    ];
    expect(decide(input).command).toEqual({ type: 'move', target: { x: 4.5, y: 3.5 } });
    expect(input.actions).toContainEqual(builtins.survival.create(config)(input).command);
  });

  it('escapes an incoming shot during pending recovery even when the offered route approaches the foe', () => {
    const input = combatFixture('barbarian');
    input.player.hp = input.stats.maxHp * 0.2;
    input.player.cooldowns['@health-potion'] = 100;
    input.projectiles = [
      { x: 3.5, y: 6, dx: 0, dy: -1, radius: 0.2, uid: 1001, element: 'physical', friendly: false },
    ];
    input.actions = [
      { type: 'move', target: { x: 5.5, y: 3.5 } },
      { type: 'cast', skill: 'cleave', target: { x: 5.5, y: 3.5 } },
      { type: 'advance', ticks: 5 },
    ];
    // The untimed paths cross at the player's starting point. Relative motion
    // instead distinguishes standing still until tick5 from leaving before arrival.
    const original = JSON.stringify(input),
      proposal = builtins.survival.create(config)(input);
    expect(proposal.command).toEqual({ type: 'move', target: { x: 5.5, y: 3.5 } });
    expect(proposal.diagnostics).toMatchObject({
      reason: 'escape disclosed danger while awaiting health recovery',
    });
    expect(builtins.survival.create(config)(structuredClone(input))).toEqual(proposal);
    expect(JSON.stringify(input)).toBe(original);
    for (const strategy of ['immediate', 'growth'] as const)
      expect(builtins[strategy].create(config)(input).command.type).toBe('cast');
    const healthy = structuredClone(input);
    healthy.player.hp = healthy.stats.maxHp;
    expect(builtins.survival.create(config)(healthy).command.type).toBe('cast');
    const prime = structuredClone(input);
    prime.projectiles = [];
    prime.actions = [{ type: 'advance', ticks: 5 }];
    const hidden = structuredClone(input);
    hidden.tick += 5;
    hidden.enemies = [];
    const history = [prime, hidden];
    const play = () => {
      const choose = builtins.survival.create(config);
      return history.map((frame) => choose(structuredClone(frame)));
    };
    expect(play()[1].command).toEqual({ type: 'move', target: { x: 5.5, y: 3.5 } });
    expect(play()).toEqual(play());
  });

  it('finishes the sole disclosed attacker without moving during stocked pending recovery', () => {
    // Reduced original D DEV01 d1685/t7715: the 18-HP hound, rank1 Cleave,
    // strength27, HP80/269 and stocked cooldown. Coordinates translate together.
    const input = combatFixture('barbarian');
    input.player.hp = 80;
    input.stats.maxHp = 269;
    input.player.attributes.strength = 27;
    input.player.skills.cleave = 1;
    input.player.cooldowns['@health-potion'] = 202.5;
    input.enemies[0] = {
      ...input.enemies[0],
      kind: 'hound',
      hp: 18,
      x: 3.956755439968756,
      y: 4.883985634261614,
    };
    const cast: PolicyCommand = {
      type: 'cast',
      skill: 'cleave',
      target: { x: input.enemies[0].x, y: input.enemies[0].y },
    };
    input.actions = [...moves(input), cast, { type: 'advance', ticks: 5 }];
    const original = JSON.stringify(input);
    const play = () => {
      const decide = builtins.survival.create(config);
      const first = decide(structuredClone(input));
      return [first, decide(structuredClone(input))];
    };
    expect(play()[0].command).toEqual(cast);
    expect(play()[0].diagnostics).toMatchObject({
      reason: 'finish every disclosed attacker before recovery',
    });
    expect(play()[1].command).toEqual({ type: 'advance', ticks: 5 });
    expect(play()).toEqual(play());
    expect(JSON.stringify(input)).toBe(original);
    const rejects = (changed: Observation) =>
      expect(builtins.survival.create(config)(changed).diagnostics).not.toMatchObject({
        reason: 'finish every disclosed attacker before recovery',
      });
    // The final t7720 frame additionally discloses a distant archer: killing only
    // the hound cannot justify advancing in front of that other known attacker.
    for (const extra of [
      { x: 7.5, y: 3.5, hp: 1 },
      { x: 3.5, y: 4.5, hp: 1000 },
    ]) {
      const changed = structuredClone(input);
      changed.enemies.push({ ...changed.enemies[0], ...extra, uid: 1000 });
      rejects(changed);
    }
    const fog = structuredClone(input);
    fog.region.terrain = terrainRuns(
      terrainRows(fog.region).map((row, y) => (y === 4 ? '#..#....#' : row)),
    );
    rejects(fog);
    const nonlethal = structuredClone(input);
    nonlethal.enemies[0].hp = 1000;
    rejects(nonlethal);
    // Resistance and curse use the native rounded cast then rounded hit order.
    // With this disclosed rank/strength, a cursed hound at53HP is finished;
    // one additional HP or removing its disclosed curse rejects that claim.
    const cursed = structuredClone(input);
    cursed.enemies[0].cursed = 10;
    cursed.enemies[0].hp = 53;
    expect(builtins.survival.create(config)(cursed).command).toEqual(cast);
    cursed.enemies[0].hp = 54;
    rejects(cursed);
    cursed.enemies[0].hp = 53;
    cursed.enemies[0].cursed = 0;
    rejects(cursed);
    const nova = structuredClone(input);
    nova.player.skills.warcry = 1;
    nova.actions = [
      { type: 'cast', skill: 'warcry', target: { x: nova.player.x, y: nova.player.y } },
      { type: 'advance', ticks: 5 },
    ];
    nova.enemies.push({ ...nova.enemies[0], uid: 1000, x: 4.5, y: 3.5, hp: 1 });
    expect(builtins.survival.create(config)(nova).command.type).toBe('cast');
    const warning = structuredClone(input);
    warning.hazards = [
      { x: 7.5, y: 4.5, uid: 1001, radius: 1, delay: 10, damage: 1, element: 'fire', life: 1 },
    ];
    rejects(warning);
    const shot = structuredClone(input);
    shot.projectiles = [
      {
        x: 7.5,
        y: 4.5,
        uid: 1002,
        dx: 1,
        dy: 0,
        radius: 0.2,
        element: 'physical',
        friendly: false,
      },
    ];
    rejects(shot);
    for (const effect of ['leap', 'projectile', 'curse', 'summon'] as const) {
      const changed = structuredClone(input);
      changed.definitions.skills.find((skill) => skill.id === 'cleave')!.effect = effect;
      rejects(changed);
    }
    const noFoes = structuredClone(input);
    noFoes.enemies = [];
    rejects(noFoes);
  });

  it('starts the disclosed north escape before the second recovery interval of an incoming shot', () => {
    // Exact original D DEV02 d1262/t5255 public geometry; only the unrelated
    // atlas/content/inventory and known-floor corridor are reduced here.
    const input = combatFixture('barbarian');
    Object.assign(input.player, { x: 20.5, y: 45.5, hp: 44, stamina: 5.425 });
    input.player.cooldowns['@health-potion'] = 385;
    input.stats.maxHp = 145;
    input.region = {
      ...input.region,
      width: 50,
      height: 50,
      terrain: terrainRuns(Array.from({ length: 50 }, () => '.'.repeat(50))),
    };
    input.enemies[0] = {
      ...input.enemies[0],
      kind: 'archer',
      hp: 58,
      x: 25.313640285244183,
      y: 41.97235195185527,
    };
    input.projectiles = [
      {
        x: 23.25682781919747,
        y: 43.47967490315496,
        uid: 47,
        dx: -0.6856041553489033,
        dy: 0.5024409837665684,
        friendly: false,
        radius: 0.2,
        element: 'physical',
      },
    ];
    input.actions = [
      ...[1, 2, 3, 4].flatMap((n): PolicyCommand[] => [
        { type: 'move', target: { x: 20.5 + n, y: 45.5 } },
        { type: 'move', target: { x: 20.5, y: 45.5 - n } },
      ]),
      { type: 'advance', ticks: 5 },
    ];
    const original = JSON.stringify(input),
      proposal = builtins.survival.create(config)(input);
    expect(proposal.command.type).toBe('move');
    if (proposal.command.type === 'move') {
      expect(proposal.command.target.x).toBe(20.5);
      expect(proposal.command.target.y).toBeLessThan(45.5);
    }
    expect(proposal.diagnostics).toMatchObject({
      reason: 'escape disclosed danger while awaiting health recovery',
    });
    expect(builtins.survival.create(config)(structuredClone(input))).toEqual(proposal);
    expect(JSON.stringify(input)).toBe(original);
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
    expect(builtins.immediate.version).toBe(`emberwake-policy-${example.version}`);
    const input = fresh(),
      choose = example.create(config),
      first = choose(input);
    expect(first.command).toEqual(builtins.immediate.create(config)(input).command);
    expect(choose(input)).not.toEqual(first);
    expect(example.create(config)(input)).toEqual(first);
  });
});
