import { contentDigest } from '../contentPack';
import type { Rules, Session } from '../replay';
import type { RunEvidence } from './types';
export const EVIDENCE_KEY = 'card-workshop.evidence.v1';
export const MAX_RUNS = 100,
  MAX_EVENTS = 1000;
export type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function readEvidence(storage: StoragePort): RunEvidence[] {
  const value: unknown = JSON.parse(storage.getItem(EVIDENCE_KEY) ?? '[]');
  const strings = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every((s) => typeof s === 'string');
  const metrics = (v: unknown) =>
    !!v &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    Object.values(v).every((n) => typeof n === 'number' && Number.isFinite(n));
  if (
    !Array.isArray(value) ||
    value.length > MAX_RUNS ||
    value.some(
      (r) =>
        !r ||
        !['id', 'game', 'seed', 'tail', 'startedAt', 'updatedAt'].every(
          (k) => typeof r[k] === 'string',
        ) ||
        !['normal', 'practice'].includes(r.mode) ||
        !['human', 'imported', 'automated'].includes(r.source) ||
        ![r.version, r.steps, r.startStep, r.droppedEvents].every(
          (n) => Number.isInteger(n) && n >= 0,
        ) ||
        !Array.isArray(r.content) ||
        r.content.some(
          (p: Record<string, unknown>) =>
            !p || !['id', 'version', 'digest'].every((k) => typeof p[k] === 'string'),
        ) ||
        !r.summary ||
        !['active', 'won', 'lost'].includes(r.summary.outcome) ||
        typeof r.summary.context !== 'string' ||
        !metrics(r.summary.metrics) ||
        !Array.isArray(r.events) ||
        r.events.length > MAX_EVENTS ||
        r.events.some(
          (e: Record<string, unknown>) =>
            !e ||
            !['pick', 'skip', 'encounter', 'action'].includes(String(e.kind)) ||
            typeof e.name !== 'string' ||
            !Number.isInteger(e.step) ||
            (e.offered !== undefined && !strings(e.offered)) ||
            (e.choice !== undefined && typeof e.choice !== 'string') ||
            (e.metrics !== undefined && !metrics(e.metrics)),
        ),
    )
  )
    throw new Error('Evidence archive is invalid. Export the raw archive before clearing it.');
  return value as RunEvidence[];
}
function save(storage: StoragePort, records: RunEvidence[]) {
  // Bound both per-run history and archive size; counts report truncation explicitly.
  const kept = records.slice(-MAX_RUNS);
  let eventBudget = 12000;
  for (let i = kept.length - 1; i >= 0; i--) {
    const row = kept[i],
      count = Math.min(row.events.length, eventBudget);
    row.droppedEvents += row.events.length - count;
    row.events = count ? row.events.slice(-count) : [];
    eventBudget -= count;
  }
  storage.setItem(EVIDENCE_KEY, JSON.stringify(kept));
}
export function evidenceRow<S extends { seed: string }, C>(
  rules: Rules<S, C>,
  session: Session<S, C>,
  source: RunEvidence['source'],
  id: string,
  now: string,
): RunEvidence {
  return {
    id,
    game: rules.game,
    version: rules.version,
    content: session.replay.content ?? [],
    seed: session.state.seed,
    mode: session.replay.mode ?? 'normal',
    source,
    startedAt: now,
    updatedAt: now,
    startStep: session.replay.commands.length,
    steps: session.replay.commands.length,
    tail: contentDigest(session.replay),
    setup: session.replay.setup,
    summary: rules.evidence!.summary(session.state),
    events: [],
    droppedEvents: 0,
  };
}
export function beginEvidence<S extends { seed: string }, C>(
  storage: StoragePort,
  rules: Rules<S, C>,
  session: Session<S, C>,
  source: RunEvidence['source'],
  id: string,
  now: string,
) {
  if (!rules.evidence) return;
  const records = readEvidence(storage);
  records.push(evidenceRow(rules, session, source, id, now));
  save(storage, records);
}
export function recordAccepted<S extends { seed: string }, C>(
  storage: StoragePort,
  rules: Rules<S, C>,
  before: Session<S, C>,
  command: C,
  after: Session<S, C>,
  id: string,
  now: string,
) {
  if (!rules.evidence) return;
  const records = readEvidence(storage),
    tail = contentDigest(before.replay);
  const row =
    [...records]
      .reverse()
      .find((r) => r.game === rules.game && r.tail === tail && r.source !== 'automated') ??
    evidenceRow(rules, before, 'human', id, now);
  if (!records.includes(row)) records.push(row);
  row.events.push(
    ...rules.evidence
      .events(before.state, command, after.state)
      .map((e) => ({ ...e, step: after.replay.commands.length })),
  );
  if (row.events.length > MAX_EVENTS) {
    row.droppedEvents += row.events.length - MAX_EVENTS;
    row.events = row.events.slice(-MAX_EVENTS);
  }
  row.steps = after.replay.commands.length;
  row.tail = contentDigest(after.replay);
  row.updatedAt = now;
  row.summary = rules.evidence.summary(after.state);
  save(storage, records);
}
export function pickRates(records: readonly RunEvidence[]) {
  const result = new Map<string, { name: string; offered: number; picked: number }>();
  for (const row of records)
    for (const event of row.events)
      if (event.kind === 'pick' || event.kind === 'skip')
        for (const name of new Set(event.offered ?? [])) {
          const count = result.get(name) ?? { name, offered: 0, picked: 0 };
          count.offered++;
          if (event.choice === name) count.picked++;
          result.set(name, count);
        }
  return [...result.values()].sort((a, b) => b.offered - a.offered || a.name.localeCompare(b.name));
}
