import { test, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { browserBudget } from './budget';

const review = 'test-results/night-passage-enemies/browser';
const kinds = ['hunter', 'archer', 'brute', 'witch'] as const;

test('four enemy deliveries visibly play their native clips at unretimed 1×', async ({ page }) => {
  test.setTimeout(browserBudget(60000));
  await mkdir(review, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=night-passage');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-enemies-review.ts';
    const { reviewEnemies } = (await import(
      path
    )) as typeof import('./night-passage-enemies-review');
    return reviewEnemies();
  });
  expect(result.timings).toHaveLength(16);
  expect(result.decoded).toMatchObject({ width: 480, height: 440, moving: true });
  expect(result.decoded.frames).toBeGreaterThan(1);
  for (const kind of kinds) {
    expect(
      result.timings.filter((entry) => entry.kind === kind).map((entry) => entry.clip),
    ).toEqual(['idle', 'run', 'attack', 'stagger']);
  }
  for (const entry of result.timings) {
    expect(entry.frames).toBeGreaterThan(5);
    expect(Math.abs(entry.wallSeconds - entry.seconds)).toBeLessThan(0.5);
    const phases = result.snapshots.filter(
      (frame) => frame.kind === entry.kind && frame.clip === entry.clip,
    );
    expect(phases.map((frame) => frame.phase)).toEqual([0, 0.45, 0.9]);
    expect(new Set(phases.map((frame) => frame.png)).size).toBeGreaterThan(1);
  }
  for (const frame of result.snapshots)
    await writeFile(
      `${review}/${frame.kind}-${frame.clip}-${frame.phase}.png`,
      Buffer.from(frame.png.split(',')[1], 'base64'),
    );
  await writeFile(`${review}/enemies-native-1x.webm`, Buffer.from(result.video, 'base64'));
  await writeFile(`${review}/playback.json`, JSON.stringify(result.timings, null, 2));
  expect(errors).toEqual([]);
});

test('production actors replace all four fallbacks and preserve paused and reduced-motion snapshots', async ({
  page,
}) => {
  test.setTimeout(browserBudget(30000));
  await mkdir(review, { recursive: true });
  await page.goto('/?game=night-passage');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-enemies-review.ts';
    const { inspectEnemies, reviewEnemyEncounter } = (await import(
      path
    )) as typeof import('./night-passage-enemies-review');
    return { actors: await inspectEnemies(), encounter: await reviewEnemyEncounter() };
  });
  expect(result.actors.map((entry) => entry.kind)).toEqual(kinds);
  for (const entry of result.actors) {
    expect(entry.visible && entry.fallbackHidden && entry.finiteBounds).toBe(true);
    expect(entry.pausedStable && entry.reducedStable && entry.rulesUnchanged).toBe(true);
    expect(entry.standingHeight).toBeGreaterThan(25);
    expect(entry.standingHeight).toBeLessThan(150);
  }
  expect(result.actors.find((entry) => entry.kind === 'archer')!.archerArrow).toEqual({
    windup: true,
    release: false,
    rest: true,
    rulesUnchanged: true,
  });
  expect(result.encounter.unavailable).toBe(false);
  expect(result.encounter.rulesUnchanged).toBe(true);
  await writeFile(
    `${review}/controlled-four-family-arena.png`,
    Buffer.from(result.encounter.png.split(',')[1], 'base64'),
  );
  await writeFile(
    `${review}/controlled-four-family-arena-narrow.png`,
    Buffer.from(result.encounter.pngNarrow.split(',')[1], 'base64'),
  );
  await writeFile(`${review}/actors.json`, JSON.stringify(result.actors, null, 2));
  // Match the same scene with failed enemy deliveries; hero and arena still use production assets.
  await page.route('**/enemy-*.glb*', (route) =>
    route.fulfill({ status: 404, body: 'Unavailable' }),
  );
  try {
    const fallback = await page.evaluate(async () => {
      const path = '/tests/browser/night-passage-enemies-review.ts';
      const { reviewEnemyEncounter } = (await import(
        path
      )) as typeof import('./night-passage-enemies-review');
      return reviewEnemyEncounter(true);
    });
    expect(fallback.unavailable).toBe(false);
    expect(fallback.rulesUnchanged).toBe(true);
    await writeFile(
      `${review}/fallback-desktop.png`,
      Buffer.from(fallback.png.split(',')[1], 'base64'),
    );
    await writeFile(
      `${review}/fallback-narrow.png`,
      Buffer.from(fallback.pngNarrow.split(',')[1], 'base64'),
    );
  } finally {
    await page.unroute('**/enemy-*.glb*');
  }
});

test(
  'enemy saved edits and original surfaces agree with browser deformation',
  { tag: '@requires-blender' },
  async ({ page }, info) => {
    test.setTimeout(browserBudget(60000));
    const directory = process.env.NIGHT_PASSAGE_ENEMY_RESULTS;
    test.skip(
      !directory,
      'Generate fresh per-family enemy native verification before this journey.',
    );
    for (const kind of kinds) {
      const receipt = JSON.parse(
        await readFile(resolve(directory!, kind, 'verification.json'), 'utf8'),
      ) as {
        meshAndWeightsUnchanged: boolean;
        authoritativeSourceAndDeliveryUnchanged: boolean;
        editedClip: string;
        headChangeRadians: number;
      };
      expect(
        receipt.meshAndWeightsUnchanged && receipt.authoritativeSourceAndDeliveryUnchanged,
      ).toBe(true);
      expect(receipt.editedClip).toBe('attack');
      expect(receipt.headChangeRadians).toBeCloseTo(0.3, 5);
    }
    await page.goto('/?game=night-passage');
    const results = await page.evaluate(
      async ({ directory, kinds }) => {
        const path = '/tests/browser/canid-evidence.ts';
        const { compareCanid } = (await import(path)) as typeof import('./canid-evidence');
        const results = [];
        for (const kind of kinds) {
          const reference = (await (
            await fetch(`/@fs${directory}/${kind}/reference.json`)
          ).json()) as Parameters<typeof compareCanid>[1];
          const edited = (await (
            await fetch(`/@fs${directory}/${kind}/edited.json`)
          ).json()) as Parameters<typeof compareCanid>[1];
          const model = `/@fs${directory}/${kind}/models/enemy-${kind}.glb`;
          results.push({
            kind,
            original: await compareCanid(
              `/packages/dcc-workbench/assets/night-passage/enemy-${kind}.glb`,
              reference,
            ),
            edited: await compareCanid(model, edited),
            changed: await compareCanid(model, reference),
          });
        }
        return results;
      },
      { directory: resolve(directory!), kinds },
    );
    for (const result of results) {
      for (const clip of [...result.original, ...result.edited])
        expect(clip.maxError).toBeLessThan(0.0001);
      expect(result.changed.find((clip) => clip.name === 'attack')!.maxError).toBeGreaterThan(0.01);
    }
    await mkdir(review, { recursive: true });
    await writeFile(info.outputPath('native-agreement.json'), JSON.stringify(results, null, 2));
    await writeFile(`${review}/native-agreement.json`, JSON.stringify(results, null, 2));
  },
);
