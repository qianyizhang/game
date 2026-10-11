/** River-otter source and paw support contract; the browser consumes ordinary baked clips. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readGlb, accessorValues } from './glb.ts';
import { record } from './contracts.ts';
import { readMotions } from './motion-contract.ts';

const root = dirname(fileURLToPath(import.meta.url));
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
export function verifyOtter(directory = join(root, 'assets/otter')) {
  const receipt = record(JSON.parse(readFileSync(join(directory, 'otter.json'), 'utf8')));
  const bytes = readFileSync(join(directory, 'otter.glb'));
  const motions = readMotions(receipt.clips);
  if (
    receipt.schemaVersion !== 1 ||
    receipt.character !== 'otter' ||
    receipt.sourceSha256 !== hash(join(root, 'subjects/otter/otter/source.blend')) ||
    receipt.motionSha256 !== hash(join(root, 'subjects/otter/motion.blend')) ||
    receipt.modelSha256 !== hash(join(directory, 'otter.glb'))
  )
    throw new Error('Stale otter source or delivery');
  const scripts = [
    'subjects/otter/authoring/otter_delivery.py',
    'subjects/otter/authoring/otter_rig.py',
    'subjects/otter/authoring/otter_motion.py',
    'blender/native_types.py',
  ];
  if (
    JSON.stringify(Object.keys(record(receipt.exportScripts)).sort()) !==
    JSON.stringify(scripts.sort())
  )
    throw new Error('Incomplete otter exporter identity');
  for (const [path, expected] of Object.entries(record(receipt.exportScripts)))
    if (!scripts.includes(path) || hash(join(root, path)) !== expected)
      throw new Error(`Stale otter exporter: ${path}`);
  if (Object.values(record(receipt.clips)).some((c) => 'samples' in record(c)))
    throw new Error('Temporary poses belong outside delivery');
  if (
    JSON.stringify(motions) !==
    JSON.stringify(
      readMotions(JSON.parse(readFileSync(join(directory, 'otter.motions.json'), 'utf8'))),
    )
  )
    throw new Error('Motion contract differs');
  const profile = record(receipt.profile);
  if (
    profile.meshSha256 !== receipt.meshSha256 ||
    profile.sourceSha256 !== receipt.motionSha256 ||
    profile.geometryDigestVersion !== 2 ||
    receipt.geometryDigestVersion !== 2 ||
    receipt.sourceTransformContract !== 'identity object, parent inverse and scene transforms'
  )
    throw new Error('Fitting changed mesh/weights');
  const gltf = readGlb(bytes);
  const values = gltf.accessors.map((_, i) => accessorValues(bytes, gltf, i));
  if (values.some((a) => a.some((v) => !Number.isFinite(v))))
    throw new Error('Non-finite otter data');
  const names = gltf.animations.map((a) => a.name).sort();
  if (JSON.stringify(names) !== JSON.stringify(Object.keys(motions).sort()))
    throw new Error('Incomplete otter clips');
  for (const animation of gltf.animations) {
    const motion = motions[animation.name!];
    for (const sampler of animation.samplers) {
      const times = values[sampler.input];
      if (
        times[0] !== 0 ||
        Math.abs(times.at(-1)! - motion.seconds) > 1e-5 ||
        times.some((t, i) => i > 0 && t <= times[i - 1])
      )
        throw new Error('Invalid clip timing');
      const output = values[sampler.output];
      const n = gltf.accessors[sampler.output].type === 'VEC4' ? 4 : 3;
      const a = output.slice(0, n),
        b = output.slice(-n);
      const error = Math.max(...a.map((x, i) => Math.abs(x - b[i])));
      const opposite = n === 4 && Math.max(...a.map((x, i) => Math.abs(x + b[i]))) < 1e-5;
      if (motion.playback === 'loop' && error > 1e-5 && !opposite)
        throw new Error(`Open loop: ${animation.name}`);
    }
  }
  let triangles = 0;
  for (const mesh of gltf.meshes)
    for (const p of mesh.primitives) {
      const count = gltf.accessors[p.attributes.POSITION].count;
      triangles += gltf.accessors[p.indices ?? p.attributes.POSITION].count / 3;
      const weights = values[p.attributes.WEIGHTS_0],
        joints = values[p.attributes.JOINTS_0];
      if (weights?.length !== count * 4 || joints?.length !== count * 4)
        throw new Error('Incomplete otter skin');
      for (let i = 0; i < weights.length; i += 4)
        if (
          Math.abs(weights.slice(i, i + 4).reduce((a, b) => a + b, 0) - 1) > 1e-4 ||
          weights.slice(i, i + 4).some((w) => w < 0)
        )
          throw new Error('Invalid skin weights');
      if (joints.some((j) => !Number.isSafeInteger(j) || j < 0 || j >= gltf.skins[0].joints.length))
        throw new Error('Invalid joint binding');
      const normals = values[p.attributes.NORMAL];
      for (let i = 0; i < normals.length; i += 3)
        if (Math.abs(Math.hypot(normals[i], normals[i + 1], normals[i + 2]) - 1) > 0.0005)
          throw new Error('Invalid normal');
    }
  if (
    bytes.length > 5_000_000 ||
    triangles > 110_000 ||
    gltf.skins.some((s) => s.joints.length > 24)
  )
    throw new Error('Otter delivery budget exceeded');
  if (gltf.buffers.some((b) => b.uri) || gltf.images?.some((i) => i.uri))
    throw new Error('External dependency');
  const support = record(receipt.support);
  if (JSON.stringify(Object.keys(support).sort()) !== JSON.stringify(Object.keys(motions).sort()))
    throw new Error('Incomplete support audit');
  for (const [clip, raw] of Object.entries(support)) {
    const audit = record(raw);
    for (const [key, limit] of Object.entries({
      maximumPawTargetError: 0.01,
      maximumPlantedDigitDisplacement: 0.001,
      maximumPlantedHeightDrift: 0.002,
      ...(motions[clip].playback === 'loop' ? { loopMatrixError: 0.0001 } : {}),
    })) {
      const value = audit[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > limit)
        throw new Error(`Otter support failure: ${clip}/${key}`);
    }
    if (
      typeof audit.minimumSurfaceHeight !== 'number' ||
      !Number.isFinite(audit.minimumSurfaceHeight) ||
      audit.minimumSurfaceHeight < -0.008
    )
      throw new Error('Otter penetrates ground');
    if (audit.supportPlaneHeight !== 0.018) throw new Error('Missing otter support plane');
    if (audit.space !== 'evaluated scene/world geometry plus scene trajectory')
      throw new Error('Missing otter world-space support audit');
    if (
      audit.frames !== Math.round(motions[clip].seconds * 60) + 1 ||
      !motions[clip].contacts.length
    )
      throw new Error('Incomplete frame/contact coverage');
  }
  return { bytes: bytes.length, triangles, joints: gltf.skins[0].joints.length, clips: names };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [command = 'check', ...args] = process.argv.slice(2);
  if (command === 'check') console.log(JSON.stringify(verifyOtter(), null, 2));
  else {
    if (!['bootstrap', 'fit', 'export', 'review', 'verify', 'refine', 'repair'].includes(command))
      throw new Error('Use check, bootstrap, fit, export, review, verify, or repair');
    const blender =
      process.env.BLENDER_BIN ??
      [
        '/Applications/Blender.app/Contents/MacOS/Blender',
        join(root, '.runtime/Blender.app/Contents/MacOS/Blender'),
      ].find(existsSync) ??
      'blender';
    const result = spawnSync(
      blender,
      [
        '--background',
        '--factory-startup',
        '--python-exit-code',
        '1',
        '--python',
        join(root, 'subjects/otter/authoring/otter_delivery.py'),
        '--',
        command,
        '--root',
        join(root, 'subjects/otter'),
        ...args,
      ],
      { stdio: 'inherit' },
    );
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw new Error(`Otter ${command} failed (${result.signal ?? result.status})`);
  }
}
