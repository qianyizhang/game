import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { browserBudget } from './budget';

const directory = 'test-results/night-passage-patrons';
test('patron decoration is snapshot-pure, pauses exactly, respects reduced motion and releases owned resources', async ({
  page,
}) => {
  await page.goto('/?game=night-passage');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-patrons-review.ts';
    const helper = (await import(path)) as typeof import('./night-passage-patrons-review');
    return helper.inspectPatronEffects();
  });
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/behavior.json`, JSON.stringify(result, null, 2));
  for (const entry of result.checks) {
    expect(entry.visible, entry.id).toBe(true);
    expect(entry.pausedStable, entry.id).toBe(true);
  }
  for (const entry of result.temporal) {
    expect(entry.normalMoves, entry.god).toBe(true);
    expect(entry.reducedSpatialStable, entry.god).toBe(true);
    expect(entry.reducedFades, entry.god).toBe(true);
  }
  for (const key of [
    'pure',
    'resetHidden',
    'resetRestores',
    'expiredHidden',
    'bounded',
    'poolReused',
    'hostileExcluded',
    'mundaneExcluded',
    'resourcesRemoved',
    'materialsReleasedOnce',
    'texturesReleasedOnce',
  ] as const)
    expect(result[key], key).toBe(true);
});

test('all five patron motifs remain visible in authored chambers at 960 and 390 pixels', async ({
  page,
}) => {
  test.setTimeout(browserBudget(90000));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=night-passage');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-patrons-review.ts';
    const helper = (await import(path)) as typeof import('./night-passage-patrons-review');
    return helper.reviewPatronEffects();
  });
  await mkdir(directory, { recursive: true });
  for (const picture of result.pictures)
    await writeFile(
      `${directory}/${picture.id}.png`,
      Buffer.from(picture.png.split(',')[1], 'base64'),
    );
  const { pictures, ...receipt } = result;
  await writeFile(
    `${directory}/scene.json`,
    JSON.stringify({ ...receipt, errors, images: pictures.map((picture) => picture.id) }, null, 2),
  );
  expect(result.unavailable).toBe(false);
  expect(result.authoredReady).toBe(true);
  expect(result.pure).toBe(true);
  for (const comparison of result.comparisons) {
    expect
      .soft(comparison.changed, `${comparison.id}: decorative light changes visible pixels`)
      .toBe(true);
    expect.soft(comparison.pausedStable, `${comparison.id}: paused pixels are exact`).toBe(true);
  }
  expect(errors).toEqual([]);
});
