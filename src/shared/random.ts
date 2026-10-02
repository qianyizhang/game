/** Serializable, platform-independent PRNG. No rules code may use Math.random. */
export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (const character of seed) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0 || 1;
}

export function random(state: number): [number, number] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let value = Math.imul(next ^ (next >>> 15), next | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return [((value ^ (value >>> 14)) >>> 0) / 4294967296, next];
}

export function shuffle<T>(items: readonly T[], rng: number): [T[], number] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const [value, next] = random(rng);
    rng = next;
    const j = Math.floor(value * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return [result, rng];
}
