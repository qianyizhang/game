import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { artHistoryPlugin } from '../../packages/workshop-tools/art/history-server';
import { exportHistoryPage } from '../../packages/workshop-tools/art/history-page';
import {
  digest,
  HISTORY_PATH,
  MANAGED_PATH,
  SELECTION_PATH,
} from '../../packages/workshop-tools/art/history-store';
import type { ArtHistory } from '../../packages/workshop-tools/art/history-types';

// Three solid 16px frames: red, blue, green, 800 ms each; no looping extension.
// Clear before each pixel keeps the tiny fixture's LZW code width fixed at 3 bits.
function oneShotGif() {
  const bytes = [
    ...Buffer.from('GIF89a'),
    16,
    0,
    16,
    0,
    0x81,
    0,
    0,
    255,
    0,
    0,
    0,
    0,
    255,
    0,
    255,
    0,
    0,
    0,
    0,
  ];
  for (const color of [0, 1, 2]) {
    const compressed: number[] = [];
    let packed = 0,
      bits = 0;
    for (const code of [...Array.from({ length: 256 }, () => [4, color]).flat(), 5]) {
      packed |= code << bits;
      bits += 3;
      while (bits >= 8) {
        compressed.push(packed & 255);
        packed >>= 8;
        bits -= 8;
      }
    }
    if (bits) compressed.push(packed);
    bytes.push(
      0x21,
      0xf9,
      4,
      8,
      80,
      0,
      0,
      0,
      0x2c,
      0,
      0,
      0,
      0,
      16,
      0,
      16,
      0,
      0,
      2,
      compressed.length,
      ...compressed,
      0,
    );
  }
  return Buffer.from([...bytes, 0x3b]);
}

async function fixture(info: TestInfo) {
  const root = mkdtempSync(resolve(tmpdir(), 'history-gif-'));
  const bytes = oneShotGif();
  const file = `${MANAGED_PATH}/replay.GIF`;
  mkdirSync(resolve(root, MANAGED_PATH), { recursive: true });
  mkdirSync(resolve(root, 'src/shared/art'), { recursive: true });
  writeFileSync(resolve(root, file), bytes);
  const history: ArtHistory = {
    schema: 1,
    assets: [],
    attempts: [
      {
        id: 'gif',
        title: 'One-shot fixture',
        date: 'unknown',
        outcome: 'manual',
        notes: 'Disposable native GIF regression fixture.',
        files: [file],
      },
    ],
    revisions: [
      {
        id: 'gif',
        asset: null,
        attempt: 'gif',
        label: 'One-shot fixture',
        file,
        digest: digest(bytes),
        parents: [],
        runtimeFile: null,
        runtimeDigest: null,
        notes: 'Nonlooping native GIF.',
      },
    ],
  };
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  writeFileSync(resolve(root, SELECTION_PATH), '{}');
  const server = await createServer({
    configFile: false,
    root,
    plugins: [artHistoryPlugin(root)],
    server: { host: '127.0.0.1', port: 0, watch: null },
  });
  await server.listen();
  const address = server.httpServer!.address();
  if (!address || typeof address === 'string') throw new Error('Missing fixture port');
  const output = info.outputPath('offline');
  mkdirSync(output, { recursive: true });
  await exportHistoryPage(root, output);
  return {
    bytes,
    file,
    live: `http://127.0.0.1:${address.port}/__art/#asset=__unassigned`,
    offline: pathToFileURL(resolve(output, 'history.html')).href + '#asset=__unassigned',
    async close() {
      await server.close();
      rmSync(root, { recursive: true, force: true });
    },
  };
}

async function resources(page: Page) {
  const created: string[] = [],
    revoked: string[] = [];
  const contexts = new Map<number, string>(),
    destroyed = new Set<string>();
  const owners = new Map<string, string>();
  const protocol = await page.context().newCDPSession(page);
  protocol.on('Runtime.executionContextCreated', ({ context }) =>
    contexts.set(context.id, context.uniqueId),
  );
  protocol.on('Runtime.executionContextDestroyed', ({ executionContextId }) => {
    const id = contexts.get(executionContextId);
    if (id) destroyed.add(id);
    contexts.delete(executionContextId);
  });
  protocol.on('Runtime.executionContextsCleared', () => {
    for (const id of contexts.values()) destroyed.add(id);
    contexts.clear();
  });
  protocol.on('Runtime.bindingCalled', (event) => {
    if (event.name !== '__gifResource') return;
    const [kind, url] = JSON.parse(event.payload) as [string, string];
    (kind === 'create' ? created : revoked).push(url);
    if (kind === 'create') owners.set(url, contexts.get(event.executionContextId)!);
  });
  await protocol.send('Runtime.enable');
  await protocol.send('Runtime.addBinding', { name: '__gifResource' });
  await page.addInitScript(() => {
    const notify = (window as unknown as { __gifResource: (payload: string) => void })
      .__gifResource;
    const create = URL.createObjectURL.bind(URL),
      revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      notify(JSON.stringify(['create', url]));
      return url;
    };
    URL.revokeObjectURL = (url) => {
      revoke(url);
      notify(JSON.stringify(['revoke', url]));
    };
  });
  // Same-document actions must revoke explicitly. On reload/unload the native
  // owner context disappears; the test also checks its old URL is unreadable.
  const released = (url: string) => revoked.includes(url) || destroyed.has(owners.get(url)!);
  return {
    created,
    revoked,
    released,
    active: () => created.filter((url) => !released(url)).length,
  };
}

