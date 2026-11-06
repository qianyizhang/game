export interface HistoryAsset {
  id: string;
  name: string;
  group: string;
  width: number;
  height: number;
  /** Last editable-source output registered, even if its revision is later removed. */
  sourceDigest?: string;
  sourceRevision?: string;
}
export interface ArtAttempt {
  id: string;
  title: string;
  date: string;
  outcome: 'returned' | 'failed' | 'manual' | 'unknown';
  notes: string;
  /** Exact requests and prompts remain in their existing owning record, once per attempt. */
  files: string[];
}
export interface ArtRevision {
  id: string;
  asset: string | null;
  attempt: string;
  label: string;
  file: string;
  digest: string;
  parents: string[];
  /** Null means inspectable source material, without a game-compatible adaptation. */
  runtimeFile: string | null;
  runtimeDigest: string | null;
  notes: string;
}
export interface ArtHistory {
  schema: 1;
  assets: HistoryAsset[];
  attempts: ArtAttempt[];
  revisions: ArtRevision[];
}
export type HistoryDocument =
  { kind: 'text'; text: string } | { kind: 'image'; url: string; animated: boolean };
export interface HistoryState {
  version: string;
  history: ArtHistory;
  selections: Record<string, { revision: string; digest: string }>;
  previews: Record<string, string>;
  documents?: Record<string, HistoryDocument>;
  live: boolean;
  current: Record<string, string>;
}
