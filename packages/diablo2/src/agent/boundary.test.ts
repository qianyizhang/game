import { describe, expect, it } from 'vitest';
import { auditRollout, recordEpisode } from '../../../../src/shared/policy/rollout';
import type { PolicyFactory } from '../../../../src/shared/policy/types';
import { dispatch, newSession, importSession } from '../application/session';
import { currentWorld } from '../domain/world';
import {
  distance,
  knownCell,
  walkable,
  visibleActor,
  reveal,
  bodyFits,
  findPath,
} from '../domain/maps';
import { adapter, at, cursor, type EpisodeState } from './adapter';
import {
  emptyAliases,
  observe,
  terrainRuns,
  terrainRows,
  type Observation,
  type PolicyCommand,
} from './observation';
const fresh = () =>
  adapter.create('EMBERWAKE-BOUNDARY', { hero: 'barbarian', difficulty: 'standard' });
const waiting: PolicyFactory<Observation, PolicyCommand> = {
  id: 'boundary-waiting',
  version: '1',
  create: () => (input) => ({
    command:
      input.location === 'town'
        ? input.actions.find((c) => c.type === 'travel')!
        : { type: 'advance', ticks: 5 },
    work: 1,
  }),
};

describe('Emberwake restricted campaign boundary', () => {
  it('retains every known and unknown terrain glyph in a compact public round trip', () => {
    const rows = ['???###...,,,::;;==~!^', '????', '####', '.?.?.?'];
    const terrain = terrainRuns(rows);
    expect(terrain[1]).toEqual([[4, '?']]);
    expect(terrainRows({ terrain })).toEqual(rows);
    const input = fresh().input;
    expect(input.definitions.heroes.map((hero) => hero.id)).toEqual([input.hero]);
    expect(input.definitions.skills.map((skill) => skill.id)).toEqual(
      input.definitions.heroes[0].skills,
    );
    expect(input.atlas.progress.visited).toEqual([]);
    expect(input.atlas.regions.every((region) => !('floor' in region))).toBe(true);
  });

  it('withholds hidden geometry, enemy state, RNG and global allocation order while keeping stable observed aliases', () => {
    const town = fresh();
    const moved = adapter.act(
      town,
      town.input.actions.find((c) => c.type === 'travel')!,
    );
    expect(moved.error).toBeUndefined();
    const left = moved.state.session;
    const seenEnemy = currentWorld(left.state).enemies[0];
    const cell = currentWorld(left.state)
      .seen.map((index) => ({
        x: (index % currentWorld(left.state).tiles[0].length) + 0.5,
        y: Math.floor(index / currentWorld(left.state).tiles[0].length) + 0.5,
      }))
      .find(
        (at) =>
          walkable(currentWorld(left.state), at) &&
          visibleActor(currentWorld(left.state), left.state.player, at) &&
          distance(left.state.player, at) > 2,
      )!;
    seenEnemy.x = cell.x;
    seenEnemy.y = cell.y;
    left.state.player.target = seenEnemy.uid;
    const original = observe(left, emptyAliases());
    expect(original.enemies.length).toBeGreaterThan(0);
    expect(original.player.target).toBe(original.enemies[0].uid);
    const other = structuredClone(left);
    other.state.seed = other.replay.seed = 'PRIVATE-OTHER-SEED';
    other.state.rng += 700;
    other.state.nextUid += 10000;
    other.state.player.target! += 10000;
    // Every native ID changes, including objects legitimately known to the player.
    for (const item of [
      ...other.state.player.inventory,
      ...other.state.player.stash,
      ...Object.values(other.state.player.equipment),
    ])
      item.uid += 10000;
    for (const [id, world] of Object.entries(other.state.worlds)) {
      for (const entity of [
        ...world.enemies,
        ...world.drops,
        ...world.hazards,
        ...world.projectiles,
        ...world.allies,
      ])
        entity.uid += 10000;
      if (id !== other.state.region) {
        world.enemies = [];
        world.tiles[0] = 'PRIVATE-HIDDEN-TERRAIN';
      }
    }
    const current = currentWorld(other.state);
    for (const enemy of current.enemies)
      if (!knownCell(current, enemy) && distance(other.state.player, enemy) > 9) {
        enemy.hp = 9999;
        enemy.phase += 99;
      }
    expect(observe(other, emptyAliases())).toEqual(original);
    expect(JSON.stringify(original)).not.toMatch(
      /PRIVATE-|nextUid|"rng"|"seed"|"path"|"revealOrigin"/,
    );
    expect(terrainRows(original.region).join('')).toContain('?');
    expect(original.definitions).not.toHaveProperty('regions');
    const memory = emptyAliases();
    observe(left, memory);
    const changedAllocation = structuredClone(left);
    changedAllocation.state.nextUid += 9000;
    expect(observe(changedAllocation, memory)).toEqual(original);
    const same = observe(left, moved.state.aliases);
    expect(same.player.equipment.weapon!.uid).toBe(original.player.equipment.weapon!.uid);
  });

  it('does not use an undisclosed neighboring tile as a leap-landing oracle', () => {
    // A visible actor can straddle the shadow of a wall. Actor visibility is
    // more precise than the historically revealed terrain-cell centers.
    const session = dispatch(newSession('EMBERWAKE-LEAP-SHADOW', 'barbarian'), {
      type: 'travel',
      act: 0,
    }).session;
    const world = currentWorld(session.state);
    const p = session.state.player;
    p.x = 10.5;
    p.y = 10.5;
    p.skills.leap = 1;
    p.mana = 100;
    world.tiles = world.tiles.map((row) => '.'.repeat(row.length));
    world.tiles[7] = world.tiles[7].slice(0, 11) + '#' + world.tiles[7].slice(12);
    world.seen = [];
    world.revealOrigin = -1;
    reveal(world, p);
    const target = { x: 11.1, y: 6.1 };
    world.enemies = [{ ...world.enemies[0], ...target, hp: 100 }];
    expect(visibleActor(world, p, target)).toBe(true);
    expect(knownCell(world, { x: 11, y: 5 })).toBe(false);
    expect(bodyFits(world, target)).toBe(true);
    const changed = structuredClone(session);
    const shadow = currentWorld(changed.state);
    shadow.tiles[5] = shadow.tiles[5].slice(0, 11) + '#' + shadow.tiles[5].slice(12);
    expect(bodyFits(shadow, target)).toBe(false);
    expect(visibleActor(shadow, changed.state.player, target)).toBe(true);
    const original = observe(session, emptyAliases());
    expect(observe(changed, emptyAliases())).toEqual(original);
    expect(
      original.actions.some(
        (c) =>
          c.type === 'cast' &&
          c.skill === 'leap' &&
          c.target.x === target.x &&
          c.target.y === target.y,
      ),
    ).toBe(false);
  });

  it('detaches inputs and atomically rejects respawn, developer, stale IDs and private long paths', () => {
    const initial = fresh();
    const input = adapter.observe(initial);
    input.player.attributes.strength = 9999;
    input.definitions.heroes[0].hp = 9999;
    expect(adapter.observe(initial).player.attributes.strength).not.toBe(9999);
    expect(initial.session.replay.content.heroes[0].hp).not.toBe(9999);
    for (const command of [
      { type: 'respawn' },
      { type: 'dev-refill' },
      { type: 'attack', target: 99999 },
      { type: 'move', target: { x: 100, y: 100 } },
    ]) {
      const result = adapter.act(initial, command as PolicyCommand);
      expect(result.error).toBeTruthy();
      expect(result.state).toBe(initial);
      expect(adapter.cursor(result.state)).toBe(0);
    }
    const field = adapter.act(
      initial,
      initial.input.actions.find((c) => c.type === 'travel')!,
    ).state;
    for (const command of field.input.actions)
      if (command.type === 'move') {
        expect(distance(field.session.state.player, command.target)).toBeLessThan(4.6);
        expect(knownCell(currentWorld(field.session.state), command.target)).toBe(true);
      }
  });

  it('offers only known straight four-cell routes, unchanged by hidden detours', () => {
    const session = dispatch(newSession('EMBERWAKE-STRAIGHT-ROUTE', 'barbarian'), {
      type: 'travel',
      act: 0,
    }).session;
    const world = currentWorld(session.state);
    const player = session.state.player;
    player.x = 10.7;
    player.y = 10.6;
    world.tiles = world.tiles.map((row) => '.'.repeat(row.length));
    const width = world.tiles[0].length;
    // Reveal exactly the strip needed by the diagonal alignment and cardinal route.
    world.seen = [];
    for (let x = 10; x <= 14; x++) world.seen.push(10 * width + x);
    const input = observe(session, emptyAliases());
    const command = { type: 'move' as const, target: { x: 14.5, y: 10.5 } };
    expect(input.actions).toContainEqual(command);
    expect(input.actions).not.toContainEqual({ type: 'move', target: { x: 15.5, y: 10.5 } });
    const changed = structuredClone(session);
    const other = currentWorld(changed.state);
    other.tiles = other.tiles.map((row, y) => (y === 10 ? row : '#'.repeat(row.length)));
    expect(observe(changed, emptyAliases())).toEqual(input);
    expect(findPath(world, player, command.target)).toEqual([
      { x: 11.5, y: 10.5 },
      { x: 12.5, y: 10.5 },
      { x: 13.5, y: 10.5 },
      command.target,
      command.target,
    ]);
    expect(findPath(other, player, command.target)).toEqual(
      findPath(world, player, command.target),
    );
    const shadow = structuredClone(session);
    shadow.state.player.y = 10.9;
    // The alignment crosses the footprint into unseen row 11.
    expect(observe(shadow, emptyAliases()).actions).not.toContainEqual(command);
  });

  it('blocks an unknown swept corner that point samples miss while retaining safe native routes', () => {
    const session = dispatch(newSession('EMBERWAKE-SWEPT-CORNER', 'barbarian'), {
      type: 'travel',
      act: 0,
    }).session;
    const world = currentWorld(session.state);
    session.state.player.x = 10.25;
    session.state.player.y = 10.01;
    session.state.player.running = true;
    world.tiles = world.tiles.map((row) => '.'.repeat(row.length));
    world.enemies = [];
    world.drops = [];
    world.hazards = [];
    world.projectiles = [];
    world.allies = [];
    const width = world.tiles[0].length;
    world.seen = [];
    for (let y = 8; y <= 12; y++)
      for (let x = 8; x <= 15; x++) if (x !== 11 || y !== 9) world.seen.push(y * width + x);
    const hiddenWall = structuredClone(session);
    const other = currentWorld(hiddenWall.state);
    other.tiles[9] = other.tiles[9].slice(0, 11) + '#' + other.tiles[9].slice(12);
    const input = observe(session, emptyAliases());
    expect(observe(hiddenWall, emptyAliases())).toEqual(input);
    // The old 0.1-distance samples offered this alignment, whose native third
    // tick depended on the undisclosed (11,9) footprint corner.
    const unsafe = { type: 'move' as const, target: { x: 11.5, y: 10.5 } };
    expect(input.actions).not.toContainEqual(unsafe);
    const unrestricted = (source: typeof session, command: PolicyCommand) =>
      dispatch(dispatch(source, command).session, { type: 'advance', ticks: 3 }).session;
    expect(unrestricted(session, unsafe).state.player.x).not.toBe(
      unrestricted(hiddenWall, unsafe).state.player.x,
    );
    const safe = { type: 'move' as const, target: { x: 9.5, y: 10.5 } };
    expect(input.actions).toContainEqual(safe);
    const left = unrestricted(session, safe),
      right = unrestricted(hiddenWall, safe);
    expect(left.state.player).toEqual(right.state.player);
    expect(left.replay.commands).toEqual(right.replay.commands);
  });

  it('audits original decisions without a policy and seeks through packed requested ticks', async () => {
    const run = await recordEpisode(adapter, waiting, {
      seed: 'EMBERWAKE-PACKED',
      setup: {},
      policySeed: 'INDEPENDENT',
      policyOptions: {},
      maxDecisions: 6,
    });
    expect(run.episode.status).toBe('timeout');
    const restored = adapter.restore(run.replay);
    expect(restored.session.replay.commands).toEqual([
      { type: 'travel', act: 0, region: restored.session.state.region },
      { type: 'advance', ticks: 25 },
    ]);
    expect(adapter.cursor(restored)).toBe(26);
    expect(at(restored, 3).session.state.tick).toBe(2);
    expect(at(restored, 1).session.state.tick).toBe(0);
    expect(at(restored, 0).session.state.location).toBe('town');
    expect(await auditRollout(adapter, run)).toMatchObject({
      integrity: 'passed',
      replay: 'passed',
      inputs: 'passed',
      decisions: 'unavailable',
    });
    expect(await auditRollout(adapter, run, waiting)).toMatchObject({
      integrity: 'passed',
      replay: 'passed',
      inputs: 'passed',
      decisions: 'passed',
    });
  });

  it('preserves a replayable prefix at the native requested-tick limit', () => {
    const base = newSession('EMBERWAKE-REQUESTED-LIMIT', 'barbarian');
    const commands = [
      ...Array.from({ length: 1999 }, () => ({ type: 'advance', ticks: 50 })),
      { type: 'advance', ticks: 45 },
    ];
    const native = importSession(JSON.stringify({ ...base.replay, commands }));
    const state = adapter.restore(
      JSON.parse(
        JSON.stringify(native.replay),
      ) as import('../../../../src/shared/policy/types').Json,
    );
    expect(state.input.requestedTicks).toBe(99995);
    expect(state.input.actions.filter((c) => c.type === 'advance')).toEqual([
      { type: 'advance', ticks: 1 },
      { type: 'advance', ticks: 5 },
    ]);
    const rejected = adapter.act(state, { type: 'advance', ticks: 50 });
    expect(rejected.state).toBe(state);
    expect(rejected.error).toBeTruthy();
    const accepted = adapter.act(state, { type: 'advance', ticks: 5 });
    expect(accepted.error).toBeUndefined();
    expect(accepted.state.input.requestedTicks).toBe(100000);
    expect(accepted.state.input.actions.some((c) => c.type === 'advance')).toBe(false);
    expect(adapter.terminal(accepted.state)).toBe(false);
    expect(adapter.restore(adapter.replay(accepted.state)).session).toEqual(accepted.state.session);
  });

  it('detects an intentional hidden-field input leak independently of legal replay', async () => {
    const leaky = {
      ...adapter,
      observe: (state: EpisodeState) => ({
        ...adapter.observe(state),
        privateRng: state.session.state.rng,
      }),
    };
    const run = await recordEpisode(leaky, waiting, {
      seed: 'EMBERWAKE-LEAK',
      setup: {},
      policySeed: 'INDEPENDENT',
      policyOptions: {},
      maxDecisions: 2,
    });
    expect(await auditRollout(adapter, run, waiting)).toMatchObject({
      integrity: 'passed',
      replay: 'passed',
      inputs: 'failed',
      decisions: 'passed',
      firstMismatch: { decision: 0, path: 'input' },
    });
  });

  it('ends policy attempts on first death and distinguishes terminal padding from executed ticks', () => {
    // Ordinary accepted native commands form a fatal journey; no respawn or injected snapshots.
    let session = newSession('EMBERWAKE-TERMINAL-PADDING', 'barbarian', undefined, false, 'severe');
    session = dispatch(session, { type: 'travel', act: 0 }).session;
    const world = currentWorld(session.state);
    const enemy = [...world.enemies].sort(
      (a, b) => distance(session.state.player, a) - distance(session.state.player, b),
    )[0];
    session = dispatch(session, { type: 'move', target: { x: enemy.x, y: enemy.y } }).session;
    let previousTicks = 0;
    for (let n = 0; n < 200 && session.state.status === 'playing'; n++) {
      previousTicks = session.state.tick;
      session = dispatch(session, { type: 'advance', ticks: 50 }).session;
    }
    expect(session.state.status).toBe('dead');
    expect(session.state.tick - previousTicks).toBeLessThan(50);
    const restored = adapter.restore(
      JSON.parse(
        JSON.stringify(session.replay),
      ) as import('../../../../src/shared/policy/types').Json,
    );
    expect(adapter.terminal(restored)).toBe(true);
    expect(adapter.metrics(restored).executedTicks).toBe(session.state.tick);
    const end = cursor(session);
    expect(at(restored, end - 1).session.state).toEqual(session.state);
    const result = adapter.act(restored, { type: 'advance', ticks: 1 });
    expect(result.error).toBeTruthy();
    expect(result.state).toBe(restored);
    expect(dispatch(session, { type: 'respawn' }).session.state.status).toBe('playing');
  });
});
