import { objectValue } from '../../src/shared/json';
import { expect, test } from '@playwright/test';
import { blindsideSession } from '../../src/games/balatro/application/session';
import { spireSession } from '../../src/games/spire/application/session';
import { bgSession } from '../../src/games/battlegrounds/application/session';

const games = [
  {
    id: 'balatro',
    key: blindsideSession.key,
    archive: blindsideSession.encode(blindsideSession.create('IMPORT-ORIGINAL')),
    firstAction: 'Play Small Blind ↗',
  },
  {
    id: 'spire',
    key: spireSession.key,
    archive: spireSession.encode(spireSession.create('IMPORT-ORIGINAL')),
    firstAction: 'Obtain +8 Max HP',
  },
  {
    id: 'battlegrounds',
    key: bgSession.key,
    archive: bgSession.encode(bgSession.create('IMPORT-ORIGINAL')),
    firstAction: '',
  },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const read = Reflect.get(File.prototype, 'text');
    File.prototype.text = async function () {
      if (this.name === 'unreadable.json') throw new Error('File read failed');
      if (this.name === 'delayed.json') {
        Object.assign(window, { replayReadFinished: false });
        await new Promise<void>((resolve) => {
          Object.assign(window, { releaseReplayImport: resolve });
        });
      }
      const text = await read.call(this);
      if (this.name === 'delayed.json') Object.assign(window, { replayReadFinished: true });
      return text;
    };
  });
});

for (const game of games) {
  test(`${game.id} handles failed and oversized reads and preserves a newer move`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await page.getByLabel('Choose game').selectOption(game.id);
    const input = page.getByLabel('Import replay file');
    const before = await page.evaluate((key) => localStorage.getItem(key), game.key);
    await input.setInputFiles({
      name: 'unreadable.json',
      mimeType: 'application/json',
      buffer: Buffer.from(game.archive),
    });
    await expect(page.getByRole('alert')).toContainText('File read failed');
    await expect(input).toHaveValue('');
    await input.setInputFiles({
      name: 'oversized.json',
      mimeType: 'application/json',
      buffer: Buffer.alloc(2_000_001),
    });
    await expect(page.getByRole('alert')).toContainText('maximum 2 MB');
    expect(await page.evaluate((key) => localStorage.getItem(key), game.key)).toBe(before);
    await input.setInputFiles({
      name: 'delayed.json',
      mimeType: 'application/json',
      buffer: Buffer.from(game.archive),
    });
    await page.waitForFunction(() => 'releaseReplayImport' in window);
    if (game.firstAction)
      await page.getByRole('button', { name: game.firstAction, exact: true }).click();
    else await page.locator('.hero-choices > button').first().click();
    const current = await page.evaluate((key) => localStorage.getItem(key), game.key);
    expect(objectValue(JSON.parse(current!)).commands).toHaveLength(1);
    await page.evaluate(() =>
      (window as unknown as { releaseReplayImport: () => void }).releaseReplayImport(),
    );
    await page.waitForFunction(
      () => (window as unknown as { replayReadFinished: boolean }).replayReadFinished,
    );
    expect(await page.evaluate((key) => localStorage.getItem(key), game.key)).toBe(current);
    await page.reload();
    expect(await page.evaluate((key) => localStorage.getItem(key), game.key)).toBe(current);
    expect(errors).toEqual([]);
  });
}

test('a later replay import supersedes a pending read', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Import replay file');
  await input.setInputFiles({
    name: 'delayed.json',
    mimeType: 'application/json',
    buffer: Buffer.from(games[0].archive),
  });
  await page.waitForFunction(() => 'releaseReplayImport' in window);
  const newer = blindsideSession.encode(blindsideSession.create('IMPORT-NEWER'));
  await input.setInputFiles({
    name: 'newer.json',
    mimeType: 'application/json',
    buffer: Buffer.from(newer),
  });
  await expect(page.locator('.seed-label')).toContainText('IMPORT-NEWER');
  await page.evaluate(() =>
    (window as unknown as { releaseReplayImport: () => void }).releaseReplayImport(),
  );
  await page.waitForFunction(
    () => (window as unknown as { replayReadFinished: boolean }).replayReadFinished,
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key)).toBe(newer);
});

test('leaving a game cancels its pending replay import', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'delayed.json',
    mimeType: 'application/json',
    buffer: Buffer.from(games[0].archive),
  });
  await page.waitForFunction(() => 'releaseReplayImport' in window);
  await page.getByLabel('Choose game').selectOption('spire');
  await expect(page.getByRole('heading', { name: 'The Ironclad' })).toBeVisible();
  await page.evaluate(() =>
    (window as unknown as { releaseReplayImport: () => void }).releaseReplayImport(),
  );
  await page.waitForFunction(
    () => (window as unknown as { replayReadFinished: boolean }).replayReadFinished,
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key)).toBeNull();
  await page.getByLabel('Choose game').selectOption('balatro');
  await expect(page.locator('.seed-label')).toContainText('FIRST-LIGHT');
});
