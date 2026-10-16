import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { JsonObject, PolicyAudit } from '../../../src/shared/policy/types';
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
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.length > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1) : 0;
  // Student t, 95%, for the predeclared 10/20 independent seed blocks.
  const critical = values.length === 10 ? 2.262 : values.length === 20 ? 2.093 : 1.96;
  const halfWidth = critical * Math.sqrt(variance / values.length);
  return { n: values.length, mean, interval95: [mean - halfWidth, mean + halfWidth] };
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
export async function benchmark(
  runtime: Runtime,
  options: {
    split: 'development' | 'evaluation';
    directory: string;
    maxDecisions: number;
    provenance: JsonObject;
  },
) {
  const rows: {
    seed: string;
    policy: string;
    difficulty: string;
    status: string;
    metrics: JsonObject;
    work: number;
    digest: string;
    audit: PolicyAudit;
  }[] = [];
  // Initial Blindside matrix. Later games own their setup matrices at their adapter.
  for (const seed of cohortSeeds(options.split))
    for (const difficulty of ['relaxed', 'standard', 'severe'])
      for (const [id, factory] of Object.entries(runtime.builtins)) {
        const run = await runtime.recordEpisode(
          runtime.adapter,
          factory,
          {
            seed,
            setup: { difficulty },
            policySeed: 'POLICY-STREAM-1',
            policyOptions: {},
            maxDecisions: options.maxDecisions,
          },
          options.provenance,
        );
        const audit = await runtime.auditRollout(runtime.adapter, run, factory);
        const name = `${seed}-${difficulty}-${id}`;
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
          status: run.episode.status,
          metrics: run.episode.metrics,
          work: run.episode.work,
          digest: run.digest,
          audit,
        });
        process.stderr.write(`${options.split} ${rows.length}: ${name} ${run.episode.status}\n`);
      }
  const summary = ['relaxed', 'standard', 'severe'].flatMap((difficulty) =>
    Object.keys(runtime.builtins).map((policy) => {
      const cases = rows.filter((r) => r.difficulty === difficulty && r.policy === policy);
      return {
        difficulty,
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
  const paired = ['relaxed', 'standard', 'severe'].flatMap((difficulty) => {
    const ids = Object.keys(runtime.builtins);
    return ids.flatMap((a, i) =>
      ids.slice(i + 1).map((b) => ({
        difficulty,
        a,
        b,
        progressDifference: meanInterval(
          cohortSeeds(options.split).map((seed) => {
            const aRow = rows.find(
              (r) => r.seed === seed && r.difficulty === difficulty && r.policy === a,
            )!;
            const bRow = rows.find(
              (r) => r.seed === seed && r.difficulty === difficulty && r.policy === b,
            )!;
            return Number(aRow.metrics.progress) - Number(bRow.metrics.progress);
          }),
        ),
      })),
    );
  });
  return {
    schema: 'policy-study-1',
    game: runtime.adapter.game,
    identity: runtime.adapter.identity,
    split: options.split,
    seeds: cohortSeeds(options.split),
    policySeed: 'POLICY-STREAM-1',
    maxDecisions: options.maxDecisions,
    provenance: options.provenance,
    uncertainty:
      '95% Student t intervals over independent paired environment-seed blocks; descriptive, unadjusted for multiple comparisons. No human-difficulty claim.',
    summary,
    paired,
    rows,
  };
}
