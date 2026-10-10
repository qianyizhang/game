import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { playCampaign } from '../../packages/diablo2/src/domain/campaign-policy';
import {
  exportSession,
  importSession,
  SAVE_KEY,
} from '../../packages/diablo2/src/application/session';
import { distance, lineOfSight } from '../../packages/diablo2/src/domain/maps';
import { BASE_CONTENT } from '../../packages/diablo2/src/domain/content';
const review = 'test-results/emberwake';

test('real hero selection, town shopping, movement, spells, pause, and save reload', async ({
  page,
}) => {
  test.setTimeout(45000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=diablo2');
  await expect(page).toHaveTitle('Emberwake · Card Workshop');
  await expect(page.getByRole('button', { name: /Barbarian Rook/ })).toBeVisible();
  await page.getByRole('button', { name: /Sorceress Mira/ }).click();
  mkdirSync(review, { recursive: true });
  await page.screenshot({ path: `${review}/heroes.png` });
  await page.getByRole('button', { name: 'Begin journey', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lantern Refuge', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Life potion · 12g', exact: true }).click();
  await expect(page.getByRole('button', { name: '1 · Life potion ×6' })).toBeVisible();
  await page.getByRole('button', { name: '→ Briarfen Enter from the road', exact: true }).click();
  const canvas = page.locator('.ew-canvas-wrap canvas');
  await expect(canvas).toBeVisible();
  await canvas.focus();
  await page.keyboard.down('d');
  await page.waitForTimeout(600);
  await page.keyboard.up('d');
  await canvas.click({ position: { x: 260, y: 150 }, button: 'right' });
  await expect(page.locator('.ew-topline')).toContainText('Mira · Sorceress');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Paused', exact: true })).toBeVisible();
  const saved = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
  const state = importSession(saved).state;
  expect(state.player.x).toBeGreaterThan(4);
  expect(state.player.mana).toBeLessThan(110);
  await page.getByRole('button', { name: 'Resume journey', exact: true }).click();
  await canvas.focus();
  const foe = state.worlds[0].enemies
    .filter(
      (e) =>
        e.hp > 0 && distance(e, state.player) < 7 && lineOfSight(state.worlds[0], state.player, e),
    )
    .sort((a, b) => distance(a, state.player) - distance(b, state.player))[0];
  expect(foe).toBeDefined();
  await page.keyboard.press('Space');
  await expect
    .poll(
      async () => {
        const text = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
        return importSession(text).state.worlds[0].enemies.find((e) => e.uid === foe.uid)?.hp;
      },
      { timeout: 15000 },
    )
    .toBe(0);
  await page.screenshot({ path: `${review}/briarfen.png` });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.keyboard.press('i');
  await expect(page.getByRole('dialog', { name: 'Inventory and stash' })).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('dialog').locator('button').last()).toBeFocused();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Briarfen', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paused', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('campaign replay reaches the ending; mod import preserves invalid-save recovery', async ({
  page,
}) => {
  test.setTimeout(60000);
  const { session } = playCampaign('necromancer');
  await page.goto('/?game=diablo2');
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({
      name: 'journey.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportSession(session)),
    });
  await expect(page.getByRole('heading', { name: 'Dawn belongs to everyone.' })).toBeVisible();
  await page.screenshot({ path: `${review}/victory.png` });
  await page.getByRole('button', { name: 'Begin another journey', exact: true }).click();
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"format":"invalid"}'),
    });
  await expect(page.getByRole('status')).toContainText('Import rejected');
  const mod = structuredClone(BASE_CONTENT);
  mod.id = 'browser-mod';
  mod.version = '2';
  mod.heroes[0].name = 'Wren';
  await page
    .locator('input[type=file]')
    .nth(1)
    .setInputFiles({
      name: 'mod.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(mod)),
    });
  await expect(page.getByRole('button', { name: /Barbarian Wren/ })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${review}/mobile-heroes.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Begin journey', exact: true }).click();
  await expect(page.locator('.ew-topline')).toContainText('Wren · Barbarian');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
