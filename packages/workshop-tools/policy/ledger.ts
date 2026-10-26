import { createHash } from 'node:crypto';
import { closeSync, fsyncSync, openSync, readFileSync, writeSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CaseJob, StudyRow } from './study.ts';

type CaseIdentity = [
  seed: string,
  setup: string,
  policy: string,
  difficulty: string,
  stratum: string,
];
const identity = (row: StudyRow | CaseJob): CaseIdentity => [
  row.seed,
  row.setupId,
  row.policy,
  row.difficulty,
  row.stratum,
];
const key = (value: CaseIdentity) => JSON.stringify(value.slice(0, 3));
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/** One parent-owned writer. A case is acknowledged only after its summary reaches fsync. */
export function createCaseLedger(directory: string, jobs: readonly CaseJob[]) {
  const cases = jobs.map(identity);
  if (!cases.length || new Set(cases.map(key)).size !== cases.length)
    throw new Error('Ledger requires a nonempty unique case grid.');
  const fd = openSync(resolve(directory, 'cases.jsonl'), 'wx');
  const recorded = new Set<number>();
  try {
    append(fd, { schema: 'policy-case-ledger-1', cases });
    // Persist the new directory entry too, before any case can be acknowledged.
    const parent = openSync(directory, 'r');
    try {
      fsyncSync(parent);
    } finally {
      closeSync(parent);
    }
  } catch (error) {
    closeSync(fd);
    throw error;
  }
  return {
    record(this: void, row: StudyRow, index: number) {
      if (
        !Number.isSafeInteger(index) ||
        !cases[index] ||
        JSON.stringify(identity(row)) !== JSON.stringify(cases[index])
      )
        throw new Error('Ledger result does not match its assigned case.');
      if (recorded.has(index)) throw new Error('Duplicate ledger case.');
      append(fd, { index, row });
      recorded.add(index);
    },
    close() {
      closeSync(fd);
    },
  };
}

function append(fd: number, value: unknown) {
  const bytes = Buffer.from(JSON.stringify(value) + '\n');
  let offset = 0;
  while (offset < bytes.length) {
    const written = writeSync(fd, bytes, offset, bytes.length - offset);
    if (!written) throw new Error('Ledger write made no progress.');
    offset += written;
  }
  fsyncSync(fd);
}

/** Read after the run stops. An unterminated crash tail is never a completed case. */
export function readCaseLedger(directory: string) {
  const text = readFileSync(resolve(directory, 'cases.jsonl'), 'utf8');
  const lines = text.split('\n');
  const ignoredTail = lines.pop() !== '';
  const header = JSON.parse(lines.shift() ?? 'null') as {
    schema?: string;
    cases?: CaseIdentity[];
  } | null;
  if (
    header?.schema !== 'policy-case-ledger-1' ||
    !Array.isArray(header.cases) ||
    !header.cases.length ||
    header.cases.some(
      (c) => !Array.isArray(c) || c.length !== 5 || c.some((v) => typeof v !== 'string'),
    ) ||
    new Set(header.cases.map(key)).size !== header.cases.length
  )
    throw new Error('Invalid case ledger header.');
  const rows = new Map<number, StudyRow>();
  let reportSha256: string | undefined;
  for (const line of lines) {
    const entry = JSON.parse(line) as { index?: number; row?: StudyRow; reportSha256?: string };
    if (!entry || reportSha256) throw new Error('Invalid entry after ledger completion.');
    if (entry.reportSha256 !== undefined) {
      if (!/^[a-f0-9]{64}$/.test(entry.reportSha256) || rows.size !== header.cases.length)
        throw new Error('Invalid ledger completion.');
      reportSha256 = entry.reportSha256;
      continue;
    }
    const { index, row } = entry;
    if (
      index === undefined ||
      !Number.isSafeInteger(index) ||
      !header.cases[index] ||
      !row ||
      JSON.stringify(identity(row)) !== JSON.stringify(header.cases[index]) ||
      rows.has(index)
    )
      throw new Error('Invalid or duplicate ledger case.');
    rows.set(index, row);
  }
  if (
    reportSha256 &&
    (ignoredTail || digest(readFileSync(resolve(directory, 'report.json'))) !== reportSha256)
  )
    throw new Error('Final report does not match ledger completion.');
  return {
    schema: 'policy-study-recovery-1',
    status: reportSha256 ? 'complete' : 'interrupted',
    expectedCases: header.cases.length,
    completedCases: rows.size,
    ignoredTail,
    rows: [...rows.entries()].sort(([a], [b]) => a - b).map(([, row]) => row),
  };
}

/** Commit success only after the source check and the unchanged final report are durable. */
export function completeCaseLedger(directory: string) {
  const ledger = readCaseLedger(directory);
  if (
    ledger.status !== 'interrupted' ||
    ledger.ignoredTail ||
    ledger.completedCases !== ledger.expectedCases
  )
    throw new Error('Cannot complete an unfinished or already completed ledger.');
  const report = openSync(resolve(directory, 'report.json'), 'r');
  let reportSha256: string;
  try {
    fsyncSync(report);
    reportSha256 = digest(readFileSync(report));
  } finally {
    closeSync(report);
  }
  const fd = openSync(resolve(directory, 'cases.jsonl'), 'a');
  try {
    append(fd, { reportSha256 });
  } finally {
    closeSync(fd);
  }
  const parent = openSync(directory, 'r');
  try {
    fsyncSync(parent);
  } finally {
    closeSync(parent);
  }
}
