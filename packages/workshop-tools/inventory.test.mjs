import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { inventoryArtifacts } from './inventory.mjs';

/** @param {import('node:test').TestContext} t */
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'workshop-inventory-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  execFileSync('git', ['init', '--quiet', root]);
  return root;
}

await test('equal bytes retain occurrence identities, source status and reference provenance', async (t) => {
  const root = await fixture(t);
  for (const directory of ['test-results/accepted', 'test-results/unknown'])
    await mkdir(join(root, directory), { recursive: true });
  await writeFile(join(root, 'test-results/accepted/model.glb'), 'exact bytes');
  await writeFile(join(root, 'test-results/unknown/copy.bin'), 'exact bytes');
  await writeFile(join(root, 'README.md'), 'Accepted evidence: `test-results/accepted/`.');
  execFileSync('git', ['add', 'README.md'], { cwd: root });
  const report = await inventoryArtifacts(root);
  assert.equal(report.totals.files, 2);
  assert.equal(report.totals.duplicateBytes, 11);
  assert.deepEqual(report.duplicateGroups[0].paths, [
    'test-results/accepted/model.glb',
    'test-results/unknown/copy.bin',
  ]);
  assert.deepEqual(report.groups['test-results/accepted'].references, ['README.md']);
  assert.equal(report.groups['test-results/accepted'].status, 'protected-source-or-asset');
  assert.equal(report.groups['test-results/unknown'].status, 'protected-unclassified');
  assert.equal(await readFile(join(root, 'test-results/unknown/copy.bin'), 'utf8'), 'exact bytes');
});

await test('root and nested symlinks are inventoried without following their targets', async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, 'outside'));
  await writeFile(join(root, 'outside/private.bin'), 'outside');
  await symlink(join(root, 'outside'), join(root, 'dcc-backups'));
  await mkdir(join(root, 'test-results'));
  await symlink(join(root, 'outside'), join(root, 'test-results/escape'));
  const report = await inventoryArtifacts(root);
  assert.equal(report.files.length, 2);
  assert.ok(report.files.every((file) => file.status === 'protected-special-file'));
  assert.equal(report.totals.bytes, 0);
  assert.equal(report.duplicateGroups.length, 0);
});
