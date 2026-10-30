import { SAVE_KEY } from '../../src/games/night-passage/application/live-chronicle';
import { expect, test, type Download } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import {
  dispatch,
  exportChronicle,
  restoreChronicle,
  createChronicle,
} from '../../src/games/night-passage/application/chronicle';
import { passageCommand } from '../simulation/night-passage-policy';
import { boon } from '../../src/games/night-passage/domain/content';
import { browserBudget } from './budget';

const review = 'test-results/night-passage';
test.beforeEach(async ({ page }) => {
  mkdirSync(review, { recursive: true });
  // Preserve the baseline renderer's journeys alongside the separate 2.5D suite.
  await page.addInitScript(() =>
    localStorage.setItem('card-workshop.night-passage.view.v1', 'canvas'),
  );
});

for (const presentation of ['canvas', 'scene']) {
  test(`held Escape toggles pause once per press in ${presentation}`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-30T00:00:00Z') });
    await page.goto('/?game=night-passage');
    await page.getByLabel('Arena view').selectOption(presentation);
    await page.getByRole('button', { name: 'Sound on', exact: true }).click();
    await page.clock.pauseAt(new Date('2026-10-30T00:01:00Z'));
    await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
    const arena = page.getByLabel('Night Passage combat arena', { exact: true });
    const paused = page.getByRole('heading', { name: 'Passage paused', exact: true });
    await expect(arena).toHaveAttribute('data-view', presentation);
    await expect(arena).toBeFocused();
    await page.clock.runFor(100);

    await page.keyboard.down('Escape');
    await expect(paused).toBeVisible();
    const tick = await arena.getAttribute('data-tick');
    const saved = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
    await page.keyboard.down('Escape');
    await page.clock.runFor(100);
    await expect(paused).toBeVisible();
    await expect(arena).toHaveAttribute('data-tick', tick!);
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
    await page.keyboard.up('Escape');

    await page.keyboard.down('Escape');
    await expect(paused).toBeHidden();
    await page.keyboard.down('Escape');
    await page.clock.runFor(150);
    await expect(paused).toBeHidden();
    expect(Number(await arena.getAttribute('data-tick'))).toBeGreaterThan(Number(tick));
    await page.keyboard.up('Escape');
    await page.keyboard.press('Escape');
    await expect(paused).toBeVisible();

    await page.getByRole('button', { name: 'Resume passage', exact: true }).last().click();
    await expect(paused).toBeHidden();
    await page.keyboard.down('d');
    await page.keyboard.down('d');
    await page.clock.runFor(100);
    await page.keyboard.up('d');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(paused).toBeVisible();
    const moved = restoreChronicle(
      (await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!,
    ).state;
    const original = restoreChronicle(saved!).state;
    expect(
      Math.hypot(moved.player.x - original.player.x, moved.player.y - original.player.y),
    ).toBeGreaterThan(0);
  });
}

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
          const saved = restoreChronicle(
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

test('dodge readiness follows combat time and restores without changing the chronicle', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-16T00:00:00Z') });
  await page.goto('/?game=night-passage');
  await expect(page.getByRole('button', { name: 'Begin passage', exact: true })).toBeVisible();
  await page.clock.pauseAt(new Date('2026-10-16T00:01:00Z'));
  await page.getByRole('button', { name: 'Sound on', exact: true }).click();
  const readiness = page.getByRole('group', { name: 'Dodge readiness', exact: true });
  await expect(readiness).toHaveCount(0);
  await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
  await expect(readiness.locator('strong')).toHaveText('Ready');
  await page.keyboard.down('Space');
  await page.clock.runFor(50);
  await page.keyboard.up('Space');
  await expect(readiness).toContainText('Dodging');
  await page.screenshot({ path: `${review}/dodge-active.png`, fullPage: true });
  await page.clock.runFor(200);
  await expect(readiness).toContainText(/Ready in 0\.[1-6] s/);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Passage paused' })).toBeVisible();
  const saved = (await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!;
  await expect(page.locator('canvas[aria-label="Night Passage combat arena"]')).toHaveAttribute(
    'data-tick',
    String(restoreChronicle(saved).state.tick),
  );
  const pausedText = await readiness.locator('strong').innerText();
  await page.clock.runFor(1000);
  await expect(readiness.locator('strong')).toHaveText(pausedText);
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
  // Let React's lazy-loading timers run during navigation; combat remains paused.
  await page.clock.resume();
  await page.reload();
  await expect(readiness.locator('strong')).toHaveText(pausedText);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export chronicle', exact: true }).click();
  expect(readFileSync(await (await pending).path(), 'utf8')).toBe(saved);
  await page.getByLabel('Import Night Passage chronicle').setInputFiles({
    name: 'dodge-recovery.json',
    mimeType: 'application/json',
    buffer: Buffer.from(saved),
  });
  await expect(readiness.locator('strong')).toHaveText(pausedText);
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
  await page.screenshot({ path: `${review}/dodge-recovery.png`, fullPage: true });
  await page.getByRole('button', { name: 'Resume passage', exact: true }).last().click();
  await page.clock.runFor(1000);
  await expect(readiness.locator('strong')).toHaveText('Ready');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByLabel('Arena view').selectOption('scene');
  await expect(readiness.locator('strong')).toHaveText('Ready');
  await page.screenshot({ path: `${review}/dodge-ready-scene.png`, fullPage: true });
  // One recovery tick remains in this legal legacy replay, without Feather.
  const legacy = dispatch(
    dispatch(createChronicle('dodge-last-tick', 'night-passage-4'), {
      type: 'start',
      weapon: 'sword',
      runes: [],
    }).chronicle,
    {
      type: 'frame',
      ticks: 48,
      input: {
        x: 0,
        y: 0,
        aim: 0,
        attack: false,
        special: false,
        dash: true,
        cast: false,
        call: false,
      },
    },
  ).chronicle;
  expect(legacy.state.player.dashCooldown).toBe(1);
  const legacyText = exportChronicle(legacy);
  await page.getByLabel('Import Night Passage chronicle').setInputFiles({
    name: 'last-tick.json',
    mimeType: 'application/json',
    buffer: Buffer.from(legacyText),
  });
  await expect(readiness.locator('strong')).toHaveText('Ready in 0.1 s');
  await page.clock.runFor(1000);
  await expect(readiness.locator('strong')).toHaveText('Ready in 0.1 s');
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(legacyText);
  await page.getByRole('button', { name: 'Resume passage', exact: true }).last().click();
  await page.clock.runFor(100);
  await expect(readiness.locator('strong')).toHaveText('Ready');
});

// Depleted resources expose misleading availability even when ordinary attack journeys pass.
for (const [presentation, rules, runes, countdown] of [
  ['canvas', 'night-passage-5', [], '2.4 s'],
  ['scene', 'night-passage-4', ['focus'], '1.4 s'],
] as const) {
  test(`cast charges freeze, restore and replenish in ${presentation} (${rules})`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date('2026-10-16T00:00:00Z') });
    await page.goto('/?game=night-passage');
    await expect(page.getByRole('button', { name: 'Begin passage', exact: true })).toBeVisible();
    await page.clock.pauseAt(new Date('2026-10-16T00:01:00Z'));
    await page.getByRole('button', { name: 'Sound on', exact: true }).click();
    const casts = page.getByRole('group', { name: 'Cast charges', exact: true });
    const call = page.getByRole('group', { name: 'Call availability', exact: true });
    await expect(casts).toHaveCount(0);
    await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
    await expect(casts).toContainText('3 / 3 charges');
    await expect(casts).toContainText('Fully replenished');
    await expect(call).toContainText('No call equipped');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByLabel('Arena view').selectOption(presentation);
    const depleted = dispatch(
      dispatch(createChronicle('cast-availability', rules), {
        type: 'start',
        weapon: 'sword',
        runes: [...runes],
      }).chronicle,
      {
        type: 'frame',
        ticks: 100,
        input: {
          x: 0,
          y: 0,
          aim: 0,
          attack: false,
          special: false,
          dash: false,
          cast: true,
          call: false,
        },
      },
    );
    expect(depleted.error).toBeNull();
    expect(depleted.chronicle.state.player.casts).toBe(0);
    expect(depleted.chronicle.state.player.castClock).toBe(99);
    const saved = exportChronicle(depleted.chronicle);
    await page.getByLabel('Import Night Passage chronicle').setInputFiles({
      name: 'empty-casts.json',
      mimeType: 'application/json',
      buffer: Buffer.from(saved),
    });
    await expect(casts).toContainText('0 / 3 charges');
    await expect(casts).toContainText(`Next charge in ${countdown}`);
    const pausedText = await casts.innerText();
    await page.clock.runFor(1000);
    await expect(casts).toHaveText(pausedText, { useInnerText: true });
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
    await page.clock.resume();
    await page.reload();
    await expect(casts).toHaveText(pausedText, { useInnerText: true });
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
    // The suite's init script selects Canvas on every navigation; restore this case's view.
    await page.getByLabel('Arena view').selectOption(presentation);
    await expect(page.locator('canvas[aria-label="Night Passage combat arena"]')).toHaveAttribute(
      'data-view',
      presentation,
    );
    await page.clock.pauseAt(new Date('2026-10-16T00:02:00Z'));
    await page.screenshot({ path: `${review}/cast-empty-${presentation}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Resume passage', exact: true }).last().click();
    await page.clock.runFor(2500);
    await expect(casts).toContainText('1 / 3 charges');
    await expect(casts).toContainText('Next charge in');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `${review}/cast-recharging-${presentation}-phone.png`,
      fullPage: true,
    });
  });
}

test('call availability requires a boon even at full charge and resets after use', async ({
  page,
}) => {
  test.setTimeout(browserBudget(45000));
  let session = dispatch(createChronicle('spell-availability'), {
    type: 'start',
    weapon: 'bow',
    runes: ['vigor', 'focus'],
  }).chronicle;
  let missing = '';
  let charged = '';
  // Produce portable checkpoints through legal play, never injected player state.
  for (let i = 0; i < 12000; i++) {
    const hasCall = session.state.player.boons.some((entry) => boon(entry.id).slot === 'call');
    if (session.state.phase === 'combat' && session.state.player.charge === 100) {
      if (!hasCall && !missing) missing = exportChronicle(session);
      if (hasCall) {
        charged = exportChronicle(session);
        break;
      }
    }
    if (session.state.phase === 'won' || session.state.phase === 'lost') break;
    let command = passageCommand(session.state);
    if (session.state.phase === 'reward') {
      const id = session.state.offers.find((id) =>
        missing ? boon(id).slot === 'call' : boon(id).slot !== 'call',
      );
      if (id && !hasCall) command = { type: 'choose', id };
    }
    if (command.type === 'frame')
      command = { ...command, input: { ...command.input, call: false, cast: false } };
    const result = dispatch(session, command);
    expect(result.error).toBeNull();
    session = result.chronicle;
  }
  expect(missing).not.toBe('');
  expect(charged).not.toBe('');
  await page.clock.install({ time: new Date('2026-10-16T00:00:00Z') });
  await page.goto('/?game=night-passage');
  await expect(page.getByRole('button', { name: 'Begin passage', exact: true })).toBeVisible();
  await page.clock.pauseAt(new Date('2026-10-16T00:01:00Z'));
  await page.getByRole('button', { name: 'Sound on', exact: true }).click();
  const call = page.getByRole('group', { name: 'Call availability', exact: true });
  const importSave = async (text: string) => {
    await page.getByLabel('Import Night Passage chronicle').setInputFiles({
      name: 'call-availability.json',
      mimeType: 'application/json',
      buffer: Buffer.from(text),
    });
  };
  await importSave(missing);
  await expect(call).toContainText('No call equipped');
  await importSave(charged);
  await expect(call.locator('strong')).toHaveText('Charged');
  await page.clock.runFor(1000);
  await expect(call.locator('strong')).toHaveText('Charged');
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(charged);
  await page.clock.resume();
  await page.reload();
  await expect(call.locator('strong')).toHaveText('Charged');
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(charged);
  await page.clock.pauseAt(new Date('2026-10-16T00:02:00Z'));
  await page.getByLabel('Arena view').selectOption('scene');
  await expect(call.locator('strong')).toHaveText('Charged');
  await page.screenshot({ path: `${review}/call-charged-scene.png`, fullPage: true });
  await page.getByRole('button', { name: 'Resume passage', exact: true }).last().click();
  await page.keyboard.down('r');
  await page.clock.runFor(150);
  await page.keyboard.up('r');
  await expect(call.locator('strong')).toHaveText(/Charging \d+%/);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const used = (await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!;
  const charge = restoreChronicle(used).state.player.charge;
  expect(charge).toBeLessThan(100);
  await expect(call.locator('strong')).toHaveText(`Charging ${Math.floor(charge)}%`);
  await page.getByLabel('Arena view').selectOption('canvas');
  await expect(call.locator('strong')).toHaveText(`Charging ${Math.floor(charge)}%`);
  await page.screenshot({ path: `${review}/call-charging-canvas.png`, fullPage: true });
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
  const aimed = restoreChronicle(
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
      const state = restoreChronicle(saved).state;
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
  expect(restoreChronicle(saved).state.player.weapon).toBe('bow');
  expect(restoreChronicle(saved).state.player.boons).toHaveLength(1);
  // The HUD refreshes less often than rules; wait for the final confirmed frame on pause.
  await expect(field).toHaveAttribute('data-tick', String(restoreChronicle(saved).state.tick));
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

test('legal first-room blessing draft offers distinct slots and survives choice, reload and replay', async ({
  page,
}) => {
  test.setTimeout(browserBudget(45000));
  let session = dispatch(createChronicle('passage-verification'), {
    type: 'start',
    weapon: 'bow',
    runes: ['vigor', 'fleet'],
  }).chronicle;
  for (let i = 0; i < 3000 && session.state.phase === 'combat'; i++) {
    const result = dispatch(session, passageCommand(session.state));
    expect(result.error).toBeNull();
    session = result.chronicle;
  }
  expect(session.state.phase).toBe('reward');
  expect(session.state.roomsCleared).toBe(1);
  expect(session.state.room.reward).toBe('boon');
  const checkpoint = exportChronicle(session),
    offered = session.state.offers.map(boon);
  const occupied = new Set(session.state.player.boons.map((entry) => boon(entry.id).slot));
  const choiceIndex = offered.findIndex(
    (entry) => entry.slot !== 'duo' && !occupied.has(entry.slot),
  );
  expect(choiceIndex).toBeGreaterThanOrEqual(0);
  await page.goto('/?game=night-passage');
  await page.getByLabel('Import Night Passage chronicle').setInputFiles({
    name: 'first-room-blessings.json',
    mimeType: 'application/json',
    buffer: Buffer.from(checkpoint),
  });
  await expect(page.getByRole('heading', { name: 'Choose a blessing' })).toBeVisible();
  const choices = page.locator('.np-choices button');
  await expect(choices).toHaveCount(3);
  const labels = await choices.locator('.np-eyebrow').allTextContents();
  const slots = labels.map((text) => text.split(' · ')[0]);
  expect(new Set(slots).size).toBe(3);
  expect(slots).toEqual(offered.map((entry) => entry.slot));
  expect(labels.every((text) => text.endsWith('New blessing'))).toBe(true);
  for (const [index, entry] of offered.entries())
    await expect(choices.nth(index).locator('strong')).toHaveText(entry.name);
  await page.screenshot({ path: `${review}/distinct-slot-blessing-draft.png`, fullPage: true });
  const selected = offered[choiceIndex];
  const expected = dispatch(session, { type: 'choose', id: selected.id });
  expect(expected.error).toBeNull();
  await choices.nth(choiceIndex).click();
  await expect(page.getByRole('heading', { name: 'Choose your next chamber' })).toBeVisible();
  await expect(page.locator('.np-build article strong')).toHaveText(selected.name);
  const saved = (await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!;
  expect(saved).toBe(exportChronicle(expected.chronicle));
  expect(JSON.parse(saved) as { rules: string; content: string }).toMatchObject({
    rules: 'night-passage-5',
    content: 'night-passage-content-4',
  });
  expect(restoreChronicle(saved).state.player.boons).toEqual([{ id: selected.id, level: 1 }]);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Choose your next chamber' })).toBeVisible();
  await expect(page.locator('.np-build article strong')).toHaveText(selected.name);
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export chronicle' }).click();
  const portable = readFileSync(await (await pending).path(), 'utf8');
  expect(portable).toBe(saved);
  expect(restoreChronicle(portable).state).toEqual(expected.chronicle.state);
  await page.getByLabel('Import Night Passage chronicle').setInputFiles({
    name: 'chosen-blessing.json',
    mimeType: 'application/json',
    buffer: Buffer.from(portable),
  });
  await expect(page.getByRole('alert')).toHaveText('Chronicle restored.');
  await expect(page.locator('.np-build article strong')).toHaveText(selected.name);
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
});

test('reconstructed victory banks progression, unlocks runes and starts a distinct second run', async ({
  page,
}) => {
  let session = dispatch(createChronicle('passage-verification'), {
    type: 'start',
    weapon: 'sword',
    runes: ['vigor', 'fleet'],
  }).chronicle;
  for (let i = 0; i < 20000 && session.state.phase !== 'won' && session.state.phase !== 'lost'; i++)
    session = dispatch(session, passageCommand(session.state)).chronicle;
  expect(session.state.phase).toBe('won');
  const text = exportChronicle(session);
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
  const saved = restoreChronicle(
    (await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!,
  );
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
  expect(restoreChronicle(readFileSync(await playable.path(), 'utf8')).state.runNumber).toBe(1);
  expect(
    restoreChronicle((await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!).state
      .phase,
  ).toBe('hub');
  await page.reload(); // The init script restores the unreadable original for the replacement path.
  await page.getByRole('button', { name: 'Replace unreadable save with a new chronicle' }).click();
  expect(
    restoreChronicle((await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!).state
      .phase,
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
  const original = restoreChronicle(readFileSync(await (await pending).path(), 'utf8'));
  expect(original.state.runNumber).toBe(1);
  const reset = restoreChronicle(
    (await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!,
  );
  expect(reset.state.seed).toBe('another-dawn');
  expect(reset.state.profile).toMatchObject({ ash: 0, runs: 0, wins: 0 });
  await expect(page.getByRole('heading', { name: 'Carry a light into the dark.' })).toBeVisible();
});

test('a failed replacement write retains the original download and playable import until retry', async ({
  page,
}) => {
  await page.addInitScript((key) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, 'original recovery bytes');
    localStorage.setItem('card-workshop.night-passage.view.v1', 'canvas');
  }, SAVE_KEY);
  await page.goto('/?game=night-passage');
  const imported = exportChronicle(
    dispatch(createChronicle('recovery-replacement'), {
      type: 'start',
      weapon: 'bow',
      runes: ['vigor'],
    }).chronicle,
  );
  const importFile = page.getByLabel('Import Night Passage chronicle');
  await importFile.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{bad'),
  });
  await expect(page.getByRole('button', { name: 'Download original save' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(
    'original recovery bytes',
  );
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- restored on the prototype and invoked with its original receiver.
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'card-workshop.night-passage.v1') {
        // One failed write, then the genuine browser store is available for a later flush.
        Storage.prototype.setItem = write;
        throw new Error('replacement write denied');
      }
      write.call(this, key, value);
    };
  });
  await importFile.setInputFiles({
    name: 'valid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(imported),
  });
  await expect(page.getByRole('status')).toContainText('Storage unavailable');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download original save' }).click();
  expect(readFileSync(await (await pending).path(), 'utf8')).toBe('original recovery bytes');
  const exportPending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export chronicle', exact: true }).click();
  expect(readFileSync(await (await exportPending).path(), 'utf8')).toBe(imported);
  await page.getByRole('button', { name: 'Watch replay', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Night Passage · Replay' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(imported);
});

test('reconstructed guardian approaches render their distinct warnings and remain pausable', async ({
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
      session.state.phase === 'combat' &&
      session.state.room.boss &&
      session.state.enemies.some((e) => e.kind === 'boss' && e.windup >= 35) &&
      !approaches.has(session.state.region)
    )
      approaches.set(session.state.region, exportChronicle(session));
    session = dispatch(session, passageCommand(session.state)).chronicle;
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
