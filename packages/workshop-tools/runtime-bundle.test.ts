import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { relative, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withBundle } from './io.ts';
import { buildRuntime, repositoryRoot, runtimePins } from './runtime-bundle.ts';

const digest = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');

await test('runtime pins cover bundled sources, exclude external modules and preserve caller files', async (t) => {
  const root = await realpath(await mkdtemp(resolve(tmpdir(), 'runtime-pins-test-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const entry = resolve(root, 'entry.ts');
  const dependency = resolve(root, 'value.ts');
  const directory = resolve(root, 'output');
  const entrySource = `import { value } from './value.ts?fixture';
import { basename } from 'node:path';
export const result = basename('/fixture/' + value);`;
  const dependencySource = 'export const value: string = "answer";';
  await mkdir(directory);
  await writeFile(resolve(directory, 'keep.txt'), 'caller-owned');
  await writeFile(entry, entrySource);
  await writeFile(dependency, dependencySource);
  await writeFile(resolve(root, 'unrelated.ts'), 'export const unused = true;');
  const bundle = await buildRuntime({ entry, directory, fileName: 'fixture.mjs' });
  const runtime = (await import(bundle.moduleURL)) as { result: string };
  assert.equal(runtime.result, 'answer');
  const pins = await runtimePins(bundle);
  assert.deepEqual(pins.sourceDigests, {
    [relative(repositoryRoot, entry)]: digest(entrySource),
    [relative(repositoryRoot, dependency)]: digest(dependencySource),
  });
  assert.equal(pins.bundleDigest, digest(await readFile(bundle.path)));
  assert.equal(await readFile(resolve(directory, 'keep.txt'), 'utf8'), 'caller-owned');

  // Pins describe files when hashed, not an atomic snapshot captured by the build.
  await writeFile(dependency, dependencySource + '\n// changed after build');
  const laterPins = await runtimePins(bundle);
  assert.notEqual(
    laterPins.sourceDigests[relative(repositoryRoot, dependency)],
    pins.sourceDigests[relative(repositoryRoot, dependency)],
  );
  assert.equal(laterPins.bundleDigest, pins.bundleDigest);
  await rm(dependency);
  await assert.rejects(runtimePins(bundle), /ENOENT/);
});

await test('ordinary bundles preserve plugins and clean their own output on callback or build failure', async (t) => {
  const root = await realpath(await mkdtemp(resolve(tmpdir(), 'runtime-lifetime-test-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const entry = resolve(root, 'entry.ts');
  await writeFile(entry, 'export const location = import.meta.url; export const value = "before";');
  let output = '';
  await assert.rejects(
    withBundle<{ location: string; value: string }, void>(
      entry,
      async (runtime) => {
        output = fileURLToPath(runtime.location);
        assert.equal(runtime.value, 'after');
        assert.ok((await readFile(output)).length > 0);
        throw new Error('callback failed');
      },
      [
        {
          name: 'fixture-transform',
          transform(code, id) {
            if (id === entry) return code.replace('"before"', '"after"');
          },
        },
      ],
    ),
    /callback failed/,
  );
  await assert.rejects(readFile(output), /ENOENT/);
  assert.ok((await readFile(entry)).length > 0);

  let failedDirectory = '';
  await assert.rejects(
    withBundle(resolve(root, 'missing.ts'), () => assert.fail('missing entry imported'), [
      {
        name: 'capture-owned-directory',
        configResolved(config) {
          failedDirectory = config.build.outDir;
        },
      },
    ]),
  );
  assert.ok(failedDirectory);
  await assert.rejects(stat(failedDirectory), /ENOENT/);
});

await test('Night Passage retains an importable digest-named bundle and pins shared tooling', async (t) => {
  const { withRuntime } = await import('./night-passage/runtime.ts');
  const directory = await mkdtemp(resolve(tmpdir(), 'runtime-retention-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let retainedPath = '';
  await withRuntime(async (_runtime, pins) => {
    retainedPath = resolve(directory, `${pins.bundleDigest}.mjs`);
    assert.equal(digest(await readFile(retainedPath)), pins.bundleDigest);
    const sharedPath = 'packages/workshop-tools/runtime-bundle.ts';
    assert.equal(
      pins.toolDigests[sharedPath],
      digest(await readFile(resolve(repositoryRoot, sharedPath))),
    );
  }, directory);
  const retained = (await import(
    pathToFileURL(retainedPath).href
  )) as typeof import('./night-passage/entry.ts');
  const agent = retained.createAgent('retained-runtime');
  agent.step({ type: 'start', weapon: 'bow', runes: [] });
  assert.equal(agent.observe().phase, 'combat');
  assert.equal((JSON.parse(agent.exportReplay()) as { seed: string }).seed, 'retained-runtime');
});
