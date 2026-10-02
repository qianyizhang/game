import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { spireSession } from '../../src/games/spire/application/session';
import { blindsideSession } from '../../src/games/balatro/application/session';
import { EVIDENCE_KEY } from '../../src/shared/evidence/recorder';
const raw = (page: Page, key: string) => page.evaluate((key) => localStorage.getItem(key), key);

test('Silent setup, paced events, safe practice branches, mod previews and local evidence', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('card-workshop.playback-speed', '-1'));
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('spire');
  await page.getByLabel('Character', { exact: true }).selectOption('silent');
  await page.getByLabel('Ascension', { exact: true }).selectOption('5');
  await expect(page.getByRole('heading', { name: 'The Silent', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Obtain +7 Max HP', exact: true }).click();
  await page.getByRole('button', { name: 'Floor 1 lane 1 fight' }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const normal = await raw(page, spireSession.key);
  await expect(page.getByLabel('Resolution speed')).toHaveValue('600');
  await page.getByRole('button', { name: 'Next event', exact: true }).click();
  await page.getByLabel('Resolution speed').selectOption('300');
  expect(await raw(page, spireSession.key)).toBe(normal);
  await page.screenshot({
    path: info.outputPath('silent-paced-resolution.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Skip to result' }).click();
  await expect(page.locator('.battle-hand .ability-card')).toHaveCount(7);
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  await page.getByLabel('Replay decision').fill('0');
  await page.getByRole('button', { name: 'Play a branch from here' }).click();
  await expect(page.getByLabel('Character', { exact: true })).toHaveValue('ironclad');
  expect(await raw(page, spireSession.key)).toBe(normal);
  await page.getByRole('button', { name: 'Return to normal run' }).click();
  expect(await raw(page, spireSession.key)).toBe(normal);
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  await page.getByLabel('Scenario setup').fill('{"deck":["missing"]}');
  await page.getByRole('button', { name: 'Start practice scenario' }).click();
  await expect(page.getByRole('dialog', { name: 'Practice lab' }).getByRole('alert')).toContainText(
    'unknown ID',
  );
  expect(await raw(page, spireSession.key)).toBe(normal);
  await page.getByLabel('Scenario example').selectOption('2');
  await page.getByRole('button', { name: 'Start practice scenario' }).click();
  await expect(page.getByRole('button', { name: 'Return to normal run' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip to result' }).click();
  await expect(page.locator('.enemy')).toContainText('Time Eater');
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  await page.getByRole('button', { name: 'Content packs', exact: true }).click();
  await expect(page.locator('.mod-preview')).toHaveCount(3);
  await expect(page.locator('.pack-card')).toContainText('disabled');
  await page.getByRole('button', { name: 'Playtesting', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Playtesting workbench' })).toBeVisible();
  expect(
    JSON.parse((await raw(page, EVIDENCE_KEY))!).some(
      (r: { mode: string }) => r.mode === 'practice',
    ),
  ).toBe(true);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all evidence' }).click();
  expect((await download).suggestedFilename()).toBe('card-workshop-evidence.json');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: info.outputPath('phone-workbench.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Clear evidence…', exact: true }).click();
  await page.getByRole('button', { name: 'Delete evidence', exact: true }).click();
  expect(await raw(page, EVIDENCE_KEY)).toBeNull();
  expect(await raw(page, spireSession.key)).toBe(normal);
  expect(errors).toEqual([]);
});

test('checkpoint recovery preserves unreadable data and restores a named branch', async ({
  page,
}, info) => {
  const key = `${spireSession.key}.practice.branches`;
  await page.addInitScript((key) => {
    localStorage.setItem(key, '{unreadable checkpoints');
  }, key);
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('spire');
  await page.getByRole('button', { name: 'Obtain +8 Max HP', exact: true }).click();
  const normal = await raw(page, spireSession.key);
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Practice lab' });
  await expect(dialog.getByRole('status')).toContainText('Original data will be archived');
  expect(await raw(page, key)).toBe('{unreadable checkpoints');
  const name = 'Decision'.repeat(10);
  await page.getByLabel('Checkpoint name').fill(name);
  await page.getByRole('button', { name: 'Save this checkpoint', exact: true }).click();
  expect(
    await page.evaluate(
      (key) =>
        Object.keys(localStorage)
          .filter((k) => k.startsWith(`${key}.recovery.`))
          .map((k) => localStorage.getItem(k)),
      key,
    ),
  ).toEqual(['{unreadable checkpoints']);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByRole('button', { name: `Open ${name}`, exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('checkpoint-phone.png'), animations: 'disabled' });
  await page.getByRole('button', { name: `Open ${name}`, exact: true }).click();
  await expect(page.getByRole('button', { name: 'Return to normal run' })).toBeVisible();
  await expect(page.locator('.sts-map-scroll')).toBeVisible();
  expect(await raw(page, spireSession.key)).toBe(normal);
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  const exported = page.waitForEvent('download');
  await page.getByRole('button', { name: `Export ${name}`, exact: true }).click();
  const branch = JSON.parse(readFileSync((await (await exported).path())!, 'utf8'));
  expect(branch.mode).toBe('practice');
  expect(branch.commands).toEqual(JSON.parse(normal!).commands);
});

test('Blindside booster choices and vouchers remain playable on a phone', async ({
  page,
}, info) => {
  await page.addInitScript(() => localStorage.setItem('card-workshop.playback-speed', '100'));
  await page.goto('/');
  const replay = JSON.parse(readFileSync('tests/fixtures/blindside-win.json', 'utf8'));
  let session = blindsideSession.create(replay.seed);
  for (const command of replay.commands) {
    session = blindsideSession.act(session, command).session;
    if (
      session.state.phase === 'shop' &&
      session.state.cash >= 22 &&
      session.state.jokers.length < 5
    )
      break;
  }
  expect(session.state.phase).toBe('shop');
  expect(session.state.cash).toBeGreaterThanOrEqual(22);
  await page.getByLabel('Import replay file').setInputFiles({
    name: 'shop.json',
    mimeType: 'application/json',
    buffer: Buffer.from(blindsideSession.encode(session)),
  });
  const skip = page.getByRole('button', { name: 'Skip to result' });
  if (await skip.isVisible()) await skip.click();
  await page.getByRole('button', { name: 'Buy voucher · $10' }).click();
  await expect(page.locator('.voucher-rack')).toBeVisible();
  await page
    .getByRole('button', { name: /Open pack/ })
    .first()
    .click();
  await expect(page.locator('.pack-choice')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: info.outputPath('phone-booster-pack.png'),
    fullPage: true,
    animations: 'disabled',
  });
  const picks = page.locator('.pack-choice').getByRole('button', { name: /Take card|Use planet/ });
  await picks.first().click();
  const remaining = page.getByRole('button', { name: 'Skip remaining choices' });
  if (await remaining.isVisible()) await remaining.click();
  await expect(page.getByRole('button', { name: 'Next blind' })).toBeVisible();
});

test('storage failure keeps accepted play exportable and never claims it was saved', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException('Full', 'QuotaExceededError');
    };
  });
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('spire');
  await page.getByRole('button', { name: 'Obtain +8 Max HP', exact: true }).click();
  await expect(page.locator('.sts-map-scroll')).toBeVisible();
  await expect(page.locator('.save-status')).toHaveText(
    'Storage unavailable · export to save · evidence unavailable',
  );
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const session = spireSession.decode(readFileSync((await (await download).path())!, 'utf8'));
  expect(session.state.phase).toBe('map');
  expect(session.replay.commands).toHaveLength(1);
});
