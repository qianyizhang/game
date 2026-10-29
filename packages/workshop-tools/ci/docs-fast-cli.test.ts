import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { requiredModules } from './commands.ts';
import type { Plan } from './selection.ts';

const repository = resolve(import.meta.dirname, '../../..');
const named = [
  'AGENTS.md',
  'docs/engineering/checks.md',
  'skills/card-art/assets/native-handoff.md.template',
];
const handoff = named[2];
const checks = '# Checks\n\nOriginal prose.\n\n```sh\nnpm test\nplain example line\n```\n';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'docs-fast-cli-'));
  const path = (file: string) => join(root, file);
  const put = (file: string, content: string) => {
    mkdirSync(dirname(path(file)), { recursive: true });
    writeFileSync(path(file), content);
  };
  const git = (...args: string[]) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  git('init', '--quiet');
  git('config', 'user.name', 'Documentation fixture');
  git('config', 'user.email', 'docs-fixture@example.invalid');
  for (const file of [
    ...['docs-fast', 'selection', 'commands', 'gate', 'cli', 'graph'].map(
      (name) => `packages/workshop-tools/ci/${name}.ts`,
    ),
    'packages/workshop-tools/governance.mjs',
    'packages/workshop-tools/art/native-packet.ts',
    'packages/workshop-tools/art/native-packet.test.ts',
    ...['native-brief.md.template', 'native-handoff.md.template', 'motion-study.ts.template'].map(
      (name) => `skills/card-art/assets/${name}`,
    ),
  ]) {
    put(file, '');
    copyFileSync(resolve(repository, file), path(file));
  }
  put('AGENTS.md', '# Instructions\n\nOriginal prose.\n');
  put('docs/engineering/checks.md', checks);
  put('docs/guide/review.md', '# Review\n\nOriginal prose.\n');
  put('.node-version', process.versions.node);
  put('.gitignore', 'node_modules\noutputs\nnormal.json\n');
  put('package.json', '{"type":"module"}');
  put('tsconfig.json', '{"compilerOptions":{"moduleResolution":"Bundler"}}');
  for (const file of [
    'src/shared/replay.test.ts',
    'src/games/spire/rules.test.ts',
    'src/games/spire/ui/Card.tsx',
    'tests/browser/spire.spec.ts',
    'tests/browser/blindside-policy.spec.ts',
  ])
    put(file, 'export {};\n');
  symlinkSync(resolve(repository, 'node_modules'), path('node_modules'), 'dir');
  const commit = () => {
    git('add', '.');
    git('commit', '--quiet', '--allow-empty', '-m', 'fixture');
    return git('rev-parse', 'HEAD');
  };
  // Model a separate CI command, not a recursive Node test-runner child.
  const environment = { ...process.env };
  delete environment.NODE_TEST_CONTEXT;
  const run = (script: string, args: string[], env: Record<string, string | undefined> = {}) =>
    spawnSync(process.execPath, [`packages/workshop-tools/ci/${script}.ts`, ...args], {
      cwd: root,
      encoding: 'utf8',
      env: { ...environment, CI_FULL: '0', GITHUB_OUTPUT: path('outputs'), ...env },
    });
  return { root, path, put, git, commit, run };
}

