/** Explicit fox adapter over the saved canid fitting/delivery workflow. */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBlender, runBlender } from './blender.ts';
import { verifyCanid } from './canid.ts';

const root = dirname(fileURLToPath(import.meta.url));
const [command = 'check', ...args] = process.argv.slice(2);
if (command === 'check') {
  console.log(
    JSON.stringify(
      verifyCanid({
        characters: ['fox'],
        sources: join(root, 'subjects/fox'),
        directory: join(root, 'assets/fox'),
      }),
      null,
      2,
    ),
  );
} else {
  if (!['bootstrap', 'fit', 'export', 'review', 'verify', 'sample'].includes(command))
    throw new Error('Use check, bootstrap, fit, export, review, verify, or sample');
  const blender = findBlender(root);
  const evidence = command === 'verify' || command === 'sample';
  runBlender(
    blender,
    join(root, 'subjects/canid/authoring', evidence ? 'fox_verify.py' : 'fox.py'),
    [command, '--root', join(root, 'subjects/fox'), ...args],
  );
}
