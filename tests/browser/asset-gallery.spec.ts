import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { pathToFileURL } from 'node:url';

test('independent asset comparisons, changelog links, offline delivery and phone layout', async ({
  page,
}, info) => {
  const output = info.outputPath('gallery');
  execFileSync(process.execPath, ['packages/workshop-tools/art/gallery/export.ts', output]);
  const html = readFileSync(`${output}/reviews/index.html`);
  expect(html.length).toBeLessThanOrEqual(600 * 1024);
  // Serve the generated file unchanged: Vite's dev client would add a script to static HTML.
  await page.route('**/asset-review.html', (route) =>
    route.fulfill({ contentType: 'text/html', body: html }),
  );
  const emberwakeHtml = readFileSync(`${output}/reviews/emberwake.html`);
  expect(emberwakeHtml.length).toBeLessThanOrEqual(600 * 1024);
  await page.route('**/emberwake.html', (route) =>
    route.fulfill({ contentType: 'text/html', body: emberwakeHtml }),
  );
  await page.route('**/index.html', (route) =>
    route.fulfill({ contentType: 'text/html', body: html }),
  );
  const external: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== 'http://127.0.0.1:4173')
      external.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('asset-review-save-sentinel', 'unchanged'));
  await page.goto('/asset-review.html');
  const saved = await page.evaluate(() => ({ ...localStorage }));
  await expect(page.getByRole('heading', { name: 'Latest changes', exact: true })).toBeVisible();
  const dates = await page
    .locator('time')
    .evaluateAll((times) => times.map((t) => t.getAttribute('datetime')!));
  expect(dates).toEqual([...dates].sort().reverse());
  for (const href of await page
    .locator('.change-links a[href^="#"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')!)))
    await expect(page.locator(href)).toHaveCount(1);
  const attack = page.locator('#asset-attack details');
  const block = page.locator('#asset-block details');
  await attack.locator('summary').focus();
  await page.keyboard.press('Enter');
  await block.locator('summary').click();
  await expect(attack).toHaveAttribute('open', '');
  await expect(block).toHaveAttribute('open', '');
  await attack.locator('summary').click();
  await expect(attack).not.toHaveAttribute('open', '');
  await expect(block).toHaveAttribute('open', '');
  const decoded: boolean[] = [];
  for (const image of await page.locator('img').all()) {
    // Retained history can put a lazy capture outside the initial preload distance.
    await image.scrollIntoViewIfNeeded();
    decoded.push(
      await image.evaluate(async (node) => {
        const img = node as HTMLImageElement;
        await img.decode();
        return img.naturalWidth > 0 && img.naturalHeight > 0;
      }),
    );
  }
  expect(decoded).toEqual(Array<boolean>(10).fill(true));
  const map = page.locator('#review-cartographer');
  await map.locator('summary').click();
  await expect(map).not.toHaveAttribute('open', '');
  await expect(page.locator('#review-hearth-shield')).toHaveAttribute('open', '');
  await expect(page.locator('#review-score')).toHaveAttribute('open', '');
  await expect(page.locator('#review-combat')).toHaveAttribute('open', '');
  await map.locator('summary').click();
  await expect(page.getByText('Local only · not submitted', { exact: true })).toBeVisible();
  const shield = page.locator('#review-hearth-shield');
  const score = page.locator('#review-score');
  await shield.locator('summary').click();
  await expect(shield).not.toHaveAttribute('open', '');
  await expect(score).toHaveAttribute('open', '');
  await expect(page.locator('#review-combat')).toHaveAttribute('open', '');
  await shield.locator('summary').click();
  await expect(shield.locator('.hearth-shield-break')).toHaveText('Shield broken');
  await score.locator('summary').click();
  await expect(score).not.toHaveAttribute('open', '');
  await expect(shield).toHaveAttribute('open', '');
  await expect(page.locator('#review-combat')).toHaveAttribute('open', '');
  await expect(block).toHaveAttribute('open', '');
  await score.locator('summary').click();
  await expect(score.locator('.score-source h3')).toHaveText('Spark');
  await expect(page.locator('script')).toHaveCount(0);
  await map.screenshot({ path: info.outputPath('gallery-cartographer-desktop.png') });
  await shield.screenshot({
    path: info.outputPath('gallery-shield-desktop.png'),
    animations: 'disabled',
  });
  await score.screenshot({
    path: info.outputPath('gallery-score-desktop.png'),
    animations: 'disabled',
  });
  await page.screenshot({ path: info.outputPath('gallery-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await map.screenshot({ path: info.outputPath('gallery-cartographer-phone.png') });
  await shield.screenshot({
    path: info.outputPath('gallery-shield-phone.png'),
    animations: 'disabled',
  });
  await score.screenshot({
    path: info.outputPath('gallery-score-phone.png'),
    animations: 'disabled',
  });
  await page.screenshot({ path: info.outputPath('gallery-phone.png'), fullPage: true });
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(saved);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  // The portable delivery contains the same preserved, dated source history.
  expect(readFileSync(`${output}/reviews/CHANGELOG.json`, 'utf8')).toBe(
    readFileSync('packages/workshop-tools/art/gallery/reviews/CHANGELOG.json', 'utf8'),
  );
  expect(relative(process.cwd(), output)).not.toContain('..');
  await page
    .locator('#review-emberwake')
    .getByRole('link', { name: 'Open the Emberwake comparison' })
    .click();
  await expect(page.getByRole('heading', { name: 'Heroes and crypt silhouettes' })).toBeVisible();
  for (const image of await page.locator('img').all()) {
    await image.scrollIntoViewIfNeeded();
    expect(
      await image.evaluate(async (node) => {
        const img = node as HTMLImageElement;
        await img.decode();
        return img.naturalWidth > 0 && img.naturalHeight > 0;
      }),
    ).toBe(true);
  }
  expect(await page.locator('img').count()).toBe(4);
  const scenes = page.locator('details').first();
  await scenes.locator('summary').click();
  await expect(scenes).not.toHaveAttribute('open', '');
  await expect(page.locator('details').last()).toHaveAttribute('open', '');
  await scenes.locator('summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('gallery-emberwake-phone.png'), fullPage: true });
  await page.getByRole('link', { name: 'Return to the gallery changelog' }).click();
  await expect(page.getByRole('heading', { name: 'Latest changes', exact: true })).toBeVisible();
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(saved);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('per-game galleries preserve navigation, show current renderers and compare staged SVG candidates', async ({
  page,
}, info) => {
  const output = info.outputPath('per-game');
  execFileSync(process.execPath, ['packages/workshop-tools/art/gallery/export.ts', output]);
  const base = pathToFileURL(output + '/').href.replace(/\/$/, '');
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== 'http://127.0.0.1:4173')
      external.push(request.url());
  });
  await page.goto(`${base}/index.html`);
  for (const [id, name] of [
    ['blindside', 'Blindside'],
    ['spire', 'Slay the Spire'],
    ['hearth', 'Last Hearth'],
    ['cartographer', 'Dungeon Cartographer'],
    ['emberwake', 'Emberwake'],
    ['night-passage', 'Night Passage'],
    ['scrapyard', 'Scrapyard'],
  ]) {
    await page
      .getByRole('navigation', { name: 'Game galleries' })
      .getByRole('link', { name, exact: true })
      .click();
    await expect(page).toHaveURL(`${base}/${id}.html`);
    await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(
      id === 'emberwake' ? 6 : id === 'night-passage' || id === 'scrapyard' ? 1 : 0,
    );
    for (const canvas of await page.locator('canvas').all()) {
      await expect(canvas).toHaveAttribute('data-ready', 'true');
      expect(
        await canvas.evaluate((element) => {
          const canvas = element as HTMLCanvasElement;
          const pixels = canvas
            .getContext('2d')!
            .getImageData(0, 0, canvas.width, canvas.height).data;
          return new Set(Array.from(pixels.filter((_, index) => index % 4 === 0))).size > 3;
        }),
      ).toBe(true);
    }
    await page.getByRole('link', { name: /Recent upgrades \(/ }).click();
    await expect(page.locator('#upgrades')).toBeVisible();
    await expect(page.locator('#current')).toBeHidden();
    const dates = await page
      .locator('#upgrades time')
      .evaluateAll((elements) => elements.map((element) => element.getAttribute('datetime')!));
    expect(dates).toEqual([...dates].sort().reverse());
    await page.getByRole('link', { name: /Next batch \(/ }).click();
    await expect(page.locator('#candidates .candidate')).not.toHaveCount(0);
  }
  await page.goto(`${base}/spire.html#candidates`);
  await expect(page.locator('#candidates .candidate')).toHaveCount(3);
  await expect(page.getByText('Generated · awaiting review', { exact: true })).toHaveCount(3);
  await page.locator('#candidate-metallicize summary').click();
  for (const image of await page.locator('#candidates img').all()) {
    await image.evaluate((element) => {
      (element as HTMLImageElement).loading = 'eager';
    });
    await expect(async () =>
      expect(
        await image.evaluate(async (element) => {
          const image = element as HTMLImageElement;
          await image.decode();
          return image.naturalWidth > 0;
        }),
      ).toBe(true),
    ).toPass();
  }
  await page.screenshot({ path: info.outputPath('spire-candidates-desktop.png'), fullPage: true });
  for (const id of ['metallicize', 'ghostlyArmor', 'sentinel'])
    await page
      .locator(`#candidate-${id} .comparisons`)
      .screenshot({ path: info.outputPath(`${id}-comparison.png`) });
  await page.getByRole('link', { name: 'Current assets', exact: true }).click();
  await page.getByLabel('Find an illustration').fill('sentinel');
  await expect(page.locator('.asset:visible')).toHaveCount(2);
  await page.getByRole('link', { name: /Recent upgrades \(/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Backflip+ gains a distinct flip silhouette' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Current assets', exact: true }).click();
  await expect(page.getByLabel('Find an illustration')).toHaveValue('sentinel');
  await expect(page.locator('.asset:visible')).toHaveCount(2);
  await page.goBack();
  await expect(page.locator('#upgrades')).toBeVisible();
  await page.getByRole('link', { name: 'Historical feedback comparisons', exact: true }).click();
  await expect(page).toHaveURL(`${base}/reviews/index.html`);
  await expect(page.getByRole('heading', { name: 'Latest changes', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Return to asset gallery', exact: true }).click();
  await expect(page).toHaveURL(`${base}/index.html#upgrades`);
  await page.goto(`${base}/spire.html#unknown`);
  await expect(page.locator('#current')).toBeVisible();
  for (const id of ['spire', 'cartographer', 'emberwake', 'scrapyard']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/${id}.html${id === 'spire' ? '#candidates' : ''}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`${id}-phone.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: () => null });
  });
  await page.goto(`${base}/emberwake.html`);
  await expect(page.getByText('Canvas 2D is unavailable.', { exact: true })).toHaveCount(6);
});
