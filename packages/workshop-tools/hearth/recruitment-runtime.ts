import { buildRuntime, runtimePins } from '../runtime-bundle.ts';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

export { sha256 } from '../runtime-bundle.ts';
/** Pin the actual headless dependency graph; concurrent presentation work is outside this graph. */
export type Runtime = typeof import('./recruitment-entry');
export async function withRuntime<R>(
  use: (context: {
    runtime: Runtime;
    moduleURL: string;
    sourceDigests: Record<string, string>;
    bundleDigest: string;
  }) => R | Promise<R>,
) {
  const directory = await mkdtemp(resolve(tmpdir(), 'hearth-recruitment-'));
  try {
    const bundle = await buildRuntime({
      entry: 'packages/workshop-tools/hearth/recruitment-entry.ts',
      directory,
      fileName: 'recruitment.mjs',
    });
    const pins = await runtimePins(bundle);
    return await use({
      runtime: (await import(bundle.moduleURL)) as Runtime,
      moduleURL: bundle.moduleURL,
      ...pins,
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
