import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';
import { findBlender, runBlender } from './blender.ts';
import { main } from './cli.ts';

/** Controlled process outcomes avoid launching Blender in the ordinary sandboxed gate.
 * @param {Partial<import('node:child_process').SpawnSyncReturns<string>>} overrides
 */
function outcome(overrides = {}) {
  return { pid: 1, output: [], stdout: '', stderr: '', status: 0, signal: null, ...overrides };
}
/** @param {import('node:test').TestContext} t */
function processStub(t) {
  const prior = process.env.BLENDER_BIN;
  delete process.env.BLENDER_BIN;
  const stub = t.mock.method(childProcess, 'spawnSync', () => outcome());
  syncBuiltinESMExports();
  t.after(() => {
    stub.mock.restore();
    syncBuiltinESMExports();
    if (prior === undefined) delete process.env.BLENDER_BIN;
    else process.env.BLENDER_BIN = prior;
  });
  return stub;
}

await test('an explicit Blender override is authoritative, including missing and empty values', (t) => {
  const spawn = processStub(t);
  process.env.BLENDER_BIN = '/chosen Blender';
  assert.equal(findBlender('/package'), '/chosen Blender');
  assert.deepEqual(spawn.mock.calls[0].arguments, [
    '/chosen Blender',
    ['--version'],
    { encoding: 'utf8' },
  ]);
  spawn.mock.mockImplementation(() =>
    outcome({ status: null, error: Object.assign(new Error('missing'), { code: 'ENOENT' }) }),
  );
  assert.throws(() => findBlender('/package'), /BLENDER_BIN startup failed.*chosen Blender/);
  assert.equal(spawn.mock.callCount(), 2, 'no fallback after a missing explicit override');
  process.env.BLENDER_BIN = '';
  assert.throws(() => findBlender('/package'), /BLENDER_BIN must name/);
  assert.equal(spawn.mock.callCount(), 2, 'an empty override never launches a process');
});

await test('automatic discovery skips only missing candidates and stops after startup failure', (t) => {
  const spawn = processStub(t);
  spawn.mock.mockImplementationOnce(() =>
    outcome({ status: null, error: Object.assign(new Error('missing'), { code: 'ENOENT' }) }),
  );
  assert.equal(
    findBlender('/package'),
    join('/package', '.runtime/Blender.app/Contents/MacOS/Blender'),
  );
  assert.deepEqual(
    spawn.mock.calls.map((call) => call.arguments[0]),
    [
      '/Applications/Blender.app/Contents/MacOS/Blender',
      join('/package', '.runtime/Blender.app/Contents/MacOS/Blender'),
    ],
  );
  spawn.mock.resetCalls();
  spawn.mock.mockImplementation(() =>
    outcome({ status: null, signal: 'SIGABRT', stderr: 'WindowServer denied startup' }),
  );
  assert.throws(() => findBlender('/package'), /WindowServer denied startup/);
  assert.equal(spawn.mock.callCount(), 1, 'registration failures must not trigger more launches');
  spawn.mock.resetCalls();
  spawn.mock.mockImplementation(() =>
    outcome({ status: null, error: Object.assign(new Error('missing'), { code: 'ENOENT' }) }),
  );
  assert.throws(() => findBlender('/package'), /Blender is missing/);
  assert.equal(spawn.mock.calls.at(-1)?.arguments[0], 'blender');
});

await test('native invocation preserves saved-source ordering and script arguments, and reports failures', (t) => {
  const spawn = processStub(t);
  runBlender(
    '/chosen Blender',
    '/scripts/export.py',
    ['/package root', '--output', '/fresh candidate'],
    { source: '/artist/source.blend', cwd: '/workspace' },
  );
  assert.deepEqual(spawn.mock.calls[0].arguments, [
    '/chosen Blender',
    [
      '--background',
      '--factory-startup',
      '/artist/source.blend',
      '--python-exit-code',
      '1',
      '--python',
      '/scripts/export.py',
      '--',
      '/package root',
      '--output',
      '/fresh candidate',
    ],
    { stdio: 'inherit', cwd: '/workspace' },
  ]);
  spawn.mock.mockImplementation(() => outcome({ status: null, signal: 'SIGTERM' }));
  assert.throws(
    () => runBlender('/binary', '/scripts/verify.py', []),
    /verify.py failed \(SIGTERM\)/,
  );
  spawn.mock.mockImplementation(() =>
    outcome({ status: null, error: new Error('permission denied') }),
  );
  assert.throws(
    () => runBlender('/binary', '/scripts/verify.py', []),
    /verify.py failed: Error: permission denied/,
  );
});

await test('active CLI validates native overrides while offline commands retain their own contracts', (t) => {
  const spawn = processStub(t);
  t.mock.method(console, 'log', () => {});
  process.env.BLENDER_BIN = '/missing explicit Blender';
  spawn.mock.mockImplementation(() =>
    outcome({ status: null, error: Object.assign(new Error('missing'), { code: 'ENOENT' }) }),
  );
  main('list', false, []);
  main('verify', false, []);
  main('help', false, []);
  assert.throws(() => main('promote', false, []), /promote requires --candidate/);
  assert.equal(spawn.mock.callCount(), 0);
  assert.throws(() => main('doctor', false, []), /BLENDER_BIN startup failed/);
  assert.equal(spawn.mock.callCount(), 1, 'the coordinator cannot silently fall back');
});
