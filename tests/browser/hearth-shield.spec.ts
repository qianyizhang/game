import { expect, test } from '@playwright/test';
import { bgSession } from '../../src/games/battlegrounds/application/session';
import { replayCodec } from '../../src/shared/replay';

const practice = replayCodec(bgSession.rules, true);

test('shield loss stays distinct from health damage while combat can be inspected and replayed', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('battlegrounds');
  const normal = await page.evaluate((key) => localStorage.getItem(key), bgSession.key);
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  await page.getByLabel('Scenario seed').fill('SHIELD-FEEDBACK-1');
  await page
    .getByLabel('Scenario setup')
    .fill(JSON.stringify({ hero: 'forgekeeper', tier: 3, gold: 10, board: ['pup', 'cobalt'] }));
  await page.getByRole('button', { name: /^Start practice scenario/ }).click();
  await page.getByRole('button', { name: 'Ready · fight →' }).click();
  const raw = await page.evaluate((key) => localStorage.getItem(key), practice.key);
  const result = practice.decode(raw!).state.lastCombat!;
  const stage = page.locator('.combat-replay');
  const cursor = page.getByLabel('Combat event', { exact: true });
  await cursor.fill('0');
  await expect(stage.locator('.hearth-shield-break')).toHaveCount(0);
  await expect(stage.getByRole('button', { name: /Clockwork Pup.*Shield/ })).toBeVisible();
  await cursor.fill('1');
  const pup = stage.getByRole('button', {
    name: 'Clockwork Pup, 2 attack, 1 health, Shield broken',
    exact: true,
  });
  await expect(pup.locator('.hearth-shield-break')).toHaveText('Shield broken');
  await expect(stage.locator('.hearth-shield-break')).toHaveCount(1);
  await expect(stage.locator('.hearth-shield-summary')).toHaveText(
    'Shield broken · Your Clockwork Pup (slot 1)',
  );
  await expect(stage.locator('.combat-caption')).toHaveAttribute('aria-live', 'polite');
  await expect(
    stage.getByRole('button', { name: /Copper Beetle, 4 attack, 1 health/ }),
  ).toBeVisible();
  await expect(stage.getByRole('button', { name: /Cobalt Guardian.*Shield/ })).toBeVisible();
  // The paused badge persists beyond its finite emphasis; speed changes cannot consume it.
  await page.getByLabel('Playback speed').selectOption('200');
  await page.waitForTimeout(750);
  await expect(cursor).toHaveValue('1');
  await expect(pup.locator('.hearth-shield-break')).toBeVisible();
  await pup.focus();
  await page.keyboard.press('Enter');
  await expect(stage.locator('.selected-minion-detail')).toContainText('Clockwork Pup');
  for (let index = 2; index < result.frames.length; index++) {
    await cursor.fill(String(index));
    await expect(stage.locator('.hearth-shield-break')).toHaveCount(0);
    await expect(stage.locator('.combat-caption')).toHaveText(result.frames[index].text);
  }
  await cursor.fill('1'); // Seeking backwards compares chronological frames, not the last viewed frame.
  await expect(pup.locator('.hearth-shield-break')).toBeVisible();
  await page.getByRole('button', { name: 'Play replay', exact: true }).click();
  await expect(stage.locator('.hearth-shield-break')).toHaveCount(0);
  await cursor.fill('1');
  await expect(pup.locator('.hearth-shield-break')).toBeVisible();
  await stage.screenshot({ path: info.outputPath('hearth-desktop.png'), animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(pup.locator('.hearth-shield-break svg')).toHaveCSS('animation-name', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await stage.screenshot({ path: info.outputPath('hearth-phone.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Previous combat event' }).focus();
  await page.keyboard.press('Enter');
  await expect(stage.locator('.hearth-shield-break')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next combat event' }).click();
  await expect(pup.locator('.hearth-shield-break')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), practice.key)).toBe(raw);
  expect(await page.evaluate((key) => localStorage.getItem(key), bgSession.key)).toBe(normal);
  await page.reload();
  expect(await page.evaluate((key) => localStorage.getItem(key), practice.key)).toBe(raw);
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  await page.getByRole('button', { name: 'Resume last practice', exact: true }).click();
  await page.getByLabel('Combat event', { exact: true }).fill('1');
  await expect(page.locator('.hearth-shield-break')).toHaveCount(1);
  expect(errors).toEqual([]);
});
