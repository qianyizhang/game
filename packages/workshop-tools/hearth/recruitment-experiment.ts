import { fileURLToPath } from 'node:url';
import { fromRoot, repositoryRoot, reportFailure } from '../io.ts';
import {
  objectValue,
  text,
  cohort as readCohort,
  list,
  caseSpec,
  recruitmentReport,
} from './contracts.ts';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { withRecruitmentRuntime, sha256 } from './recruitment-runtime.ts';
import { recruitmentPool } from './recruitment-pool.ts';

export async function runCli(args: string[]) {
  const [mode, destination, workersText = '2', ...extra] = args;
  if (mode === '--help') {
    console.log(
      'Usage: node packages/workshop-tools/hearth/recruitment-experiment.ts <development|evaluation|smoke|audit> <new-output-directory|existing-directory-for-audit> [workers 1–4]\nDevelopment: 400 lobbies. Evaluation: 800 fresh lobbies, five balanced heroes and eight seats. Smoke runs four development cases without strength estimates. Audit reconstructs every trace and diagnostic. Existing outputs are never overwritten.',
    );
    return;
  }
  const workers = Number(workersText);
  if (
    (mode !== 'development' && mode !== 'evaluation' && mode !== 'smoke' && mode !== 'audit') ||
    !destination ||
    extra.length ||
    !Number.isInteger(workers) ||
    workers < 1 ||
    workers > 4
  )
    throw new Error('Invalid arguments; see --help.');
  const output = fromRoot(destination);
  const write = (name: string, value: unknown) =>
    writeFile(resolve(output, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  const git = (...args: string[]) =>
    execFileSync('git', args, { encoding: 'utf8', cwd: repositoryRoot }).trim();
  await withRecruitmentRuntime(async ({ runtime, moduleURL, sourceDigests, bundleDigest }) => {
    const startedAt = new Date().toISOString(),
      started = performance.now();
    const scripts = [
      ...['runtime', 'pool', 'worker', 'experiment'].map(
        (name) => `packages/workshop-tools/hearth/recruitment-${name}.ts`,
      ),
      'packages/workshop-tools/hearth/contracts.ts',
      'packages/workshop-tools/io.ts',
    ];
    const sourcePins = {
      ...sourceDigests,
      ...Object.fromEntries(
        await Promise.all(
          [...scripts, 'package.json', 'package-lock.json'].map(
            async (file) => [file, sha256(await readFile(fromRoot(file)))] as const,
          ),
        ),
      ),
    };
    if (mode === 'audit') {
      const rawManifest = objectValue(
        JSON.parse(await readFile(resolve(output, 'manifest.json'), 'utf8')),
      );
      const manifest = {
        ...rawManifest,
        cohort: readCohort(rawManifest.cohort),
        cases: list(rawManifest.cases).map((value) => caseSpec(value, runtime)),
        sourceDigests: Object.fromEntries(
          Object.entries(objectValue(rawManifest.sourceDigests)).map(([path, digest]) => [
            path,
            text(digest),
          ]),
        ),
        mode: rawManifest.mode,
        bundleDigest: rawManifest.bundleDigest,
        configurationDigest: rawManifest.configurationDigest,
      };
      if (manifest.bundleDigest !== bundleDigest)
        throw new Error(
          'Runtime differs from the frozen experiment; restore its source revision before auditing.',
        );
      for (const [file, digest] of Object.entries(manifest.sourceDigests))
        if (sha256(await readFile(fromRoot(file))) !== digest)
          throw new Error(`Frozen source mismatch: ${file}`);
      const planned = runtime.recruitmentCases(manifest.cohort);
      const expectedCases =
        manifest.mode === 'smoke' ? [0, 2, 4, 40].map((i) => planned[i]) : planned;
      if (
        (manifest.mode !== 'smoke' &&
          manifest.mode !== 'development' &&
          manifest.mode !== 'evaluation') ||
        (manifest.mode !== 'smoke' && manifest.mode !== manifest.cohort) ||
        JSON.stringify(expectedCases) !== JSON.stringify(manifest.cases) ||
        manifest.configurationDigest !== sha256(JSON.stringify(runtime.RECRUITMENT_PLAN))
      )
        throw new Error('Manifest does not match the frozen case grid.');
      // Create the destination before work so an existing audit cannot be silently replaced.
      await mkdir(resolve(output, 'audit'));
      const results = await recruitmentPool({
        moduleURL,
        jobs: manifest.cases,
        output,
        workers,
        mode: 'audit',
        onResult: (row, count) => {
          if (count % 100 === 0 || count === manifest.cases.length)
            console.log(`audit: ${count}/${manifest.cases.length} lobbies`);
        },
      });
      const recordedComparison = objectValue(
        JSON.parse(await readFile(resolve(output, 'comparison.json'), 'utf8')),
      );
      const reports = await Promise.all(
        manifest.cases.map(async (spec) =>
          recruitmentReport(
            JSON.parse(await readFile(resolve(output, `${spec.id}.receipt.json`), 'utf8')),
            (await readFile(resolve(output, `${spec.id}.replay.json`), 'utf8')).trimEnd(),
            runtime,
          ),
        ),
      );
      const recomputed =
        manifest.mode === 'smoke'
          ? { plannedLobbies: expectedCases.length, includedLobbies: reports.length }
          : runtime.compareRecruitmentReports(reports, manifest.cohort);
      for (const [key, value] of Object.entries(recomputed))
        if (JSON.stringify(recordedComparison[key]) !== JSON.stringify(value))
          throw new Error(`Comparison mismatch: ${key}`);
      if (
        recordedComparison.failedRuns !== 0 ||
        recordedComparison.totalCommands !== reports.reduce((sum, r) => sum + r.commands, 0)
      )
        throw new Error('Comparison lifecycle totals mismatch.');
      const audit = {
        schema: 'hearth.recruitment-audit.v2',
        sourceRevision: git('rev-parse', 'HEAD'),
        bundleDigest,
        manifestDigest: sha256(await readFile(resolve(output, 'manifest.json'))),
        comparisonDigest: sha256(await readFile(resolve(output, 'comparison.json'))),
        lobbies: results.length,
        decisions: results.reduce((sum, row) => sum + row.decisions, 0),
        diagnostics: results.reduce((sum, row) => sum + row.diagnostics, 0),
        elapsedMs: performance.now() - started,
        results: results.sort((a, b) => a.id.localeCompare(b.id)),
      };
      await write('audit/audit.json', audit);
      console.log(JSON.stringify({ ...audit, results: undefined }, null, 2));
      return;
    }
    await mkdir(dirname(output), { recursive: true });
    await mkdir(output);
    const cohort = mode === 'smoke' ? 'development' : mode;
    const allCases = runtime.recruitmentCases(cohort);
    const cases = mode === 'smoke' ? [0, 2, 4, 40].map((i) => allCases[i]) : allCases;
    const manifest = {
      ...runtime.RECRUITMENT_PLAN,
      mode,
      cohort,
      cases,
      workers,
      workerHeapLimitMiB: 512,
      configurationDigest: sha256(JSON.stringify(runtime.RECRUITMENT_PLAN)),
      bundleDigest,
      sourceRevision: git('rev-parse', 'HEAD'),
      sourceStatus: git('status', '--porcelain'),
      sourceDigests: sourcePins,
      runtime: process.version,
      startedAt,
    };
    await write('manifest.json', manifest);
    try {
      await recruitmentPool({
        moduleURL,
        jobs: cases,
        output,
        workers,
        onResult: (row, count) => {
          if (row.status !== 'complete')
            console.error(`${row.id}: ${row.status} ${row.error ?? ''}`);
          if (count % 100 === 0 || count === cases.length)
            console.log(`${mode}: ${count}/${cases.length} lobbies`);
        },
      });
      const reports = await Promise.all(
        cases.map(async (spec) =>
          recruitmentReport(
            JSON.parse(await readFile(resolve(output, `${spec.id}.receipt.json`), 'utf8')),
            (await readFile(resolve(output, `${spec.id}.replay.json`), 'utf8')).trimEnd(),
            runtime,
          ),
        ),
      );
      const sourceChangedDuringRun = [];
      for (const [path, digest] of Object.entries(sourcePins))
        if (sha256(await readFile(fromRoot(path))) !== digest) sourceChangedDuringRun.push(path);
      const comparison = {
        mode,
        configurationDigest: manifest.configurationDigest,
        sourceChangedDuringRun,
        startedAt,
        completedAt: new Date().toISOString(),
        elapsedMs: performance.now() - started,
        failedRuns: reports.filter((r) => r.status !== 'complete' || !r.replayVerified).length,
        ...(mode === 'smoke'
          ? {
              plannedLobbies: cases.length,
              includedLobbies: reports.filter((r) => r.status === 'complete' && r.replayVerified)
                .length,
            }
          : runtime.compareRecruitmentReports(reports, cohort)),
        totalCommands: reports.reduce((sum, r) => sum + r.commands, 0),
        decisionMs: reports.reduce((sum, r) => sum + r.decisionMs, 0),
      };
      await write('comparison.json', comparison);
      console.log(
        JSON.stringify(
          {
            ...comparison,
            strata: ('strata' in comparison ? comparison.strata : undefined)?.map((s) => ({
              population: s.population,
              visibility: s.visibility,
              policies: s.policies.map((p) => ({
                policy: p.policy,
                meanPlacement: p.meanPlacement,
                versusClassic: p.versusClassic,
              })),
            })),
          },
          null,
          2,
        ),
      );
      if (
        sourceChangedDuringRun.length ||
        comparison.failedRuns ||
        ('excluded' in comparison && comparison.excluded.length) ||
        ('unexpected' in comparison && comparison.unexpected.length)
      )
        process.exitCode = 1;
    } catch (error) {
      await write('failure.json', { error: String(error), completedAt: new Date().toISOString() });
      throw error;
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runCli(process.argv.slice(2)).catch(reportFailure);
