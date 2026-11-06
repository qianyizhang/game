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
  await page.goto(`${base}/wip.html`);
  await expect(page.getByRole('heading', { name: 'WIP batches', exact: true })).toBeVisible();
  await expect(page.locator('#wip')).toBeVisible();
  await expect(page.locator('#current')).toBeHidden();
  await expect(page.getByText('Accepted · selected art installed', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Proposed · awaiting agreement', { exact: true })).toHaveCount(1);
  await expect(
    page.getByRole('heading', {
      name: 'Batch 02 · Six small units, normal and Golden',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('.packed-grid > article')).toHaveCount(3);
  await expect(page.locator('.packed-grid img[alt]:not([alt=""])')).toHaveCount(9);
  const effect = page.locator('.play-effect');
  await expect(effect.locator('img')).toHaveAttribute('src', /^data:image\/png;/);
  await effect.getByRole('button', { name: 'Play effect', exact: true }).click();
  await expect(effect.locator('img')).toHaveAttribute('src', /^data:image\/gif;/);
  await expect(effect.getByRole('status')).toContainText('Playing once');
  await effect.getByRole('button', { name: 'Show still', exact: true }).click();
  await expect(effect.locator('img')).toHaveAttribute('src', /^data:image\/png;/);
  await effect.getByRole('button', { name: 'Replay effect', exact: true }).click();
  await expect(effect.getByRole('status')).toContainText('Still frame');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(effect.getByRole('button', { name: 'Replay effect', exact: true })).toBeDisabled();
  await expect(effect.getByRole('status')).toContainText('reduced motion');
  await expect(effect.locator('img')).toHaveAttribute('src', /^data:image\/png;/);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const plan = page.locator('#batch-spire-defense-01 details').filter({
    has: page.locator('summary', { hasText: 'Request plan and acceptance checks' }),
  });
  await plan.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'One SVG request', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'One GIF request', exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#batch-spire-defense-01 .retention-note')).toBeVisible();
  await page.locator('#wip img').evaluateAll(async (elements) => {
    await Promise.all(
      elements.map(async (element) => {
        const image = element as HTMLImageElement;
        image.loading = 'eager';
        await image.decode();
      }),
    );
  });
  await page.screenshot({ path: info.outputPath('wip-proposal-desktop.png'), fullPage: true });
  await page.locator('.packed-study').screenshot({ path: info.outputPath('packed-desktop.png') });
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
    await page.getByRole('link', { name: /WIP \(/ }).click();
    await expect(page.locator('#wip .candidate')).not.toHaveCount(0);
  }
  await page.goto(`${base}/spire.html#candidates`);
  await expect(page.locator('#wip')).toBeVisible();
  await expect(page.locator('#wip .candidate')).toHaveCount(3);
  await expect(page.getByText('Installed · earlier trial retained', { exact: true })).toHaveCount(
    3,
  );
  await page.locator('#candidate-metallicize summary').click();
  for (const image of await page.locator('#wip img').all()) {
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
  await page.goto(`${base}/wip.html`);
  await page.locator('#wip img').evaluateAll(async (elements) => {
    await Promise.all(
      elements.map(async (element) => {
        const image = element as HTMLImageElement;
        image.loading = 'eager';
        await image.decode();
      }),
    );
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('wip-proposal-phone.png'), fullPage: true });
  await page.locator('.packed-study').screenshot({ path: info.outputPath('packed-phone.png') });
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: () => null });
  });
  await page.goto(`${base}/emberwake.html`);
  await expect(page.getByText('Canvas 2D is unavailable.', { exact: true })).toHaveCount(6);
});

test('gallery image previews work inside an isolated document without sibling files', async ({
  page,
}, info) => {
  const output = info.outputPath('isolated-preview');
  execFileSync(process.execPath, ['packages/workshop-tools/art/gallery/export.ts', output]);
  const html = readFileSync(`${output}/index.html`, 'utf8');
  const manifest = JSON.parse(readFileSync(`${output}/manifest.json`, 'utf8')) as {
    file: string;
  }[];
  // Model a host that receives only the HTML, not its neighbouring export directory.
  await page.route('**/*', (route) => route.abort());
  await page.setContent(
    '<iframe title="Isolated gallery preview" sandbox="allow-scripts" style="width:100%;height:900px;border:0"></iframe>',
  );
  await page.locator('iframe').evaluate((frame, source) => {
    (frame as HTMLIFrameElement).srcdoc = source;
  }, html);
  const preview = page.frameLocator('iframe');
  await expect(preview.getByRole('heading', { name: 'Current assets', exact: true })).toBeVisible();
  const failed = await preview
    .locator('img[alt="The Exordium"], img[alt="Pocket Change"]')
    .evaluateAll(async (elements) =>
      (
        await Promise.all(
          elements.map(async (element) => {
            const image = element as HTMLImageElement;
            image.loading = 'eager';
            try {
              await image.decode();
              return null;
            } catch {
              return image.alt;
            }
          }),
        )
      ).filter(Boolean),
    );
  expect(failed).toEqual([]);
  const allImages = await preview.locator('img').evaluateAll(async (elements) =>
    Promise.all(
      elements.map(async (element) => {
        const image = element as HTMLImageElement;
        image.loading = 'eager';
        try {
          await image.decode();
          return image.naturalWidth > 0;
        } catch {
          return false;
        }
      }),
    ),
  );
  expect(allImages.length).toBeGreaterThanOrEqual(manifest.length);
  expect(allImages.every(Boolean)).toBe(true);
  await preview
    .getByLabel('Collection', { exact: true })
    .selectOption('Last Hearth · Tavern spells');
  await expect(preview.locator('.asset:visible')).toHaveCount(8);
  await page.screenshot({ path: info.outputPath('isolated-tavern-spells.png') });
  await preview.getByRole('link', { name: /Recent upgrades \(/ }).click();
  await expect(preview.locator('#upgrades')).toBeVisible();
  await preview.getByRole('link', { name: /WIP \(/ }).click();
  await expect(preview.locator('#candidate-metallicize')).toBeVisible();
  await page.locator('iframe').evaluate(
    (frame, source) => {
      (frame as HTMLIFrameElement).srcdoc = source;
    },
    readFileSync(`${output}/wip.html`, 'utf8'),
  );
  await expect(preview.getByRole('heading', { name: 'WIP batches', exact: true })).toBeVisible();
  await expect(preview.locator('#wip')).toBeVisible();
  await expect(preview.locator('#current')).toBeHidden();
});
