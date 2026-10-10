import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import {
  auditCommittedFiles,
  auditDefaults,
  formatCommittedAudit,
  parseAuditArgs,
} from './committed-files.ts';

async function fixture(t: TestContext) {
  const root = await mkdtemp(join(tmpdir(), 'committed-files-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  git('init', '--quiet');
  git('config', 'user.email', 'fixture@example.invalid');
  git('config', 'user.name', 'Audit fixture');
  git('config', 'commit.gpgsign', 'false');
  return { root, git };
}

await test('audits committed bytes despite staged edits, deletions, untracked files and hydrated LFS', async (t) => {
  const { root, git } = await fixture(t);
  await mkdir(join(root, 'src'));
  await writeFile(join(root, 'src/logic.ts'), 'first\n\nlast');
  await writeFile(join(root, 'duplicate.ts'), 'first\n\nlast');
  await writeFile(join(root, 'binary.bin'), Buffer.from([0, 10, 255, 10]));
  await writeFile(join(root, 'not-utf8.bin'), Buffer.from([255]));
  await writeFile(join(root, 'empty.ts'), '');
  await writeFile(join(root, 'crlf.ts'), 'one\r\ntwo\r\n');
  await writeFile(join(root, 'unicode.ts'), '你好\nfin');
  await writeFile(
    join(root, 'model.glb'),
    `version https://git-lfs.github.com/spec/v1\noid sha256:${'a'.repeat(64)}\nsize 10000000\n`,
  );
  await symlink('src/logic.ts', join(root, 'link.ts'));
  await writeFile(join(root, 'space\nand tab\t.ts'), 'odd path\n');
  git('add', '.');
  git('commit', '--quiet', '-m', 'Known committed fixture');
  const commit = git('rev-parse', 'HEAD');
  await writeFile(join(root, 'src/logic.ts'), 'different staged bytes\n');
  git('add', 'src/logic.ts');
  await rm(join(root, 'binary.bin'));
  await writeFile(join(root, 'untracked.json'), '{}');
  await writeFile(join(root, 'model.glb'), Buffer.alloc(400));
  const before = git('status', '--porcelain=v1', '-z');
  const report = await auditCommittedFiles(root, { ...auditDefaults, minBytes: 10, minLines: 3 });
  assert.equal(report.commit, commit);
  assert.equal(report.totals.files, 10);
  const get = (path: string) => report.files.find((file) => file.path === path)!;
  assert.equal(get('src/logic.ts').bytes, 11);
  assert.equal(get('src/logic.ts').lines, 3);
  assert.equal(get('src/logic.ts').longestLineBytes, 5);
  assert.equal(get('crlf.ts').lines, 2);
  assert.equal(get('unicode.ts').lines, 2);
  assert.equal(get('unicode.ts').longestLineBytes, 6);
  assert.equal(get('empty.ts').lines, 0);
  assert.equal(get('binary.bin').lines, null);
  assert.equal(get('not-utf8.bin').lines, null);
  assert.equal(get('link.ts').lines, null);
  assert.equal(get('model.glb').lfsPayloadBytes, 10000000);
  assert.equal(get('model.glb').lines, null);
  assert.equal(report.totals.lfsPayloadBytes, 10000000);
  assert.equal(report.totals.duplicatePathBytes, 11);
  assert.deepEqual(report.duplicateGroups[0].paths, ['duplicate.ts', 'src/logic.ts']);
  assert.equal(get('space\nand tab\t.ts').lines, 1);
  assert.equal(git('status', '--porcelain=v1', '-z'), before);
  const rendered = formatCommittedAudit(report, 2);
  assert.match(rendered, /Not semantic code LOC/);
  assert.match(rendered, /earlier history/);
});

await test('separates bulk JSON from evidence/lockfile advice and handles streaming/minified outliers', async (t) => {
  const { root, git } = await fixture(t);
  await mkdir(join(root, 'docs/research'), { recursive: true });
  const data = {
    receipt: 'keep',
    samples: Array.from({ length: 5000 }, (_, i) => ({ i, value: '测量' })),
  };
  await writeFile(join(root, 'bulk.json'), JSON.stringify(data));
  await writeFile(join(root, 'docs/research/results.json'), JSON.stringify(data, null, 2));
  await writeFile(join(root, 'package-lock.json'), JSON.stringify(data, null, 2));
  await writeFile(join(root, 'invalid.json'), '{oops\n');
  await writeFile(join(root, 'oversized.json'), '"' + 'x'.repeat(8 * 1024 * 1024) + '"');
  git('add', '.');
  git('commit', '--quiet', '-m', 'Bulk data fixture');
  const firstCommit = git('rev-parse', 'HEAD');
  await writeFile(join(root, 'later.ts'), 'new commit');
  git('add', 'later.ts');
  git('commit', '--quiet', '-m', 'Later state');
  const report = await auditCommittedFiles(root, {
    ...auditDefaults,
    ref: firstCommit,
    minBytes: 1000,
  });
  const get = (path: string) => report.files.find((file) => file.path === path)!;
  assert.equal(report.totals.files, 5);
  assert.equal(get('bulk.json').lines, 1);
  assert.equal(get('bulk.json').longestLineBytes, Buffer.byteLength(JSON.stringify(data)));
  assert.equal(get('bulk.json').json?.largestFields[0].name, 'samples');
  assert.equal(get('bulk.json').json?.largestFields[0].items, 5000);
  assert.ok(get('bulk.json').signals.includes('long-lines'));
  assert.equal(get('invalid.json').json, null);
  assert.equal(get('oversized.json').json, null);
  assert.equal(get('oversized.json').lines, 1);
  assert.match(get('docs/research/results.json').suggestion, /Preserve frozen evidence/);
  assert.match(get('package-lock.json').suggestion, /do not split manually/);
  assert.match(get('bulk.json').suggestion, /producer and consumers/);
  await assert.rejects(auditCommittedFiles(root, { ...auditDefaults, ref: '--bad-ref' }));
});

await test('rejects malformed CLI options without silently broadening the audit', () => {
  assert.deepEqual(
    parseAuditArgs([
      '--ref',
      'HEAD~1',
      '--top',
      '5',
      '--min-bytes',
      '1024',
      '--min-lines',
      '300',
      '--json',
    ]),
    { ref: 'HEAD~1', top: 5, minBytes: 1024, minLines: 300, json: true },
  );
  for (const args of [
    ['--top'],
    ['--top', '0'],
    ['--min-lines', '-1'],
    ['--min-bytes', '1.5'],
    ['--top', '9007199254740992'],
    ['--ref'],
    ['--oops'],
  ])
    assert.throws(() => parseAuditArgs(args));
});

await test('empty commits produce an empty inventory', async (t) => {
  const { root, git } = await fixture(t);
  git('commit', '--allow-empty', '--quiet', '-m', 'Empty tree');
  const report = await auditCommittedFiles(root);
  assert.equal(report.totals.files, 0);
  assert.equal(report.totals.blobBytes, 0);
  assert.deepEqual(report.files, []);
});
