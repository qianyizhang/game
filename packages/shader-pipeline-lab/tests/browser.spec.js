import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
// Routine verification keeps screenshots only on failure. Review capture is opt-in.
const captures = new URL('../../../.artifacts/shader-lab-review/', import.meta.url).pathname;
async function captureReview(page, name) {
  if (process.env.CAPTURE_REVIEW !== '1') return;
  await mkdir(captures, { recursive: true });
  await page.screenshot({ path: captures + name });
}
async function chooseStage(page, index) {
  await page.locator('#pipeline-picker > summary').click();
  await page.locator('#stages button').nth(index).click();
}
async function viewportBounds(page) {
  return page.locator('.viewport-panel').evaluate((element) => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  });
}
const parity = async (page) =>
  page.evaluate(async () => {
    const { render, defaults } = await import('/src/pipeline.js');
    const settings = { ...defaults };
    for (const id of ['angle', 'tilt', 'distance', 'near', 'light'])
      settings[id] = Number(document.getElementById(id).value);
    for (const id of ['texture', 'lighting', 'correct', 'depth'])
      settings[id] = document.getElementById(id).checked;
    const cpu = render(settings).images.final;
    const gl = document.getElementById('gpu').getContext('webgl');
    const gpu = new Uint8Array(192 * 192 * 4);
    gl.readPixels(0, 0, 192, 192, gl.RGBA, gl.UNSIGNED_BYTE, gpu);
    let mismatch = 0,
      totalError = 0;
    for (let y = 0; y < 192; y++)
      for (let x = 0; x < 192; x++) {
        let max = 0;
        for (let c = 0; c < 3; c++) {
          const error = Math.abs(cpu[(y * 192 + x) * 4 + c] - gpu[((191 - y) * 192 + x) * 4 + c]);
          max = Math.max(max, error);
          totalError += error;
        }
        if (max > 2) mismatch++;
      }
    return { mismatch, mean: totalError / (192 * 192 * 3), glError: gl.getError() };
  });

