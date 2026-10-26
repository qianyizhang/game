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
  // Keep non-native commands usable without Blender. Pass the validated runtime into
  // the receipt-pinned coordinator so its historical discovery cannot select 4.5.
  if (!['doctor', 'build', 'components', 'render', 'export'].includes(command)) {
    pipeline(command, rebuild, args);
    return;
  }
  const prior = process.env.BLENDER_BIN;
  const binary = findBlender(root);
  try {
    process.env.BLENDER_BIN = binary;
    pipeline(command, rebuild, args);
  } finally {
    if (prior === undefined) delete process.env.BLENDER_BIN;
    else process.env.BLENDER_BIN = prior;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
