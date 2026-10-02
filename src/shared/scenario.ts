/** Small input validators shared by independent, game-specific scenario factories. */
export function object(value: unknown, allowed?: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Setup must be an object.');
  if (allowed)
    for (const key of Object.keys(value))
      if (!allowed.includes(key)) throw new Error(`Unknown setup field: ${key}.`);
  return value as Record<string, unknown>;
}
export function integer(
  value: unknown,
  name: string,
  min: number,
  max: number,
  fallback?: number,
): number {
  if (value === undefined && fallback !== undefined) return fallback;
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max)
    throw new Error(`${name}: expected an integer from ${min} to ${max}.`);
  return Number(value);
}
export function ids(
  value: unknown,
  name: string,
  known: Record<string, unknown>,
  min: number,
  max: number,
): string[] {
  if (!Array.isArray(value) || value.length < min || value.length > max)
    throw new Error(`${name}: expected ${min}–${max} IDs.`);
  return value.map((id, i) => {
    if (typeof id !== 'string' || !Object.hasOwn(known, id))
      throw new Error(`${name}[${i}]: unknown ID ${String(id)}.`);
    return id;
  });
}