test('all eight stages expose only effective controls and preserve the viewport', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const expected = [
    [],
    ['angle', 'tilt', 'distance'],
    ['near', 'angle', 'tilt', 'distance'],
    ['angle', 'tilt', 'distance', 'near'],
    ['correct', 'angle', 'tilt', 'distance', 'near'],
    ['texture', 'lighting', 'light', 'correct', 'angle', 'tilt', 'distance', 'near'],
    ['depth', 'angle', 'tilt', 'distance', 'near'],
    ['texture', 'lighting', 'light', 'depth', 'correct', 'angle', 'tilt', 'distance', 'near'],
  ];
  const bounds = await viewportBounds(page);
  const changes = { angle: '80', tilt: '-10', distance: '6', near: '4.7', light: '-100' };
  for (let stage = 0; stage < 8; stage++) {
    if (stage) await page.getByRole('button', { name: 'Next stage' }).click();
    expect(
      await page
        .locator('#controls input:visible')
        .evaluateAll((inputs) => inputs.map((input) => input.id)),
    ).toEqual(expected[stage]);
    expect(await viewportBounds(page)).toEqual(bounds);
    if (stage >= 4) {
      const expectedPixel = await page.evaluate(async (stage) => {
        const { render, defaults } = await import('/src/pipeline.js');
        const image = render(defaults).images[['uv', 'shaded', 'depth', 'final'][stage - 4]];
        return [...image.slice((96 * 192 + 96) * 4, (96 * 192 + 96) * 4 + 4)];
      }, stage);
      await expect(page.locator('#pixel-color')).toHaveText(
        `View RGBA [${expectedPixel.join(', ')}]`,
      );
    }
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(
      true,
    );
    for (const id of expected[stage]) {
      await page.getByRole('button', { name: 'Reset scene', exact: true }).click();
      const before = await page.locator('#scene').evaluate((canvas) => canvas.toDataURL());
      const dataBefore = await page.locator('#stage-output').textContent();
      const control = page.locator('#' + id);
      if (id in changes) await control.fill(changes[id]);
      else await control.uncheck();
      const after = await page.locator('#scene').evaluate((canvas) => canvas.toDataURL());
      const dataAfter = await page.locator('#stage-output').textContent();
      expect(
        before !== after || dataBefore !== dataAfter,
        `stage ${stage + 1} / ${id} has an observable effect`,
      ).toBe(true);
    }
    await page.getByRole('button', { name: 'Reset scene', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'Next stage' })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('shared selections, dependent controls and inspector state survive stage changes', async ({
  page,
}) => {
  await page.goto('/');
  await chooseStage(page, 7);
  await page.locator('#angle').fill('55');
  await page.locator('#triangle').selectOption('8');
  await page.locator('#pixel-x').fill('97');
  await page.locator('#pixel-x').press('Tab');
  await page.getByRole('tab', { name: 'Trace', exact: true }).click();
  await page.getByRole('button', { name: 'Previous stage' }).click();
  await expect(page.locator('#angle')).toHaveValue('55');
  await expect(page.locator('#triangle')).toHaveValue('8');
  await expect(page.locator('#pixel-x')).toHaveValue('97');
  await expect(page.getByRole('tab', { name: 'Trace', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('#texture')).toBeHidden();
  await page.getByRole('button', { name: 'Next stage' }).click();
  await page.locator('#lighting').uncheck();
  await expect(page.locator('#light')).toBeDisabled();
  await expect(page.locator('#light-reason')).toHaveText('Enable diffuse lighting');
  await page.locator('#texture').uncheck();
  await expect(page.locator('#correct')).toBeDisabled();
  await chooseStage(page, 4);
  await expect(page.locator('#correct')).toBeEnabled();
  await expect(page.locator('#lighting')).toBeHidden();
  await page.getByRole('tab', { name: 'Code', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Trace', exact: true })).toBeFocused();
  await page.locator('#pipeline-picker > summary').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#pipeline-picker')).not.toHaveAttribute('open');
  await expect(page.locator('#pipeline-picker > summary')).toBeFocused();
  await page.locator('#scene').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#pixel-title')).toHaveText('Pixel (98, 96)');
});

test('clipping, visibility, inline GPU comparison and recovery', async ({ page }) => {
  await page.goto('/');
  await chooseStage(page, 7);
  await page.getByRole('button', { name: 'Compare GPU', exact: true }).click();
  await expect(page.locator('#gpu')).toBeVisible();
  await expect(page.locator('#gpu-status')).toContainText('Live GPU');
  const initial = await parity(page);
  console.log('Default CPU/GPU', initial);
  expect(initial.glError).toBe(0);
  expect(initial.mismatch).toBeLessThan(369);
  await page.locator('#correct').uncheck();
  expect((await parity(page)).mismatch).toBeLessThan(369);
  await page.getByRole('button', { name: 'Disable depth test', exact: true }).click();
  await expect(page.locator('#pixel-hits')).toContainText('Test off');
  expect((await parity(page)).mismatch).toBeLessThan(369);
  await page.getByRole('button', { name: 'Reset scene', exact: true }).click();
  await captureReview(page, 'after-desktop.png');
  await chooseStage(page, 2);
  await expect(page.locator('#gpu-view')).toBeHidden();
  await expect(page.locator('#compare-gpu')).toBeHidden();
  await page.getByRole('button', { name: 'Clip the cube', exact: true }).click();
  expect((await parity(page)).mismatch).toBeLessThan(369);
  await captureReview(page, 'after-clipping.png');
  await page.locator('#near').fill('7');
  await expect(page.locator('#stage-output')).toContainText('"remainingTriangles": 0');
  await page.getByRole('button', { name: 'Reset scene', exact: true }).click();
  await expect(page.locator('#near')).toHaveValue('0.5');
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  await expect(page.locator('#cpu-source')).toBeVisible();
  const before = await viewportBounds(page);
  await page.locator('#panel-code').evaluate((panel) => (panel.scrollTop = panel.scrollHeight));
  expect(await viewportBounds(page)).toEqual(before);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test('phone and small zoomed window keep the viewport and navigator mounted while panels scroll', async ({
  page,
}) => {
  for (const size of [
    { width: 390, height: 844 },
    { width: 720, height: 450 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('/');
    await chooseStage(page, 7);
    const bounds = await viewportBounds(page);
    expect(bounds.height).toBeGreaterThan(140);
    expect(
      await page.evaluate(() => ({
        x: document.documentElement.scrollWidth <= innerWidth,
        y: document.documentElement.scrollHeight <= innerHeight,
      })),
    ).toEqual({ x: true, y: true });
    await expect(page.locator('#texture')).toBeInViewport();
    await page.locator('#angle').fill('65');
    await page.getByRole('tab', { name: 'Code', exact: true }).click();
    await page.locator('#panel-code').evaluate((panel) => (panel.scrollTop = panel.scrollHeight));
    expect(await viewportBounds(page)).toEqual(bounds);
    await expect(page.locator('#next')).toBeInViewport();
    await page.getByRole('button', { name: 'Previous stage' }).click();
    expect(await viewportBounds(page)).toEqual(bounds);
    if (size.width === 390) await captureReview(page, 'after-mobile.png');
  }
});

test('unavailable WebGL is explicit and leaves CPU controls usable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === 'webgl' ? null : original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await chooseStage(page, 7);
  await expect(page.locator('#compare-gpu')).toBeDisabled();
  await expect(page.locator('#compare-gpu')).toHaveAttribute('title', /WebGL is unavailable/);
  await page.locator('#angle').fill('70');
  await expect(page.locator('#stage-output')).toContainText('rgba');
  await page.getByRole('button', { name: 'Reset scene', exact: true }).click();
  await expect(page.locator('#angle')).toHaveValue('-32');
});
