import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import {
  applyCommand,
  LEGACY_RULES_VERSION,
  RULES_VERSION,
  PREVIOUS_RULES_VERSION,
  type Command,
  type State,
} from '../domain/game';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  saveKey,
  SAVE_KEY,
  LEGACY_SAVE_KEY,
  PREVIOUS_SAVE_KEY,
  type Replay,
} from './session';

const fixture = JSON.parse(
  readFileSync('tests/fixtures/cartographer-v1-continuity.json', 'utf8'),
) as {
  cases: {
    replay: Replay;
    stateDigest: string;
    continuation: Command;
    continuedStateDigest: string;
    continuedCommands: Command[];
  }[];
};
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function legacyShape(state: State): State {
  const next = structuredClone(state);
  delete next.rulesVersion;
  delete next.difficulty;
  return next;
}

it('reconstructs and continues complete pre-change v1 expeditions with exact Standard behavior', () => {
  for (const saved of fixture.cases) {
    const restored = importSession(JSON.stringify(saved.replay));
    expect(digest(restored.state)).toBe(saved.stateDigest);
    expect(restored.replay).toEqual(saved.replay);
    expect(saveKey(restored)).toBe(LEGACY_SAVE_KEY);
    expect(restored.state.difficulty).toBeUndefined();
    const continued = dispatch(restored, saved.continuation);
    expect(continued.error).toBeNull();
    expect(digest(continued.session.state)).toBe(saved.continuedStateDigest);
    expect(continued.session.replay.commands).toEqual(saved.continuedCommands);
    expect(importSession(exportSession(continued.session))).toEqual(continued.session);
    let current = newSession(saved.replay.seed, 'standard', PREVIOUS_RULES_VERSION);
    for (const command of saved.replay.commands) {
      const next = dispatch(current, command);
      expect(next.error).toBeNull();
      current = next.session;
    }
    expect(digest(legacyShape(current.state))).toBe(saved.stateDigest);
  }
});

it('persists fixed starting and maximum life without changing the seeded opening', () => {
  const standard = newSession('same-opening');
  for (const [difficulty, hp] of [
    ['relaxed', 48],
    ['standard', 36],
    ['severe', 28],
  ] as const) {
    const session = newSession('same-opening', difficulty);
    expect(session.state.rulesVersion).toBe(RULES_VERSION);
    expect(session.state.difficulty).toBe(difficulty);
    expect(session.state.player.hp).toBe(hp);
    expect(session.state.player.maxHp).toBe(hp);
    expect(session.state.layout).toEqual(standard.state.layout);
    expect(saveKey(session)).toBe(SAVE_KEY);
    const started = dispatch(session, { type: 'move', direction: 'north' }).session;
    expect(importSession(exportSession(started))).toEqual(started);
    expect(started.state.difficulty).toBe(difficulty);
  }
  const previous = newSession('same-opening', 'severe', LEGACY_RULES_VERSION);
  expect(previous.state.player.hp).toBe(36);
  expect(previous.state.difficulty).toBeUndefined();
  expect(previous.replay.format).toBe('cartographer-replay-v1');
});

it('rejects ambiguous version envelopes and preserves old extra fields as semantically inert', () => {
  const current = newSession('rejection');
  for (const patch of [
    { difficulty: undefined },
    { difficulty: 'future' },
    { format: 'cartographer-replay-v1' },
    { rules: 'cartographer-future' },
  ])
    expect(() => importSession(JSON.stringify({ ...current.replay, ...patch }))).toThrow();
  const previous = fixture.cases[0];
  const restored = importSession(JSON.stringify({ ...previous.replay, difficulty: 'severe' }));
  expect(digest(restored.state)).toBe(previous.stateDigest);
  const malformed = { ...current.state, difficulty: undefined };
  const rejected = applyCommand(malformed, { type: 'brace' });
  expect(rejected.state).toBe(malformed);
  expect(rejected.error).toContain('difficulty');
});

it('reconstructs and continues every historical v2 tier without rebalancing the saved run', () => {
  const historical = JSON.parse(
    readFileSync('tests/fixtures/cartographer-v2-continuity.json', 'utf8'),
  ) as {
    cases: {
      replay: Replay;
      stateDigest: string;
      prefixReplay: Replay;
      prefixDigest: string;
      continuation: Command;
      continuedStateDigest: string;
    }[];
  };
  for (const saved of historical.cases) {
    const restored = importSession(JSON.stringify(saved.replay));
    expect(digest(restored.state)).toBe(saved.stateDigest);
    expect(restored.replay).toEqual(saved.replay);
    expect(saveKey(restored)).toBe(PREVIOUS_SAVE_KEY);
    const prefix = importSession(JSON.stringify(saved.prefixReplay));
    expect(digest(prefix.state)).toBe(saved.prefixDigest);
    const next = dispatch(prefix, saved.continuation);
    expect(next.error).toBeNull();
    expect(digest(next.session.state)).toBe(saved.continuedStateDigest);
    expect(importSession(exportSession(next.session))).toEqual(next.session);
  }
});
