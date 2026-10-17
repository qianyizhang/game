import { expect, test } from '@playwright/test';
import { blindsideSession } from '../../src/games/balatro/application/session';

test('illustrated guide explains all games and returns to the saved run', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=balatro');
  await page.getByRole('button', { name: 'Play Small Blind' }).click();
  await expect(page.locator('.playing-card')).toHaveCount(8);
  const before = await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key);
  await page.getByRole('link', { name: 'Explore all games' }).click();
  await expect(page).toHaveTitle('Game guide · Card Workshop');
  await expect(page.getByRole('article')).toHaveCount(6);
  await expect(page.locator('.game-guide-plate svg')).toHaveCount(6);
  const names = [
    'Blindside',
    'Slay the Spire',
    'Last Hearth',
    'Emberwake',
    'Dungeon Cartographer',
    'Night Passage',
  ];
  const ids = ['balatro', 'spire', 'battlegrounds', 'diablo2', 'cartographer', 'night-passage'];
  for (let i = 0; i < names.length; i++) {
    const entry = page.getByRole('article', { name: names[i], exact: true });
    await expect(entry.getByRole('heading', { name: 'Your first moves' })).toBeVisible();
    await expect(entry.getByRole('listitem')).toHaveCount(3);
    await expect(
      entry.getByRole('link', { name: `Play ${names[i]}`, exact: true }),
    ).toHaveAttribute('href', `?game=${ids[i]}`);
  }
  await page.screenshot({ path: info.outputPath('guide-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('navigation', { name: 'Games in this guide' })
    .getByRole('link', { name: /Night Passage/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Night Passage', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: info.outputPath('guide-phone.png'), fullPage: true });
  await page.getByRole('link', { name: 'Return to Blindside' }).click();
  await expect(page.locator('.playing-card')).toHaveCount(8);
  expect(await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key)).toBe(
    before,
  );
  await page.getByRole('link', { name: 'Explore all games' }).click();
  await page.getByRole('link', { name: 'Play Slay the Spire', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Choose game' })).toHaveValue('spire');
  await page.getByRole('link', { name: 'Explore all games' }).click();
  await expect(page.getByRole('link', { name: 'Return to Slay the Spire' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('glossary translates chat terms, finds abbreviations and teaches Block on phone', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?guide=games');
  await page.getByRole('link', { name: 'Terms for Slay the Spire' }).click();
  await expect(page.getByRole('combobox', { name: 'Glossary topic' })).toHaveValue('spire');
  const search = page.getByRole('searchbox', { name: 'Search terms and abbreviations' });
  await search.fill('A0');
  await expect(
    page.getByRole('heading', { name: 'Ascension · A0 / A2 / A5', exact: true }),
  ).toBeVisible();
  await search.fill('reserved');
  await expect(page.getByRole('heading', { name: 'No matching terms' })).toBeVisible();
  await page.getByRole('button', { name: 'Search all topics' }).click();
  await expect(
    page.getByRole('heading', { name: 'Reserved evaluation', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(search).toHaveValue('reserved');
  await expect(
    page.getByRole('heading', { name: 'Reserved evaluation', exact: true }),
  ).toBeVisible();
  for (const [lookup, title] of [
    ['boss-relic choice', 'Relic / boss relic'],
    ['Tempo', 'Tempo / Economy / Composition'],
    ['work unit', 'Work unit'],
    ['Holm', 'Multiple-comparison correction'],
    ['four audits', 'Four audits / unavailable'],
  ]) {
    await search.fill(lookup);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(search).toHaveValue('');
  await page.getByText('Translate sentences from the linked chat', { exact: true }).click();
  await page.getByRole('link', { name: 'Spheric Guardian', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Spheric Guardian', exact: true })).toBeFocused();
  await expect(page.getByRole('article', { name: 'Spheric Guardian', exact: true })).toContainText(
    'carries its Block between turns',
  );
  await page.getByRole('link', { name: 'Link to Spheric Guardian', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Spheric Guardian', exact: true }),
  ).toBeInViewport();
  await page.getByRole('link', { name: 'Block ↗', exact: true }).click();
  const block = page.getByRole('article', { name: 'Block', exact: true });
  await expect(block.getByText('4 HP lost', { exact: true })).toBeVisible();
  await block.getByRole('slider', { name: 'Incoming damage', exact: true }).press('ArrowRight');
  await expect(block.getByText('5 HP lost', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('glossary-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await block.getByRole('slider', { name: 'Your Block', exact: true }).press('ArrowRight');
  await expect(block.getByText('4 HP lost', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await block.screenshot({ path: info.outputPath('block-example-phone.png') });
  await page.screenshot({ path: info.outputPath('glossary-phone.png'), fullPage: true });
  await page.goto('/?guide=glossary');
  await page.getByRole('combobox', { name: 'Glossary topic' }).selectOption('ai');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page
    .getByRole('article', { name: 'Policy', exact: true })
    .screenshot({ path: info.outputPath('policy-diagram-phone.png') });
  await page
    .getByRole('article', { name: 'Benchmark', exact: true })
    .screenshot({ path: info.outputPath('matrix-diagram-phone.png') });
  await page.screenshot({ path: info.outputPath('glossary-ai-phone.png'), fullPage: true });
  await page.getByRole('combobox', { name: 'Glossary topic' }).selectOption('all');
  await search.fill('no such game term');
  await expect(page.getByRole('heading', { name: 'No matching terms' })).toBeVisible();
  await expect(page.locator('.glossary-term')).toHaveCount(0);
  expect(errors).toEqual([]);
});
