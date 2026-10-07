import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const caseStudy = JSON.parse(readFileSync('scripts/trace-visualizer/case-study.json', 'utf8'));
const inputsAvailable = caseStudy.threads.every((thread: { id: string }) =>
  existsSync(`test-results/trace-visualizer-input/${thread.id}.json`),
);
test.describe('private sculpture case', () => {
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
    await expect(
      page.getByRole('heading', { name: 'How the sculptures took shape' }),
    ).toBeVisible();
    await page.getByRole('button', { name: /Round 5 · reviewer acceptance/ }).click();
    await expect(page.locator('#stage-status')).toHaveText(
      'Reviewer accepted · later user-rejected',
    );
    await page.getByRole('button', { name: 'Inspect this episode’s actions' }).click();
    await expect(page.locator('#event-list details[open]')).toContainText(
      'Hydra now passes my visual review',
    );
    await page.getByRole('combobox', { name: 'Evidence scope', exact: true }).selectOption('all');
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
    await page
      .getByRole('combobox', { name: 'Stage subject', exact: true })
      .selectOption('nightjar');
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
  test('review checkpoints retain artifacts while inspecting consequential evidence', async ({
    page,
  }, info) => {
    for (const index of [0, 5, 16, 19, 20, 22]) {
      await page.goto(url + '#stage=' + index + '&view=story');
      await expect(page.locator('#stage-title')).toHaveText(caseStudy.stages[index].title);
      await expect(page.locator('#episode-evidence .evidence-row').first()).toBeVisible();
      await expect(page.locator('#story-images img').last()).toBeVisible();
      await page.screenshot({ path: info.outputPath('checkpoint-' + index + '.png') });
      await page.locator('#episode-evidence .evidence-row').first().click();
      await expect(page.locator('#evidence-drawer')).toBeVisible();
      await expect(page.locator('#story-images')).toBeVisible();
      await page.screenshot({ path: info.outputPath('evidence-' + index + '.png') });
      await page.keyboard.press('Escape');
    }
    await page.getByRole('button', { name: 'Compare revisions', exact: true }).click();
    await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('nightjar');
    const cell = page
      .locator('#criterion-matrix tr')
      .filter({ has: page.getByRole('rowheader', { name: 'surface texture', exact: true }) })
      .getByRole('button', { name: 'rejected · reviewer', exact: true })
      .first();
    await cell.click();
    await expect(page.getByRole('combobox', { name: 'After', exact: true })).toHaveValue('18');
    await expect(page.locator('#drawer-title')).toContainText('surface texture');
    await page
      .locator('#drawer-artifact img')
      .evaluate((image) => (image as HTMLImageElement).decode());
    await expect
      .poll(() =>
        page
          .locator('#drawer-artifact img')
          .evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await page
      .locator('#compare-images img')
      .evaluateAll((images) =>
        Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
      );
    await page.screenshot({ path: info.outputPath('criterion-evidence.png') });
  });
});

test.describe('public synthetic behavior case', () => {
  test.beforeAll(() => {
    execFileSync(process.execPath, [
      '--input-type=module',
      '-e',
      `
      import {writeFixture} from './scripts/trace-visualizer/fixture.mjs';
      import {buildCase} from './scripts/trace-visualizer/build.mjs';
      import {resolve} from 'node:path';
      await buildCase(await writeFixture(resolve('test-results/trace-public-fixture')));
    `,
    ]);
  });
  const fixtureUrl = '/test-results/trace-public-fixture/output/index.html';
  test('episode evidence selects an exact cross-thread event and retains artifact context', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(fixtureUrl);
    await expect(page.locator('#coverage-summary')).toContainText('1 unsupported');
    await expect(page.locator('#ownership')).toContainText('construction');
    await expect(page.locator('#ownership')).toContainText('exact interleaving unavailable');
    await expect(page.locator('#story-images')).toContainText('No retained hero capture');
    await expect(page.locator('#episode-evidence .evidence-row')).toHaveCount(6);
    await page
      .locator('#episode-evidence')
      .getByRole('button', { name: /edit.*Recorded file changes/ })
      .click();
    await expect(page.locator('#drawer-content')).toContainText('Source truncated upstream');
    await expect(page.locator('#story-images')).toBeVisible();
    await page.getByRole('button', { name: 'Open exact recorded action' }).click();
    await expect(page.locator('#event-list .selected-event')).toContainText('src/bird.ts');
    await expect(page.locator('#action-context')).toContainText('Wing review');
    await page.reload();
    await expect(page.locator('#drawer-content')).toContainText('src/bird.ts');
    await page.keyboard.press('Escape');
    await page
      .getByRole('combobox', { name: 'Evidence role', exact: true })
      .selectOption('verification');
    await expect(page.locator('#event-list .event')).toHaveCount(1);
    await page.getByRole('button', { name: 'Inspect evidence', exact: true }).click();
    await expect(page.locator('#drawer-content')).toContainText('Viewer preview shortened');
    await expect(page.locator('#drawer-content')).not.toContainText('Source truncated upstream');
    await page.locator('#drawer-content').getByText('Recorded output', { exact: true }).click();
    await expect(
      page.locator('#drawer-content pre').filter({ hasText: 'Complete available output.' }),
    ).toContainText('x'.repeat(17000));
    expect(errors).toEqual([]);
  });
  test('criterion cells expose assessor, artifact and limits; coverage preserves omitted identities', async ({
    page,
  }) => {
    await page.goto(fixtureUrl);
    await page.getByRole('button', { name: 'Compare revisions', exact: true }).click();
    await page
      .locator('#criterion-matrix')
      .getByRole('button', { name: 'issue · reviewer' })
      .click();
    await expect(page.locator('#drawer-content')).toContainText('Parent');
    await expect(page.locator('#drawer-content')).toContainText('Artifact revision: revision:bird');
    await page.locator('#drawer-content .evidence-row').click();
    await expect(page.locator('#drawer-content')).toContainText(
      'Wing attachment still needs revision.',
    );
    await page.keyboard.press('Escape');
    await page
      .locator('#criterion-matrix')
      .getByRole('button', { name: 'unrecorded · record limit' })
      .click();
    await expect(page.locator('#drawer-content')).toContainText('No supporting event recorded.');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Source & provenance', exact: true }).click();
    await page
      .locator('#coverage-details summary')
      .filter({ hasText: 'Parent · ReadThread' })
      .click();
    await expect(page.locator('#coverage-details')).toContainText('futureEvent ×1');
    await page.getByText('Unsupported: futureEvent ×1', { exact: true }).click();
    await expect(page.locator('#coverage-details')).toContainText('parent / turn / unknown');
    await expect(page.locator('body')).not.toContainText('Do not expose this');
  });
  test('mobile evidence drawer and views do not overflow', async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(fixtureUrl);
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
    await page.locator('#episode-evidence .evidence-row').first().click();
    await expect(page.getByRole('button', { name: 'Close evidence ×' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath('evidence-phone.png') });
    await page.keyboard.press('Escape');
    await expect(page.locator('#evidence-drawer')).toBeHidden();
  });
});
