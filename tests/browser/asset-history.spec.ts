import { expect, test } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  readHistory,
  importHistory,
  useRevision,
  removeRevision,
  removeAttempt,
  MANAGED_PATH,
  digest,
} from '../../packages/workshop-tools/art/history-store';
import type { HistoryState } from '../../packages/workshop-tools/art/history-types';

test('gallery selections reach the real game, survive reload, and removal preserves the active choice', async ({
  page,
}, info) => {
  const root = process.cwd();
  const previous = readHistory(root).selections['hearth/cub']?.revision ?? null;
  const id = 'browser-removal-fixture';
  let checkpoint: { revisions: string[]; attempt?: string } = { revisions: [] };
  const file = `${MANAGED_PATH}/browser-removal-fixture/unused.svg`;
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 112"><path d="M20 20h120v72H20Z" fill="#c4ad72"/></svg>';
  mkdirSync(resolve(root, MANAGED_PATH, id), { recursive: true });
  writeFileSync(resolve(root, file), svg);
  importHistory(root, readHistory(root).version, {
    schema: 1,
    assets: [],
    attempts: [
      {
        id,
        title: 'Browser removal fixture',
        date: 'unknown',
        outcome: 'manual',
        files: [],
        notes: 'Temporary browser fixture.',
      },
    ],
    revisions: [
      {
        id,
        asset: 'hearth/cub',
        attempt: id,
        label: 'Unused removal fixture',
        file,
        digest: digest(svg),
        runtimeFile: file,
        runtimeDigest: digest(svg),
        parents: [],
        notes: 'Temporary browser fixture.',
      },
    ],
  });
  try {
    await page.goto('/__art/#asset=hearth%2Fcub');
    await expect(page.locator('#asset-count')).toHaveText(
      `${readHistory(root).history.assets.length} assets`,
    );
    const stale = readHistory(root).version;
    const revision = 'retained:hearth-effort-comparison/single-medium.svg';
    const candidate = page
      .locator('.revision')
      .filter({ has: page.getByRole('heading', { name: 'single-medium', exact: true }) });
    await candidate.getByRole('button', { name: 'Use in game', exact: true }).click();
    await expect(candidate.getByText('In game · canonical')).toBeVisible();
    await expect(candidate.getByRole('button', { name: 'Remove', exact: true })).toBeDisabled();
    const staleResult = await page.evaluate(async (version) => {
      const response = await fetch('/__art/api/use', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ version, asset: 'hearth/cub', revision: null }),
      });
      return { code: response.status, body: await response.text() };
    }, stale);
    expect(staleResult.code).toBe(409);
    expect(staleResult.body).toContain('History changed');
    await page.screenshot({ path: info.outputPath('history-desktop.png') });
    await page.goto('/?game=battlegrounds');
    await page.getByLabel('Choose game').selectOption('battlegrounds');
    await page.locator('.hero-choices > button').first().click();
    await page.getByRole('button', { name: 'Collection', exact: true }).click();
    const cub = page.locator('svg[data-art-asset="hearth/cub"]').first();
    await expect(cub).toHaveAttribute('data-art-selection', revision);
    await expect(cub.locator('svg')).toHaveAttribute('viewBox', '0 0 1280 896');
    expect(await cub.locator('path').count()).toBeGreaterThan(0);
    const saved = await page.evaluate(() => ({ ...localStorage }));
    await page.goto('/__art/#asset=hearth%2Fcub');
    await expect(candidate.getByText('In game · canonical')).toBeVisible();
    const unused = page
      .locator('.revision')
      .filter({ has: page.getByRole('heading', { name: 'Unused removal fixture', exact: true }) });
    await unused.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText(file);
    await page.getByRole('button', { name: 'Remove revision', exact: true }).click();
    await expect(unused).toHaveCount(0);
    expect(existsSync(resolve(root, file))).toBe(false);
    await page.getByRole('button', { name: 'Use editable source', exact: true }).click();
    await expect(page.getByText('In game: editable source.', { exact: false })).toBeVisible();
    expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(saved);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#browse')).not.toHaveAttribute('open', '');
    await page.screenshot({ path: info.outputPath('history-phone.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const checkpointResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/__art/api/snapshot') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Save source revision', exact: true }).click();
    checkpoint = (await (await checkpointResponse).json()) as {
      revisions: string[];
      attempt?: string;
    };
    await expect(page.getByRole('status')).toContainText('No generation was run');
  } finally {
    useRevision(root, readHistory(root).version, 'hearth/cub', previous);
    for (const revision of checkpoint.revisions ?? [])
      if (readHistory(root).history.revisions.some((item) => item.id === revision))
        removeRevision(root, readHistory(root).version, revision);
    if (
      checkpoint.attempt &&
      readHistory(root).history.attempts.some((attempt) => attempt.id === checkpoint.attempt)
    )
      removeAttempt(root, readHistory(root).version, checkpoint.attempt);
    if (readHistory(root).history.revisions.some((revision) => revision.id === id))
      removeRevision(root, readHistory(root).version, id);
    if (readHistory(root).history.attempts.some((attempt) => attempt.id === id))
      removeAttempt(root, readHistory(root).version, id);
  }
});

