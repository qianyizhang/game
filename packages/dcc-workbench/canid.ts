/** Canid pilot commands and delivery validation; existing gallery releases remain independent. */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readGlb, accessorValues } from './glb.ts';
import { record } from './contracts.ts';
import { readMotions } from './motion-contract.ts';

const root = dirname(fileURLToPath(import.meta.url));
const ids = ['ash', 'russet', 'moss'];
const baselineDurations: Record<string, number> = { idle: 4, walk: 2, look: 4 };
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

export function verifyCanid({
  baseline = false,
  directory,
  sources,
}: {
  baseline?: boolean;
  directory?: string;
  sources?: string;
} = {}) {
  directory ??= join(root, baseline ? 'assets/canid' : 'assets/canid/refined');
  sources ??= join(root, baseline ? 'subjects/canid' : 'subjects/canid/refined');
  const exporterPaths = baseline
    ? ['canid_pipeline.py', 'canid_rig.py', 'native_types.py']
    : [
        'subjects/canid/authoring/delivery.py',
        'subjects/canid/authoring/rig.py',
        'subjects/canid/authoring/parameters.py',
        'subjects/canid/authoring/contacts.py',
        'subjects/canid/authoring/motion_spec.py',
        'blender/native_types.py',
      ];
  return ids.map((id) => {
    const bytes = readFileSync(join(directory, `${id}.glb`));
    const receipt = record(JSON.parse(readFileSync(join(directory, `${id}.json`), 'utf8')));
    const motions = baseline ? null : readMotions(receipt.clips);
    if (
      motions &&
      JSON.stringify(motions) !==
        JSON.stringify(
          readMotions(JSON.parse(readFileSync(join(directory, `${id}.motions.json`), 'utf8'))),
        )
    )
      throw new Error(`Motion metadata differs from native delivery: ${id}`);
    const durations = motions
      ? Object.fromEntries(Object.entries(motions).map(([id, m]) => [id, m.seconds]))
      : baselineDurations;
    if (
      receipt.schemaVersion !== (baseline ? 1 : 3) ||
      receipt.character !== id ||
      receipt.sourceSha256 !== hash(join(sources, id, 'source.blend')) ||
      receipt.motionSha256 !== hash(join(sources, 'motion.blend')) ||
      receipt.modelSha256 !== hash(join(directory, `${id}.glb`))
    )
      throw new Error(`Stale canid delivery: ${id}`);
    if (
      JSON.stringify(Object.keys(record(receipt.exportScripts)).sort()) !==
      JSON.stringify([...exporterPaths].sort())
    )
      throw new Error('Incomplete canid exporter identity');
    for (const [name, expected] of Object.entries(record(receipt.exportScripts))) {
      if (
        !exporterPaths.includes(name) ||
        hash(join(root, baseline ? 'blender' : '', name)) !== expected
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
      throw new Error('Incomplete named canid clips');
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
        if ((!motions || motions[animation.name!].playback === 'loop') && error > 1e-5 && !opposite)
          throw new Error(`Open animation loop: ${animation.name}`);
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
      triangles > (baseline ? 50_000 : 100_000) ||
      gltf.skins.some((s) => s.joints.length > (baseline ? 32 : 40))
    )
      throw new Error('Canid exceeds pilot budget');
    if (gltf.buffers.some((b) => b.uri) || gltf.images?.some((i) => i.uri))
      throw new Error('Canid has remote dependencies');
    for (const [clip, contact] of Object.entries(record(receipt.contacts))) {
      const data = record(contact);
      for (const field of ['maxSoleHeight', 'maxSoleFrameSlip', 'ankleLoopError']) {
        if (field === 'ankleLoopError' && motions?.[clip].playback === 'once') continue;
        const value = data[field];
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 0.001)
          throw new Error(`Canid contact failure: ${field}`);
      }
      if (
        !baseline &&
        (typeof data.minBodyHeight !== 'number' ||
          data.minBodyHeight < -0.002 ||
          !Number.isFinite(data.minBodyHeight))
      )
        throw new Error(`Body passes through floor: ${id}/${clip}`);
      if (
        !baseline &&
        (typeof data.maxRollingHeight !== 'number' ||
          !Number.isFinite(data.maxRollingHeight) ||
          data.maxRollingHeight > 0.04 ||
          typeof data.maxIkError !== 'number' ||
          !Number.isFinite(data.maxIkError) ||
          data.maxIkError > 0.002)
      )
        throw new Error(`Invalid body support or limb reach: ${id}/${clip}`);
    }
    if (!baseline) {
      const contacts = record(receipt.contacts);
      if (
        JSON.stringify(Object.keys(contacts).sort()) !==
        JSON.stringify(Object.keys(durations).sort())
      )
        throw new Error('Incomplete contact evidence');
      for (const name of ['walk', 'trot', 'run']) {
        const contact = record(contacts[name]);
        if (
          typeof contact.minSwingClearance !== 'number' ||
          contact.minSwingClearance < 0.08 ||
          typeof contact.minFootHeight !== 'number' ||
          contact.minFootHeight < -0.002 ||
          typeof contact.maxIkError !== 'number' ||
          contact.maxIkError > 0.002
        )
          throw new Error(`Invalid articulated gait: ${id}/${name}`);
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
  const argv = process.argv.slice(2);
  const baseline = argv.includes('--baseline');
  const [command = 'check', ...args] = argv.filter((a) => a !== '--baseline');
  if (command === 'check') {
    console.log(JSON.stringify(verifyCanid({ baseline, directory: args[0] }), null, 2));
    return;
  }
  if (!['bootstrap', 'fit', 'export', 'verify', 'review'].includes(command))
    throw new Error('Use check, bootstrap, fit, export, review, or verify');
  const blender =
    process.env.BLENDER_BIN ??
    [
      '/Applications/Blender.app/Contents/MacOS/Blender',
      join(root, '.runtime/Blender.app/Contents/MacOS/Blender'),
    ].find(existsSync) ??
    'blender';
  const source = join(root, baseline ? 'subjects/canid' : 'subjects/canid/refined');
  const script = baseline
    ? join(root, 'blender', command === 'verify' ? 'verify_canid.py' : 'canid_pipeline.py')
    : join(root, 'subjects/canid/authoring', command === 'verify' ? 'verify.py' : 'delivery.py');
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
      script,
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
