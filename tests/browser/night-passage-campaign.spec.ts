import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { browserBudget } from './budget';

const directory = 'test-results/night-passage-campaign';
test('continuous UI campaign activates authored regions and guardians, wins and reloads its own chronicle', async ({
  page,
}) => {
  test.setTimeout(browserBudget(240000));
  await mkdir(directory, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-13T00:00:00Z') });
  await page.goto('/?game=balatro');
  await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-campaign-review.ts';
    const helper = (await import(path)) as typeof import('./night-passage-campaign-review');
    helper.observeCampaign();
  });
  await page.getByLabel('Choose game').selectOption('night-passage');
  await expect(page.getByRole('heading', { name: 'Carry a light into the dark.' })).toBeVisible();
  await page.clock.pauseAt(new Date('2026-10-13T00:01:00Z'));
  await page.getByRole('button', { name: 'Sound on', exact: true }).click();
  await page.getByRole('button', { name: 'Far Lantern bow', exact: true }).click();
  await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
  const inspect = () =>
    page.evaluate(async () => {
      const path = '/tests/browser/night-passage-campaign-review.ts';
      return (
        (await import(path)) as typeof import('./night-passage-campaign-review')
      ).inspectCampaign();
    });
  const checkpoints = [];
  const rooms = new Set<string>(),
    bosses = new Set<number>(),
    warnings = new Set<number>();
  const decisions: Record<string, number> = {};
  let result = await inspect();
  for (let step = 0; step < 12000 && result.phase !== 'won' && result.phase !== 'lost'; step++) {
    const key = `${result.region}:${result.chamber}`;
    if (!rooms.has(key)) {
      // Hold rules time while network delivery settles, then let the real renderer activate it.
      if (result.phase === 'combat')
        await page.getByRole('button', { name: 'Pause', exact: true }).click();
      await expect
        .poll(async () => {
          await page.clock.runFor(17);
          result = await inspect();
          return result.native.every((asset) => asset.active >= asset.required);
        })
        .toBe(true);
      expect(result.native.every((asset) => asset.active >= asset.required)).toBe(true);
      rooms.add(key);
      checkpoints.push(result);
      if (result.boss) bosses.add(result.region);
      if (result.boss || result.chamber === 0) {
        await page.screenshot({
          path: `${directory}/region-${result.region}-${result.boss ? 'guardian' : 'entry'}.png`,
          fullPage: true,
        });
        console.log(
          `UI campaign region ${result.region + 1}, chamber ${result.chamber + 1}: ${result.hp.toFixed(1)} HP, native assets active`,
        );
      }
      if (result.phase === 'combat')
        await page.getByRole('button', { name: 'Resume passage', exact: true }).first().click();
    }
    const action = await page.evaluate(async () => {
      const path = '/tests/browser/night-passage-campaign-review.ts';
      return (
        (await import(path)) as typeof import('./night-passage-campaign-review')
      ).driveCampaign();
    });
    decisions[action] = (decisions[action] ?? 0) + 1;
    await page.clock.runFor(100);
    result = await inspect();
    if (result.boss && result.warnings && !warnings.has(result.region)) {
      warnings.add(result.region);
      await page.screenshot({
        path: `${directory}/region-${result.region}-warning.png`,
        fullPage: true,
      });
    }
  }
  await writeFile(
    `${directory}/progress.json`,
    JSON.stringify(
      {
        result,
        checkpoints,
        decisions,
        rooms: [...rooms],
        bosses: [...bosses],
        warnings: [...warnings],
      },
      null,
      2,
    ),
  );
  expect(result.phase, JSON.stringify(result)).toBe('won');
  expect(rooms.size).toBe(32);
  expect([...bosses]).toEqual([0, 1, 2, 3]);
  expect([...warnings]).toEqual([0, 1, 2, 3]);
  await expect(page.getByRole('heading', { name: 'Beyond the Starless Gate' })).toBeVisible();
  const complete = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-campaign-review.ts';
    return (
      (await import(path)) as typeof import('./night-passage-campaign-review')
    ).finishCampaignObservation();
  });
  await page.screenshot({ path: `${directory}/victory.png`, fullPage: true });
  // React's lazy route startup also needs timers after navigation.
  await page.clock.resume();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Beyond the Starless Gate' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('card-workshop.night-passage.v1'))).toBe(
    complete.text,
  );
  await page.getByRole('button', { name: 'Return to the quay', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Carry a light into the dark.' })).toBeVisible();
  expect(errors).toEqual([]);
  await writeFile(
    `${directory}/summary.json`,
    JSON.stringify(
      {
        seed: complete.state.seed,
        weapon: complete.state.player.weapon,
        runes: complete.state.player.runes,
        journalTickBudget: complete.ticks,
        executedTicks: complete.state.tick,
        simulatedSeconds: complete.state.tick / 60,
        rooms: rooms.size,
        bosses: [...bosses],
        warnings: [...warnings],
        kills: complete.state.kills,
        hp: complete.state.player.hp,
        boons: complete.state.player.boons,
        decisions,
        checkpoints,
        provenance:
          'Continuous actual application UI with synthetic DOM keyboard/pointer/buttons under Playwright virtual time; reads its published accepted-command chronicle. No imported progress or injected rules state. Not human play or a wall-clock frame-rate benchmark.',
      },
      null,
      2,
    ),
  );
});
