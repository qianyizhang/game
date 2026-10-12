import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { browserBudget } from './budget';

const review = 'test-results/night-passage-sepulcher/browser';
const layouts = ['court', 'gallery', 'islands', 'crossroads'];

test('sepulcher arrives while paused and preserves rules placements and pillar visibility', async ({
  page,
}) => {
  test.setTimeout(browserBudget(30000));
  await page.goto('/?game=night-passage');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-environment-review.ts';
    const { inspectEnvironment } = (await import(
      path
    )) as typeof import('./night-passage-environment-review');
    return inspectEnvironment();
  });
  expect(result).toMatchObject({
    initialFallback: true,
    arrivalPure: true,
    sameStateArrival: true,
    restoredRegion: true,
    rulesUnchanged: true,
  });
  expect(result.invalidations).toBeGreaterThan(0);
  expect(result.cases.map((entry) => entry.id)).toEqual(layouts);
  for (const entry of result.cases) {
    expect(entry.floor).toEqual([[480, 0, 300]]);
    expect(entry.boundary).toEqual([[480, 0, 300]]);
    expect(entry.lanterns).toEqual([
      [55, 0, 90],
      [55, 0, 510],
      [905, 0, 90],
      [905, 0, 510],
    ]);
    expect(entry).toMatchObject({
      warningFade: true,
      restored: true,
      occlusionFade: true,
      privateMaterials: true,
      occlusionActorClear: true,
    });
    for (const pillar of entry.placements) {
      expect(pillar.x).toBe(pillar.expected.x);
      expect(pillar.z).toBe(pillar.expected.z);
      expect(pillar.scale).toEqual([pillar.expected.radius / 30, 1, pillar.expected.radius / 30]);
      expect(pillar.height).toBeCloseTo(81, 3);
      expect(pillar.minY).toBeCloseTo(0, 3);
    }
  }
  expect(result.otherRegions).toEqual(
    [1, 2, 3].map((region) => ({ region, fallback: true, nativeHidden: true })),
  );
  await mkdir(review, { recursive: true });
  await writeFile(`${review}/placements.json`, JSON.stringify(result, null, 2));
});

test('sepulcher and fallback render the same four collision and warning states at desktop and 390px', async ({
  page,
}) => {
  test.setTimeout(browserBudget(60000));
  await mkdir(review, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=night-passage');
  const native = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-environment-review.ts';
    const { reviewEnvironmentLayouts } = (await import(
      path
    )) as typeof import('./night-passage-environment-review');
    return reviewEnvironmentLayouts();
  });
  await page.route('**/environment-sepulcher.glb*', (route) =>
    route.fulfill({ status: 404, body: 'Unavailable' }),
  );
  try {
    const fallback = await page.evaluate(async () => {
      const path = '/tests/browser/night-passage-environment-review.ts';
      const { reviewEnvironmentLayouts } = (await import(
        path
      )) as typeof import('./night-passage-environment-review');
      return reviewEnvironmentLayouts(true);
    });
    for (const result of [native, fallback]) {
      expect(result).toMatchObject({ ready: true, unavailable: false });
      expect(result.pictures.map((entry) => entry.id)).toEqual(layouts);
      for (const entry of result.pictures) {
        expect(entry).toMatchObject({ pausedStable: true, rulesUnchanged: true });
        expect(entry.colors).toBeGreaterThan(20);
        expect(entry.warnings.y).toBeCloseTo(0.8, 6);
        expect(entry.collision.point).toEqual(entry.collision.expected);
        expect(entry.ground!.x).toBeCloseTo(480, 5);
        expect(entry.ground!.y).toBeCloseTo(300, 5);
      }
    }
    for (const [index, entry] of native.pictures.entries()) {
      const alternate = fallback.pictures[index];
      expect(entry.warnings).toEqual(alternate.warnings);
      expect(entry.collision).toEqual(alternate.collision);
      expect(entry.png).not.toBe(alternate.png);
      for (const [mode, picture] of [
        ['native', entry],
        ['fallback', alternate],
      ] as const) {
        await writeFile(
          `${review}/${entry.id}-${mode}-desktop.png`,
          Buffer.from(picture.png.split(',')[1], 'base64'),
        );
        await writeFile(
          `${review}/${entry.id}-${mode}-narrow.png`,
          Buffer.from(picture.pngNarrow.split(',')[1], 'base64'),
        );
      }
    }
    await writeFile(
      `${review}/scene-checks.json`,
      JSON.stringify(
        [native, fallback].map((result) =>
          result.pictures.map(
            ({ id, pausedStable, rulesUnchanged, colors, ground, collision }) => ({
              id,
              pausedStable,
              rulesUnchanged,
              colors,
              ground,
              collision,
            }),
          ),
        ),
        null,
        2,
      ),
    );
  } finally {
    await page.unroute('**/environment-sepulcher.glb*');
  }
  expect(errors).toEqual([]);
});

test(
  'all static sepulcher surfaces and a saved cap edit agree with delivered browser geometry',
  { tag: '@requires-blender' },
  async ({ page }, info) => {
    test.setTimeout(browserBudget(90000));
    const directory = process.env.NIGHT_PASSAGE_ENVIRONMENT_RESULTS;
    test.skip(
      !directory,
      'Generate fresh sepulcher native saved-edit verification before this journey.',
    );
    const verification = JSON.parse(
      await readFile(resolve(directory!, 'verification.json'), 'utf8'),
    ) as {
      authoritativeSourceAndDeliveryUnchanged: boolean;
      editedObject: string;
      vertexChangeUnits: number;
      sourceSha256: string;
      modelSha256: string;
    };
    expect(verification).toMatchObject({
      authoritativeSourceAndDeliveryUnchanged: true,
      editedObject: 'Pillar_cap',
      vertexChangeUnits: 4,
    });
    expect(verification.sourceSha256).toBe(
      createHash('sha256')
        .update(
          await readFile(
            'packages/dcc-workbench/subjects/night-passage/environments/sepulcher/source.blend',
          ),
        )
        .digest('hex'),
    );
    expect(verification.modelSha256).toBe(
      createHash('sha256')
        .update(
          await readFile('packages/dcc-workbench/assets/night-passage/environment-sepulcher.glb'),
        )
        .digest('hex'),
    );
    await page.goto('/?game=night-passage');
    const result = await page.evaluate(async (directory) => {
      const path = '/tests/browser/night-passage-environment-review.ts';
      const { compareEnvironmentNative } = (await import(
        path
      )) as typeof import('./night-passage-environment-review');
      return compareEnvironmentNative(directory);
    }, resolve(directory!));
    for (const surfaces of [result.original, result.edited]) {
      expect(surfaces.length).toBeGreaterThan(4);
      for (const surface of surfaces) {
        expect(surface.maxError, surface.name).toBeLessThan(0.001);
        expect(surface.nativeVertices).toBeGreaterThan(0);
        expect(surface.deliveryVertices).toBeGreaterThan(0);
      }
    }
    expect(
      result.changed.find((surface) => surface.name === 'Pillar_cap')!.maxError,
    ).toBeGreaterThan(1);
    await mkdir(review, { recursive: true });
    await writeFile(info.outputPath('native-agreement.json'), JSON.stringify(result, null, 2));
    await writeFile(`${review}/native-agreement.json`, JSON.stringify(result, null, 2));
  },
);
