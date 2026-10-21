import { strict as assert } from 'node:assert';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { withRuntime } from './runtime.ts';
import { casePool } from './pool.ts';
import { runCase, type CaseJob } from './study.ts';

void test('parallel episodes retain exact serial evidence and worker exits fail instead of hanging', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'policy-pool-test-'));
  try {
    const serial = resolve(directory, 'serial'),
      parallel = resolve(directory, 'parallel');
    await mkdir(serial);
    await mkdir(parallel);
    await withRuntime({ game: 'blindside' }, async (runtime, pins) => {
      const jobs: CaseJob[] = ['immediate', 'survival'].map((policy, i) => ({
        seed: `POLICY-ADOPTION-1-DEV-0${i + 1}`,
        policy,
        setupId: 'standard',
        difficulty: 'standard',
        stratum: 'standard-deck',
        setup: { difficulty: 'standard' },
        directory: serial,
        maxDecisions: 2,
        retainRollouts: true,
        provenance: { ...pins },
      }));
      const expected = [];
      for (const job of jobs) expected.push(await runCase(runtime, job));
      const actual = await casePool(
        runtime.moduleURL,
        jobs.map((job) => ({ ...job, directory: parallel })),
        2,
      );
      assert.deepEqual(actual, expected);
      let delivered = 0;
      await assert.rejects(
        casePool(
          runtime.moduleURL,
          jobs.map((job) => ({ ...job, retainRollouts: false })),
          2,
          () => {
            delivered++;
            throw new Error('injected ledger write failure');
          },
        ),
        /ledger write failure/,
      );
      assert.equal(delivered, 1);
      for (const job of jobs) {
        const name = `${job.seed}-${job.setupId}-${job.policy}.rollout.json.gzip`;
        assert.ok(
          (await readFile(resolve(serial, name))).equals(await readFile(resolve(parallel, name))),
        );
      }
      const broken = resolve(directory, 'exits.mjs');
      await writeFile(broken, 'process.exit(0);');
      await assert.rejects(casePool(pathToFileURL(broken).href, jobs, 2), /exited early/);
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
