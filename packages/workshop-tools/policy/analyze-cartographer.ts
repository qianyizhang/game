import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import type { StudyDefinition } from '../../../src/shared/policy/types';
import { repositoryRoot, sha256 } from '../runtime-bundle.ts';
import { binaryContrast, holm } from './calibration.ts';
import { withRuntime } from './runtime.ts';
import { auditPassed, cohortSeeds, summarizeStudy, winInterval, type StudyRow } from './study.ts';

const analysisPaths = [
  'packages/workshop-tools/policy/analyze-cartographer.ts',
  'packages/workshop-tools/policy/calibration.ts',
  'packages/workshop-tools/policy/study.ts',
  'docs/research/experiments/2026-10-16-cartographer-strength-3-protocol.md',
  'tests/fixtures/cartographer-v1-continuity.json',
  'tests/fixtures/cartographer-v2-continuity.json',
] as const;
export interface CartographerPlan {
  schema: 'cartographer-strength-plan-3';
  namespace: 'CARTOGRAPHER-STRENGTH-3';
  blocks: 100;
  reference: 'survival';
  bundleDigest: string;
  runtime: string;
  runtimeDigests: Record<string, string>;
  analysisDigests: Record<string, string>;
}
interface Provenance {
  sourceDigests: Record<string, string>;
  toolDigests: Record<string, string>;
  bundleDigest: string;
  runtime: string;
}
interface Report {
  schema: string;
  game: string;
  identity: unknown;
  split: string;
  seeds: string[];
  policySeed: string;
  maxDecisions: number;
  workers: number;
  study: StudyDefinition;
  provenance: Provenance;
  rows: StudyRow[];
}
interface Protocol extends Omit<Report, 'rows'> {
  policies: { id: string; version: string }[];
}
const validPins = (pins: Record<string, string>) =>
  pins &&
  typeof pins === 'object' &&
  !Array.isArray(pins) &&
  Object.keys(pins).length > 0 &&
  Object.values(pins).every((value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value));
const pinsFor = async (paths: readonly string[]): Promise<Record<string, string>> =>
  Object.fromEntries(
    await Promise.all(
      paths.map(
        async (path) => [path, sha256(await readFile(resolve(repositoryRoot, path)))] as const,
      ),
    ),
  );
/** Build the real current game, including its complete transitive native/tool pin set.
 * This performs no episode execution and samples no reserved outcome.
 */
export async function cartographerContract() {
  return withRuntime({ game: 'cartographer' }, async (runtime, provenance) => ({
    plan: {
      schema: 'cartographer-strength-plan-3',
      namespace: 'CARTOGRAPHER-STRENGTH-3',
      blocks: 100,
      reference: 'survival',
      bundleDigest: provenance.bundleDigest,
      runtime: provenance.runtime,
      runtimeDigests: { ...provenance.sourceDigests, ...provenance.toolDigests },
      analysisDigests: await pinsFor(analysisPaths),
    } satisfies CartographerPlan,
    identity: runtime.adapter.identity,
    game: runtime.adapter.game,
    study: runtime.study,
    policies: Object.values(runtime.builtins).map(({ id, version }) => ({ id, version })),
    provenance,
    bundle: await readFile(fileURLToPath(runtime.moduleURL)),
  }));
}

/** Confirm summary structure and prospective statistics. Raw rollout auditing remains
 * a separate independent evidence check; reported audit fields are not raw proof.
 */
