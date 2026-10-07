import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromRoot, freshDirectory, newOutput, withBundle, reportFailure } from '../io.ts';

export async function runCli(args: string[]) {
  if (args[0] === '--help') {
    console.log('Usage: npm run engine:challenges -- [new-output-directory]');
    return;
  }
  if (args.length > 1) throw new Error('Expected one new output directory');
  const output = args[0] ? fromRoot(args[0]) : newOutput('challenges');
  await freshDirectory(output);
  await withBundle<typeof import('../../../src/engines/challenges'), void>(
    'src/engines/challenges.ts',
    async ({ solveWorkshopChallenges }) => {
      const reports = solveWorkshopChallenges();
      await writeFile(resolve(output, 'report.json'), JSON.stringify(reports, null, 2) + '\n', {
        flag: 'wx',
      });
      for (const report of reports) {
        if (!report.solution) continue;
        await writeFile(
          resolve(output, `${report.id}.attempts.json`),
          report.solution.archive + '\n',
          {
            flag: 'wx',
          },
        );
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
    },
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runCli(process.argv.slice(2)).catch(reportFailure);
