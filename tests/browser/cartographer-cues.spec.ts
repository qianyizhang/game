import { expect, test } from '@playwright/test';
import { importSession, SAVE_KEY } from '../../src/games/cartographer/application/session';

test('occupied frontiers retain direction and threat cues preserve commands at phone size', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?game=cartographer');
  await page.getByLabel('Difficulty', { exact: true }).selectOption('relaxed');
  const room = page.getByRole('group', { name: 'Tactical room', exact: true });
  for (const [direction, key] of [
    ['east', 'ArrowRight'],
    ['south', 'ArrowDown'],
    ['west', 'ArrowLeft'],
    ['north', 'ArrowUp'],
  ] as const) {
    await page.getByRole('button', { name: 'New expedition', exact: true }).click();
    await room.focus();
    for (let step = 0; step < 3; step++) await page.keyboard.press(key);
    const door = page.getByRole('button', {
      name: new RegExp(`Keeper \\(you\\); ${direction} doorway$`),
    });
    await expect(door).toBeEnabled();
    await expect(door.locator('.dc-frontier-cue')).toBeVisible();
    await expect(page.locator('.dc-tile.door')).toHaveCount(4);
    await room.screenshot({ path: info.outputPath(`${direction}-320.png`) });
    const arrived = importSession(
      await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY),
    );
    expect(arrived.replay.commands).toEqual(
      Array.from({ length: 3 }, () => ({ type: 'move', direction })),
    );
    if (direction === 'south') {
      await room.focus();
      await page.keyboard.press('e');
    } else await door.click();
    await expect(page.getByRole('region', { name: 'Room draft' })).toBeVisible();
    expect(
      importSession(await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY)).replay
        .commands,
    ).toEqual([...arrived.replay.commands, { type: 'explore', direction }]);
  }
  const first = page.locator('.dc-offers article').first();
  await first.getByRole('button', { name: /Rotate/ }).click();
  await first.getByRole('button', { name: /^Place / }).click();
  for (let step = 0; step < 3; step++)
    await page.getByRole('button', { name: /^Brace \/ wait/ }).click();
  const threatened = page.getByRole('button', {
    name: '22,16: Keeper (you); threatened for 2',
    exact: true,
  });
  await expect(page.locator('.dc-tile.danger')).toHaveCount(1);
  await expect(threatened.locator('.dc-danger-dot')).toBeVisible();
  const saved = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
  await room.screenshot({ path: info.outputPath('threat-320.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.reload();
  await expect(threatened).toBeVisible();
  await expect(threatened.locator('.dc-danger-dot')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(saved);
  expect(errors).toEqual([]);
});
