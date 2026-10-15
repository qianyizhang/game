import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { PluginOption } from 'vite';
import { buildRuntime, repositoryRoot } from './runtime-bundle.ts';

export { repositoryRoot };
export const fromRoot = (path: string) => resolve(repositoryRoot, path);
export const newOutput = (label: string) => fromRoot(`test-results/${label}-${randomUUID()}`);

/** The caller owns only this new directory. Failed outputs remain inspectable. */
export async function freshDirectory(output: string) {
  await mkdir(dirname(output), { recursive: true });
  await mkdir(output);
  return output;
}

/** Bundle the declared repository entry, then clean up only our private temporary bundle. */
export async function withBundle<T, R>(
  entry: string,
  use: (runtime: T) => Promise<R>,
  plugins: PluginOption[] = [],
): Promise<R> {
  const scratch = fromRoot('.work/runtime');
  await mkdir(scratch, { recursive: true });
  const directory = await mkdtemp(resolve(scratch, 'workshop-tool-'));
  try {
    const bundle = await buildRuntime({
      entry,
      directory,
      fileName: 'runtime.mjs',
      logLevel: 'warn',
      plugins,
    });
    // This module was compiled from our declared, typechecked entry above.
    const runtime = (await import(bundle.moduleURL)) as T;
    return await use(runtime);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export function reportFailure(error: unknown) {
  console.error(
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Tool failed',
  );
  process.exitCode = 1;
}
