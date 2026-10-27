import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readPlan } from './commands.ts';

let json = process.env.CI_PLAN;
if (!json) {
  const directory = mkdtempSync(join(tmpdir(), 'asset-ci-plan-'));
  try {
    const path = join(directory, 'plan.json');
    execFileSync(process.execPath, [join(import.meta.dirname, 'cli.ts'), 'plan', path], {
      env: { ...process.env, CI_FULL: '1', CI_BASE: '' },
      stdio: 'pipe',
    });
    json = readFileSync(path, 'utf8');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
const plan = readPlan(
  JSON.parse(json),
  execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
);
if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is required');
appendFileSync(
  process.env.GITHUB_OUTPUT,
  `plan=${JSON.stringify(plan)}\nbrowser=${plan.browserFiles.length > 0}\ngeometry=${plan.geometry}\nbrowser_matrix=${JSON.stringify(Array.from({ length: plan.browserShards }, (_, i) => i + 1))}\n`,
);
