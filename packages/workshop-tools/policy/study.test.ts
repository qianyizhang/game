import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { cohortSeeds, meanInterval, pairedWins } from './study.ts';
void test('development and reserved seed blocks stay disjoint and paired intervals preserve signed differences', () => {
  const dev = cohortSeeds('development'),
    evaluation = cohortSeeds('evaluation');
  assert.equal(dev.length, 10);
  assert.equal(evaluation.length, 20);
  assert.equal(new Set([...dev, ...evaluation]).size, 30);
  const fresh = cohortSeeds('evaluation', 'SPIRE-STRENGTH-2', 60);
  assert.equal(fresh.length, 60);
  assert.ok(fresh.every((seed) => ![...dev, ...evaluation].includes(seed)));
  assert.throws(() => cohortSeeds('evaluation', '../escape'), /namespace/);
  assert.throws(() => cohortSeeds('evaluation', 'VALID', 19), /blocks/);
  const result = meanInterval(Array.from({ length: 20 }, () => -2));
  assert.equal(result.mean, -2);
  assert.equal(result.interval95, null);
  assert.match(result.reason, /constant observations/);
  assert.equal(meanInterval(Array.from({ length: 20 }, () => 0.1)).interval95, null);
});

void test('character strata retain paired seed denominators and reject missing/duplicate cases', async () => {
  const { summarizeStudy } = await import('./study.ts');
  const seeds = cohortSeeds('development');
  const setups = ['ironclad', 'silent'].map((stratum) => ({
    id: `${stratum}-a0`,
    stratum,
    difficulty: 'ascension-0',
    setup: { character: stratum, ascension: 0 },
  }));
  const study = { setups, ranking: 'test', defaultSetup: {}, reviewPath: '/test' };
  const rows = seeds.flatMap((seed) =>
    setups.flatMap((setup) =>
      ['a', 'b'].map((policy) => ({
        seed,
        policy,
        setupId: setup.id,
        stratum: setup.stratum,
        difficulty: setup.difficulty,
        status: 'terminal',
        metrics: {
          won: Number(policy === 'a'),
          progress: (setup.stratum === 'ironclad' ? 10 : 30) + (policy === 'a' ? 2 : 0),
        },
        work: 1,
        digest: 'test',
        audit: {
          integrity: 'passed',
          replay: 'passed',
          inputs: 'passed',
          decisions: 'passed',
          firstMismatch: null,
          message: '',
        } as const,
      })),
    ),
  );
  const result = summarizeStudy(rows, study, ['a', 'b'], seeds);
  assert.deepEqual(
    result.summary.map((s) => [s.stratum, s.policy, s.attempts, s.progress.mean]),
    [
      ['ironclad', 'a', 10, 12],
      ['ironclad', 'b', 10, 10],
      ['silent', 'a', 10, 32],
      ['silent', 'b', 10, 30],
    ],
  );
  assert.deepEqual(
    result.paired.map((p) => [
      p.progressDifference.n,
      p.progressDifference.mean,
      p.winDifference.mean,
    ]),
    [
      [10, 2, 1],
      [10, 2, 1],
    ],
  );
  assert.throws(() => summarizeStudy(rows.slice(1), study, ['a', 'b'], seeds), /incomplete/);
  assert.throws(
    () => summarizeStudy([rows[1], ...rows.slice(1)], study, ['a', 'b'], seeds),
    /mismatched/,
  );
});

void test('zero observed paired wins cannot claim zero-width population certainty', () => {
  const result = pairedWins(Array.from({ length: 20 }, () => [0, 0] as const));
  assert.equal(result.mean, 0);
  assert.equal(result.bothLost, 20);
  assert.equal(result.interval95, null);
  assert.match(result.reason, /unavailable/);
});
