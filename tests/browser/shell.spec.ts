import { expect, test } from '@playwright/test';
import { blindsideSession } from '../../src/games/balatro/application/session';

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

test('a failed game module keeps keyboard navigation to the saved run and can recover on reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?game=balatro');
  await page.getByRole('button', { name: 'Play Small Blind' }).click();
  await expect(page.locator('.playing-card')).toHaveCount(8);
  const before = await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key);
  const failedModule = '**/src/games/battlegrounds/ui/BattlegroundsApp.tsx*';
  await page.route(failedModule, (route) => route.abort('failed'));
  await page.getByLabel('Choose game').selectOption('battlegrounds');
  await expect(page.getByRole('heading', { name: 'Could not open this game' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(
    'Failed to fetch dynamically imported module',
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key)).toBe(
    before,
  );

  const picker = page.getByLabel('Choose game');
  await expect(picker).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await picker.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect(page.locator('.playing-card')).toHaveCount(8);
  await expect(page).toHaveTitle('Blindside · Card Workshop');
  await expect(page.getByRole('heading', { name: 'Could not open this game' })).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key)).toBe(
    before,
  );

  await picker.selectOption('battlegrounds');
  await expect(page.getByRole('heading', { name: 'Could not open this game' })).toBeVisible();
  await page.unroute(failedModule);
  await page.getByRole('button', { name: 'Reload after fixing', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Who will lead your warband?' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key)).toBe(
    before,
  );
});

for (const screen of [
  { name: 'Challenges', entry: '◇ Challenges', module: '**/src/app/Challenges.tsx*' },
  { name: 'gallery', entry: '↗ 3D art gallery', module: '**/src/art3d/gallery/Studio.tsx*' },
  {
    name: 'workbench',
    entry: '↗ DCC workbench',
    module: '**/packages/dcc-workbench/src/Workbench.tsx*',
  },
]) {
  test(`navigation leaves a failed ${screen.name} screen and stays in the chosen game after reload`, async ({
    page,
  }) => {
    await page.goto('/?game=balatro');
    await page.getByRole('button', { name: 'Play Small Blind' }).click();
    const before = await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key);
    await page.route(screen.module, (route) => route.abort('failed'));
    await page.getByRole('button', { name: screen.entry, exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Could not open this game' })).toBeVisible();
    await page.getByLabel('Choose game').selectOption('battlegrounds');
    await expect(page.getByRole('heading', { name: 'Who will lead your warband?' })).toBeVisible();
    expect(new URL(page.url()).search).toBe('?game=battlegrounds');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Who will lead your warband?' })).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key)).toBe(
      before,
    );
  });
}

test('a loading challenge can return to the same table with keyboard focus restored', async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/src/app/Challenges.tsx*', async (route) => {
    await pending;
    await route.continue();
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play Small Blind' }).click();
  const cards = page.locator('.playing-card');
  await cards.first().click();
  const entry = page.getByRole('button', { name: '◇ Challenges', exact: true });
  await entry.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Opening challenges…');
  await page.getByRole('button', { name: '← Return to my run' }).click();
  await expect(entry).toBeFocused();
  await expect(cards.first()).toHaveAttribute('aria-pressed', 'true');
  release();
  await entry.click();
  await expect(page.getByRole('heading', { name: 'Find the better move.' })).toBeVisible();
});

test('all game navigation identifies the current view and new-run dialogs have names', async ({
  page,
}) => {
  await page.goto('/');
  for (const game of ['balatro', 'spire', 'battlegrounds']) {
    await page.getByLabel('Choose game').selectOption(game);
    const current = page.locator('[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveClass(/game-choice/);
    const collection = page.getByRole('button', { name: /Collection/ });
    await collection.click();
    await expect(collection).toHaveAttribute('aria-current', 'page');
    await expect(current).toHaveCount(1);
    await page.getByRole('button', { name: '+ New run' }).click();
    await expect(page.getByRole('dialog')).toHaveAccessibleName(/.+/);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: '+ New run' })).toBeFocused();
  }
});

test('Blindside opens a fresh run from a loss and generates new blank seeds', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Import replay file').setInputFiles('tests/fixtures/blindside-loss.json');
  await page.getByRole('button', { name: 'Start a new run ↗', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Start a new run ↗', exact: true }).click();
  await page.getByLabel('Run seed').fill('   ');
  await page.getByRole('button', { name: 'Start new run' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Play Small Blind' })).toBeVisible();
  const first = await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key);
  const firstSeed = blindsideSession.decode(first!).state.seed;
  expect(firstSeed).toMatch(/^WORKSHOP-[A-Z0-9]+$/);
  await page.getByRole('button', { name: 'Rules & workshop' }).click();
  await page.getByRole('button', { name: '+ New run' }).click();
  await page.getByRole('button', { name: 'Start new run' }).click();
  await expect(page.getByRole('button', { name: 'Play Small Blind' })).toBeVisible();
  const second = await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key);
  const secondSeed = blindsideSession.decode(second!).state.seed;
  expect(secondSeed).toMatch(/^WORKSHOP-[A-Z0-9]+$/);
  expect(secondSeed).not.toBe(firstSeed);
});
