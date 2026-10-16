import { strict as assert } from 'node:assert';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { withRuntime } from './runtime.ts';

void test('development and evaluation can reuse an identical immutable bundle but cannot replace corrupt bytes', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'night-passage-retention-'));
  try {
    const capture = () => withRuntime((_runtime, pins) => Promise.resolve(pins), directory);
    const first = await capture();
    assert.ok(first.toolDigests['packages/workshop-tools/policy/cli.ts']);
    const path = resolve(directory, `${first.bundleDigest}.mjs`);
    const bytes = await readFile(path);
    assert.equal((await capture()).bundleDigest, first.bundleDigest);
    assert.ok((await readFile(path)).equals(bytes));
    await writeFile(path, 'deliberately damaged retained bundle');
    await assert.rejects(capture(), /differs from its content-addressed source/);
    assert.equal(await readFile(path, 'utf8'), 'deliberately damaged retained bundle');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
