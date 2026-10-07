import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  renameSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const root = dirname(fileURLToPath(import.meta.url));
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
export function readGlb(bytes) {
  if (
    bytes.length < 20 ||
    bytes.readUInt32LE(0) !== 0x46546c67 ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length
  )
    throw new Error('Invalid or truncated GLB');
  if (bytes.readUInt32LE(16) !== 0x4e4f534a) throw new Error('Missing GLB JSON chunk');
  return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
}
export function accessorValues(bytes, gltf, index) {
  const accessor = gltf.accessors[index];
  const view = gltf.bufferViews[accessor.bufferView];
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[accessor.type];
  const readers = {
    5126: [4, 'readFloatLE'],
    5125: [4, 'readUInt32LE'],
    5123: [2, 'readUInt16LE'],
    5121: [1, 'readUInt8'],
  };
  const [size, read] = readers[accessor.componentType] ?? [];
  if (!components || !size || accessor.sparse) throw new Error('Unsupported accessor in the pilot');
  const bin = 20 + bytes.readUInt32LE(12) + 8;
  const start = bin + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const stride = view.byteStride ?? components * size;
  if (
    start + (accessor.count - 1) * stride + components * size >
    bin + (view.byteOffset ?? 0) + view.byteLength
  )
    throw new Error('Accessor exceeds its buffer view');
  const values = [];
  for (let i = 0; i < accessor.count; i++) {
    for (let c = 0; c < components; c++) {
      const value = bytes[read](start + i * stride + c * size);
      if (!Number.isFinite(value)) throw new Error('Non-finite GLB accessor');
      values.push(value);
    }
  }
  return values;
}
export function inspectGlb(bytes, brief) {
  const gltf = readGlb(bytes);
  const values = gltf.accessors.map((_, i) => accessorValues(bytes, gltf, i));
  for (const mesh of gltf.meshes ?? [])
    for (const primitive of mesh.primitives) {
      const weights = values[primitive.attributes.WEIGHTS_0];
      if (!weights) throw new Error('Expected skin weights on every primitive');
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
      if (Math.abs(times[0]) > 1e-6 || Math.abs(times.at(-1) - brief.animation.seconds) > 1e-5)
        throw new Error('Animation duration differs from the brief');
      const output = values[sampler.output];
      const n = { VEC3: 3, VEC4: 4 }[gltf.accessors[sampler.output].type];
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
    seconds: Math.max(...animation.samplers.map((s) => gltf.accessors[s.input].max[0])),
    channels: animation.channels.length,
  }));
  const joints = Math.max(0, ...(gltf.skins ?? []).map((skin) => skin.joints.length));
  if (!joints || !animations.length || !triangles)
    throw new Error('Expected a rigged animated mesh');
  if (animations.some((a) => Math.abs(a.seconds - brief.animation.seconds) > 0.05))
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
  const brief = JSON.parse(readFileSync(join(directory, 'briefs/briar-hydra.json')));
  const manifest = JSON.parse(readFileSync(join(directory, 'assets/manifest.json')));
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
  ].filter(Boolean);
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
    if (result.status === 0) return candidate;
  }
  throw new Error(
    'Blender is missing. Set BLENDER_BIN to a Blender 4.5 LTS executable; see README.md.',
  );
}
function runBlender(binary, script, source) {
  const args = ['--background', '--factory-startup'];
  if (source) args.push(source);
  args.push('--python-exit-code', '1', '--python', join(root, 'blender', script), '--', root);
  const result = spawnSync(binary, args, { stdio: 'inherit' });
  if (result.status !== 0)
    throw new Error(`Blender ${script} failed (${result.status ?? result.error})`);
}
export function main(command = 'help', rebuild = false) {
  if (command === 'verify') {
    console.log(JSON.stringify(verify(), null, 2));
    return;
  }
  if (!['doctor', 'build', 'export', 'render'].includes(command)) {
    console.log(
      'dcc doctor | build [--rebuild] | render | export | verify\nBuild creates the editable source once. Export preserves hand edits. --rebuild backs up and regenerates the source.',
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
    runBlender(binary, 'build_hydra.py');
  }
  if (!existsSync(source)) throw new Error('Missing editable source; run dcc build first.');
  if (command === 'render') {
    runBlender(binary, 'render_review.py', source);
    return;
  }
  const sourceHash = hash(source);
  runBlender(binary, 'export_asset.py', source);
  if (hash(source) !== sourceHash)
    throw new Error('Source changed during export; delivery was not published.');
  const brief = JSON.parse(readFileSync(join(root, 'briefs/briar-hydra.json')));
  const candidate = join(root, 'assets/briar-hydra.pending.glb');
  const stats = inspectGlb(readFileSync(candidate), brief);
  renameSync(candidate, join(root, 'assets/briar-hydra.glb'));
  const files = [
    'briefs/briar-hydra.json',
    'sources/briar-hydra.blend',
    'assets/briar-hydra.glb',
    'blender/build_hydra.py',
    'blender/export_asset.py',
    'pipeline.mjs',
    'assets/authoring.json',
    'assets/pose-samples.json',
  ];
  const native = JSON.parse(readFileSync(join(root, 'assets/authoring.json')));
  const manifest = {
    schemaVersion: 1,
    id: brief.id,
    generatedAt: new Date().toISOString(),
    blender: native.blender,
    source: 'sources/briar-hydra.blend',
    asset: 'assets/briar-hydra.glb',
    stats,
    sha256: Object.fromEntries(files.map((f) => [f, hash(join(root, f))])),
    native,
  };
  writeFileSync(join(root, 'assets/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify(verify(), null, 2));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv[2], process.argv.includes('--rebuild'));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
