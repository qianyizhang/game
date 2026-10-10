import { browserBudget } from './budget';
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { playCampaign } from '../../packages/diablo2/src/domain/campaign-policy';
import {
  exportSession,
  importSession,
  SAVE_KEY,
  SANDBOX_SAVE_KEY,
  ACTIVE_MODE_KEY,
  dispatch,
  newSession,
} from '../../packages/diablo2/src/application/session';
import { distance, lineOfSight } from '../../packages/diablo2/src/domain/maps';
import { currentWorld } from '../../packages/diablo2/src/domain/world';
import { camera, TILE } from '../../packages/diablo2/src/ui/render';
import { bodyFits } from '../../packages/diablo2/src/domain/maps';
import { BASE_CONTENT } from '../../packages/diablo2/src/domain/content';
const review = 'test-results/emberwake';

test('real hero selection, town shopping, movement, spells, pause, and save reload', async ({
  page,
}) => {
  test.setTimeout(browserBudget(45000));
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
  const framesBefore = await canvas.evaluate((c) => ({
    frames: Number(c.dataset.frames),
    ticks: Number(c.dataset.ticks),
  }));
  await page.waitForTimeout(1000);
  const framesAfter = await canvas.evaluate((c) => ({
    frames: Number(c.dataset.frames),
    ticks: Number(c.dataset.ticks),
  }));
  console.log(
    `Emberwake 1 s observation: ${framesAfter.frames - framesBefore.frames} rendered frames, ${framesAfter.ticks - framesBefore.ticks} simulation steps`,
  );
  expect(framesAfter.frames - framesBefore.frames).toBeGreaterThan(
    (framesAfter.ticks - framesBefore.ticks) * 1.5,
  );
  await page.keyboard.down('d');
  await page.waitForTimeout(900);
  await page.keyboard.up('d');
  await canvas.click({ position: { x: 260, y: 150 }, button: 'right' });
  await expect(page.locator('.ew-topline')).toContainText('Mira · Sorceress');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Paused', exact: true })).toBeVisible();
  const saved = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
  const state = importSession(saved).state;
  expect(state.player.x).toBeGreaterThan(8.5);
  expect(state.player.mana).toBeLessThan(110);
  await page.getByRole('button', { name: 'Resume journey', exact: true }).click();
  await canvas.focus();
  const foe = currentWorld(state)
    .enemies.filter(
      (e) =>
        e.hp > 0 &&
        distance(e, state.player) < 7 &&
        lineOfSight(currentWorld(state), state.player, e),
    )
    .sort((a, b) => distance(a, state.player) - distance(b, state.player))[0];
  expect(foe).toBeDefined();
  await page.keyboard.press('Space');
  await expect
    .poll(
      async () => {
        const text = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
        return currentWorld(importSession(text).state).enemies.find((e) => e.uid === foe.uid)?.hp;
      },
      { timeout: browserBudget(15000) },
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
  await expect(page.getByRole('heading', { name: 'Lantern Approach', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paused', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('campaign replay reaches the ending; mod import preserves invalid-save recovery', async ({
  page,
}) => {
  test.setTimeout(browserBudget(60000));
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

test('real stairs traverse persistent dungeon floors; legacy demo storage stays recoverable', async ({
  page,
}) => {
  test.setTimeout(browserBudget(45000));
  const legacy = 'original-demo-bytes';
  await page.addInitScript(
    (value) => localStorage.setItem('card-workshop.emberwake.v1', value),
    legacy,
  );
  const campaign = playCampaign('barbarian', 'browser-stairs').session;
  let prefix = newSession(campaign.replay.seed, campaign.replay.hero, campaign.replay.content);
  for (const command of campaign.replay.commands) {
    const next = dispatch(prefix, command).session;
    if (prefix.state.region === 'fen-3' && next.state.region === 'fen-4') break;
    prefix = next;
  }
  expect(prefix.state.region).toBe('fen-3');
  await page.goto('/?game=diablo2');
  await expect(page.getByRole('button', { name: 'Export original demo save' })).toBeVisible();
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({
      name: 'stairs.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportSession(prefix)),
    });
  await page.getByRole('button', { name: 'Resume journey', exact: true }).click();
  const canvas = page.locator('.ew-canvas-wrap canvas');
  await canvas.focus();
  await page.keyboard.press('f');
  await expect(page.getByRole('heading', { name: 'Buried Sanctuary', exact: true })).toBeVisible();
  await expect(page.locator('.ew-header')).toContainText('Floor 2');
  const first = importSession(await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY));
  await page.keyboard.press('f');
  await expect(page.getByRole('heading', { name: 'Root Cellars', exact: true })).toBeVisible();
  await page.keyboard.press('f');
  await expect(page.getByRole('heading', { name: 'Buried Sanctuary', exact: true })).toBeVisible();
  const returned = importSession(
    await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY),
  );
  expect(currentWorld(returned.state).enemies.map((e) => e.uid)).toEqual(
    currentWorld(first.state).enemies.map((e) => e.uid),
  );
  expect(currentWorld(returned.state).seen).toEqual(
    expect.arrayContaining(currentWorld(first.state).seen),
  );
  await page.keyboard.press('j');
  await expect(page.getByRole('dialog')).toContainText('Heart of the Briar · floor 3');
  await page.keyboard.press('Escape');
  await page.screenshot({ path: `${review}/dungeon-floor.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Buried Sanctuary', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('card-workshop.emberwake.v1'))).toBe(
    legacy,
  );
});

test('developer atlas reaches every region and floor, reloads separately, and preserves the campaign', async ({
  page,
}) => {
  test.setTimeout(browserBudget(90000));
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?game=diablo2');
  await page.getByRole('button', { name: 'Begin journey', exact: true }).click();
  const original = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  await page.getByRole('button', { name: 'Developer tools · F8', exact: true }).click();
  for (const region of BASE_CONTENT.regions) {
    const act = BASE_CONTENT.acts.find((a) => a.id === region.act)!;
    await page
      .getByRole('navigation', { name: 'Choose act' })
      .getByRole('button', { name: new RegExp(act.name) })
      .click();
    await page
      .locator('.ew-dev-regions, .ew-dev-floors')
      .getByRole('button', { name: new RegExp(region.name) })
      .click();
    if (region.boss) await page.getByRole('button', { name: 'Boss', exact: true }).click();
    else if (region.ward) await page.getByRole('button', { name: 'Ward', exact: true }).click();
    await page.getByRole('button', { name: new RegExp(`^Jump to ${region.name}`) }).click();
    await expect(page.getByRole('heading', { name: region.name, exact: true })).toBeVisible();
    const canvas = page.locator('.ew-canvas-wrap canvas');
    await expect(canvas).toHaveAttribute('data-map-reveal', 'full');
    await expect(page.locator('.ew-sandbox-banner')).toContainText('God mode');
    await page.getByRole('button', { name: 'Developer tools · F8', exact: true }).click();
  }
  await page.screenshot({ path: `${review}/developer-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${review}/developer-mobile.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('checkbox', { name: 'God mode · infinite life, mana & stamina' }).uncheck();
  await page.getByRole('checkbox', { name: 'Reveal map · no fog' }).uncheck();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.ew-canvas-wrap canvas')).toHaveAttribute(
    'data-map-reveal',
    'explored',
  );
  await page.reload();
  await expect(page.locator('.ew-sandbox-banner')).toContainText('Normal damage');
  expect(await page.evaluate((key) => localStorage.getItem(key), ACTIVE_MODE_KEY)).toBe('sandbox');
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(original);
  await page.getByRole('button', { name: 'Return to campaign', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lantern Refuge', exact: true })).toBeVisible();
  await expect(page.locator('.ew-topline')).toContainText('Lv. 1');
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(original);
  expect(errors).toEqual([]);
});

for (const hero of BASE_CONTENT.heroes)
  test(`visible accepted skill effects for ${hero.className}, pause controls, and summoning`, async ({
    page,
  }) => {
    await page.goto('/?game=diablo2');
    await page.getByRole('button', { name: new RegExp(`${hero.className} ${hero.name}`) }).click();
    await page.getByRole('button', { name: 'Developer sandbox · Lv. 20', exact: true }).click();
    await page.getByRole('button', { name: /^Jump to Lantern Approach/ }).click();
    const canvas = page.locator('.ew-canvas-wrap canvas');
    await expect(page.locator('.ew-topline')).toContainText('Lv. 20');
    if (hero.id === 'necromancer') {
      await canvas.focus();
      await page.keyboard.press('e');
      await expect(page.getByRole('status')).toContainText('slain enemy body');
      await expect(canvas).not.toHaveAttribute('data-effects', /raise/);
    }
    // Bodies are placed after arrival so a region reset cannot remove them.
    await page.getByRole('button', { name: 'Developer tools · F8', exact: true }).click();
    await page.getByRole('button', { name: 'Place practice bodies', exact: true }).click();
    await page.getByRole('button', { name: 'Close · Esc', exact: true }).click();
    for (const [index, id] of hero.skills.entries()) {
      const saved = importSession(
        await page.evaluate((key) => localStorage.getItem(key)!, SANDBOX_SAVE_KEY),
      );
      const p = saved.state.player,
        w = currentWorld(saved.state),
        c = camera(saved.state);
      const target = [
        { x: p.x + 2, y: p.y },
        { x: p.x - 2, y: p.y },
        { x: p.x, y: p.y + 2 },
      ].find((at) => bodyFits(w, at) && lineOfSight(w, p, at))!;
      const bounds = (await canvas.boundingBox())!;
      await canvas.hover({
        position: {
          x: ((target.x - c.x) * TILE * bounds.width) / 960,
          y: ((target.y - c.y) * TILE * bounds.height) / 576,
        },
      });
      await canvas.focus();
      if (id === 'cleave') {
        await canvas.hover({ position: { x: bounds.width - 15, y: bounds.height - 15 } });
        await page.locator('.ew-hotbar button').nth(index).click();
      } else await page.keyboard.press(['q', 'e', 'r'][index]);
      await page.waitForTimeout(200);
      await page.keyboard.press('Escape');
      await expect(canvas).toHaveAttribute('data-effects', new RegExp(id));
      const frozen = await canvas.screenshot();
      await page.waitForTimeout(150);
      expect(await canvas.screenshot()).toEqual(frozen);
      // Inspect the actual renderer pixels, without the HTML pause overlay dimming them.
      writeFileSync(
        `${review}/vfx-${id}.png`,
        Buffer.from(
          await canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL().split(',')[1]),
          'base64',
        ),
      );
      await expect(page.locator('.ew-hotbar button').nth(index)).toBeDisabled();
      const pausedSave = await page.evaluate((key) => localStorage.getItem(key), SANDBOX_SAVE_KEY);
      await page.keyboard.press(['q', 'e', 'r'][index]);
      expect(await page.evaluate((key) => localStorage.getItem(key), SANDBOX_SAVE_KEY)).toBe(
        pausedSave,
      );
      await page.keyboard.press('Escape');
    }
    if (hero.id === 'necromancer') {
      const saved = importSession(
        await page.evaluate((key) => localStorage.getItem(key)!, SANDBOX_SAVE_KEY),
      );
      expect(currentWorld(saved.state).allies.length).toBeGreaterThan(0);
      expect(currentWorld(saved.state).enemies.some((e) => e.hp === -1)).toBe(true);
    }
    await canvas.focus();
    await page.keyboard.down('i');
    await page.keyboard.down('i');
    await expect(page.getByRole('dialog', { name: 'Inventory and stash' })).toBeVisible();
    await page.keyboard.up('i');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
