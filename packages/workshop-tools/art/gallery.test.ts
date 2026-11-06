import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { writeGalleryPages } from './gallery/pages.ts';
import type { BatchCandidate } from './gallery/library.ts';

await test('generated candidates retain their own trial records and share one copy within a batch', async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), 'gallery-trials-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const first = resolve(root, 'first.md');
  const second = resolve(root, 'second.md');
  const svg = resolve(root, 'candidate.svg');
  await writeFile(first, 'First batch: original prompt and review limits.');
  await writeFile(second, 'Second batch: a different prompt and review decision.');
  await writeFile(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 7"/>');
  const candidates: BatchCandidate[] = ['one', 'two', 'three'].map((id, index) => ({
    id,
    game: 'spire',
    title: id,
    reason: 'Compare with current art.',
    brief: 'Review the silhouette.',
    current: [],
    status: 'SVG trial',
    trial: { file: svg, record: index < 2 ? first : second },
  }));
  const output = resolve(root, 'export');
  await mkdir(output);
  await writeGalleryPages(output, [], candidates);
  const html = await readFile(resolve(output, 'spire.html'), 'utf8');
  const records = [...html.matchAll(/href="([^"]+)">Prompt, usage and generation record/g)].map(
    (match) => match[1],
  );
  assert.equal(records.length, 3);
  assert.equal(records[0], records[1]);
  assert.notEqual(records[0], records[2]);
  assert.equal(await readFile(resolve(output, records[0]), 'utf8'), await readFile(first, 'utf8'));
  assert.equal(await readFile(resolve(output, records[2]), 'utf8'), await readFile(second, 'utf8'));
  assert.equal(
    (await readdir(resolve(output, 'candidates'))).filter((file) => file.endsWith('.md')).length,
    2,
  );

  const failed = resolve(root, 'missing-record');
  await mkdir(failed);
  await assert.rejects(
    writeGalleryPages(
      failed,
      [],
      [{ ...candidates[0], trial: { file: svg, record: resolve(root, 'missing.md') } }],
    ),
    { code: 'ENOENT' },
  );
  assert.equal(await readFile(first, 'utf8'), 'First batch: original prompt and review limits.');
});
