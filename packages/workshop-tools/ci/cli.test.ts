import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import type { Plan } from './selection.ts';

void test('actual CLI keeps mixed review changes scoped and rejects docs-only, executable and symlink shortcuts', () => {
  for (const kind of ['mixed', 'docs-only', 'executable', 'symlink'] as const) {
    const root = mkdtempSync(join(tmpdir(), 'ci-plan-cli-'));
    const git = (...args: string[]) =>
      execFileSync('git', args, {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
    const put = (path: string, content: string) => {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), content);
    };
    try {
      git('init', '--quiet');
      git('config', 'user.name', 'CI planner fixture');
      git('config', 'user.email', 'ci-fixture@example.invalid');
      for (const name of ['cli', 'selection', 'graph', 'commands']) {
        const path = `packages/workshop-tools/ci/${name}.ts`;
        put(path, '');
        copyFileSync(new URL(`./${name}.ts`, import.meta.url), join(root, path));
      }
      put('package.json', '{"type":"module"}');
      put('tsconfig.json', '{"compilerOptions":{"moduleResolution":"Bundler"}}');
      put('src/shared/replay.test.ts', 'export {};');
      put('src/games/spire/ui/Card.tsx', 'export const card = 1;');
      for (const name of ['spire', 'blindside-policy', 'issue37-context', 'asset-gallery'])
        put(`tests/browser/${name}.spec.ts`, 'export {};');
      symlinkSync(
        resolve(import.meta.dirname, '../../../node_modules'),
        join(root, 'node_modules'),
        'dir',
      );
      git('add', '.');
      git('commit', '--quiet', '-m', 'fixture baseline');
      const base = git('rev-parse', 'HEAD');
      const report = 'docs/art/assets/spire-damage-potions/README.md';
      // Fenced examples are allowed as mixed report attachments, never as a docs-only fast path.
      put(report, '# Review\n\n```sh\nnpm test\n```\n');
      if (kind !== 'docs-only') put('src/games/spire/ui/Card.tsx', 'export const card = 2;');
      if (kind === 'executable') chmodSync(join(root, report), 0o755);
      if (kind === 'symlink') {
        rmSync(join(root, report));
        symlinkSync('../../../../src/games/spire/ui/Card.tsx', join(root, report));
      }
      git('add', '.');
      git('commit', '--quiet', '-m', kind);
      const output = execFileSync(
        process.execPath,
        ['packages/workshop-tools/ci/cli.ts', 'plan', 'plan.json'],
        {
          cwd: root,
          encoding: 'utf8',
          env: { ...process.env, CI_BASE: base, CI_FULL: '0', GITHUB_OUTPUT: '' },
        },
      );
      const plan = JSON.parse(readFileSync(join(root, 'plan.json'), 'utf8')) as Plan;
      assert.equal(plan.head, git('rev-parse', 'HEAD'));
      assert.ok(output.includes(plan.mode));
      assert.equal(plan.mode, kind === 'mixed' ? 'scoped' : 'application', kind);
      assert.deepEqual(plan.coreFiles, ['src/shared/replay.test.ts']);
      assert.ok(plan.browserFiles.includes('tests/browser/spire.spec.ts'));
      assert.ok(plan.browserFiles.includes('tests/browser/asset-gallery.spec.ts'));
      assert.equal(
        plan.browserFiles.includes('tests/browser/blindside-policy.spec.ts'),
        kind !== 'mixed',
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});
