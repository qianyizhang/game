import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile, readFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { buildCase } from './build.mjs';
import { writeFixture } from './fixture.mjs';
async function fixture(t) {
  const root = await mkdtemp(resolve(tmpdir(), 'trace-model-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return writeFixture(root);
}
test('cross-thread evidence resolves, deduplicates and produces factual summaries and artifact identities', async (t) => {
  const f = await fixture(t);
  f.spec.stages[0].evidence.push(f.spec.stages[0].evidence[1]);
  const d = await buildCase(f),
    s = d.stages[0];
  assert.equal(s.evidence.length, 6);
  assert.equal(s.facts.commands, 1);
  assert.equal(s.facts.verificationCommands, 1);
  assert.equal(s.facts.fileEdits, 1);
  assert.deepEqual(s.facts.changedFiles, ['src/bird.ts']);
  assert.deepEqual(s.facts.relatedThreads, ['worker', 'uncollected-worker']);
  assert.equal(d.artifacts[0].id, 'revision:bird');
  assert.equal(d.artifacts[0].provenance.sourcePairing, 'unknown');
  assert.equal(s.assessments[0].artifactId, d.artifacts[0].id);
  const manifest = JSON.parse(await readFile(resolve(f.output, 'manifest.json')));
  const raw = await readFile(resolve(f.input, 'parent.json'));
  assert.equal(manifest.inputs[0].sha256, createHash('sha256').update(raw).digest('hex'));
  assert.equal(manifest.traceSources[0].coverage.unsupportedItems[0].count, 1);
});
test('bad or absent evidence and malformed case records fail clearly', async (t) => {
  const f = await fixture(t),
    original = structuredClone(f.spec);
  for (const [change, pattern] of [
    [(s) => delete s.evidence, /Missing evidence/],
    [(s) => (s.evidence[0].thread = 'absent'), /Unknown evidence thread/],
    [(s) => (s.evidence[0].turn = 'absent'), /Unknown evidence turn/],
    [(s) => (s.evidence[0].event = 'absent'), /Unknown or excluded evidence event/],
    [(s) => (s.evidence[0].event = 'private'), /Unknown or excluded evidence event/],
    [(s) => (s.evidence[0].role = 'invented'), /Invalid evidence role/],
    [(s) => (s.assessments[0].evidence = []), /Assessment needs evidence/],
    [(s) => (s.actors[0].threadId = 'absent'), /Invalid episode actor/],
  ]) {
    f.spec = structuredClone(original);
    change(f.spec.stages[0]);
    await assert.rejects(buildCase(f), pattern);
  }
});
test('source paths are independent by default; explicit keys connect retained revisions and detect collisions', async (t) => {
  const f = await fixture(t);
  for (const [path, text] of [
    ['r1/a/index.ts', 'old'],
    ['r1/b/index.ts', 'other'],
    ['r2/a/index.ts', 'new'],
  ]) {
    await mkdir(resolve(f.root, 'test-results', path, '..'), { recursive: true });
    await writeFile(resolve(f.root, 'test-results', path), text);
  }
  const s = f.spec.stages[0];
  s.source = 'r1';
  f.spec.stages.push({ ...structuredClone(s), id: 'next', source: 'r2' });
  let d = await buildCase(f);
  assert.equal(d.stages[0].sources.length, 2);
  assert.equal(d.stages[1].sources[0].diff, null);
  f.spec.sourceKeys = {
    'test-results/r1/a/index.ts': 'model',
    'test-results/r2/a/index.ts': 'model',
  };
  d = await buildCase(f);
  assert.match(d.stages[1].sources[0].diff.text, /-old[\s\S]*\+new/);
  f.spec.sourceKeys['test-results/r1/b/index.ts'] = 'model';
  await assert.rejects(buildCase(f), /sourceKey collision/);
});
test('rejects path escapes including symlinks, hashes exact retained media bytes', async (t) => {
  const f = await fixture(t),
    s = f.spec.stages[0];
  s.source = '../../outside';
  await assert.rejects(buildCase(f), /inside repository/);
  s.source = null;
  s.capture = 'images';
  await mkdir(resolve(f.root, 'test-results/images'), { recursive: true });
  await writeFile(resolve(f.root, 'test-results/images/hydra-hero.png'), 'retained bytes');
  let d = await buildCase(f);
  assert.equal(d.media[0].sha256, createHash('sha256').update('retained bytes').digest('hex'));
  assert.equal(await readFile(resolve(f.output, d.media[0].url), 'utf8'), 'retained bytes');
  await symlink(tmpdir(), resolve(f.root, 'test-results/escape'));
  s.capture = 'escape';
  await assert.rejects(buildCase(f), /inside repository/);
  s.capture = null;
  s.source = null;
  f.spec.documents = ['../outside'];
  await assert.rejects(buildCase(f));
});
