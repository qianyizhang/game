import { expect, test } from 'vitest';
import { createController } from './control';
import { restoreChronicle, exportChronicle } from './chronicle';
import { angleDelta } from '../domain/geometry';
import type { Input } from '../domain/types';
import { createPolicy } from '../agent/policy';
const input: Input = {
  x: 1,
  y: 0,
  aim: -Math.PI / 2,
  attack: false,
  special: false,
  dash: false,
  cast: false,
  call: false,
};

test('decision work delays delivery while previous controls continue; replay reproduces executed time and state', () => {
  const a = createController('control-order', {
    config: {
      observationTicks: 2,
      reactionTicks: 3,
      workPerTick: 32,
      holdTicks: 2,
      switchTicks: 0,
    },
  });
  a.step({ type: 'start', weapon: 'bow', runes: [] });
  const first = a.step({ type: 'frame', ticks: 1, input }, 32);
  expect(first.trace).toMatchObject({
    decisionTick: 0,
    deliveryTick: 4,
    nextDecisionTick: 6,
    workUnits: 32,
  });
  expect(a.result().player.x).toBeCloseTo(480 + 2 * 3.8);
  const before = a.result().player.x;
  const second = a.step({ type: 'frame', ticks: 1, input: { ...input, x: 0 } }, 64);
  expect(second.trace).toMatchObject({ decisionTick: 6, deliveryTick: 11, nextDecisionTick: 13 });
  expect(a.result().player.x).toBeCloseTo(before + 5 * 3.8);
  expect(second.observation.perception.ageTicks).toBe(2);
  const restored = restoreChronicle(a.exportReplay());
  expect(restored.state.tick).toBe(a.result().tick);
  expect(restored.state.player).toEqual(a.result().player);
  expect(JSON.parse(exportChronicle(restored))).toMatchObject({
    controller: { version: 'night-passage-control-1' },
    score: 'night-passage-score-2',
  });
});

test('every policy view redacts hidden timing; rejected controls preserve state and history', () => {
  const a = createController('control-redaction');
  a.step({ type: 'start', weapon: 'sword', runes: [] });
  const seen = a.observe();
  for (const key of ['buffer', 'strike', 'dashCooldown', 'invulnerable', 'castClock'])
    expect(seen.player).not.toHaveProperty(key);
  for (const enemy of seen.enemies) expect(enemy).not.toHaveProperty('windup');
  for (const hazard of seen.room.hazards)
    for (const key of ['offset', 'cycle', 'ticksUntilActive'])
      expect(hazard).not.toHaveProperty(key);
  const replay = a.exportReplay();
  const rejected = a.step({ type: 'buy', item: 'heart' });
  expect(rejected.accepted).toBe(false);
  expect(rejected.observation).toEqual(seen);
  expect(a.exportReplay()).toBe(replay);
  seen.player.hp = 999999;
  expect(a.observe().player.hp).toBe(120);
});

test('aim changes are bounded each executed tick; budget cutoff cancels an undelivered input', () => {
  const a = createController('control-aim', {
    config: { reactionTicks: 0, holdTicks: 6, switchTicks: 0, aimRadiansPerTick: 0.1 },
  });
  a.step({ type: 'start', weapon: 'sword', runes: [] });
  a.step({ type: 'frame', ticks: 1, input: { ...input, aim: Math.PI / 2 } }, 0, 3);
  expect(a.result().tick).toBe(3);
  expect(angleDelta(a.result().player.aim, -Math.PI / 2)).toBeCloseTo(0.3);
  const b = createController('control-cutoff', { config: { reactionTicks: 3, workPerTick: 32 } });
  b.step({ type: 'start', weapon: 'sword', runes: [] });
  const r = b.step({ type: 'frame', ticks: 1, input }, 256, 5);
  expect(r.trace?.deliveryTick).toBeNull();
  expect(b.result().tick).toBe(5);
  expect(b.result().player.x).toBe(480);
  expect(b.metrics().cancelled).toBe(1);
});

test('reasoning budgets count candidate work and never mutate the supplied view', () => {
  const a = createController('policy-work');
  a.step({ type: 'start', weapon: 'sword', runes: [] });
  const seen = a.observe();
  seen.threats = [
    {
      enemyId: 1,
      stage: 'late',
      projectileAngles: [],
      shapes: [{ kind: 'circle', center: { x: seen.player.x, y: seen.player.y }, radius: 80 }],
    },
  ];
  const original = structuredClone(seen);
  const quick = createPolicy('quick')(seen),
    deliberate = createPolicy('deliberate')(seen);
  expect(quick.work.candidates).toBe(4);
  expect(deliberate.work.candidates).toBe(16);
  expect(deliberate.work.total).toBeGreaterThan(quick.work.total);
  expect(seen).toEqual(original);
});

test('hazard redaction protects a nonempty later chamber through actual policy play', () => {
  const a = createController('passage-control-development-1-00');
  const decide = createPolicy('balanced');
  a.step({ type: 'start', weapon: 'bow', runes: ['vigor', 'fleet'] });
  for (let i = 0; i < 2000 && a.result().phase === 'combat'; i++) {
    const d = decide(a.observe());
    a.step(d.command, d.work.total);
  }
  expect(a.result().phase).toBe('reward');
  a.step(decide(a.observe()).command);
  expect(a.result().phase).toBe('route');
  a.step({ type: 'travel', index: 0 });
  const view = a.observe();
  expect(view.room.hazards.length).toBeGreaterThan(0);
  for (const h of view.room.hazards)
    for (const key of ['offset', 'cycle', 'ticksUntilActive']) expect(h).not.toHaveProperty(key);
  expect(a.step({ type: 'buy', item: 'heal' }).observation).toEqual(view);
});
