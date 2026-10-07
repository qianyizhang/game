import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyRetention, planRetention } from './retention.mjs';

const now = new Date('2026-10-07T00:00:00Z');
/** @param {(root: string) => void} use */
function fixture(use) {
  const root = mkdtempSync(join(tmpdir(), 'workshop-retention-'));
  execFileSync('git', ['init', '-q', root]);
  try {
    use(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
/** @param {string} root @param {string} path @param {Record<string, unknown>} [overrides] */
function close(root, path, overrides = {}) {
  const directory = join(root, path);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'review.png'), 'render');
  writeFileSync(
    join(directory, '.retention.json'),
    JSON.stringify({
      schemaVersion: 1,
      kind: 'output',
      state: 'closed',
      pinned: false,
      closedAt: '2026-09-01T00:00:00Z',
      files: { 'review.png': createHash('sha256').update('render').digest('hex') },
      ...overrides,
    }),
  );
}

await test('dry-run preserves bytes and apply deletes only the eligible exact entry', () =>
  fixture((root) => {
    close(root, 'test-results/disposable/old');
    close(root, 'test-results/historical-evidence');
    const plan = planRetention(root, now);
    assert.equal(plan.length, 1);
    assert.equal(plan[0].status, 'eligible');
    assert.equal(
      readFileSync(join(root, 'test-results/disposable/old/review.png'), 'utf8'),
      'render',
    );
    assert.equal(applyRetention(root, plan, now)[0].status, 'deleted');
    assert.ok(!existsSync(join(root, 'test-results/disposable/old')));
    assert.ok(existsSync(join(root, 'test-results/historical-evidence/review.png')));
  }));

await test('open, pinned, fresh, unclassified and future-dated entries stay protected', () =>
  fixture((root) => {
    close(root, 'test-results/disposable/open', { state: 'open' });
    close(root, 'test-results/disposable/pinned', { pinned: true });
    close(root, 'test-results/disposable/fresh', { closedAt: '2026-10-01T00:00:00Z' });
    close(root, 'test-results/disposable/future', { closedAt: '2027-01-01T00:00:00Z' });
    mkdirSync(join(root, 'test-results/disposable/unknown'));
    assert.ok(planRetention(root, now).every((entry) => entry.status === 'retained'));
  }));

await test('post-plan edits, new files and stale receipts prevent deletion', () =>
  fixture((root) => {
    close(root, 'test-results/disposable/changed');
    const plan = planRetention(root, now);
    writeFileSync(join(root, 'test-results/disposable/changed/review.png'), 'new evidence');
    assert.equal(applyRetention(root, plan, now)[0].status, 'retained');
    close(root, 'test-results/disposable/extra');
    writeFileSync(join(root, 'test-results/disposable/extra/new.json'), '{}');
    assert.ok(planRetention(root, now).every((entry) => entry.status === 'retained'));
  }));

await test('symlinked containers and entries cannot escape deletion scope', () =>
  fixture((root) => {
    close(root, 'test-results/history');
    mkdirSync(join(root, 'test-results/disposable'));
    symlinkSync(join(root, 'test-results/history'), join(root, 'test-results/disposable/link'));
    assert.equal(planRetention(root, now)[0].status, 'retained');
    rmSync(join(root, 'test-results/disposable'), { recursive: true });
    symlinkSync(join(root, 'test-results/history'), join(root, 'test-results/disposable'));
    assert.equal(planRetention(root, now)[0].status, 'retained');
    assert.ok(existsSync(join(root, 'test-results/history/review.png')));
  }));

await test('tracked content and artist source are protected even with a receipt', () =>
  fixture((root) => {
    close(root, 'test-results/disposable/tracked');
    execFileSync('git', ['add', '.'], { cwd: root });
    close(root, 'test-results/disposable/source');
    writeFileSync(join(root, 'test-results/disposable/source/artist.blend'), 'keep');
    assert.ok(planRetention(root, now).every((entry) => entry.status === 'retained'));
  }));

await test('sessions require a tracked promotion target and expire after 30 days', () =>
  fixture((root) => {
    mkdirSync(join(root, 'docs/engineering'), { recursive: true });
    writeFileSync(join(root, 'docs/engineering/decision.md'), 'Settled decision');
    execFileSync('git', ['add', 'docs'], { cwd: root });
    close(root, '.work/sessions/closed', {
      kind: 'session',
      promotedTo: ['docs/engineering/decision.md'],
    });
    close(root, '.work/sessions/missing', { kind: 'session' });
    close(root, '.work/sessions/fresh', {
      kind: 'session',
      promotedTo: ['docs/engineering/decision.md'],
      closedAt: '2026-09-20T00:00:00Z',
    });
    const plan = planRetention(root, now);
    assert.equal(plan.filter((entry) => entry.status === 'eligible').length, 1);
    assert.equal(plan.find((entry) => entry.status === 'eligible')?.path, '.work/sessions/closed');
  }));

await test('forged plans cannot delete unclassified directories outside the allowed roots', () =>
  fixture((root) => {
    close(root, 'test-results/history');
    const result = applyRetention(
      root,
      [{ path: 'test-results/history', status: 'eligible', reason: 'forged' }],
      now,
    );
    assert.equal(result[0].status, 'retained');
    assert.ok(existsSync(join(root, 'test-results/history/review.png')));
  }));
