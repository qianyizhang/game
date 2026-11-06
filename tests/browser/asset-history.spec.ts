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
  const previousAsset = readHistory(root).history.assets.find(
    (asset) => asset.id === 'hearth/cub',
  )!;
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
    await page.addStyleTag({ content: ':root { font-size: 20px; }' });
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
    importHistory(root, readHistory(root).version, {
      schema: 1,
      assets: [previousAsset],
      attempts: [],
      revisions: [],
    });
  }
});

test('offline gallery history embeds artwork and settings without offering writes', async ({
  page,
}, info) => {
  const output = info.outputPath('export');
  execFileSync(process.execPath, ['packages/workshop-tools/art/gallery/export.ts', output]);
  const html = readFileSync(resolve(output, 'history.html'), 'utf8');
  const liveRequests: string[] = [];
  await page.route('**/__art/api/**', (route) => {
    liveRequests.push(route.request().url());
    return route.abort();
  });
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
  expect(liveRequests).toEqual([]);
});

test('Scrapyard uses selected vectors in cached Canvas sprites and reports decode failures', async ({
  page,
}) => {
  const root = process.cwd();
  const assets = ['survivor', 'floor-tile'] as const;
  const previous = Object.fromEntries(
    assets.map((id) => [id, readHistory(root).selections[`scrapyard/${id}`]?.revision ?? null]),
  );
  const attempt = 'browser-scrapyard-selection';
  const revisions = assets.map((id) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${id === 'survivor' ? '26 32' : '40 40'}"><path fill="${id === 'survivor' ? '#ff00ff' : '#00ffff'}" d="M0 0h40v40H0Z"/></svg>`;
    const file = `${MANAGED_PATH}/${attempt}/${id}.svg`;
    mkdirSync(resolve(root, MANAGED_PATH, attempt), { recursive: true });
    writeFileSync(resolve(root, file), svg);
    return {
      id: `${attempt}/${id}`,
      asset: `scrapyard/${id}`,
      attempt,
      label: `Canvas fixture ${id}`,
      file,
      digest: digest(svg),
      runtimeFile: file,
      runtimeDigest: digest(svg),
      parents: [],
      notes: 'Temporary Canvas selection fixture.',
    };
  });
  importHistory(root, readHistory(root).version, {
    schema: 1,
    assets: [],
    attempts: [
      {
        id: attempt,
        title: 'Canvas selection fixture',
        date: 'unknown',
        outcome: 'manual',
        files: [],
        notes: 'Temporary browser fixture.',
      },
    ],
    revisions,
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    useRevision(root, readHistory(root).version, 'scrapyard/floor-tile', revisions[1].id);
    await page.goto('/__art/#asset=scrapyard%2Fsurvivor');
    const candidate = page
      .locator('.revision')
      .filter({ has: page.getByRole('heading', { name: 'Canvas fixture survivor', exact: true }) });
    await candidate.getByRole('button', { name: 'Use in game', exact: true }).click();
    await expect(candidate.getByText('In game · canonical')).toBeVisible();
    await page.goto('/?prototype=scrapyard');
    await expect(page.getByRole('button', { name: 'Start run', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Start run', exact: true }).click();
    const pixels = () =>
      page.locator('canvas').evaluate((node) => {
        const canvas = node as HTMLCanvasElement;
        const bytes = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
        let actor = 0,
          floor = 0;
        for (let i = 0; i < bytes.length; i += 4) {
          if (bytes[i] > 240 && bytes[i + 1] < 10 && bytes[i + 2] > 240) actor++;
          if (bytes[i] < 40 && bytes[i + 1] > 90 && bytes[i + 2] > 90) floor++;
        }
        return { actor, floor };
      });
    await expect.poll(async () => (await pixels()).actor).toBeGreaterThan(10);
    await expect.poll(async () => (await pixels()).floor).toBeGreaterThan(1000);
    await page.reload();
    await page.getByRole('button', { name: 'Start run', exact: true }).click();
    await expect.poll(async () => (await pixels()).actor).toBeGreaterThan(10);
    await page.addInitScript(() => {
      HTMLImageElement.prototype.decode = () => Promise.reject(new Error('Fixture decode failure'));
    });
    await page.reload();
    await expect(page.getByRole('alert')).toContainText('Selected artwork could not be decoded');
    await expect(page.getByRole('button', { name: 'Start run', exact: true })).toBeDisabled();
    await expect(page.locator('canvas')).toHaveAttribute('data-tick', '0');
    expect(errors).toEqual([]);
  } finally {
    for (const id of assets)
      useRevision(root, readHistory(root).version, `scrapyard/${id}`, previous[id]);
    for (const revision of revisions) removeRevision(root, readHistory(root).version, revision.id);
    removeAttempt(root, readHistory(root).version, attempt);
  }
});

test('live browsing transfers metadata first and requests only the viewed asset artwork', async ({
  page,
}) => {
  const metadata = readHistory(process.cwd()).history;
  const requests: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/__art/api/artwork') requests.push(url);
  });
  const loaded = page.waitForResponse('**/__art/api/state');
  await page.goto('/__art/');
  const state = (await (await loaded).json()) as HistoryState;
  expect(state.current).toEqual({});
  expect(state.previews).toEqual({});
  await expect(page.locator('#asset-count')).toHaveText(`${metadata.assets.length} assets`);
  expect(requests).toHaveLength(0);
  await page.locator('a[href="#asset=hearth%2Fcub"]').click();
  await expect(page.locator('.live-source img')).toBeVisible();
  const revisions = metadata.revisions.filter(
    (revision) => revision.asset === 'hearth/cub' && !revision.file.endsWith('.gif'),
  );
  await expect(page.locator('[data-revision] .revision-preview img')).toHaveCount(
    revisions.length * 2,
  );
  expect(
    requests
      .filter((url) => url.searchParams.has('asset'))
      .map((url) => url.searchParams.get('asset')),
  ).toEqual(['hearth/cub']);
  expect(
    requests
      .filter((url) => url.searchParams.has('revision'))
      .map((url) => url.searchParams.get('revision'))
      .sort(),
  ).toEqual(revisions.map((revision) => revision.id).sort());
  expect(
    await page.locator('.revision img').evaluateAll(async (nodes) => {
      await Promise.all(nodes.map((node) => (node as HTMLImageElement).decode()));
      return nodes.every((node) => (node as HTMLImageElement).naturalWidth > 0);
    }),
  ).toBe(true);
  const oldCount = requests.length;
  await page.getByRole('button', { name: 'Reload history', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('History reloaded.');
  await expect(page.locator('.live-source img')).toBeVisible();
  expect(requests.length).toBeGreaterThan(oldCount);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addStyleTag({ content: ':root { font-size: 20px; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

// Delayed responses stand in for source rendering overlapping navigation and reload.
test('navigation and reload discard old artwork and fetch changed source without a registry change', async ({
  page,
}) => {
  const metadata = readHistory(process.cwd()).history;
  const a = 'hearth/cub',
    b = 'spire/metallicize';
  await page.route('**/__art/api/state', (route) =>
    route.fulfill({
      json: {
        version: 'unchanged-registry',
        live: true,
        selections: {},
        current: {},
        previews: {},
        history: {
          ...metadata,
          assets: metadata.assets.filter((asset) => [a, b].includes(asset.id)),
          revisions: [],
        },
      },
    }),
  );
  const image = (color: string) =>
    'data:image/svg+xml;base64,' +
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 112"><path fill="${color}" d="M0 0h160v112H0Z"/></svg>`,
    ).toString('base64');
  let releaseA!: () => void, releaseB!: () => void;
  const heldA = new Promise<void>((resolve) => {
    releaseA = resolve;
  });
  const heldB = new Promise<void>((resolve) => {
    releaseB = resolve;
  });
  let readsB = 0;
  const finished: Promise<unknown>[] = [];
  await page.route('**/__art/api/artwork?*', async (route) => {
    const asset = new URL(route.request().url()).searchParams.get('asset');
    const currentB = asset === b ? ++readsB : 0;
    if (asset === a) await heldA;
    if (asset === b && currentB === 1) await heldB;
    const result = route
      .fulfill({
        json: { kind: 'image', animated: false, url: image(currentB > 1 ? '#00ff00' : '#ff0000') },
      })
      .catch(() => {});
    finished.push(result);
    await result;
  });
  await page.goto('/__art/#asset=hearth%2Fcub');
  await expect(page.locator('.live-source')).toContainText('Loading artwork');
  const requestedB = page.waitForRequest(
    (request) => new URL(request.url()).searchParams.get('asset') === b,
  );
  await page.locator('a[href="#asset=spire%2Fmetallicize"]').click();
  await requestedB;
  await page.getByRole('button', { name: 'Reload history', exact: true }).click();
  const current = page.locator('.live-source img');
  await expect(current).toHaveAttribute('src', image('#00ff00'));
  releaseA();
  releaseB();
  await expect.poll(() => finished.length).toBe(3);
  await Promise.all(finished);
  await expect(current).toHaveAttribute('src', image('#00ff00'));
  await expect(page.getByRole('heading', { name: 'Metallicize', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('History reloaded.');
});

test('GIF previews fetch only on explicit play or download and respect reduced motion', async ({
  page,
}) => {
  const metadata = readHistory(process.cwd()).history;
  const gif = metadata.revisions.find((revision) => revision.file.endsWith('.gif'))!;
  expect(gif).toBeTruthy();
  await page.route('**/__art/api/state', async (route) => {
    const response = await route.fetch();
    const state = (await response.json()) as HistoryState;
    state.history.revisions = [gif];
    await route.fulfill({ json: state });
  });
  const requests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).searchParams.get('revision') === gif.id)
      requests.push(request.url());
  });
  await page.goto('/__art/#asset=' + encodeURIComponent(gif.asset ?? '__unassigned'));
  const card = page.locator('[data-revision]');
  await expect(card.getByRole('button', { name: 'Play GIF', exact: true })).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await card.getByRole('button', { name: 'Play GIF', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('disabled by reduced motion');
  expect(requests).toHaveLength(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await card.getByRole('button', { name: 'Play GIF', exact: true }).click();
  await expect(card.locator('img')).toBeVisible();
  expect(requests).toHaveLength(1);
  await card.getByRole('button', { name: 'Stop GIF', exact: true }).click();
  await expect(card.locator('img')).toHaveCount(0);
  const download = page.waitForEvent('download');
  await card.getByRole('button', { name: 'Download GIF', exact: true }).click();
  expect((await download).suggestedFilename()).toBe(gif.file.split('/').at(-1));
  expect(requests).toHaveLength(2);
  await expect(card.locator('img')).toHaveCount(0);
});

test('failed revision previews leave source and other revisions usable', async ({ page }) => {
  const history = readHistory(process.cwd()).history;
  const revisions = history.revisions.filter((revision) => revision.asset === 'hearth/cub');
  expect(revisions.length).toBeGreaterThan(2);
  const failed = revisions.slice(0, 2);
  await page.route('**/__art/api/artwork?*', async (route) => {
    const id = new URL(route.request().url()).searchParams.get('revision');
    const index = failed.findIndex((revision) => revision.id === id);
    if (index >= 0)
      await route.fulfill({
        status: 409,
        json: {
          error:
            index === 0
              ? 'Artwork changed since registration: fixture.svg'
              : 'Artwork is missing: fixture.svg',
        },
      });
    else await route.continue();
  });
  await page.goto('/__art/#asset=hearth%2Fcub');
  await expect(page.locator('.live-source img')).toBeVisible();
  const card = (id: string) =>
    page.locator('[data-revision]').filter({ has: page.locator('.source-note', { hasText: id }) });
  await expect(card(failed[0].id).locator('.revision-preview')).toContainText(
    'changed since registration',
  );
  await expect(card(failed[1].id).locator('.revision-preview')).toContainText('Artwork is missing');
  await expect(card(revisions[2].id).locator('img')).toHaveCount(2);
  await expect(page.locator('#assets a').first()).toBeEnabled();
});
