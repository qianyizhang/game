import { execFileSync } from 'node:child_process';
import { verifyResults, type Result } from './commands.ts';
import type { Plan } from './selection.ts';

// No installed dependencies or hydrated assets are needed for the final gate.
const plan = JSON.parse(process.env.CI_PLAN ?? '{}') as Plan;
if (
  plan.version !== 1 ||
  !Array.isArray(plan.unitFiles) ||
  plan.head !== execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
) {
  throw new Error('Missing or stale CI plan');
}
verifyResults(plan, JSON.parse(process.env.CI_RESULTS ?? '{}') as Record<string, Result>);
console.log('Every required CI module passed');
