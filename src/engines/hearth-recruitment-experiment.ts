import {
  RECRUITMENT_POLICIES,
  decideRecruitmentV2,
  type RecruitmentPolicyId,
  type RecruitmentV2Decision,
} from '../games/battlegrounds/ai/recruitment-v2';
import { decideRecruitment } from '../games/battlegrounds/ai/recruitment-policy';
import { mixedRivalsConfig, type StyleVisibility } from '../games/battlegrounds/domain/arena';
import { arenaSession } from '../games/battlegrounds/application/arena';
import { runArenaEpisode, type ArenaReport, type ArenaTrace } from './hearth-arena-experiment';

export type RecruitmentCohort = 'development' | 'evaluation';
export type RivalPopulation = 'classic' | 'mixed';
export const RECRUITMENT_PLAN = {
  schema: 'hearth.recruitment-experiment.v2',
  heroes: ['forgekeeper', 'quartermaster', 'wildspeaker', 'archivist', 'oathkeeper'],
  policies: Object.keys(RECRUITMENT_POLICIES) as RecruitmentPolicyId[],
  populations: ['classic', 'mixed'] as RivalPopulation[],
  visibilities: { development: ['hidden'], evaluation: ['hidden', 'disclosed'] } as Record<
    RecruitmentCohort,
    StyleVisibility[]
  >,
  seeds: {
    development: Array.from({ length: 5 }, (_, i) => `HEARTH-R2-DEV-20261004-${i + 1}`),
    evaluation: Array.from({ length: 5 }, (_, i) => `HEARTH-R2-EVAL-20261004-${i + 1}`),
  },
  maxCommands: 6000,
  simulations: 0,
  primary: 'mean focal placement; lower is better',
  uncertainty:
    'five seed-block means per population/visibility; eight seat rotations are correlated',
  hypotheses: {
    earlierUpgrades:
      'Add the 2/4/6/8/10 round cadence and smaller board readiness threshold; retain Tempo valuation, survival reserve and mandatory-action priority.',
    fundReplacement:
      'At an otherwise finished full-board turn with two gold, sell the weakest unit to afford an improving offer. Require empty hand, action headroom and no competing upgrade budget.',
  },
  promotion:
    'No automatic promotion. Examine both populations, block variation and factorial effects; small cohort estimates are not general strength guarantees.',
} as const;
export interface RecruitmentCase {
  id: string;
  cohort: RecruitmentCohort;
  block: number;
  seed: string;
  hero: string;
  population: RivalPopulation;
  seat: number;
  policy: RecruitmentPolicyId;
  visibility: StyleVisibility;
}
export function recruitmentCases(cohort: RecruitmentCohort): RecruitmentCase[] {
  if (cohort !== 'development' && cohort !== 'evaluation') throw new Error('Unknown cohort.');
  const cases: RecruitmentCase[] = [];
  for (const [block, seed] of RECRUITMENT_PLAN.seeds[cohort].entries())
    for (const population of RECRUITMENT_PLAN.populations)
      for (const visibility of RECRUITMENT_PLAN.visibilities[cohort])
        for (let seat = 0; seat < 8; seat++)
          for (const policy of RECRUITMENT_PLAN.policies)
            cases.push({
              id: `${block + 1}-${population}-${visibility}-seat${seat}-${policy}`,
              cohort,
              block,
              seed,
              hero: RECRUITMENT_PLAN.heroes[block],
              population,
              seat,
              policy,
              visibility,
            });
  return cases;
}
export function recruitmentSetup(spec: RecruitmentCase) {
  const base = mixedRivalsConfig(spec.seed, spec.hero, spec.visibility);
  return {
    ...base,
    visibilitySeat: spec.seat,
    seats: Array.from({ length: 8 }, (_, id) => ({
      ...base.seats[(id - spec.seat + 8) % 8],
      ...(id === spec.seat
        ? {
            style: spec.policy === 'baseline-v1' ? ('baseline-v1' as const) : ('tempo-v1' as const),
          }
        : spec.population === 'classic'
          ? { style: 'baseline-v1' as const }
          : {}),
    })),
  };
}
export interface RecruitmentTrace extends ArenaTrace {
  controller: string | null;
}
export interface RecruitmentMetrics {
  turns: { step: number; round: number; hp: number; gold: number; tier: number; board: number }[];
  upgrades: { step: number; round: number; cost: number; tierBefore: number; reason: string }[];
  changedChoices: number;
  interventions: Record<string, number>;
}
export interface RecruitmentReport extends ArenaReport {
  spec: RecruitmentCase;
  metrics: RecruitmentMetrics;
}
export function runRecruitmentEpisode(
  spec: RecruitmentCase,
  onDecision?: (row: RecruitmentTrace) => void,
): RecruitmentReport {
  const expected = recruitmentCases(spec.cohort).find((c) => c.id === spec.id);
  if (JSON.stringify(expected) !== JSON.stringify(spec))
    throw new Error('Case does not match the frozen plan.');
  const config = recruitmentSetup(spec);
  const metrics: RecruitmentMetrics = {
    turns: [],
    upgrades: [],
    changedChoices: 0,
    interventions: {},
  };
  const report = runArenaEpisode(spec.seed, config, spec.seat, {
    maxCommands: RECRUITMENT_PLAN.maxCommands,
    decide: (frame, style) =>
      frame.observation.self.id === spec.seat
        ? decideRecruitmentV2(frame, spec.policy)
        : decideRecruitment(frame, style),
    onDecision: (row) => {
      const actor = row.input?.observation.self;
      if (actor?.id === spec.seat) {
        const decision = row.decision as RecruitmentV2Decision;
        if (decision.command.type === 'endRecruit')
          metrics.turns.push({
            step: row.step,
            round: row.input!.observation.round,
            hp: actor.hp,
            gold: actor.gold,
            tier: actor.tier,
            board: actor.board.length,
          });
        if (decision.command.type === 'upgrade')
          metrics.upgrades.push({
            step: row.step,
            round: row.input!.observation.round,
            cost: actor.upgradeCost,
            tierBefore: actor.tier,
            reason: decision.reason,
          });
        if (
          JSON.stringify(decision.command) !==
          JSON.stringify(decision.diagnostics.legacyDecision.command)
        )
          metrics.changedChoices++;
        for (const intervention of decision.diagnostics.interventions)
          if (intervention.selected)
            metrics.interventions[intervention.id] =
              (metrics.interventions[intervention.id] ?? 0) + 1;
      }
      onDecision?.({
        ...row,
        controller: actor
          ? actor.id === spec.seat
            ? spec.policy
            : config.seats[actor.id].style
          : null,
      });
    },
  });
  return { ...report, spec: structuredClone(spec), metrics };
}

