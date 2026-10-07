/** Public trace data and authored case contracts. Unrecognized source payloads stay excluded. */
export interface EvidenceRef {
  thread: string;
  turn: string;
  event: string;
  role: string;
  roles?: string[];
}
export interface ResolvedRef extends EvidenceRef {
  key: string;
  roles: string[];
}
export interface TraceEvent {
  id: string;
  threadId: string;
  turnId: string;
  ordinal: number;
  role: string;
  status: string;
  paths: string[];
  relatedThreads: string[];
  sourceType?: string;
  sourceTruncated: boolean;
  kind: 'request' | 'message' | 'command' | 'edit' | 'image' | 'reference' | 'delegation';
  title: string;
  text: string;
  output?: string;
  exitCode?: number | null;
  durationMs?: number;
  preview: string;
  displayTruncated: boolean;
  key: string;
}
export interface Omission {
  type: string;
  count: number;
  refs: Array<Omit<EvidenceRef, 'role' | 'roles'> & { ordinal: number }>;
}
export interface TraceThread {
  id: string;
  title: string;
  role: string;
  parent?: string;
  source: { name: string; format: string; version: number; rawSchemaVersion: number };
  coverage: {
    totalItems: number;
    normalizedItems: number;
    unsupportedItems: Omission[];
    excludedItems: Omission[];
    truncatedItems: number;
    displayTruncatedItems: number;
  };
  turns: Array<{
    id: string;
    threadId: string;
    startedAt?: number;
    completedAt?: number;
    events: TraceEvent[];
  }>;
}
export interface Actor {
  threadId: string;
  role: string;
  contribution?: string;
  evidence?: EvidenceRef[];
}
export interface Assessment {
  criterion: string;
  subject: string;
  assessment: string;
  actor: string;
  basis: string;
  evidence: EvidenceRef[];
  note?: string;
}
export interface Stage {
  // Authored story metadata is retained as unknown, never treated as executable instructions.
  [key: string]: unknown;
  id?: string;
  title: string;
  turn: string;
  thread?: string;
  anchor?: string;
  anchorRef?: EvidenceRef;
  evidence: EvidenceRef[];
  actors?: Actor[];
  assessments?: Assessment[];
  signals?: Array<{ note: string; evidence: EvidenceRef[] }>;
  artifactEvidence?: Record<string, { producedBy?: EvidenceRef[]; inspectedBy?: EvidenceRef[] }>;
  artifactProvenance?: Record<
    string,
    {
      sourcePairing?: string;
      cameraKnown?: boolean;
      lightingKnown?: boolean;
    }
  >;
  capture?: string | null;
  fallbackCapture?: string | null;
  captures?: string[];
  captureSubjects?: string[];
  source?: string | null;
  sources?: string[];
  sourceFiles?: string[];
  sourceKey?: string;
  sourceKeys?: Record<string, string>;
  subject?: string;
  subjects?: string[];
  limits?: string[];
}
export interface CaseSpec {
  title: string;
  subtitle?: string;
  outcome?: unknown;
  threads: Array<{ id: string; role?: string; parent?: string }>;
  stages: Stage[];
  documents?: string[];
  sourceKeys?: Record<string, string>;
  sourceSubjects?: Record<string, string>;
}
export interface MediaRecord {
  path: string;
  url: string;
  sha256: string;
  bytes: number;
}
export interface SourceRecord {
  name: string;
  path: string;
  sourceKey: string;
  subject?: string;
  sha256: string;
  text: string;
  diff: { fromStage: number; text: string } | null;
}
export interface BuildOptions {
  root?: string;
  input?: string;
  output?: string;
  spec: unknown;
}

