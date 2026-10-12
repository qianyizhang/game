import { test, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { browserBudget } from './budget';

const review = 'test-results/night-passage-hero/browser';

test('hero GLB plays all sixteen clips and preserves a native socket for each weapon', async ({
  page,
}) => {
  test.setTimeout(browserBudget(45000));
  await mkdir(review, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=night-passage');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-hero-review.ts';
    const { reviewHero, inspectHeroAttachment } = (await import(
      path
    )) as typeof import('./night-passage-hero-review');
    return { ...(await reviewHero()), attachments: await inspectHeroAttachment() };
  });
  for (const entry of result.attachments) {
    expect(entry.attached && entry.visible && entry.fallbackHidden && entry.finiteBounds).toBe(
      true,
    );
    for (const scale of entry.scale) expect(scale).toBeCloseTo(1);
    expect(entry.up).toBeCloseTo(1, 3);
    expect(entry.distance).toBeGreaterThan(25);
    expect(entry.distance).toBeLessThan(60);
  }
  expect(result.timings).toHaveLength(16);
  for (const clip of result.timings) {
    expect(clip.frames).toBeGreaterThan(5);
    expect(Math.abs(clip.wallSeconds - clip.seconds)).toBeLessThan(0.5);
    const frames = result.snapshots.filter((frame) => frame.name === clip.name);
    expect(frames.length).toBeGreaterThanOrEqual(5);
    expect(new Set(frames.map((frame) => frame.png)).size).toBeGreaterThan(1);
  }
  for (const frame of result.snapshots)
    await writeFile(
      `${review}/${frame.name}-${frame.fraction}.png`,
      Buffer.from(frame.png.split(',')[1], 'base64'),
    );
  await writeFile(`${review}/hero-1x.webm`, Buffer.from(result.video, 'base64'));
  await writeFile(`${review}/playback.json`, JSON.stringify(result.timings, null, 2));
  expect(errors).toEqual([]);
});

test(
  'hero saved edit and original surfaces agree with browser deformation',
  { tag: '@requires-blender' },
  async ({ page }, info) => {
    test.setTimeout(browserBudget(60000));
    const directory = process.env.NIGHT_PASSAGE_NATIVE_RESULTS;
    test.skip(!directory, 'Generate fresh hero native verification before this journey.');
    const evidence = JSON.parse(
      await readFile(resolve(directory!, 'verification.json'), 'utf8'),
    ) as { meshAndWeightsUnchanged: boolean; authoritativeSourceAndDeliveryUnchanged: boolean };
    expect(evidence.meshAndWeightsUnchanged).toBe(true);
    expect(evidence.authoritativeSourceAndDeliveryUnchanged).toBe(true);
    await page.goto('/?game=night-passage');
    const result = await page.evaluate(async (directory) => {
      const path = '/tests/browser/canid-evidence.ts';
      const { compareCanid } = (await import(path)) as typeof import('./canid-evidence');
      const reference = (await (
        await fetch(`/@fs${directory}/reference.json`)
      ).json()) as Parameters<typeof compareCanid>[1];
      const edited = (await (await fetch(`/@fs${directory}/edited.json`)).json()) as Parameters<
        typeof compareCanid
      >[1];
      return {
        original: await compareCanid(
          '/packages/dcc-workbench/assets/night-passage/hero.glb',
          reference,
        ),
        edited: await compareCanid(`/@fs${directory}/models/hero.glb`, edited),
        changed: await compareCanid(`/@fs${directory}/models/hero.glb`, reference),
      };
    }, resolve(directory!));
    for (const clip of [...result.original, ...result.edited])
      expect(clip.maxError).toBeLessThan(0.0001);
    expect(result.changed.find((clip) => clip.name === 'cast')!.maxError).toBeGreaterThan(0.01);
    await writeFile(info.outputPath('native-agreement.json'), JSON.stringify(result, null, 2));
    await mkdir(review, { recursive: true });
    await writeFile(`${review}/native-agreement.json`, JSON.stringify(result, null, 2));
  },
);