void test('actual docs CLI checks named prose, retained examples and the Markdown consumer; aggregate remains exact-head', () => {
  const f = fixture();
  try {
    const base = f.commit();
    for (const file of named)
      writeFileSync(
        f.path(file),
        readFileSync(f.path(file), 'utf8') + '\nA prose clarification.\n',
      );
    const head = f.commit();
    rmSync(f.path('node_modules')); // The fast job must work without installed dependencies.
    const planResult = f.run('docs-fast', ['plan'], { CI_BASE: base });
    assert.equal(planResult.status, 0, planResult.stderr);
    const plan = JSON.parse(planResult.stdout) as Plan;
    assert.equal(plan.head, head);
    assert.equal(plan.mode, 'documentation');
    assert.deepEqual(requiredModules(plan), {
      plan: true,
      documentation: true,
      core: false,
      application: false,
      assets: false,
    });
    const check = f.run('docs-fast', ['check'], { CI_BASE: base });
    assert.equal(check.status, 0, check.stderr);
    assert.match(check.stdout, /native packet renders the actual Markdown handoff/);
    assert.match(check.stdout, /local links passed/);
    const results = {
      plan: 'success',
      documentation: 'success',
      core: 'skipped',
      application: 'skipped',
      assets: 'skipped',
    };
    const gate = (value: Record<string, string>) =>
      f.run('gate', [], { CI_PLAN: JSON.stringify(plan), CI_RESULTS: JSON.stringify(value) });
    assert.equal(gate(results).status, 0);
    for (const result of ['skipped', 'failure', 'cancelled']) {
      const rejected = gate({ ...results, documentation: result });
      assert.equal(rejected.status, 1);
      assert.match(rejected.stderr, /Required documentation checks/);
    }
    assert.equal(gate({ ...results, assets: 'failure' }).status, 1);
    f.commit();
    const stale = gate(results);
    assert.equal(stale.status, 1);
    assert.match(stale.stderr, /Invalid or stale CI plan/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

void test('named handoff broken links and lost identity fail the selected documentation job', () => {
  for (const defect of ['link', 'identity'] as const) {
    const f = fixture();
    try {
      const base = f.commit();
      const source = readFileSync(f.path(handoff), 'utf8');
      f.put(
        handoff,
        defect === 'link'
          ? source + '\n[missing](missing.md)\n'
          : source.replaceAll('{{id}}', 'no-identity'),
      );
      f.commit();
      assert.equal(f.run('docs-fast', ['plan'], { CI_BASE: base }).status, 0);
      const check = f.run('docs-fast', ['check'], { CI_BASE: base });
      assert.equal(check.status, 1, defect);
      assert.match(
        check.stdout + check.stderr,
        defect === 'link' ? /Broken local link.*native-handoff.md.template/ : /AssertionError/,
      );
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  }
});

void test('file modes, changed examples, mixed code and unnamed inputs keep conservative normal selection', () => {
  const cases: {
    name: string;
    before?: (f: ReturnType<typeof fixture>) => void;
    change: (f: ReturnType<typeof fixture>) => void;
  }[] = [
    ...named.flatMap((file) => [
      {
        name: `${file} executable`,
        change: (f: ReturnType<typeof fixture>) => chmodSync(f.path(file), 0o755),
      },
      {
        name: `${file} previously executable`,
        before: (f: ReturnType<typeof fixture>) => chmodSync(f.path(file), 0o755),
        change: (f: ReturnType<typeof fixture>) => chmodSync(f.path(file), 0o644),
      },
      {
        name: `${file} symlink`,
        change: (f: ReturnType<typeof fixture>) => {
          rmSync(f.path(file));
          symlinkSync(f.path('src/games/spire/ui/Card.tsx'), f.path(file));
        },
      },
      { name: `${file} deleted`, change: (f: ReturnType<typeof fixture>) => rmSync(f.path(file)) },
      {
        name: `${file} renamed`,
        change: (f: ReturnType<typeof fixture>) =>
          renameSync(f.path(file), f.path(`${file}.renamed`)),
      },
      {
        name: `${file} mixed runtime`,
        change: (f: ReturnType<typeof fixture>) => {
          writeFileSync(f.path(file), readFileSync(f.path(file), 'utf8') + '\nClarification.\n');
          f.put('src/games/spire/ui/Card.tsx', 'export const changed = true;\n');
        },
      },
    ]),
    {
      name: 'changed fenced command',
      change: (f) => f.put(named[1], checks.replace('npm test', 'npm run build')),
    },
    {
      name: 'changed plain line within fence',
      change: (f) =>
        f.put(named[1], checks.replace('plain example line', 'different example line')),
    },
    { name: 'removed fence', change: (f) => f.put(named[1], '# Checks\n\nOriginal prose.\n') },
    {
      name: 'inline command',
      change: (f) => f.put(named[0], '# Instructions\n\nRun `npm test`.\n'),
    },
    {
      name: 'template HTML',
      change: (f) => f.put(handoff, '# {{id}} native study handoff\n\n<img src="x">\n'),
    },
    {
      name: 'template script',
      change: (f) => f.put(handoff, '# {{id}} native study handoff\n\n<script>alert(1)</script>\n'),
    },
    ...[
      'skills/card-art/assets/motion-study.ts.template',
      'skills/card-art/assets/native-brief.md.template',
      'nested/AGENTS.md',
      'new/unknown.md',
      '.github/workflows/check.yml',
      'vite.config.ts',
    ].map((file) => ({
      name: file,
      change: (f: ReturnType<typeof fixture>) => f.put(file, 'Changed input.\n'),
    })),
  ];
  for (const entry of cases) {
    const f = fixture();
    try {
      entry.before?.(f);
      const base = f.commit();
      entry.change(f);
      f.commit();
      const classified = f.run('docs-fast', ['classify'], { CI_BASE: base });
      assert.equal(classified.status, 0, `${entry.name}: ${classified.stderr}`);
      assert.match(readFileSync(f.path('outputs'), 'utf8'), /^fast=false$/m, entry.name);
      const normal = f.run('cli', ['plan', 'normal.json'], { CI_BASE: base });
      assert.equal(normal.status, 0, `${entry.name}: ${normal.stderr}`);
      const plan = JSON.parse(readFileSync(f.path('normal.json'), 'utf8')) as Plan;
      assert.equal(plan.mode, 'application', entry.name);
      assert.deepEqual(plan.coreFiles, ['src/shared/replay.test.ts'], entry.name);
      assert.deepEqual(plan.unitFiles, ['src/games/spire/rules.test.ts'], entry.name);
      assert.deepEqual(
        plan.browserFiles,
        ['tests/browser/blindside-policy.spec.ts', 'tests/browser/spire.spec.ts'],
        entry.name,
      );
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  }
});

void test('new named documents, unavailable bases and explicit full selection cannot use the fast route', () => {
  const f = fixture();
  try {
    for (const file of named) rmSync(f.path(file));
    const base = f.commit();
    for (const file of named) f.put(file, '# Newly added document\n');
    f.commit();
    for (const env of [
      { CI_BASE: base },
      { CI_BASE: 'f'.repeat(40) },
      { CI_BASE: '' },
      { CI_BASE: base, CI_FULL: '1' },
    ]) {
      const result = f.run('docs-fast', ['plan'], env);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Invalid documentation fast-path request/);
    }
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});
