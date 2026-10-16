import baseline from '../../../../tests/fixtures/emberwake-v2-continuity.json';
import { expect, it } from 'vitest';
import { BASE_CONTENT } from '../domain/content';
import { applyCommand, createGame, LEGACY_RULES_VERSION, RULES_VERSION } from '../domain/game';
import type { Command, Replay, State } from '../domain/types';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  saveKey,
  SAVE_KEY,
  LEGACY_SAVE_KEY,
  SANDBOX_SAVE_KEY,
} from './session';

const fixture = baseline as unknown as {
  cases: {
    hero: string;
    replay: Replay;
    stateDigest: string;
    continuation: Command;
    continuedStateDigest: string;
    continuedCommands: Command[];
  }[];
};
const digest = async (value: unknown) => {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};
const legacyShape = (state: State) => {
  const result = structuredClone(state);
  delete result.difficulty;
  result.rulesVersion = LEGACY_RULES_VERSION;
  return result;
};

it('reconstructs and continues complete pre-change v2 states without reinterpreting their damage', async () => {
  for (const saved of fixture.cases) {
    const restored = importSession(JSON.stringify(saved.replay));
    expect(await digest(restored.state)).toBe(saved.stateDigest);
    expect(restored.replay).toEqual(saved.replay);
    expect(saveKey(restored)).toBe(LEGACY_SAVE_KEY);
    expect(restored.state.difficulty).toBeUndefined();
    const next = dispatch(restored, saved.continuation);
    expect(next.error).toBeNull();
    expect(await digest(next.session.state)).toBe(saved.continuedStateDigest);
    expect(next.session.replay.commands).toEqual(saved.continuedCommands);
    expect(importSession(exportSession(next.session))).toEqual(next.session);
    // Current Standard differs only in explicit version/setup metadata.
    const current = newSession(saved.replay.seed, saved.hero);
    let state = current.state;
    for (const command of saved.replay.commands) {
      const result = applyCommand(state, command);
      expect(result.accepted).toBe(true);
      state = result.state;
    }
    expect(await digest(legacyShape(state))).toBe(saved.stateDigest);
  }
});

it('persists the chosen tier, rejects mismatched envelopes, and keeps sandbox unchanged', () => {
  for (const difficulty of ['relaxed', 'standard', 'severe'] as const) {
    const session = newSession('tiers', 'barbarian', BASE_CONTENT, false, difficulty);
    expect(session.state.rulesVersion).toBe(RULES_VERSION);
    expect(session.replay.format).toBe('emberwake-replay-v3');
    expect(session.state.difficulty).toBe(difficulty);
    expect(saveKey(session)).toBe(SAVE_KEY);
    expect(importSession(exportSession(session))).toEqual(session);
    const sandbox = newSession('tiers', 'barbarian', BASE_CONTENT, true, difficulty);
    expect(sandbox.state.difficulty).toBeUndefined();
    expect(sandbox.replay.format).toBe('emberwake-replay-v2');
    expect(saveKey(sandbox)).toBe(SANDBOX_SAVE_KEY);
    expect(importSession(exportSession(sandbox))).toEqual(sandbox);
  }
  const replay = newSession('tiers', 'barbarian').replay;
  for (const change of [
    { difficulty: 'unknown' },
    { difficulty: undefined },
    { format: 'emberwake-replay-v2' },
    { rulesVersion: 'emberwake-1' },
    { mode: 'campaign' },
  ])
    expect(() => importSession(JSON.stringify({ ...replay, ...change }))).toThrow();
  // An old envelope cannot acquire new semantics through an unknown extra field.
  const old = fixture.cases[0].replay;
  expect(
    importSession(JSON.stringify({ ...old, difficulty: 'severe' })).state.difficulty,
  ).toBeUndefined();
});

it('scales hostile hits after mitigation while preserving Standard arithmetic and respawns', () => {
  for (const [difficulty, expectedDamage] of [
    ['relaxed', 15],
    ['standard', 20],
    ['severe', 26],
  ] as const) {
    let state = applyCommand(createGame('damage', 'barbarian', BASE_CONTENT, false, difficulty), {
      type: 'travel',
      act: 0,
    }).state;
    state.player.x = 8.5;
    state.player.y = 23.5;
    const world = state.worlds[state.region];
    world.enemies = [];
    world.hazards = [
      { uid: 999, x: 8.5, y: 23.5, radius: 2, delay: 1, damage: 20, element: 'fire', life: 4 },
    ];
    const hp = state.player.hp;
    state = applyCommand(state, { type: 'advance', ticks: 2 }).state;
    expect(hp - state.player.hp).toBe(expectedDamage);
    state.player.hp = 1;
    state.worlds[state.region].hazards[0].delay = 1;
    state = applyCommand(state, { type: 'advance', ticks: 50 }).state;
    expect(state.status).toBe('dead');
    const respawn = applyCommand(state, { type: 'respawn' });
    expect(respawn.accepted).toBe(true);
    expect(respawn.state.status).toBe('playing');
    expect(respawn.state.difficulty).toBe(difficulty);
  }
});
