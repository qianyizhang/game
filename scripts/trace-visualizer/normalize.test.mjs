import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeThread, scriptJSON } from './normalize.mjs';
const fixture = (items) => ({
  schemaVersion: 1,
  thread: { id: 'thread' },
  page: { hasMore: false },
  turns: [
    { id: 'later', startedAt: 20, items },
    { id: 'earlier', startedAt: 10, items: [] },
  ],
});
test('preserves turn and event provenance while excluding reasoning and ambient UI', () => {
  const result = normalizeThread(
    fixture([
      { id: 'r', type: 'reasoning', content: ['private'] },
      {
        id: 'u',
        type: 'userMessage',
        content: [
          {
            type: 'text',
            text: '<in-app-browser-context>ambient</in-app-browser-context>\n## My request:\nMake the shape flow.',
          },
        ],
      },
      {
        id: 'c',
        type: 'commandExecution',
        command: 'false',
        exitCode: 1,
        output: { text: 'failed', truncated: true },
      },
    ]),
  );
  assert.equal(result.turns[0].id, 'earlier');
  const events = result.turns[1].events;
  assert.equal(events.length, 2);
  assert.equal(events[0].ordinal, 2);
  assert.equal(events[0].text, 'Make the shape flow.');
  assert.equal(events[1].exitCode, 1);
  assert.equal(events[1].truncated, true);
  assert.equal(events[1].turnId, 'later');
});
test('refuses incomplete paginated exports', () => {
  const page = fixture([]);
  page.page.hasMore = true;
  assert.throws(() => normalizeThread(page), /paginated/);
});
test('embedded transcript cannot terminate script or introduce HTML', () => {
  const input = { text: '</script><img src=x onerror=alert(1)>\u2028' };
  const output = scriptJSON(input);
  assert.equal(output.includes('<'), false);
  assert.deepEqual(JSON.parse(output), input);
});
test('marks clipped commands and patch excerpts', () => {
  const result = normalizeThread(
    fixture([
      { type: 'commandExecution', id: 'c', command: 'x'.repeat(17000), output: { text: 'ok' } },
      {
        type: 'fileChange',
        id: 'f',
        changes: [{ path: 'a.ts', diff: { text: '+foo', truncated: true } }],
      },
    ]),
  );
  assert.equal(result.turns[1].events[0].text.length, 16000);
  assert.ok(result.turns[1].events.every((e) => e.truncated));
});
