import { buildRuntime, runtimePins, sha256 } from '../runtime-bundle.ts';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { relative, resolve } from 'node:path';
import { repositoryRoot } from '../io.ts';

export type Runtime = typeof import('./entry.ts');

/** The same source graph serves the JSON agent and benchmark; no server or browser is needed. */
export async function withRuntime<T>(
  use: (
    runtime: Runtime,
    pins: {
      sourceDigests: Record<string, string>;
      toolDigests: Record<string, string>;
      bundleDigest: string;
    },
  ) => T | Promise<T>,
  retainBundleDirectory?: string,
): Promise<T> {
  const directory = await mkdtemp(resolve(tmpdir(), 'night-passage-agent-'));
  try {
    const bundle = await buildRuntime({
      entry: 'packages/workshop-tools/night-passage/entry.ts',
      directory,
      fileName: 'agent.mjs',
    });
    const pins = await runtimePins(bundle);
    const toolDigests = Object.fromEntries(
      await Promise.all(
        ['runtime.ts', 'cli.ts', 'protocol.ts', 'evaluate.ts', '../runtime-bundle.ts'].map(
          async (name) => {
            const file = resolve(repositoryRoot, 'packages/workshop-tools/night-passage', name);
            return [relative(repositoryRoot, file), sha256(await readFile(file))] as const;
          },
        ),
      ),
    );
    if (retainBundleDirectory) {
      await mkdir(retainBundleDirectory, { recursive: true });
      await writeFile(
        resolve(retainBundleDirectory, `${pins.bundleDigest}.mjs`),
        await readFile(bundle.path),
      );
    }
    return await use((await import(bundle.moduleURL)) as Runtime, {
      ...pins,
      toolDigests,
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
