import type { ContentPin } from '../contentPack';
export interface EvidenceEvent {
  kind: 'pick' | 'skip' | 'encounter' | 'action';
  name: string;
  offered?: string[];
  choice?: string;
  metrics?: Record<string, number>;
}
export interface EvidenceSummary {
  outcome: 'active' | 'won' | 'lost';
  context: string;
  metrics: Record<string, number>;
}
export interface Observer<S, C> {
  summary: (state: S) => EvidenceSummary;
  events: (before: S, command: C, after: S) => EvidenceEvent[];
}
export interface RunEvidence {
  id: string;
  game: string;
  version: number;
  content: readonly ContentPin[];
  seed: string;
  mode: 'normal' | 'practice';
  source: 'human' | 'imported' | 'automated';
  startedAt: string;
  updatedAt: string;
  startStep: number;
  steps: number;
  tail: string;
  setup?: unknown;
  summary: EvidenceSummary;
  events: (EvidenceEvent & { step: number })[];
  droppedEvents: number;
}
