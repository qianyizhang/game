import {
  gltfJson,
  readBrief,
  readManifest,
  record,
  validateNativeMetadata,
  type Brief,
  type Gltf,
} from './contracts.ts';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  renameSync,
  mkdtempSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const root = dirname(fileURLToPath(import.meta.url));
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
export function readGlb(bytes: Buffer) {
  if (
    bytes.length < 20 ||
    bytes.readUInt32LE(0) !== 0x46546c67 ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length
  )
    throw new Error('Invalid or truncated GLB');
  const jsonLength = bytes.readUInt32LE(12);
  if (
    20 + jsonLength + 8 > bytes.length ||
    bytes.readUInt32LE(24 + jsonLength) !== 0x004e4942 ||
    28 + jsonLength + bytes.readUInt32LE(20 + jsonLength) !== bytes.length
  )
    throw new Error('Invalid or truncated binary chunk');
  if (bytes.readUInt32LE(16) !== 0x4e4f534a) throw new Error('Missing GLB JSON chunk');
  return gltfJson(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
}
export function accessorValues(bytes: Buffer, gltf: Gltf, index: number) {
  const accessor = gltf.accessors[index];
  if (!accessor) throw new Error('Missing GLB accessor');
  const view = gltf.bufferViews[accessor.bufferView];
  if (!view || view.buffer !== 0) throw new Error('Missing or unsupported buffer view');
  const components = ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 } as Record<string, number>)[
    accessor.type
  ];
  const readers: Record<number, [number, (offset: number) => number]> = {
    5126: [4, (offset) => bytes.readFloatLE(offset)],
    5125: [4, (offset) => bytes.readUInt32LE(offset)],
    5123: [2, (offset) => bytes.readUInt16LE(offset)],
    5121: [1, (offset) => bytes.readUInt8(offset)],
  };
  const [size, read] = readers[accessor.componentType] ?? [];
  if (!components || !size || accessor.sparse) throw new Error('Unsupported accessor in the pilot');
  const bin = 20 + bytes.readUInt32LE(12) + 8;
  const start = bin + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const stride = view.byteStride ?? components * size;
  if (stride < components * size || bin + (view.byteOffset ?? 0) + view.byteLength > bytes.length)
    throw new Error('Invalid buffer view bounds');
  if (
    start + (accessor.count - 1) * stride + components * size >
    bin + (view.byteOffset ?? 0) + view.byteLength
  )
    throw new Error('Accessor exceeds its buffer view');
  const values = [];
  for (let i = 0; i < accessor.count; i++) {
    for (let c = 0; c < components; c++) {
      const value = read(start + i * stride + c * size);
      if (!Number.isFinite(value)) throw new Error('Non-finite GLB accessor');
      values.push(value);
    }
  }
  return values;
}
export function inspectGlb(bytes: Buffer, brief: Brief) {
  const gltf = readGlb(bytes);
  const values = gltf.accessors.map((_, i) => accessorValues(bytes, gltf, i));
  for (const mesh of gltf.meshes ?? [])
    for (const primitive of mesh.primitives) {
      const weights = values[primitive.attributes.WEIGHTS_0];
      if (!weights || weights.length % 4 !== 0)
        throw new Error('Expected skin weights on every primitive');
      for (let i = 0; i < weights.length; i += 4) {
        if (
          weights.slice(i, i + 4).some((w) => w < 0) ||
          Math.abs(weights.slice(i, i + 4).reduce((a, b) => a + b, 0) - 1) > 1e-4
        )
          throw new Error('GLB skin weights are not normalized');
      }
    }
  for (const animation of gltf.animations ?? [])
    for (const sampler of animation.samplers) {
      const times = values[sampler.input];
      if (
        !times?.length ||
        Math.abs(times[0]) > 1e-6 ||
        Math.abs(times.at(-1)! - brief.animation.seconds) > 1e-5
      )
        throw new Error('Animation duration differs from the brief');
      const output = values[sampler.output];
      if (!output?.length) throw new Error('Missing animation output');
      const n = ({ VEC3: 3, VEC4: 4 } as Record<string, number>)[
        gltf.accessors[sampler.output].type
      ];
      if (!n) throw new Error('Unsupported animation accessor');
      const error = Math.max(
        ...output.slice(0, n).map((v, i) => Math.abs(v - output[output.length - n + i])),
      );
      const opposite =
        n === 4 &&
        Math.max(...output.slice(0, n).map((v, i) => Math.abs(v + output[output.length - n + i]))) <
          1e-5;
      if (error > 1e-5 && !opposite) throw new Error('Animation loop endpoints differ');
    }
  const triangles = (gltf.meshes ?? []).reduce(
    (sum, mesh) =>
      sum +
      mesh.primitives.reduce((n, p) => {
        if (p.mode !== undefined && p.mode !== 4)
          throw new Error('Only triangle meshes are supported');
        return n + gltf.accessors[p.indices ?? p.attributes.POSITION].count / 3;
      }, 0),
    0,
  );
  const animations = (gltf.animations ?? []).map((animation) => ({
    name: animation.name,
    seconds: Math.max(
      ...animation.samplers.map((s) => gltf.accessors[s.input].max?.[0] ?? Number.NaN),
    ),
    channels: animation.channels.length,
  }));
  const joints = Math.max(0, ...(gltf.skins ?? []).map((skin) => skin.joints.length));
  if (!joints || !animations.length || !triangles)
    throw new Error('Expected a rigged animated mesh');
  if (
    animations.some(
      (a) => !Number.isFinite(a.seconds) || Math.abs(a.seconds - brief.animation.seconds) > 0.05,
    )
  )
    throw new Error('Animation duration differs from the brief');
  if (
    bytes.length > brief.budgets.maxBytes ||
    triangles > brief.budgets.maxTriangles ||
    joints > brief.budgets.maxJoints
  )
    throw new Error('Asset exceeds the brief budget');
  if ((gltf.buffers ?? []).some((b) => b.uri) || (gltf.images ?? []).some((i) => i.uri))
    throw new Error('Delivery must embed all buffers and images');
  return {
    bytes: bytes.length,
    triangles,
    meshes: gltf.meshes.length,
    materials: gltf.materials?.length ?? 0,
    textures: gltf.textures?.length ?? 0,
    joints,
    animations,
  };
}
export function verify(directory = root) {
  const brief = readBrief(readFileSync(join(directory, 'briefs/briar-hydra.json'), 'utf8'));
  const manifest = readManifest(readFileSync(join(directory, 'assets/manifest.json'), 'utf8'));
  for (const [path, expected] of Object.entries(manifest.sha256)) {
    if (hash(join(directory, path)) !== expected)
      throw new Error(`Stale delivery: ${path} changed. Run dcc export.`);
  }
  const stats = inspectGlb(readFileSync(join(directory, 'assets/briar-hydra.glb')), brief);
  if (JSON.stringify(stats) !== JSON.stringify(manifest.stats))
    throw new Error('Manifest statistics do not match the GLB');
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
  args.push('--python-exit-code', '1', '--python', join(root, 'blender', script), '--', root);
  if (output) args.push(output);
  const result = spawnSync(binary, args, { stdio: 'inherit' });
  if (result.status !== 0)
    throw new Error(`Blender ${script} failed (${result.status ?? result.error})`);
}
const inputFiles = [
  'briefs/briar-hydra.json',
  'sources/briar-hydra.blend',
  'blender/build_hydra.py',
  'blender/head_shape.py',
  'blender/head_components.py',
  'blender/scale_components.py',
  'blender/author_components.py',
  'blender/export_asset.py',
  'blender/authoring_plan.py',
  'blender/native_types.py',
  'pipeline.mjs',
  'pipeline.ts',
  'contracts.ts',
];
function freshRun() {
  const parent = resolve(root, '../../.work/runtime');
  mkdirSync(parent, { recursive: true });
  return mkdtempSync(join(parent, 'dcc-export-'));
}