// Decode the compositor's static PNG capture, never drawImage the animated GIF.
async function displayedPixel(page: Page, image: Locator) {
  const screenshot = await image.screenshot({ animations: 'allow' });
  return page.evaluate(async (base64) => {
    const capture = new Image();
    capture.src = 'data:image/png;base64,' + base64;
    await capture.decode();
    const canvas = document.createElement('canvas');
    canvas.width = capture.width;
    canvas.height = capture.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(capture, 0, 0);
    return [
      ...context.getImageData(Math.floor(capture.width / 2), Math.floor(capture.height / 2), 1, 1)
        .data,
    ].slice(0, 3);
  }, screenshot.toString('base64'));
}
const red = [255, 0, 0],
  blue = [0, 0, 255],
  green = [0, 255, 0];
async function color(page: Page, image: Locator, expected: number[]) {
  await expect.poll(() => displayedPixel(page, image), { intervals: [50, 100] }).toEqual(expected);
}

for (const mode of ['live', 'offline'] as const) {
  test(`native GIF restarts after completion and mid-play Stop with exact downloads (${mode})`, async ({
    page,
  }, info) => {
    const files = await fixture(info),
      urls = await resources(page);
    try {
      await page.goto(files[mode]);
      const card = page.locator('[data-revision="gif"]'),
        image = card.locator('.revision-preview img');
      const play = () => card.getByRole('button', { name: 'Play GIF', exact: true }).click();
      const stop = async () => {
        await card.getByRole('button', { name: 'Stop GIF', exact: true }).click();
        await expect(image).toHaveCount(0);
        await expect.poll(urls.active).toBe(0);
      };
      await play();
      await color(page, image, red);
      await color(page, image, blue);
      await stop();
      for (let cycle = 0; cycle < 2; cycle++) {
        await play();
        await color(page, image, red);
        await color(page, image, blue);
        await color(page, image, green);
        // Beyond the final frame's hold: this must test a completed one-shot, not a loop.
        await page.waitForTimeout(900);
        await color(page, image, green);
        await stop();
      }
      await play();
      await color(page, image, red);
      await color(page, image, blue);
      await stop();
      const download = page.waitForEvent('download');
      await card.getByRole('button', { name: 'Download GIF', exact: true }).click();
      const path = await (await download).path();
      expect(path).toBeTruthy();
      expect(readFileSync(path).equals(files.bytes)).toBe(true);
      expect([...urls.revoked].sort()).toEqual([...urls.created].sort());
    } finally {
      await files.close();
    }
  });

  test(`GIF motion changes, dismissal and navigation release active and pending playback (${mode})`, async ({
    page,
  }, info) => {
    const files = await fixture(info),
      urls = await resources(page);
    // Delay only data-URL -> Blob conversion to expose the otherwise very short race.
    await page.addInitScript(() => {
      const scope = window as unknown as {
        holdGif?: boolean;
        pendingGif?: boolean;
        releaseGif?: () => void;
      };
      const original = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        if (scope.holdGif && typeof input === 'string' && input.startsWith('data:image/gif')) {
          scope.holdGif = false;
          scope.pendingGif = true;
          try {
            await new Promise<void>((resolve, reject) => {
              scope.releaseGif = resolve;
              init?.signal?.addEventListener(
                'abort',
                () => reject(new DOMException('Aborted', 'AbortError')),
                { once: true },
              );
            });
          } finally {
            scope.pendingGif = false;
          }
        }
        return original(input, init);
      };
    });
    try {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(files[mode]);
      const card = page.locator('[data-revision="gif"]'),
        image = card.locator('.revision-preview img');
      const play = () => card.getByRole('button', { name: 'Play GIF', exact: true }).click();
      await play();
      await expect(page.getByRole('status')).toContainText('disabled by reduced motion');
      expect(urls.created).toHaveLength(0);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.evaluate(() => {
        (window as unknown as { holdGif: boolean }).holdGif = true;
      });
      await play();
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { pendingGif: boolean }).pendingGif))
        .toBe(true);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { pendingGif: boolean }).pendingGif))
        .toBe(false);
      await page.evaluate(() => (window as unknown as { releaseGif?: () => void }).releaseGif?.());
      await expect(image).toHaveCount(0);
      expect(urls.created).toHaveLength(0);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await play();
      await color(page, image, red);
      await expect.poll(urls.active).toBe(1);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(image).toHaveCount(0);
      await expect.poll(urls.active).toBe(0);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      const details = card.locator('details').first();
      await details.locator('summary').click();
      const attachment = details.locator('[data-file-preview] img');
      const beforePending = urls.created.length;
      await page.evaluate(() => {
        (window as unknown as { holdGif: boolean }).holdGif = true;
      });
      await details.getByRole('button', { name: 'replay.GIF', exact: true }).click();
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { pendingGif: boolean }).pendingGif))
        .toBe(true);
      await details.getByRole('button', { name: 'Close attachment', exact: true }).click();
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { pendingGif: boolean }).pendingGif))
        .toBe(false);
      await page.evaluate(() => (window as unknown as { releaseGif?: () => void }).releaseGif?.());
      expect(urls.created).toHaveLength(beforePending);
      await details.getByRole('button', { name: 'replay.GIF', exact: true }).click();
      await color(page, attachment, red);
      await details.getByRole('button', { name: 'Close attachment', exact: true }).click();
      await expect.poll(urls.active).toBe(0);
      await details.getByRole('button', { name: 'replay.GIF', exact: true }).click();
      await color(page, attachment, red);
      await details.locator('summary').click();
      await expect(attachment).toHaveCount(0);
      await expect.poll(urls.active).toBe(0);
      await play();
      await color(page, image, red);
      await page.evaluate(() => {
        location.hash = 'asset=missing';
      });
      await expect(page.locator('#detail h2')).toHaveText('Choose an asset');
      await expect.poll(urls.active).toBe(0);
      await page.getByRole('link', { name: 'Unassigned source artwork', exact: true }).click();
      await play();
      await color(page, image, red);
      const previous = urls.created.at(-1)!;
      await page.reload();
      expect(
        await page.evaluate(async (url) => {
          try {
            await fetch(url);
            return true;
          } catch {
            return false;
          }
        }, previous),
      ).toBe(false);
      await expect(card.getByRole('button', { name: 'Play GIF', exact: true })).toBeVisible();
      await expect.poll(urls.active).toBe(0);
      await play();
      await color(page, image, red);
      await page.getByRole('button', { name: 'Reload history', exact: true }).click();
      await expect(page.getByRole('status')).toContainText(
        mode === 'live' ? 'History reloaded.' : 'offline snapshot',
      );
      await expect(image).toHaveCount(0);
      await expect.poll(urls.active).toBe(0);
      await play();
      await color(page, image, red);
      await page.goto('about:blank');
      await expect.poll(urls.active).toBe(0);
      expect(urls.created.every(urls.released)).toBe(true);
    } finally {
      await files.close();
    }
  });
}

