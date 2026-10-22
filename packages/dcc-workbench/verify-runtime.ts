/** Whole-library native runtime gate; all new-format saves remain in fresh evidence. */
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBlender, runBlender } from './blender.ts';
import { root } from './pipeline.ts';

export function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') {
    console.log(
      'verify-runtime --output test-results/FRESH [--baseline PRIOR/samples.json]\nOpen, evaluate, save and reopen all saved native masters on fresh copies. Baseline comparison requires identical original source hashes. Run with approved execution outside the macOS sandbox.',
    );
    return;
  }
  if (
    ![2, 4].includes(args.length) ||
    args[0] !== '--output' ||
    !args[1] ||
    args[1].startsWith('--') ||
    (args.length === 4 && (args[2] !== '--baseline' || !args[3] || args[3].startsWith('--')))
  )
    throw new Error('Expected --output FRESH [--baseline PRIOR/samples.json]');
  const output = resolve(args[1]);
  runBlender(
    findBlender(root),
    join(root, 'blender/verify_runtime.py'),
    [root, output, ...(args.length === 4 ? ['--baseline', resolve(args[3])] : [])],
    { cwd: resolve(root, '../..') },
  );
  console.log(`Native runtime proof: ${join(output, 'report.json')}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
