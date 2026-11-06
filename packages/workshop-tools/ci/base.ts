import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH!, 'utf8')) as {
  before?: string;
  pull_request?: { head: { sha: string } };
};
let base = event.before ?? '';
if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
  const parents = git('show', '-s', '--format=%P', 'HEAD').split(' ');
  // The tested merge's first parent is authoritative, not a stale PR API snapshot.
  base = parents.length === 2 && parents[1] === event.pull_request?.head.sha ? parents[0] : '';
  if (base && git('rev-parse', `refs/remotes/origin/${process.env.GITHUB_BASE_REF}`) !== base)
    throw new Error(
      'PR merge base is stale. Update the branch against its current base before running expensive checks.',
    );
}
if (!/^[a-f0-9]{40}$/.test(base) || /^0{40}$/.test(base)) base = '';
let cold = !base || process.env.CI_FULL === '1';
if (base) {
  const changed = git('diff', '--name-only', `${base}...HEAD`).split('\n');
  cold ||= changed.some(
    (path) =>
      /(^|\/)package(-lock)?\.json$/.test(path) ||
      ['.npmrc', '.nvmrc', '.node-version'].includes(path) ||
      path.startsWith('.github/'),
  );
}
appendFileSync(process.env.GITHUB_OUTPUT!, `base=${base}\ncold=${cold}\n`);
