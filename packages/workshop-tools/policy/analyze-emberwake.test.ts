import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  validateStudies,
  analysisPaths,
  CRITERIA,
  CONTRASTS_BY_HERO,
  materialScoreSign,
  validateSelection,
  VIABILITY_BY_HERO,
  type Contract,
  type Plan,
  type Report,
  type Protocol,
} from './analyze-emberwake.ts';
import { encodeRolloutArtifact } from './artifact.ts';
import { sha256 } from '../runtime-bundle.ts';
import type { StudyRow } from './study.ts';

// Deliberately SYNTHETIC contract/outcomes/receipt claims. This suite does not execute
// native5, a policy, a reserved seed or an independent raw artifact audit.
function synthetic(blocks = 60) {
  const heroes = ['barbarian', 'sorceress', 'necromancer'],
    tiers = ['relaxed', 'standard', 'severe'];
  const identity = {
    rules: 'emberwake-5',
    observation: 'emberwake-observation-3',
    score: 'emberwake-performance-2',
  };
  const provenance = {
    sourceDigests: { 'synthetic-native.ts': 'a'.repeat(64) },
    toolDigests: { 'synthetic-tool.ts': 'b'.repeat(64) },
    bundleDigest: 'c'.repeat(64),
    runtime: 'synthetic-only',
  };
  const plan: Plan = {
    schema: 'emberwake-strength-plan-5',
    namespace: 'EMBERWAKE-STRENGTH-5',
    blocks,
    companionBlocks: 10,
    workers: 4,
    criteria: { ...CRITERIA },
    contrasts: CONTRASTS_BY_HERO,
    viability: VIABILITY_BY_HERO,
    bundleDigest: provenance.bundleDigest,
    runtime: provenance.runtime,
    runtimeDigests: { ...provenance.sourceDigests, ...provenance.toolDigests },
    analysisDigests: Object.fromEntries(analysisPaths.map((p) => [p, 'd'.repeat(64)])),
  };
  const study: Contract['study'] = {
    defaultSetup: { hero: 'barbarian', difficulty: 'standard' },
    ranking: 'Synthetic score2 objective',
    reviewPath: '/?game=diablo2&review=policy',
    setups: heroes.flatMap((hero) =>
      tiers.map((difficulty) => ({
        id: `${hero}-${difficulty}`,
        stratum: hero,
        difficulty,
        setup: { hero, difficulty },
      })),
    ),
    score: {
      components: [
        { name: 'won', direction: 'maximize' },
        { name: 'bosses', direction: 'maximize' },
        { name: 'wards', direction: 'maximize' },
        { name: 'regions', direction: 'maximize' },
        { name: 'victoryTicks', direction: 'minimize' },
      ],
    },
  };
  const current: Contract = {
    plan: structuredClone(plan),
    identity,
    game: 'emberwake',
    study,
    provenance,
    policies: ['immediate', 'survival', 'growth'].map((id) => ({
      id,
      version: 'emberwake-policy-8',
    })),
  };
  const seeds = Array.from(
    { length: blocks },
    (_, i) => `EMBERWAKE-STRENGTH-5-RESERVED-${String(i + 1).padStart(2, '0')}`,
  );
  const rows = (population: string[], policies: string[]) =>
    population.flatMap((seed, index) =>
      study.setups.flatMap((setup) =>
        policies.map((policy): StudyRow => {
          const rate =
            policy === 'growth'
              ? setup.difficulty === 'severe'
                ? 0.1
                : 0.8
              : setup.difficulty === 'relaxed'
                ? 0.9
                : setup.difficulty === 'standard'
                  ? policy === 'survival'
                    ? 0.8
                    : 0.2
                  : policy === 'survival'
                    ? 0.1
                    : 0;
          const won = Number(index < Math.round(population.length * rate)),
            bosses = won ? 4 : 1,
            wards = won ? 8 : 2,
            regions = won ? 20 : 3;
          const name = `${seed}-${setup.id}-${policy}`;
          const encoded = encodeRolloutArtifact(
            JSON.stringify({ syntheticReceiptOnly: name }),
            'gzip',
          );
          return {
            seed,
            policy,
            setupId: setup.id,
            difficulty: setup.difficulty,
            stratum: setup.stratum,
            status: 'terminal',
            work: 100,
            metrics: {
              won,
              outcome: won ? 'victory' : 'dead',
              bosses,
              wards,
              regions,
              hp: won ? 80 : 0,
              executedTicks: 1000,
              level: 2,
              xp: 5,
              gold: 12,
              progress: bosses * 10000 + wards * 100 + regions,
              score: [won, bosses, wards, regions, won ? 1000 : 0],
            },
            digest: sha256(name),
            audit: {
              integrity: 'passed',
              replay: 'passed',
              inputs: 'passed',
              decisions: 'passed',
              firstMismatch: null,
              message: 'Synthetic reported audit claims, not proof.',
            },
            rollout: { ...encoded.metadata, file: name + '.rollout.json.gzip', review: null },
          };
        }),
      ),
    );
  const report = (population: string[], policies: string[]): Report => ({
    schema: 'policy-study-2',
    game: 'emberwake',
    identity,
    split: 'evaluation',
    seeds: population,
    policySeed: 'POLICY-STREAM-1',
    maxDecisions: 8000,
    workers: 4,
    rolloutFormat: 'gzip',
    rolloutSuffix: '.json.gzip',
    study,
    provenance,
    rows: rows(population, policies),
  });
  const primary = report(seeds, ['immediate', 'survival']),
    companion = report(seeds.slice(0, 10), ['growth']);
  const protocol = (report: Report, ids: string[]): Protocol => {
    const { rows: unused, ...metadata } = report;
    void unused;
    return {
      ...metadata,
      schema: 'policy-study-protocol-2',
      policies: ids.map((id) => ({ id, version: 'emberwake-policy-8' })),
    };
  };
  return {
    current,
    plan,
    primary,
    primaryProtocol: protocol(primary, ['immediate', 'survival']),
    companion,
    companionProtocol: protocol(companion, ['growth']),
  };
}
type Fixture = ReturnType<typeof synthetic>;
const evaluate = (f: Fixture) =>
  validateStudies(
    f.current,
    f.plan,
    f.primary,
    f.primaryProtocol,
    f.companion,
    f.companionProtocol,
  );
