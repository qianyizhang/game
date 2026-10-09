import { rolldown } from 'rolldown';
import { fileURLToPath } from 'node:url';
let runtime: Promise<string> | undefined;
/** Bundle every renderer dependency into the standalone page; no CDN or browser imports. */
export function viewerRuntime(): Promise<string> {
  return (runtime ??= (async () => {
    const bundle = await rolldown({ input: fileURLToPath(new URL('viewer.ts', import.meta.url)) });
    try {
      const result = await bundle.generate({ format: 'es', codeSplitting: false });
      const entry = result.output.find((item) => item.type === 'chunk' && item.isEntry);
      if (!entry || entry.type !== 'chunk') throw new Error('Missing bundled viewer runtime');
      return entry.code.replace(/<(?=\/?script\b)/gi, '\\x3c');
    } finally {
      await bundle.close();
    }
  })());
}
