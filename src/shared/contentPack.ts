export interface ContentPack<T> {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  description: string;
  source: string;
  content: T;
}
export interface ContentPin {
  id: string;
  version: string;
  digest: string;
}
function canonical(value: unknown): string {
  if (typeof value === 'function') return '[trusted hook: versioned by its pack]';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(',')}}`;
  return JSON.stringify(value) ?? 'undefined';
}
/** Portable data checksum, not a security signature. Hook changes require a pack/rules version bump. */
export function contentDigest(value: unknown): string {
  let hash = 2166136261;
  for (const char of canonical(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export function validatePack(pack: ContentPack<unknown>) {
  if (!/^[a-z][a-z0-9.-]+$/.test(pack.id) || !/^\d+\.\d+\.\d+$/.test(pack.version))
    throw new Error(
      `${pack.source}: pack needs a stable ID and semantic version (for example 1.0.0).`,
    );
  if (!pack.name || typeof pack.enabled !== 'boolean')
    throw new Error(`${pack.source}: pack name and enabled flag are required.`);
}
export function assemble<T extends { id: string }, P>(
  base: readonly T[],
  packs: readonly ContentPack<P>[],
  select: (content: P) => readonly T[],
  validate: (definition: T) => void,
): T[] {
  const allIds = new Set(base.map((d) => d.id));
  const packIds = new Set<string>();
  const result = [...base];
  for (const pack of packs) {
    validatePack(pack);
    if (packIds.has(pack.id)) throw new Error(`${pack.source}: duplicate pack ID ${pack.id}.`);
    packIds.add(pack.id);
    for (const entry of select(pack.content)) {
      if (!/^[a-z][\w:.-]*$/i.test(entry.id) || allIds.has(entry.id))
        throw new Error(`${pack.source}: duplicate or invalid content ID ${entry.id}.`);
      allIds.add(entry.id);
      try {
        validate(entry);
      } catch (error) {
        throw new Error(`${pack.source} → ${entry.id}: ${String(error)}`);
      }
      if (pack.enabled) result.push(entry);
    }
  }
  return result;
}
export function pins(
  base: unknown,
  packs: readonly ContentPack<unknown>[],
  version: number,
): ContentPin[] {
  return [
    { id: 'base', version: String(version), digest: contentDigest(base) },
    ...packs
      .filter((p) => p.enabled)
      .map((p) => ({ id: p.id, version: p.version, digest: contentDigest(p.content) })),
  ];
}
export function finite(value: number, name: string, min: number, max: number) {
  if (!Number.isFinite(value) || value < min || value > max)
    throw new Error(`${name} must be ${min}–${max}.`);
}
