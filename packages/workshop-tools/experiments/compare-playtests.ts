import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isList, objectValue } from '../../../src/shared/json.ts';
import { fromRoot, reportFailure } from '../io.ts';

interface Row {
  game: string;
  seed: string;
  source: string;
  mode: unknown;
  setup: unknown;
  version: unknown;
  content: unknown;
  startStep: number;
  summary: { context: string; outcome: string; metrics: Record<string, number> };
}
function rows(json: string): Row[] {
  const value: unknown = JSON.parse(json);
  if (!isList(value)) throw new Error('Expected a workshop evidence array');
  return value.map((item) => {
    const row = objectValue(item),
      summary = objectValue(row.summary);
    const metrics: Record<string, number> = {};
    for (const [key, metric] of Object.entries(objectValue(summary.metrics))) {
      if (typeof metric !== 'number' || !Number.isFinite(metric))
        throw new Error('Expected finite evidence metrics');
      metrics[key] = metric;
    }
    if (
      typeof row.game !== 'string' ||
      !row.game ||
      typeof row.seed !== 'string' ||
      !row.seed ||
      typeof row.source !== 'string' ||
      !row.source ||
      typeof row.startStep !== 'number' ||
      !Number.isSafeInteger(row.startStep) ||
      row.startStep < 0 ||
      typeof summary.context !== 'string' ||
      typeof summary.outcome !== 'string' ||
      !row.content
    )
      throw new Error('Expected a workshop evidence export');
    return {
      game: row.game,
      seed: row.seed,
      source: row.source,
      mode: row.mode,
      setup: row.setup,
      version: row.version,
      content: row.content,
      startStep: row.startStep,
      summary: { context: summary.context, outcome: summary.outcome, metrics },
    };
  });
}
const key = (row: Row) =>
  JSON.stringify([
    row.game,
    row.seed,
    row.mode,
    row.source,
    row.summary.context,
    row.setup ?? null,
  ]);
function group(values: Row[]) {
  const result = new Map<string, Row[]>();
  for (const row of values) {
    const identity = key(row);
    result.set(identity, [...(result.get(identity) ?? []), row]);
  }
  return result;
}
export function comparePlaytests(baseline: string, candidate: string) {
  const a = group(rows(baseline)),
    b = group(rows(candidate));
  const paired = [],
    excluded = [];
  for (const identity of new Set([...a.keys(), ...b.keys()])) {
    const left = a.get(identity) ?? [],
      right = b.get(identity) ?? [];
    if (
      left.length !== 1 ||
      right.length !== 1 ||
      [...left, ...right].some((row) => row.summary.outcome === 'active' || row.startStep > 0)
    ) {
      const parsedKey: unknown = JSON.parse(identity);
      excluded.push({ key: parsedKey, reason: 'Missing, duplicate, partial, or unfinished run' });
      continue;
    }
    const x = left[0],
      y = right[0];
    paired.push({
      game: x.game,
      seed: x.seed,
      context: x.summary.context,
      source: x.source,
      mode: x.mode,
      baseline: { version: x.version, content: x.content, outcome: x.summary.outcome },
      candidate: { version: y.version, content: y.content, outcome: y.summary.outcome },
      delta: Object.fromEntries(
        Object.entries(x.summary.metrics)
          .filter(([name]) => typeof y.summary.metrics[name] === 'number')
          .map(([name, value]) => [name, y.summary.metrics[name] - value]),
      ),
    });
  }
  return {
    note: 'Matched seed and setup; candidate minus baseline. RNG consumption and decisions can differ. Automated policies are development heuristics, not human balance or fun evidence.',
    matchedPairs: paired.length,
    excluded,
    paired,
  };
}
export function runCli(args: string[]) {
  if (args.length !== 2)
    throw new Error('Usage: npm run playtest:compare -- baseline.json candidate.json');
  console.log(
    JSON.stringify(
      comparePlaytests(
        readFileSync(fromRoot(args[0]), 'utf8'),
        readFileSync(fromRoot(args[1]), 'utf8'),
      ),
      null,
      2,
    ),
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    reportFailure(error);
  }
}
