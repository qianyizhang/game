import { expect, test } from '@playwright/test';

test('a loading game keeps navigation available without replacing another game save', async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/src/games/spire/ui/SpireApp.tsx*', async (route) => {
    await pending;
    await route.continue();
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play Small Blind' }).click();
  await expect(page.locator('.playing-card')).toHaveCount(8);
  await page.getByLabel('Choose game').selectOption('spire');
  await expect(page.getByRole('status')).toContainText('Opening your table');
  await page.getByLabel('Choose game').selectOption('balatro');
  await expect(page.locator('.playing-card')).toHaveCount(8);
  release();
  await page.getByLabel('Choose game').selectOption('spire');
  await expect(page.getByRole('heading', { name: 'The Ironclad' })).toBeVisible();
  await expect(page).toHaveTitle('Slay the Spire · Card Workshop');
});
