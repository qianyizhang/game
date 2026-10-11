import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, symlink, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fromRoot } from '../io.ts';
import { runCli as scaffold } from './scaffold.ts';
import { inventory } from './review.ts';
import type { Rasterizer } from './raster.ts';

await test('package export works outside cwd, writes a standalone catalogue and refuses overwrite', async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), 'art-export-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const output = resolve(root, 'export');
  const command = fromRoot('packages/workshop-tools/art/export.ts');
  const args = [command, output];
  execFileSync(process.execPath, args, { cwd: tmpdir(), stdio: 'pipe' });
  const manifest = await readFile(resolve(output, 'manifest.json'));
  const svg = await readFile(resolve(output, 'primitives/sword.svg'), 'utf8');
  assert.match(svg, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.doesNotMatch(svg, /var\(--/);
  assert.match(await readFile(resolve(output, 'index.html'), 'utf8'), /type="module"/);
  assert.throws(
    () => execFileSync(process.execPath, args, { cwd: tmpdir(), stdio: 'pipe' }),
    /EEXIST/,
  );
  assert.deepEqual(await readFile(resolve(output, 'manifest.json')), manifest);
});

await test('scaffold preserves existing art and refuses destination symlinks and root escapes', async (t) => {
  await mkdir(fromRoot('test-results'), { recursive: true });
  const root = await mkdtemp(fromRoot('test-results/scaffold-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = resolve(root, 'ProofArt.tsx');
  await scaffold(['ProofArt', path]);
  const bytes = await readFile(path);
  assert.match(bytes.toString(), /ArtScene/);
  await assert.rejects(scaffold(['ProofArt', path]), /EEXIST/);
  assert.deepEqual(await readFile(path), bytes);
  await symlink(tmpdir(), resolve(root, 'outside'));
  await assert.rejects(scaffold(['ProofArt', resolve(root, 'outside/ProofArt.tsx')]), /symlinks/);
  await assert.rejects(
    scaffold(['ProofArt', resolve(tmpdir(), 'ProofArt.tsx')]),
    /inside this repository/,
  );
});

await test('native study scaffold creates an editable packet and protects existing work and boundaries', async (t) => {
  await mkdir(fromRoot('test-results'), { recursive: true });
  const root = await mkdtemp(fromRoot('test-results/study-scaffold-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const output = resolve(root, 'new/study');
  await scaffold(['study', 'river-otter', output]);
  for (const filename of ['brief.md', 'study.ts.template', 'handoff.md']) {
    const content = await readFile(resolve(output, filename), 'utf8');
    assert.match(content, /river-otter/);
    assert.doesNotMatch(content, /\{\{id\}\}/);
  }
  const brief = resolve(output, 'brief.md');
  await writeFile(brief, 'An authored brief, with decisions worth preserving.');
  await assert.rejects(scaffold(['study', 'river-otter', output]), /EEXIST/);
  assert.equal(
    await readFile(brief, 'utf8'),
    'An authored brief, with decisions worth preserving.',
  );
  await symlink(tmpdir(), resolve(root, 'outside'));
  await assert.rejects(scaffold(['study', 'otter', resolve(root, 'outside/packet')]), /symlinks/);
  await assert.rejects(
    scaffold(['study', 'otter', resolve(tmpdir(), 'packet')]),
    /inside this repository/,
  );
  await assert.rejects(scaffold(['study', 'otter', fromRoot('.')]), /inside this repository/);
  await assert.rejects(scaffold(['study', '../otter', resolve(root, 'invalid')]), /study ID/);
  await assert.rejects(scaffold(['study', 'otter']), /fresh destination/);
  await assert.rejects(scaffold(['study', 'otter', output, 'extra']), /fresh destination/);
});

await test('review rejects malformed dimensions and symlinked source escapes before rasterization', async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), 'art-review-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = resolve(root, 'input');
  await mkdir(input);
  const asset = { id: 'sample', name: 'Sample', file: 'sample.svg', width: 0, height: 10 };
  await writeFile(resolve(input, 'manifest.json'), JSON.stringify([asset]));
  const unused: Rasterizer = Object.assign(
    () => {
      throw new Error('Rasterizer must not run for invalid input');
    },
    { versions: { test: 'none' } },
  );
  await assert.rejects(inventory(input, unused), /Invalid or duplicate/);
  await writeFile(resolve(root, 'outside.svg'), '<svg/>');
  await symlink(resolve(root, 'outside.svg'), resolve(input, 'sample.svg'));
  asset.width = 10;
  await writeFile(resolve(input, 'manifest.json'), JSON.stringify([asset]));
  await assert.rejects(inventory(input, unused), /escapes export directory/);
});
