import { expect, test } from '@playwright/test';

test('warning rims preserve safe space and restore canvas state at both consumer resolutions', async ({
  page,
}) => {
  await page.goto('/?game=night-passage');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-threat-review.ts';
    const review = (await import(path)) as typeof import('./night-passage-threat-review');
    return review.inspectThreatBoundaries();
  });
  expect(result.cases).toBe(114);
  expect(result.painted).toBeGreaterThan(0);
  expect(result.violations).toEqual([]);
  expect(result.clearHoles).toBe(true);
  expect(result.restored).toBe(true);
});