export async function analyzeCartographer(directory: string, planPath: string, outPath: string) {
  const planBytes = await readFile(planPath, 'utf8');
  const plan = JSON.parse(planBytes) as CartographerPlan;
  const current = await cartographerContract();
  if (
    !validPins(plan.runtimeDigests) ||
    !validPins(plan.analysisDigests) ||
    !isDeepStrictEqual(plan, current.plan)
  )
    throw new Error(
      'Frozen Cartographer plan differs from the current complete runtime/analysis contract.',
    );
  const reportBytes = await readFile(resolve(directory, 'report.json'), 'utf8');
  const report = JSON.parse(reportBytes) as Report;
  const protocolBytes = await readFile(resolve(directory, 'protocol.json'), 'utf8');
  const protocol = JSON.parse(protocolBytes) as Protocol;
  const seeds = cohortSeeds('evaluation', plan.namespace, plan.blocks);
  if (
    report.schema !== 'policy-study-2' ||
    protocol.schema !== 'policy-study-protocol-2' ||
    report.game !== current.game ||
    protocol.game !== 'cartographer' ||
    !isDeepStrictEqual(report.identity, current.identity) ||
    !isDeepStrictEqual(protocol.identity, current.identity) ||
    report.split !== 'evaluation' ||
    protocol.split !== 'evaluation' ||
    !isDeepStrictEqual(report.seeds, seeds) ||
    !isDeepStrictEqual(protocol.seeds, seeds) ||
    report.maxDecisions !== 2000 ||
    protocol.maxDecisions !== 2000 ||
    report.policySeed !== 'POLICY-STREAM-1' ||
    protocol.policySeed !== 'POLICY-STREAM-1' ||
    !Number.isInteger(report.workers) ||
    report.workers < 1 ||
    report.workers > 2 ||
    protocol.workers !== report.workers ||
    !isDeepStrictEqual(report.study, current.study) ||
    !isDeepStrictEqual(protocol.study, current.study) ||
    !isDeepStrictEqual(protocol.policies, current.policies) ||
    !isDeepStrictEqual(report.provenance, current.provenance) ||
    !isDeepStrictEqual(protocol.provenance, current.provenance)
  )
    throw new Error(
      'Study report/protocol differs from the frozen population, native identity, policy, budget or provenance.',
    );
  if (
    sha256(await readFile(resolve(directory, 'bundles', `${plan.bundleDigest}.mjs`))) !==
    plan.bundleDigest
  )
    throw new Error('Retained native bundle differs from the frozen plan.');
  if (
    !Array.isArray(report.rows) ||
    report.rows.some(
      (row) =>
        !row ||
        !row.metrics ||
        (row.metrics.won !== 0 && row.metrics.won !== 1) ||
        !Number.isFinite(row.work) ||
        row.work < 0 ||
        typeof row.digest !== 'string' ||
        !/^[a-f0-9]{64}$/.test(row.digest),
    )
  )
    throw new Error('Study rows require binary native wins, finite work and rollout digests.');
  // Independently rebuild the complete 100 × 3 × 3 grid; never trust saved summaries.
  const summary = summarizeStudy(
    report.rows,
    current.study,
    current.policies.map((p) => p.id),
    seeds,
  );
  const find = (seed: string, setupId: string, policy: string) =>
    report.rows.find(
      (row) => row.seed === seed && row.setupId === setupId && row.policy === policy,
    )!;
  const contrast = (id: string, a: [string, string], b: [string, string]) => ({
    id,
    ...binaryContrast(
      seeds.map(
        (seed) =>
          [Number(find(seed, ...a).metrics.won), Number(find(seed, ...b).metrics.won)] as const,
      ),
    ),
  });
  const contrasts = [
    contrast('relaxed-standard', ['relaxed', 'survival'], ['standard', 'survival']),
    contrast('standard-severe', ['standard', 'survival'], ['severe', 'survival']),
    contrast('severe-strength', ['severe', 'survival'], ['severe', 'immediate']),
  ];
  const adjusted = holm(contrasts.map((item) => ({ id: item.id, p: item.exactP })));
  const family = contrasts.map((item) => {
    const adjustedP = adjusted.find((value) => value.id === item.id)!.adjustedP;
    return { ...item, adjustedP, passed: item.difference >= 0.1 && adjustedP < 0.05 };
  });
  const playability = (['relaxed', 'standard'] as const).map((setupId) => {
    const wins = winInterval(
      seeds.filter((seed) => find(seed, setupId, 'survival').metrics.won === 1).length,
      seeds.length,
    );
    const lowerBoundRequired = setupId === 'relaxed' ? 0.5 : 0.1;
    return {
      setupId,
      policy: 'survival',
      wins,
      lowerBoundRequired,
      passed: wins.interval95[0] > lowerBoundRequired,
    };
  });
  const nativeWin = (row: StudyRow) =>
    row.status === 'terminal' &&
    row.metrics.won === 1 &&
    row.metrics.outcome === 'won' &&
    typeof row.metrics.hp === 'number' &&
    Number.isFinite(row.metrics.hp) &&
    row.metrics.hp > 0;
  const nativeDeath = (row: StudyRow) =>
    row.status === 'terminal' &&
    row.metrics.won === 0 &&
    row.metrics.outcome === 'lost' &&
    row.metrics.hp === 0;
  const livingTimeout = (row: StudyRow) =>
    row.status === 'timeout' &&
    row.metrics.won === 0 &&
    row.metrics.outcome === 'playing' &&
    typeof row.metrics.hp === 'number' &&
    Number.isFinite(row.metrics.hp) &&
    row.metrics.hp > 0;
  const invalidRows = report.rows.filter(
    (row) =>
      !row.audit ||
      !auditPassed(row.audit) ||
      !(nativeWin(row) || nativeDeath(row) || livingTimeout(row)),
  );
  const label = (row: StudyRow) => ({ seed: row.seed, setupId: row.setupId, policy: row.policy });
  const integrity = invalidRows.length === 0;
  const result = {
    schema: 'cartographer-strength-analysis-3',
    planDigest: sha256(planBytes),
    reportDigest: sha256(reportBytes),
    protocolDigest: sha256(protocolBytes),
    family,
    playability,
    summary,
    integrity,
    invalidRows: invalidRows.map((row) => ({
      ...label(row),
      status: row.status,
      outcome: row.metrics.outcome,
      audit: row.audit,
    })),
    completion: {
      attempts: report.rows.length,
      nativeTerminal: report.rows.filter((row) => nativeWin(row) || nativeDeath(row)).length,
      nativeWins: report.rows.filter(nativeWin).length,
      nativeDeaths: report.rows.filter(nativeDeath).map(label),
      livingBudgetStops: report.rows.filter(livingTimeout).map(label),
      reportedBudgetStops: report.rows.filter((row) => row.status === 'timeout').map(label),
      endpoint:
        'Victory within 2000 decisions; living budget stops remain nonwins in all denominators.',
    },
    allCriteriaPassed:
      integrity && family.every((item) => item.passed) && playability.every((item) => item.passed),
    limits:
      'Summary validation does not independently audit raw rollout artifacts. Paired intervals unavailable. Holm covers these three contrasts only. Prior development selection is not reserved evidence. No human-equivalent skill or enjoyment claim.',
  };
  // Refuse mutation during analysis, including tools not traversed by the native bundle.
  const pins = { ...plan.runtimeDigests, ...plan.analysisDigests };
  if (!isDeepStrictEqual(await pinsFor(Object.keys(pins)), pins))
    throw new Error('Source drift during Cartographer analysis.');
  await writeFile(outPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [directory, plan, out] = process.argv.slice(2);
    if (!directory || !plan || !out || process.argv.length !== 5)
      throw new Error('Usage: analyze-cartographer.ts STUDY_DIRECTORY FROZEN_PLAN NEW_ANALYSIS');
    console.log(JSON.stringify(await analyzeCartographer(directory, plan, out), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
