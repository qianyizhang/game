/** Active CLI policy around the receipt-pinned publication coordinator. */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main as pipeline, root } from './pipeline.ts';
import { findBlender } from './blender.ts';

export function main(
  command = process.argv[2],
  rebuild = process.argv.includes('--rebuild'),
  args = process.argv.slice(3),
) {
  // Keep non-native commands usable without Blender. The coordinator remains byte-pinned
  // by published receipts; validate explicit overrides before its compatibility discovery.
  if (
    ['doctor', 'build', 'components', 'render', 'export'].includes(command) &&
    process.env.BLENDER_BIN !== undefined
  )
    findBlender(root);
  pipeline(command, rebuild, args);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
