/** Local integration gate. Never publishes the disposable edited source or GLB. */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { root, inspectGlb } from './pipeline.ts';
import { readBrief } from './contracts.ts';

const workspace = resolve(root, '../..');
const parent = join(workspace, 'test-results', 'dcc-native');
mkdirSync(parent, { recursive: true });
const output = join(mkdtempSync(join(parent, 'edit-loop-')), 'source-edit');
const pinned = ['sources/briar-hydra.blend', 'assets/briar-hydra.glb', 'assets/manifest.json'];
const hash = (path: string) =>
  createHash('sha256')
    .update(readFileSync(join(root, path)))
    .digest('hex');
const before = pinned.map(hash);
const binary =
  process.env.BLENDER_BIN ??
  [
    '/Applications/Blender.app/Contents/MacOS/Blender',
    join(root, '.runtime/Blender.app/Contents/MacOS/Blender'),
  ].find(existsSync) ??
  'blender';
function run(command: string, args: string[], env = process.env) {
  const result = spawnSync(command, args, { cwd: workspace, stdio: 'inherit', env });
  if (result.status !== 0)
    throw new Error(`${command} failed: ${result.error ?? result.signal ?? result.status}`);
}
console.log(`Native edit-loop evidence: ${output}`);
try {
  run(binary, [
    '--background',
    '--factory-startup',
    '--python-exit-code',
    '1',
    '--python',
    join(root, 'blender/verify_edit_loop.py'),
    '--',
    root,
    output,
  ]);
  inspectGlb(
    readFileSync(join(output, 'candidate/briar-hydra.pending.glb')),
    readBrief(readFileSync(join(root, 'briefs/briar-hydra.json'), 'utf8')),
  );
  run(
    process.execPath,
    [
      join(workspace, 'node_modules/@playwright/test/cli.js'),
      'test',
      'tests/browser/dcc-workbench.spec.ts',
      '--grep',
      'native saved edit',
      `--output=${join(output, 'browser')}`,
    ],
    { ...process.env, DCC_NATIVE_CANDIDATE: join(output, 'candidate') },
  );
} finally {
  if (pinned.some((path, index) => hash(path) !== before[index]))
    throw new Error('Native verification changed a published source or delivery');
}
