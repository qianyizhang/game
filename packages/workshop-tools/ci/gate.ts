import { execFileSync } from 'node:child_process';
import { verifyEnvironment } from './environment.ts';
import { readPlan, verifyResults, type Result } from './commands.ts';

// No installed dependencies or hydrated assets are needed for the final gate.
const plan = readPlan(
  JSON.parse(process.env.CI_PLAN ?? '{}'),
  execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
);
if (plan.mode !== 'documentation') verifyEnvironment(plan.environment);
verifyResults(
  plan,
  JSON.parse(process.env.CI_RESULTS ?? '{}') as Record<string, Result>,
  process.env.CI_REUSED === 'true',
);
console.log('Every required CI module passed');
