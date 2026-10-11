/** Explicit fox adapter over the saved canid fitting/delivery workflow. */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
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
  const blender =
    process.env.BLENDER_BIN ??
    [
      '/Applications/Blender.app/Contents/MacOS/Blender',
      join(root, '.runtime/Blender.app/Contents/MacOS/Blender'),
    ].find(existsSync) ??
    'blender';
  const evidence = command === 'verify' || command === 'sample';
  const result = spawnSync(
    blender,
    [
      '--background',
      '--factory-startup',
      '--python-exit-code',
      '1',
      '--python',
      join(root, 'subjects/canid/authoring', evidence ? 'fox_verify.py' : 'fox.py'),
      '--',
      command,
      '--root',
      join(root, 'subjects/fox'),
      ...args,
    ],
    { stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Fox ${command} failed (${result.signal ?? result.status})`);
}
