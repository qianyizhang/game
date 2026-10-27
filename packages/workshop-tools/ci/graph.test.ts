import { strict as assert } from 'node:assert';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { catalogueFrom, dependencyGraph } from './graph.ts';
import { reverseClosure, selectPlan } from './selection.ts';

void test('literal import, re-export and declared dynamic imports retain transitive dependants without executing modules', () => {
  const root = mkdtempSync(join(tmpdir(), 'ci-graph-'));
  const files = {
    'tsconfig.json': '{"compilerOptions":{"moduleResolution":"Bundler"}}',
    'src/games/spire/content.ts': 'throw new Error("must not execute"); export const card=1;',
    'src/games/spire/adapter.ts': 'export {card} from "./content";',
    'src/games/spire/game.test.ts': 'import {card} from "./adapter";',
    'tests/browser/spire.spec.ts': 'const entry="../../src/games/spire/content.ts"; import(entry);',
  };
  try {
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), content);
    }
    const graph = dependencyGraph(root, Object.keys(files));
    assert.deepEqual(graph.uncertain, []);
    const reached = reverseClosure(['src/games/spire/content.ts'], graph.dependants);
    assert.ok(reached.has('src/games/spire/game.test.ts'));
    assert.ok(reached.has('tests/browser/spire.spec.ts'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

void test('unresolved application imports are reported instead of silently narrowing coverage', () => {
  const root = mkdtempSync(join(tmpdir(), 'ci-graph-'));
  const file = 'src/games/spire/game.ts';
  try {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(
      join(root, file),
      'import "./missing"; let path="./first"; path=globalThis.location.href; import(path);',
    );
    const graph = dependencyGraph(root, [file]);
    assert.equal(graph.uncertain.length, 2);
    assert.deepEqual(graph.dynamic, [file]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

void test('catalogue retains default application, all geometry and public browser files', () => {
  assert.deepEqual(
    catalogueFrom([
      'src/shared/replay.test.ts',
      'packages/diablo2/src/agent/policy-rollout.test.ts',
      'src/art3d/recording.test.ts',
      'tests/browser/art3d.spec.ts',
      'tests/browser/art3d-review.spec.ts',
      'tests/browser/trace-private.spec.ts',
    ]),
    {
      application: [
        'src/shared/replay.test.ts',
        'packages/diablo2/src/agent/policy-rollout.test.ts',
      ],
      geometry: ['src/art3d/recording.test.ts'],
      browser: ['tests/browser/art3d.spec.ts'],
    },
  );
});

void test('an unresolved Emberwake package loader forces full selection', () => {
  const root = mkdtempSync(join(tmpdir(), 'ci-package-loader-'));
  const file = 'packages/diablo2/src/loader.ts';
  try {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), 'const path=globalThis.location.href; import(path);');
    const graph = dependencyGraph(root, [file]);
    const plan = selectPlan(
      [{ path: file, status: 'M' }],
      catalogueFrom([file]),
      graph.dependants,
      { head: 'a'.repeat(40), uncertain: graph.uncertain },
    );
    assert.deepEqual(graph.dynamic, [file]);
    assert.deepEqual(graph.uncertain, [`${file}: nonliteral import`]);
    assert.equal(plan.mode, 'full');
    assert.equal(plan.geometry, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
