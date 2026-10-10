/** Canid pilot commands and delivery validation; existing gallery releases remain independent. */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readGlb, accessorValues } from './glb.ts';
import { record } from './contracts.ts';

const root = dirname(fileURLToPath(import.meta.url));
const ids = ['ash', 'russet', 'moss'];
const durations: Record<string, number> = { idle: 4, walk: 2, look: 4 };
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

export function verifyCanid(
  directory = join(root, 'assets/canid'),
  sources = join(root, 'subjects/canid'),
) {
  return ids.map((id) => {
    const bytes = readFileSync(join(directory, `${id}.glb`));
    const receipt = record(JSON.parse(readFileSync(join(directory, `${id}.json`), 'utf8')));
    if (
      receipt.schemaVersion !== 1 ||
      receipt.character !== id ||
      receipt.sourceSha256 !== hash(join(sources, id, 'source.blend')) ||
      receipt.motionSha256 !== hash(join(sources, 'motion.blend')) ||
      receipt.modelSha256 !== hash(join(directory, `${id}.glb`))
    )
      throw new Error(`Stale canid delivery: ${id}`);
    for (const [name, expected] of Object.entries(record(receipt.exportScripts))) {
      if (
        !['canid_pipeline.py', 'canid_rig.py', 'native_types.py'].includes(name) ||
        hash(join(root, 'blender', name)) !== expected
      )
        throw new Error(`Stale canid exporter: ${name}`);
    }
    const profile = record(receipt.profile);
    if (profile.sourceSha256 !== receipt.motionSha256 || profile.meshSha256 !== receipt.meshSha256)
      throw new Error('Canid fitting changed mesh data');
    const gltf = readGlb(bytes);
    const values = gltf.accessors.map((_, i) => accessorValues(bytes, gltf, i));
    const names = gltf.animations.map((a) => a.name).sort();
    if (JSON.stringify(names) !== JSON.stringify(Object.keys(durations).sort()))
      throw new Error('Expected three named canid clips');
    for (const animation of gltf.animations) {
      const seconds = durations[animation.name ?? ''];
      for (const sampler of animation.samplers) {
        const times = values[sampler.input];
        if (
          times[0] !== 0 ||
          Math.abs(times.at(-1)! - seconds) > 1e-5 ||
          times.some((t, i) => i > 0 && t <= times[i - 1])
        )
          throw new Error(`Invalid clip timing: ${animation.name}`);
        const output = values[sampler.output];
        const n = gltf.accessors[sampler.output].type === 'VEC4' ? 4 : 3;
        const start = output.slice(0, n),
          end = output.slice(-n);
        const error = Math.max(...start.map((x, i) => Math.abs(x - end[i])));
        const opposite = n === 4 && Math.max(...start.map((x, i) => Math.abs(x + end[i]))) < 1e-5;
        if (error > 1e-5 && !opposite) throw new Error(`Open animation loop: ${animation.name}`);
      }
    }
    let triangles = 0;
    for (const mesh of gltf.meshes)
      for (const primitive of mesh.primitives) {
        const count = gltf.accessors[primitive.attributes.POSITION].count;
        triangles += gltf.accessors[primitive.indices ?? primitive.attributes.POSITION].count / 3;
        const weights = values[primitive.attributes.WEIGHTS_0];
        const joints = values[primitive.attributes.JOINTS_0];
        if (weights?.length !== count * 4 || joints?.length !== count * 4)
          throw new Error('Incomplete canid skin');
        for (let i = 0; i < weights.length; i += 4)
          if (
            Math.abs(weights.slice(i, i + 4).reduce((a, b) => a + b, 0) - 1) > 1e-4 ||
            weights.slice(i, i + 4).some((w) => w < 0)
          )
            throw new Error('Invalid canid skin weights');
        if (
          joints.some((j) => !Number.isSafeInteger(j) || j < 0 || j >= gltf.skins[0].joints.length)
        )
          throw new Error('Invalid canid joint binding');
        const normals = values[primitive.attributes.NORMAL];
        for (let i = 0; i < normals.length; i += 3)
          if (Math.abs(Math.hypot(normals[i], normals[i + 1], normals[i + 2]) - 1) > 0.0005)
            throw new Error('Invalid canid normal');
      }
    if (
      bytes.length > 4_000_000 ||
      triangles > 50_000 ||
      gltf.skins.some((s) => s.joints.length > 32)
    )
      throw new Error('Canid exceeds pilot budget');
    if (gltf.buffers.some((b) => b.uri) || gltf.images?.some((i) => i.uri))
      throw new Error('Canid has remote dependencies');
    for (const contact of Object.values(record(receipt.contacts))) {
      const data = record(contact);
      for (const field of ['maxSoleHeight', 'maxSoleFrameSlip', 'ankleLoopError']) {
        const value = data[field];
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 0.001)
          throw new Error(`Canid contact failure: ${field}`);
      }
    }
    return {
      id,
      bytes: bytes.length,
      triangles,
      joints: gltf.skins[0].joints.length,
      clips: names,
    };
  });
}

function main() {
  const [command = 'check', ...args] = process.argv.slice(2);
  if (command === 'check') {
    console.log(JSON.stringify(verifyCanid(args[0]), null, 2));
    return;
  }
  if (!['bootstrap', 'fit', 'export', 'verify'].includes(command))
    throw new Error('Use check, bootstrap, fit, export, or verify');
  const blender =
    process.env.BLENDER_BIN ??
    [
      '/Applications/Blender.app/Contents/MacOS/Blender',
      join(root, '.runtime/Blender.app/Contents/MacOS/Blender'),
    ].find(existsSync) ??
    'blender';
  const source = join(root, 'subjects/canid');
  const script = command === 'verify' ? 'verify_canid.py' : 'canid_pipeline.py';
  if (command === 'verify' && args.length !== 1)
    throw new Error('verify requires a fresh output directory');
  const nativeArgs =
    command === 'verify' ? [source, resolve(args[0])] : [command, '--root', source, ...args];
  const result = spawnSync(
    blender,
    [
      '--background',
      '--factory-startup',
      '--python-exit-code',
      '1',
      '--python',
      join(root, 'blender', script),
      '--',
      ...nativeArgs,
    ],
    { stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Canid native command failed (${result.signal ?? result.status})`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
