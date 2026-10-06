import { expect, test, type Page } from '@playwright/test';
import { HEROES } from '../../src/games/battlegrounds/content/minions';
import { RELICS, POTIONS } from '../../src/games/spire/content/world';

async function withinViewport(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('hero selection, powers, and rival inspection retain their accessible controls', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('battlegrounds');
  await expect(page.locator('.hero-choices .hero-art')).toHaveCount(HEROES.length);
  for (const hero of HEROES) {
    await expect(page.getByRole('button', { name: new RegExp(hero.name) })).toBeEnabled();
  }
  await page.locator('.hero-selection').screenshot({ path: info.outputPath('heroes-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await withinViewport(page);
  await page.locator('.hero-selection').screenshot({ path: info.outputPath('heroes-phone.png') });
  await page.getByRole('button', { name: 'Mixed Rivals', exact: true }).click();
  await page.getByRole('button', { name: /The Archivist/ }).click();
  await expect(page.locator('.tavern-tools [data-hero-power="archivist"]')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Hero power · 1 gold', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.lobby-list .hero-art')).toHaveCount(8);
  await page.getByRole('button', { name: 'Rival inspector', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Mixed Rivals inspector' });
  await expect(dialog.locator('.workshop-art-arena')).toBeVisible();
  await expect(dialog.locator('.hero-art')).toHaveCount(8);
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await dialog.screenshot({ path: info.outputPath('arena-phone.png') });
  expect(errors).toEqual([]);
});

test('Spire collections cover every registered item and character changes remain playable', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Choose game').selectOption('spire');
  await expect(page.locator('[data-character-art="ironclad"]')).toBeVisible();
  const contrast = await page.locator('.sts-room').evaluate((room) => {
    const luminance = (color: string) => {
      const channels = color
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number)
        .map((n) => {
          const value = n / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const text = luminance(getComputedStyle(room.querySelector('.sts-intro p:last-child')!).color);
    const background = luminance(getComputedStyle(room).backgroundColor);
    return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
  await page.locator('.sts-intro').screenshot({ path: info.outputPath('ironclad.png') });
  await page.getByLabel('Character', { exact: true }).selectOption('silent');
  await expect(page.locator('[data-character-art="silent"]')).toBeVisible();
  await page.locator('.sts-intro').screenshot({ path: info.outputPath('silent.png') });
  await page.getByRole('button', { name: 'Collection', exact: true }).click();
  await expect(page.locator('.catalogue-card .relic-art')).toHaveCount(RELICS.length);
  await expect(page.locator('.catalogue-card .potion-art')).toHaveCount(
    Object.keys(POTIONS).length,
  );
  await expect(page.locator('[data-art-fallback]')).toHaveCount(0);
  await expect(page.locator('.catalogue-card svg:not([aria-hidden="true"])')).toHaveCount(0);
  await page
    .locator('.collection-grid')
    .first()
    .screenshot({ path: info.outputPath('relic-collection.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await withinViewport(page);
  await page
    .locator('.collection-grid')
    .last()
    .screenshot({ path: info.outputPath('potions-phone.png') });
  expect(errors).toEqual([]);
});

test('workshop illustrations fit beside the tools on desktop and phone', async ({ page }, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Practice lab' });
  for (const [tab, art] of [
    ['Replay & scenarios', 'practice'],
    ['Content packs', 'packs'],
    ['Playtesting', 'evidence'],
  ] as const) {
    await dialog.getByRole('button', { name: tab, exact: true }).click();
    await expect(dialog.locator(`.workshop-art-${art}`)).toBeVisible();
    await dialog
      .locator('.feature-intro')
      .screenshot({ path: info.outputPath(`${art}-desktop.png`) });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [tab, art] of [
    ['Replay & scenarios', 'practice'],
    ['Content packs', 'packs'],
    ['Playtesting', 'evidence'],
  ] as const) {
    await dialog.getByRole('button', { name: tab, exact: true }).click();
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await dialog.screenshot({ path: info.outputPath(`${art}-phone.png`) });
  }
});
