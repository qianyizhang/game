import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const caseStudy = JSON.parse(readFileSync('scripts/trace-visualizer/case-study.json', 'utf8'));
const inputsAvailable = caseStudy.threads.every((thread: { id: string }) =>
  existsSync(`test-results/trace-visualizer-input/${thread.id}.json`),
);
test.skip(
  !inputsAvailable,
  'Local example requires the authorized thread exports and artwork evidence.',
);
test.beforeAll(() => {
  execFileSync(process.execPath, ['scripts/trace-visualizer/build.mjs']);
});

const url = '/test-results/trace-visualizer/index.html';
test('creation story connects superseded review decisions to records and retained source', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'How the sculptures took shape' })).toBeVisible();
  await page.getByRole('button', { name: /Round 5 · reviewer acceptance/ }).click();
  await expect(page.locator('#stage-status')).toHaveText('Reviewer accepted · later user-rejected');
  await page.getByRole('button', { name: 'Inspect this turn’s actions' }).click();
  await expect(page.locator('#event-list details[open]')).toContainText(
    'Hydra now passes my visual review',
  );
  await page.getByRole('combobox', { name: 'Record type', exact: true }).selectOption('command');
  await page.getByLabel('Search text, output or file').fill('roughness');
  await expect(page.locator('#event-list .event')).not.toHaveCount(0);
  await page.getByLabel('Search text, output or file').fill('no-such-record-zzzz');
  await expect(page.locator('#event-list')).toHaveText('No records match these filters.');
  await page.getByRole('button', { name: 'Source & provenance', exact: true }).click();
  await expect(page.locator('#source-meta')).toContainText('Compared with: Round 4');
  await page
    .getByRole('combobox', { name: 'Source file', exact: true })
    .selectOption({ label: 'newStudies.ts' });
  await expect(page.locator('#source-code')).toContainText('diff --git');
  await page.getByRole('combobox', { name: 'Display', exact: true }).selectOption('full');
  await expect(page.locator('#source-code')).toContainText('import');
  await page.getByRole('button', { name: 'Creation story', exact: true }).click();
  await page.reload();
  await expect(page.locator('#stage-title')).toHaveText('Round 5 · reviewer acceptance');
  await page.getByRole('button', { name: /Rebuild around gesture/ }).click();
  await expect(page.locator('#stage-status')).toHaveText('Rebuilt · Hydra later user-rejected');
  await page.screenshot({ path: info.outputPath('story-desktop.png'), fullPage: true });
  expect(errors).toEqual([]);
});
test('compares real captures, labels missing views, and works at phone width', async ({
  page,
}, info) => {
  await page.goto(url);
  await page.getByRole('button', { name: 'Compare revisions', exact: true }).click();
  await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('hydra');
  await page.getByRole('combobox', { name: 'Before', exact: true }).selectOption('4');
  await page.getByRole('combobox', { name: 'After', exact: true }).selectOption('11');
  await expect(page.locator('#compare-images img')).toHaveCount(2);
  await expect
    .poll(() =>
      page
        .locator('#compare-images img')
        .evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).naturalWidth > 0)),
    )
    .toBe(true);
  await page.screenshot({ path: info.outputPath('compare-desktop.png'), fullPage: true });
  await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('nightjar');
  await page.getByRole('combobox', { name: 'Before', exact: true }).selectOption('0');
  await page.getByRole('combobox', { name: 'View', exact: true }).selectOption('back');
  await expect(page.locator('#compare-images')).toContainText(
    'No retained back capture of nightjar',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  for (const view of [
    'Creation story',
    'Compare revisions',
    'Recorded actions',
    'Source & provenance',
  ]) {
    await page.getByRole('button', { name: view, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.getByRole('button', { name: 'Creation story', exact: true }).click();
  await page.screenshot({ path: info.outputPath('story-phone.png'), fullPage: true });
});

test('latest work preserves positive Hydra feedback and mixed bird authorship', async ({
  page,
}, info) => {
  await page.goto(url + '#stage=15&view=story');
  await expect(page.locator('#stage-status')).toHaveText('Positive user feedback · Hydra');
  await page.getByText('Read the recorded statement behind this stage').click();
  await expect(page.locator('#quote')).toContainText('this is much better');
  await page.getByRole('button', { name: /Bird round 4/ }).click();
  await expect(page.locator('#finding')).toContainText('parent took over both');
  await expect(page.getByRole('combobox', { name: 'Stage subject', exact: true })).toHaveValue(
    'phoenix',
  );
  await page.getByRole('combobox', { name: 'Stage subject', exact: true }).selectOption('nightjar');
  await expect(page.locator('#story-images img').last()).toHaveAttribute(
    'alt',
    /nightjar.*Bird round 4/,
  );
  await page.getByRole('button', { name: /Phoenix · direct parent finishing/ }).click();
  await page.getByRole('button', { name: 'Inspect retained source changes' }).click();
  await page
    .getByRole('combobox', { name: 'Source file', exact: true })
    .selectOption({ label: 'phoenix.ts' });
  await expect(page.locator('#source-meta')).toContainText('Compared with: Bird round 4');
  await page.getByRole('button', { name: 'Creation story', exact: true }).click();
  await page.getByRole('button', { name: /Delivery · animation/ }).click();
  await expect(page.locator('#finding')).toContainText('252 unit tests');
  await page.screenshot({ path: info.outputPath('latest-delivery.png'), fullPage: true });
  await page.getByRole('button', { name: 'Compare revisions', exact: true }).click();
  await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('phoenix');
  await page
    .getByRole('combobox', { name: 'After', exact: true })
    .selectOption(String(caseStudy.stages.length - 1));
  await page
    .getByRole('combobox', { name: 'View', exact: true })
    .selectOption('roundtrip-exported');
  await expect(page.locator('#compare-images img').last()).toHaveAttribute(
    'alt',
    /phoenix, roundtrip-exported, Delivery/,
  );
  await expect
    .poll(() =>
      page
        .locator('#compare-images img')
        .last()
        .evaluate((i) => (i as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
});
