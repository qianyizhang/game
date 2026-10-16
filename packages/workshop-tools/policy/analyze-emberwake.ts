import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual as equal } from 'node:util';
import type { Json, JsonObject, StudyDefinition } from '../../../src/shared/policy/types';
import { MAX_ARTIFACT_BYTES } from '../../../src/shared/policy/artifact.ts';
import { compareScores, scoreVector } from '../../../src/shared/policy/scoring.ts';
import { repositoryRoot, sha256 } from '../runtime-bundle.ts';
import { binaryContrast, holm } from './calibration.ts';
import { withRuntime } from './runtime.ts';
import { auditPassed, summarizeStudy, winInterval, type StudyRow } from './study.ts';

export const DESIGN = { blocks: 60, companionBlocks: 10, workers: 4 } as const;
export const POLICY_VERSION = 'emberwake-policy-8';
export const CONTRASTS = [
  {
    name: 'immediate-difficulty',
    aTier: 'relaxed',
    aPolicy: 'immediate',
    bTier: 'standard',
    bPolicy: 'immediate',
  },
  {
    name: 'survival-difficulty',
    aTier: 'standard',
    aPolicy: 'survival',
    bTier: 'severe',
    bPolicy: 'survival',
  },
  {
    name: 'standard-strength',
    aTier: 'standard',
    aPolicy: 'survival',
    bTier: 'standard',
    bPolicy: 'immediate',
  },
] as const;
export const CONTRASTS_BY_HERO = {
  barbarian: CONTRASTS,
  sorceress: CONTRASTS,
  necromancer: CONTRASTS,
} as const;
export const VIABILITY = [
  { tier: 'relaxed', policy: 'immediate' },
  { tier: 'standard', policy: 'survival' },
] as const;
export const VIABILITY_BY_HERO = {
  barbarian: VIABILITY,
  sorceress: VIABILITY,
  necromancer: VIABILITY,
} as const;
export const CRITERIA = {
  minimumPairedMaterialGap: 0.2,
  familyAlpha: 0.05,
  viabilityWilsonLower: 0.5,
  severeMinimumVictories: 1,
  practicalTimeTie: 0.05,
} as const;
// Retain these exact accepted sources before the first confirmation attempt.
export const SELECTION_PATH = 'test-results/emberwake-strength/strength5-freeze/selection.json';
const selectionDigest = '1d0f7d1ecb810cf88673214d79ddc57f25927f12948e27b99e85b091dec09220';
export const analysisPaths = [
  SELECTION_PATH,
  'packages/workshop-tools/policy/analyze-emberwake.ts',
  'packages/workshop-tools/policy/calibration.ts',
  'packages/workshop-tools/policy/study.ts',
  'docs/research/experiments/2026-10-16-emberwake-strength-5-protocol.md',
  'tests/fixtures/emberwake-v2-continuity.json',
  'tests/fixtures/emberwake-v3-continuity.json',
  'tests/fixtures/emberwake-v4-continuity.json',
  'test-results/emberwake-strength/strength5-freeze/producer.ts',
  'test-results/emberwake-strength/strength5-freeze/resource-preflight.json',
] as const;
const heroes = ['barbarian', 'sorceress', 'necromancer'] as const;
const tiers = ['relaxed', 'standard', 'severe'] as const;
const primaryPolicies = ['immediate', 'survival'];
const companionPolicies = ['growth'];
const scoreDefinition = {
  components: [
    { name: 'won', direction: 'maximize' },
    { name: 'bosses', direction: 'maximize' },
    { name: 'wards', direction: 'maximize' },
    { name: 'regions', direction: 'maximize' },
    { name: 'victoryTicks', direction: 'minimize' },
  ],
} as const;
export interface Plan {
  schema: 'emberwake-strength-plan-5';
  namespace: 'EMBERWAKE-STRENGTH-5';
  blocks: number;
  companionBlocks: number;
  workers: number;
  criteria: { [K in keyof typeof CRITERIA]: number };
  contrasts: Readonly<
    Record<
      'barbarian' | 'sorceress' | 'necromancer',
      readonly {
        name: string;
        aTier: string;
        aPolicy: string;
        bTier: string;
        bPolicy: string;
      }[]
    >
  >;
  viability: Readonly<
    Record<'barbarian' | 'sorceress' | 'necromancer', readonly { tier: string; policy: string }[]>
  >;
  bundleDigest: string;
  runtime: string;
  runtimeDigests: Record<string, string>;
  analysisDigests: Record<string, string>;
}
export type Selection = Pick<Plan, 'contrasts' | 'viability'>;
interface Provenance {
  sourceDigests: Record<string, string>;
  toolDigests: Record<string, string>;
  bundleDigest: string;
  runtime: string;
}
export interface Contract {
  plan: Plan;
  identity: JsonObject;
  game: string;
  study: StudyDefinition;
  policies: { id: string; version: string }[];
  provenance: Provenance;
}
export interface Report {
  schema: string;
  game: string;
  identity: unknown;
  split: string;
  seeds: string[];
  policySeed: string;
  maxDecisions: number;
  workers: number;
  rolloutFormat: string;
  rolloutSuffix: string;
  study: StudyDefinition;
  provenance: Provenance;
  rows: StudyRow[];
}
export interface Protocol extends Omit<Report, 'rows'> {
  policies: Contract['policies'];
}
const hex = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const validPins = (pins: Record<string, string>) =>
  pins &&
  typeof pins === 'object' &&
  !Array.isArray(pins) &&
  Object.keys(pins).length > 0 &&
  Object.values(pins).every(hex);
