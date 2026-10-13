import { expect, test } from '@playwright/test';
import { runEpisode } from '../../src/games/night-passage/agent/benchmark';
import {
  exportSession,
  importSession,
  newSession,
  SAVE_KEY,
} from '../../src/games/night-passage/application/session';
import { mkdir } from 'node:fs/promises';

test('agent victory replay imports into the game with the same score and survives reload', async ({
  page,
}) => {
  const result = runEpisode({ seed: 'a-light-in-the-dark', weapon: 'bow', includeReplay: true });
  expect(result.status).toBe('won');
  expect(result.replay).toBeTruthy();
  await page.addInitScript(() =>
    localStorage.setItem('card-workshop.night-passage.view.v1', 'canvas'),
  );
  await page.goto('/?game=night-passage');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'agent-passage.json',
    mimeType: 'application/json',
    buffer: Buffer.from(result.replay!),
  });
  await expect(page.getByRole('heading', { name: 'Beyond the Starless Gate' })).toBeVisible();
  await expect(page.getByTestId('np-score')).toHaveText(`${result.score} points`);
  await expect(page.getByText(`Passage score: ${result.score}`, { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('np-score')).toHaveText(`${result.score} points`);
  await page.getByRole('button', { name: 'Return to the quay', exact: true }).click();
  await expect(page.getByTestId('np-score')).toHaveCount(0);
  await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
  await expect(page.getByTestId('np-score')).toHaveText('0 points');
  const saved = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  await page.getByRole('button', { name: 'Watch replay', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Night Passage · Replay' })).toBeVisible();
  const beforeWatch = importSession(saved!).state;
  const afterWatch = importSession(
    (await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!,
  ).state;
  expect(afterWatch).toMatchObject({
    seed: beforeWatch.seed,
    runNumber: beforeWatch.runNumber,
    phase: 'combat',
  });
  expect(afterWatch.tick).toBeGreaterThanOrEqual(beforeWatch.tick);
});

test('spectator plays, pauses and seeks a recorded run without replacing the player save', async ({
  page,
}) => {
  const result = runEpisode({ seed: 'a-light-in-the-dark', weapon: 'bow', includeReplay: true });
  const original = exportSession(newSession('spectator-keeps-my-save'));
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, save), {
    key: SAVE_KEY,
    save: original,
  });
  await page.clock.install();
  // A malformed replay link must leave the spectator usable for file recovery.
  await page.goto('/?game=night-passage&watch=1&replay=http%3A%2F%2F%5B');
  await expect(page.getByRole('status')).toHaveText(
    'Invalid replay link. Choose a chronicle below.',
  );
  await page.goto('/?game=night-passage&watch=1&replay=https%3A%2F%2Fexample.com%2Freplay.json');
  await expect(page.getByRole('status')).toHaveText(
    'Replay links must use this site. Choose a chronicle below.',
  );
  await page.getByLabel('Open replay to watch').setInputFiles({
    name: 'agent.json',
    mimeType: 'application/json',
    buffer: Buffer.from(result.replay!),
  });
  await expect(page.getByRole('heading', { name: 'Night Passage · Replay' })).toBeVisible();
  const position = page.getByRole('slider', { name: 'Replay position' });
  await expect(position).toHaveValue('0');
  await page.getByRole('button', { name: 'Play replay', exact: true }).click();
  await page.clock.runFor(1100);
  expect(Number(await position.inputValue())).toBeGreaterThan(50);
  await page.getByRole('button', { name: 'Pause replay', exact: true }).click();
  const paused = await position.inputValue();
  await page.clock.runFor(1000);
  await expect(position).toHaveValue(paused);
  await page.getByRole('button', { name: 'Show result', exact: true }).click();
  await expect(page.getByText('Replay complete · Escaped · 12700 points')).toBeVisible();
  await expect(page.getByTestId('np-replay-score')).toHaveText(`${result.score} points`);
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(original);
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await page.getByLabel('Replay speed').selectOption('4');
  await page.getByRole('button', { name: 'Play replay', exact: true }).click();
  await page.clock.runFor(2000);
  await page.getByRole('button', { name: 'Pause replay', exact: true }).click();
  expect(Number(await position.inputValue())).toBeGreaterThan(450);
  await mkdir('test-results/night-passage-agent', { recursive: true });
  await page.screenshot({
    path: 'test-results/night-passage-agent/replay-viewer.png',
    fullPage: true,
  });
  await page.getByLabel('Replay view').selectOption('canvas');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Play replay', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(original);
});
