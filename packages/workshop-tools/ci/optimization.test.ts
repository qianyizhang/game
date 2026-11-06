import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, chmodSync, mkdtempSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { environmentStamp } from './environment.ts';
import { changedInputs } from './changes.ts';
import { browserGroups, browserSeconds } from './sharding.ts';
import { selectPlan } from './selection.ts';
import { reusable, type Receipt, type Run } from './reuse.ts';
import { requiredModules, verifyResults } from './commands.ts';
const head = 'a'.repeat(40);
const catalogue = {
  application: ['src/shared/replay.test.ts'],
  browser: ['tests/browser/golden-claw.spec.ts'],
  geometry: [],
};
void test('local changes include staged, unstaged, untracked, deleted, executable and symlink inputs', () => {
  const root = mkdtempSync(join(tmpdir(), 'local-changes-'));
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  try {
    git('init', '--quiet');
    git('config', 'user.name', 'fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    for (const name of ['staged', 'unstaged', 'deleted', 'executable', 'link'])
      writeFileSync(join(root, name), 'before');
    git('add', '.');
    git('commit', '--quiet', '-m', 'baseline');
    const base = git('rev-parse', 'HEAD');
    writeFileSync(join(root, 'staged'), 'after');
    git('add', 'staged');
    writeFileSync(join(root, 'unstaged'), 'after');
    writeFileSync(join(root, 'untracked'), 'new');
    rmSync(join(root, 'deleted'));
    chmodSync(join(root, 'executable'), 0o755);
    rmSync(join(root, 'link'));
    symlinkSync('staged', join(root, 'link'));
    const local = changedInputs(root, base, true);
    assert.deepEqual(local.changes.map((c) => c.path).sort(), [
      'deleted',
      'executable',
      'link',
      'staged',
      'unstaged',
      'untracked',
    ]);
    assert.deepEqual(local.unsafePaths.sort(), ['executable', 'link']);
    assert.deepEqual(changedInputs(root, base).changes, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
void test('duration packing covers each file once and lowers a skewed file-count schedule', () => {
  const files = [
    'tests/browser/night-passage.spec.ts',
    'tests/browser/night-passage-agent.spec.ts',
    'tests/browser/art-export.spec.ts',
    'tests/browser/asset-gallery.spec.ts',
  ];
  const groups = browserGroups(files, 2);
  assert.deepEqual(groups.flat().sort(), files.sort());
  const totals = groups.map((group) =>
    group.reduce((sum, file) => sum + (browserSeconds[file] ?? 60), 0),
  );
  assert.ok(Math.max(...totals) < 150);
  assert.deepEqual(browserGroups(files, 2), groups);
});
void test('movie shortcuts fail closed for executable inputs, unknown files, shared consumers and uncertain graphs', () => {
  const path = 'docs/art/movie-experiments/golden-claw/film.html';
  const change = [{ path, status: 'M' }];
  const selected = selectPlan(change, catalogue, new Map(), { head });
  assert.equal(selected.mode, 'movies');
  for (const options of [
    { unsafePaths: [path] },
    { uncertain: ['unknown import'] },
    { full: true },
  ])
    assert.notEqual(selectPlan(change, catalogue, new Map(), { head, ...options }).mode, 'movies');
  assert.equal(
    selectPlan(change, catalogue, new Map([[path, new Set(['src/shared/replay.test.ts'])]]), {
      head,
    }).mode,
    'application',
  );
  assert.equal(
    selectPlan(
      [{ path: 'docs/art/movie-experiments/golden-claw/new.js', status: 'A' }],
      catalogue,
      new Map(),
      { head },
    ).mode,
    'application',
  );
});
void test('reuse requires exact trusted successful evidence and the main integrity gate still must pass', () => {
  const plan = {
    ...selectPlan([{ path: 'package.json', status: 'M' }], catalogue, new Map(), { head }),
    environment: JSON.stringify({ image: 'hosted-image', chrome: 'Google Chrome 156.0.8078.47' }),
  };
  const receipt: Receipt = {
    version: 1,
    tree: 'b'.repeat(40),
    pullHead: head,
    runId: 42,
    attempt: 1,
    environment: JSON.stringify({ image: 'hosted-image', chrome: 'Google Chrome 156.0.8078.47' }),
    plan,
  };
  const now = Date.now();
  const run: Run = {
    id: 42,
    run_attempt: 1,
    event: 'pull_request',
    status: 'completed',
    conclusion: 'success',
    head_sha: head,
    head_repository: { full_name: 'owner/repo' },
    path: '.github/workflows/maintenance.yml',
    updated_at: new Date(now - 1000).toISOString(),
  };
  const context = { repository: 'owner/repo', tree: receipt.tree, pullHead: head, plan, now };
  assert.equal(reusable(receipt, run, context), true);
  assert.equal(reusable({ ...receipt, attempt: 2 }, { ...run, run_attempt: 2 }, context), false);
  for (const patch of [
    { conclusion: 'failure' },
    { event: 'push' },
    { run_attempt: 2 },
    { head_sha: 'c'.repeat(40) },
    { head_repository: { full_name: 'fork/repo' } },
    { path: '.github/workflows/other.yml' },
    { updated_at: new Date(now - 25 * 60 * 60 * 1000).toISOString() },
  ])
    assert.equal(reusable(receipt, { ...run, ...patch }, context), false);
  for (const patch of [
    { version: 0 },
    { tree: 'c'.repeat(40) },
    { environment: 'changed image' },
    { plan: { ...plan, coreFiles: [] } },
  ])
    assert.equal(reusable({ ...receipt, ...patch } as Receipt, run, context), false);
  assert.equal(
    reusable(receipt, run, {
      ...context,
      plan: { ...plan, browserFiles: [...plan.browserFiles, 'extra.spec.ts'] },
    }),
    false,
  );
  const results = {
    plan: 'success',
    documentation: 'skipped',
    core: 'skipped',
    movies: 'skipped',
    application: 'skipped',
    assets: 'skipped',
    integrity: 'success',
  } as const;
  assert.doesNotThrow(() => verifyResults(plan, results, true));
  for (const integrity of ['failure', 'skipped', 'cancelled'] as const)
    assert.throws(() => verifyResults(plan, { ...results, integrity }, true));
  assert.throws(() => verifyResults(plan, results, false));
  const freshResults = {
    ...Object.fromEntries(
      Object.entries(requiredModules(plan)).map(([name, required]) => [
        name,
        required ? 'success' : 'skipped',
      ]),
    ),
    integrity: 'success',
  } as Parameters<typeof verifyResults>[1];
  assert.doesNotThrow(() => verifyResults(plan, freshResults, false));
});

void test('actual reuse CLI falls back on direct pushes and missing evidence without skipping checks', () => {
  const root = mkdtempSync(join(tmpdir(), 'reuse-fallback-'));
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  try {
    git('init', '--quiet');
    git('config', 'user.name', 'fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    writeFileSync(join(root, 'source'), 'first');
    git('add', '.');
    git('commit', '--quiet', '-m', 'baseline');
    const before = git('rev-parse', 'HEAD');
    writeFileSync(join(root, 'source'), 'second');
    git('add', '.');
    git('commit', '--quiet', '-m', 'direct push');
    const plan = selectPlan([], catalogue, new Map(), { head: git('rev-parse', 'HEAD') });
    const event = join(root, 'event.json'),
      output = join(root, 'output');
    writeFileSync(event, JSON.stringify({ before }));
    const result = spawnSync(process.execPath, [join(import.meta.dirname, 'reuse.ts'), 'check'], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_EVENT_NAME: 'push',
        GITHUB_EVENT_PATH: event,
        GITHUB_OUTPUT: output,
        CI_PLAN: JSON.stringify(plan),
        GITHUB_TOKEN: '',
      },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(output, 'utf8'), /reused=false/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

void test('hosted environment drift records ineligibility without failing normal validation', () => {
  const directory = mkdtempSync(join(tmpdir(), 'environment-drift-'));
  try {
    for (const environment of [environmentStamp(), JSON.stringify({ image: 'different' })]) {
      const output = join(directory, 'output');
      writeFileSync(output, '');
      const result = spawnSync(process.execPath, [join(import.meta.dirname, 'environment.ts')], {
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_ACTIONS: 'true',
          CI_PLAN: JSON.stringify({ environment }),
          GITHUB_OUTPUT: output,
          RUNNER_TEMP: directory,
        },
      });
      assert.equal(result.status, 0, result.stderr);
      const matching = environment === environmentStamp();
      assert.match(readFileSync(output, 'utf8'), new RegExp(`matching=${matching}`));
      if (!matching)
        assert.ok(
          readFileSync(join(directory, 'environment-mismatch.json'), 'utf8').includes('different'),
        );
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

void test('PR planning uses the tested merge base and stops stale snapshots before install', () => {
  const directory = mkdtempSync(join(tmpdir(), 'current-base-'));
  const git = (...args: string[]) =>
    execFileSync('git', args, {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  try {
    git('init', '--quiet');
    git('config', 'user.name', 'fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    git('checkout', '-b', 'main');
    writeFileSync(join(directory, 'base'), 'one');
    git('add', '.');
    git('commit', '--quiet', '-m', 'baseline');
    const stale = git('rev-parse', 'HEAD');
    git('checkout', '-b', 'feature');
    writeFileSync(join(directory, 'feature'), 'new');
    git('add', '.');
    git('commit', '--quiet', '-m', 'feature');
    const pullHead = git('rev-parse', 'HEAD');
    git('checkout', 'main');
    writeFileSync(join(directory, 'base'), 'two');
    git('add', '.');
    git('commit', '--quiet', '-m', 'new base');
    const current = git('rev-parse', 'HEAD');
    git('update-ref', 'refs/remotes/origin/main', current);
    git('merge', '--no-ff', 'feature', '-m', 'tested merge');
    const event = join(directory, 'event.json'),
      output = join(directory, 'output');
    writeFileSync(
      event,
      JSON.stringify({ pull_request: { head: { sha: pullHead }, base: { sha: stale } } }),
    );
    const run = () =>
      spawnSync(process.execPath, [join(import.meta.dirname, 'base.ts')], {
        cwd: directory,
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_EVENT_NAME: 'pull_request',
          GITHUB_BASE_REF: 'main',
          GITHUB_EVENT_PATH: event,
          GITHUB_OUTPUT: output,
          CI_FULL: '0',
        },
      });
    let result = run();
    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(output, 'utf8'), new RegExp(`base=${current}\\ncold=false`));
    git('update-ref', 'refs/remotes/origin/main', git('rev-parse', 'HEAD'));
    result = run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /PR merge base is stale/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

void test('main scheduling confirms the integrity environment before skipping selected jobs', () => {
  const workflow = readFileSync(
    new URL('../../../.github/workflows/maintenance.yml', import.meta.url),
    'utf8',
  );
  for (const name of ['core', 'application', 'assets', 'movies']) {
    const block = workflow.split(`  ${name}:\n`)[1].split(/\n  [a-z]+:\n/)[0];
    assert.match(block, /needs: \[plan, integrity\]/);
    assert.match(block, /!cancelled\(\) && needs\.plan\.result == 'success'/);
    assert.match(
      block,
      /needs\.plan\.outputs\.reused != 'true' \|\| needs\.integrity\.outputs\.reused != 'true'/,
    );
  }
  assert.match(workflow, /CI_REUSED: \$\{\{ needs\.integrity\.outputs\.reused \"?\}\}/);
  assert.match(workflow, /reused: \$\{\{ steps\.environment\.outputs\.matching \"?\}\}/);
});
