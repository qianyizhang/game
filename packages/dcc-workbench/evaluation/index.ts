/** Measurements and reviewer judgments share a report, never an invented overall score. */
export type Dimension =
  'timing' | 'mechanics' | 'readability' | 'plausibility' | 'reference-fidelity';
type Base = { id: string; title: string; dimension: Dimension; rationale: string };
export type Criterion = Base &
  (
    | {
        kind: 'metric';
        metric: string;
        unit: string;
        min?: number;
        max?: number;
        basis: 'technical' | 'art-direction';
      }
    | { kind: 'rubric'; prompt: string }
  );
export type Measurement = { value: number; unit: string; coverage: string };
export type Observation = {
  criterion: string;
  judgment: 'pass' | 'revise';
  reviewer: string;
  reason: string;
  evidence: string[];
};
export type Finding = {
  criterion: Criterion;
  status: 'pass' | 'revise' | 'unassessed';
  measurement?: Measurement;
  observation?: Observation;
  reason: string;
};

/** Rig-independent seam: a profile, measured signals and explicit review observations. */
export function evaluate(
  criteria: Criterion[],
  measurements: Record<string, Measurement>,
  observations: Observation[] = [],
): Finding[] {
  if (new Set(criteria.map((c) => c.id)).size !== criteria.length)
    throw new Error('Duplicate evaluation criterion');
  if (new Set(observations.map((o) => o.criterion)).size !== observations.length)
    throw new Error('Duplicate review observation');
  return criteria.map((criterion): Finding => {
    if (criterion.kind === 'rubric') {
      const observation = observations.find((o) => o.criterion === criterion.id);
      if (
        !observation ||
        !observation.reviewer.trim() ||
        !observation.reason.trim() ||
        !observation.evidence.length
      )
        return {
          criterion,
          status: 'unassessed',
          reason: 'Requires a reviewer, reasoning and evidence.',
        };
      return { criterion, observation, status: observation.judgment, reason: observation.reason };
    }
    if (
      (criterion.min === undefined && criterion.max === undefined) ||
      [criterion.min, criterion.max].some((v) => v !== undefined && !Number.isFinite(v)) ||
      (criterion.min !== undefined && criterion.max !== undefined && criterion.min > criterion.max)
    )
      throw new Error(`Invalid metric bounds: ${criterion.id}`);
    const measurement = measurements[criterion.metric];
    if (
      !measurement ||
      !Number.isFinite(measurement.value) ||
      measurement.unit !== criterion.unit ||
      !measurement.coverage.trim()
    )
      return {
        criterion,
        status: 'unassessed',
        reason: 'Missing finite measurement with matching units and coverage.',
      };
    const pass =
      (criterion.min === undefined || measurement.value >= criterion.min) &&
      (criterion.max === undefined || measurement.value <= criterion.max);
    return {
      criterion,
      measurement,
      status: pass ? 'pass' : 'revise',
      reason: pass ? 'Within the stated profile bounds.' : 'Outside the stated profile bounds.',
    };
  });
}
