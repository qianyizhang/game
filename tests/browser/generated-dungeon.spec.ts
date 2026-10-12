import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import {
  SAVE_KEY,
  SANDBOX_SAVE_KEY,
  importSession,
} from '../../packages/diablo2/src/application/session';
import { browserBudget } from './budget';

test('opts into a generated campaign dungeon and visits its reciprocal portals in the sandbox', async ({
  page,
}) => {
  test.setTimeout(browserBudget(45000));
  await page.goto('/?game=diablo2');
  await page.getByLabel(/Add The Charted Vault/).check();
  await page.getByRole('button', { name: 'Begin journey', exact: true }).click();
  const campaign = await page.evaluate((key) => localStorage.getItem(key)!, SAVE_KEY);
  const region = importSession(campaign).replay.content.regions.find(
    (r) => r.id === 'charted-vault',
  )!;
  expect(region.rooms).toHaveLength(9);
  // Loading an expanded pack must not reuse the earlier add-dungeon checkbox state.
  await page.getByRole('button', { name: 'New journey', exact: true }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Load content mod', exact: true }).click();
  await (
    await chooser
  ).setFiles({
    name: 'charted-content.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(importSession(campaign).replay.content)),
  });
  await expect(
    page.getByLabel('The Charted Vault is included in this content pack.'),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Begin journey', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lantern Refuge', exact: true })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(campaign);
  await page.getByRole('button', { name: 'Developer tools · F8', exact: true }).click();
  await page
    .locator('.ew-dev-floors')
    .getByRole('button', { name: /The Charted Vault/ })
    .click();
  await page
    .getByRole('button', { name: 'Jump to The Charted Vault · Floor 1', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'The Charted Vault', exact: true })).toBeVisible();
  const canvas = page.locator('.ew-canvas-wrap canvas');
  await canvas.focus();
  await page.keyboard.press('f');
  await expect(page.getByRole('heading', { name: 'Lantern Approach', exact: true })).toBeVisible();
  await canvas.focus();
  await page.keyboard.press('f');
  await expect(page.getByRole('heading', { name: 'The Charted Vault', exact: true })).toBeVisible();
  await canvas.focus();
  await page.keyboard.down('d');
  await page.waitForTimeout(700);
  await page.keyboard.up('d');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  mkdirSync('test-results/cartographer', { recursive: true });
  await page.screenshot({ path: 'test-results/cartographer/emberwake-vault.png', fullPage: true });
  const saved = await page.evaluate((key) => localStorage.getItem(key)!, SANDBOX_SAVE_KEY);
  expect(importSession(saved).state.region).toBe('charted-vault');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'The Charted Vault', exact: true })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(campaign);
});
