import { SAVE_KEY } from '../../src/games/night-passage/application/live-chronicle';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { Vector3 } from 'three';
import {
  createCamera,
  fitCamera,
} from '../../src/games/night-passage/ui/presentation/scene/camera';
import {
  dispatch,
  exportChronicle,
  restoreChronicle,
  createChronicle,
} from '../../src/games/night-passage/application/chronicle';
import type { Point } from '../../src/games/night-passage/domain/types';
import { passageCommand } from '../simulation/night-passage-policy';
import { browserBudget } from './budget';

const review = 'test-results/night-passage-scene';
test.beforeEach(() => mkdirSync(review, { recursive: true }));
const field = (page: Page) => page.locator('canvas[aria-label="Night Passage combat arena"]');
async function screenPoint(canvas: Locator, point: Point) {
  const box = (await canvas.boundingBox())!;
  const camera = createCamera();
  fitCamera(camera, box.width / box.height);
  const ndc = new Vector3(point.x, 0, point.y).project(camera);
  return { x: box.x + ((ndc.x + 1) * box.width) / 2, y: box.y + ((1 - ndc.y) * box.height) / 2 };
}
async function savedState(page: Page) {
  return restoreChronicle((await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!)
    .state;
}

test('2.5D live movement, aim, dodge, casts and a complete ranged chamber', async ({ page }) => {
  test.setTimeout(browserBudget(60000));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=night-passage');
  await expect(field(page)).toHaveAttribute('data-view', 'scene');
  await page.getByRole('button', { name: 'Far Lantern bow' }).click();
  await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
  await expect(field(page)).toHaveAttribute('data-view', 'scene');
  await field(page).focus();
  const before = await savedState(page);
  await page.keyboard.down('d');
  await page.waitForTimeout(200);
  await page.keyboard.up('d');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
  const moved = await savedState(page);
  const a = await screenPoint(field(page), before.player);
  const b = await screenPoint(field(page), moved.player);
  expect(b.x).toBeGreaterThan(a.x + 10);
  expect(b.y).toBeCloseTo(a.y, 1);
  await page.keyboard.press('Escape');
  const target = moved.enemies[0];
  const aim = await screenPoint(field(page), target);
  await page.mouse.move(aim.x, aim.y);
  await page.keyboard.down('Space');
  await page.keyboard.down('q');
  await page.waitForTimeout(180);
  await page.keyboard.up('Space');
  await page.keyboard.up('q');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
  const cast = await savedState(page);
  expect(cast.player.casts).toBeLessThan(3);
  expect(cast.player.dashCooldown).toBeGreaterThan(0);
  expect(
    Math.hypot(cast.player.x - moved.player.x, cast.player.y - moved.player.y),
  ).toBeGreaterThan(30);
  await page.keyboard.press('Escape');
  await page.keyboard.down('j');
  await page.waitForTimeout(180);
  await page.screenshot({ path: `${review}/live-chamber.png`, fullPage: true });
  for (let i = 0; i < 70 && (await field(page).getAttribute('data-phase')) === 'combat'; i++) {
    const state = await savedState(page);
    const enemy = state.enemies.find((candidate) => candidate.hp > 0);
    if (enemy) {
      const point = await screenPoint(field(page), enemy);
      await page.mouse.move(point.x, point.y);
    }
    await page.waitForTimeout(250);
  }
  await page.keyboard.up('j');
  await expect(page.getByRole('heading', { name: 'Choose a blessing' })).toBeVisible();
  const reward = await savedState(page);
  expect(reward.roomsCleared).toBe(1);
  await page.locator('.np-choices button').first().click();
  await page.locator('.np-choices button').first().click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
  const text = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  await page.getByLabel('Arena view').selectOption('canvas');
  await expect(field(page)).toHaveAttribute('data-view', 'canvas');
  await page.getByLabel('Arena view').selectOption('scene');
  await expect(field(page)).toHaveAttribute('data-view', 'scene');
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(text);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(text);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${review}/compact-paused.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('guardian warning slice, live melee and context loss retain the chronicle', async ({
  page,
}) => {
  test.setTimeout(browserBudget(60000));
  let session = dispatch(createChronicle('passage-verification'), {
    type: 'start',
    weapon: 'sword',
    runes: ['vigor', 'fleet'],
  }).chronicle;
  const approaches = new Map<number, string>();
  for (
    let i = 0;
    i < 20000 && session.state.phase !== 'won' && session.state.phase !== 'lost';
    i++
  ) {
    if (
      session.state.room.boss &&
      session.state.enemies.some((enemy) => enemy.kind === 'boss' && enemy.windup >= 35) &&
      !approaches.has(session.state.region)
    )
      approaches.set(session.state.region, exportChronicle(session));
    session = dispatch(session, passageCommand(session.state)).chronicle;
  }
  expect(approaches.size).toBe(4);
  await page.goto('/?game=night-passage');
  for (const [region, text] of approaches) {
    await page.getByLabel('Import Night Passage chronicle').setInputFiles({
      name: 'guardian.json',
      mimeType: 'application/json',
      buffer: Buffer.from(text),
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(field(page)).toHaveAttribute('data-view', 'scene');
    // Capture the rendered warning without advancing its reconstructed rules state.
    await page
      .locator('.np-overlay')
      .evaluate((element: HTMLElement) => (element.style.visibility = 'hidden'));
    await page.screenshot({ path: `${review}/guardian-${region + 1}.png`, fullPage: true });
    await page
      .locator('.np-overlay')
      .evaluate((element: HTMLElement) => (element.style.visibility = ''));
  }
  const first = approaches.get(0)!;
  await page.getByLabel('Import Night Passage chronicle').setInputFiles({
    name: 'guardian.json',
    mimeType: 'application/json',
    buffer: Buffer.from(first),
  });
  const before = await savedState(page);
  await page.getByRole('button', { name: 'Resume passage', exact: true }).last().click();
  const boss = before.enemies.find((enemy) => enemy.kind === 'boss')!;
  const aim = await screenPoint(field(page), boss);
  await page.mouse.move(aim.x, aim.y);
  await page.keyboard.down('j');
  await page.waitForTimeout(300);
  await page.keyboard.up('j');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
  const after = await savedState(page);
  expect(after.tick).toBeGreaterThan(before.tick);
  expect(after.enemies.find((enemy) => enemy.id === boss.id)!.hp).toBeLessThan(boss.hp);
  const preserved = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  await field(page).evaluate((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('Context-loss extension unavailable for verification.');
    extension.loseContext();
  });
  await expect(field(page)).toHaveAttribute('data-view', 'canvas');
  await expect(
    page.getByRole('alert').filter({ hasText: '2.5D view became unavailable' }),
  ).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(preserved);
});
