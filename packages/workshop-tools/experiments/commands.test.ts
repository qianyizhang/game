import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { comparePlaytests } from './compare-playtests.ts';
import { fromRoot } from '../io.ts';

await test('comparison pairs full runs by context and preserves baseline/candidate pins', () => {
  const row = {
    game: 'sample',
    seed: 'S',
    source: 'automated',
    mode: 'normal',
    setup: {},
    startStep: 0,
    version: 1,
    content: [],
    summary: { context: 'plain', outcome: 'won', metrics: { score: 4 } },
  };
  const changed = {
    ...row,
    version: 2,
    content: ['new'],
    summary: { ...row.summary, metrics: { score: 7 } },
  };
  const report = comparePlaytests(JSON.stringify([row]), JSON.stringify([changed]));
  assert.equal(report.matchedPairs, 1);
  assert.deepEqual(report.paired[0].delta, { score: 3 });
  assert.equal(report.paired[0].baseline.version, 1);
  assert.equal(report.paired[0].candidate.version, 2);
  for (const candidate of [
    [],
    [changed, changed],
    [{ ...changed, startStep: 1 }],
    [{ ...changed, source: 'human' }],
    [{ ...changed, summary: { ...changed.summary, outcome: 'active' } }],
  ]) {
    assert.equal(
      comparePlaytests(JSON.stringify([row]), JSON.stringify(candidate)).matchedPairs,
      0,
    );
  }
  assert.throws(() => comparePlaytests('null', '[]'), /array/);
  assert.throws(
    () =>
      comparePlaytests(
        JSON.stringify([{ ...row, summary: { ...row.summary, metrics: { score: '7' } } }]),
        '[]',
      ),
    /finite evidence metrics/,
  );
});

await test('challenge CLI works outside cwd and preserves an existing solution bundle', async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), 'challenge-cli-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const output = resolve(root, 'solutions');
  const args = [fromRoot('packages/workshop-tools/experiments/solve-challenges.ts'), output];
  execFileSync(process.execPath, args, { cwd: tmpdir(), stdio: 'pipe' });
  const report = await readFile(resolve(output, 'report.json'));
  assert.match(report.toString(), /"status": "solved"/);
  assert.throws(
    () => execFileSync(process.execPath, args, { cwd: tmpdir(), stdio: 'pipe' }),
    /EEXIST/,
  );
  assert.deepEqual(await readFile(resolve(output, 'report.json')), report);
});
