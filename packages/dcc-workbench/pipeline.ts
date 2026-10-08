import { inspectGlb } from './glb.ts';
import {
  readBrief,
  record,
  validateNativeMetadata,
  validateSavedExportMetadata,
} from './contracts.ts';
import {
  getAsset,
  loadRegistry,
  resolveAssetPath,
  validateNativeDependencies,
  type AssetDefinition,
} from './registry.ts';
import {
  snapshotInputs,
  sealCandidate,
  promoteCandidate,
  resolvePublication,
  verifyPublicationInputs,
} from './releases.ts';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  mkdirSync,
  copyFileSync,
  renameSync,
  mkdtempSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const root = dirname(fileURLToPath(import.meta.url));
export const sharedInputs = [
  'pipeline.mjs',
  'pipeline.ts',
  'contracts.ts',
  'glb.ts',
  'registry.ts',
  'releases.ts',
];
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
export { readGlb, accessorValues, inspectGlb } from './glb.ts';
export function selectAsset(directory = root, id = 'briar-hydra') {
  const asset = getAsset(loadRegistry(directory), id);
  validateNativeDependencies(asset, (path) => {
    const full = resolveAssetPath(directory, path);
    return existsSync(full) ? readFileSync(full, 'utf8') : undefined;
  });
  return asset;
}
export function inspectDelivery(
  directory: string,
  asset: AssetDefinition,
  model: string,
  audit: string,
  poses?: string,
) {
  const brief = readBrief(readFileSync(resolveAssetPath(directory, asset.brief), 'utf8'));
  if (brief.id !== asset.id || brief.animation?.seconds !== asset.delivery.animation?.seconds)
    throw new Error('Brief identity or timing differs from registry');
  const stats = inspectGlb(readFileSync(model), brief, asset.delivery.profile);
  if (asset.delivery.animation && stats.animations[0]?.name !== asset.delivery.animation.name)
    throw new Error('Animation name differs from registry');
  const native = record(JSON.parse(readFileSync(audit, 'utf8')));
  if (typeof native.blender !== 'string' || !native.blender)
    throw new Error('Missing native runtime identity');
  // This is the existing Hydra adapter contract, not a universal rig/anchor convention.
  if (asset.native.adapter === 'blender/export_asset.py') {
    if (!poses) throw new Error('Missing native pose samples');
    validateNativeMetadata(native, record(JSON.parse(readFileSync(poses, 'utf8'))));
  } else if (asset.native.adapter === 'blender/export_saved.py') {
    if (!poses || !asset.delivery.animation || asset.delivery.profile === 'static')
      throw new Error('Saved exporter requires a rigid or skinned loop with pose samples');
    validateSavedExportMetadata(native, record(JSON.parse(readFileSync(poses, 'utf8'))), {
      id: asset.id,
      source: asset.source,
      sourceSha256: hash(resolveAssetPath(directory, asset.source)),
      profile: asset.delivery.profile,
      animation: asset.delivery.animation,
    });
  } else {
    throw new Error(`No native delivery validator for ${asset.native.adapter}`);
  }
  return stats;
}
export function verify(directory = root, id = 'briar-hydra') {
  const asset = selectAsset(directory, id);
  verifyPublicationInputs(directory, asset, sharedInputs);
  const publication = resolvePublication(directory, asset);
  const stats = inspectDelivery(
    directory,
    asset,
    publication.modelPath,
    publication.auditPath,
    publication.posesPath,
  );
  if (JSON.stringify(stats) !== JSON.stringify(publication.stats))
    throw new Error('Publication statistics do not match the GLB');
  return stats;
}
function blenderPath() {
  const candidates = [
    process.env.BLENDER_BIN,
    '/Applications/Blender.app/Contents/MacOS/Blender',
    join(root, '.runtime/Blender.app/Contents/MacOS/Blender'),
    'blender',
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
    if (result.status === 0) return candidate;
    if (result.error && 'code' in result.error && result.error.code === 'ENOENT') continue;
    throw new Error(
      `Blender startup failed for ${candidate}: ${result.stderr || String(result.error ?? result.signal ?? result.status)}`,
    );
  }
  throw new Error(
    'Blender is missing. Set BLENDER_BIN to a Blender 4.5 LTS executable; see README.md.',
  );
}
function runBlender(binary: string, script: string, source?: string, output?: string) {
  const args = ['--background', '--factory-startup'];
  if (source) args.push(source);
  args.push('--python-exit-code', '1', '--python', resolveAssetPath(root, script), '--', root);
  if (output) args.push(output);
  const result = spawnSync(binary, args, { stdio: 'inherit' });
  if (result.status !== 0)
    throw new Error(`Blender ${script} failed (${result.status ?? result.error})`);
}

