import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { renderNativePacket } from './native-packet.ts';

await test('native packet renders the actual Markdown handoff with the requested identity', async () => {
  const root = resolve(import.meta.dirname, '../../..');
  for (const id of ['river-otter', 'handoff-probe']) {
    const packet = await renderNativePacket(root, id);
    assert.deepEqual(
      packet.map(({ filename }) => filename),
      ['brief.md', 'study.ts.template', 'handoff.md'],
    );
    for (const { content } of packet) {
      assert.ok(content.includes(id));
      assert.doesNotMatch(content, /\{\{[^}]+\}\}/);
    }
    assert.ok(packet[2].content.startsWith(`# ${id} native study handoff\n`));
  }
});

await test('handoff substitution replaces repeated identities while preserving Markdown links and prose', async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), 'native-packet-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const templates = resolve(root, 'skills/card-art/assets');
  await mkdir(templates, { recursive: true });
  for (const name of ['native-brief.md.template', 'motion-study.ts.template'])
    await writeFile(resolve(templates, name), '{{id}}');
  await writeFile(
    resolve(templates, 'native-handoff.md.template'),
    '# {{id}}\n\n[{{id}}](https://example.invalid/{{id}}) — pending.\n',
  );
  const handoff = (await renderNativePacket(root, 'river-otter'))[2];
  assert.equal(handoff.filename, 'handoff.md');
  assert.equal(
    handoff.content,
    '# river-otter\n\n[river-otter](https://example.invalid/river-otter) — pending.\n',
  );
});
