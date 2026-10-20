import { join, relative, resolve, sep } from 'node:path';
import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

function bundleUrl(json: string): string {
  const value: unknown = JSON.parse(json);
  if (!value || typeof value !== 'object' || !('file' in value) || typeof value.file !== 'string')
    throw new Error('Expected trace bundle path');
  const path = relative(process.cwd(), value.file);
  if (path === '..' || path.startsWith('..' + sep))
    throw new Error('Trace bundle escaped repository');
  return '/' + path.split(sep).join('/');
}
const caseStudy = JSON.parse(
  readFileSync('packages/workshop-tools/trace/case-study.json', 'utf8'),
) as { threads: Array<{ id: string }>; stages: Array<{ title: string }> };
const input = resolve(process.env.TRACE_PRIVATE_INPUT ?? 'test-results/trace-visualizer-input');
const inputsAvailable = caseStudy.threads.every((thread) =>
  existsSync(join(input, `${thread.id}.json`)),
);
test.describe('requires private sculpture evidence', { tag: '@requires-private-evidence' }, () => {
  test.skip(
    !inputsAvailable,
    'Requires authorized local thread exports and retained artwork evidence; see test:browser:private.',
  );
  let url = '';
  test.beforeAll(() => {
    url = bundleUrl(
      execFileSync(
        process.env.REPO_WORKBENCH_CLI ?? 'repo-workbench',
        [
          'trace',
          '--repo',
          process.cwd(),
          '--input',
          input,
          '--case',
          'packages/workshop-tools/trace/case-study.json',
          '--out',
          `test-results/private-trace-${Date.now()}`,
        ],
        { encoding: 'utf8' },
      ),
    );
  });
  test('creation story connects superseded review decisions to records and retained source', async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await expect(page.locator('#documents')).toContainText(
      '650cf196fc37e217349837040f95298f2645fdef',
    );
    await expect(
      page.getByRole('heading', { name: 'How the sculptures took shape' }),
    ).toBeVisible();
    await page.getByRole('button', { name: /Round 5 · reviewer acceptance/ }).click();
    await expect(page.locator('#stage-status')).toHaveText(
      'Reviewer accepted · later user-rejected',
    );
    await page.getByRole('button', { name: 'Inspect this episode’s actions' }).click();
    await expect(page.locator('#event-list .selected-event > details[open]')).toContainText(
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
