import type { Json, ScoreDefinition } from './types';

/** Reject missing components rather than quietly treating historical metrics as zero. */
export function scoreVector(definition: ScoreDefinition, value: Json | undefined): number[] {
  const { components } = definition;
  if (
    !components.length ||
    new Set(components.map((c) => c.name)).size !== components.length ||
    components.some((c) => !c.name.trim() || !['maximize', 'minimize'].includes(c.direction)) ||
    !Array.isArray(value) ||
    value.length !== components.length ||
    value.some((v) => typeof v !== 'number' || !Number.isFinite(v))
  )
    throw new Error('Score requires the declared finite numeric components.');
  return value as number[];
}

/** Positive means a ranks above b. Earlier components always take precedence. */
export function compareScores(
  definition: ScoreDefinition,
  a: readonly number[],
  b: readonly number[],
): -1 | 0 | 1 {
  scoreVector(definition, [...a]);
  scoreVector(definition, [...b]);
  for (let index = 0; index < definition.components.length; index++) {
    if (a[index] === b[index]) continue;
    const larger = a[index] > b[index];
    return larger === (definition.components[index].direction === 'maximize') ? 1 : -1;
  }
  return 0;
}