test('Stop, navigation and history reload abort pending live GIF reads without stale playback', async ({
  page,
}, info) => {
  const files = await fixture(info),
    urls = await resources(page);
  try {
    await page.goto(files.live);
    for (const action of ['stop', 'navigate', 'reload']) {
      let release!: () => void, began!: () => void;
      const blocked = new Promise<void>((resolve) => {
        release = resolve;
      });
      const started = new Promise<void>((resolve) => {
        began = resolve;
      });
      const match = (url: URL) => url.pathname === '/__art/api/artwork';
      await page.route(match, async (route) => {
        began();
        await blocked;
        await route.continue().catch(() => {});
      });
      const aborted = page.waitForEvent(
        'requestfailed',
        (request) => new URL(request.url()).pathname === '/__art/api/artwork',
      );
      await page
        .locator('[data-revision="gif"]')
        .getByRole('button', { name: 'Play GIF', exact: true })
        .click();
      await started;
      if (action === 'stop')
        await page.getByRole('button', { name: 'Stop GIF', exact: true }).click();
      else if (action === 'navigate')
        await page.evaluate(() => {
          location.hash = 'asset=missing';
        });
      else {
        await page.getByRole('button', { name: 'Reload history', exact: true }).click();
        await expect(page.getByRole('status')).toHaveText('History reloaded.');
      }
      await aborted;
      release();
      await page.unroute(match);
      await expect(page.locator('.revision-preview img')).toHaveCount(0);
      expect(urls.created).toHaveLength(0);
      if (action === 'navigate')
        await page.getByRole('link', { name: 'Unassigned source artwork', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Play GIF', exact: true }).click();
    await color(page, page.locator('.revision-preview img'), red);
    await page.getByRole('button', { name: 'Reload history', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('History reloaded.');
    await expect.poll(urls.active).toBe(0);
  } finally {
    await files.close();
  }
});
