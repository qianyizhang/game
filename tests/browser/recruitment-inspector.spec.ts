import { objectValue } from '../../src/shared/json';
import { replayEnvelope } from '../../src/engines/replay-envelope';
import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
let url: string;
test.beforeAll(() => {
  const folder = mkdtempSync(resolve('test-results', 'recruitment-viewer-'));
  const output = resolve(folder, 'smoke');
  execFileSync(process.execPath, [
    'scripts/hearth-recruitment-experiment.mjs',
    'smoke',
    output,
    '1',
  ]);
  const id = '1-classic-hidden-seat0-tempo-both-v2';
  const html = resolve(output, 'inspector.html');
  execFileSync(process.execPath, [
    'scripts/hearth-recruitment-inspect.mjs',
    resolve(output, id + '.replay.json'),
    resolve(output, id + '.receipt.json'),
    html,
  ]);
  url = '/' + relative(process.cwd(), html);
});
test('explores recorded decisions, policy alternatives and downloadable exact replay prefixes', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'Recruitment decision explorer' })).toBeVisible();
  await expect(page.locator('#case')).toContainText('tempo-both-v2');
  await expect(page.locator('#recorded')).toContainText('buy');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  const step = Number(new URL(page.url()).hash.split('=')[1]);
  expect(step).toBeGreaterThan(1);
  await expect(page.locator('#values tr')).not.toHaveCount(0);
  const recorded = await page.locator('#recorded').textContent();
  await page.getByLabel('Policy proposal').selectOption('baseline-v1');
  await expect(page.locator('#recorded')).toHaveText(recorded!);
  await expect(page.locator('#guards')).toContainText('disabled');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download replay prefix' }).click();
  const download = await downloadPromise;
  const prefix = replayEnvelope(readFileSync(await download.path(), 'utf8'));
  expect(prefix.commands).toHaveLength(step + 1);
  expect(objectValue(prefix.commands.at(-1)).action).toEqual(JSON.parse(recorded!));
  await page.reload();
  await expect(page.locator('#position')).toContainText(`Step ${step} ·`);
  await page.goto(url + '#step=999999');
  await expect(page.locator('#index')).toHaveText(/^1 \/ /);
  expect(errors).toEqual([]);
});
test('remains usable on a narrow screen', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByText('Evidence provenance and boundaries', { exact: true }).click();
  await expect(page.locator('#provenance')).toBeVisible();
  await page.screenshot({ path: info.outputPath('recruitment-phone.png'), fullPage: true });
});
