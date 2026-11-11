import { execFileSync, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { changedInputs } from './changes.ts';
import { commandFor, requiredModules } from './commands.ts';
import { catalogueFrom, dependencyGraph, trackedFiles } from './graph.ts';
import { normalApplicationFallback, selectPlan } from './selection.ts';

const root = resolve(import.meta.dirname, '../../..');
const args = process.argv.slice(3);
let baseRef = 'origin/main';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base' && args[i + 1]) baseRef = args[++i];
  else if (!['--plan', '--full'].includes(args[i])) throw new Error(`Unknown argument: ${args[i]}`);
}
const base = execFileSync('git', ['rev-parse', '--verify', `${baseRef}^{commit}`], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const { head, changes, regular, unsafePaths } = changedInputs(root, base, true);
const files = trackedFiles(root);
const graph = dependencyGraph(root, files);
const plan = selectPlan(changes, catalogueFrom(files), graph.dependants, {
  head,
  full: args.includes('--full'),
  unsafePaths,
  uncertain: graph.uncertain,
  allApplications: normalApplicationFallback(changes, true, regular),
});
// Local execution has one browser worker, so avoid restarting a runner per hosted shard.
plan.unitShards = 1;
plan.browserShards = 1;
plan.browserMatrix = [1];
plan.browserGroups = [plan.browserFiles];
console.log(JSON.stringify(plan, null, 2));
const run = (command: string[]) => {
  const result = spawnSync(command[0], command.slice(1), {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
if (!args.includes('--plan')) {
  // Never change CI or browser startup modes. Execute the in-memory selection once.
  run(['npm', 'run', 'format:check']);
  run([process.execPath, 'packages/workshop-tools/ci/integrity.ts', 'metadata']);
  if (!['documentation', 'movies'].includes(plan.mode))
    run([process.execPath, 'packages/workshop-tools/ci/integrity.ts', 'hydration']);
  const required = requiredModules(plan);
  if (required.core) {
    for (const script of [
      'lint:tools',
      'lint:app',
      'typecheck',
      'check:python',
      'test:tools',
      'test:dcc',
      'build',
      'playtest',
      'test:shader-lab',
      'test:svg-lab',
      'test:browser:smoke',
      'test:browser:shader-lab',
      'test:browser:svg-lab',
    ])
      run(['npm', 'run', script]);
    const command = commandFor(plan, 'core');
    if (command) run([resolve(root, 'node_modules/.bin', command[0]), ...command.slice(1)]);
  }
  if (required.movies)
    run([
      process.execPath,
      '--test',
      'packages/workshop-tools/art/movies.test.ts',
      'packages/workshop-tools/art/golden-claw.test.ts',
    ]);
  for (const module of ['unit', 'geometry', 'browser'] as const) {
    const count =
      module === 'unit' ? plan.unitShards : module === 'browser' ? plan.browserShards : 1;
    for (let shard = 1; shard <= count; shard++) {
      const command = commandFor(plan, module, shard);
      if (command) run([resolve(root, 'node_modules/.bin', command[0]), ...command.slice(1)]);
    }
  }
}
