import historicalV4 from '../../../../tests/fixtures/emberwake-v4-continuity.json';
import baseline from '../../../../tests/fixtures/emberwake-v2-continuity.json';
import historicalV3 from '../../../../tests/fixtures/emberwake-v3-continuity.json';
import { expect, it } from 'vitest';
import { BASE_CONTENT } from '../domain/content';
import {
  applyCommand,
  createGame,
  LEGACY_RULES_VERSION,
  PREVIOUS_RULES_VERSION,
  RULES_VERSION,
} from '../domain/game';
import type { Command, Content, Difficulty, Replay, State } from '../domain/types';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  saveKey,
  SAVE_KEY,
  LEGACY_SAVE_KEY,
  PREVIOUS_SAVE_KEY,
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
    // Historical v3 Standard differs from v2 only in explicit setup/version metadata.
    const current = newSession(
      saved.replay.seed,
      saved.hero,
      BASE_CONTENT,
      false,
      'standard',
      PREVIOUS_RULES_VERSION,
    );
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
    expect(session.replay.format).toBe('emberwake-replay-v4');
    expect(session.state.difficulty).toBe(difficulty);
    expect(saveKey(session)).toBe(SAVE_KEY);
    expect(importSession(exportSession(session))).toEqual(session);
    const sandbox = newSession('tiers', 'barbarian', BASE_CONTENT, true, difficulty);
    expect(sandbox.state.difficulty).toBeUndefined();
    expect(sandbox.replay.format).toBe('emberwake-replay-v2');
    expect(saveKey(sandbox)).toBe(SANDBOX_SAVE_KEY);
    expect(importSession(exportSession(sandbox))).toEqual(sandbox);
  }
  // Imported and continued v3 games keep their original tier, envelope and save slot.
  for (const difficulty of ['relaxed', 'standard', 'severe'] as const) {
    const previous = newSession(
      'tiers',
      'barbarian',
      BASE_CONTENT,
      false,
      difficulty,
      PREVIOUS_RULES_VERSION,
    );
    expect(previous.replay.format).toBe('emberwake-replay-v3');
    expect(previous.state.difficulty).toBe(difficulty);
    expect(saveKey(previous)).toBe(PREVIOUS_SAVE_KEY);
    const continued = dispatch(importSession(exportSession(previous)), {
      type: 'run',
      enabled: false,
    });
    expect(continued.error).toBeNull();
    expect(importSession(exportSession(continued.session))).toEqual(continued.session);
    expect(continued.session.state.rulesVersion).toBe(PREVIOUS_RULES_VERSION);
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

it('preserves historical v3 hostile hit arithmetic and respawns', () => {
  for (const [difficulty, expectedDamage] of [
    ['relaxed', 15],
    ['standard', 20],
    ['severe', 26],
  ] as const) {
    let state = applyCommand(
      createGame('damage', 'barbarian', BASE_CONTENT, false, difficulty, PREVIOUS_RULES_VERSION),
      {
        type: 'travel',
        act: 0,
      },
    ).state;
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

// Expected hashes were captured from original frozen v3 native environments before
// any v4 change. This fixture deliberately imports v3 headers rather than new defaults.
it('reconstructs and continues historical v3 native combat, potion and town journals across every hero and tier', async () => {
  const v3 = historicalV3 as unknown as {
    content: Content;
    contentSha256: string;
    cases: {
      hero: string;
      difficulty: Difficulty;
      replayHeader: Omit<Replay, 'content' | 'commands'>;
      commands: Command[];
      witnesses: {
        nativeCommandCount: number;
        requestedAdvanceTicks: number;
        stateSha256: string;
        replaySha256: string;
        nextNativeCommand: Command;
        continuedStateSha256: string;
        continuedReplaySha256: string;
        continuedNativeCommandCount: number;
        continuedCommandsSha256: string;
      }[];
    }[];
  };
  expect(await digest(v3.content)).toBe(v3.contentSha256);
  expect(v3.cases.map((row) => `${row.hero}-${row.difficulty}`).sort()).toEqual(
    ['barbarian', 'sorceress', 'necromancer']
      .flatMap((hero) => ['relaxed', 'standard', 'severe'].map((tier) => `${hero}-${tier}`))
      .sort(),
  );
  let checkpoints = 0;
  for (const saved of v3.cases) {
    expect(saved.replayHeader.rulesVersion).toBe('emberwake-3');
    for (const witness of saved.witnesses) {
      const commands = saved.commands.slice(0, witness.nativeCommandCount);
      const restored = importSession(
        JSON.stringify({ ...saved.replayHeader, content: v3.content, commands }),
      );
      expect(restored.state.rulesVersion).toBe(saved.replayHeader.rulesVersion);
      expect(saveKey(restored)).toBe(PREVIOUS_SAVE_KEY);
      expect(restored.state.hero).toBe(saved.hero);
      expect(restored.state.difficulty).toBe(saved.difficulty);
      expect(await digest(restored.state)).toBe(witness.stateSha256);
      expect(await digest(restored.replay)).toBe(witness.replaySha256);
      expect(restored.replay.commands).toEqual(commands);
      expect(restored.replay.commands).toHaveLength(witness.nativeCommandCount);
      expect(
        restored.replay.commands.reduce(
          (ticks, command) => ticks + (command.type === 'advance' ? command.ticks : 0),
          0,
        ),
      ).toBe(witness.requestedAdvanceTicks);
      expect(saved.commands[witness.nativeCommandCount]).toEqual(witness.nextNativeCommand);
      const next = dispatch(restored, witness.nextNativeCommand);
      expect(next.error).toBeNull();
      expect(await digest(next.session.state)).toBe(witness.continuedStateSha256);
      expect(await digest(next.session.replay)).toBe(witness.continuedReplaySha256);
      expect(next.session.replay.commands).toHaveLength(witness.continuedNativeCommandCount);
      expect(await digest(next.session.replay.commands)).toBe(witness.continuedCommandsSha256);
      expect(importSession(exportSession(next.session))).toEqual(next.session);
      checkpoints++;
    }
  }
  expect(checkpoints).toBe(15);
}, 30000);

// Original native4 bytes were captured before native5 development. Every witness
// owns its legal branch prefix: case-level command slicing would replay another branch.
it('reconstructs and continues all 24 original native4 checkpoints across every hero and tier', async () => {
  const v4 = historicalV4 as unknown as {
    content: Content;
    contentSha256: string;
    originalV4: { bundle: string; bundleDigest: string; sourceDigests: Record<string, string> };
    cases: {
      hero: string;
      difficulty: Difficulty;
      replayHeader: Omit<Replay, 'content' | 'commands'>;
      witnesses: {
        prefixNativeCommands: Command[];
        nativeCommandCount: number;
        requestedAdvanceTicks: number;
        stateSha256: string;
        replaySha256: string;
        nextNativeCommand: Command;
        continuedStateSha256: string;
        continuedReplaySha256: string;
        continuedNativeCommandCount: number;
        continuedCommandsSha256: string;
        rejectionProbes: { command: Command; error: string }[];
      }[];
    }[];
  };
  expect(v4.originalV4.bundle).toBe(
    'test-results/emberwake-strength/v4-continuity-before-v5/original-native-v4.mjs',
  );
  expect(v4.originalV4.bundleDigest).toBe(
    '36a3d76acbbed810b3e6e6c14623e515f501b27ef5c543ba90f78a13f8ea6c2b',
  );
  expect(v4.originalV4.sourceDigests['packages/diablo2/src/domain/difficulty.ts']).toBe(
    '41e1342e97ce00da642172a613c81b6b4787d504f9fd203b65da8b0839bc3668',
  );
  expect(await digest(v4.content)).toBe(v4.contentSha256);
  expect(v4.cases.map((row) => `${row.hero}-${row.difficulty}`).sort()).toEqual(
    ['barbarian', 'sorceress', 'necromancer']
      .flatMap((hero) => ['relaxed', 'standard', 'severe'].map((tier) => `${hero}-${tier}`))
      .sort(),
  );
  let checkpoints = 0;
  for (const saved of v4.cases) {
    expect(saved.replayHeader.rulesVersion).toBe('emberwake-4');
    expect(saved.replayHeader.format).toBe('emberwake-replay-v4');
    for (const witness of saved.witnesses) {
      const restored = importSession(
        JSON.stringify({
          ...saved.replayHeader,
          content: v4.content,
          commands: witness.prefixNativeCommands,
        }),
      );
      expect(saveKey(restored)).toBe('card-workshop.emberwake.v4');
      expect(restored.state.hero).toBe(saved.hero);
      expect(restored.state.difficulty).toBe(saved.difficulty);
      expect(await digest(restored.state)).toBe(witness.stateSha256);
      expect(await digest(restored.replay)).toBe(witness.replaySha256);
      expect(restored.replay.commands).toEqual(witness.prefixNativeCommands);
      expect(restored.replay.commands).toHaveLength(witness.nativeCommandCount);
      expect(
        restored.replay.commands.reduce(
          (ticks, command) => ticks + (command.type === 'advance' ? command.ticks : 0),
          0,
        ),
      ).toBe(witness.requestedAdvanceTicks);
      for (const probe of witness.rejectionProbes) {
        const rejected = dispatch(restored, probe.command);
        expect(rejected.error).toBe(probe.error);
        expect(rejected.session).toBe(restored);
        expect(await digest(restored.state)).toBe(witness.stateSha256);
        expect(await digest(restored.replay)).toBe(witness.replaySha256);
      }
      const next = dispatch(restored, witness.nextNativeCommand);
      expect(next.error).toBeNull();
      expect(await digest(next.session.state)).toBe(witness.continuedStateSha256);
      expect(await digest(next.session.replay)).toBe(witness.continuedReplaySha256);
      expect(next.session.replay.commands).toHaveLength(witness.continuedNativeCommandCount);
      expect(await digest(next.session.replay.commands)).toBe(witness.continuedCommandsSha256);
      expect(importSession(exportSession(next.session))).toEqual(next.session);
      checkpoints++;
    }
  }
  expect(checkpoints).toBe(24);
}, 30000);
