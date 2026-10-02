import { readFileSync } from 'node:fs';
const paths = process.argv.slice(2);
if (paths.length !== 2) {
  console.error('Usage: npm run playtest:compare -- baseline.json candidate.json');
  process.exit(1);
}
const read = (path) => {
  const rows = JSON.parse(readFileSync(path, 'utf8'));
  if (
    !Array.isArray(rows) ||
    rows.some((r) => !r.summary?.metrics || !r.seed || !r.game || !r.source || !r.content)
  )
    throw new Error(`${path}: expected a workshop evidence export.`);
  return rows;
};
const key = (r) =>
  JSON.stringify([r.game, r.seed, r.mode, r.source, r.summary.context, r.setup ?? null]);
const group = (rows) => {
  const map = new Map();
  for (const r of rows) {
    const k = key(r);
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  return map;
};
const a = group(read(paths[0])),
  b = group(read(paths[1])),
  paired = [],
  excluded = [];
for (const k of new Set([...a.keys(), ...b.keys()])) {
  const left = a.get(k) ?? [],
    right = b.get(k) ?? [];
  if (
    left.length !== 1 ||
    right.length !== 1 ||
    [...left, ...right].some((r) => r.summary.outcome === 'active' || r.startStep > 0)
  ) {
    excluded.push({ key: JSON.parse(k), reason: 'Missing, duplicate, partial, or unfinished run' });
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
        .filter(
          ([name, value]) =>
            typeof value === 'number' && typeof y.summary.metrics[name] === 'number',
        )
        .map(([name, value]) => [name, y.summary.metrics[name] - value]),
    ),
  });
}
console.log(
  JSON.stringify(
    {
      note: 'Matched seed and setup; candidate minus baseline. RNG consumption and decisions can differ. Automated policies are development heuristics, not human balance or fun evidence.',
      matchedPairs: paired.length,
      excluded,
      paired,
    },
    null,
    2,
  ),
);
