import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { browserBudget, sceneReadyTimeout } from './budget';

async function openStudy(page: Page) {
  await page.goto('/?art=3d&study=vajra');
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true', {
    timeout: sceneReadyTimeout,
  });
  await page.getByRole('button', { name: 'Pause animation' }).click();
  await page.getByLabel('Animation timeline').fill('0');
}

async function recordingState(page: Page) {
  return page.locator('.study-render canvas').evaluate((canvas: HTMLCanvasElement) => ({
    width: canvas.width,
    height: canvas.height,
    displayWidth: canvas.getBoundingClientRect().width,
    recording: document.querySelector<HTMLButtonElement>('.study-video')!.disabled,
    viewportWidth: canvas.parentElement!.getBoundingClientRect().width,
  }));
}

async function startRecording(page: Page) {
  // Arm the busy-state observation before the click can finish its round trip.
  await Promise.all([
    page.waitForFunction(
      () => {
        const button = document.querySelector<HTMLButtonElement>('.study-video');
        return button?.disabled && button.textContent?.includes('Recording…');
      },
      undefined,
      { polling: 'raf', timeout: browserBudget(5_000) },
    ),
    page.getByRole('button', { name: 'Save animation loop' }).click(),
  ]);
}

test('a resized recording keeps its video dimensions and then fits the latest viewport', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openStudy(page);
  const initial = await recordingState(page);
  const downloaded = page.waitForEvent('download');
  await startRecording(page);
  await page.waitForFunction(
    () =>
      Number.parseFloat(document.querySelector('.animation-timeline output')!.textContent) >= 1.5,
    undefined,
    { polling: 'raf', timeout: browserBudget(5_000) },
  );
  await page.setViewportSize({ width: 1100, height: 900 });
  const resized = await recordingState(page);
  expect(resized.recording).toBe(true);
  expect(resized.viewportWidth).toBeLessThan(initial.viewportWidth);
  expect(resized.displayWidth).toBe(resized.viewportWidth);
  expect([resized.width, resized.height]).toEqual([initial.width, initial.height]);

  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('vajra-animation.webm');
  expect(await download.failure()).toBeNull();
  await download.saveAs(info.outputPath(download.suggestedFilename()));
  await expect(page.getByRole('button', { name: 'Save animation loop' })).toBeEnabled();
  await expect
    .poll(async () => (await recordingState(page)).width)
    .toBe(Math.floor(resized.viewportWidth));
  await page.locator('.study-render').screenshot({ path: info.outputPath('preview-after.png') });
  const bytes = await readFile(info.outputPath(download.suggestedFilename()));

  // Decode the whole download away from WebGL: a change near the end must also fail.
  await page.goto('/');
  await page.route(
    (url) => url.pathname === '/resized-animation.webm',
    (route) => route.fulfill({ body: bytes, contentType: 'video/webm' }),
  );
  const decoded = await page.evaluate(async (timeout) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    document.body.append(video);
    const sample = document.createElement('canvas');
    sample.width = sample.height = 32;
    const context = sample.getContext('2d', { willReadFrequently: true })!;
    const dimensions = new Set<string>();
    let first: Uint8ClampedArray | undefined;
    let moving = false;
    let frames = 0;
    let callback = 0;
    let timer = 0;
    try {
      return await new Promise<{
        ended: boolean;
        dimensions: string[];
        frames: number;
        moving: boolean;
      }>((resolve, reject) => {
        timer = window.setTimeout(() => reject(new Error('Video playback timed out')), timeout);
        video.onerror = () => reject(new Error('Video decoding failed'));
        video.onended = () =>
          resolve({ ended: video.ended, dimensions: [...dimensions], frames, moving });
        const capture: VideoFrameRequestCallback = (_now, metadata) => {
          dimensions.add(`${video.videoWidth}x${video.videoHeight}`);
          dimensions.add(`${metadata.width}x${metadata.height}`);
          context.drawImage(video, 0, 0, 32, 32);
          const pixels = context.getImageData(0, 0, 32, 32).data;
          if (first) moving ||= pixels.some((value, index) => value !== first![index]);
          else first = pixels;
          frames++;
          callback = video.requestVideoFrameCallback(capture);
        };
        callback = video.requestVideoFrameCallback(capture);
        video.src = '/resized-animation.webm';
        void video.play().catch(reject);
      });
    } finally {
      window.clearTimeout(timer);
      video.cancelVideoFrameCallback(callback);
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
    }
  }, browserBudget(10_000));
  expect(decoded.ended).toBe(true);
  expect(decoded.frames).toBeGreaterThanOrEqual(2);
  expect(decoded.moving).toBe(true);
  expect(decoded.dimensions).toEqual([`${initial.width}x${initial.height}`]);
  expect(errors).toEqual([]);
});

test('cancelling a resized recording applies the latest viewport and restores capture', async ({
  page,
}, info) => {
  const errors: string[] = [];
  const downloads: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('download', (download) => downloads.push(download.suggestedFilename()));
  await openStudy(page);
  const initial = await recordingState(page);
  await startRecording(page);
  await page.setViewportSize({ width: 1200, height: 960 });
  await page.setViewportSize({ width: 1100, height: 900 });
  const resized = await recordingState(page);
  expect(resized.recording).toBe(true);
  expect([resized.width, resized.height]).toEqual([initial.width, initial.height]);

  // Headless tabs do not reliably become hidden; inject only that browser signal.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Reflect.deleteProperty(document, 'hidden');
  });
  await expect(page.locator('.study-downloads [role="status"]')).toContainText(
    'Recording cancelled.',
  );
  await expect(page.getByRole('button', { name: 'Save animation loop' })).toBeEnabled();
  await expect(page.getByLabel('Animation timeline')).toBeEnabled();
  await expect
    .poll(async () => (await recordingState(page)).width)
    .toBe(Math.floor(resized.viewportWidth));
  expect(downloads).toEqual([]);

  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save image' }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('vajra-study.png');
  expect(await download.failure()).toBeNull();
  await download.saveAs(info.outputPath(download.suggestedFilename()));
  const dimensions = await page.evaluate(
    async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    },
    (await readFile(info.outputPath(download.suggestedFilename()))).toString('base64'),
  );
  expect(dimensions).toEqual([Math.floor(resized.viewportWidth), initial.height]);
  await page.getByRole('button', { name: 'My table' }).click();
  await expect(page.getByLabel('Choose game')).toBeVisible();
  expect(errors).toEqual([]);
});
