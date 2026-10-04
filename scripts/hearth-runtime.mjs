import { build } from 'vite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function withHearthRuntime(use) {
  const bundle = await mkdtemp(resolve(tmpdir(), 'hearth-runtime-'));
  try {
    await build({
      configFile: false,
      logLevel: 'silent',
      build: {
        ssr: 'src/engines/hearth-runtime.ts',
        outDir: bundle,
        emptyOutDir: false,
        rollupOptions: { output: { entryFileNames: 'hearth.mjs' } },
      },
    });
    return await use(await import(pathToFileURL(resolve(bundle, 'hearth.mjs')).href));
  } finally {
    await rm(bundle, { recursive: true, force: true });
  }
}
