import { mkdirSync, writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { browserBudget } from './budget';

test('movement, auto-fire, pause, shop and replay recovery use the real prototype', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/?game=night-passage');
  await page.getByRole('link', { name: 'Try Scrapyard · horde prototype →' }).click();
  await page.getByRole('button', { name: 'Start run', exact: true }).waitFor();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole('button', { name: 'Start run', exact: true }).click();
  const field = page.locator('canvas');
  const startX = Number(await field.getAttribute('data-x'));
  await page.keyboard.down('d');
  await page.clock.runFor(600);
  await page.keyboard.up('d');
  expect(Number(await field.getAttribute('data-x'))).toBeGreaterThan(startX + 50);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Take a breath.' })).toBeVisible();
  const tick = await field.getAttribute('data-tick');
  const hostileShots = await field.getAttribute('data-hostile-shots');
  await page.clock.runFor(1000);
  expect(await field.getAttribute('data-tick')).toBe(tick);
  expect(await field.getAttribute('data-hostile-shots')).toBe(hostileShots);
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  // Follow a wide rectangle via actual keyboard events. Virtual time isolates input from tool latency.
  const corners = [
    [780, 120],
    [780, 480],
    [180, 480],
    [180, 120],
  ];
  let corner = 0;
  for (let i = 0; i < 310 && (await field.getAttribute('data-phase')) === 'combat'; i++) {
    const x = Number(await field.getAttribute('data-x')),
      y = Number(await field.getAttribute('data-y'));
    const target = corners[corner];
    if (Math.hypot(x - target[0], y - target[1]) < 35) corner = (corner + 1) % 4;
    const next = corners[corner];
    const held = [
      Math.abs(next[0] - x) < 12 ? '' : next[0] > x ? 'd' : 'a',
      Math.abs(next[1] - y) < 12 ? '' : next[1] > y ? 's' : 'w',
    ].filter(Boolean);
    for (const key of held) await page.keyboard.down(key);
    await page.clock.runFor(100);
    for (const key of held) await page.keyboard.up(key);
  }
  await expect(page.getByRole('heading', { name: 'Spend your scrap.' })).toBeVisible();
  if (process.env.SCRAPYARD_CAPTURE === '1') {
    mkdirSync('.artifacts/scrapyard-prototype', { recursive: true });
    await page.screenshot({ path: '.artifacts/scrapyard-prototype/shop.png', fullPage: true });
  }
  expect(Number(await field.getAttribute('data-kills'))).toBeGreaterThan(0);
  await page.getByRole('button', { name: /Better boots/ }).click();
  await expect(page.getByRole('button', { name: /Better boots/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Start wave 2' }).click();
  await expect(field).toHaveAttribute('data-phase', 'combat');
  await page.keyboard.press('Escape');
  await page.getByText('Prototype & replay', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export replay' }).click();
  const path = await (await download).path();
  expect(path).toBeTruthy();
  await page
    .getByLabel('Import replay')
    .setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await field.getAttribute('data-phase')).toBe('combat');
  await page.getByLabel('Import replay').setInputFiles(path);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Take a breath.' })).toBeVisible();
});

test('all population settings, failure recovery and narrow layout remain usable', async ({
  page,
}) => {
  test.setTimeout(browserBudget(60_000));
  await page.clock.install();
  await page.goto('/?prototype=scrapyard');
  await page.getByRole('button', { name: 'Start run', exact: true }).waitFor();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  for (const density of [100, 300, 500]) {
    await page.getByLabel('Enemy population').selectOption(String(density));
    await page
      .getByRole('button', { name: density === 100 ? 'Start run' : 'Restart run', exact: true })
      .click();
    await expect(page.getByText(`${density} enemies`, { exact: true }).first()).toBeVisible();
    if (density === 500) {
      await page.keyboard.down('d');
      await page.clock.runFor(1000);
      await page.keyboard.up('d');
      await page.keyboard.down('s');
      await page.clock.runFor(1000);
      await page.keyboard.up('s');
      await page.keyboard.down('a');
      await page.clock.runFor(3000);
      await page.keyboard.up('a');
      expect(
        Number(await page.locator('canvas').getAttribute('data-hostile-shots')),
      ).toBeGreaterThanOrEqual(200);
      if (process.env.SCRAPYARD_CAPTURE === '1') {
        mkdirSync('.artifacts/scrapyard-prototype', { recursive: true });
        await page.screenshot({
          path: '.artifacts/scrapyard-prototype/arena-500.png',
          fullPage: true,
        });
      }
    }
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (process.env.SCRAPYARD_CAPTURE === '1')
    await page.screenshot({ path: '.artifacts/scrapyard-prototype/narrow.png' });
  await page.getByRole('button', { name: 'Restart run' }).click();
  await page.clock.runFor(30000);
  await expect(page.getByRole('heading', { name: 'Overrun.' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('canvas')).toHaveAttribute('data-phase', 'combat');
  await page.getByLabel('Seed', { exact: true }).fill('');
  await expect(page.getByRole('button', { name: 'Restart run' })).toBeDisabled();
});

test('bounded 100 / 300 / 500 enemy performance experiment', async ({ page }) => {
  test.skip(
    process.env.SCRAPYARD_BENCHMARK !== '1',
    'Explicit performance experiment; run serially without other checks.',
  );
  test.setTimeout(180_000);
  // A minimal same-origin document avoids leaving the application's own RAF loop mounted.
  await page.route('**/scrapyard-benchmark', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><head><title>Scrapyard benchmark</title></head><body></body></html>',
    }),
  );
  await page.goto('/scrapyard-benchmark');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/scrapyard-performance-review.ts';
    const module = (await import(
      /* @vite-ignore */ path
    )) as typeof import('./scrapyard-performance-review');
    return module.benchmarkScrapyard();
  });
  const directory = '.artifacts/scrapyard-prototype';
  mkdirSync(directory, { recursive: true });
  writeFileSync(`${directory}/benchmark.json`, JSON.stringify(result, null, 2));
  for (const row of result.results) {
    expect(row.activeEnemies).toBe(row.density);
    expect(row.hp).toBeGreaterThan(0);
    expect(row.sampledTicks).toBeGreaterThanOrEqual(595);
    expect(row.kills).toBeGreaterThan(0);
    expect(row.hostileShots.median).toBeGreaterThanOrEqual(200);
    expect(row.hostileCapacityFrames).toBe(0);
  }
});
