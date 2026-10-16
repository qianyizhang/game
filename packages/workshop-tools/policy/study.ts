import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { JsonObject, PolicyAudit, StudyDefinition } from '../../../src/shared/policy/types';
import { compareScores, scoreVector } from '../../../src/shared/policy/scoring.ts';
import type { Runtime } from './runtime.ts';
import { casePool } from './pool.ts';

/** Frozen independent blocks; no environment seed ever enters policy configuration. */
export const cohortSeeds = (
  split: 'development' | 'evaluation',
  namespace = 'POLICY-ADOPTION-1',
  blocks = split === 'development' ? 10 : 20,
) => {
  if (!/^[A-Z][A-Z0-9-]{2,63}$/.test(namespace))
    throw new Error('Cohort namespace must be 3–64 uppercase letters, digits or hyphens.');
  if (![10, 20, 40, 60, 100, 400].includes(blocks))
    throw new Error('Use 10, 20, 40, 60, 100 or 400 independent blocks.');
  return Array.from(
    { length: blocks },
    (_, i) =>
      `${namespace}-${split === 'development' ? 'DEV' : 'RESERVED'}-${String(i + 1).padStart(2, '0')}`,
  );
};
export const auditPassed = (a: PolicyAudit) =>
  a.integrity === 'passed' &&
  a.replay === 'passed' &&
  a.inputs === 'passed' &&
  a.decisions === 'passed';
const scoreEligible = (row: StudyRow) => row.status !== 'error' && auditPassed(row.audit);
export function meanInterval(values: number[]) {
  if (!values.length || values.some((v) => !Number.isFinite(v)))
    throw new Error('Intervals require finite observed values.');
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.length > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1) : 0;
  if (values.length < 2 || values.every((value) => value === values[0]) || variance === 0)
    return {
      n: values.length,
      mean,
      interval95: null,
      reason:
        'Observed sample does not support a variance-based interval; finite constant observations do not establish zero population uncertainty.',
    };
  // Student t, 95%, for the predeclared independent block counts.
  const critical =
    (
      { 10: 2.262, 20: 2.093, 40: 2.023, 60: 2.001, 100: 1.984, 400: 1.966 } as Record<
        number,
        number
      >
    )[values.length] ?? 1.96;
  const halfWidth = critical * Math.sqrt(variance / values.length);
  return { n: values.length, mean, interval95: [mean - halfWidth, mean + halfWidth], reason: null };
}
/** Wilson score interval retains uncertainty at zero/all wins. */
export function winInterval(wins: number, attempts: number) {
  const z = 1.96,
    rate = wins / attempts,
    denominator = 1 + (z * z) / attempts;
  const center = (rate + (z * z) / (2 * attempts)) / denominator;
  const half =
    (z * Math.sqrt((rate * (1 - rate)) / attempts + (z * z) / (4 * attempts * attempts))) /
    denominator;
  return {
    wins,
    attempts,
    rate,
    interval95: [Math.max(0, center - half), Math.min(1, center + half)],
  };
}
/** A t interval can claim [0,0] with zero observed rare wins. Do not estimate it here. */
export function pairedWins(values: readonly (readonly [number, number])[]) {
  const aOnly = values.filter(([a, b]) => a === 1 && b === 0).length;
  const bOnly = values.filter(([a, b]) => a === 0 && b === 1).length;
  return {
    n: values.length,
    mean: (aOnly - bOnly) / values.length,
    aOnly,
    bOnly,
    bothWon: values.filter(([a, b]) => a === 1 && b === 1).length,
    bothLost: values.filter(([a, b]) => a === 0 && b === 0).length,
    interval95: null,
    reason:
      'Paired-binomial interval unavailable. Zero/few observed discordant wins cannot establish zero population difference; use individual Wilson intervals without treating them as a paired difference interval.',
  };
}
export type StudyRow = {
  seed: string;
  policy: string;
  difficulty: string;
  stratum: string;
  setupId: string;
  status: string;
  metrics: JsonObject;
  work: number;
  digest: string;
  audit: PolicyAudit;
};

