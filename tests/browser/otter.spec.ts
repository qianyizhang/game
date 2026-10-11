import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { browserBudget, sceneReadyTimeout } from './budget';

async function recordMotion(
  page: Page,
  info: TestInfo,
  clip: string,
  duration: number,
  prefix = clip,
) {
  const recording = await page.evaluate(
    async ({ clip, duration }) => {
      const canvas = document.querySelector<HTMLCanvasElement>('.canid-render canvas')!;
      const chunks: Blob[] = [];
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      const stopped = new Promise<void>((done) => {
        recorder.onstop = () => done();
      });
      const slider = document.querySelector<HTMLInputElement>(
        'input[aria-label="Shared motion time"]',
      )!;
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!;
      descriptor.set!.call(slider, '0');
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done())),
      );
      const play = Array.from(document.querySelectorAll('button')).find((b) =>
        /^(Play|Replay) motion$/.test(b.textContent ?? ''),
      )!;
      recorder.start();
      play.click();
      const start = performance.now();
      const samples: { wall: number; time: number }[] = [];
      const length = Math.max(duration, ['walk', 'bound'].includes(clip) ? 3 : 0);
      await new Promise<void>((done) => {
        const sample = () => {
          samples.push({
            wall: (performance.now() - start) / 1000,
            time: Number(document.querySelector<HTMLElement>('.canid-render')!.dataset.time),
          });
          if (performance.now() - start < length * 1000 + 150) requestAnimationFrame(sample);
          else done();
        };
        requestAnimationFrame(sample);
      });
      recorder.stop();
      await stopped;
      stream.getTracks().forEach((track) => track.stop());
      const bytes = new Uint8Array(await new Blob(chunks, { type: 'video/webm' }).arrayBuffer());
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return { video: btoa(binary), samples };
    },
    { clip, duration },
  );
  await writeFile(info.outputPath(`${prefix}-1x.webm`), Buffer.from(recording.video, 'base64'));
  await writeFile(info.outputPath(`${prefix}-clock.json`), JSON.stringify(recording.samples));
}

