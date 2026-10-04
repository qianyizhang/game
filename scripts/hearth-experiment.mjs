import { appendFileSync } from 'node:fs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { withHearthRuntime } from './hearth-runtime.mjs';

// Freeze these before reserved evaluation. The policy never receives environment seeds.
const plan = {
  schema: 'hearth.experiment.v1',
  opponent: 'seven built-in sequential heuristic bots; controlled seat 0',
  observation: 'hearth.observation.v1',
  heroes: ['forgekeeper', 'quartermaster', 'wildspeaker', 'archivist', 'oathkeeper'],
  configurations: ['heuristic-v1', 'scout-search-v1'],
  policySeed: 'HEARTH-POLICY-2026-10-04',
  samples: 16,
  maxOrders: 24,
  maxCommands: 2000,
  development: Array.from({ length: 5 }, (_, i) => `HEARTH-DEV-20261004-${i + 1}`),
  evaluation: Array.from({ length: 20 }, (_, i) => `HEARTH-EVAL-20261004-${i + 1}`),
};
const [cohort, destination, ...extra] = process.argv.slice(2);
if (cohort === '--help') {
  console.log(
    'Usage: node scripts/hearth-experiment.mjs <development|evaluation> [new-output-directory]\nWrites the frozen manifest before running, then decision JSONL, replays, receipts and a paired comparison. Existing output directories are rejected.',
  );
  process.exit(0);
}
if (!['development', 'evaluation'].includes(cohort) || extra.length)
  throw new Error('Choose development or evaluation; see --help.');
const output = resolve(
  destination ?? `test-results/ai/${cohort}-${new Date().toISOString().replace(/[:.]/g, '-')}`,
);
await mkdir(dirname(output), { recursive: true });
await mkdir(output);
const write = (name, value) =>
  writeFile(
    resolve(output, name),
    typeof value === 'string' ? value + '\n' : JSON.stringify(value, null, 2) + '\n',
    { flag: 'wx' },
  );
const sourceRevision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const sourceStatus = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim();
const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { encoding: 'utf8' },
)
  .split('\0')
  .filter((path) =>
    /^(src\/|scripts\/|package(?:-lock)?\.json$|vite.config.ts$|tsconfig.json$)/.test(path),
  )
  .sort();
const sourceDigests = Object.fromEntries(
  await Promise.all(
    files.map(async (file) => [
      file,
      createHash('sha256')
        .update(await readFile(file))
        .digest('hex'),
    ]),
  ),
);
const configurationDigest = createHash('sha256').update(JSON.stringify(plan)).digest('hex');
await write('manifest.json', {
  ...plan,
  cohort,
  configurationDigest,
  sourceRevision,
  sourceStatus,
  sourceDigests,
  runtime: process.version,
});

await withHearthRuntime(async ({ runHearthEpisode, compareHearthEpisodes }) => {
  const reports = [];
  for (const [index, seed] of plan[cohort].entries()) {
    const hero = plan.heroes[index % plan.heroes.length];
    for (const kind of plan.configurations) {
      const id = `${String(index + 1).padStart(2, '0')}-${hero}-${kind}`;
      await writeFile(resolve(output, `${id}.decisions.jsonl`), '', { flag: 'wx' });
      const report = runHearthEpisode(
        seed,
        { kind, hero, seed: plan.policySeed, samples: plan.samples, maxOrders: plan.maxOrders },
        {
          maxCommands: plan.maxCommands,
          onDecision: (decision) =>
            appendFileSync(
              resolve(output, `${id}.decisions.jsonl`),
              JSON.stringify(decision) + '\n',
            ),
        },
      );
      const { replay, ...receipt } = report;
      await write(`${id}.replay.json`, replay);
      await write(`${id}.receipt.json`, receipt);
      reports.push(report);
      console.log(
        `${cohort} ${index + 1}/${plan[cohort].length} ${hero} ${kind}: ${report.status}, place ${report.placement ?? '—'}, ${report.simulations} simulations`,
      );
      // Preserve a usable summary even if a later run is interrupted.
      await write(`progress-${reports.length}.json`, {
        completedRuns: reports.length,
        plannedRuns: plan[cohort].length * 2,
      });
    }
  }
  const comparison = compareHearthEpisodes(reports);
  await write('comparison.json', {
    cohort,
    configurationDigest,
    ...comparison,
    totalRuns: reports.length,
    failedRuns: reports.filter((row) => row.status !== 'complete').length,
    policies: plan.configurations.map((kind) => {
      const rows = reports.filter((row) => row.policy.kind === kind);
      const complete = rows.filter((row) => row.status === 'complete');
      return {
        kind,
        runs: rows.length,
        completed: complete.length,
        firstPlaces: complete.filter((row) => row.placement === 1).length,
        topFour: complete.filter((row) => row.placement <= 4).length,
        simulations: rows.reduce((sum, row) => sum + row.simulations, 0),
        decisionMs: rows.reduce((sum, row) => sum + row.decisionMs, 0),
      };
    }),
    limits: [
      'Single controlled seat against fixed local bots; not head-to-head or self-play.',
      'Matched seeds may consume different RNG streams after different actions.',
      'Search estimates condition on a last-seen board and do not predict opponent recruitment.',
      'The paired sample does not establish general playing strength or human enjoyment.',
    ],
  });
  console.log(JSON.stringify(comparison, null, 2));
  console.log(`Evidence: ${output}`);
  if (reports.some((report) => report.status !== 'complete' || !report.replayVerified))
    process.exitCode = 1;
});
