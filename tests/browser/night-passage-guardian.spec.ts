import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { browserBudget } from './budget';

const cases = [
  {
    kind: 'bellwarden',
    name: 'Bellwarden',
    clips: ['idle', 'run', 'sweep', 'rain', 'wheel', 'stagger'],
    env: 'NIGHT_PASSAGE_GUARDIAN_RESULTS',
    region: 0,
    frames: 237,
  },
  {
    kind: 'undertow',
    name: 'Undertow',
    clips: ['idle', 'run', 'charge', 'volley', 'pulse', 'stagger'],
    env: 'NIGHT_PASSAGE_UNDERTOW_RESULTS',
    region: 1,
    frames: 237,
  },
  {
    kind: 'ashregent',
    name: 'Ash Regent',
    clips: ['idle', 'run', 'cross', 'rain', 'volley', 'stagger'],
    env: 'NIGHT_PASSAGE_ASHREGENT_RESULTS',
    region: 2,
    frames: 237,
  },
  {
    kind: 'sovereign',
    name: 'Unlit Sovereign',
    clips: ['idle', 'run', 'cross', 'rain', 'pulse', 'wheel', 'stagger'],
    env: 'NIGHT_PASSAGE_SOVEREIGN_RESULTS',
    region: 3,
    frames: 280,
  },
] as const;

for (const { kind, name, clips, env, region, frames: authoredFrames } of cases) {
  const review = `test-results/night-passage-${kind}/browser`;
  const model = `packages/dcc-workbench/assets/night-passage/guardian-${kind}.glb`;
  const source = `packages/dcc-workbench/subjects/night-passage/guardians/${kind}/source.blend`;

  test(`${name} visibly plays all ${clips.length} delivered clips at unretimed 1×`, async ({
    page,
  }) => {
    test.setTimeout(browserBudget(45000));
    await mkdir(review, { recursive: true });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/?game=night-passage');
    const result = await page.evaluate(async (kind) => {
      const path = '/tests/browser/night-passage-guardian-review.ts';
      const { reviewGuardianClips } = (await import(
        path
      )) as typeof import('./night-passage-guardian-review');
      return reviewGuardianClips(kind);
    }, kind);
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
    await writeFile(`${review}/${kind}-native-1x.webm`, Buffer.from(result.video, 'base64'));
    await writeFile(`${review}/playback.json`, JSON.stringify(result.timings, null, 2));
    expect(errors).toEqual([]);
  });

  test(`production ${name}s isolate poses and remain readable at desktop and 390px widths`, async ({
    page,
  }) => {
    test.setTimeout(browserBudget(45000));
    await mkdir(review, { recursive: true });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/?game=night-passage');
    const result = await page.evaluate(async (kind) => {
      const path = '/tests/browser/night-passage-guardian-review.ts';
      const { inspectGuardianActors, reviewGuardianEncounter } = (await import(
        path
      )) as typeof import('./night-passage-guardian-review');
      return {
        actors: await inspectGuardianActors(kind),
        encounter: await reviewGuardianEncounter(false, kind),
      };
    }, kind);
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
      initialFallback: true,
      rulesUnchanged: true,
    });
    expect(result.actors.height).toBeGreaterThan(60);
    expect(result.actors.height).toBeLessThan(250);
    expect(result.actors.attacks.map((attack) => attack.kind)).toEqual(clips.slice(2, -1));
    for (const attack of result.actors.attacks)
      expect(attack).toMatchObject({ moving: true, pausedStable: true });
    expect(result.actors.crossRegions).toEqual(
      cases
        .filter((entry) => entry.region !== region)
        .map((entry) => ({
          region: entry.region,
          authoredVisible: true,
          previousHidden: true,
          fallbackHidden: true,
        })),
    );
    expect(result.encounter).toMatchObject({
      unavailable: false,
      pausedStable: true,
      ready: true,
      rulesUnchanged: true,
    });
    expect(result.encounter.colors).toBeGreaterThan(20);
    await writeFile(
      `${review}/production-${kind}-desktop.png`,
      Buffer.from(result.encounter.png.split(',')[1], 'base64'),
    );
    await writeFile(
      `${review}/production-${kind}-narrow.png`,
      Buffer.from(result.encounter.pngNarrow.split(',')[1], 'base64'),
    );
    await writeFile(`${review}/actors.json`, JSON.stringify(result.actors, null, 2));
    await page.route(`**/guardian-${kind}.glb*`, (route) =>
      route.fulfill({ status: 404, body: 'Unavailable' }),
    );
    try {
      const fallback = await page.evaluate(async (kind) => {
        const path = '/tests/browser/night-passage-guardian-review.ts';
        const { reviewGuardianEncounter } = (await import(
          path
        )) as typeof import('./night-passage-guardian-review');
        return reviewGuardianEncounter(true, kind);
      }, kind);
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
      await page.unroute(`**/guardian-${kind}.glb*`);
    }
    expect(errors).toEqual([]);
  });

  test(
    `${name} saved edits and every named native surface agree with browser deformation`,
    { tag: '@requires-blender' },
    async ({ page }, info) => {
      test.setTimeout(browserBudget(60000));
      const directory = process.env[env];
      test.skip(
        !directory,
        `Generate fresh ${name} native saved-edit verification before this journey.`,
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
        editedClip: clips[2],
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
      const results = await page.evaluate(
        async ({ directory, kind }) => {
          const path = '/tests/browser/night-passage-guardian-review.ts';
          const { compareGuardianNative } = (await import(
            path
          )) as typeof import('./night-passage-guardian-review');
          return compareGuardianNative(directory, kind);
        },
        { directory: resolve(directory!), kind },
      );
      expect(results.allMeshesCovered).toBe(true);
      for (const family of [results.original, results.edited]) {
        expect(family.map((clip) => clip.name).sort()).toEqual([...clips].sort());
        expect(family.reduce((sum, clip) => sum + clip.samples, 0)).toBe(authoredFrames);
        for (const clip of family) {
          expect(clip.vertices).toBeGreaterThan(0);
          expect(clip.samples).toBeGreaterThan(1);
          expect(clip.maxError).toBeLessThan(0.0001);
        }
      }
      expect(results.changed.find((clip) => clip.name === clips[2])!.maxError).toBeGreaterThan(
        0.01,
      );
      await mkdir(review, { recursive: true });
      await writeFile(info.outputPath('native-agreement.json'), JSON.stringify(results, null, 2));
      await writeFile(`${review}/native-agreement.json`, JSON.stringify(results, null, 2));
    },
  );
}