const alter = (change: (f: Fixture) => void) => {
  const f = synthetic();
  change(f);
  return evaluate(f);
};
const row = (f: Fixture, policy = 'immediate', tier = 'severe') =>
  f.primary.rows.find(
    (r) =>
      r.stratum === 'barbarian' &&
      r.policy === policy &&
      r.difficulty === tier &&
      r.metrics.won === 0,
  )!;

void test('complete synthetic1170 grid keeps hero denominators, nine contrasts and270 matched style cells', () => {
  const result = evaluate(synthetic());
  assert.equal(result.allCriteriaPassed, true);
  assert.equal(result.integrity, true);
  assert.equal(result.completion.attempts, 1170);
  assert.equal(result.family.length, 9);
  assert(result.family.every((r) => r.n === 60 && r.passed));
  assert.equal(result.viability.length, 6);
  assert(result.viability.every((r) => r.passed));
  assert(result.severeExistence.every((r) => r.declaredAttempts === 70 && r.passed));
  assert.equal(
    result.matchedSummary.summary.reduce((n, r) => n + r.attempts, 0),
    270,
  );
  assert.equal(result.matchedSummary.summary.length, 27);
  assert.equal(result.descriptive.length, 27);
  assert.match(result.limits, /does not independently prove raw/);
});
void test('sample count is read from a frozen synthetic contract, including synthetic80 without pooled denominators', () => {
  const result = evaluate(synthetic(80));
  assert.equal(result.completion.attempts, 1530);
  assert(result.family.every((r) => r.n === 80));
  assert(result.severeExistence.every((r) => r.declaredAttempts === 90));
  assert.throws(() => evaluate(synthetic(401)), /complete current/);
});
void test('valid living timeout remains a nonwin, while execution errors and unavailable audits block promotion', () => {
  const timed = alter((f) => {
    const r = row(f);
    r.status = 'timeout';
    r.metrics.outcome = 'playing';
    r.metrics.hp = 4;
  });
  assert.equal(timed.allCriteriaPassed, true);
  assert.equal(timed.completion.budgetStops.length, 1);
  assert.equal(timed.completion.attempts, 1170);
  const failed = alter((f) => {
    const r = row(f);
    r.status = 'error';
    r.metrics.outcome = 'playing';
    r.metrics.hp = 4;
  });
  assert.equal(failed.allCriteriaPassed, false);
  assert.equal(failed.completion.errors.length, 1);
  assert.equal(
    alter((f) => {
      row(f).audit.inputs = 'unavailable';
    }).allCriteriaPassed,
    false,
  );
});
void test('a claim of native victory needs terminal outcome, HP and all native completion counters', () => {
  for (const change of [
    (r: StudyRow) => {
      r.metrics.outcome = 'won';
    },
    (r: StudyRow) => {
      r.metrics.hp = 0;
    },
    (r: StudyRow) => {
      r.status = 'timeout';
    },
  ]) {
    const f = synthetic();
    const r = f.primary.rows.find((r) => r.metrics.won === 1)!;
    change(r);
    if (r.status === 'timeout') assert.throws(() => evaluate(f), /Forged native/);
    else assert.equal(evaluate(f).allCriteriaPassed, false);
  }
  assert.throws(
    () =>
      alter((f) => {
        row(f).metrics.score = [1, 4, 8, 20, 1000];
      }),
    /Forged native/,
  );
  assert.throws(
    () =>
      alter((f) => {
        row(f).metrics.progress = 99999;
      }),
    /Forged native/,
  );
  assert.throws(
    () =>
      alter((f) => {
        row(f).work = Number.NaN;
      }),
    /Rows require/,
  );
  assert.throws(
    () =>
      alter((f) => {
        row(f).metrics.won = true;
      }),
    /Rows require/,
  );
});
void test('missing, duplicate and mismatched hero/tier grids cannot silently shrink denominators', () => {
  assert.throws(
    () =>
      alter((f) => {
        f.primary.rows.pop();
      }),
    /incomplete or duplicated/,
  );
  assert.throws(
    () =>
      alter((f) => {
        f.primary.rows[1] = structuredClone(f.primary.rows[0]);
      }),
    /mismatched cases/,
  );
  assert.throws(
    () =>
      alter((f) => {
        f.companion.rows.pop();
      }),
    /incomplete or duplicated/,
  );
  assert.throws(
    () =>
      alter((f) => {
        f.companion.rows[0].stratum = 'sorceress';
      }),
    /mismatched cases/,
  );
});
void test('consistent but wrong budgets, streams, worker counts, seed population and policy versions are refused', () => {
  for (const change of [
    (f: Fixture) => {
      f.primary.maxDecisions = f.primaryProtocol.maxDecisions = 4000;
    },
    (f: Fixture) => {
      f.primary.policySeed = f.primaryProtocol.policySeed = 'OTHER';
    },
    (f: Fixture) => {
      f.primary.workers = f.primaryProtocol.workers = 2;
    },
    (f: Fixture) => {
      f.companion.seeds = f.companionProtocol.seeds = f.primary.seeds.slice(1, 11);
    },
    (f: Fixture) => {
      f.primaryProtocol.policies[1].version = 'emberwake-policy-5';
    },
  ])
    assert.throws(() => alter(change), /differs from frozen/);
});
void test('native4 identity, missing provenance pins and changed source receipt claims cannot masquerade as current5', () => {
  assert.throws(
    () =>
      alter((f) => {
        f.current.identity.rules = 'emberwake-4';
      }),
    /complete current/,
  );
  assert.throws(
    () =>
      alter((f) => {
        delete f.plan.analysisDigests['tests/fixtures/emberwake-v4-continuity.json'];
      }),
    /complete current/,
  );
  assert.throws(
    () =>
      alter((f) => {
        f.primary.provenance = structuredClone(f.primary.provenance);
        f.primary.provenance.bundleDigest = 'e'.repeat(64);
      }),
    /provenance/,
  );
});
void test('gzip receipt syntax, bounded bytes, exact case filename and format metadata are mandatory', () => {
  // A compact ledger/audit summary does not replace the frozen raw-rollout contract.
  assert.throws(
    () =>
      alter((f) => {
        delete row(f).rollout;
      }),
    /gzip receipts/,
  );
  for (const change of [
    (r: StudyRow) => {
      r.rollout!.format = 'json';
    },
    (r: StudyRow) => {
      r.rollout!.decodedBytes = 150000001;
    },
    (r: StudyRow) => {
      r.rollout!.sha256 = 'wrong';
    },
    (r: StudyRow) => {
      r.rollout!.decodedSha256 = 'wrong';
    },
    (r: StudyRow) => {
      r.rollout!.file = 'other.rollout.json.gzip';
    },
    (r: StudyRow) => {
      delete r.rollout;
    },
  ])
    assert.throws(() => alter((f) => change(row(f))), /gzip receipts/);
  assert.throws(
    () =>
      alter((f) => {
        f.primary.rolloutSuffix = f.primaryProtocol.rolloutSuffix = '.json.gz';
      }),
    /encoding/,
  );
});
void test('Severe existence failure is separate from statistically strong endpoints and remains observed only', () => {
  const result = alter((f) => {
    for (const r of [...f.primary.rows, ...f.companion.rows])
      if (r.difficulty === 'severe') {
        r.metrics.won = 0;
        r.metrics.outcome = 'dead';
        r.metrics.hp = 0;
        r.metrics.score = [0, r.metrics.bosses, r.metrics.wards, r.metrics.regions, 0];
      }
  });
  assert(result.family.every((r) => r.passed));
  assert(result.viability.every((r) => r.passed));
  assert(result.severeExistence.every((r) => !r.passed));
  assert.equal(result.allCriteriaPassed, false);
});
void test('sub5% analysis ties preserve official exact score2 and do not create primary material advantages', () => {
  const f = synthetic();
  const seed = f.primary.seeds[0];
  const a = f.primary.rows.find(
    (r) => r.seed === seed && r.setupId === 'barbarian-standard' && r.policy === 'survival',
  )!;
  const b = f.primary.rows.find(
    (r) => r.seed === seed && r.setupId === 'barbarian-standard' && r.policy === 'immediate',
  )!;
  a.metrics.executedTicks = 990;
  a.metrics.score = [1, 4, 8, 20, 990];
  const result = evaluate(f);
  const cell = result.descriptive.find(
    (r) => r.setupId === 'barbarian-standard' && r.a === 'survival' && r.b === 'immediate',
  )!;
  assert.equal(b.metrics.won, 1);
  assert.equal(cell.exact.better, cell.practical.better + 1);
  assert.equal(cell.practical.tied, cell.exact.tied + 1);
  assert(result.family.every((r) => r.passed));
});
void test('strict analysis5% boundary is directional, while sub5% is tied and first four score components dominate time', () => {
  const win = (ticks: number) => [1, 4, 8, 20, ticks];
  assert.equal(materialScoreSign(win(951), win(1000)), 0);
  assert.equal(materialScoreSign(win(950), win(1000)), 1);
  assert.equal(materialScoreSign(win(1000), win(950)), -1);
  assert.equal(materialScoreSign(win(949), win(1000)), 1);
  assert.equal(materialScoreSign(win(1000), win(1000)), 0);
  assert.equal(materialScoreSign(win(100000), [0, 3, 8, 20, 0]), 1);
  assert.equal(materialScoreSign([0, 3, 8, 20, 0], [0, 2, 8, 20, 0]), 1);
  assert.equal(materialScoreSign([0, 1, 3, 9, 0], [0, 1, 2, 10, 0]), 1);
});
void test('material sign bits retain all60 pairs, separate42 ties, and expose zero victory difference', () => {
  const f = synthetic();
  for (const [i, seed] of f.primary.seeds.entries())
    for (const policy of ['survival', 'immediate']) {
      const r = f.primary.rows.find(
        (r) => r.seed === seed && r.setupId === 'barbarian-standard' && r.policy === policy,
      )!;
      const ticks =
        i < 12
          ? policy === 'survival'
            ? 950
            : 1000
          : i < 18
            ? policy === 'immediate'
              ? 950
              : 1000
            : 1000;
      Object.assign(r.metrics, {
        won: 1,
        outcome: 'victory',
        bosses: 4,
        wards: 8,
        regions: 20,
        progress: 40820,
        hp: 80,
        executedTicks: ticks,
        score: [1, 4, 8, 20, ticks],
      });
    }
  const result = evaluate(f),
    contrast = result.family.find((r) => r.id === 'barbarian-standard-strength')!;
  assert.equal(contrast.n, 60);
  assert.equal(contrast.aOnly, 12);
  assert.equal(contrast.bOnly, 6);
  assert.equal(contrast.materialTies, 42);
  assert.equal(contrast.invalidPairs, 0);
  assert.equal(contrast.difference, 0.1);
  assert.equal(contrast.pairedInterval95, null);
  assert.equal(contrast.victoryDescriptive.difference, 0);
  assert.equal(contrast.victoryDescriptive.a.wins, 60);
  assert.equal(contrast.victoryDescriptive.b.wins, 60);
  assert.equal(contrast.passed, false);
  assert.match(contrast.effect, /not a victory-rate or time-percent effect/);
});
void test('source-pinned per-hero direction can differ; pure selection validates explicit per-hero direction and viability', () => {
  const f = synthetic(),
    templates = structuredClone(f.plan.contrasts);
  const reversed = templates.barbarian.map((v) =>
    v.name === 'standard-strength' ? { ...v, aPolicy: 'immediate', bPolicy: 'survival' } : v,
  );
  f.plan.contrasts = { ...templates, barbarian: reversed };
  f.current.plan = structuredClone(f.plan);
  const result = evaluate(f);
  assert.equal(result.family.find((v) => v.id === 'barbarian-standard-strength')!.difference, -0.6);
  assert.equal(result.family.find((v) => v.id === 'sorceress-standard-strength')!.difference, 0.6);
  const chosen = {
    contrasts: f.plan.contrasts,
    viability: { ...f.plan.viability, barbarian: [{ tier: 'standard', policy: 'immediate' }] },
  };
  validateSelection(chosen);
  f.plan.viability = chosen.viability;
  f.current.plan = structuredClone(f.plan);
  const viability = evaluate(f).viability;
  assert.equal(viability.find((v) => v.hero === 'barbarian')!.policy, 'immediate');
  assert(viability.some((v) => v.hero === 'sorceress' && v.policy === 'survival'));
  assert.throws(
    () =>
      validateSelection({
        ...chosen,
        contrasts: { barbarian: chosen.contrasts.barbarian } as Plan['contrasts'],
      }),
    /confirmation contrast/,
  );
});