const pinsFor = async (paths: readonly string[]) =>
  Object.fromEntries(
    await Promise.all(
      paths.map(
        async (path) => [path, sha256(await readFile(resolve(repositoryRoot, path)))] as const,
      ),
    ),
  );
const setupId = (hero: string, tier: string) => `${hero}-${tier}`;

/** A completed-DEV choice is explicit per hero; no preferred policy is inferred. */
export function validateSelection(selection: Selection): void {
  const validEndpoint = (tier: string, policy: string) =>
    tiers.some((v) => v === tier) && primaryPolicies.includes(policy);
  if (
    !equal(Object.keys(selection.contrasts ?? {}).sort(), [...heroes].sort()) ||
    heroes.some(
      (hero) =>
        !Array.isArray(selection.contrasts[hero]) ||
        !selection.contrasts[hero].length ||
        new Set(
          selection.contrasts[hero].map((v: Plan['contrasts']['barbarian'][number]) => v.name),
        ).size !== selection.contrasts[hero].length ||
        selection.contrasts[hero].some(
          (v: Plan['contrasts']['barbarian'][number]) =>
            !v.name || !validEndpoint(v.aTier, v.aPolicy) || !validEndpoint(v.bTier, v.bPolicy),
        ),
    ) ||
    !equal(Object.keys(selection.viability ?? {}).sort(), [...heroes].sort()) ||
    heroes.some(
      (hero) =>
        !Array.isArray(selection.viability[hero]) ||
        !selection.viability[hero].length ||
        selection.viability[hero].some(
          (v: Plan['viability']['barbarian'][number]) => !validEndpoint(v.tier, v.policy),
        ),
    )
  )
    throw new Error('Invalid confirmation contrast/viability endpoints.');
}

/** Analysis-only strict5% tie; native score2 keeps exact winning ticks. */
export function materialScoreSign(a: Json | undefined, b: Json | undefined): -1 | 0 | 1 {
  const av = scoreVector(scoreDefinition, a),
    bv = scoreVector(scoreDefinition, b);
  if (
    av[0] === 1 &&
    bv[0] === 1 &&
    av.slice(0, 4).every((v, i) => v === bv[i]) &&
    20 * Math.abs(av[4] - bv[4]) < Math.max(av[4], bv[4])
  )
    return 0;
  return compareScores(scoreDefinition, av, bv);
}

