import { build } from 'vite';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
/** Pin the actual headless dependency graph; concurrent presentation work is outside this graph. */
export async function withRecruitmentRuntime(use) {
  const directory = await mkdtemp(resolve(tmpdir(), 'hearth-recruitment-'));
  const modules = new Set();
  try {
    await build({
      configFile: false,
      logLevel: 'silent',
      plugins: [
        {
          name: 'pin-recruitment-sources',
          buildEnd() {
            for (const id of this.getModuleIds())
              if (isAbsolute(id) && !this.getModuleInfo(id)?.isExternal)
                modules.add(id.split('?')[0]);
          },
        },
      ],
      build: {
        ssr: 'src/engines/hearth-recruitment-runtime.ts',
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
          .map(async (path) => [relative(process.cwd(), path), sha256(await readFile(path))]),
      ),
    );
    return await use({
      runtime: await import(moduleURL),
      moduleURL,
      sourceDigests,
      bundleDigest: sha256(bundle),
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