test('offline gallery history embeds artwork and settings without offering writes', async ({
  page,
}, info) => {
  const output = info.outputPath('export');
  execFileSync(process.execPath, ['packages/workshop-tools/art/gallery/export.ts', output]);
  const html = readFileSync(resolve(output, 'history.html'), 'utf8');
  await page.route('**/offline-history.html', (route) =>
    route.fulfill({ contentType: 'text/html', body: html }),
  );
  await page.goto('/offline-history.html#asset=spire%2Fmetallicize');
  await expect(page.getByRole('heading', { name: 'Metallicize', exact: true })).toBeVisible();
  expect(
    await page
      .locator('.revision img')
      .first()
      .evaluate(async (node) => {
        const image = node as HTMLImageElement;
        await image.decode();
        return image.naturalWidth;
      }),
  ).toBeGreaterThan(0);
  const candidate = page
    .locator('.revision')
    .filter({ has: page.getByRole('heading', { name: 'metallicize-base', exact: true }) });
  await candidate.getByText('Prompt, settings and outcome', { exact: true }).click();
  await candidate.getByRole('button', { name: 'svg-request.json', exact: true }).click();
  await expect(candidate.locator('pre')).toContainText('gpt-image');
  await page.getByText('Generation and authoring attempts', { exact: true }).click();
  const gifAttempt = page
    .locator('#failures > details')
    .filter({ hasText: 'spire-defense-batch/gif · returned' });
  await gifAttempt.locator('summary').click();
  await gifAttempt.getByRole('button', { name: 'reference.png', exact: true }).click();
  await expect(gifAttempt.getByRole('img', { name: 'reference.png', exact: true })).toBeVisible();
  expect(
    await gifAttempt
      .getByRole('img', { name: 'reference.png', exact: true })
      .evaluate(async (node) => {
        const image = node as HTMLImageElement;
        await image.decode();
        return image.naturalWidth;
      }),
  ).toBeGreaterThan(0);

  await expect(candidate.getByRole('button', { name: 'Use in game', exact: true })).toBeDisabled();
  await expect(candidate.getByRole('button', { name: 'Remove', exact: true })).toBeDisabled();
  const state = await page.locator('#history-state').textContent();
  expect((JSON.parse(state!) as HistoryState).live).toBe(false);
  // The export is also directly openable from disk; it is not tied to the preview route.
  await page.goto(pathToFileURL(resolve(output, 'history.html')).href + '#asset=hearth%2Fcub');
  await expect(page.getByRole('heading', { name: 'Briar Cub', exact: true })).toBeVisible();
});
