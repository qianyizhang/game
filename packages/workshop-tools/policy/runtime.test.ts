import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { withRuntime } from './runtime.ts';
import { repositoryRoot } from '../runtime-bundle.ts';

void test('unchanged selected runtime sources stay reproducible after temporary entry cleanup', async () => {
  const capture = () =>
    withRuntime({ game: 'blindside' }, (_runtime, pins) => Promise.resolve(pins));
  const first = await capture();
  const second = await capture();
  assert.deepEqual(first.sourceDigests, second.sourceDigests);
  assert.equal(first.bundleDigest, second.bundleDigest);
  assert.ok(Object.keys(first.sourceDigests).some((p) => p.endsWith('/agent/observation.ts')));
  for (const path of Object.keys(first.sourceDigests)) {
    assert.ok(!path.startsWith('..'), `Unexpected ephemeral/outside source: ${path}`);
    await readFile(resolve(repositoryRoot, path));
  }
});
