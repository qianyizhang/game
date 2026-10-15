/** Common checks for delivered skeletal clips; species own fitting and support contracts. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readGlb, accessorValues } from './glb.ts';
import type { Motion } from './motion-contract.ts';

export const hashFile = (path: string) =>
  createHash('sha256').update(readFileSync(path)).digest('hex');

/** Require exactly the declared exporter files, then verify their current bytes. */
export function verifyFileDigests(
  root: string,
  expectedFiles: string[],
  digests: Record<string, unknown>,
) {
  if (JSON.stringify(Object.keys(digests).sort()) !== JSON.stringify([...expectedFiles].sort()))
    throw new Error('Incomplete exporter identity');
  for (const [path, expected] of Object.entries(digests))
    if (hashFile(join(root, path)) !== expected) throw new Error(`Stale exporter: ${path}`);
}

export function inspectMotionGlb(
  bytes: Buffer,
  motions: Record<string, Motion>,
  limits: { maxBytes: number; maxTriangles: number; maxJoints: number },
) {
  const gltf = readGlb(bytes);
  const values = gltf.accessors.map((_, i) => accessorValues(bytes, gltf, i));
  const names = gltf.animations.map((a) => a.name).sort();
  if (JSON.stringify(names) !== JSON.stringify(Object.keys(motions).sort()))
    throw new Error('Incomplete motion clips');
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
        throw new Error('Incomplete skin');
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
    bytes.length > limits.maxBytes ||
    triangles > limits.maxTriangles ||
    gltf.skins.some((s) => s.joints.length > limits.maxJoints)
  )
    throw new Error('Motion delivery budget exceeded');
  if (gltf.buffers.some((b) => b.uri) || gltf.images?.some((i) => i.uri))
    throw new Error('External dependency');
  return { bytes: bytes.length, triangles, joints: gltf.skins[0].joints.length, clips: names };
}
