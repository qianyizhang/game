import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { readPlan } from './commands.ts';
import type { Plan } from './selection.ts';

export type Receipt = {
  version: 1;
  tree: string;
  pullHead: string;
  runId: number;
  attempt: number;
  environment: string;
  plan: Plan;
};
export type Run = {
  id: number;
  run_attempt: number;
  event: string;
  status: string;
  conclusion: string;
  head_sha: string;
  head_repository: { full_name: string };
  path: string;
  updated_at: string;
};
export function reusable(
  receipt: Receipt,
  run: Run,
  context: { repository: string; tree: string; pullHead: string; plan: Plan; now: number },
): boolean {
  try {
    const runtime = JSON.parse(receipt.environment) as { image?: string; chrome?: string };
    if (!runtime.image || !/^Google Chrome \d+\.\d+\.\d+\.\d+\s*$/.test(runtime.chrome ?? ''))
      return false;
    const plan = readPlan(receipt.plan, receipt.plan.head);
    return (
      receipt.version === 1 &&
      run.event === 'pull_request' &&
      run.status === 'completed' &&
      run.conclusion === 'success' &&
      run.path === '.github/workflows/maintenance.yml' &&
      run.head_repository.full_name === context.repository &&
      run.head_sha === context.pullHead &&
      receipt.pullHead === context.pullHead &&
      receipt.runId === run.id &&
      receipt.attempt === run.run_attempt &&
      receipt.tree === context.tree &&
      /^[a-f0-9]{40}$/.test(receipt.tree) &&
      context.now - Date.parse(run.updated_at) >= 0 &&
      context.now - Date.parse(run.updated_at) <= 24 * 60 * 60 * 1000 &&
      Boolean(context.plan.environment) &&
      receipt.environment === context.plan.environment &&
      plan.environment === receipt.environment &&
      (context.plan.mode !== 'full' || plan.mode === 'full') &&
      (context.plan.mode !== 'movies' ||
        plan.mode === 'movies' ||
        !['documentation', 'movies'].includes(plan.mode)) &&
      (['documentation', 'movies'].includes(context.plan.mode) ||
        !['documentation', 'movies'].includes(plan.mode)) &&
      (['coreFiles', 'unitFiles', 'browserFiles', 'geometryFiles'] as const).every((key) =>
        context.plan[key].every((file) => plan[key].includes(file)),
      )
    );
  } catch {
    return false;
  }
}
const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
async function findReuse(plan: Plan): Promise<string | undefined> {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH!, 'utf8')) as {
    before?: string;
  };
  const parents = git('show', '-s', '--format=%P', 'HEAD').split(' ');
  // Only a normal two-parent PR merge whose first parent is the push base.
  if (parents.length !== 2 || parents[0] !== event.before || !process.env.GITHUB_TOKEN) return;
  const repository = process.env.GITHUB_REPOSITORY!;
  const api = async (path: string, binary = false) => {
    const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`GitHub evidence lookup ${response.status}`);
    return binary
      ? Buffer.from(await response.arrayBuffer())
      : (response.json() as Promise<unknown>);
  };
  const pulls = (await api(`/commits/${git('rev-parse', 'HEAD')}/pulls`)) as {
    number: number;
    merged_at: string | null;
    merge_commit_sha: string;
    head: { sha: string; repo: { full_name: string } | null };
    base: { ref: string };
  }[];
  const pull = pulls.find(
    (pull) =>
      pull.merged_at &&
      pull.merge_commit_sha === plan.head &&
      pull.base.ref === 'main' &&
      pull.head.repo?.full_name === repository &&
      pull.head.sha === parents[1],
  );
  if (!pull) return;
  const { workflow_runs: runs } = (await api(
    `/actions/workflows/maintenance.yml/runs?event=pull_request&head_sha=${pull.head.sha}&per_page=10`,
  )) as { workflow_runs: Run[] };
  // Never fall back to an older green run after a newer failed/cancelled attempt.
  const run = runs.sort((a, b) => b.id - a.id)[0];
  if (!run || run.conclusion !== 'success') return;
  const { artifacts } = (await api(`/actions/runs/${run.id}/artifacts?per_page=100`)) as {
    artifacts: { id: number; name: string; expired: boolean; size_in_bytes: number }[];
  };
  const artifact = artifacts.find(
    (artifact) =>
      artifact.name === `validation-${run.id}-${run.run_attempt}` &&
      !artifact.expired &&
      artifact.size_in_bytes < 1_000_000,
  );
  if (!artifact) return;
  const directory = mkdtempSync(join(tmpdir(), 'validation-reuse-'));
  try {
    const archive = join(directory, 'receipt.zip');
    writeFileSync(archive, (await api(`/actions/artifacts/${artifact.id}/zip`, true)) as Buffer);
    const receipt = JSON.parse(
      execFileSync('unzip', ['-p', archive, 'receipt.json'], {
        encoding: 'utf8',
        maxBuffer: 1_000_000,
      }),
    ) as Receipt;
    if (
      reusable(receipt, run, {
        repository,
        tree: git('rev-parse', 'HEAD^{tree}'),
        pullHead: pull.head.sha,
        plan,
        now: Date.now(),
      })
    )
      return `https://github.com/${repository}/actions/runs/${run.id}/attempts/${run.run_attempt}`;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  if (process.argv[2] === 'receipt') {
    if (process.env.GITHUB_EVENT_NAME !== 'pull_request')
      throw new Error('Only successful PR gates publish verification evidence');
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH!, 'utf8')) as {
      pull_request: { head: { sha: string } };
    };
    const plan = readPlan(JSON.parse(process.env.CI_PLAN!), git('rev-parse', 'HEAD'));
    const receipt: Receipt = {
      version: 1,
      tree: git('rev-parse', 'HEAD^{tree}'),
      pullHead: event.pull_request.head.sha,
      runId: Number(process.env.GITHUB_RUN_ID),
      attempt: Number(process.env.GITHUB_RUN_ATTEMPT),
      environment: plan.environment!,
      plan,
    };
    writeFileSync('receipt.json', JSON.stringify(receipt) + '\n');
  } else if (process.argv[2] === 'check') {
    let source: string | undefined;
    if (process.env.GITHUB_EVENT_NAME === 'push') {
      try {
        source = await findReuse(
          readPlan(JSON.parse(process.env.CI_PLAN!), git('rev-parse', 'HEAD')),
        );
      } catch (error) {
        console.log(`Normal validation: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    appendFileSync(
      process.env.GITHUB_OUTPUT!,
      `reused=${Boolean(source)}\nsource=${source ?? ''}\n`,
    );
    console.log(
      source
        ? `Reuse successful PR verification: ${source}`
        : 'Normal validation: no matching trusted evidence',
    );
  } else throw new Error('reuse.ts check|receipt');
}
