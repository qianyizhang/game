import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { browserBudget } from './budget';

const review = 'test-results/night-passage-bellwarden/browser';
const clips = ['idle', 'run', 'sweep', 'rain', 'wheel', 'stagger'];
const model = 'packages/dcc-workbench/assets/night-passage/guardian-bellwarden.glb';
const source = 'packages/dcc-workbench/subjects/night-passage/guardians/bellwarden/source.blend';

test('Bellwarden visibly plays all six delivered clips at unretimed 1×', async ({ page }) => {
  test.setTimeout(browserBudget(45000));
  await mkdir(review, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=night-passage');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-guardian-review.ts';
    const { reviewGuardianClips } = (await import(
      path
    )) as typeof import('./night-passage-guardian-review');
    return reviewGuardianClips();
  });
  expect(result.timings.map((entry) => entry.clip)).toEqual(clips);
  expect(result.decoded).toMatchObject({ width: 480, height: 440, moving: true });
  expect(result.decoded.frames).toBeGreaterThan(1);
  for (const entry of result.timings) {
    expect(entry.frames).toBeGreaterThan(5);
    expect(Math.abs(entry.wallSeconds - entry.seconds)).toBeLessThan(0.5);
    const frames = result.snapshots.filter((frame) => frame.clip === entry.clip);
    expect(frames.map((frame) => frame.phase)).toEqual([0, 0.2, 0.4, 0.45, 0.7, 0.95]);
    expect(new Set(frames.map((frame) => frame.png)).size).toBeGreaterThan(1);
  }
  for (const frame of result.snapshots)
    await writeFile(
      `${review}/${frame.clip}-${frame.phase}.png`,
      Buffer.from(frame.png.split(',')[1], 'base64'),
    );
  await writeFile(`${review}/bellwarden-native-1x.webm`, Buffer.from(result.video, 'base64'));
  await writeFile(`${review}/playback.json`, JSON.stringify(result.timings, null, 2));
  expect(errors).toEqual([]);
});

test('production Bellwardens isolate poses and remain readable at desktop and 390px widths', async ({
  page,
}) => {
  test.setTimeout(browserBudget(45000));
  await mkdir(review, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=night-passage');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-guardian-review.ts';
    const { inspectGuardianActors, reviewGuardianEncounter } = (await import(
      path
    )) as typeof import('./night-passage-guardian-review');
    return { actors: await inspectGuardianActors(), encounter: await reviewGuardianEncounter() };
  });
  expect(result.actors).toMatchObject({
    visible: true,
    fallbackHidden: true,
    finiteBounds: true,
    pausedStable: true,
    reducedStable: true,
    independentPoses: true,
    privateSkeletons: true,
    privateMaterials: true,
    sharedGeometry: true,
    rulesUnchanged: true,
  });
  expect(result.actors.height).toBeGreaterThan(60);
  expect(result.actors.height).toBeLessThan(250);
  expect(result.actors.attacks.map((attack) => attack.kind)).toEqual(['sweep', 'rain', 'wheel']);
  for (const attack of result.actors.attacks)
    expect(attack).toMatchObject({ moving: true, pausedStable: true });
  expect(result.actors.otherRegions).toEqual(
    [1, 2, 3].map((region) => ({ region, authoredHidden: true, fallbackVisible: true })),
  );
  expect(result.encounter).toMatchObject({
    unavailable: false,
    pausedStable: true,
    ready: true,
    rulesUnchanged: true,
  });
  expect(result.encounter.colors).toBeGreaterThan(20);
  await writeFile(
    `${review}/production-bellwarden-desktop.png`,
    Buffer.from(result.encounter.png.split(',')[1], 'base64'),
  );
  await writeFile(
    `${review}/production-bellwarden-narrow.png`,
    Buffer.from(result.encounter.pngNarrow.split(',')[1], 'base64'),
  );
  await writeFile(`${review}/actors.json`, JSON.stringify(result.actors, null, 2));
  await page.route('**/guardian-bellwarden.glb*', (route) =>
    route.fulfill({ status: 404, body: 'Unavailable' }),
  );
  try {
    const fallback = await page.evaluate(async () => {
      const path = '/tests/browser/night-passage-guardian-review.ts';
      const { reviewGuardianEncounter } = (await import(
        path
      )) as typeof import('./night-passage-guardian-review');
      return reviewGuardianEncounter(true);
    });
    expect(fallback).toMatchObject({
      unavailable: false,
      ready: true,
      pausedStable: true,
      rulesUnchanged: true,
    });
    expect(fallback.colors).toBeGreaterThan(20);
    expect(fallback.png).not.toBe(result.encounter.png);
    await writeFile(
      `${review}/fallback-desktop.png`,
      Buffer.from(fallback.png.split(',')[1], 'base64'),
    );
    await writeFile(
      `${review}/fallback-narrow.png`,
      Buffer.from(fallback.pngNarrow.split(',')[1], 'base64'),
    );
  } finally {
    await page.unroute('**/guardian-bellwarden.glb*');
  }
  expect(errors).toEqual([]);
});

test(
  'Bellwarden saved edits and every named native surface agree with browser deformation',
  { tag: '@requires-blender' },
  async ({ page }, info) => {
    test.setTimeout(browserBudget(60000));
    const directory = process.env.NIGHT_PASSAGE_GUARDIAN_RESULTS;
    test.skip(
      !directory,
      'Generate fresh Bellwarden native saved-edit verification before this journey.',
    );
    const receipt = JSON.parse(
      await readFile(resolve(directory!, 'verification.json'), 'utf8'),
    ) as {
      meshAndWeightsUnchanged: boolean;
      authoritativeSourceAndDeliveryUnchanged: boolean;
      editedClip: string;
      editedFrame: number;
      headChangeRadians: number;
      sourceSha256: string;
      modelSha256: string;
    };
    expect(receipt).toMatchObject({
      meshAndWeightsUnchanged: true,
      authoritativeSourceAndDeliveryUnchanged: true,
      editedClip: 'sweep',
      editedFrame: 10,
    });
    expect(receipt.headChangeRadians).toBeCloseTo(0.3, 5);
    expect(receipt.sourceSha256).toBe(
      createHash('sha256')
        .update(await readFile(source))
        .digest('hex'),
    );
    expect(receipt.modelSha256).toBe(
      createHash('sha256')
        .update(await readFile(model))
        .digest('hex'),
    );
    await page.goto('/?game=night-passage');
    const results = await page.evaluate(async (directory) => {
      const path = '/tests/browser/night-passage-guardian-review.ts';
      const { compareGuardianNative } = (await import(
        path
      )) as typeof import('./night-passage-guardian-review');
      return compareGuardianNative(directory);
    }, resolve(directory!));
    expect(results.allMeshesCovered).toBe(true);
    for (const family of [results.original, results.edited]) {
      expect(family.map((clip) => clip.name).sort()).toEqual([...clips].sort());
      for (const clip of family) {
        expect(clip.vertices).toBeGreaterThan(0);
        expect(clip.samples).toBeGreaterThan(1);
        expect(clip.maxError).toBeLessThan(0.0001);
      }
    }
    expect(results.changed.find((clip) => clip.name === 'sweep')!.maxError).toBeGreaterThan(0.01);
    await mkdir(review, { recursive: true });
    await writeFile(info.outputPath('native-agreement.json'), JSON.stringify(results, null, 2));
    await writeFile(`${review}/native-agreement.json`, JSON.stringify(results, null, 2));
  },
);
