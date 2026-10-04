import { appendFileSync } from 'node:fs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { withHearthRuntime } from './hearth-runtime.mjs';

// Freeze before evaluation. Neither these environment seeds nor the inspector enter policy inputs.
const plan = {
  schema: 'hearth.arena-experiment.v1',
  primary: 'mean placement, lower is better',
  secondary: ['first place', 'top four', 'survival rounds'],
  cohortUnit: 'one seed block contains all eight seat rotations and four conditions',
  heroes: ['forgekeeper', 'quartermaster', 'wildspeaker', 'archivist', 'oathkeeper'],
  conditions: [
    'baseline-v1/hidden',
    'baseline-v1/disclosed',
    'tempo-v1/hidden',
    'tempo-v1/disclosed',
  ],
  visibility: 'only focal seat varies; all seven rivals always receive hidden style labels',
  recruitment:
    'rotating first seat each round; initial shops reserved in that order, then complete seat turns',
  maxCommands: 6000,
  maxActionsPerTurn: 120,
  simulations: 0,
  trace:
    'SHA-256 of each exact input frame, decision and accepted command; full journal can reconstruct frames',
  development: Array.from({ length: 2 }, (_, i) => `HEARTH-ARENA-DEV-20261004-${i + 1}`),
  evaluation: Array.from({ length: 8 }, (_, i) => `HEARTH-ARENA-EVAL-20261004-${i + 1}`),
};
const [cohort, destination, ...extra] = process.argv.slice(2);
if (cohort === '--help') {
  console.log(
    'Usage: node scripts/hearth-arena-experiment.mjs <development|evaluation> [new-output-directory]\nWrites source-pinned manifest before running all seats and visibility conditions. Full replays, compact decision traces, receipts and seed-block comparisons are retained.',
  );
  process.exit(0);
}
if (!['development', 'evaluation'].includes(cohort) || extra.length)
  throw new Error('Choose development or evaluation; see --help.');
const output = resolve(
  destination ??
    `test-results/ai/arena-${cohort}-${new Date().toISOString().replace(/[:.]/g, '-')}`,
);
await mkdir(dirname(output), { recursive: true });
await mkdir(output);
const write = (name, value) =>
  writeFile(
    resolve(output, name),
    (typeof value === 'string' ? value : JSON.stringify(value, null, 2)) + '\n',
    { flag: 'wx' },
  );
const sha = (value) => createHash('sha256').update(value).digest('hex');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const paths = git('ls-files', '--cached', '--others', '--exclude-standard', '-z')
  .split('\0')
  .filter((p) => /^(src\/|scripts\/hearth|package(?:-lock)?\.json$|tsconfig.json$)/.test(p))
  .sort();
const sourceDigests = Object.fromEntries(
  await Promise.all(paths.map(async (p) => [p, sha(await readFile(p))])),
);
const configurationDigest = sha(JSON.stringify(plan));
const startedAt = new Date().toISOString();
const started = performance.now();
await write('manifest.json', {
  ...plan,
  cohort,
  configurationDigest,
  sourceRevision: git('rev-parse', 'HEAD'),
  sourceStatus: git('status', '--porcelain'),
  sourceDigests,
  runtime: process.version,
  startedAt,
});
await withHearthRuntime(async ({ mixedRivalsConfig, runArenaEpisode, compareArenaEpisodes }) => {
  const reports = [],
    receipts = [];
  for (const [block, seed] of plan[cohort].entries()) {
    const base = mixedRivalsConfig(seed, plan.heroes[block % plan.heroes.length], 'hidden');
    for (let seat = 0; seat < 8; seat++)
      for (const condition of plan.conditions) {
        const [style, visibility] = condition.split('/');
        const config = {
          ...base,
          visibility,
          visibilitySeat: seat,
          seats: Array.from({ length: 8 }, (_, id) => ({
            ...base.seats[(id - seat + 8) % 8],
            ...(id === seat ? { style } : {}),
          })),
        };
        const id = `${String(block + 1).padStart(2, '0')}-seat${seat}-${style}-${visibility}`;
        await writeFile(resolve(output, `${id}.decisions.jsonl`), '', { flag: 'wx' });
        const report = runArenaEpisode(seed, config, seat, {
          maxCommands: plan.maxCommands,
          onDecision: ({ input, ...trace }) => {
            appendFileSync(
              resolve(output, `${id}.decisions.jsonl`),
              JSON.stringify({ ...trace, inputDigest: input ? sha(JSON.stringify(input)) : null }) +
                '\n',
            );
          },
        });
        const { replay, ...receipt } = report;
        await write(`${id}.replay.json`, replay);
        await write(`${id}.receipt.json`, { ...receipt, replayDigest: sha(replay) });
        reports.push(report);
        receipts.push({ id, ...receipt, replayDigest: sha(replay) });
        if (report.status !== 'complete' || !report.replayVerified)
          console.error(`${id}: ${report.status} ${report.error ?? ''}`);
      }
    console.log(
      `${cohort}: ${block + 1}/${plan[cohort].length} seed blocks, ${reports.length} lobbies recorded.`,
    );
  }
  const changed = [];
  for (const [path, digest] of Object.entries(sourceDigests))
    if (sha(await readFile(path)) !== digest) changed.push(path);
  const comparison = {
    cohort,
    startedAt,
    completedAt: new Date().toISOString(),
    elapsedMs: performance.now() - started,
    configurationDigest,
    sourceChangedDuringRun: changed,
    ...compareArenaEpisodes(reports),
    totalRuns: reports.length,
    failedRuns: reports.filter((r) => r.status !== 'complete').length,
    decisionMs: reports.reduce((sum, r) => sum + r.decisionMs, 0),
    receipts,
    limits: [
      'Heuristic policies against this fixed rival mix; no claim of general strength or human enjoyment.',
      'Different actions may consume different seeded random streams.',
      'Uncertainty uses seed-block means; seat rotations are not independent observations.',
      'No held-out tuning or default-policy promotion is automatic.',
    ],
  };
  await write('comparison.json', comparison);
  console.log(JSON.stringify({ ...comparison, receipts: undefined, blocks: undefined }, null, 2));
  console.log(`Evidence: ${output}`);
  if (changed.length || comparison.excluded.length || comparison.failedRuns) process.exitCode = 1;
});
