import { isList, objectValue } from '../../../src/shared/json.ts';
import type {
  RecruitmentCase,
  RecruitmentReport,
} from '../../../src/engines/hearth-recruitment-experiment';
import type { RecruitmentRuntime } from './recruitment-runtime.ts';

export { objectValue };
export function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error('Expected finite numeric receipt field');
  return value;
}
export function text(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Expected string receipt field');
  return value;
}
export function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('Expected boolean receipt field');
  return value;
}
export function list(value: unknown): unknown[] {
  if (!isList(value)) throw new Error('Expected array receipt field');
  return value;
}
export function cohort(value: unknown): RecruitmentCase['cohort'] {
  if (value !== 'development' && value !== 'evaluation') throw new Error('Unknown cohort.');
  return value;
}
export function caseSpec(value: unknown, runtime: RecruitmentRuntime): RecruitmentCase {
  const spec = objectValue(value);
  const expected = runtime.recruitmentCases(cohort(spec.cohort)).find((row) => row.id === spec.id);
  if (!expected || JSON.stringify(expected) !== JSON.stringify(value))
    throw new Error('Unknown or modified case.');
  return expected;
}
export function status(value: unknown): RecruitmentReport['status'] {
  if (value !== 'complete' && value !== 'limit' && value !== 'error')
    throw new Error('Expected episode status');
  return value;
}
/** Validate receipt fields before comparison; replay reconstruction is the audit's separate job. */
export function recruitmentReport(
  value: unknown,
  replay: string,
  runtime: RecruitmentRuntime,
): RecruitmentReport {
  const row = objectValue(value),
    spec = caseSpec(row.spec, runtime);
  const config = runtime.recruitmentSetup(spec);
  if (JSON.stringify(config) !== JSON.stringify(row.config))
    throw new Error('Receipt configuration mismatch');
  const metrics = objectValue(row.metrics);
  return {
    seed: text(row.seed),
    focalSeat: number(row.focalSeat),
    config,
    status: status(row.status),
    ...(row.error === undefined ? {} : { error: text(row.error) }),
    placements: list(row.placements).map((value) => (value === null ? null : number(value))),
    survivalRounds: list(row.survivalRounds).map(number),
    rounds: number(row.rounds),
    commands: number(row.commands),
    decisionMs: number(row.decisionMs),
    replayVerified: boolean(row.replayVerified),
    replay,
    spec,
    metrics: {
      turns: list(metrics.turns).map((value) => {
        const turn = objectValue(value);
        return {
          step: number(turn.step),
          round: number(turn.round),
          hp: number(turn.hp),
          gold: number(turn.gold),
          tier: number(turn.tier),
          board: number(turn.board),
        };
      }),
      upgrades: list(metrics.upgrades).map((value) => {
        const upgrade = objectValue(value);
        return {
          step: number(upgrade.step),
          round: number(upgrade.round),
          cost: number(upgrade.cost),
          tierBefore: number(upgrade.tierBefore),
          reason: text(upgrade.reason),
        };
      }),
      changedChoices: number(metrics.changedChoices),
      interventions: Object.fromEntries(
        Object.entries(objectValue(metrics.interventions)).map(([key, value]) => [
          key,
          number(value),
        ]),
      ),
    },
  };
}