export async function benchmark(
  runtime: Runtime,
  options: {
    split: 'development' | 'evaluation';
    workers?: number;
    directory: string;
    maxDecisions: number;
    provenance: JsonObject;
    seeds?: string[];
  },
) {
  const seeds = options.seeds ?? cohortSeeds(options.split);
  if (!seeds.length || new Set(seeds).size !== seeds.length)
    throw new Error('Study requires unique independent seed labels.');
  const jobs: CaseJob[] = seeds.flatMap((seed) =>
    runtime.study.setups.flatMap((setup) =>
      Object.keys(runtime.builtins).map((policy) => ({
        seed,
        policy,
        setupId: setup.id,
        difficulty: setup.difficulty,
        stratum: setup.stratum,
        setup: setup.setup,
        directory: options.directory,
        maxDecisions: options.maxDecisions,
        provenance: options.provenance,
      })),
    ),
  );
  const rows =
    options.workers === undefined || options.workers === 1
      ? await serialCases(runtime, jobs)
      : await casePool(runtime.moduleURL, jobs, options.workers);
  const { summary, paired } = summarizeStudy(
    rows,
    runtime.study,
    Object.keys(runtime.builtins),
    seeds,
  );
  return {
    schema: 'policy-study-2',
    game: runtime.adapter.game,
    identity: runtime.adapter.identity,
    study: runtime.study,
    split: options.split,
    seeds,
    policySeed: 'POLICY-STREAM-1',
    maxDecisions: options.maxDecisions,
    workers: options.workers ?? 1,
    provenance: options.provenance,
    uncertainty:
      '95% Wilson intervals on win rates; approximate Student t intervals on mean/paired progress. Paired-win differences report point estimates and discordance counts, with intervals unavailable, within each setup stratum over independent seed blocks. No pooling across characters/heroes. Unadjusted for multiple comparisons, descriptive only. No human-difficulty claim.',
    summary,
    paired,
    rows,
  };
}

/** Analyze a complete matched grid; each setup keeps its own independent seed denominator. */
export function summarizeStudy(
  rows: readonly StudyRow[],
  study: StudyDefinition,
  policies: readonly string[],
  seeds: readonly string[],
) {
  const expected = new Set(
    seeds.flatMap((seed) =>
      study.setups.flatMap((setup) =>
        policies.map((policy) => JSON.stringify([seed, setup.id, policy])),
      ),
    ),
  );
  if (rows.length !== expected.size) throw new Error('Study grid is incomplete or duplicated.');
  for (const row of rows) {
    const key = JSON.stringify([row.seed, row.setupId, row.policy]);
    const setup = study.setups.find((s) => s.id === row.setupId);
    if (
      !expected.delete(key) ||
      !setup ||
      setup.difficulty !== row.difficulty ||
      setup.stratum !== row.stratum ||
      typeof row.metrics.progress !== 'number' ||
      !Number.isFinite(row.metrics.progress) ||
      ![0, 1, false, true].includes(row.metrics.won as number | boolean)
    )
      throw new Error('Study contains mismatched cases or nonnumeric native outcome metrics.');
    if (study.score) scoreVector(study.score, row.metrics.score);
  }
  const summary = study.setups.flatMap(({ id: setupId, difficulty, stratum }) =>
    policies.map((policy) => {
      const cases = rows.filter((r) => r.setupId === setupId && r.policy === policy);
      return {
        setupId,
        difficulty,
        stratum,
        policy,
        attempts: cases.length,
        wins: cases.filter((r) => r.metrics.won === true || r.metrics.won === 1).length,
        winRate: winInterval(
          cases.filter((r) => r.metrics.won === true || r.metrics.won === 1).length,
          cases.length,
        ),
        errors: cases.filter((r) => r.status === 'error').length,
        timeouts: cases.filter((r) => r.status === 'timeout').length,
        auditsPassed: cases.filter((r) => auditPassed(r.audit)).length,
        progress: meanInterval(cases.map((r) => Number(r.metrics.progress))),
        work: meanInterval(cases.map((r) => r.work)),
        ...(study.score
          ? {
              score: {
                invalid: cases.filter((r) => !scoreEligible(r)).length,
                components: study.score.components.map(({ name, direction }, index) => {
                  const values = cases
                    .filter(scoreEligible)
                    .map((r) => scoreVector(study.score!, r.metrics.score)[index]);
                  return {
                    name,
                    direction,
                    distribution: values.length
                      ? (() => {
                          const ordered = [...values].sort((a, b) => a - b);
                          const middle = Math.floor(ordered.length / 2);
                          return {
                            n: values.length,
                            min: ordered[0],
                            median:
                              ordered.length % 2
                                ? ordered[middle]
                                : (ordered[middle - 1] + ordered[middle]) / 2,
                            max: ordered.at(-1)!,
                            mean: values.reduce((sum, value) => sum + value, 0) / values.length,
                          };
                        })()
                      : null,
                  };
                }),
              },
            }
          : {}),
      };
    }),
  );
  const paired = study.setups.flatMap(({ id: setupId, difficulty, stratum }) => {
    const ids = policies;
    return ids.flatMap((a, i) =>
      ids.slice(i + 1).map((b) => ({
        setupId,
        difficulty,
        stratum,
        a,
        b,
        winDifference: pairedWins(
          seeds.map((seed) => {
            const aRow = rows.find(
              (r) => r.seed === seed && r.setupId === setupId && r.policy === a,
            )!;
            const bRow = rows.find(
              (r) => r.seed === seed && r.setupId === setupId && r.policy === b,
            )!;
            return [Number(aRow.metrics.won), Number(bRow.metrics.won)] as const;
          }),
        ),
        progressDifference: meanInterval(
          seeds.map((seed) => {
            const aRow = rows.find(
              (r) => r.seed === seed && r.setupId === setupId && r.policy === a,
            )!;
            const bRow = rows.find(
              (r) => r.seed === seed && r.setupId === setupId && r.policy === b,
            )!;
            return Number(aRow.metrics.progress) - Number(bRow.metrics.progress);
          }),
        ),
        ...(study.score
          ? {
              scoreComparison: (() => {
                const comparisons = seeds.map((seed) => {
                  const aRow = rows.find(
                    (r) => r.seed === seed && r.setupId === setupId && r.policy === a,
                  )!;
                  const bRow = rows.find(
                    (r) => r.seed === seed && r.setupId === setupId && r.policy === b,
                  )!;
                  return !scoreEligible(aRow) || !scoreEligible(bRow)
                    ? null
                    : compareScores(
                        study.score!,
                        scoreVector(study.score!, aRow.metrics.score),
                        scoreVector(study.score!, bRow.metrics.score),
                      );
                });
                return {
                  n: comparisons.length,
                  aBetter: comparisons.filter((value) => value === 1).length,
                  bBetter: comparisons.filter((value) => value === -1).length,
                  tied: comparisons.filter((value) => value === 0).length,
                  invalid: comparisons.filter((value) => value === null).length,
                  inference:
                    'Descriptive paired ordinal counts; no scalar mean or promotion verdict.',
                };
              })(),
            }
          : {}),
      })),
    );
  });
  return { summary, paired };
}

