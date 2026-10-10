import { expect, test } from '@playwright/test';
import { arenaSession } from '../../src/games/battlegrounds/application/arena';
import { bgSession } from '../../src/games/battlegrounds/application/session';
import { mixedRivalsConfig } from '../../src/games/battlegrounds/domain/arena';
import { readFileSync } from 'node:fs';
import { replayCodec } from '../../src/shared/replay';

for (const first of ['classic', 'mixed'] as const) {
  test(`${first} hydrates only on first selection and preserves unsaved modes and practice`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(
      ({ first, keys }) => {
        localStorage.setItem('card-workshop.active-game', 'battlegrounds');
        localStorage.setItem('card-workshop.hearth-mode', first);
        const reads: string[] = [];
        Object.assign(window, { hearthReads: reads });
        const get = Storage.prototype.getItem.bind(localStorage);
        Storage.prototype.getItem = (key) => {
          if (keys.includes(key)) reads.push(key);
          return get(key);
        };
        Storage.prototype.setItem = () => {
          throw new DOMException('Full', 'QuotaExceededError');
        };
      },
      { first, keys: [bgSession.key, arenaSession.key] },
    );
    const reads = () =>
      page.evaluate(() => (window as unknown as { hearthReads: string[] }).hearthReads);
    const exportRun = async () => {
      const event = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Export', exact: true }).click();
      return readFileSync(await (await event).path(), 'utf8');
    };
    const firstKey = first === 'classic' ? bgSession.key : arenaSession.key;
    const otherKey = first === 'classic' ? arenaSession.key : bgSession.key;
    const firstLabel = first === 'classic' ? 'Classic' : 'Mixed Rivals';
    const otherLabel = first === 'classic' ? 'Mixed Rivals' : 'Classic';
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Who will lead your warband?' })).toBeVisible();
    expect(await reads()).toContain(firstKey);
    expect(await reads()).not.toContain(otherKey);
    await page.locator('.hero-choices > button').first().click();
    const firstRun = await exportRun();
    await expect(page.locator('.save-status')).toContainText('Storage unavailable');
    await page.getByRole('button', { name: otherLabel, exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Who will lead your warband?' })).toBeVisible();
    expect(await reads()).toContain(otherKey);
    await page.locator('.hero-choices > button').first().click();
    const otherRun = await exportRun();
    const visitedReads = await reads();
    await page.getByRole('button', { name: firstLabel, exact: true }).click();
    expect(await exportRun()).toBe(firstRun);
    await page.getByRole('button', { name: otherLabel, exact: true }).click();
    expect(await exportRun()).toBe(otherRun);
    expect(await reads()).toEqual(visitedReads);
    await page.getByRole('button', { name: 'Classic', exact: true }).click();
    const normal = await exportRun();
    await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
    await page.getByLabel('Replay decision').fill('0');
    await page.getByRole('button', { name: 'Play a branch from here' }).click();
    await expect(page.getByRole('button', { name: 'Return to normal run' })).toBeVisible();
    await page.locator('.hero-choices > button').first().click();
    const practice = await exportRun();
    expect(replayCodec(bgSession.rules, true).decode(practice).replay.mode).toBe('practice');
    await page.getByRole('button', { name: 'Mixed Rivals', exact: true }).click();
    await page.getByRole('button', { name: 'Classic', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Return to normal run' })).toBeVisible();
    expect(await exportRun()).toBe(practice);
    await page.getByRole('button', { name: 'Return to normal run' }).click();
    expect(await exportRun()).toBe(normal);
    expect(errors).toEqual([]);
  });
}

test('Mixed Rivals journals every seat, rotates priority, reloads, and preserves Classic', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('battlegrounds');
  await page.locator('.hero-choices > button').first().click();
  const classic = await page.evaluate((key) => localStorage.getItem(key), bgSession.key);
  await page.getByRole('button', { name: 'Mixed Rivals', exact: true }).click();
  await page.getByRole('button', { name: /The Archivist/ }).click();
  await expect(page.locator('.lobby-list')).toContainText('Tempo');
  await expect(page.locator('.lobby-list')).toContainText('Economy');
  await expect(page.locator('.lobby-list')).toContainText('Composition');
  await page.locator('.tavern-offers button').first().click();
  await page.locator('.recruit-hand button').first().click();
  await page.getByRole('button', { name: 'Ready · fight →' }).click();
  await expect(page.locator('.combat-replay')).toBeVisible();
  const saved = async () =>
    arenaSession.decode(
      (await page.evaluate((key) => localStorage.getItem(key), arenaSession.key))!,
    );
  expect(
    new Set((await saved()).replay.commands.filter((c) => c.type === 'seat').map((c) => c.seat))
      .size,
  ).toBe(8);
  await page.getByRole('button', { name: /Return to tavern/ }).click();
  await expect(page.locator('.tavern')).toBeVisible();
  const round2 = await saved();
  expect(round2.state.arena.order).toEqual([1, 2, 3, 4, 5, 6, 7, 0]);
  expect(round2.state.arena.cursor).toBe(7);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Mixed Rivals', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await saved()).toEqual(round2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('mixed-rivals-phone.png'), fullPage: true });
  await page.getByRole('button', { name: 'Rival inspector', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Mixed Rivals inspector' })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Economy');
  await page.getByText('Engine configuration', { exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: info.outputPath('mixed-rivals-inspector-phone.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Close rival inspector' }).click();
  await page.getByRole('button', { name: 'Classic', exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), bgSession.key)).toBe(classic);
  await page.getByRole('button', { name: 'Mixed Rivals', exact: true }).click();
  expect(await saved()).toEqual(round2);
  expect(errors).toEqual([]);
});

test('an imported arena prefix resumes rivals and exports their accepted commands', async ({
  page,
}) => {
  let session = arenaSession.act(arenaSession.create('MIXED-IMPORT'), {
    type: 'configure',
    config: mixedRivalsConfig('MIXED-IMPORT', 'oathkeeper'),
  }).session;
  session = arenaSession.act(session, {
    type: 'seat',
    seat: 0,
    action: { type: 'endRecruit' },
  }).session;
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('battlegrounds');
  await page.getByRole('button', { name: 'Mixed Rivals', exact: true }).click();
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'arena-prefix.json',
    mimeType: 'application/json',
    buffer: Buffer.from(arenaSession.encode(session)),
  });
  await expect(page.locator('.combat-replay')).toBeVisible();
  const raw = (await page.evaluate((key) => localStorage.getItem(key), arenaSession.key))!;
  const resumed = arenaSession.decode(raw);
  expect(resumed.replay.commands.length).toBeGreaterThan(2);
  expect(resumed.state.phase).toBe('combat');
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'classic.json',
    mimeType: 'application/json',
    buffer: Buffer.from(bgSession.encode(bgSession.create('CLASSIC'))),
  });
  await expect(page.getByRole('alert')).toContainText('Incompatible');
  expect(await page.evaluate((key) => localStorage.getItem(key), arenaSession.key)).toBe(raw);
});
