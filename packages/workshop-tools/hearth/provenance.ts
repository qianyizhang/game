import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fromRoot } from '../io.ts';

/** Git still lists tracked files deleted in an uncommitted move. Record that absence explicitly. */
export async function sourceSnapshot(paths: string[]) {
  const entries = await Promise.all(
    paths.map(async (path) => {
      try {
        const bytes = await readFile(fromRoot(path));
        return { path, digest: createHash('sha256').update(bytes).digest('hex') };
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
          return { path, digest: null };
        throw error;
      }
    }),
  );
  const sourceDigests: Record<string, string> = {};
  const missingSources: string[] = [];
  for (const { path, digest } of entries) {
    if (digest === null) missingSources.push(path);
    else sourceDigests[path] = digest;
  }
  return { sourceDigests, missingSources };
}
