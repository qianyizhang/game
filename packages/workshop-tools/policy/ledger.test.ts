import { strict as assert } from 'node:assert';
import { execFileSync, fork } from 'node:child_process';
import { once } from 'node:events';
import { appendFile, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { createCaseLedger, readCaseLedger } from './ledger.ts';
import { benchmark, type CaseJob, type StudyRow } from './study.ts';
import type { Runtime } from './runtime.ts';

const job = (seed: string): CaseJob => ({
  seed,
  policy: 'test',
  setupId: 'standard',
  difficulty: 'standard',
  stratum: 'test',
  setup: {},
  directory: '',
  maxDecisions: 1,
  provenance: {},
});
const row = (seed: string): StudyRow => ({
  seed,
  policy: 'test',
  setupId: 'standard',
  difficulty: 'standard',
  stratum: 'test',
  status: 'timeout',
  metrics: { won: 0, progress: 1 },
  work: 1,
  digest: 'a'.repeat(64),
  audit: {
    integrity: 'passed',
    replay: 'passed',
    inputs: 'passed',
    decisions: 'passed',
    firstMismatch: null,
    message: '',
  },
});

void test('ledger refuses duplicates, mismatched identities and reused output; crash tails never become cases', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'policy-ledger-'));
  try {
    const ledger = createCaseLedger(directory, [job('A'), job('B')]);
    ledger.record(row('B'), 1);
    assert.throws(() => ledger.record(row('B'), 1), /Duplicate/);
    assert.throws(() => ledger.record(row('B'), 0), /assigned/);
    assert.throws(() => createCaseLedger(directory, [job('A')]), /EEXIST/);
    ledger.close();
    const saved = await readFile(resolve(directory, 'cases.jsonl'), 'utf8');
    await appendFile(
      resolve(directory, 'cases.jsonl'),
      JSON.stringify({ index: 1, row: row('B') }) + '\n',
    );
    assert.throws(() => readCaseLedger(directory), /duplicate ledger case/);
    await writeFile(resolve(directory, 'cases.jsonl'), saved);
    await appendFile(resolve(directory, 'cases.jsonl'), '{"index":0,"row":');
    const recovered = readCaseLedger(directory);
    assert.equal(recovered.status, 'interrupted');
    assert.equal(recovered.expectedCases, 2);
    assert.equal(recovered.completedCases, 1);
    assert.equal(recovered.ignoredTail, true);
    assert.deepEqual(recovered.rows, [row('B')]);
    // A newline-terminated malformed entry is corruption, not a disposable tail.
    await appendFile(resolve(directory, 'cases.jsonl'), '\n');
    assert.throws(() => readCaseLedger(directory), SyntaxError);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

/** Synthetic evaluator: controls failure timing without executing policies/reserved games. */
async function fixture(directory: string) {
  const module = resolve(directory, 'runtime.mjs');
  await writeFile(
    module,
    `
    import { readFileSync } from 'node:fs';
    import { setTimeout as delay } from 'node:timers/promises';
    export const adapter = { game: 'test', identity: {} };
    export const study = { setups: [{ id: 'standard', difficulty: 'standard', stratum: 'test', setup: {} }],
      defaultSetup: {}, ranking: 'test', reviewPath: '/test' };
    export const builtins = { test: { id: 'test', version: 'test', create() {} } };
    const ledger = ${JSON.stringify(resolve(directory, 'cases.jsonl'))};
    export async function recordEpisode(_adapter, _factory, { seed }) {
      if (seed === 'BLOCK') { process.send?.('blocked'); await new Promise(() => { setInterval(() => {}, 1000); }); }
      if (seed === 'SLOW' || seed === 'FAIL') {
        const required = seed === 'SLOW' ? 2 : 3;
        while (readFileSync(ledger, 'utf8').trimEnd().split('\\n').length < required) await delay(2);
      }
      if (seed === 'FAIL') throw new Error('injected later failure');
      return { digest: 'a'.repeat(64), episode: { status: seed === 'ERROR' ? 'error' : 'timeout',
        metrics: { won: 0, progress: 1 }, work: 1 } };
    }
    export async function auditRollout() { return ${JSON.stringify(row('unused').audit)}; }
  `,
  );
  const moduleURL = pathToFileURL(module).href;
  const runtime = { ...(await import(moduleURL)), moduleURL } as Runtime;
  return runtime;
}

void test(
  'serial and parallel later failures retain completed summaries in grid order without rollout files',
  { timeout: 15000 },
  async () => {
    for (const workers of [1, 2]) {
      const directory = await mkdtemp(resolve(tmpdir(), 'policy-ledger-failure-'));
      try {
        const runtime = await fixture(directory);
        const seeds = workers === 1 ? ['FAST', 'ERROR', 'FAIL'] : ['SLOW', 'FAST', 'FAIL'];
        await assert.rejects(
          benchmark(runtime, {
            split: 'development',
            directory,
            maxDecisions: 1,
            provenance: {},
            seeds,
            workers,
          }),
          /injected later failure/,
        );
        const recovered = readCaseLedger(directory);
        assert.equal(recovered.status, 'interrupted');
        assert.equal(recovered.completedCases, 2);
        assert.equal(recovered.expectedCases, 3);
        assert.deepEqual(
          recovered.rows.map((r) => r.seed),
          seeds.slice(0, 2),
        );
        if (workers === 1) assert.equal(recovered.rows[1].status, 'error');
        else {
          const entries = (await readFile(resolve(directory, 'cases.jsonl'), 'utf8'))
            .trimEnd()
            .split('\n');
          assert.equal((JSON.parse(entries[1]) as { row: StudyRow }).row.seed, 'FAST');
        }
        assert.deepEqual((await readdir(directory)).sort(), ['cases.jsonl', 'runtime.mjs']);
        assert.ok(!Object.hasOwn(recovered, 'summary'));
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    }
  },
);

void test(
  'SIGKILL preserves an acknowledged case and recover needs neither runtime compilation nor a final report',
  { timeout: 15000 },
  async () => {
    const directory = await mkdtemp(resolve(tmpdir(), 'policy-ledger-kill-'));
    let child: ReturnType<typeof fork> | undefined;
    try {
      const runtime = await fixture(directory);
      const driver = resolve(directory, 'driver.mjs');
      await writeFile(
        driver,
        `
      import { benchmark } from ${JSON.stringify(new URL('./study.ts', import.meta.url).href)};
      const runtime = { ...(await import(${JSON.stringify(runtime.moduleURL)})), moduleURL: ${JSON.stringify(runtime.moduleURL)} };
      await benchmark(runtime, { split: 'development', directory: ${JSON.stringify(directory)},
        maxDecisions: 1, provenance: {}, seeds: ['FAST', 'BLOCK'], workers: 1 });
    `,
      );
      child = fork(driver, [], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
      const exit = once(child, 'exit');
      const [message] = (await once(child, 'message')) as unknown[];
      assert.equal(message, 'blocked');
      child.kill('SIGKILL');
      const [, signal] = (await exit) as unknown[];
      assert.equal(signal, 'SIGKILL');
      const output = resolve(directory, 'recovery.json');
      execFileSync(
        process.execPath,
        [
          new URL('./cli.ts', import.meta.url).pathname,
          'recover',
          '--input',
          directory,
          '--out',
          output,
        ],
        { stdio: 'pipe' },
      );
      const recovered = JSON.parse(await readFile(output, 'utf8')) as ReturnType<
        typeof readCaseLedger
      >;
      assert.equal(recovered.status, 'interrupted');
      assert.equal(recovered.expectedCases, 2);
      assert.deepEqual(recovered.rows, [row('FAST')]);
      assert.ok(!(await readdir(directory)).includes('report.json'));
      assert.throws(
        () =>
          execFileSync(
            process.execPath,
            [
              new URL('./cli.ts', import.meta.url).pathname,
              'recover',
              '--input',
              directory,
              '--out',
              output,
            ],
            { stdio: 'pipe' },
          ),
        /EEXIST/,
      );
    } finally {
      if (child && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      await rm(directory, { recursive: true, force: true });
    }
  },
);

void test('full row population alone is interrupted; only a matching final report receipt establishes completion', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'policy-ledger-complete-'));
  try {
    const { completeCaseLedger } = await import('./ledger.ts');
    const ledger = createCaseLedger(directory, [job('A'), job('B')]);
    ledger.record(row('B'), 1);
    assert.throws(() => completeCaseLedger(directory), /unfinished/);
    ledger.record(row('A'), 0);
    ledger.close();
    assert.equal(readCaseLedger(directory).status, 'interrupted');
    const report = resolve(directory, 'report.json');
    await writeFile(report, JSON.stringify({ rows: [row('A'), row('B')] }));
    completeCaseLedger(directory);
    assert.equal(readCaseLedger(directory).status, 'complete');
    assert.deepEqual(readCaseLedger(directory).rows, [row('A'), row('B')]);
    assert.throws(() => completeCaseLedger(directory), /already completed/);
    await appendFile(report, '\n');
    assert.throws(() => readCaseLedger(directory), /does not match/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