const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
function estimate(values: number[]) {
  const average = mean(values);
  return {
    mean: average,
    blocks: values.length,
    standardError:
      values.length > 1
        ? Math.sqrt(
            values.reduce((sum, v) => sum + (v - average!) ** 2, 0) /
              (values.length - 1) /
              values.length,
          )
        : null,
  };
}
/** Require complete matched grids, not merely an equal number of successes. */
export function compareRecruitmentReports(
  reports: readonly RecruitmentReport[],
  cohort: RecruitmentCohort,
) {
  const cases = recruitmentCases(cohort),
    excluded: { seed: string; reason: string }[] = [];
  const included: RecruitmentReport[] = [];
  const unexpected = reports.filter(
    (r) => !cases.some((c) => JSON.stringify(c) === JSON.stringify(r.spec)),
  );
  let negativeControlPairs = 0;
  for (const seed of RECRUITMENT_PLAN.seeds[cohort]) {
    const expected = cases.filter((c) => c.seed === seed),
      rows = reports.filter((r) => r.spec.seed === seed);
    let reason = '';
    if (
      rows.length !== expected.length ||
      expected.some((c) => rows.filter((r) => r.spec.id === c.id).length !== 1)
    )
      reason = 'Missing or duplicate case.';
    if (!reason)
      for (const c of expected) {
        const r = rows.find((r) => r.spec.id === c.id)!;
        if (
          r.status !== 'complete' ||
          !r.replayVerified ||
          r.placements.length !== 8 ||
          r.placements.some((p) => p === null || !Number.isInteger(p) || p < 1 || p > 8) ||
          new Set(r.placements).size !== 8
        )
          reason = 'Incomplete, failed or unverified lobby.';
        try {
          const replay = JSON.parse(r.replay);
          if (
            JSON.stringify(r.spec) !== JSON.stringify(c) ||
            r.seed !== c.seed ||
            r.focalSeat !== c.seat ||
            JSON.stringify(r.config) !== JSON.stringify(recruitmentSetup(c)) ||
            replay.seed !== c.seed ||
            replay.game !== arenaSession.rules.game ||
            replay.version !== arenaSession.rules.version ||
            JSON.stringify(replay.commands?.[0]) !==
              JSON.stringify({ type: 'configure', config: r.config }) ||
            JSON.stringify(replay.content) !== JSON.stringify(arenaSession.rules.content)
          )
            reason = 'Setup, receipt or replay mismatch.';
        } catch {
          reason = 'Malformed replay.';
        }
      }
    if (!reason && cohort === 'evaluation') {
      for (const hidden of rows.filter(
        (r) =>
          r.spec.visibility === 'hidden' &&
          (r.spec.population === 'classic' || r.spec.policy === 'baseline-v1'),
      )) {
        const visible = rows.find(
          (r) =>
            r.spec.population === hidden.spec.population &&
            r.spec.seat === hidden.spec.seat &&
            r.spec.policy === hidden.spec.policy &&
            r.spec.visibility === 'disclosed',
        )!;
        if (
          JSON.stringify(JSON.parse(hidden.replay).commands.slice(1)) !==
          JSON.stringify(JSON.parse(visible.replay).commands.slice(1))
        )
          reason = 'Disclosure negative control changed gameplay.';
      }
    }
    if (reason) excluded.push({ seed, reason });
    else {
      included.push(...rows);
      if (cohort === 'evaluation') negativeControlPairs += 48;
    }
  }
  const strata = RECRUITMENT_PLAN.populations.flatMap((population) =>
    RECRUITMENT_PLAN.visibilities[cohort].map((visibility) => {
      const rows = included.filter(
        (r) => r.spec.population === population && r.spec.visibility === visibility,
      );
      const blocks = RECRUITMENT_PLAN.seeds[cohort]
        .filter((seed) => rows.some((r) => r.seed === seed))
        .map((seed) => {
          const placements = Object.fromEntries(
            RECRUITMENT_PLAN.policies.map((policy) => [
              policy,
              mean(
                rows
                  .filter((r) => r.seed === seed && r.spec.policy === policy)
                  .map((r) => r.placements[r.focalSeat]!),
              )!,
            ]),
          ) as Record<RecruitmentPolicyId, number>;
          return {
            seed,
            placements,
            upgradeEffect:
              (placements['tempo-v1'] -
                placements['tempo-upgrade-v2'] +
                (placements['tempo-spend-v2'] - placements['tempo-both-v2'])) /
              2,
            spendingEffect:
              (placements['tempo-v1'] -
                placements['tempo-spend-v2'] +
                (placements['tempo-upgrade-v2'] - placements['tempo-both-v2'])) /
              2,
            interaction:
              placements['tempo-upgrade-v2'] +
              placements['tempo-spend-v2'] -
              placements['tempo-v1'] -
              placements['tempo-both-v2'],
          };
        });
      return {
        population,
        visibility,
        blocks,
        policies: RECRUITMENT_PLAN.policies.map((policy) => {
          const selected = rows.filter((r) => r.spec.policy === policy),
            positions = selected.map((r) => r.placements[r.focalSeat]!);
          return {
            policy,
            lobbies: selected.length,
            meanPlacement: mean(positions),
            firstPlaces: positions.filter((p) => p === 1).length,
            topFour: positions.filter((p) => p <= 4).length,
            meanSurvivalRounds: mean(selected.map((r) => r.survivalRounds[r.focalSeat])),
            versusClassic: estimate(
              blocks.map((b) => b.placements['baseline-v1'] - b.placements[policy]),
            ),
            versusTempo: estimate(
              blocks.map((b) => b.placements['tempo-v1'] - b.placements[policy]),
            ),
            changedChoices: selected.reduce((sum, r) => sum + r.metrics.changedChoices, 0),
            checkpoints: [2, 5, 9].map((round) => {
              const turns = selected.flatMap((r) =>
                r.metrics.turns.filter((t) => t.round === round),
              );
              return {
                round,
                survivingTurns: turns.length,
                meanTier: mean(turns.map((t) => t.tier)),
                meanUnusedGold: mean(turns.map((t) => t.gold)),
                meanBoard: mean(turns.map((t) => t.board)),
                meanHp: mean(turns.map((t) => t.hp)),
              };
            }),
          };
        }),
        upgradeEffect: estimate(blocks.map((b) => b.upgradeEffect)),
        spendingEffect: estimate(blocks.map((b) => b.spendingEffect)),
        interaction: estimate(blocks.map((b) => b.interaction)),
      };
    }),
  );
  const disclosure =
    cohort === 'evaluation'
      ? RECRUITMENT_PLAN.populations.flatMap((population) =>
          RECRUITMENT_PLAN.policies.map((policy) => {
            const pairs = RECRUITMENT_PLAN.seeds[cohort].flatMap((seed) => {
              const rows = included.filter(
                (r) =>
                  r.seed === seed && r.spec.population === population && r.spec.policy === policy,
              );
              if (!rows.length) return [];
              return [
                mean(
                  rows
                    .filter((r) => r.spec.visibility === 'hidden')
                    .map((r) => r.placements[r.focalSeat]!),
                )! -
                  mean(
                    rows
                      .filter((r) => r.spec.visibility === 'disclosed')
                      .map((r) => r.placements[r.focalSeat]!),
                  )!,
              ];
            });
            return { population, policy, hiddenMinusDisclosed: estimate(pairs) };
          }),
        )
      : [];
  return {
    plannedLobbies: cases.length,
    includedLobbies: included.length,
    excluded,
    unexpected: unexpected.map((r) => r.spec.id),
    negativeControlPairs,
    strata,
    disclosure,
  };
}
