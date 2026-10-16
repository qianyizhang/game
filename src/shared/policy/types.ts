/** Evidence plumbing only. Each game owns observations, legality, timing and outcomes. */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };
export interface StudySetup {
  id: string;
  difficulty: string;
  stratum: string;
  setup: JsonObject;
}
export interface StudyDefinition {
  setups: readonly StudySetup[];
  defaultSetup: JsonObject;
  ranking: string;
  reviewPath: string;
}
export interface PolicyConfig {
  setup: JsonObject;
  policySeed: string;
  options: JsonObject;
}
export interface Proposal<C> {
  command: C;
  /** Deterministic public candidate evaluations (0–1e9 per decision), not elapsed compute time. */
  work: number;
  diagnostics?: Json;
}
export interface PolicyFactory<O, C> {
  id: string;
  version: string;
  create(config: PolicyConfig): (input: O) => Proposal<C>;
}
export interface EpisodeAdapter<S, O, C> {
  game: string;
  identity: JsonObject;
  create(seed: string, setup: JsonObject): S;
  observe(state: S): O;
  act(state: S, command: C): { state: S; error?: string };
  isCommand(this: void, value: unknown): value is C;
  terminal(state: S): boolean;
  metrics(state: S): JsonObject;
  /** Packing-independent accepted-command units, owned by the game. */
  cursor(state: S): number;
  marker(state: S): string;
  replay(state: S): Json;
  restore(replay: Json): S;
}
export interface EpisodeOptions {
  seed: string;
  setup: JsonObject;
  policySeed: string;
  policyOptions: JsonObject;
  maxDecisions: number;
}
export interface DecisionRecord {
  index: number;
  marker: string;
  before: number;
  after: number;
  input: Json;
  inputDigest: string;
  /** Raw JSON output is retained even if it is malformed. */
  output: Json;
  accepted: boolean;
  error: string | null;
  failureStage: 'factory' | 'decision' | 'output' | 'command' | null;
}
export interface PolicyRollout {
  schema: 'policy-rollout-1';
  game: string;
  identity: JsonObject;
  policy: { id: string; version: string };
  options: EpisodeOptions;
  provenance: JsonObject;
  decisions: DecisionRecord[];
  episode: {
    status: 'terminal' | 'timeout' | 'error';
    metrics: JsonObject;
    decisions: number;
    work: number;
    cursor: number;
  };
  replay: Json;
  digest: string;
}
export type Verdict = 'passed' | 'failed' | 'unavailable';
export interface PolicyAudit {
  integrity: Verdict;
  replay: Verdict;
  inputs: Verdict;
  decisions: Verdict;
  firstMismatch: { decision: number | null; path: string; expected: Json; actual: Json } | null;
  message: string;
}
