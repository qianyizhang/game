import { repositoryRoot } from '../io.ts';
import { build } from 'vite';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

export const sha256 = (bytes: string | Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');
/** Pin the actual headless dependency graph; concurrent presentation work is outside this graph. */
export type RecruitmentRuntime = typeof import('../../../src/engines/hearth-recruitment-runtime');
export async function withRecruitmentRuntime<R>(
  use: (context: {
    runtime: RecruitmentRuntime;
    moduleURL: string;
    sourceDigests: Record<string, string>;
    bundleDigest: string;
  }) => R | Promise<R>,
) {
  const directory = await mkdtemp(resolve(tmpdir(), 'hearth-recruitment-'));
  const modules = new Set<string>();
  try {
    await build({
      root: repositoryRoot,
      configFile: false,
      logLevel: 'silent',
      plugins: [
        {
          name: 'pin-recruitment-sources',
          buildEnd() {
            for (const id of this.getModuleIds()) {
              const info = this.getModuleInfo(id);
              if (isAbsolute(id) && info && info.code !== null) modules.add(id.split('?')[0]);
            }
          },
        },
      ],
      build: {
        ssr: resolve(repositoryRoot, 'src/engines/hearth-recruitment-runtime.ts'),
        outDir: directory,
        emptyOutDir: false,
        rollupOptions: { output: { entryFileNames: 'recruitment.mjs' } },
      },
    });
    const moduleURL = pathToFileURL(resolve(directory, 'recruitment.mjs')).href;
    const bundle = await readFile(resolve(directory, 'recruitment.mjs'));
    const sourceDigests = Object.fromEntries(
      await Promise.all(
        [...modules]
          .sort()
          .map(
            async (path) => [relative(repositoryRoot, path), sha256(await readFile(path))] as const,
          ),
      ),
    );
    return await use({
      runtime: (await import(moduleURL)) as RecruitmentRuntime,
      moduleURL,
      sourceDigests,
      bundleDigest: sha256(bundle),
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
