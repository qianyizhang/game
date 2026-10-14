import { expect, test, type Download } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  SAVE_KEY,
} from '../../src/games/night-passage/application/session';
import { passageCommand } from '../simulation/night-passage-policy';
import { chamberLayout } from '../../src/games/night-passage/domain/chamber-content';
import { browserBudget } from './budget';

const review = 'test-results/night-passage-layouts';
const header = (text: string) => JSON.parse(text) as { rules: string; content: string };
async function downloaded(download: Download) {
  const path = await download.path();
  if (!path) throw new Error('Chronicle download has no local file');
  return readFile(path, 'utf8');
}

test('announced route layout survives UI selection, portable replay and paused reload', async ({
  page,
}) => {
  test.setTimeout(browserBudget(60000));
  let journal = dispatch(newSession('layout-browser-route'), {
    type: 'start',
    weapon: 'bow',
    runes: ['vigor', 'fleet'],
  }).session;
  for (
    let i = 0;
    i < 3000 && journal.state.phase !== 'route' && journal.state.phase !== 'lost';
    i++
  ) {
    const result = dispatch(journal, passageCommand(journal.state));
    expect(result.error).toBeNull();
    journal = result.session;
  }
  expect(journal.state.phase).toBe('route');
  expect(journal.state.roomsCleared).toBe(1);
  const routes = journal.state.routes;
  const index = routes.findIndex((route) => route.layout !== undefined);
  expect(index).toBeGreaterThanOrEqual(0);
  const selected = routes[index];
  const layout = chamberLayout(selected.layout!);
  expect(selected.layout).not.toBe(journal.state.room.layout);
  await mkdir(review, { recursive: true });
  await page.goto('/?game=night-passage');
  await page.getByLabel('Import Night Passage chronicle').setInputFiles({
    name: 'first-route.json',
    mimeType: 'application/json',
    buffer: Buffer.from(exportSession(journal)),
  });
  await expect(page.getByRole('heading', { name: 'Choose your next chamber' })).toBeVisible();
  const route = page.locator('.np-choices button').nth(index);
  await expect(route).toContainText(selected.label);
  await expect(route).toContainText(selected.detail);
  await expect(route).toContainText(layout.name);
  await expect(route).toContainText(layout.description);
  await page.screenshot({ path: `${review}/announced-first-route.png`, fullPage: true });
  await route.click();
  const field = page.locator('canvas[aria-label="Night Passage combat arena"]');
  await expect(field).toHaveAttribute('data-phase', 'combat');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
  const saved = (await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!;
  const confirmed = importSession(saved).state;
  expect(confirmed.room.layout).toBe(selected.layout);
  expect(confirmed.room.pillars).toEqual(layout.pillars);
  expect(confirmed.room.hazards.map(({ x, y, offset }) => ({ x, y, offset }))).toEqual(
    layout.hazards,
  );
  expect(header(saved)).toMatchObject({
    rules: 'night-passage-5',
    content: 'night-passage-content-4',
  });
  const geometry = {
    layout: confirmed.room.layout,
    pillars: confirmed.room.pillars,
    hazards: confirmed.room.hazards,
  };
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export chronicle' }).click();
  const portable = await downloaded(await pending);
  expect(portable).toBe(saved);
  await page.getByLabel('Import Night Passage chronicle').setInputFiles({
    name: 'selected-layout.json',
    mimeType: 'application/json',
    buffer: Buffer.from(portable),
  });
  await expect(page.getByRole('alert')).toHaveText('Chronicle restored.');
  await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
  const restored = importSession(
    (await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!,
  ).state;
  expect({
    layout: restored.room.layout,
    pillars: restored.room.pillars,
    hazards: restored.room.hazards,
  }).toEqual(geometry);
  expect(restored.seed).toBe(confirmed.seed);
  await page.screenshot({ path: `${review}/selected-layout-paused.png`, fullPage: true });
  await writeFile(
    `${review}/route-retention.json`,
    JSON.stringify({ selected, geometry, ...header(saved) }, null, 2),
  );
});

test('version-3 chronicle bytes remain recoverable until explicit current-version replacement', async ({
  page,
}) => {
  // An empty accepted-command history is valid in the old replay envelope.
  const legacy = JSON.stringify({
    ...(JSON.parse(exportSession(newSession('legacy-layout-save'))) as Record<string, unknown>),
    rules: 'night-passage-3',
    content: 'night-passage-content-3',
  });
  await page.addInitScript(({ key, legacy }) => localStorage.setItem(key, legacy), {
    key: SAVE_KEY,
    legacy,
  });
  await page.goto('/?game=night-passage');
  await expect(page.getByRole('alert')).toContainText('Saved chronicle could not load');
  await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(legacy);
  await expect(page.getByRole('status')).toContainText('Automatic saving is paused');
  const originalDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original save' }).click();
  expect(await downloaded(await originalDownload)).toBe(legacy);
  const currentDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export chronicle' }).click();
  const current = await downloaded(await currentDownload);
  expect(header(current)).toMatchObject({
    rules: 'night-passage-5',
    content: 'night-passage-content-4',
  });
  expect(importSession(current).state.runNumber).toBe(1);
  expect(() => importSession(legacy)).toThrow('Unsupported');
  await page.getByLabel('Import Night Passage chronicle').setInputFiles({
    name: 'legacy.json',
    mimeType: 'application/json',
    buffer: Buffer.from(legacy),
  });
  await expect(page.getByRole('alert')).toContainText('Unsupported');
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(legacy);
  await page.getByLabel('Import Night Passage chronicle').setInputFiles({
    name: 'new-layout-rules.json',
    mimeType: 'application/json',
    buffer: Buffer.from(current),
  });
  await expect(page.getByRole('alert')).toHaveText('Chronicle restored.');
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(current);
});

test('four controlled chamber layouts render through the production scene without changing snapshots', async ({
  page,
}) => {
  test.setTimeout(browserBudget(45000));
  await page.goto('/?game=night-passage');
  const images = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-layouts-review.ts';
    const { reviewLayouts } = (await import(
      path
    )) as typeof import('./night-passage-layouts-review');
    return reviewLayouts();
  });
  expect(images.map((entry) => entry.id)).toEqual(['court', 'gallery', 'islands', 'crossroads']);
  expect(new Set(images.map((entry) => entry.png)).size).toBe(4);
  await mkdir(review, { recursive: true });
  for (const image of images) {
    expect(image.rulesUnchanged).toBe(true);
    expect(image.unavailable).toBe(false);
    await writeFile(
      `${review}/${image.id}-controlled.png`,
      Buffer.from(image.png.split(',')[1], 'base64'),
    );
  }
});
