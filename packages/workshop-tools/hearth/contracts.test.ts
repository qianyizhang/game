import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { withRecruitmentRuntime } from './recruitment-runtime.ts';
import { recruitmentReport, caseSpec } from './contracts.ts';
import { recruitmentPool } from './recruitment-pool.ts';

await test('receipt comparison validates consumed fields and exact frozen case/configuration', async () => {
  await withRecruitmentRuntime(({ runtime }) => {
    const spec = runtime.recruitmentCases('development')[0];
    const report = runtime.runRecruitmentEpisode(spec);
    const { replay, ...receipt } = report;
    assert.deepEqual(recruitmentReport(receipt, replay, runtime), report);
    for (const malformed of [
      { ...receipt, commands: '12' },
      { ...receipt, decisionMs: Number.NaN },
      { ...receipt, replayVerified: 'true' },
      { ...receipt, config: { ...receipt.config, firstSeat: 99 } },
      { ...receipt, metrics: { ...receipt.metrics, upgrades: [{ cost: 'free' }] } },
    ])
      assert.throws(() => recruitmentReport(malformed, replay, runtime));
    assert.throws(() => caseSpec({ ...spec, seed: 'changed' }, runtime), /modified case/);
  });
});

await test(
  'worker rejection terminates the pool and leaves partial output inspectable',
  { timeout: 10000 },
  async (t) => {
    const output = await mkdtemp(resolve(tmpdir(), 'recruitment-pool-test-'));
    t.after(() => rm(output, { recursive: true, force: true }));
    await withRecruitmentRuntime(async ({ runtime, moduleURL }) => {
      const spec = runtime.recruitmentCases('development')[0];
      await assert.rejects(
        recruitmentPool({
          moduleURL,
          output,
          workers: 2,
          jobs: [{ ...spec, id: 'modified' }, spec],
        }),
        /modified case/,
      );
      await assert.rejects(
        recruitmentPool({ moduleURL, output, workers: 5, jobs: [] }),
        /1–4 workers/,
      );
      assert.deepEqual(await recruitmentPool({ moduleURL, output, workers: 1, jobs: [] }), []);
    });
  },
);
