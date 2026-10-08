/** Local native edit/save/reload/export/browser gate. All edits stay in a disposable copy. */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { root, selectAsset, sharedInputs, inspectDelivery } from './pipeline.ts';
import { assetInputPaths, resolveAssetPath } from './registry.ts';
import { resolvePublication, sealCandidate, snapshotInputs } from './releases.ts';

const workspace = resolve(root, '../..');
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
function run(command: string, args: string[], env = process.env) {
  const result = spawnSync(command, args, { cwd: workspace, stdio: 'inherit', env });
  if (result.status !== 0)
    throw new Error(`${command} failed: ${result.error ?? result.signal ?? result.status}`);
}

export function main(args = process.argv.slice(2)) {
  if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
    console.log(
      'verify-saved --asset ID\nVerify a declared native control through edit, restore, save/reload, export and browser reload. Only fresh test-results/dcc-native copies are edited. On macOS, invoke with approved execution outside the restricted sandbox for Blender and Chrome.',
    );
    return;
  }
  if (args.length !== 2 || args[0] !== '--asset' || !args[1] || args[1].startsWith('--'))
    throw new Error('Expected --asset ID; use --help for the native verification contract');
  const asset = selectAsset(root, args[1]);
  if (asset.native.adapter !== 'blender/export_saved.py')
    throw new Error(
      'This gate requires a registered saved-export asset; the legacy pilot uses test:dcc:native',
    );
  const source = resolveAssetPath(root, asset.source);
  const pointer = resolveAssetPath(root, `${asset.delivery.publication}/current.json`);
  const protectedPaths = new Set([source, pointer]);
  if (existsSync(pointer) || existsSync(resolveAssetPath(root, asset.delivery.manifest))) {
    const publication = resolvePublication(root, asset);
    for (const path of [publication.modelPath, publication.sourcePath, publication.manifestPath])
      protectedPaths.add(path);
  }
  const pins = [...protectedPaths].map((path) => ({
    path,
    sha256: existsSync(path) ? hash(path) : null,
  }));
  const evidenceRoot = join(workspace, 'test-results/dcc-native');
  mkdirSync(evidenceRoot, { recursive: true });
  const output = mkdtempSync(join(evidenceRoot, 'saved-'));
  const copiedRoot = join(output, 'package');
  mkdirSync(copiedRoot);
  console.log(`Native saved-edit evidence: ${output}`);
  let complete = false;
  try {
    const verifyScript = 'blender/verify_saved_edits.py';
    for (const path of new Set([...assetInputPaths(asset), ...sharedInputs, verifyScript])) {
      const destination = join(copiedRoot, path);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(resolveAssetPath(root, path), destination);
    }
    const { id, ...definition } = asset;
    writeFileSync(
      join(copiedRoot, 'registry.json'),
      JSON.stringify({ schemaVersion: 1, assets: { [id]: definition } }, null, 2) + '\n',
    );
    writeFileSync(
      join(copiedRoot, '.native-edit-copy.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          id,
          originSource: source,
          sourceSha256: hash(source),
        },
        null,
        2,
      ) + '\n',
    );
    const binary =
      process.env.BLENDER_BIN ??
      [
        '/Applications/Blender.app/Contents/MacOS/Blender',
        join(root, '.runtime/Blender.app/Contents/MacOS/Blender'),
      ].find(existsSync) ??
      'blender';
    const copiedSource = join(copiedRoot, asset.source);
    run(binary, [
      '--background',
      '--factory-startup',
      copiedSource,
      '--python-exit-code',
      '1',
      '--python',
      join(copiedRoot, verifyScript),
      '--',
      copiedRoot,
      id,
      join(output, 'native-edit.json'),
    ]);
    const snapshot = snapshotInputs(copiedRoot, asset, sharedInputs);
    const candidate = join(output, 'candidate', id);
    run(binary, [
      '--background',
      '--factory-startup',
      copiedSource,
      '--python-exit-code',
      '1',
      '--python',
      join(copiedRoot, asset.native.adapter),
      '--',
      copiedRoot,
      candidate,
    ]);
    const outputs = {
      model: `${id}.pending.glb`,
      audit: 'authoring.json',
      poses: 'pose-samples.json',
    };
    const stats = inspectDelivery(
      copiedRoot,
      asset,
      join(candidate, outputs.model),
      join(candidate, outputs.audit),
      join(candidate, outputs.poses),
    );
    sealCandidate({ root: copiedRoot, asset, sharedInputs, snapshot, candidate, outputs, stats });
    run(
      process.execPath,
      [
        join(workspace, 'node_modules/@playwright/test/cli.js'),
        'test',
        'tests/browser/native-assets.spec.ts',
        '--grep',
        'saved native candidate',
        `--output=${join(output, 'browser')}`,
      ],
      { ...process.env, DCC_SAVED_CANDIDATE: candidate },
    );
    complete = true;
  } finally {
    const preservation = pins.map((pin) => {
      let after: string | null = null;
      try {
        if (existsSync(pin.path)) after = hash(pin.path);
      } catch {
        after = 'unreadable';
      }
      return { ...pin, after, unchanged: after === pin.sha256 };
    });
    writeFileSync(
      join(output, 'preservation.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          id: asset.id,
          completed: complete,
          sourceAndPublicationUnchanged: preservation.every((pin) => pin.unchanged),
          files: preservation,
        },
        null,
        2,
      ) + '\n',
    );
    if (preservation.some((pin) => !pin.unchanged))
      throw new Error(
        'Native verification observed a changed production source or publication; see preservation.json',
      );
    console.log(
      `Production source and publication preserved; verification ${complete ? 'passed' : 'incomplete'}. Evidence: ${output}`,
    );
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
