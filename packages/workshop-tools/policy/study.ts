import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { JsonObject, PolicyAudit, StudyDefinition } from '../../../src/shared/policy/types';
import type { Runtime } from './runtime.ts';

/** Frozen independent blocks; no environment seed ever enters policy configuration. */
export const cohortSeeds = (split: 'development' | 'evaluation') =>
  Array.from(
    { length: split === 'development' ? 10 : 20 },
    (_, i) =>
      `POLICY-ADOPTION-1-${split === 'development' ? 'DEV' : 'RESERVED'}-${String(i + 1).padStart(2, '0')}`,
  );
export const auditPassed = (a: PolicyAudit) =>
  a.integrity === 'passed' &&
  a.replay === 'passed' &&
  a.inputs === 'passed' &&
  a.decisions === 'passed';
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
  // Student t, 95%, for the predeclared 10/20 independent seed blocks.
  const critical = values.length === 10 ? 2.262 : values.length === 20 ? 2.093 : 1.96;
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
    directory: string;
    maxDecisions: number;
    provenance: JsonObject;
  },
) {
  const rows: StudyRow[] = [];
  // Each game owns setups and strata. Character/hero repetitions are never pooled as independent seeds.
  for (const seed of cohortSeeds(options.split))
    for (const { id: setupId, difficulty, stratum, setup } of runtime.study.setups)
      for (const [id, factory] of Object.entries(runtime.builtins)) {
        const run = await runtime.recordEpisode(
          runtime.adapter,
          factory,
          {
            seed,
            setup,
            policySeed: 'POLICY-STREAM-1',
            policyOptions: {},
            maxDecisions: options.maxDecisions,
          },
          options.provenance,
        );
        const audit = await runtime.auditRollout(runtime.adapter, run, factory);
        const name = `${seed}-${setupId}-${id}`;
        // Keep complete original evidence for every attempted case, including errors.
        await writeFile(
          resolve(options.directory, `${name}.rollout.json`),
          JSON.stringify(run) + '\n',
          { flag: 'wx' },
        );
        await writeFile(
          resolve(options.directory, `${name}.audit.json`),
          JSON.stringify(audit, null, 2) + '\n',
          { flag: 'wx' },
        );
        rows.push({
          seed,
          policy: id,
          difficulty,
          stratum,
          setupId,
          status: run.episode.status,
          metrics: run.episode.metrics,
          work: run.episode.work,
          digest: run.digest,
          audit,
        });
        process.stderr.write(`${options.split} ${rows.length}: ${name} ${run.episode.status}\n`);
      }
  const { summary, paired } = summarizeStudy(
    rows,
    runtime.study,
    Object.keys(runtime.builtins),
    cohortSeeds(options.split),
  );
  return {
    schema: 'policy-study-2',
    game: runtime.adapter.game,
    identity: runtime.adapter.identity,
    study: runtime.study,
    split: options.split,
    seeds: cohortSeeds(options.split),
    policySeed: 'POLICY-STREAM-1',
    maxDecisions: options.maxDecisions,
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
      })),
    );
  });
  return { summary, paired };
}