/** Build exact CURRENT native5 and transitive tool/source pins, never an episode. */
export async function emberwakeContract() {
  return withRuntime({ game: 'emberwake' }, async (runtime, provenance) => {
    if (
      runtime.adapter.identity.rules !== 'emberwake-5' ||
      runtime.adapter.identity.observation !== 'emberwake-observation-3' ||
      runtime.adapter.identity.score !== 'emberwake-performance-2' ||
      !equal(runtime.study.score, scoreDefinition)
    )
      throw new Error('Confirmation requires authoritative native5, observation3 and score2.');
    const policies = Object.values(runtime.builtins).map(({ id, version }) => ({ id, version }));
    if (
      !equal(policies.map((p) => p.id).sort(), ['growth', 'immediate', 'survival']) ||
      policies.some((p) => p.version !== POLICY_VERSION) ||
      !equal(
        runtime.study.setups,
        heroes.flatMap((hero) =>
          tiers.map((difficulty) => ({
            id: setupId(hero, difficulty),
            difficulty,
            stratum: hero,
            setup: { hero, difficulty },
          })),
        ),
      )
    )
      throw new Error('Current hero/tier/policy contract differs from confirmation5.');
    // This selection is chosen from completed DEV, retained and pinned BEFORE any cohort.
    const selectionBytes = await readFile(resolve(repositoryRoot, SELECTION_PATH), 'utf8');
    if (sha256(selectionBytes) !== selectionDigest)
      throw new Error('Retained selection differs from the accepted confirmation design.');
    const selected = JSON.parse(selectionBytes) as Selection;
    validateSelection(selected);
    const analysisDigests = await pinsFor(analysisPaths);
    if (analysisDigests[SELECTION_PATH] !== sha256(selectionBytes))
      throw new Error('Selection source drift during contract construction.');
    return {
      plan: {
        schema: 'emberwake-strength-plan-5',
        namespace: 'EMBERWAKE-STRENGTH-5',
        ...DESIGN,
        criteria: CRITERIA,
        contrasts: selected.contrasts,
        viability: selected.viability,
        bundleDigest: provenance.bundleDigest,
        runtime: provenance.runtime,
        runtimeDigests: { ...provenance.sourceDigests, ...provenance.toolDigests },
        analysisDigests,
      } satisfies Plan,
      identity: runtime.adapter.identity,
      game: runtime.adapter.game,
      study: runtime.study,
      policies,
      provenance,
      bundle: await readFile(fileURLToPath(runtime.moduleURL)),
    };
  });
}