void test('each primary contrast retains all60 exact score pairs while a sub5% winning gap remains a practical tie', () => {
  const f = synthetic();
  const baseline = evaluate(f).family.find((r) => r.id === 'barbarian-immediate-difficulty')!;
  const seed = f.primary.seeds[0];
  const relaxed = f.primary.rows.find(
    (r) => r.seed === seed && r.setupId === 'barbarian-relaxed' && r.policy === 'immediate',
  )!;
  const standard = f.primary.rows.find(
    (r) => r.seed === seed && r.setupId === 'barbarian-standard' && r.policy === 'immediate',
  )!;
  assert.equal(relaxed.metrics.won, 1);
  assert.equal(standard.metrics.won, 1);
  relaxed.metrics.executedTicks = 990;
  relaxed.metrics.score = [1, 4, 8, 20, 990];
  const result = evaluate(f),
    changed = result.family.find((r) => r.id === 'barbarian-immediate-difficulty')!;
  assert(result.family.every((r) => r.exact.attempted === 60));
  assert.equal(changed.exact.better, baseline.exact.better + 1);
  assert.equal(changed.exact.tied, baseline.exact.tied - 1);
  assert.equal(changed.exact.worse, baseline.exact.worse);
  assert.equal(changed.exact.invalid, 0);
  for (const key of [
    'n',
    'aOnly',
    'bOnly',
    'materialTies',
    'invalidPairs',
    'difference',
    'exactP',
    'adjustedP',
    'passed',
  ] as const)
    assert.equal(changed[key], baseline[key]);
  assert.equal(result.allCriteriaPassed, true);
});
