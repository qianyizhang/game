import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { writeGalleryPages } from './gallery/pages.ts';
import { WIP_BATCHES, type BatchCandidate } from './gallery/library.ts';

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
  await writeGalleryPages(output, [], candidates, []);
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
      [],
    ),
    { code: 'ENOENT' },
  );
  assert.equal(await readFile(first, 'utf8'), 'First batch: original prompt and review limits.');
  await assert.rejects(
    writeGalleryPages(resolve(root, 'invalid-proposal'), [], candidates, [
      { ...WIP_BATCHES[0], candidates: ['missing-candidate'] },
    ]),
    /Batch proposal references missing candidate: missing-candidate/,
  );
});

await test('a candidate and packed batch can share one record without dropping study files', async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), 'gallery-shared-record-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const record = resolve(root, 'record.md');
  const candidate = resolve(root, 'candidate.svg');
  const sheet = resolve(root, 'sheet.svg');
  const scene = resolve(root, 'scene.svg');
  const attachment = resolve(root, 'request.json');
  await writeFile(record, 'One owning record for the candidate and packed batch.');
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 7"><path d="M0 0h10v7H0z"/></svg>';
  for (const file of [candidate, sheet, scene]) await writeFile(file, svg);
  await writeFile(attachment, '{"prompt":"Retain this exact request."}\n');
  const output = resolve(root, 'export');
  await mkdir(output);
  await writeGalleryPages(
    output,
    [],
    [
      {
        id: 'one',
        game: 'spire',
        title: 'One',
        reason: 'Compare existing and packed artwork.',
        brief: 'Review the silhouette.',
        current: [],
        status: 'SVG trial',
        trial: { file: candidate, record },
      },
    ],
    [
      {
        id: 'shared-study',
        game: 'spire',
        title: 'Shared study',
        reason: 'Keep one source record.',
        candidates: ['one'],
        reference: 'Existing artwork.',
        deliverables: 'One packed scene.',
        requests: [{ format: 'SVG', plan: 'One bounded request.' }],
        stop: 'Await review.',
        acceptance: ['Inspect the scene at its intended size.'],
        record,
        study: {
          summary: 'A packed scene with its original request.',
          sheet,
          subjects: [{ title: 'One', tiers: [{ label: 'Regular', file: scene }] }],
          attachments: [attachment],
        },
      },
    ],
  );
  for (const [name, source] of [
    ['sheet.svg', sheet],
    ['scene.svg', scene],
    ['request.json', attachment],
  ])
    assert.deepEqual(
      await readFile(resolve(output, 'batches/shared-study', name)),
      await readFile(source),
    );
  const html = await readFile(resolve(output, 'spire.html'), 'utf8');
  assert.match(html, /href="batches\/shared-study\/sheet\.svg"/);
  assert.match(html, /href="batches\/shared-study\/scene\.svg"/);
  assert.doesNotMatch(html, /<img\b[^>]*src="(?!data:)/);
  assert.match(html, /href="candidates\/one\.md">Full proposal and preservation record/);
  assert.equal(
    await readFile(resolve(output, 'candidates/one.md'), 'utf8'),
    await readFile(record, 'utf8'),
  );
  assert.equal(
    (await readdir(output, { recursive: true })).filter((file) => file.endsWith('.md')).length,
    1,
  );
});
