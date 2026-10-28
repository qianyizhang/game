import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { Script } from 'node:vm';

const delivery = new URL('../../../docs/art/assets/golden-claw/', import.meta.url);

await test('Golden Claw opens as one offline HTML with no visible controls', async () => {
  const html = await readFile(new URL('film.html', delivery), 'utf8');
  assert.doesNotMatch(html, /<(?:button|input|select|video|audio|iframe)\b/i);
  assert.doesNotMatch(html, /<(?:script|img|link)\b[^>]*(?:src|href)=["']https?:/i);
  assert.doesNotMatch(html, /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  for (const script of scripts) new Script(script[1], { filename: 'golden-claw/film.html' });
  const images = [...html.matchAll(/data:image\/(?:webp|jpeg);base64,([A-Za-z0-9+/=]+)/g)];
  assert.equal(images.length, 4, 'All character and location plates must remain embedded');
  for (const image of images) assert.ok(Buffer.from(image[1], 'base64').length > 10_000);
});

await test('Golden Claw embeds the delivered reference-derived front and back masters', async () => {
  const html = await readFile(new URL('film.html', delivery), 'utf8');
  for (const name of ['hero-front.webp', 'hero-back.webp']) {
    const bytes = await readFile(new URL(name, delivery));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.ok(
      html.includes(`data:image/webp;base64,${bytes.toString('base64')}`),
      `The standalone film must embed the delivered ${name}`,
    );
  }
});

await test('Golden Claw GIF contains 900 timed frames, 30 seconds and a 16:9 canvas', async () => {
  const bytes = await readFile(new URL('golden-claw.gif', delivery));
  assert.equal(bytes.toString('ascii', 0, 6), 'GIF89a');
  assert.equal(bytes.readUInt16LE(6), 512);
  assert.equal(bytes.readUInt16LE(8), 288);
  let offset = 13;
  if (bytes[10] & 0x80) offset += 3 * 2 ** ((bytes[10] & 7) + 1);
  let frames = 0;
  let centiseconds = 0;
  let pendingDelay = 0;
  let trailer = false;
  const delays = new Set<number>();
  const skipBlocks = () => {
    while (offset < bytes.length) {
      const size = bytes[offset++];
      if (!size) return;
      offset += size;
      assert.ok(offset <= bytes.length, 'Truncated GIF sub-block');
    }
    assert.fail('GIF sub-block sequence has no terminator');
  };
  while (offset < bytes.length) {
    const marker = bytes[offset++];
    if (marker === 0x3b) {
      trailer = true;
      break;
    }
    if (marker === 0x21) {
      const label = bytes[offset++];
      if (label === 0xf9) {
        assert.equal(bytes[offset], 4);
        pendingDelay = bytes.readUInt16LE(offset + 2);
      }
      skipBlocks();
    } else if (marker === 0x2c) {
      assert.ok(offset + 9 <= bytes.length);
      const packed = bytes[offset + 8];
      offset += 9;
      if (packed & 0x80) offset += 3 * 2 ** ((packed & 7) + 1);
      offset++; // LZW minimum code size precedes the image data sub-blocks.
      skipBlocks();
      frames++;
      centiseconds += pendingDelay;
      delays.add(pendingDelay);
      pendingDelay = 0;
    } else assert.fail(`Invalid GIF block marker ${marker} at ${offset - 1}`);
  }
  assert.equal(trailer, true);
  assert.equal(offset, bytes.length);
  assert.equal(frames, 900);
  assert.equal(centiseconds, 3000);
  assert.deepEqual([...delays].sort(), [3, 4], 'GIF approximates 30fps with 30/40ms delays');
});
