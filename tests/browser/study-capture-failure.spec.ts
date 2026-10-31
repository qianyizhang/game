import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { sceneReadyTimeout } from './budget';

test('failed Studio capture preserves the model download and a replacement study recovers', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?art=3d&study=spiral');
  const viewer = page.locator('.study-render');
  const image = page.getByRole('button', { name: 'Save image' });
  const video = page.getByRole('button', { name: 'Save animation loop' });
  const model = page.getByRole('button', { name: 'Download 3D model' });
  const studies = page.getByRole('navigation', { name: 'Choose a 3D study' });
  await expect(viewer).toHaveAttribute('data-ready', 'true', { timeout: sceneReadyTimeout });
  await page.getByRole('button', { name: 'Pause animation' }).click();
  await page.getByLabel('Animation timeline').fill('0');
  await studies.getByRole('button', { name: /Spiral/ }).click();
  await expect(image).toBeEnabled();
  await expect(video).toBeEnabled();
  await image.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('ready-studio-1440.png'), fullPage: true });

  const loss = await viewer.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!gl || !extension) throw new Error('Supported WebGL context-loss extension unavailable');
    return new Promise<{ trusted: boolean; lost: boolean }>((resolve) => {
      canvas.addEventListener(
        'webglcontextlost',
        (event) => {
          resolve({ trusted: event.isTrusted, lost: gl.isContextLost() });
        },
        { once: true },
      );
      extension.loseContext();
    });
  });
  expect(loss).toEqual({ trusted: true, lost: true });
  await expect(page.getByRole('alert')).toContainText('sculpture could not be loaded');
  await expect(viewer).toHaveAttribute('data-ready', 'false');
  await expect(image).toBeDisabled();
  await expect(video).toBeDisabled();
  await expect(model).toBeEnabled();
  await page.screenshot({ path: info.outputPath('context-lost-studio-1440.png'), fullPage: true });

  const modelEvent = page.waitForEvent('download');
  await model.click();
  const glb = await modelEvent;
  expect(glb.suggestedFilename()).toBe('card-workshop-spiral.glb');
  await glb.saveAs(info.outputPath(glb.suggestedFilename()));
  expect(await glb.failure()).toBeNull();
  const bytes = await readFile(info.outputPath(glb.suggestedFilename()));
  expect(bytes.equals(await readFile('src/art3d/baked/spiral.glb'))).toBe(true);

  await studies.getByRole('button', { name: /Phoenix/ }).click();
  await expect(page).toHaveURL(/study=phoenix/);
  await expect(viewer).toHaveAttribute('data-ready', 'true', { timeout: sceneReadyTimeout });
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(image).toBeEnabled();
  await expect(video).toBeEnabled();
  const imageEvent = page.waitForEvent('download');
  await image.click();
  const png = await imageEvent;
  expect(png.suggestedFilename()).toBe('phoenix-study.png');
  await png.saveAs(info.outputPath(png.suggestedFilename()));
  expect(await png.failure()).toBeNull();
  const pixels = await page.evaluate(
    async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let visible = 0;
      const colors = new Set<number>();
      for (let i = 0; i < rgba.length; i += 4) {
        if (rgba[i + 3]) visible += 1;
        colors.add(
          ((rgba[i] << 24) | (rgba[i + 1] << 16) | (rgba[i + 2] << 8) | rgba[i + 3]) >>> 0,
        );
      }
      return { width: canvas.width, height: canvas.height, visible, colors: colors.size };
    },
    (await readFile(info.outputPath(png.suggestedFilename()))).toString('base64'),
  );
  expect(pixels.width).toBeGreaterThan(300);
  expect(pixels.height).toBeGreaterThan(300);
  expect(pixels.visible).toBeGreaterThan(0);
  expect(pixels.colors).toBeGreaterThan(100);
  await page.getByRole('button', { name: 'My table' }).click();
  await expect(page.getByLabel('Choose game')).toBeVisible();
  expect(errors).toEqual([]);
});

test('context loss cancels recording and rejects retained capture calls', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const controllerPath = '/src/art3d/gallery/controller.ts';
    const deliveryPath = '/src/art3d/delivery.ts';
    const { mount } = (await import(
      controllerPath
    )) as typeof import('../../src/art3d/gallery/controller');
    const { loadStudy } = (await import(deliveryPath)) as typeof import('../../src/art3d/delivery');
    const element = document.createElement('div');
    element.style.cssText = 'width: 640px; height: 480px';
    document.body.prepend(element);
    let ready = () => {};
    const firstFrame = new Promise<void>((resolve) => {
      ready = resolve;
    });
    const controller = mount({
      element,
      id: 'spiral',
      form: 'base',
      loaded: await loadStudy('spiral', new AbortController().signal),
      getOptions: () => ({
        spin: false,
        motion: false,
        speed: 1,
        seek: 0,
        seekVersion: 0,
        wireframe: false,
        exploded: false,
        light: 'studio',
        view: 'perspective',
        reset: 0,
      }),
      onTime: () => {},
      onReady: (value) => {
        if (value) ready();
      },
      onFailure: () => {},
    });
    try {
      await firstFrame;
      const canvas = element.querySelector('canvas')!;
      const gl = canvas.getContext('webgl2')!;
      const extension = gl.getExtension('WEBGL_lose_context');
      if (!extension) throw new Error('Supported WebGL context-loss extension unavailable');
      const outcome = async (capture: () => unknown) => {
        try {
          await capture();
          return 'capture succeeded';
        } catch (error) {
          return error instanceof Error ? error.message : String(error);
        }
      };
      const recording = outcome(controller.capture.video);
      const lost = new Promise<void>((resolve) => {
        canvas.addEventListener('webglcontextlost', () => resolve(), { once: true });
      });
      extension.loseContext();
      await lost;
      return {
        recording: await recording,
        png: await outcome(controller.capture.png),
        video: await outcome(controller.capture.video),
      };
    } finally {
      controller.dispose();
      element.remove();
    }
  });
  expect(result.recording).toContain('Recording cancelled');
  expect(result.png).toContain('sculpture cannot be captured');
  expect(result.video).toContain('sculpture cannot be captured');
});
