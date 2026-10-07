/** Narrow untrusted JSON without Array.isArray's implicit any element type. */
export const isList = (value: unknown): value is unknown[] => Array.isArray(value);
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export function objectValue(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Expected a JSON object.');
  return value;
}
