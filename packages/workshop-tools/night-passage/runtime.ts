import { buildRuntime, runtimePins, sha256 } from '../runtime-bundle.ts';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { relative, resolve } from 'node:path';
import { repositoryRoot } from '../io.ts';

import type { PolicyPlayer } from '../../../src/games/night-passage/agent/rollout';

export type Runtime = typeof import('./entry.ts') & { custom?: PolicyPlayer };

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
  policyModule?: string,
): Promise<T> {
  const directory = await mkdtemp(resolve(tmpdir(), 'night-passage-agent-'));
  try {
    let entry = 'packages/workshop-tools/night-passage/entry.ts';
    if (policyModule) {
      entry = resolve(directory, 'entry.ts');
      await writeFile(
        entry,
        `export * from ${JSON.stringify(resolve(repositoryRoot, 'packages/workshop-tools/night-passage/entry.ts'))};\nexport { default as custom } from ${JSON.stringify(resolve(policyModule))};\n`,
      );
    }
    const bundle = await buildRuntime({
      entry,
      directory,
      fileName: 'agent.mjs',
    });
    if (policyModule) {
      bundle.sourcePaths.delete(entry);
      bundle.sourcePaths.delete(await realpath(entry));
    }
    const pins = await runtimePins(bundle);
    const toolDigests = Object.fromEntries(
      await Promise.all(
        [
          'runtime.ts',
          'cli.ts',
          'policy-cli.ts',
          'protocol.ts',
          'evaluate.ts',
          '../runtime-bundle.ts',
          '../io.ts',
          '../policy/cli.ts',
        ].map(async (name) => {
          const file = resolve(repositoryRoot, 'packages/workshop-tools/night-passage', name);
          return [relative(repositoryRoot, file), sha256(await readFile(file))] as const;
        }),
      ),
    );
    if (retainBundleDirectory) {
      await mkdir(retainBundleDirectory, { recursive: true });
      const retained = resolve(retainBundleDirectory, `${pins.bundleDigest}.mjs`);
      const bytes = await readFile(bundle.path);
      try {
        await writeFile(retained, bytes, { flag: 'wx' });
      } catch (error) {
        if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
        if (!(await readFile(retained)).equals(bytes))
          throw new Error(
            'Retained Night Passage bundle differs from its content-addressed source.',
          );
      }
    }
    const runtime = (await import(bundle.moduleURL)) as Runtime;
    if (policyModule) {
      const player = runtime.custom;
      if (
        !player ||
        typeof player.id !== 'string' ||
        !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(player.id) ||
        runtime.POLICIES.includes(player.id as (typeof runtime.POLICIES)[number]) ||
        typeof player.version !== 'string' ||
        player.version.length < 1 ||
        player.version.length > 128 ||
        typeof player.create !== 'function'
      )
        throw new Error(
          'Policy module must default-export {id, version, create}; use a unique ID distinct from quick, balanced and deliberate.',
        );
    }
    return await use(runtime, {
      ...pins,
      toolDigests,
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
