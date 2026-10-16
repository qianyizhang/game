/** Exact paired sign test on discordant binary outcomes (McNemar's conditional test).
 * No normal/t approximation and no zero-width paired confidence interval.
 */
export function binaryContrast(pairs: readonly (readonly [number, number])[]) {
  if (
    !pairs.length ||
    pairs.length > 400 ||
    pairs.some((pair) => pair.length !== 2 || pair.some((v) => v !== 0 && v !== 1))
  )
    throw new Error('Contrast requires 1–400 complete paired binary outcomes.');
  const aOnly = pairs.filter(([a, b]) => a === 1 && b === 0).length;
  const bOnly = pairs.filter(([a, b]) => a === 0 && b === 1).length;
  const discordant = aOnly + bOnly;
  let mass = 2 ** -discordant,
    tail = mass;
  for (let k = 1; k <= Math.min(aOnly, bOnly); k++) {
    mass *= (discordant - k + 1) / k;
    tail += mass;
  }
  return {
    n: pairs.length,
    difference: (aOnly - bOnly) / pairs.length,
    aOnly,
    bOnly,
    exactP: Math.min(1, 2 * tail),
    pairedInterval95: null,
    method:
      'Two-sided exact conditional binomial test on discordant paired wins; paired interval unavailable.',
  };
}

/** Holm family correction: planned contrasts must all be supplied, including negative results. */
export function holm(contrasts: readonly { id: string; p: number }[]) {
  if (
    !contrasts.length ||
    new Set(contrasts.map((c) => c.id)).size !== contrasts.length ||
    contrasts.some((c) => !Number.isFinite(c.p) || c.p < 0 || c.p > 1)
  )
    throw new Error('Invalid contrast family.');
  let previous = 0;
  const adjusted = new Map(
    [...contrasts]
      .sort((a, b) => a.p - b.p)
      .map((contrast, index) => {
        previous = Math.max(previous, Math.min(1, contrast.p * (contrasts.length - index)));
        return [contrast.id, previous] as const;
      }),
  );
  return contrasts.map((c) => ({ ...c, adjustedP: adjusted.get(c.id)! }));
}
