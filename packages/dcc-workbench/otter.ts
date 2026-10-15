/** River-otter source and paw support contract; the browser consumes ordinary baked clips. */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { hashFile, inspectMotionGlb, verifyFileDigests } from './motion-delivery.ts';
import { record } from './contracts.ts';
import { readMotions } from './motion-contract.ts';

const root = dirname(fileURLToPath(import.meta.url));
export function verifyOtter(directory = join(root, 'assets/otter')) {
  const receipt = record(JSON.parse(readFileSync(join(directory, 'otter.json'), 'utf8')));
  const bytes = readFileSync(join(directory, 'otter.glb'));
  const motions = readMotions(receipt.clips);
  if (
    receipt.schemaVersion !== 1 ||
    receipt.character !== 'otter' ||
    receipt.sourceSha256 !== hashFile(join(root, 'subjects/otter/otter/source.blend')) ||
    receipt.motionSha256 !== hashFile(join(root, 'subjects/otter/motion.blend')) ||
    receipt.modelSha256 !== hashFile(join(directory, 'otter.glb'))
  )
    throw new Error('Stale otter source or delivery');
  const scripts = [
    'subjects/otter/authoring/otter_delivery.py',
    'subjects/otter/authoring/otter_rig.py',
    'subjects/otter/authoring/otter_motion.py',
    'blender/native_types.py',
  ];
  verifyFileDigests(root, scripts, record(receipt.exportScripts));
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
  const stats = inspectMotionGlb(bytes, motions, {
    maxBytes: 5_000_000,
    maxTriangles: 110_000,
    maxJoints: 24,
  });
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
  return stats;
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
