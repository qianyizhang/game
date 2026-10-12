import { expect, test, type Download } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import {
  dispatch,
  exportSession,
  importSession,
  newSession,
  SAVE_KEY,
} from '../../src/games/night-passage/application/session';
import { passageCommand } from '../simulation/night-passage-policy';
import { browserBudget } from './budget';

const review = 'test-results/night-passage';
test.beforeEach(() => mkdirSync(review, { recursive: true }));

test.describe('presentation lifecycle', () => {
  test.use({ deviceScaleFactor: 2 });
  test('resizing reprojects a stationary cursor and remounting releases the old surface', async ({
    page,
  }) => {
    await page.goto('/?game=night-passage');
    await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const field = page.locator('canvas[aria-label="Night Passage combat arena"]');
    const firstBox = (await field.boundingBox())!;
    const cursor = { x: firstBox.x + firstBox.width * 0.7, y: firstBox.y + firstBox.height * 0.3 };
    for (const width of [900, 390, 1100]) {
      await field.focus();
      await page.keyboard.press('Escape');
      await field.dispatchEvent('pointermove', { clientX: cursor.x, clientY: cursor.y });
      await page.setViewportSize({ width, height: 844 });
      await expect
        .poll(() =>
          field.evaluate((element: HTMLCanvasElement) =>
            Math.abs(element.width - element.getBoundingClientRect().width * 2),
          ),
        )
        .toBeLessThanOrEqual(1);
      const box = (await field.boundingBox())!;
      expect(box.width / box.height).toBeCloseTo(1.6, 2);
      await expect
        .poll(async () => {
          const currentBox = (await field.boundingBox())!;
          const saved = importSession(
            (await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!,
          ).state;
          const expected = Math.atan2(
            ((cursor.y - currentBox.y) / currentBox.height) * 600 - saved.player.y,
            ((cursor.x - currentBox.x) / currentBox.width) * 960 - saved.player.x,
          );
          return Math.abs(saved.player.aim - expected);
        })
        .toBeLessThan(0.001);
      await page.keyboard.press('Escape');
    }
    await page.screenshot({ path: `${review}/renderer-resized.png`, fullPage: true });
    const saved = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
    const oldCanvas = await field.elementHandle();
    await page.getByLabel('Choose game').selectOption('balatro');
    expect(
      await oldCanvas.evaluate((element: HTMLCanvasElement) => [
        element.isConnected,
        element.width,
        element.height,
      ]),
    ).toEqual([false, 0, 0]);
    await page.getByLabel('Choose game').selectOption('night-passage');
    await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
    await expect
      .poll(() => field.evaluate((element: HTMLCanvasElement) => element.width))
      .toBeGreaterThan(0);
    expect(
      await field.evaluate(
        (element: HTMLCanvasElement) => element.getContext('2d')!.getImageData(0, 0, 1, 1).data[3],
      ),
    ).toBe(255);
  });
});

test('live aiming, combat, reward selection, pause/reload and portable chronicle', async ({
  page,
}) => {
  test.setTimeout(browserBudget(60000));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=night-passage');
  await expect(page).toHaveTitle('Night Passage · Card Workshop');
  await expect(page.getByRole('heading', { name: 'Carry a light into the dark.' })).toBeVisible();
  await page.screenshot({ path: `${review}/quay-desktop.png`, fullPage: true });
  await page.getByRole('button', { name: 'Far Lantern bow' }).click();
  await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
  const field = page.locator('canvas[aria-label="Night Passage combat arena"]');
  await expect(field).toHaveAttribute('data-phase', 'combat');
  await page.screenshot({ path: `${review}/combat-desktop.png`, fullPage: true });
  const arena = (await field.boundingBox())!;
  await page.mouse.move(arena.x + arena.width / 2, arena.y + arena.height / 3);
  await field.focus();
  await page.keyboard.down('d');
  await page.waitForTimeout(220);
  await page.keyboard.up('d');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const aimed = importSession(
    (await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!,
  ).state;
  expect(aimed.player.aim).toBeLessThan(-1.65); // Aim follows the stationary cursor as the player moves right.
  await page.getByRole('button', { name: 'Resume passage', exact: true }).last().click();
  await page.keyboard.press('Space');
  await page.keyboard.press('q');
  // Pilot the first room with real held inputs, aiming from the latest autosave.
  // This observes serialized player-visible positions and never injects rule state.
  await page.keyboard.down('j');
  for (let n = 0; n < 50 && (await field.getAttribute('data-phase')) === 'combat'; n++) {
    const saved = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
    if (saved) {
      const state = importSession(saved).state;
      const target = state.enemies.find((e) => e.hp > 0);
      const box = await field.boundingBox();
      if (target && box)
        await page.mouse.move(
          box.x + (target.x / 960) * box.width,
          box.y + (target.y / 600) * box.height,
        );
    }
    await page.waitForTimeout(300);
  }
  await page.keyboard.up('j');
  await expect(page.getByRole('heading', { name: 'Choose a blessing' })).toBeVisible();
  await page.screenshot({ path: `${review}/first-blessing.png`, fullPage: true });
  await page.locator('.np-choices button').first().click();
  await expect(page.getByRole('heading', { name: 'Choose your next chamber' })).toBeVisible();
  await page.locator('.np-choices button').first().click();
  await expect(field).toHaveAttribute('data-phase', 'combat');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
  const saved = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
  expect(importSession(saved).state.player.weapon).toBe('bow');
  expect(importSession(saved).state.player.boons).toHaveLength(1);
  // The HUD refreshes less often than rules; wait for the final confirmed frame on pause.
  await expect(field).toHaveAttribute('data-tick', String(importSession(saved).state.tick));
  const tick = await field.getAttribute('data-tick');
  await page.waitForTimeout(150);
  expect(await field.getAttribute('data-tick')).toBe(tick);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
  await page.screenshot({ path: `${review}/combat-paused.png`, fullPage: true });
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export chronicle' }).click();
  const downloaded = await pending;
  await page.getByLabel('Import Night Passage chronicle').setInputFiles(await downloaded.path());
  await expect(page.getByRole('alert')).toHaveText('Chronicle restored.');
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${review}/compact-layout.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('reconstructed victory banks progression, unlocks runes and starts a distinct second run', async ({
  page,
}) => {
  let session = dispatch(newSession('passage-verification'), {
    type: 'start',
    weapon: 'sword',
    runes: ['vigor', 'fleet'],
  }).session;
  for (let i = 0; i < 20000 && session.state.phase !== 'won' && session.state.phase !== 'lost'; i++)
    session = dispatch(session, passageCommand(session.state)).session;
  expect(session.state.phase).toBe('won');
  const text = exportSession(session);
  await page.addInitScript(({ key, text }) => localStorage.setItem(key, text), {
    key: SAVE_KEY,
    text,
  });
  await page.goto('/?game=night-passage');
  await expect(page.getByRole('heading', { name: 'Beyond the Starless Gate' })).toBeVisible();
  await page.screenshot({ path: `${review}/reconstructed-victory.png`, fullPage: true });
  await page.getByRole('button', { name: 'Return to the quay' }).click();
  await expect(page.getByRole('button', { name: 'Moth', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Train vitality · 15 ash' }).click();
  await page.getByRole('button', { name: 'Ember Knuckles fists' }).click();
  await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
  const saved = importSession((await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!);
  expect(saved.state.runNumber).toBe(2);
  expect(saved.state.profile).toMatchObject({ wins: 1, runs: 1, vitality: 1 });
  expect(saved.state.player.weapon).toBe('fists');
});

test('unreadable saves survive play until explicit replacement; storage failure remains visible', async ({
  page,
}) => {
  await page.addInitScript((key) => localStorage.setItem(key, 'unreadable'), SAVE_KEY);
  await page.goto('/?game=night-passage');
  await expect(page.getByRole('alert')).toContainText('Saved chronicle could not load');
  const originalDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original save' }).click();
  expect(readFileSync(await (await originalDownload).path(), 'utf8')).toBe('unreadable');
  await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe('unreadable');
  await expect(page.getByRole('status')).toContainText('Automatic saving is paused');
  const recovery: Download[] = [];
  page.on('download', (download) => recovery.push(download));
  await page.getByRole('button', { name: 'New chronicle', exact: true }).click();
  await page.getByRole('button', { name: 'Export and reset' }).click();
  await expect.poll(() => recovery.length).toBe(2);
  const original = recovery.find((download) =>
    download.suggestedFilename().includes('unreadable'),
  )!;
  const playable = recovery.find(
    (download) => download.suggestedFilename() === 'night-passage.json',
  )!;
  expect(readFileSync(await original.path(), 'utf8')).toBe('unreadable');
  expect(importSession(readFileSync(await playable.path(), 'utf8')).state.runNumber).toBe(1);
  expect(
    importSession((await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!).state.phase,
  ).toBe('hub');
  await page.reload(); // The init script restores the unreadable original for the replacement path.
  await page.getByRole('button', { name: 'Replace unreadable save with a new chronicle' }).click();
  expect(
    importSession((await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!).state.phase,
  ).toBe('hub');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('blocked');
    };
  });
  await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Storage unavailable');
});

test('new chronicle exports the current history before resetting progression and seed', async ({
  page,
}) => {
  await page.goto('/?game=night-passage');
  await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
  await page.getByRole('button', { name: 'New chronicle', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Start a new chronicle' })).toBeVisible();
  await page.getByLabel('Chronicle seed').fill('another-dawn');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export and reset' }).click();
  const original = importSession(readFileSync(await (await pending).path(), 'utf8'));
  expect(original.state.runNumber).toBe(1);
  const reset = importSession((await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!);
  expect(reset.state.seed).toBe('another-dawn');
  expect(reset.state.profile).toMatchObject({ ash: 0, runs: 0, wins: 0 });
  await expect(page.getByRole('heading', { name: 'Carry a light into the dark.' })).toBeVisible();
});

test('reconstructed guardian approaches render their distinct warnings and remain pausable', async ({
  page,
}) => {
  test.setTimeout(browserBudget(60000));
  let session = dispatch(newSession('passage-verification'), {
    type: 'start',
    weapon: 'sword',
    runes: ['vigor', 'fleet'],
  }).session;
  const approaches = new Map<number, string>();
  for (
    let i = 0;
    i < 20000 && session.state.phase !== 'won' && session.state.phase !== 'lost';
    i++
  ) {
    if (
      session.state.phase === 'combat' &&
      session.state.room.boss &&
      session.state.enemies.some((e) => e.kind === 'boss' && e.windup >= 35) &&
      !approaches.has(session.state.region)
    )
      approaches.set(session.state.region, exportSession(session));
    session = dispatch(session, passageCommand(session.state)).session;
  }
  expect(approaches.size).toBe(4);
  await page.goto('/?game=night-passage');
  for (const [region, text] of approaches) {
    await page.getByLabel('Import Night Passage chronicle').setInputFiles({
      name: 'approach.json',
      mimeType: 'application/json',
      buffer: Buffer.from(text),
    });
    await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
    await page.getByRole('button', { name: 'Resume passage', exact: true }).last().click();
    await page.screenshot({ path: `${review}/guardian-${region + 1}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
  }
});
