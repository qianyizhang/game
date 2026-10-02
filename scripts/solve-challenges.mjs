import { build } from 'vite';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

// A headless TypeScript bundle needs no browser, listening server or new runtime dependency.
const output = resolve(
  process.argv[2] ?? `test-results/engines/${new Date().toISOString().replace(/[:.]/g, '-')}`,
);
await mkdir(dirname(output), { recursive: true });
await mkdir(output); // Preserve earlier evidence: an existing output directory is an error.
const bundle = await mkdtemp(resolve(tmpdir(), 'workshop-engine-'));
try {
  await build({
    configFile: false,
    logLevel: 'warn',
    build: {
      ssr: 'src/engines/challenges.ts',
      outDir: bundle,
      emptyOutDir: false,
      rollupOptions: { output: { entryFileNames: 'engine.mjs' } },
    },
  });
  const { solveWorkshopChallenges } = await import(
    pathToFileURL(resolve(bundle, 'engine.mjs')).href
  );
  const reports = solveWorkshopChallenges();
  await writeFile(resolve(output, 'report.json'), JSON.stringify(reports, null, 2) + '\n', {
    flag: 'wx',
  });
  for (const report of reports) {
    if (!report.solution) continue;
    await writeFile(resolve(output, `${report.id}.attempts.json`), report.solution.archive + '\n', {
      flag: 'wx',
    });
    await writeFile(
      resolve(output, `${report.id}.replay.json`),
      JSON.stringify(report.solution.replay, null, 2) + '\n',
      { flag: 'wx' },
    );
  }
  console.table(
    reports.map((report) => ({
      challenge: report.id,
      revision: report.revision,
      status: report.status,
      actions: report.solution?.commands.length ?? '—',
      transitions: report.stats.transitions,
      reason: report.reason ?? '',
    })),
  );
  const solved = reports.filter((report) => report.status === 'solved').length;
  console.log(
    `Solved ${solved}/${reports.length}. Reports and verified importable solutions: ${output}`,
  );
  console.log(
    'Full seeded state search; these results do not measure hidden-information playing strength.',
  );
  if (reports.some((report) => report.status !== 'solved')) process.exitCode = 1;
} finally {
  await rm(bundle, { recursive: true, force: true });
}