function freshRun() {
  const parent = resolve(root, '../../.work/runtime');
  mkdirSync(parent, { recursive: true });
  return mkdtempSync(join(parent, 'dcc-export-'));
}
export function main(command = 'help', rebuild = false, args = process.argv.slice(3)) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--rebuild') continue;
    if (args[i] === '--asset' || args[i] === '--candidate') {
      i++;
      continue;
    }
    throw new Error(`Unknown DCC option: ${args[i]}`);
  }
  const option = (name: string) => {
    const index = args.indexOf(name);
    if (index < 0) return undefined;
    if (!args[index + 1] || args[index + 1].startsWith('--'))
      throw new Error(`Missing ${name} value`);
    return args[index + 1];
  };
  if (command === 'list') {
    console.log(
      JSON.stringify(
        Object.values(loadRegistry(root).assets).map((asset) => ({
          id: asset.id,
          study: asset.legacyStudyId,
          profile: asset.delivery.profile,
        })),
        null,
        2,
      ),
    );
    return;
  }
  if (command === 'verify') {
    const selected = option('--asset');
    const ids = selected ? [selected] : Object.keys(loadRegistry(root).assets);
    console.log(
      JSON.stringify(Object.fromEntries(ids.map((id) => [id, verify(root, id)])), null, 2),
    );
    return;
  }
  if (!['doctor', 'build', 'components', 'export', 'render', 'promote'].includes(command)) {
    console.log(
      'dcc list | doctor | build [--rebuild] | components | render | export | verify | promote --candidate PATH\nSelect with --asset ID. Export creates a candidate; promotion requires a matching parent review. Native source edits and historical comparisons are preserved.',
    );
    return;
  }
  const asset = selectAsset(root, option('--asset'));
  if (command === 'promote') {
    const candidate = option('--candidate');
    if (!candidate) throw new Error('promote requires --candidate PATH');
    const result = promoteCandidate({
      root,
      asset,
      sharedInputs,
      candidate: resolve(candidate),
      validate: (paths, manifest) => {
        const stats = inspectDelivery(
          root,
          asset,
          paths.modelPath,
          paths.auditPath,
          paths.posesPath,
        );
        if (JSON.stringify(stats) !== JSON.stringify(manifest.stats))
          throw new Error('Candidate statistics do not match the GLB');
      },
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const binary = blenderPath();
  if (command === 'doctor') {
    console.log(binary);
    return;
  }
  const source = resolveAssetPath(root, asset.source);
  if (command === 'build') {
    if (!asset.native.recipe) throw new Error('This asset has no reconstruction recipe');
    if (existsSync(source) && !rebuild)
      throw new Error(
        'Editable source exists. Export preserves hand edits; --rebuild explicitly backs up and replaces them.',
      );
    const previousSourceHash = existsSync(source) ? hash(source) : undefined;
    if (existsSync(source)) {
      const backup = resolve(root, '../../test-results/dcc-backups');
      mkdirSync(backup, { recursive: true });
      copyFileSync(source, join(backup, `${asset.id}-${Date.now()}.blend`));
    }
    const candidate = join(freshRun(), `${asset.id}.blend`);
    runBlender(binary, asset.native.recipe, undefined, candidate);
    if ((existsSync(source) ? hash(source) : undefined) !== previousSourceHash)
      throw new Error(
        'Artist source changed during reconstruction; rebuilt candidate retained for review',
      );
    mkdirSync(dirname(source), { recursive: true });
    renameSync(candidate, source);
  }
  if (!existsSync(source)) throw new Error('Missing editable source; create it first.');
  if (command === 'components' || command === 'render') {
    if (asset.native.adapter !== 'blender/export_asset.py')
      throw new Error(
        `${command} is a legacy Hydra pilot capability; edit the saved source directly`,
      );
    if (command === 'render') {
      runBlender(binary, 'blender/render_review.py', source);
      return;
    }
    const before = hash(source),
      candidate = join(freshRun(), `${asset.id}.blend`);
    runBlender(binary, 'blender/author_components.py', source, candidate);
    if (hash(source) !== before)
      throw new Error('Artist source changed during component installation');
    const backup = resolve(root, '../../test-results/dcc-backups');
    mkdirSync(backup, { recursive: true });
    copyFileSync(source, join(backup, `${asset.id}-before-components-${Date.now()}.blend`));
    renameSync(candidate, source);
  }
  const snapshot = snapshotInputs(root, asset, sharedInputs);
  const candidate = join(freshRun(), asset.id);
  runBlender(binary, asset.native.adapter, source, candidate);
  const outputs = {
    model: `${asset.id}.pending.glb`,
    audit: 'authoring.json',
    ...(asset.delivery.poses ? { poses: 'pose-samples.json' } : {}),
  };
  const stats = inspectDelivery(
    root,
    asset,
    join(candidate, outputs.model),
    join(candidate, outputs.audit),
    outputs.poses ? join(candidate, outputs.poses) : undefined,
  );
  const sealed = sealCandidate({ root, asset, sharedInputs, snapshot, candidate, outputs, stats });
  console.log(
    JSON.stringify(
      {
        candidate,
        digest: sealed.digest,
        stats,
        next: 'Inspect the exact candidate, record parent review, then dcc promote --candidate PATH --asset ID.',
      },
      null,
      2,
    ),
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv[2], process.argv.includes('--rebuild'));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
