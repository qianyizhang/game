import historicalV6 from '../../../../tests/fixtures/emberwake-v6-continuity.json';
import historicalV5 from '../../../../tests/fixtures/emberwake-v5-continuity.json';
import historicalV4 from '../../../../tests/fixtures/emberwake-v4-continuity.json';
import baseline from '../../../../tests/fixtures/emberwake-v2-continuity.json';
import historicalV3 from '../../../../tests/fixtures/emberwake-v3-continuity.json';
import { expect, it } from 'vitest';
import { BASE_CONTENT } from '../domain/content';
import {
  applyCommand,
  createGame,
  RULES_V2,
  RULES_V3,
  RULES_V4,
  RULES_V6,
  RULES_V5,
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
  SAVE_V2_KEY,
  SAVE_V3_KEY,
  SAVE_V4_KEY,
  SAVE_V6_KEY,
  SAVE_V5_KEY,
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
  result.rulesVersion = RULES_V2;
  return result;
};

it('reconstructs and continues complete pre-change v2 states without reinterpreting their damage', async () => {
  for (const saved of fixture.cases) {
    const restored = importSession(JSON.stringify(saved.replay));
    expect(await digest(restored.state)).toBe(saved.stateDigest);
    expect(restored.replay).toEqual(saved.replay);
    expect(saveKey(restored)).toBe(SAVE_V2_KEY);
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
      RULES_V3,
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
    expect(session.replay.format).toBe('emberwake-replay-v7');
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
    const previous = newSession('tiers', 'barbarian', BASE_CONTENT, false, difficulty, RULES_V3);
    expect(previous.replay.format).toBe('emberwake-replay-v3');
    expect(previous.state.difficulty).toBe(difficulty);
    expect(saveKey(previous)).toBe(SAVE_V3_KEY);
    const continued = dispatch(importSession(exportSession(previous)), {
      type: 'run',
      enabled: false,
    });
    expect(continued.error).toBeNull();
    expect(importSession(exportSession(continued.session))).toEqual(continued.session);
    expect(continued.session.state.rulesVersion).toBe(RULES_V3);
  }
  for (const [version, key, format] of [
    [RULES_V6, SAVE_V6_KEY, 'emberwake-replay-v6'],
    [RULES_V5, SAVE_V5_KEY, 'emberwake-replay-v5'],
    [RULES_V4, SAVE_V4_KEY, 'emberwake-replay-v4'],
  ] as const) {
    const previous = newSession('tiers', 'barbarian', BASE_CONTENT, false, 'standard', version);
    expect(previous.replay.format).toBe(format);
    expect(saveKey(previous)).toBe(key);
    expect(importSession(exportSession(previous))).toEqual(previous);
    expect(() =>
      importSession(JSON.stringify({ ...previous.replay, format: 'emberwake-replay-v7' })),
    ).toThrow('Unsupported save');
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
      createGame('damage', 'barbarian', BASE_CONTENT, false, difficulty, RULES_V3),
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
      expect(saveKey(restored)).toBe(SAVE_V3_KEY);
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

// Original native5 bytes were frozen before native6 development. Every witness
// owns its legal branch prefix: case-level command slicing would replay another branch.
it('reconstructs and continues all 25 original native5 checkpoints across every hero and tier', async () => {
  const v5 = historicalV5 as unknown as {
    content: Content;
    contentSha256: string;
    originalV5: { bundle: string; bundleDigest: string; sourceDigests: Record<string, string> };
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
  expect(v5.originalV5.bundle).toBe(
    '.work/sessions/emberwake-native5-before6-2026-10-17/attempt2/original-native-v5.mjs',
  );
  expect(v5.originalV5.bundleDigest).toBe(
    '7bcbfdbd190b74cc91cd5a0bb1fd940f23f8bf83cf7c4c0f96c5f13a5204fbfa',
  );
  expect(v5.originalV5.sourceDigests['packages/diablo2/src/domain/difficulty.ts']).toBe(
    'da8b0f1fe8ec905d0ee1c44defbac14bd49067e30fc12c77510da7120ca8fb5b',
  );
  expect(await digest(v5.content)).toBe(v5.contentSha256);
  expect(v5.cases.map((row) => `${row.hero}-${row.difficulty}`).sort()).toEqual(
    ['barbarian', 'sorceress', 'necromancer']
      .flatMap((hero) => ['relaxed', 'standard', 'severe'].map((tier) => `${hero}-${tier}`))
      .sort(),
  );
  let checkpoints = 0;
  for (const saved of v5.cases) {
    expect(saved.replayHeader.rulesVersion).toBe('emberwake-5');
    expect(saved.replayHeader.format).toBe('emberwake-replay-v5');
    for (const witness of saved.witnesses) {
      const restored = importSession(
        JSON.stringify({
          ...saved.replayHeader,
          content: v5.content,
          commands: witness.prefixNativeCommands,
        }),
      );
      expect(saveKey(restored)).toBe(SAVE_V5_KEY);
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
  expect(checkpoints).toBe(25);
}, 30000);

// Original6 full journals and branch checkpoints were frozen before any native7
// implementation. Hash expectations are consumed verbatim, never regenerated here.
const v6 = historicalV6 as unknown as {
  schema: string;
  content: Content;
  contentSha256: string;
  originalV6: { freezeSha256: string; bundleDigest: string; sourceDigests: Record<string, string> };
  missingWitnesses: unknown[];
  cases: {
    hero: string;
    difficulty: Difficulty;
    replayHeader: Omit<Replay, 'content' | 'commands'>;
    finalNativeCommands: Command[];
    source: {
      nativeCommands: number;
      finalStateSha256: string;
      finalReplaySha256: string;
      finalCommandsSha256: string;
    };
    finalMetrics: {
      outcome: string;
      won: number;
      score: number[];
      progress: number;
      bosses: number;
      wards: number;
      regions: number;
      level: number;
      xp: number;
      hp: number;
      gold: number;
      executedTicks: number;
    };
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
it('reconstructs all nine original native6 full finals with exact journals and performance components', async () => {
  expect(v6.schema).toBe('emberwake-v6-native-continuity-1');
  expect(v6.originalV6.freezeSha256).toBe(
    'bd8445001d6c7f9750ac002ebda0f1bec3e311f58e0ff2e3da043787e9ea3a02',
  );
  expect(v6.originalV6.bundleDigest).toBe(
    '52fe17da973e063928b3a686ae5ba5a5f53dc7b6b92bae2daad5d1ad2ac0615a',
  );
  expect(v6.originalV6.sourceDigests['packages/diablo2/src/domain/difficulty.ts']).toBe(
    '3ea41804d95a05fb1c173525cbbb804c9cec6e9ad26eca2f11362ddb3e350301',
  );
  expect(v6.missingWitnesses).toEqual([]);
  expect(await digest(v6.content)).toBe(v6.contentSha256);
  expect(v6.cases.map((row) => `${row.hero}-${row.difficulty}`).sort()).toEqual(
    ['barbarian', 'sorceress', 'necromancer']
      .flatMap((hero) => ['relaxed', 'standard', 'severe'].map((tier) => `${hero}-${tier}`))
      .sort(),
  );
  let commands = 0;
  for (const saved of v6.cases) {
    expect(saved.replayHeader.rulesVersion).toBe('emberwake-6');
    expect(saved.replayHeader.format).toBe('emberwake-replay-v6');
    const final = importSession(
      JSON.stringify({
        ...saved.replayHeader,
        content: v6.content,
        commands: saved.finalNativeCommands,
      }),
    );
    expect(saveKey(final)).toBe(SAVE_V6_KEY);
    expect(final.state.rulesVersion).toBe(RULES_V6);
    expect(final.replay.commands).toEqual(saved.finalNativeCommands);
    expect(final.replay.commands).toHaveLength(saved.source.nativeCommands);
    expect(await digest(final.state)).toBe(saved.source.finalStateSha256);
    expect(await digest(final.replay)).toBe(saved.source.finalReplaySha256);
    expect(await digest(final.replay.commands)).toBe(saved.source.finalCommandsSha256);
    const state = final.state,
      worlds = Object.values(state.worlds);
    const bosses = worlds.filter((w) => w.bossDefeated).length;
    const wards = worlds.filter((w) => w.ward).length;
    const regions = worlds.filter((w) => w.visited).length;
    expect({
      outcome: state.status,
      won: Number(state.status === 'victory'),
      score: [
        Number(state.status === 'victory'),
        bosses,
        wards,
        regions,
        state.status === 'victory' ? state.tick : 0,
      ],
      progress: bosses * 10000 + wards * 100 + regions,
      bosses,
      wards,
      regions,
      level: state.player.level,
      xp: state.player.xp,
      hp: state.player.hp,
      gold: state.player.gold,
      executedTicks: state.tick,
    }).toEqual(saved.finalMetrics);
    expect(importSession(exportSession(final))).toEqual(final);
    commands += final.replay.commands.length;
  }
  expect(commands).toBe(51300);
}, 60000);
it('continues all25 original native6 checkpoints and rejects their unavailable actions atomically', async () => {
  let checkpoints = 0,
    rejections = 0;
  for (const saved of v6.cases) {
    for (const witness of saved.witnesses) {
      const restored = importSession(
        JSON.stringify({
          ...saved.replayHeader,
          content: v6.content,
          commands: witness.prefixNativeCommands,
        }),
      );
      expect(restored.state.rulesVersion).toBe(RULES_V6);
      expect(restored.replay.format).toBe('emberwake-replay-v6');
      expect(saveKey(restored)).toBe(SAVE_V6_KEY);
      expect(restored.state.hero).toBe(saved.hero);
      expect(restored.state.difficulty).toBe(saved.difficulty);
      expect(await digest(restored.state)).toBe(witness.stateSha256);
      expect(await digest(restored.replay)).toBe(witness.replaySha256);
      expect(restored.replay.commands).toEqual(witness.prefixNativeCommands);
      expect(restored.replay.commands).toHaveLength(witness.nativeCommandCount);
      expect(
        restored.replay.commands.reduce((n, c) => n + (c.type === 'advance' ? c.ticks : 0), 0),
      ).toBe(witness.requestedAdvanceTicks);
      for (const probe of witness.rejectionProbes) {
        const rejected = dispatch(restored, probe.command);
        expect(rejected.error).toBe(probe.error);
        expect(rejected.session).toBe(restored);
        expect(await digest(restored.state)).toBe(witness.stateSha256);
        expect(await digest(restored.replay)).toBe(witness.replaySha256);
        rejections++;
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
  expect(checkpoints).toBe(25);
  expect(rejections).toBe(15);
}, 30000);
