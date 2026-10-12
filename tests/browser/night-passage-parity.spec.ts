import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { browserBudget } from './budget';

const directory = 'test-results/night-passage-parity';
test('controlled spell, threat, hazard and status families preserve paused pixels and rules snapshots', async ({
  page,
}) => {
  test.setTimeout(browserBudget(90000));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=night-passage');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-parity.ts';
    const helper = (await import(path)) as typeof import('./night-passage-parity');
    return helper.inspectParityMatrix();
  });
  expect(result.cases.filter((entry) => entry.family === 'patron')).toHaveLength(20);
  expect(result.cases.filter((entry) => entry.family === 'glyph')).toHaveLength(5);
  expect(result.cases.filter((entry) => entry.family === 'enemy')).toHaveLength(8);
  expect(result.cases.filter((entry) => entry.family === 'guardian')).toHaveLength(26);
  expect(result.cases.filter((entry) => entry.family === 'hazard')).toHaveLength(12);
  expect(result.cases.filter((entry) => entry.family === 'status')).toHaveLength(8);
  for (const entry of result.cases) {
    expect(entry.pausedStable, entry.id).toBe(true);
    expect(entry.snapshotPure, entry.id).toBe(true);
    if (entry.expectedShots !== undefined)
      expect(entry.projectiles, entry.id).toBe(entry.expectedShots);
    if (entry.expectedCue) expect(entry.cueKinds, entry.id).toContain(entry.expectedCue);
    if ((entry.family === 'enemy' || entry.family === 'guardian') && entry.stage === 'windup')
      expect(entry.windups, entry.id).toBe(1);
    for (const probe of entry.probes) {
      if (probe.visible) expect(probe.alpha, `${entry.id}: ${probe.label}`).toBeGreaterThan(20);
      else expect(probe.alpha, `${entry.id}: ${probe.label}`).toBe(0);
    }
  }
  for (const family of ['glyph', 'cue']) {
    const entries = result.cases.filter((entry) => entry.family === family);
    expect(
      new Set(entries.map((entry) => entry.silhouetteHash)).size,
      `${family} shapes, independent of color`,
    ).toBe(5);
  }
  for (const kind of ['thorns', 'tide', 'flame', 'void'])
    expect(
      new Set(
        result.cases
          .filter((entry) => entry.id.startsWith(`hazard-${kind}-`))
          .map((entry) => entry.hash),
      ).size,
    ).toBe(3);
  await mkdir(directory, { recursive: true });
  for (const picture of result.pictures)
    await writeFile(
      `${directory}/${picture.id}.png`,
      Buffer.from(picture.png.split(',')[1], 'base64'),
    );
  await writeFile(`${directory}/matrix.json`, JSON.stringify(result.cases, null, 2));
  // Capture the actual angled renderer while holding one confirmed fixture state.
  const before = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-parity.ts';
    const helper = (await import(path)) as typeof import('./night-passage-parity');
    return helper.mountParityArena('composite-spells-status');
  });
  const canvas = page.locator('#night-passage-parity-arena');
  const first = await canvas.screenshot({ path: `${directory}/angled-composite.png` });
  await page.waitForTimeout(100);
  const after = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-parity.ts';
    const helper = (await import(path)) as typeof import('./night-passage-parity');
    return helper.redrawParityArena();
  });
  expect(after).toBe(before);
  const second = await canvas.screenshot();
  expect(first.equals(second)).toBe(true);
  await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-parity.ts';
    const helper = (await import(path)) as typeof import('./night-passage-parity');
    helper.disposeParityArena();
  });
  expect(errors).toEqual([]);
});

test('five legal fast-forward campaigns render every chamber entry and victory without changing snapshots', async ({
  page,
}) => {
  test.setTimeout(browserBudget(120000));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?game=night-passage');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-parity.ts';
    const helper = (await import(path)) as typeof import('./night-passage-parity');
    return helper.inspectCampaignTraversal();
  });
  expect(result.campaigns).toHaveLength(5);
  for (const campaign of result.campaigns) {
    expect(campaign.phase, campaign.weapon).toBe('won');
    expect(campaign.entries, campaign.weapon).toBe(32);
    expect(campaign.regions, campaign.weapon).toEqual([0, 1, 2, 3]);
    expect(campaign.bosses, campaign.weapon).toEqual([0, 1, 2, 3]);
    expect(campaign.rendered, campaign.weapon).toBe(33);
    expect(campaign.checkpoints, campaign.weapon).toHaveLength(33);
    for (const checkpoint of campaign.checkpoints)
      expect(
        checkpoint.colors,
        `${campaign.weapon}: ${checkpoint.key} painted pixels`,
      ).toBeGreaterThan(8);
    expect(campaign.snapshotsPure, campaign.weapon).toBe(true);
    expect(campaign.commands, campaign.weapon).toBeLessThan(20000);
  }
  expect(result.pictures).toHaveLength(4);
  expect(new Set(result.pictures.map((picture) => picture.hash)).size).toBe(4);
  await mkdir(directory, { recursive: true });
  for (const picture of result.pictures)
    await writeFile(
      `${directory}/${picture.id}.png`,
      Buffer.from(picture.png.split(',')[1], 'base64'),
    );
  await writeFile(
    `${directory}/campaigns.json`,
    JSON.stringify({ campaigns: result.campaigns, provenance: result.provenance }, null, 2),
  );
  expect(errors).toEqual([]);
});
