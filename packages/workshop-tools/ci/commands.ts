import type { Plan } from './selection.ts';

export type Module = 'core' | 'unit' | 'browser' | 'geometry';

/** File arguments come from a checked catalogue, never from shell interpolation. */
export function commandFor(plan: Plan, module: Module, shard = 1): string[] | null {
  if (module === 'geometry')
    return plan.geometry ? ['vitest', 'run', '--project', 'geometry'] : null;
  const files =
    module === 'core' ? plan.coreFiles : module === 'unit' ? plan.unitFiles : plan.browserFiles;
  if (!files.length) return null;
  const shards =
    module === 'unit' ? plan.unitShards : module === 'browser' ? plan.browserShards : 1;
  if (!Number.isInteger(shard) || shard < 1 || shard > shards) throw new Error('Invalid shard');
  if (module === 'browser')
    return [
      'playwright',
      'test',
      ...(plan.mode === 'full'
        ? ['--project=functional']
        : ['--project=ci-games', '--project=ci-assets']),
      ...files,
      `--shard=${shard}/${shards}`,
    ];
  return [
    'vitest',
    'run',
    '--project',
    'application',
    '--maxWorkers=1',
    ...files,
    ...(module === 'unit' && shards > 1 ? [`--shard=${shard}/${shards}`] : []),
  ];
}

export type Result = 'success' | 'failure' | 'cancelled' | 'skipped';
export function requiredModules(plan: Plan): Record<string, boolean> {
  return {
    plan: true,
    documentation: plan.mode === 'documentation',
    core: plan.mode !== 'documentation',
    application: plan.unitFiles.length > 0,
    assets: plan.geometry || plan.browserFiles.length > 0,
  };
}

/** Shared by execution and the dependency-free aggregate gate. */
export function readPlan(value: unknown, head: string): Plan {
  if (!value || typeof value !== 'object') throw new Error('Missing CI plan');
  const plan = value as Plan;
  if (
    plan.version !== 2 ||
    plan.head !== head ||
    !['documentation', 'scoped', 'application', 'full'].includes(plan.mode) ||
    ![plan.coreFiles, plan.unitFiles, plan.browserFiles].every(
      (files) => Array.isArray(files) && files.every((path) => typeof path === 'string'),
    ) ||
    typeof plan.geometry !== 'boolean' ||
    ![1, 2, 3, 4].includes(plan.unitShards) ||
    ![1, 2, 3, 4].includes(plan.browserShards) ||
    (plan.mode === 'documentation' &&
      (plan.geometry ||
        plan.coreFiles.length + plan.unitFiles.length + plan.browserFiles.length > 0))
  )
    throw new Error('Invalid or stale CI plan');
  return plan;
}

export function verifyResults(plan: Plan, results: Record<string, Result>): void {
  for (const [name, required] of Object.entries(requiredModules(plan))) {
    if (required && results[name] !== 'success')
      throw new Error(`Required ${name} checks: ${results[name] ?? 'missing'}`);
    if (!required && !['success', 'skipped'].includes(results[name]))
      throw new Error(`${name} checks failed`);
  }
}
