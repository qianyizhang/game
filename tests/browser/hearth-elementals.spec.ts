import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { bgSession } from '../../src/games/battlegrounds/application/session';
import { MINION_BY_ID } from '../../src/games/battlegrounds/content/minions';
import { replayCodec } from '../../src/shared/replay';

const practice = replayCodec(bgSession.rules, true);
const elements = ['spark', 'molten', 'tempest', 'dancer', 'cyclone', 'elder'];
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const rawSave = (page: Page) => page.evaluate((key) => localStorage.getItem(key), practice.key);

async function start(page: Page, seed: string, board: string[]) {
  await page.goto(process.env.ELEMENTAL_REVIEW_URL ?? '/');
  await page.getByLabel('Choose game').selectOption('battlegrounds');
  const normal = await page.evaluate((key) => localStorage.getItem(key), bgSession.key);
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  await page.getByLabel('Scenario seed').fill(seed);
  await page
    .getByLabel('Scenario setup')
    .fill(JSON.stringify({ hero: 'forgekeeper', tier: 6, gold: 10, board }));
  await page.getByRole('button', { name: /^Start practice scenario/ }).click();
  return normal;
}

async function capture(page: Page, info: TestInfo, selector: string, name: string) {
  await page.locator(selector).screenshot({
    path: info.outputPath(`${name}.png`),
    animations: 'disabled',
  });
}

test('six core elementals retain recruitment, selected board, combat and practice reload', async ({
  page,
  browser,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const normal = await start(page, 'ELEMENTAL-REVIEW-804', elements);
  await page.getByRole('button', { name: /Refresh/ }).click();
  await page.locator('.warband .minion-card').filter({ hasText: 'Cinder Dancer' }).click();
  await expect(page.locator('.selected-minion-detail')).toContainText('Cinder Dancer');
  const before = (await rawSave(page))!;
  const labels = await page
    .locator('.warband .minion-card')
    .evaluateAll((cards) => cards.map((card) => card.getAttribute('aria-label')));
  for (const [index, id] of elements.entries()) {
    const card = page.locator('.warband .minion-card').nth(index);
    await expect(card).toContainText(MINION_BY_ID[id].name);
    await expect(card.locator('svg.card-art')).toHaveAttribute('aria-hidden', 'true');
  }
  const sizes: Record<string, unknown> = {};
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 });
    await capture(page, info, '.tavern', `tavern-${width}`);
    await capture(page, info, '.warband-panel', `selected-warband-${width}`);
    sizes[width] = await page.locator('.warband .minion-art').first().boundingBox();
    if (width === 390) {
      await page.locator('.warband').evaluate((node) => (node.scrollLeft = node.scrollWidth));
      await capture(page, info, '.warband-panel', 'selected-warband-390-end');
      await page.locator('.tavern-offers').evaluate((node) => (node.scrollLeft = node.scrollWidth));
      await capture(page, info, '.tavern', 'tavern-390-end');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page
    .locator('.tavern-offers .minion-card')
    .filter({ hasText: 'Molten Pebble' })
    .first()
    .click();
  await expect(page.locator('.recruit-hand .minion-card')).toContainText('Molten Pebble');
  expect(practice.decode((await rawSave(page))!).state.players[0].gold).toBe(6);
  await capture(page, info, '.recruit-hand', 'recruited-hand-1440');
  await page.locator('.recruit-hand .minion-card').click();
  await expect(page.locator('.warband .minion-card')).toHaveCount(7);
  await page.getByRole('button', { name: 'Ready · fight →' }).click();
  await page.getByRole('button', { name: 'Pause playback', exact: true }).click();
  await page.getByLabel('Combat event', { exact: true }).fill('0');
  await expect(page.locator('.combat-warband').last().locator('.minion-card')).toHaveCount(7);
  await page
    .locator('.combat-warband')
    .last()
    .getByRole('button', { name: /Cinder Dancer/ })
    .click();
  await capture(page, info, '.combat-replay', 'combat-1440');
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, info, '.combat-replay', 'combat-390');
  const combat = (await rawSave(page))!;
  await page.reload();
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  await page.getByRole('button', { name: 'Resume last practice', exact: true }).click();
  await expect(page.locator('.combat-replay')).toBeVisible();
  expect(await rawSave(page)).toBe(combat);
  expect(await page.evaluate((key) => localStorage.getItem(key), bgSession.key)).toBe(normal);
  await page.getByRole('button', { name: 'Collection', exact: true }).click();
  await page.getByLabel('Filter tribe').selectOption('elemental');
  await capture(page, info, '.minion-catalogue', 'collection-390');
  await page.setViewportSize({ width: 1440, height: 1080 });
  await capture(page, info, '.minion-catalogue', 'collection-1440');
  expect(errors).toEqual([]);
  writeFileSync(
    info.outputPath('receipt.json'),
    JSON.stringify(
      {
        seed: 'ELEMENTAL-REVIEW-804',
        elements,
        labels,
        sizes,
        selectedBoardSave: digest(before),
        combatSave: digest(combat),
        browser: browser.version(),
        errors,
      },
      null,
      2,
    ),
  );
});

