import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { spireSession } from '../../src/games/spire/application/session';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('card-workshop.playback-speed', '100'));
});

test('all three legal losses render and restarting one game preserves the others', async ({
  page,
}) => {
  await page.goto('/');
  for (const [game, heading] of [
    ['balatro', 'Another hand. Another idea.'],
    ['spire', 'Defeat'],
    ['battlegrounds', 'You placed #8.'],
  ]) {
    await page.getByLabel('Choose game').selectOption(game);
    const name = game === 'balatro' ? 'blindside' : game;
    await page.getByLabel('Import replay file').setInputFiles(`tests/fixtures/${name}-loss.json`);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  const spireBefore = await page.evaluate((key) => localStorage.getItem(key), spireSession.key);
  await page.getByRole('button', { name: '+ New run' }).click();
  await page.getByLabel('Run seed').fill('KEYBOARD-NEW');
  await page.getByRole('button', { name: 'Start new run →' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Who will lead your warband?' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), spireSession.key)).toBe(
    spireBefore,
  );
  await page.getByLabel('Choose game').selectOption('spire');
  await page
    .getByLabel('Import replay file')
    .setInputFiles('tests/fixtures/battlegrounds-win.json');
  await expect(page.getByRole('alert')).toContainText('Incompatible game or rules version');
  expect(await page.evaluate((key) => localStorage.getItem(key), spireSession.key)).toBe(
    spireBefore,
  );
});

test('a corrupt stored run is archived before replacement, and valid Spire import is portable', async ({
  page,
}) => {
  await page.addInitScript(
    ({ key }) => {
      localStorage.setItem('card-workshop.active-game', 'spire');
      localStorage.setItem(key, '{broken save');
    },
    { key: spireSession.key },
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Save could not be loaded');
  expect(await page.evaluate((key) => localStorage.getItem(key), spireSession.key)).toBe(
    '{broken save',
  );
  await page.getByRole('button', { name: 'Obtain +8 Max HP', exact: true }).click();
  await page.getByRole('button', { name: 'Floor 1 lane 1 fight' }).click();
  const archived = await page.evaluate(
    (key) =>
      Object.keys(localStorage)
        .filter((k) => k.startsWith(`${key}.recovery.`))
        .map((k) => localStorage.getItem(k)),
    spireSession.key,
  );
  expect(archived).toEqual(['{broken save']);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const download = await downloadEvent;
  const exported = readFileSync((await download.path())!, 'utf8');
  const expected = spireSession.decode(exported);
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'export.json',
    mimeType: 'application/json',
    buffer: Buffer.from(exported),
  });
  expect(
    spireSession.decode(
      (await page.evaluate((key) => localStorage.getItem(key), spireSession.key))!,
    ),
  ).toEqual(expected);
});
