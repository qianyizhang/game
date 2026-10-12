import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { browserBudget } from './budget';

test.use({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1 });

test('measures ordinary and expansion workloads with production assets and a paused draw guard', async ({
  page,
}, info) => {
  test.setTimeout(browserBudget(120000));
  const label = (process.env.NP_PERFORMANCE_LABEL || 'current').replace(/[^a-zA-Z0-9._-]/g, '-');
  const directory = `test-results/night-passage-performance/${label}`;
  await mkdir(directory, { recursive: true });
  await page.goto('/?game=night-passage');
  const profiler = process.env.NP_PERFORMANCE_PROFILE
    ? await page.context().newCDPSession(page)
    : null;
  if (profiler) {
    await profiler.send('Profiler.enable');
    await profiler.send('Profiler.start');
  }
  let result: Awaited<
    ReturnType<typeof import('./night-passage-performance-review').benchmarkNightPassage>
  >;
  try {
    result = await page.evaluate(async () => {
      const path = '/tests/browser/night-passage-performance-review.ts';
      const { benchmarkNightPassage } = (await import(
        path
      )) as typeof import('./night-passage-performance-review');
      return benchmarkNightPassage();
    });
  } finally {
    if (profiler) {
      try {
        const { profile } = await profiler.send('Profiler.stop');
        await writeFile(`${directory}/cpu.cpuprofile`, JSON.stringify(profile));
      } finally {
        await profiler.detach();
      }
    }
  }
  expect(result.devicePixelRatio).toBe(1);
  expect(result.results).toHaveLength(6);
  for (const count of [5, 24])
    expect(
      result.results.filter((entry) => entry.count === count).map((entry) => entry.round),
    ).toEqual([1, 2, 3]);
  for (const entry of result.results) {
    expect(entry.unavailable).toBe(false);
    expect(entry.rulesUnchanged).toBe(true);
    expect(entry.backing).toEqual({ width: 960, height: 600 });
    expect(entry.submissionMs.count).toBe(180);
    expect(entry.rafIntervalMs.count).toBe(180);
    expect(entry.drawCallsPerFrame.p50).toBeGreaterThan(0);
    expect(entry.pausedDrawCalls).toBe(0);
    await writeFile(
      `${directory}/${entry.count}-enemies-round-${entry.round}.png`,
      Buffer.from(entry.png.split(',')[1], 'base64'),
    );
  }
  const report = {
    ...result,
    label,
    browserVersion: page.context().browser()!.version(),
    project: info.project.name,
    results: result.results.map((entry) => ({ ...entry, png: undefined })),
  };
  await writeFile(`${directory}/measurements.json`, JSON.stringify(report, null, 2));
});
