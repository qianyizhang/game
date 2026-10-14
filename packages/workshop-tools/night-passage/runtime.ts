import { build } from 'vite';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { repositoryRoot } from '../io.ts';

export type Runtime = typeof import('./entry.ts');
const hash = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');

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
  const modules = new Set<string>();
  try {
    await build({
      root: repositoryRoot,
      configFile: false,
      logLevel: 'silent',
      plugins: [
        {
          name: 'pin-night-passage-agent',
          buildEnd() {
            for (const id of this.getModuleIds()) {
              const info = this.getModuleInfo(id);
              if (isAbsolute(id) && info?.code != null) modules.add(id.split('?')[0]);
            }
          },
        },
      ],
      build: {
        ssr: resolve(repositoryRoot, 'packages/workshop-tools/night-passage/entry.ts'),
        outDir: directory,
        emptyOutDir: false,
        rollupOptions: { output: { entryFileNames: 'agent.mjs' } },
      },
    });
    const path = resolve(directory, 'agent.mjs');
    const sourceDigests = Object.fromEntries(
      await Promise.all(
        [...modules]
          .sort()
          .map(
            async (file) => [relative(repositoryRoot, file), hash(await readFile(file))] as const,
          ),
      ),
    );
    const toolDigests = Object.fromEntries(
      await Promise.all(
        ['runtime.ts', 'cli.ts', 'protocol.ts', 'evaluate.ts'].map(async (name) => {
          const file = resolve(repositoryRoot, 'packages/workshop-tools/night-passage', name);
          return [relative(repositoryRoot, file), hash(await readFile(file))] as const;
        }),
      ),
    );
    const bundleDigest = hash(await readFile(path));
    if (retainBundleDirectory) {
      await mkdir(retainBundleDirectory, { recursive: true });
      await writeFile(resolve(retainBundleDirectory, `${bundleDigest}.mjs`), await readFile(path));
    }
    return await use((await import(pathToFileURL(path).href)) as Runtime, {
      sourceDigests,
      toolDigests,
      bundleDigest,
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