export interface CaseJob {
  seed: string;
  policy: string;
  setupId: string;
  difficulty: string;
  stratum: string;
  setup: JsonObject;
  directory: string;
  maxDecisions: number;
  provenance: JsonObject;
}
export async function runCase(
  runtime: Omit<Runtime, 'moduleURL'>,
  job: CaseJob,
): Promise<StudyRow> {
  const factory = runtime.custom?.id === job.policy ? runtime.custom : runtime.builtins[job.policy];
  if (!factory) throw new Error('Assigned policy unavailable.');
  const run = await runtime.recordEpisode(
    runtime.adapter,
    factory,
    {
      seed: job.seed,
      setup: job.setup,
      policySeed: 'POLICY-STREAM-1',
      policyOptions: {},
      maxDecisions: job.maxDecisions,
    },
    job.provenance,
  );
  const audit = await runtime.auditRollout(runtime.adapter, run, factory);
  const name = `${job.seed}-${job.setupId}-${job.policy}`;
  await writeFile(resolve(job.directory, `${name}.rollout.json`), JSON.stringify(run) + '\n', {
    flag: 'wx',
  });
  await writeFile(
    resolve(job.directory, `${name}.audit.json`),
    JSON.stringify(audit, null, 2) + '\n',
    { flag: 'wx' },
  );
  return {
    seed: job.seed,
    policy: job.policy,
    setupId: job.setupId,
    difficulty: job.difficulty,
    stratum: job.stratum,
    status: run.episode.status,
    metrics: run.episode.metrics,
    work: run.episode.work,
    digest: run.digest,
    audit,
  };
}
async function serialCases(runtime: Runtime, jobs: CaseJob[]) {
  const rows: StudyRow[] = [];
  for (const job of jobs) {
    const row = await runCase(runtime, job);
    rows.push(row);
    process.stderr.write(
      `Case ${rows.length}/${jobs.length}: ${job.seed}-${job.setupId}-${job.policy} ${row.status}\n`,
    );
  }
  return rows;
}
