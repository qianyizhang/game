import assert from 'node:assert/strict';
import { test } from 'node:test';
import { movePoint, parsePath, pathPoints, serializePath } from '../src/path-data.js';

test('relative, shorthand, implicit and packed arc commands preserve their geometry', () => {
  const data = 'M10,20 15,25h8v-3c1 2 3 4 5 6s7 8 9 10q2 3 4 5t6 7a8 9 0 0110-3z m20 5 5 0';
  const normalized =
    'M10 20 L15 25 L23 25 L23 22 C24 24 26 26 28 28 C30 30 35 36 37 38 Q39 41 41 43 Q43 45 47 50 A8 9 0 0 1 57 47 Z M30 25 L35 25';
  assert.equal(serializePath(parsePath(data)), normalized);
  assert.equal(serializePath(parsePath(normalized)), normalized);
});

test('editing a handle keeps the endpoint and other handles fixed', () => {
  const segments = parsePath('M0 0 C1 2 3 4 5 6');
  const handle = pathPoints(segments).find((point) => point.kind === 'Handle');
  assert.equal(movePoint(segments, handle.id, -1.25, 7.5), true);
  assert.equal(serializePath(segments), 'M0 0 C-1.25 7.5 3 4 5 6');
  assert.equal(movePoint(segments, handle.id, Number.NaN, 10), false);
  assert.equal(serializePath(segments), 'M0 0 C-1.25 7.5 3 4 5 6');
});

test('malformed geometry is rejected instead of partly rewritten', () => {
  for (const data of ['L1 2', 'M1', 'M1 2,', 'M1 2 Z 4 5', 'M1 2 A5 5 0 2 0 6 7', 'M1e999 1']) {
    assert.throws(() => parsePath(data), /malformed or unsupported/, data);
  }
});
