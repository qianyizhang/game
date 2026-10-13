import { expect, test } from 'vitest';
import type { Input } from '../domain/types';
import { createAgent, observeSession } from './agent';
import { dispatch, importSession, MAX_COMMANDS, MAX_TICKS, newSession } from './session';

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
  expect(observeSession(importSession(replay))).toEqual(before);
  expect(agent.step({ type: 'retire' }).observation.phase).toBe('lost');
  expect(agent.step({ type: 'return' }).observation.phase).toBe('hub');
  expect(observeSession(importSession(agent.exportReplay()))).toEqual(agent.observe());
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

test('observed choices follow current eligibility and expose only announced attack geometry', () => {
  const hub = newSession('agent-eligibility');
  const initial = observeSession(hub);
  expect(initial.legalActions.filter((command) => command.type === 'start')).toHaveLength(35);
  expect(initial.legalActions).not.toContainEqual({ type: 'train' });
  expect(initial.frame).toBeNull();
  const active = dispatch(hub, { type: 'start', weapon: 'sword', runes: [] }).session;
  active.state.enemies[0].kind = 'brute';
  active.state.enemies[0].windup = 9;
  const observation = observeSession(active);
  expect(observation.threats).toHaveLength(1);
  expect(observation.threats[0]).toMatchObject({
    remainingWindupTicks: 9,
    shapes: [{ kind: 'circle' }],
  });
  observation.threats[0].shapes.splice(0);
  expect(observeSession(active).threats[0].shapes).toHaveLength(1);
  expect(observation.frame?.ticks).toEqual({ min: 1, max: 120 });

  // The controlled shop state exercises affordability without a long tactical run.
  active.state.phase = 'shop';
  active.state.gold = 80;
  expect(observeSession(active).legalActions).toEqual([
    { type: 'buy', item: 'heart' },
    { type: 'buy', item: 'boon' },
    { type: 'leave' },
    { type: 'retire' },
  ]);
  active.state.player.hp--;
  active.state.purchases = ['heart'];
  const shop = observeSession(active);
  expect(shop.legalActions).toContainEqual({ type: 'buy', item: 'heal' });
  expect(shop.legalActions).not.toContainEqual({ type: 'buy', item: 'heart' });
  for (const command of shop.legalActions) expect(dispatch(active, command).error).toBeNull();
});

test('announced windup remains paused while an enemy is staggered', () => {
  const session = dispatch(newSession('agent-stagger'), {
    type: 'start',
    weapon: 'sword',
    runes: [],
  }).session;
  session.state.enemies[0].windup = 9;
  session.state.enemies[0].stagger = 5;
  const paused = dispatch(session, { type: 'frame', ticks: 5, input: idle }).session;
  expect(observeSession(paused).threats[0].remainingWindupTicks).toBe(9);
  const resumed = dispatch(paused, { type: 'frame', ticks: 1, input: idle }).session;
  expect(observeSession(resumed).threats[0].remainingWindupTicks).toBe(8);
});

test('frame bounds honor replay capacity and observation never advances the clock', () => {
  const session = dispatch(newSession('agent-limits'), {
    type: 'start',
    weapon: 'sword',
    runes: [],
  }).session;
  session.ticks = MAX_TICKS - 3;
  expect(observeSession(session).frame?.ticks).toEqual({ min: 1, max: 3 });
  expect(observeSession(session).tick).toBe(0);
  session.ticks = MAX_TICKS;
  expect(observeSession(session).frame).toBeNull();
  session.ticks = 0;
  session.journal!.length = MAX_COMMANDS;
  const exhausted = observeSession(session);
  expect(exhausted.frame).toBeNull();
  expect(exhausted.legalActions).toEqual([]);
});