test('Glass Cyclone forms a Golden triple, discovers, fights and reloads without losing its identity', async ({
  page,
  browser,
}, info) => {
  const normal = await start(page, 'GLASS-TRIPLE-1', ['cyclone', 'cyclone']);
  await page.getByRole('button', { name: /Refresh/ }).click();
  await page
    .locator('.tavern-offers')
    .getByRole('button', { name: /Glass Cyclone/ })
    .click();
  const golden = page.locator('.recruit-hand .minion-card.golden');
  await expect(golden).toHaveAccessibleName(/Glass Cyclone golden/);
  await expect(page.locator('.warband .minion-card')).toHaveCount(0);
  const unit = practice.decode((await rawSave(page))!).state.players[0].hand[0];
  expect(unit).toMatchObject({
    definitionId: 'cyclone',
    golden: true,
    copies: 3,
    attack: MINION_BY_ID.cyclone.attack * 2,
    health: MINION_BY_ID.cyclone.health * 2,
  });
  await capture(page, info, '.recruit-hand', 'golden-hand-1440');
  await golden.click();
  await expect(page.locator('.discover-panel')).toBeVisible();
  await page.locator('.discover-panel .minion-card').first().click();
  await expect(page.locator('.warband .minion-card.golden')).toHaveAccessibleName(
    /Glass Cyclone golden/,
  );
  await expect(page.locator('.selected-minion-detail')).toContainText('Golden');
  await capture(page, info, '.warband-panel', 'golden-board-1440');
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, info, '.warband-panel', 'golden-board-390');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const boardSave = (await rawSave(page))!;
  await page.getByRole('button', { name: 'Ready · fight →' }).click();
  await page.getByRole('button', { name: 'Pause playback', exact: true }).click();
  await page.getByLabel('Combat event', { exact: true }).fill('0');
  await expect(
    page.locator('.combat-warband').last().locator('.minion-card.golden'),
  ).toHaveAccessibleName(/Glass Cyclone golden/);
  const combatSave = (await rawSave(page))!;
  await page.reload();
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  await page.getByRole('button', { name: 'Resume last practice', exact: true }).click();
  await expect(page.locator('.combat-replay')).toBeVisible();
  expect(await rawSave(page)).toBe(combatSave);
  expect(await page.evaluate((key) => localStorage.getItem(key), bgSession.key)).toBe(normal);
  writeFileSync(
    info.outputPath('receipt.json'),
    JSON.stringify(
      {
        seed: 'GLASS-TRIPLE-1',
        unit,
        boardSave: digest(boardSave),
        combatSave: digest(combatSave),
        browser: browser.version(),
      },
      null,
      2,
    ),
  );
});
