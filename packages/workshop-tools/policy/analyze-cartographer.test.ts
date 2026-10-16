import { strict as assert } from 'node:assert';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { analyzeCartographer, cartographerContract } from './analyze-cartographer.ts';
import { cohortSeeds, type StudyRow } from './study.ts';

// Synthetic outcomes exercise promotion/refusal only. Real current source pins,
// game metadata and exact bundle bytes are derived without executing any episode.
void test('Cartographer confirmation validates the complete frozen 900-case contract and refuses misleading promotion', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'cartographer-analysis-synthetic-'));
  try {
    const current = await cartographerContract();
    const seeds = cohortSeeds('evaluation', current.plan.namespace, current.plan.blocks);
    const rows: StudyRow[] = seeds.flatMap((seed, index) =>
      current.study.setups.flatMap((setup) =>
        current.policies.map(({ id: policy }) => {
          const wins =
            setup.id === 'relaxed'
              ? 100
              : setup.id === 'standard'
                ? 70
                : policy === 'survival'
                  ? 30
                  : 5;
          const won = Number(index < wins);
          return {
            seed,
            policy,
            setupId: setup.id,
            difficulty: setup.difficulty,
            stratum: setup.stratum,
            status: 'terminal',
            metrics: {
              won,
              outcome: won ? 'won' : 'lost',
              hp: won ? 20 : 0,
              progress: won ? 9 : 5,
            },
            work: 100,
            digest: 'a'.repeat(64),
            audit: {
              integrity: 'passed',
              replay: 'passed',
              inputs: 'passed',
              decisions: 'passed',
              firstMismatch: null,
              message: 'Synthetic reported audit fields; not raw rollout evidence.',
            },
          };
        }),
      ),
    );
    const timeout = rows.find(
      (row) => row.setupId === 'severe' && row.policy === 'immediate' && row.metrics.won === 0,
    )!;
    timeout.status = 'timeout';
    timeout.metrics.outcome = 'playing';
    timeout.metrics.hp = 1;
    const report = {
      schema: 'policy-study-2',
      game: current.game,
      identity: current.identity,
      split: 'evaluation',
      seeds,
      policySeed: 'POLICY-STREAM-1',
      maxDecisions: 2000,
      workers: 2,
      study: current.study,
      provenance: current.provenance,
      rows,
    };
    const protocol = {
      schema: 'policy-study-protocol-2',
      game: 'cartographer',
      identity: current.identity,
      split: 'evaluation',
      seeds,
      policySeed: 'POLICY-STREAM-1',
      maxDecisions: 2000,
      workers: 2,
      study: current.study,
      provenance: current.provenance,
      policies: current.policies,
    };
    await mkdir(resolve(directory, 'bundles'));
    await writeFile(
      resolve(directory, 'bundles', `${current.plan.bundleDigest}.mjs`),
      current.bundle,
    );
    let serial = 0;
    const evaluate = async (
      change: (candidate: {
        plan: typeof current.plan;
        report: typeof report;
        protocol: typeof protocol;
      }) => void = () => {},
    ) => {
      const candidate = structuredClone({ plan: current.plan, report, protocol });
      change(candidate);
      const plan = resolve(directory, 'plan.json');
      await writeFile(plan, JSON.stringify(candidate.plan));
      await writeFile(resolve(directory, 'report.json'), JSON.stringify(candidate.report));
      await writeFile(resolve(directory, 'protocol.json'), JSON.stringify(candidate.protocol));
      return analyzeCartographer(directory, plan, resolve(directory, `synthetic-${serial++}.json`));
    };
    const valid = await evaluate();
    assert.equal(valid.allCriteriaPassed, true);
    assert.equal(valid.integrity, true);
    assert.deepEqual(
      valid.family.map((value) => value.difference),
      [0.3, 0.4, 0.25],
    );
    assert.equal(valid.family.length, 3);
    assert.equal(valid.completion.attempts, 900);
    assert.equal(valid.completion.nativeTerminal, 899);
    assert.equal(valid.completion.livingBudgetStops.length, 1);
    assert.match(valid.limits, /does not independently audit raw rollout artifacts/);
    await assert.rejects(
      analyzeCartographer(
        directory,
        resolve(directory, 'plan.json'),
        resolve(directory, 'synthetic-0.json'),
      ),
      { code: 'EEXIST' },
    );
    await assert.rejects(
      evaluate(({ plan }) => {
        delete plan.runtimeDigests[Object.keys(plan.runtimeDigests)[0]];
      }),
      /complete runtime\/analysis contract/,
    );
    await assert.rejects(
      evaluate(({ plan }) => {
        delete plan.analysisDigests['tests/fixtures/cartographer-v2-continuity.json'];
      }),
      /complete runtime\/analysis contract/,
    );
    await assert.rejects(
      evaluate(({ plan }) => {
        plan.analysisDigests['tests/fixtures/cartographer-v1-continuity.json'] = '0'.repeat(64);
      }),
      /complete runtime\/analysis contract/,
    );
    await assert.rejects(
      evaluate(({ report, protocol }) => {
        report.provenance.sourceDigests = {};
        protocol.provenance.sourceDigests = {};
      }),
      /provenance/,
    );
    await assert.rejects(
      evaluate(({ report }) => {
        report.rows.pop();
      }),
      /incomplete or duplicated/,
    );
    await assert.rejects(
      evaluate(({ report }) => {
        report.rows[0] = structuredClone(report.rows[1]);
      }),
      /mismatched cases/,
    );
    await assert.rejects(
      evaluate(({ report, protocol }) => {
        report.maxDecisions = 10000;
        protocol.maxDecisions = 10000;
      }),
      /budget/,
    );
    await assert.rejects(
      evaluate(({ protocol }) => {
        protocol.workers = 4;
      }),
      /budget/,
    );
    await assert.rejects(
      evaluate(({ protocol }) => {
        protocol.workers = 1;
      }),
      /budget/,
    );
    await assert.rejects(
      evaluate(({ protocol }) => {
        Reflect.deleteProperty(protocol, 'workers');
      }),
      /budget/,
    );
    await assert.rejects(
      evaluate(({ report }) => {
        report.rows[0].metrics.won = true;
      }),
      /binary native wins/,
    );
    const invalidAudit = await evaluate(({ report }) => {
      report.rows[0].audit.inputs = 'failed';
    });
    assert.equal(invalidAudit.integrity, false);
    assert.equal(invalidAudit.allCriteriaPassed, false);
    assert.equal(invalidAudit.completion.attempts, 900);
    const deadTimeout = await evaluate(({ report }) => {
      const row = report.rows.find((row) => row.status === 'timeout')!;
      row.metrics.hp = 0;
      row.metrics.outcome = 'lost';
    });
    assert.equal(deadTimeout.integrity, false);
    assert.equal(deadTimeout.allCriteriaPassed, false);
    assert.equal(deadTimeout.completion.livingBudgetStops.length, 0);
    assert.equal(deadTimeout.completion.reportedBudgetStops.length, 1);
    const reversed = await evaluate(({ report }) => {
      for (const row of report.rows.filter((row) => row.policy === 'survival')) {
        const won = Number(row.setupId === 'severe' || row.setupId === 'standard');
        row.metrics.won = won;
        row.metrics.outcome = won ? 'won' : 'lost';
        row.metrics.hp = won ? 20 : 0;
      }
    });
    assert.equal(reversed.integrity, true);
    assert.equal(reversed.allCriteriaPassed, false);
    assert.equal(reversed.family[0].passed, false);
    assert.equal(reversed.playability[0].passed, false);
    await writeFile(
      resolve(directory, 'bundles', `${current.plan.bundleDigest}.mjs`),
      'corrupt retained bundle',
    );
    await assert.rejects(evaluate(), /Retained native bundle/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
