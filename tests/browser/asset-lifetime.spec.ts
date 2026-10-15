import { expect, test } from '@playwright/test';

for (const fail of [false, true]) {
  test(`model batch ${fail ? 'failure' : 'unmount'} releases acquired helpers and late arrivals`, async ({
    page,
  }) => {
    await page.goto('/');
    const result = await page.evaluate(async (fail) => {
      const path = '/tests/browser/asset-lifetime.ts';
      const { inspectBatchLifetime } = (await import(path)) as typeof import('./asset-lifetime');
      return inspectBatchLifetime(fail);
    }, fail);
    expect(result.beforeLate).toEqual({ firstReleased: 1, helpersReleased: 4 });
    expect(result).toMatchObject({
      firstReleased: 1,
      helpersReleased: 4,
      lateReleased: 1,
      canvases: 0,
    });
    expect(result.statuses).toEqual(fail ? [false] : []);
  });
}
