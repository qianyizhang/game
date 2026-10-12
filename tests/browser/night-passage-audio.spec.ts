import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { installAudioProbe, type renderAudition } from './night-passage-audio-review';

const output = 'test-results/night-passage-audio';

test('real offline audio renders distinct finite envelopes with silent tails and bounded overlap', async ({
  page,
}) => {
  await page.goto('/?game=night-passage');
  const result = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-audio-review.ts';
    const module = (await import(/* @vite-ignore */ path)) as {
      renderAudition: typeof renderAudition;
    };
    return module.renderAudition();
  });
  expect(result.pcm.every(Number.isFinite)).toBe(true);
  for (const metric of result.metrics) {
    expect(metric.peak, metric.name).toBeGreaterThan(0.01);
    expect(metric.peak, metric.name).toBeLessThan(1);
    expect(metric.rms, metric.name).toBeGreaterThan(0.001);
    expect(metric.tail, metric.name).toBeLessThan(0.00001);
  }
  const waveforms = Array.from({ length: 5 }, (_, index) =>
    result.pcm.slice(index * 16800, index * 16800 + 12000),
  );
  for (let i = 0; i < waveforms.length; i++)
    for (let j = i + 1; j < waveforms.length; j++) {
      const difference = Math.sqrt(
        waveforms[i].reduce((sum, value, k) => sum + (value - waveforms[j][k]) ** 2, 0) / 12000,
      );
      expect(difference).toBeGreaterThan(0.005);
    }
  mkdirSync(output, { recursive: true });
  const wav = Buffer.alloc(44 + result.pcm.length * 2);
  wav.write('RIFF');
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(result.rate, 24);
  wav.writeUInt32LE(result.rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(result.pcm.length * 2, 40);
  result.pcm.forEach((sample, index) =>
    wav.writeInt16LE(Math.round(sample * 32767), 44 + index * 2),
  );
  writeFileSync(`${output}/audition.wav`, wav);
  writeFileSync(`${output}/metrics.json`, JSON.stringify(result.metrics, null, 2));
});

test('live dodge sounds mute immediately, resume through the toggle, and close on exit', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(installAudioProbe);
  await page.goto('/?game=night-passage');
  await page.getByRole('button', { name: 'Begin passage', exact: true }).click();
  const arena = page.locator('canvas[aria-label="Night Passage combat arena"]');
  await arena.focus();
  await page.keyboard.down('Space');
  await expect(page.getByRole('button', { name: 'Sound off', exact: true })).toBeVisible();
  await page.keyboard.up('Space');
  expect(
    await page.evaluate(() => ({
      muted: window.passageAudioProbe.muted,
      dashes: window.passageAudioProbe.dashes,
      stopped: window.passageAudioProbe.immediateStops,
      gain: window.passageAudioProbe.buses[0].gain.value,
    })),
  ).toEqual({ muted: true, dashes: 1, stopped: 1, gain: 0 });
  await page.getByRole('button', { name: 'Sound off', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sound on', exact: true })).toBeVisible();
  await arena.focus();
  await page.keyboard.down('Space');
  await expect.poll(() => page.evaluate(() => window.passageAudioProbe.dashes)).toBeGreaterThan(1);
  await page.keyboard.up('Space');
  await page.getByLabel('Choose game').selectOption('balatro');
  await expect.poll(() => page.evaluate(() => window.passageAudioProbe.closed)).toBe(1);
  expect(errors).toEqual([]);
});
