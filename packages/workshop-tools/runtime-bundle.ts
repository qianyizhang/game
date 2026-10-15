import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build, type LogLevel, type PluginOption } from 'vite';

export const sha256 = (bytes: string | Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');
export const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));

/** Build into a caller-owned directory. Import and lifetime stay with the caller. */
export async function buildRuntime(options: {
  entry: string;
  directory: string;
  fileName: string;
  plugins?: PluginOption[];
  logLevel?: LogLevel;
}) {
  const sourcePaths = new Set<string>();
  await build({
    root: repositoryRoot,
    configFile: false,
    logLevel: options.logLevel ?? 'silent',
    plugins: [
      ...(options.plugins ?? []),
      {
        name: 'pin-runtime-sources',
        buildEnd() {
          for (const id of this.getModuleIds()) {
            const info = this.getModuleInfo(id);
            if (isAbsolute(id) && info?.code != null) sourcePaths.add(id.split('?')[0]);
          }
        },
      },
    ],
    build: {
      ssr: resolve(repositoryRoot, options.entry),
      outDir: options.directory,
      emptyOutDir: false,
      rolldownOptions: { output: { entryFileNames: options.fileName } },
    },
  });
  const path = resolve(options.directory, options.fileName);
  return { path, moduleURL: pathToFileURL(path).href, sourcePaths };
}

/** Hash source files after the build, as before; this is not an atomic source snapshot. */
export async function runtimePins(bundle: Awaited<ReturnType<typeof buildRuntime>>) {
  const sourceDigests = Object.fromEntries(
    await Promise.all(
      [...bundle.sourcePaths]
        .sort()
        .map(
          async (path) => [relative(repositoryRoot, path), sha256(await readFile(path))] as const,
        ),
    ),
  );
  return { sourceDigests, bundleDigest: sha256(await readFile(bundle.path)) };
}
