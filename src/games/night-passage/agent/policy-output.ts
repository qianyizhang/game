import { isRecord } from '../../../shared/json';
import { validCommand } from '../domain/game';
import type { Decision } from './policy';

/** Retain JSON transport output, or an explicit marker for a value JSON cannot represent. */
export function policyOutput(value: unknown): unknown {
  try {
    const text = JSON.stringify(value);
    return text === undefined
      ? { unavailable: `Non-JSON ${typeof value}` }
      : (JSON.parse(text) as unknown);
  } catch {
    return { unavailable: 'Policy output is not JSON serializable' };
  }
}

/** Validate at the evaluator boundary before reading a custom JavaScript policy's fields. */
export function policyDecision(value: unknown): Decision {
  if (!isRecord(value) || !isRecord(value.work) || !validCommand(value.command))
    throw new Error('Malformed policy decision: command and work are required.');
  const work = value.work;
  if (
    !['entities', 'candidates', 'geometry', 'total'].every(
      (key) => typeof work[key] === 'number' && Number.isSafeInteger(work[key]) && work[key] >= 0,
    ) ||
    work.total !== Number(work.entities) + Number(work.candidates) + Number(work.geometry)
  )
    throw new Error(
      'Malformed policy decision: work must contain consistent nonnegative integer counts.',
    );
  if (!validCommand(policyOutput(value.command)))
    throw new Error('Malformed policy decision: proposal is not JSON serializable.');
  return { command: value.command, work: work as unknown as Decision['work'] };
}
