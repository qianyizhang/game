import { baselineCommand } from '../agent/player';
import { expect, test } from 'vitest';
import type { Input } from '../domain/types';
import { createAgent, observeChronicle } from './agent';
import { dispatch, restoreChronicle, exportChronicle, createChronicle } from './chronicle';

const idle: Input = {
  x: 0,
  y: 0,
  aim: 0,
  attack: false,
  special: false,
  dash: false,
  cast: false,
  call: false,
};

test('agent commands advance the rules, reject atomically, and reconstruct from accepted commands', () => {
  const agent = createAgent('agent-replay');
  const command = {
    type: 'start',
    weapon: 'sword',
    runes: ['vigor'],
    callerMetadata: () => 'private',
  };
  expect(agent.step(command).accepted).toBe(true);
  command.weapon = 'bow';
  command.runes.push('fury');
  const result = agent.step({ type: 'frame', ticks: 30, input: { ...idle, x: 1 } });
  expect(result).toMatchObject({ accepted: true, error: null, observation: { tick: 30 } });
  expect(result.observation.player.x).toBeGreaterThan(480);
  expect(result.observation.player.weapon).toBe('sword');
  const before = agent.observe();
  const replay = agent.exportReplay();
  expect(replay).not.toContain('callerMetadata');
  for (const invalid of [
    null,
    { type: 'frame', ticks: 121, input: idle },
    { type: 'frame', ticks: 1.5, input: idle },
    { type: 'frame', ticks: 1, input: { ...idle, x: NaN } },
    { type: 'travel', index: 0 },
    { type: 'return' },
  ]) {
    expect(agent.step(invalid)).toMatchObject({ accepted: false, observation: before });
    expect(agent.exportReplay()).toBe(replay);
  }
  expect(observeChronicle(restoreChronicle(replay))).toEqual(before);
  expect(agent.step({ type: 'retire' }).observation.phase).toBe('lost');
  expect(agent.step({ type: 'return' }).observation.phase).toBe('hub');
  expect(observeChronicle(restoreChronicle(agent.exportReplay()))).toEqual(agent.observe());
});

test('observations and catalog entries are detached and omit hidden enemy and chronicle state', () => {
  const agent = createAgent('agent-isolation');
  const hub = agent.observe();
  hub.catalog.weapons[0].attack.damage = 1_000_000;
  hub.catalog.runes[0].description = 'changed';
  hub.profile.unlockedRunes.push('fury');
  expect(agent.step({ type: 'start', weapon: 'sword', runes: ['fury'] }).accepted).toBe(false);
  const started = agent.step({ type: 'start', weapon: 'sword', runes: [] }).observation;
  expect(started.catalog.weapon.attack.damage).toBe(23);
  const fresh = agent.observe();
  started.player.hp = 1_000_000;
  started.enemies[0].hp = 0;
  started.room.pillars.splice(0);
  started.catalog.weapon.attack.damage = 0;
  expect(agent.observe()).toEqual(fresh);
  for (const key of ['seed', 'rng', 'nextId', 'journal', 'rewardReturn'])
    expect(fresh).not.toHaveProperty(key);
  for (const key of ['cooldown', 'target', 'pattern'])
    expect(fresh.enemies[0]).not.toHaveProperty(key);
  expect(JSON.parse(JSON.stringify(fresh))).toEqual(fresh);
});

test('legal observation follows actual command eligibility, announced threats and a visited market', () => {
  let current = createChronicle('a-light-in-the-dark');
  const initial = observeChronicle(current);
  expect(initial.legalActions.filter((command) => command.type === 'start')).toHaveLength(105);
  expect(initial.legalActions).not.toContainEqual({ type: 'train' });
  expect(initial.frame).toBeNull();
  current = dispatch(current, {
    type: 'start',
    weapon: 'bow',
    runes: ['vigor', 'fleet'],
  }).chronicle;
  let sawThreat = false,
    sawShop = false;
  for (
    let step = 0;
    step < 6000 && current.state.phase !== 'won' && current.state.phase !== 'lost';
    step++
  ) {
    const observation = observeChronicle(current);
    if (observation.threats.length && !sawThreat) {
      const before = exportChronicle(current);
      const threat = observation.threats[0];
      const enemy = current.state.enemies.find((e) => e.id === threat.enemyId)!;
      expect(threat.remainingWindupTicks).toBe(enemy.windup);
      expect(threat.shapes.length + threat.projectileAngles.length).toBeGreaterThan(0);
      const announced = structuredClone(threat);
      threat.shapes.splice(0);
      threat.projectileAngles.splice(0);
      expect(observeChronicle(current).threats[0]).toEqual(announced);
      expect(exportChronicle(current)).toBe(before);
      sawThreat = true;
    }
    if (observation.phase === 'shop') {
      sawShop = true;
      for (const command of observation.legalActions)
        expect(dispatch(current, command).error).toBeNull();
      for (const item of ['heal', 'heart', 'boon'] as const) {
        const command = { type: 'buy', item } as const;
        expect(observation.legalActions.some((c) => c.type === 'buy' && c.item === item)).toBe(
          dispatch(current, command).error === null,
        );
      }
    }
    if (sawThreat && sawShop) break;
    const command =
      observation.phase === 'route' && observation.routes.some((r) => r.reward === 'shop')
        ? observation.routes.find((r) => r.reward === 'shop')!.command
        : baselineCommand(observation);
    const next = dispatch(current, command);
    expect(next.error).toBeNull();
    current = next.chronicle;
  }
  expect(sawThreat).toBe(true);
  expect(sawShop).toBe(true);
});