/** Summary/receipt validation only: reported audits and encoded hashes are NOT raw proof. */
export function validateStudies(
  current: Contract,
  plan: Plan,
  primary: Report,
  primaryProtocol: Protocol,
  companion: Report,
  companionProtocol: Protocol,
) {
  if (
    current.identity.rules !== 'emberwake-5' ||
    current.identity.observation !== 'emberwake-observation-3' ||
    current.identity.score !== 'emberwake-performance-2' ||
    !equal(current.study.score, scoreDefinition) ||
    !validPins(plan.runtimeDigests) ||
    !validPins(plan.analysisDigests) ||
    !hex(plan.bundleDigest) ||
    !equal(plan, current.plan) ||
    plan.schema !== 'emberwake-strength-plan-5' ||
    plan.namespace !== 'EMBERWAKE-STRENGTH-5' ||
    !Number.isInteger(plan.blocks) ||
    plan.blocks < 1 ||
    plan.blocks > 400 ||
    !Number.isInteger(plan.companionBlocks) ||
    plan.companionBlocks < 1 ||
    plan.companionBlocks > plan.blocks ||
    !Number.isInteger(plan.workers) ||
    plan.workers < 1 ||
    plan.workers > 4 ||
    !equal(plan.runtimeDigests, {
      ...current.provenance.sourceDigests,
      ...current.provenance.toolDigests,
    }) ||
    plan.bundleDigest !== current.provenance.bundleDigest ||
    plan.runtime !== current.provenance.runtime ||
    analysisPaths.some((path) => !hex(plan.analysisDigests[path]))
  )
    throw new Error('Frozen plan differs from complete current runtime/analysis contract.');
  const c = plan.criteria;
  if (
    !c ||
    Object.values(c).some((value) => !Number.isFinite(value)) ||
    c.minimumPairedMaterialGap <= 0 ||
    c.minimumPairedMaterialGap > 1 ||
    c.familyAlpha <= 0 ||
    c.familyAlpha >= 1 ||
    c.viabilityWilsonLower <= 0 ||
    c.viabilityWilsonLower >= 1 ||
    !Number.isInteger(c.severeMinimumVictories) ||
    c.severeMinimumVictories < 1 ||
    c.severeMinimumVictories > plan.blocks + plan.companionBlocks ||
    c.practicalTimeTie !== 0.05
  )
    throw new Error('Invalid confirmation criteria.');
  validateSelection(plan);
  const seeds = Array.from(
    { length: plan.blocks },
    (_, i) => `${plan.namespace}-RESERVED-${String(i + 1).padStart(2, '0')}`,
  );
  const subset = seeds.slice(0, plan.companionBlocks);
  const validate = (report: Report, protocol: Protocol, population: string[], ids: string[]) => {
    const policies = ids.map((id) => current.policies.find((p) => p.id === id)!);
    for (const [value, schema, game] of [
      [report, 'policy-study-2', current.game],
      [protocol, 'policy-study-protocol-2', 'emberwake'],
    ] as const) {
      if (
        value.schema !== schema ||
        value.game !== game ||
        value.split !== 'evaluation' ||
        !equal(value.identity, current.identity) ||
        !equal(value.seeds, population) ||
        value.policySeed !== 'POLICY-STREAM-1' ||
        value.maxDecisions !== 8000 ||
        value.workers !== plan.workers ||
        value.rolloutFormat !== 'gzip' ||
        value.rolloutSuffix !== '.json.gzip' ||
        !equal(value.study, current.study) ||
        !equal(value.provenance, current.provenance)
      )
        throw new Error(
          'Report/protocol differs from frozen population/options/encoding/native provenance.',
        );
    }
    if (!equal(protocol.policies, policies) || !Array.isArray(report.rows))
      throw new Error('Report/protocol policy grid differs from frozen factories.');
    for (const row of report.rows) {
      const m = row.metrics,
        receipt = row.rollout;
      if (
        !m ||
        !row.audit ||
        ![0, 1].includes(m.won as number) ||
        !Number.isSafeInteger(row.work) ||
        row.work < 0 ||
        !hex(row.digest) ||
        !receipt ||
        receipt.format !== 'gzip' ||
        !hex(receipt.sha256) ||
        !hex(receipt.decodedSha256) ||
        ![receipt.bytes, receipt.decodedBytes].every(
          (v) => Number.isSafeInteger(v) && v > 0 && v <= MAX_ARTIFACT_BYTES,
        ) ||
        receipt.file !== `${row.seed}-${row.setupId}-${row.policy}.rollout.json.gzip`
      )
        throw new Error(
          'Rows require numeric binary wins, work/digests and exact bounded gzip receipts.',
        );
      if (
        ['bosses', 'wards', 'regions', 'executedTicks', 'level', 'xp', 'gold'].some(
          (k) => typeof m[k] !== 'number' || !Number.isSafeInteger(m[k]) || Number(m[k]) < 0,
        ) ||
        typeof m.hp !== 'number' ||
        !Number.isFinite(m.hp) ||
        m.hp < 0 ||
        Number(m.bosses) > 4 ||
        Number(m.wards) > 8 ||
        Number(m.regions) > 20 ||
        Number(m.executedTicks) > 100000 ||
        m.progress !== Number(m.bosses) * 10000 + Number(m.wards) * 100 + Number(m.regions) ||
        !equal(m.score, [m.won, m.bosses, m.wards, m.regions, m.won === 1 ? m.executedTicks : 0]) ||
        ((row.status === 'timeout' || row.status === 'error') && m.won !== 0)
      )
        throw new Error('Forged native progress/score/win or nonfinite native metrics.');
    }
    return summarizeStudy(report.rows, current.study, ids, population);
  };
  const primarySummary = validate(primary, primaryProtocol, seeds, primaryPolicies);
  const companionSummary = validate(companion, companionProtocol, subset, companionPolicies);
  const rows = [...primary.rows, ...companion.rows];
  const find = (seed: string, hero: string, tier: string, policy: string) =>
    rows.find((r) => r.seed === seed && r.setupId === setupId(hero, tier) && r.policy === policy)!;
  const nativeKind = (row: StudyRow) => {
    const m = row.metrics;
    if (
      row.status === 'terminal' &&
      m.outcome === 'victory' &&
      m.won === 1 &&
      Number(m.hp) > 0 &&
      m.bosses === 4 &&
      m.wards === 8 &&
      m.regions === 20
    )
      return 'victory';
    if (row.status === 'terminal' && m.outcome === 'dead' && m.won === 0 && m.hp === 0)
      return 'death';
    if (row.status === 'timeout' && m.outcome === 'playing' && m.won === 0 && Number(m.hp) > 0)
      return 'timeout';
    return 'invalid';
  };
  const invalid = rows.filter(
    (row) => !row.audit || !auditPassed(row.audit) || nativeKind(row) === 'invalid',
  );
  const compare = (a: StudyRow, b: StudyRow, practical: boolean) =>
    nativeKind(a) === 'invalid' ||
    nativeKind(b) === 'invalid' ||
    !auditPassed(a.audit) ||
    !auditPassed(b.audit)
      ? null
      : practical
        ? materialScoreSign(a.metrics.score, b.metrics.score)
        : compareScores(
            scoreDefinition,
            scoreVector(scoreDefinition, a.metrics.score),
            scoreVector(scoreDefinition, b.metrics.score),
          );
  const counts = (values: (number | null)[]) => ({
    attempted: values.length,
    better: values.filter((v) => v === 1).length,
    worse: values.filter((v) => v === -1).length,
    tied: values.filter((v) => v === 0).length,
    invalid: values.filter((v) => v === null).length,
  });
  const family = heroes.flatMap((hero) =>
    plan.contrasts[hero].map(({ name, aTier, aPolicy, bTier, bPolicy }) => {
      const pairs = seeds.map(
        (seed) => [find(seed, hero, aTier, aPolicy), find(seed, hero, bTier, bPolicy)] as const,
      );
      const signs = pairs.map(([a, b]) => compare(a, b, true));
      const aWins = pairs.filter(([a]) => a.metrics.won === 1).length,
        bWins = pairs.filter(([, b]) => b.metrics.won === 1).length;
      return {
        id: `${hero}-${name}`,
        hero,
        exact: counts(pairs.map(([a, b]) => compare(a, b, false))),
        ...binaryContrast(signs.map((sign) => [Number(sign === 1), Number(sign === -1)] as const)),
        materialTies: signs.filter((sign) => sign === 0).length,
        invalidPairs: signs.filter((sign) => sign === null).length,
        method:
          'Two-sided exact conditional binomial sign test on discordant practical score2 pairs; bits encode material superiority, not native wins.',
        effect:
          'Net proportion of blocks with materially higher score: (A better minus B better)/ALL matched blocks; not a victory-rate or time-percent effect.',
        victoryDescriptive: {
          a: winInterval(aWins, seeds.length),
          b: winInterval(bWins, seeds.length),
          difference: (aWins - bWins) / seeds.length,
          pairedInterval95: null,
        },
      };
    }),
  );
  const adjusted = holm(family.map((item) => ({ id: item.id, p: item.exactP })));
  const tests = family.map((item) => {
    const adjustedP = adjusted.find((p) => p.id === item.id)!.adjustedP;
    return {
      ...item,
      adjustedP,
      passed: item.difference >= c.minimumPairedMaterialGap && adjustedP < c.familyAlpha,
    };
  });
  const viability = heroes.flatMap((hero) =>
    plan.viability[hero].map(({ tier, policy }) => {
      const wins = winInterval(
        seeds.filter((seed) => find(seed, hero, tier, policy).metrics.won === 1).length,
        seeds.length,
      );
      return { hero, tier, policy, wins, passed: wins.interval95[0] > c.viabilityWilsonLower };
    }),
  );
  const severeExistence = heroes.map((hero) => {
    const victories = rows.filter(
      (r) =>
        r.stratum === hero &&
        r.difficulty === 'severe' &&
        ['survival', 'growth'].includes(r.policy) &&
        nativeKind(r) === 'victory' &&
        auditPassed(r.audit),
    ).length;
    return {
      hero,
      declaredAttempts: plan.blocks + plan.companionBlocks,
      victories,
      passed: victories >= c.severeMinimumVictories,
      scope:
        'Observed terminal existence with reported audits only; independent raw verification required, no population>=5% claim.',
    };
  });
  const matched = rows.filter((r) => subset.includes(r.seed));
  const matchedSummary = summarizeStudy(
    matched,
    current.study,
    [...primaryPolicies, ...companionPolicies],
    subset,
  );
  const descriptive = current.study.setups.flatMap((setup) =>
    [
      ['survival', 'immediate'],
      ['growth', 'immediate'],
      ['survival', 'growth'],
    ].map(([a, b]) => ({
      setupId: setup.id,
      a,
      b,
      exact: counts(
        subset.map((seed) =>
          compare(
            find(seed, setup.stratum, setup.difficulty, a),
            find(seed, setup.stratum, setup.difficulty, b),
            false,
          ),
        ),
      ),
      practical: counts(
        subset.map((seed) =>
          compare(
            find(seed, setup.stratum, setup.difficulty, a),
            find(seed, setup.stratum, setup.difficulty, b),
            true,
          ),
        ),
      ),
    })),
  );
  const label = (r: StudyRow) => ({ seed: r.seed, setupId: r.setupId, policy: r.policy });
  return {
    schema: 'emberwake-strength-analysis-5',
    family: tests,
    viability,
    severeExistence,
    primarySummary,
    companionSummary,
    matchedSummary,
    descriptive,
    integrity: invalid.length === 0,
    invalidRows: invalid.map(label),
    completion: {
      attempts: rows.length,
      nativeWins: rows.filter((r) => nativeKind(r) === 'victory').length,
      nativeDeaths: rows.filter((r) => nativeKind(r) === 'death').map(label),
      budgetStops: rows.filter((r) => nativeKind(r) === 'timeout').map(label),
      errors: rows.filter((r) => r.status === 'error').map(label),
    },
    allCriteriaPassed:
      invalid.length === 0 &&
      tests.every((t) => t.passed) &&
      viability.every((v) => v.passed) &&
      severeExistence.every((v) => v.passed),
    limits: `Summary validation does not independently prove raw artifact/container/header/input/policy integrity. Paired intervals unavailable. ${tests.length}-test Holm only; no hero pooling, total policy order, Survival Relaxed/Standard time order, population Severe5%, compute-isolated causality or human-equivalent claim. Native errors/timeouts remain nonwins; invalid pairs retain denominator but block promotion. Primary effect is practical score superiority, not victory difference or speed percentage.`,
  };
}

