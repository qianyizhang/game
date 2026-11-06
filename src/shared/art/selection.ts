import selected from './selected-art.json';

/** Build-time presentation snapshots. History and mutation validation belong to workshop-tools. */
export interface ArtSelection {
  revision: string;
  digest: string;
  svg: string;
}
const selections: Readonly<Record<string, ArtSelection>> = selected;

export function selectedArt(id: string | undefined) {
  return id ? selections[id] : undefined;
}
