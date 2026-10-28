import manifest from './baked/manifest.json';
import type { StudyId } from './catalogue';

export type BakedStudy = { sha256: string; bytes: number; seconds: number; tracks: number };
const urls = import.meta.glob<string>('./baked/*.glb', {
  eager: true,
  import: 'default',
  query: '?url',
});

/** Fixed procedural studies are published files; absence never starts a generator. */
export function bakedStudy(id: StudyId) {
  const asset = (manifest.assets as Record<string, BakedStudy>)[id];
  const url = urls[`./baked/${id}.glb`];
  if (!asset || !url) throw new Error(`Baked study ${id} is unavailable. Run assets:bake.`);
  return { ...asset, url };
}