export async function analyzeEmberwake(
  directory: string,
  companionDirectory: string,
  planPath: string,
  outPath: string,
) {
  const planBytes = await readFile(planPath, 'utf8'),
    plan = JSON.parse(planBytes) as Plan;
  const current = await emberwakeContract();
  if (!equal(plan, current.plan))
    throw new Error('Frozen plan differs from current contract before reading source paths.');
  const pins = { ...plan.runtimeDigests, ...plan.analysisDigests };
  const verifyPins = async () => {
    if (!equal(await pinsFor(Object.keys(pins)), pins))
      throw new Error('Source drift before/after Emberwake analysis.');
  };
  await verifyPins();
  const read = async (dir: string, name: string) => readFile(resolve(dir, name), 'utf8');
  const [report, protocol, companion, companionProtocol] = await Promise.all([
    read(directory, 'report.json'),
    read(directory, 'protocol.json'),
    read(companionDirectory, 'report.json'),
    read(companionDirectory, 'protocol.json'),
  ]);
  const result = validateStudies(
    current,
    plan,
    JSON.parse(report) as Report,
    JSON.parse(protocol) as Protocol,
    JSON.parse(companion) as Report,
    JSON.parse(companionProtocol) as Protocol,
  );
  for (const dir of [directory, companionDirectory])
    if (
      sha256(await readFile(resolve(dir, 'bundles', `${plan.bundleDigest}.mjs`))) !==
      plan.bundleDigest
    )
      throw new Error('Retained bundle differs from frozen current native5.');
  await verifyPins();
  const inference = {
    ...result,
    planDigest: sha256(planBytes),
    reportDigest: sha256(report),
    protocolDigest: sha256(protocol),
    companionReportDigest: sha256(companion),
    companionProtocolDigest: sha256(companionProtocol),
  };
  await writeFile(outPath, JSON.stringify(inference, null, 2) + '\n', { flag: 'wx' });
  return inference;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [directory, companion, plan, out] = process.argv.slice(2);
  if (!directory || !companion || !plan || !out || process.argv.length !== 6)
    throw new Error('Usage: analyze-emberwake.ts PRIMARY COMPANION PLAN NEW_OUTPUT');
  await analyzeEmberwake(directory, companion, plan, out);
}