export function record(value: unknown, label = 'record'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`Expected ${label} object`);
  return value as Record<string, unknown>;
}
export function optionalRecord(value: unknown, label?: string) {
  return value == null ? {} : record(value, label);
}
export function list(value: unknown, label = 'list'): unknown[] {
  if (!Array.isArray(value)) throw new Error(`Expected ${label} array`);
  return value;
}
export function text(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Expected ${label} string`);
  return value;
}
export function identity(value: unknown, label: string) {
  const result = text(value, label);
  if (!result) throw new Error(`Missing ${label}`);
  return result;
}
export function optionalText(value: unknown, label: string): string | undefined {
  return value == null ? undefined : text(value, label);
}
export function optionalNumber(value: unknown, label: string): number | undefined {
  if (value == null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error(`Expected finite ${label}`);
  return value;
}
export function texts(value: unknown, label: string): string[] {
  return list(value, label).map((item) => text(item, label));
}
const stringMap = (value: unknown, label: string): Record<string, string> =>
  Object.fromEntries(
    Object.entries(record(value, label)).map(([key, value]) => [key, text(value, label)]),
  );

function reference(value: unknown): EvidenceRef {
  const item = record(value, 'evidence reference');
  return {
    thread: identity(item.thread, 'reference thread'),
    turn: identity(item.turn, 'reference turn'),
    event: identity(item.event, 'reference event'),
    role: text(item.role, 'reference role'),
    ...(item.roles === undefined ? {} : { roles: texts(item.roles, 'reference roles') }),
  };
}
function references(value: unknown, label: string): EvidenceRef[] {
  if (!Array.isArray(value)) throw new Error(`Missing evidence references: ${label}`);
  return value.map(reference);
}
function parseStage(value: unknown): Stage {
  const item = record(value, 'stage');
  const result: Stage = {
    ...item,
    title: identity(item.title, 'stage title'),
    turn: identity(item.turn, 'stage turn'),
    evidence: references(item.evidence, 'stage'),
  };
  for (const key of ['id', 'thread', 'anchor', 'subject', 'sourceKey'] as const)
    if (item[key] !== undefined) result[key] = text(item[key], key);
  for (const key of ['capture', 'fallbackCapture', 'source'] as const)
    if (item[key] !== undefined) result[key] = item[key] === null ? null : text(item[key], key);
  for (const key of [
    'captures',
    'captureSubjects',
    'sources',
    'sourceFiles',
    'subjects',
    'limits',
  ] as const)
    if (item[key] !== undefined) result[key] = texts(item[key], key);
  if (item.anchorRef !== undefined) result.anchorRef = reference(item.anchorRef);
  if (item.sourceKeys !== undefined) result.sourceKeys = stringMap(item.sourceKeys, 'sourceKeys');
  if (item.actors !== undefined)
    result.actors = list(item.actors, 'actors').map((value) => {
      const actor = record(value, 'actor');
      return {
        threadId: text(actor.threadId, 'actor threadId'),
        role: text(actor.role, 'actor role'),
        contribution: optionalText(actor.contribution, 'contribution'),
        evidence: references(actor.evidence ?? [], 'actor'),
      };
    });
  if (item.assessments !== undefined)
    result.assessments = list(item.assessments, 'assessments').map((value) => {
      const assessment = record(value, 'assessment');
      return {
        criterion: text(assessment.criterion, 'criterion'),
        subject: text(assessment.subject, 'subject'),
        assessment: text(assessment.assessment, 'assessment'),
        actor: text(assessment.actor, 'actor'),
        basis: text(assessment.basis, 'basis'),
        evidence: references(assessment.evidence, 'assessment'),
        note: optionalText(assessment.note, 'note'),
      };
    });
  if (item.signals !== undefined)
    result.signals = list(item.signals, 'signals').map((value) => {
      const signal = record(value, 'signal');
      return {
        note: text(signal.note, 'signal note'),
        evidence: references(signal.evidence, 'signal'),
      };
    });
  if (item.artifactEvidence !== undefined)
    result.artifactEvidence = Object.fromEntries(
      Object.entries(record(item.artifactEvidence, 'artifactEvidence')).map(([subject, value]) => {
        const refs = record(value, 'artifact refs');
        return [
          subject,
          {
            producedBy: references(refs.producedBy ?? [], 'artifact'),
            inspectedBy: references(refs.inspectedBy ?? [], 'artifact'),
          },
        ];
      }),
    );
  if (item.artifactProvenance !== undefined)
    result.artifactProvenance = Object.fromEntries(
      Object.entries(record(item.artifactProvenance, 'artifactProvenance')).map(
        ([subject, value]) => {
          const provenance = record(value, 'provenance');
          const flags: { cameraKnown?: boolean; lightingKnown?: boolean } = {};
          for (const key of ['cameraKnown', 'lightingKnown'] as const) {
            if (provenance[key] === undefined) continue;
            if (typeof provenance[key] !== 'boolean') throw new Error(`Expected boolean ${key}`);
            flags[key] = provenance[key];
          }
          return [
            subject,
            { ...flags, sourcePairing: optionalText(provenance.sourcePairing, 'sourcePairing') },
          ];
        },
      ),
    );
  return result;
}
export function parseCase(value: unknown): CaseSpec {
  const item = record(value, 'case');
  return {
    title: identity(item.title, 'case title'),
    subtitle: optionalText(item.subtitle, 'subtitle'),
    outcome: item.outcome,
    threads: list(item.threads, 'threads').map((value) => {
      const thread = record(value, 'source thread');
      return {
        id: identity(thread.id, 'thread id'),
        role: optionalText(thread.role, 'role'),
        parent: optionalText(thread.parent, 'parent'),
      };
    }),
    stages: list(item.stages, 'stages').map(parseStage),
    ...(item.documents === undefined ? {} : { documents: texts(item.documents, 'documents') }),
    ...(item.sourceKeys === undefined
      ? {}
      : { sourceKeys: stringMap(item.sourceKeys, 'sourceKeys') }),
    ...(item.sourceSubjects === undefined
      ? {}
      : { sourceSubjects: stringMap(item.sourceSubjects, 'sourceSubjects') }),
  };
}
