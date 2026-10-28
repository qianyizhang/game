import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

type FilmWindow = Window & {
  film: {
    ready: boolean;
    duration: number;
    fps: number;
    frames: number;
    frame: (index: number) => void;
    audioBuffer: () => Float32Array;
  };
};

test('Golden Claw plays offline, seeks deterministically and ends in black', async ({ page }) => {
  const html = await readFile('docs/art/assets/golden-claw/film.html', 'utf8');
  const errors: string[] = [];
  const dependencies: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', async (route) => {
    if (route.request().isNavigationRequest())
      await route.fulfill({ body: html, contentType: 'text/html; charset=utf-8' });
    else {
      dependencies.push(route.request().url());
      await route.abort();
    }
  });
  await page.goto('/golden-claw-offline');
  await page.waitForFunction(() => (window as unknown as FilmWindow).film?.ready);
  const result = await page.evaluate(() => {
    const film = (window as unknown as FilmWindow).film;
    const canvas = document.querySelector('canvas');
    if (!canvas) throw new Error('Missing film canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Missing film renderer');
    const samples = [0, 60, 180, 300, 450, 600, 720, 860, 899, 180].map((frame) => {
      film.frame(frame);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let hash = 0;
      let dark = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        hash = Math.imul(hash, 31) + pixels[i] + pixels[i + 1] * 3 + pixels[i + 2] * 7;
        if (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) < 4) dark++;
      }
      return { hash: hash | 0, darkness: dark / (canvas.width * canvas.height) };
    });
    const audio = film.audioBuffer();
    let energy = 0;
    for (const value of audio) energy += value * value;
    return {
      duration: film.duration,
      fps: film.fps,
      frames: film.frames,
      width: canvas.width,
      height: canvas.height,
      samples,
      audioSamples: audio.length,
      audioEnergy: energy,
    };
  });
  expect(result).toMatchObject({ duration: 30, fps: 30, frames: 900, width: 1280, height: 720 });
  expect(new Set(result.samples.slice(0, 9).map((sample) => sample.hash)).size).toBe(9);
  expect(result.samples[2].hash).toBe(result.samples[9].hash);
  expect(result.samples[8].darkness).toBeGreaterThan(0.999);
  expect(result.audioSamples).toBe(1_440_000);
  expect(result.audioEnergy).toBeGreaterThan(100);
  await expect(page.locator('button,input,select,video,audio,a')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  const rect = await page.locator('canvas').boundingBox();
  expect(rect).not.toBeNull();
  expect(rect!.width / rect!.height).toBeCloseTo(16 / 9, 2);
  expect(rect!.width).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);
  expect(dependencies).toEqual([]);
});
