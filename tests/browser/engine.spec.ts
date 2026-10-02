import { expect, test } from '@playwright/test';
import { solveWorkshopChallenges } from '../../src/engines/challenges';
import { blindsideSession } from '../../src/games/balatro/application/session';

test('engine-generated attempts clear all live puzzles through the existing import and review UI', async ({
  page,
}) => {
  const normal = blindsideSession.encode(blindsideSession.create('ENGINE-KEEP-NORMAL'));
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
      localStorage.setItem('card-workshop.playback-speed', '100');
    },
    { key: blindsideSession.key, value: normal },
  );
  const reports = solveWorkshopChallenges();
  await page.goto('/');
  await page.getByRole('button', { name: '◇ Challenges', exact: true }).click();
  for (const report of reports) {
    expect(report.status).toBe('solved');
    await page.getByRole('button', { name: `Open ${report.title}`, exact: true }).click();
    await page.getByLabel('Import challenge attempts').setInputFiles({
      name: `${report.id}.attempts.json`,
      mimeType: 'application/json',
      buffer: Buffer.from(report.solution!.archive),
    });
    await expect(
      page.getByRole('heading', { name: 'Challenge cleared', exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel('Your decisions').locator('summary')).toHaveCount(
      report.solution!.commands.length,
    );
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Challenge cleared', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: '← All challenges', exact: true }).click();
  }
  expect(await page.evaluate((key) => localStorage.getItem(key), blindsideSession.key)).toBe(
    normal,
  );
});
