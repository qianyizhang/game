import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bakeDependencies, bakePackageNames, type NpmLock } from './bake-dependencies.ts';
const lock: NpmLock = {
  lockfileVersion: 3,
  packages: {
    'node_modules/three': { version: '1', integrity: 'sha512-exporter' },
    'node_modules/vite': {
      version: '2',
      dependencies: { compiler: '1' },
      optionalDependencies: { platform: '1' },
    },
    'node_modules/compiler': { version: '1' },
    'node_modules/platform': { version: '1' },
    'node_modules/eslint': { version: '1' },
  },
};
void test('bake fingerprint ignores lint-only updates and npm placement flags, retaining exporter/compiler/platform changes', () => {
  const expected = bakeDependencies(lock, ['three', 'vite']);
  const unrelated = structuredClone(lock);
  unrelated.packages['node_modules/eslint'].version = '2';
  assert.deepEqual(bakeDependencies(unrelated, ['three', 'vite']), expected);
  for (const name of ['three', 'vite', 'compiler', 'platform']) {
    const changed = structuredClone(lock);
    changed.packages[`node_modules/${name}`].version = '3';
    assert.notDeepEqual(bakeDependencies(changed, ['three', 'vite']), expected, name);
  }
});
void test('bake closure follows nested versions and peers; missing required packages cannot bless stale assets', () => {
  const changed = structuredClone(lock);
  changed.packages['node_modules/vite/node_modules/compiler'] = {
    version: 'nested',
    peerDependencies: { three: '1' },
  };
  const actual = bakeDependencies(changed, ['vite']);
  assert.ok(actual['node_modules/vite/node_modules/compiler']);
  assert.ok(actual['node_modules/three']);
  assert.ok(!actual['node_modules/compiler']);
  delete changed.packages['node_modules/three'];
  assert.throws(() => bakeDependencies(changed, ['vite']), /Missing bake dependency/);
});

void test('source closure discovers new runtime dependencies while type-only test configuration stays outside the bake', () => {
  assert.deepEqual(
    bakePackageNames([
      `import {x} from 'new-exporter/subpath'; import type {} from 'vitest/config'; export {plugin} from '@scope/plugin'; import './local.ts'; import('future-runtime'); import {readFile} from 'node:fs';`,
    ]),
    ['@scope/plugin', 'future-runtime', 'new-exporter', 'typescript'],
  );
});
