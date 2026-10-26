import { expect, test } from '@playwright/test';
import { blindsideSession } from '../../src/games/balatro/application/session';
import { replayCodec } from '../../src/shared/replay';

const practice = replayCodec(blindsideSession.rules, true);

test('illustrated scoring follows recorded card, chip, multiplier and cash effects without changing the replay', async ({
  page,
}, info) => {
  await page.addInitScript(() => localStorage.setItem('card-workshop.playback-speed', '1000'));
  await page.goto('/');
  const normal = await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key);
  await page.getByRole('button', { name: 'Practice lab', exact: true }).click();
  await page.getByLabel('Scenario seed').fill('SCORE-FEEDBACK-1');
  await page.getByLabel('Scenario setup').fill(
    JSON.stringify({
      ante: 3,
      cash: 30,
      jokers: ['granite', 'spark', 'bankroll', 'toll'],
      deck: [2, 3, 4, 5, 6, 7, 8, 9].map((rank) => ({ rank, suit: 'hearts' })),
    }),
  );
  await page.getByRole('button', { name: /^Start practice scenario/ }).click();
  for (let index = 0; index < 5; index++)
    await page.locator('.hand-cards .playing-card').nth(index).click();
  await page.getByRole('button', { name: /^Play hand/ }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const saved = await page.evaluate((key) => localStorage.getItem(key), practice.key);
  const score = practice.decode(saved!).state.lastScore!;
  const stage = page.getByRole('region', { name: 'Scoring resolution' });
  for (let index = 0; index < score.steps.length; index++) {
    const step = score.steps[index];
    await page.getByLabel('Resolution event').fill(String(index));
    await expect(stage.locator('.score-source h3')).toHaveText(step.source);
    await expect(stage.locator('.score-source p')).toHaveText(step.detail);
    for (const kind of ['chips', 'mult', 'cash'] as const) {
      const tile = stage.locator(`.score-${kind}`);
      await expect(tile.locator('strong')).toHaveText(`${kind === 'cash' ? '$' : ''}${step[kind]}`);
      await expect(tile.locator('small')).toHaveText(
        step[kind] !== (score.steps[index - 1]?.[kind] ?? 0) ? 'Updated' : 'Unchanged',
      );
    }
    if (index === 1) {
      await expect(stage.locator('[data-art-rank]')).toHaveAttribute('data-art-rank', '8');
      await stage.screenshot({ path: info.outputPath('score-card.png'), animations: 'disabled' });
    }
    if (index === score.steps.length - 1)
      await stage.screenshot({ path: info.outputPath('score-cash.png'), animations: 'disabled' });
  }
  // Seeking backwards compares chronological score steps, not the last viewed values.
  const spark = score.steps.findIndex((step) => step.source === 'Spark');
  await page.getByLabel('Resolution event').fill(String(spark));
  await expect(stage.locator('.score-source-art svg')).toHaveCount(1);
  await expect(stage.locator('.score-mult small')).toHaveText('Updated');
  await expect(stage.locator('.score-chips small')).toHaveText('Unchanged');
  await page.getByLabel('Resolution speed').selectOption('100');
  await page.waitForTimeout(1100);
  await expect(page.getByLabel('Resolution event')).toHaveValue(String(spark));
  await stage.screenshot({ path: info.outputPath('score-desktop.png'), animations: 'disabled' });
  await page.screenshot({
    path: info.outputPath('desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(stage.locator('.is-updated')).toHaveCSS('animation-name', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Next event', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(stage.locator('.score-source h3')).toHaveText('Nest Egg');
  await page.getByRole('button', { name: 'Previous event', exact: true }).click();
  await expect(stage.locator('.score-source h3')).toHaveText('Spark');
  await stage.screenshot({ path: info.outputPath('score-phone.png'), animations: 'disabled' });
  await page.screenshot({
    path: info.outputPath('phone.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(await page.evaluate((key) => localStorage.getItem(key), practice.key)).toBe(saved);
  expect(await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key)).toBe(
    normal,
  );
  await page.getByRole('button', { name: 'Skip to result', exact: true }).click();
  await expect(stage).toHaveClass(/is-finished/);
  await page.getByRole('button', { name: 'Inspect last action', exact: true }).click();
  await expect(page.getByLabel('Resolution event')).toHaveValue('0');
  await page.reload();
  expect(await page.evaluate((key) => localStorage.getItem(key), practice.key)).toBe(saved);
});
