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
    return ['playwright', 'test', '--project=functional', ...files, `--shard=${shard}/${shards}`];
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
export function verifyResults(plan: Plan, results: Record<string, Result>): void {
  for (const name of ['plan', 'core', 'application', 'assets']) {
    const required = name !== 'application' || plan.unitFiles.length > 0;
    if (required && results[name] !== 'success')
      throw new Error(`Required ${name} checks: ${results[name] ?? 'missing'}`);
    if (!required && !['success', 'skipped'].includes(results[name]))
      throw new Error(`${name} checks failed`);
  }
}