export function publishCandidate(
  directory: string,
  candidate: string,
  historyRoot = resolve(root, '../../test-results/dcc-delivery-history'),
) {
  const brief = readBrief(readFileSync(join(directory, 'briefs/briar-hydra.json'), 'utf8'));
  const stats = inspectGlb(readFileSync(join(candidate, 'briar-hydra.pending.glb')), brief);
  const native = record(JSON.parse(readFileSync(join(candidate, 'authoring.json'), 'utf8')));
  const poses = record(JSON.parse(readFileSync(join(candidate, 'pose-samples.json'), 'utf8')));
  validateNativeMetadata(native, poses);
  // Resolve every input and candidate hash before touching the published delivery.
  const sha256 = Object.fromEntries(inputFiles.map((path) => [path, hash(join(directory, path))]));
  for (const [from, to] of [
    ['briar-hydra.pending.glb', 'briar-hydra.glb'],
    ['authoring.json', 'authoring.json'],
    ['pose-samples.json', 'pose-samples.json'],
  ])
    sha256['assets/' + to] = hash(join(candidate, from));
  const previous = join(directory, 'assets/manifest.json');
  let previousReceipt: string | undefined;
  if (existsSync(previous)) {
    const digest = hash(previous),
      bytes = readFileSync(previous);
    const receipt = join(directory, 'assets/receipts', digest + '.json');
    mkdirSync(dirname(receipt), { recursive: true });
    if (existsSync(receipt)) {
      if (!readFileSync(receipt).equals(bytes)) throw new Error('Historical receipt collision');
    } else writeFileSync(receipt, bytes, { flag: 'wx' });
    previousReceipt = 'assets/receipts/' + digest + '.json';
    sha256[previousReceipt] = digest;
    const archive = join(historyRoot, digest);
    mkdirSync(archive, { recursive: true });
    for (const name of [
      'manifest.json',
      'briar-hydra.glb',
      'authoring.json',
      'pose-samples.json',
    ]) {
      const retained = join(archive, name),
        original = readFileSync(join(directory, 'assets', name));
      if (existsSync(retained)) {
        if (!readFileSync(retained).equals(original))
          throw new Error('Historical delivery collision');
      } else writeFileSync(retained, original, { flag: 'wx' });
    }
  }
  // Candidate validation is complete. Install data first and its receipt last; interrupted
  // publication is detectable by verify, and the preceding exact-byte delivery is retained.
  for (const [from, to] of [
    ['briar-hydra.pending.glb', 'briar-hydra.glb'],
    ['authoring.json', 'authoring.json'],
    ['pose-samples.json', 'pose-samples.json'],
  ])
    renameSync(join(candidate, from), join(directory, 'assets', to));
  const manifest = {
    schemaVersion: 1,
    id: brief.id,
    generatedAt: new Date().toISOString(),
    blender: native.blender,
    source: 'sources/briar-hydra.blend',
    asset: 'assets/briar-hydra.glb',
    stats,
    ...(previousReceipt ? { previousReceipt } : {}),
    sha256,
    native,
  };
  writeFileSync(join(directory, 'assets/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return verify(directory);
}

export function main(command = 'help', rebuild = false) {
  if (command === 'verify') {
    console.log(JSON.stringify(verify(), null, 2));
    return;
  }
  if (!['doctor', 'build', 'components', 'export', 'render'].includes(command)) {
    console.log(
      'dcc doctor | build [--rebuild] | components | render | export | verify\nBuild creates the editable source once. Export preserves hand edits. --rebuild backs up and regenerates the source.',
    );
    return;
  }
  const binary = blenderPath();
  if (command === 'doctor') {
    console.log(binary);
    return;
  }
  const source = join(root, 'sources/briar-hydra.blend');
  if (command === 'build') {
    if (existsSync(source) && !rebuild)
      throw new Error(
        'Editable source already exists. Use dcc export to publish hand edits, or build --rebuild to archive and regenerate it.',
      );
    if (existsSync(source)) {
      const backup = resolve(root, '../../test-results/dcc-backups');
      mkdirSync(backup, { recursive: true });
      copyFileSync(source, join(backup, `briar-hydra-${Date.now()}.blend`));
    }
    const candidate = join(freshRun(), 'briar-hydra.blend');
    runBlender(binary, 'build_hydra.py', undefined, candidate);
    mkdirSync(dirname(source), { recursive: true });
    renameSync(candidate, source);
  }
  if (!existsSync(source)) throw new Error('Missing editable source; run dcc build first.');
  if (command === 'components') {
    const sourceHash = hash(source);
    const candidate = join(freshRun(), 'briar-hydra.blend');
    runBlender(binary, 'author_components.py', source, candidate);
    if (hash(source) !== sourceHash)
      throw new Error('Artist source changed during component installation');
    const backup = resolve(root, '../../test-results/dcc-backups');
    mkdirSync(backup, { recursive: true });
    copyFileSync(source, join(backup, `briar-hydra-before-components-${Date.now()}.blend`));
    renameSync(candidate, source);
  }
  if (command === 'render') {
    runBlender(binary, 'render_review.py', source);
    return;
  }
  const staging = freshRun();
  const before = Object.fromEntries(inputFiles.map((path) => [path, hash(join(root, path))]));
  const candidate = join(staging, 'candidate');
  runBlender(binary, 'export_asset.py', source, candidate);
  for (const [path, digest] of Object.entries(before))
    if (hash(join(root, path)) !== digest)
      throw new Error(`Input changed during export: ${path}; delivery was not published.`);
  publishCandidate(root, candidate);

  console.log(JSON.stringify(verify(), null, 2));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv[2], process.argv.includes('--rebuild'));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