test('five native weapons play attacks and specials through confirmed rules ticks', async ({
  page,
}) => {
  test.setTimeout(browserBudget(45000));
  const directory = 'test-results/night-passage-weapons/browser';
  await mkdir(directory, { recursive: true });
  await page.goto('/?game=night-passage');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-weapons-review.ts';
    const { reviewWeapons } = (await import(
      path
    )) as typeof import('./night-passage-weapons-review');
    return reviewWeapons();
  });
  expect(result.timings).toHaveLength(10);
  for (const entry of result.timings) {
    expect(entry.seconds).toBeGreaterThanOrEqual(1);
    expect(entry.seconds).toBeLessThan(1.5);
    expect(entry.frames).toBeGreaterThan(10);
    const frames = result.snapshots.filter(
      (f) => f.weapon === entry.weapon && f.action === entry.action,
    );
    expect(frames.map((f) => f.stage)).toEqual(['windup', 'contact', 'rest']);
    expect(new Set(frames.map((f) => f.png)).size).toBe(3);
  }
  for (const check of result.checks) {
    expect(check.leftAttached && check.pausedStable && check.rulesUnchanged).toBe(true);
    expect(check.leftVisible).toBe(check.weapon === 'fists');
    if (check.weapon === 'bow') expect(check.maxDraw).toBeGreaterThan(0.9);
  }
  for (const frame of result.snapshots)
    await writeFile(
      `${directory}/${frame.weapon}-${frame.action}-${frame.stage}.png`,
      Buffer.from(frame.png.split(',')[1], 'base64'),
    );
  await writeFile(`${directory}/weapons-1x.webm`, Buffer.from(result.video, 'base64'));
  await writeFile(
    `${directory}/playback.json`,
    JSON.stringify({ timings: result.timings, checks: result.checks }, null, 2),
  );
});

test(
  'weapon native surfaces, bow morph and saved blade edit agree with browser delivery',
  { tag: '@requires-blender' },
  async ({ page }, info) => {
    const directory = process.env.NIGHT_PASSAGE_WEAPON_RESULTS;
    test.skip(!directory, 'Generate fresh weapon native verification before this journey.');
    const evidence = JSON.parse(
      await readFile(resolve(directory!, 'verification.json'), 'utf8'),
    ) as { authoritativeSourceAndDeliveryUnchanged: boolean };
    expect(evidence.authoritativeSourceAndDeliveryUnchanged).toBe(true);
    await page.goto('/?game=night-passage');
    const result = await page.evaluate(async (directory) => {
      const path = '/tests/browser/night-passage-weapons-review.ts';
      const { compareWeapons } = (await import(
        path
      )) as typeof import('./night-passage-weapons-review');
      const reference = (await (
        await fetch(`/@fs${directory}/reference.json`)
      ).json()) as Parameters<typeof compareWeapons>[1];
      const edited = (await (await fetch(`/@fs${directory}/edited.json`)).json()) as Parameters<
        typeof compareWeapons
      >[1];
      return {
        original: await compareWeapons(
          '/packages/dcc-workbench/assets/night-passage/weapons.glb',
          reference,
        ),
        edited: await compareWeapons(`/@fs${directory}/models/weapons.glb`, edited),
        changed: await compareWeapons(`/@fs${directory}/models/weapons.glb`, reference),
      };
    }, resolve(directory!));
    for (const pose of [...result.original, ...result.edited])
      expect(pose.maxError).toBeLessThan(0.0001);
    for (const pose of result.changed) expect(pose.maxError).toBeGreaterThan(5);
    await mkdir('test-results/night-passage-weapons/browser', { recursive: true });
    await writeFile(info.outputPath('native-agreement.json'), JSON.stringify(result, null, 2));
    await writeFile(
      'test-results/night-passage-weapons/browser/native-agreement.json',
      JSON.stringify(result, null, 2),
    );
  },
);
