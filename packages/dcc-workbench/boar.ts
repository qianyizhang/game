/** Boar-specific source and support contract; the browser consumes ordinary baked clips. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBlender, runBlender } from './blender.ts';
import { hashFile, inspectMotionGlb, verifyFileDigests } from './motion-delivery.ts';
import { record } from './contracts.ts';
import { readMotions } from './motion-contract.ts';

const root = dirname(fileURLToPath(import.meta.url));
export function verifyBoar(directory = join(root, 'assets/boar')) {
  const receipt = record(JSON.parse(readFileSync(join(directory, 'boar.json'), 'utf8')));
  const bytes = readFileSync(join(directory, 'boar.glb'));
  const motions = readMotions(receipt.clips);
  if (
    receipt.schemaVersion !== 1 ||
    receipt.character !== 'boar' ||
    receipt.sourceSha256 !== hashFile(join(root, 'subjects/boar/boar/source.blend')) ||
    receipt.motionSha256 !== hashFile(join(root, 'subjects/boar/motion.blend')) ||
    receipt.modelSha256 !== hashFile(join(directory, 'boar.glb'))
  )
    throw new Error('Stale boar source or delivery');
  const scripts = [
    'subjects/boar/authoring/boar_delivery.py',
    'subjects/boar/authoring/boar_rig.py',
    'subjects/boar/authoring/boar_motion.py',
    'blender/native_types.py',
  ];
  verifyFileDigests(root, scripts, record(receipt.exportScripts));
  if (Object.values(record(receipt.clips)).some((c) => 'samples' in record(c)))
    throw new Error('Temporary poses belong outside delivery');
  if (
    JSON.stringify(motions) !==
    JSON.stringify(
      readMotions(JSON.parse(readFileSync(join(directory, 'boar.motions.json'), 'utf8'))),
    )
  )
    throw new Error('Motion contract differs');
  const profile = record(receipt.profile);
  if (profile.meshSha256 !== receipt.meshSha256 || profile.sourceSha256 !== receipt.motionSha256)
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
      maximumHoofTargetError: 0.01,
      maximumPlantedDigitDisplacement: 0.001,
      maximumSoleHeightError: 0.002,
      ...(motions[clip].playback === 'loop' ? { loopMatrixError: 0.0001 } : {}),
    })) {
      const value = audit[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > limit)
        throw new Error(`Boar support failure: ${clip}/${key}`);
    }
    if (
      typeof audit.minimumSurfaceHeight !== 'number' ||
      !Number.isFinite(audit.minimumSurfaceHeight) ||
      audit.minimumSurfaceHeight < -0.008
    )
      throw new Error('Boar penetrates ground');
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
  if (command === 'check') console.log(JSON.stringify(verifyBoar(), null, 2));
  else {
    if (!['bootstrap', 'fit', 'export', 'review', 'verify'].includes(command))
      throw new Error('Use check, bootstrap, fit, export, review, or verify');
    const blender = findBlender(root);
    runBlender(blender, join(root, 'subjects/boar/authoring/boar_delivery.py'), [
      command,
      '--root',
      join(root, 'subjects/boar'),
      ...args,
    ]);
  }
}