test('otter study plays five clips, supports inspection and preserves its delivered download', async ({
  page,
}, info) => {
  test.setTimeout(browserBudget(150_000));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?workbench=dcc&compare=otter');
  await expect(page.getByRole('heading', { name: 'Alder follows the riverbank.' })).toBeVisible();
  const viewer = page.locator('.canid-render');
  await expect(viewer).toHaveAttribute('data-ready', 'true', { timeout: sceneReadyTimeout });
  const images: Buffer[] = [];
  for (const clip of ['idle', 'walk', 'bound', 'scent', 'groom']) {
    await page.getByLabel('Movement', { exact: true }).selectOption(clip);
    await page.getByLabel('Movement space').selectOption('in-place');
    await page
      .getByRole('button', {
        name: clip === 'groom' ? 'Front' : clip === 'idle' ? 'Portrait' : 'Side',
        exact: true,
      })
      .click();
    await page.getByLabel('Shared motion time').fill('0');
    const duration = Number(await page.getByLabel('Shared motion time').getAttribute('max'));
    await page.getByRole('button', { name: 'Play motion', exact: true }).click();
    await expect(async () =>
      expect(Number(await viewer.getAttribute('data-time'))).toBeGreaterThan(0),
    ).toPass();
    await page.getByLabel('Shared motion time').fill(String(Number((duration * 0.5).toFixed(2))));
    images.push(await viewer.screenshot({ path: info.outputPath(`${clip}-midpoint.png`) }));
    if (process.env.OTTER_REVIEW_FRAMES) {
      // Capture real, unretimed 1x consumer playback, including repeated gait cycles.
      await recordMotion(page, info, clip, duration);
      await page.getByLabel('Shared motion time').fill('0');
      for (const fraction of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
        await page
          .getByLabel('Shared motion time')
          .fill(String(Number((duration * fraction).toFixed(2))));
        await viewer.screenshot({ path: info.outputPath(`${clip}-${fraction}.png`) });
      }
    }
  }
  if (process.env.OTTER_REVIEW_FRAMES) {
    await page.getByLabel('Movement', { exact: true }).selectOption('groom');
    await page.getByRole('button', { name: 'Clay', exact: true }).click();
    for (const view of ['Side', 'opposite-three-quarter']) {
      await page
        .getByRole('button', { name: view === 'Side' ? 'Side' : 'Portrait', exact: true })
        .click();
      await page.getByLabel('Shared motion time').fill('2.6');
      if (view === 'opposite-three-quarter') {
        const box = (await viewer.locator('canvas').boundingBox())!;
        await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.5);
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width * 0.65 - box.height * 0.295,
          box.y + box.height * 0.5,
          { steps: 18 },
        );
        await page.mouse.up();
      }
      await viewer.screenshot({ path: info.outputPath(`groom-${view}-cheek.png`) });
      await recordMotion(page, info, 'groom', 6, `groom-${view}`);
      for (const time of [0, 0.5, 1, 1.45, 2.3, 2.6, 3.4, 3.8, 4.8, 5.4, 6]) {
        await page.getByLabel('Shared motion time').fill(String(time));
        await viewer.screenshot({ path: info.outputPath(`groom-${view}-${time}.png`) });
      }
    }
    await page.getByRole('button', { name: 'Material', exact: true }).click();
  }
  expect(images[0].equals(images[4])).toBe(false);
  await page.getByLabel('Movement', { exact: true }).selectOption('walk');
  await page.getByLabel('Movement space').selectOption('travel');
  await page.getByLabel('Shared motion time').fill('0');
  await page.getByRole('button', { name: 'Play motion', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Replay motion', exact: true })).toBeVisible();
  await expect(viewer).toHaveAttribute('data-time', '1.600');
  await viewer.screenshot({ path: info.outputPath('walk-travel-end.png') });
  await page.getByLabel('Movement space').selectOption('in-place');
  await page.getByLabel('Movement', { exact: true }).selectOption('scent');
  await page.getByLabel('Shared motion time').fill('5.18');
  await page.getByRole('button', { name: 'Play motion', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Replay motion', exact: true })).toBeVisible();
  await expect(viewer).toHaveAttribute('data-time', '5.200');
  await page.getByRole('button', { name: /^search ·/ }).click();
  await expect(viewer).toHaveAttribute('data-time', '2.500');
  await page.getByLabel('Movement space').selectOption('in-place');
  for (const surface of ['Clay', 'Material']) {
    await page.getByRole('button', { name: surface, exact: true }).click();
    await page.getByLabel('Movement', { exact: true }).selectOption('idle');
    for (const view of ['Portrait', 'Front', 'Side', 'Rear']) {
      await page.getByRole('button', { name: view, exact: true }).click();
      await viewer.screenshot({ path: info.outputPath(`${surface}-${view}.png`) });
    }
  }
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download Alder GLB', exact: true }).click();
  await (await download).saveAs(info.outputPath('otter.glb'));
  expect(
    (await readFile(info.outputPath('otter.glb'))).equals(
      await readFile('packages/dcc-workbench/assets/otter/otter.glb'),
    ),
  ).toBe(true);
  for (const [label, file, source] of [
    ['Editable Alder source', 'otter.blend', 'subjects/otter/otter/source.blend'],
    ['Download shared motion source ↗', 'motion.blend', 'subjects/otter/motion.blend'],
  ]) {
    const nativeDownload = page.waitForEvent('download');
    await page.getByRole('link', { name: label, exact: true }).click();
    await (await nativeDownload).saveAs(info.outputPath(file));
    expect(
      (await readFile(info.outputPath(file))).equals(
        await readFile(`packages/dcc-workbench/${source}`),
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Portrait', exact: true }).click();
  await expect(async () =>
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    ),
  ).toPass();
  await page.screenshot({ path: info.outputPath('phone.png'), fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByRole('button', { name: 'Play motion', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test(
  'otter saved motion edit and fresh native samples agree with browser deformation',
  { tag: '@requires-blender' },
  async ({ page }, info) => {
    test.setTimeout(browserBudget(60_000));
    const directory = process.env.OTTER_NATIVE_RESULTS;
    test.skip(
      !directory,
      'Run npm run dcc:otter -- verify --output test-results/otter-native first.',
    );
    const evidence = JSON.parse(
      await readFile(resolve(directory!, 'verification.json'), 'utf8'),
    ) as {
      meshAndWeightsUnchanged: boolean;
      authoritativeSourcesAndDeliveryUnchanged: boolean;
      geometryDigestVersion: number;
      transformFaultCasesRejected: number;
      validSavedSourceAccepted: boolean;
    };
    expect(evidence.meshAndWeightsUnchanged).toBe(true);
    expect(evidence.authoritativeSourcesAndDeliveryUnchanged).toBe(true);
    expect(evidence.geometryDigestVersion).toBe(2);
    expect(evidence.transformFaultCasesRejected).toBe(4);
    expect(evidence.validSavedSourceAccepted).toBe(true);
    await page.goto('/?workbench=dcc&compare=otter');
    const result = await page.evaluate(async (directory) => {
      const module = '/tests/browser/canid-evidence.ts';
      const { compareCanid } = (await import(module)) as typeof import('./canid-evidence');
      const reference = (await (
        await fetch(`/@fs${directory}/reference/otter.poses.json`)
      ).json()) as Parameters<typeof compareCanid>[1];
      const edited = (await (
        await fetch(`/@fs${directory}/poses/otter.poses.json`)
      ).json()) as Parameters<typeof compareCanid>[1];
      const model = '/packages/dcc-workbench/assets/otter/otter.glb';
      return {
        original: await compareCanid(model, reference),
        edited: await compareCanid(`/@fs${directory}/models/otter.glb`, edited),
        changed: await compareCanid(`/@fs${directory}/models/otter.glb`, reference),
      };
    }, resolve(directory!));
    for (const clip of [...result.original, ...result.edited])
      expect(clip.maxError).toBeLessThan(0.0001);
    expect(result.changed.find((c) => c.name === 'scent')!.maxError).toBeGreaterThan(0.001);
    await writeFile(info.outputPath('native-agreement.json'), JSON.stringify(result, null, 2));
  },
);
