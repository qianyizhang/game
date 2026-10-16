import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { binaryContrast, holm } from './calibration.ts';
import {
  auditPassed,
  cohortSeeds,
  summarizeStudy,
  winInterval,
  meanInterval,
  type StudyRow,
} from './study.ts';
import { repositoryRoot, sha256 } from '../runtime-bundle.ts';
import type { StudyDefinition } from '../../../src/shared/policy/types';

/** Preregistered Spire strength-3 analysis. Separate from the raw descriptive study report. */
async function main() {
  const [directory, companionDirectory, planPath, outPath] = process.argv.slice(2);
  if (!directory || !companionDirectory || !planPath || !outPath || process.argv.length !== 6)
    throw new Error(
      'Usage: analyze-spire.ts PRIMARY_DIRECTORY COMPANION_DIRECTORY FROZEN_PLAN NEW_ANALYSIS',
    );
  const planBytes = await readFile(planPath, 'utf8');
  const plan = JSON.parse(planBytes) as {
    schema: string;
    namespace: string;
    blocks: number;
    references: Record<string, string>;
    sourceDigests: Record<string, string>;
  };
  if (
    plan.schema !== 'spire-strength-plan-2' ||
    plan.namespace !== 'SPIRE-STRENGTH-3' ||
    plan.blocks !== 100 ||
    JSON.stringify(plan.references) !== JSON.stringify({ ironclad: 'survival', silent: 'survival' })
  )
    throw new Error('Unrecognized frozen Spire analysis plan.');
  const validPins = (value: Record<string, string>) =>
    value &&
    Object.keys(value).length > 0 &&
    Object.values(value).every((hash) => typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash));
  const requiredPins = [
    'packages/workshop-tools/policy/analyze-spire.ts',
    'packages/workshop-tools/policy/calibration.ts',
    'packages/workshop-tools/policy/study.ts',
    'src/games/spire/agent/policy.ts',
    'src/games/spire/agent/tactics.ts',
    'src/games/spire/domain/game.ts',
    'src/games/spire/domain/combat.ts',
    'docs/research/experiments/2026-10-16-spire-strength-3-protocol.md',
  ];
  if (!validPins(plan.sourceDigests) || requiredPins.some((path) => !plan.sourceDigests[path]))
    throw new Error('Frozen plan requires complete analysis, policy and native source pins.');
  for (const [path, expected] of Object.entries(plan.sourceDigests))
    if (sha256(await readFile(resolve(repositoryRoot, path))) !== expected)
      throw new Error(`Analysis source drift: ${path}`);
  type Report = {
    identity: unknown;
    game: string;
    split: string;
    seeds: string[];
    study: StudyDefinition;
    rows: StudyRow[];
    maxDecisions: number;
    policySeed: string;
    provenance: { sourceDigests: Record<string, string>; toolDigests: Record<string, string> };
  };
  type Protocol = {
    game: string;
    split: string;
    identity: unknown;
    policySeed: string;
    study: StudyDefinition;
    seeds: string[];
    maxDecisions: number;
    policies: { id: string; version: string }[];
    provenance: unknown;
  };
  const reportBytes = await readFile(resolve(directory, 'report.json'), 'utf8');
  const report = JSON.parse(reportBytes) as Report;
  const protocol = JSON.parse(
    await readFile(resolve(directory, 'protocol.json'), 'utf8'),
  ) as Protocol;
  const companionBytes = await readFile(resolve(companionDirectory, 'report.json'), 'utf8');
  const companion = JSON.parse(companionBytes) as Report;
  const companionProtocol = JSON.parse(
    await readFile(resolve(companionDirectory, 'protocol.json'), 'utf8'),
  ) as Protocol;
  const expectedPolicies = [
    { id: 'survival', version: 'spire-policy-3' },
    { id: 'legacy-reference', version: 'spire-policy-1' },
  ];
  const seeds = cohortSeeds('evaluation', plan.namespace, plan.blocks);
  const expectedSetups = ['ironclad', 'silent'].flatMap((character) =>
    [0, 2, 5].map((ascension) => ({
      id: `${character}-a${ascension}`,
      difficulty: `ascension-${ascension}`,
      stratum: character,
      setup: { character, ascension },
    })),
  );
  const validate = (
    candidate: Report,
    contract: Protocol,
    population: string[],
    policies: { id: string; version: string }[],
  ) => {
    if (
      candidate.game !== 'slay-the-spire' ||
      candidate.split !== 'evaluation' ||
      JSON.stringify(candidate.seeds) !== JSON.stringify(population)
    )
      throw new Error('Study population differs from frozen plan.');
    if (
      candidate.maxDecisions !== 2000 ||
      candidate.policySeed !== 'POLICY-STREAM-1' ||
      contract.game !== 'spire' ||
      contract.split !== 'evaluation' ||
      contract.policySeed !== 'POLICY-STREAM-1' ||
      JSON.stringify(contract.identity) !== JSON.stringify(candidate.identity) ||
      JSON.stringify(contract.study) !== JSON.stringify(candidate.study) ||
      contract.maxDecisions !== 2000 ||
      JSON.stringify(contract.seeds) !== JSON.stringify(population) ||
      JSON.stringify(contract.policies) !== JSON.stringify(policies) ||
      JSON.stringify(contract.provenance) !== JSON.stringify(candidate.provenance)
    )
      throw new Error('Study protocol differs from frozen policy/budget contract.');
    if (JSON.stringify(candidate.study.setups) !== JSON.stringify(expectedSetups))
      throw new Error('Study setup differs from frozen plan.');
    const pins = { ...candidate.provenance.sourceDigests, ...candidate.provenance.toolDigests };
    const expectedPins = Object.keys(plan.sourceDigests)
      .filter(
        (path) =>
          !path.startsWith('docs/') &&
          (policies.some((p) => p.id === 'legacy-reference') || !path.startsWith('test-results/')),
      )
      .sort();
    if (
      !validPins(candidate.provenance.sourceDigests) ||
      !validPins(candidate.provenance.toolDigests) ||
      JSON.stringify(Object.keys(pins).sort()) !== JSON.stringify(expectedPins) ||
      Object.entries(pins).some(([path, hash]) => plan.sourceDigests[path] !== hash)
    )
      throw new Error('Study provenance is incomplete or differs from the frozen plan.');
    return summarizeStudy(
      candidate.rows,
      candidate.study,
      policies.map((p) => p.id),
      population,
    );
  };
  validate(report, protocol, seeds, expectedPolicies);
  const companionSummary = validate(companion, companionProtocol, seeds.slice(0, 20), [
    { id: 'immediate', version: 'spire-policy-3' },
    { id: 'growth', version: 'spire-policy-3' },
  ]);
  const find = (seed: string, setupId: string, policy: string) =>
    report.rows.find(
      (row) => row.seed === seed && row.setupId === setupId && row.policy === policy,
    )!;
  const contrasts = Object.entries(plan.references).flatMap(([character, policy]) => [
    {
      id: `${character}-strength`,
      ...binaryContrast(
        seeds.map(
          (seed) =>
            [
              Number(find(seed, `${character}-a0`, policy).metrics.won),
              Number(find(seed, `${character}-a0`, 'legacy-reference').metrics.won),
            ] as const,
        ),
      ),
    },
    {
      id: `${character}-difficulty`,
      ...binaryContrast(
        seeds.map(
          (seed) =>
            [
              Number(find(seed, `${character}-a0`, policy).metrics.won),
              Number(find(seed, `${character}-a5`, policy).metrics.won),
            ] as const,
        ),
      ),
    },
  ]);
  const adjusted = holm(contrasts.map((c) => ({ id: c.id, p: c.exactP })));
  const family = contrasts.map((c) => ({
    ...c,
    adjustedP: adjusted.find((a) => a.id === c.id)!.adjustedP,
  }));
  const strata = Object.entries(plan.references).map(([character, policy]) => {
    const levels = [0, 2, 5].map((a) => {
      const rows = seeds.map((seed) => find(seed, `${character}-a${a}`, policy));
      return {
        ascension: a,
        wins: winInterval(rows.filter((r) => r.metrics.won === 1).length, rows.length),
        progress: meanInterval(rows.map((r) => Number(r.metrics.progress))),
      };
    });
    const strength = family.find((c) => c.id === `${character}-strength`)!;
    const difficulty = family.find((c) => c.id === `${character}-difficulty`)!;
    const strengthPassed =
      levels[0].wins.interval95[0] > 0.1 && strength.difference >= 0.1 && strength.adjustedP < 0.05;
    const ordered =
      levels[0].wins.rate >= levels[1].wins.rate && levels[1].wins.rate >= levels[2].wins.rate;
    const difficultyPassed = ordered && difficulty.difference >= 0.1 && difficulty.adjustedP < 0.05;
    return {
      character,
      policy,
      levels,
      strengthPassed,
      difficultyPassed,
      scope: 'Statistical thresholds only; promotion also requires overall integrity.',
      ordered,
      adjacentProgress: [0, 1].map((i) => ({
        a: levels[i].ascension,
        b: levels[i + 1].ascension,
        ...meanInterval(
          seeds.map(
            (seed) =>
              Number(find(seed, `${character}-a${levels[i].ascension}`, policy).metrics.progress) -
              Number(
                find(seed, `${character}-a${levels[i + 1].ascension}`, policy).metrics.progress,
              ),
          ),
        ),
      })),
    };
  });
  const integrity = [...report.rows, ...companion.rows].every(
    (row) => row.status === 'terminal' && auditPassed(row.audit),
  );
  const result = {
    schema: 'spire-strength-analysis-3',
    planDigest: sha256(planBytes),
    reportDigest: sha256(reportBytes),
    companionReportDigest: sha256(companionBytes),
    companionSummary,
    family,
    strata,
    integrity,
    allCriteriaPassed: integrity && strata.every((s) => s.strengthPassed && s.difficultyPassed),
    limits:
      'Paired confidence intervals unavailable. Adjacent win-rate significance not claimed. Policies use different work; no human-equivalent strength claim.',
  };
  await writeFile(outPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(result, null, 2));
}
try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
