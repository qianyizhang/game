import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { STUDIES } from '../../../src/art3d/catalogue.ts';
import { loadRegistry } from '../../dcc-workbench/registry.ts';
import { resolvePublication } from '../../dcc-workbench/releases.ts';
import { dependencyGraph, trackedFiles } from '../ci/graph.ts';

export const bakeDirectory = 'src/art3d/baked';
export const sha256 = (bytes: Uint8Array | string) =>
  createHash('sha256').update(bytes).digest('hex');
export type StudyManifest = {
  schemaVersion: 1;
  inputs: Record<string, string>;
  assets: Record<string, { sha256: string; bytes: number; seconds: number; tracks: number }>;
};

export function nativeStudyIds(root: string): Set<string> {
  const dcc = resolve(root, 'packages/dcc-workbench');
  const ids = new Set<string>();
  for (const asset of Object.values(loadRegistry(dcc).assets)) {
    if (!existsSync(resolve(dcc, asset.delivery.publication, 'current.json'))) continue;
    const release = resolvePublication(dcc, asset);
    if (release.reviewScope === 'gallery' && release.reviewDecision === 'accepted')
      ids.add(release.legacyStudyId);
  }
  return ids;
}

/** Pin the actual browser exporter dependency closure, without importing constructors. */
export function studyInputs(root: string): Record<string, string> {
  root = realpathSync(root);
  const { dependants, uncertain } = dependencyGraph(root, trackedFiles(root));
  const inputs = new Set(['packages/workshop-tools/art/bake-client.ts']);
  const pending = [...inputs];
  while (pending.length) {
    const importer = pending.pop()!;
    if (uncertain.some((entry) => entry.startsWith(importer + ':')))
      throw new Error(`Unresolved bake dependency: ${importer}`);
    for (const [dependency, importers] of dependants)
      if (importers.has(importer) && !inputs.has(dependency)) {
        inputs.add(dependency);
        pending.push(dependency);
      }
  }
  inputs.add('package-lock.json');
  return Object.fromEntries(
    [...inputs].sort().map((path) => [path, sha256(readFileSync(resolve(root, path)))]),
  );
}

/** Fast integrity/structure check of shipped bytes, never a construction test. */
export function inspectStudyGLB(bytes: Buffer) {
  if (
    bytes.length < 28 ||
    bytes.toString('utf8', 0, 4) !== 'glTF' ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length ||
    bytes.readUInt32LE(16) !== 0x4e4f534a
  )
    throw new Error('Invalid baked GLB');
  const end = 20 + bytes.readUInt32LE(12);
  if (
    end + 8 > bytes.length ||
    bytes.readUInt32LE(end + 4) !== 0x004e4942 ||
    end + 8 + bytes.readUInt32LE(end) !== bytes.length
  )
    throw new Error('Invalid baked GLB chunks');
  const json = JSON.parse(bytes.toString('utf8', 20, end)) as {
    meshes?: unknown[];
    animations?: { channels?: unknown[] }[];
    buffers?: { byteLength: number; uri?: string }[];
    images?: { uri?: string; bufferView?: number }[];
  };
  if (
    !json.meshes?.length ||
    json.animations?.length !== 1 ||
    !json.animations[0].channels?.length ||
    json.buffers?.length !== 1 ||
    json.buffers[0].uri ||
    json.buffers[0].byteLength > bytes.readUInt32LE(end) ||
    json.images?.some((image) => image.uri || !Number.isInteger(image.bufferView))
  )
    throw new Error('Baked study must contain meshes, one motion clip and embedded resources');
  return { tracks: json.animations[0].channels.length };
}

export function verifyStudyAssets(root: string) {
  const manifest = JSON.parse(
    readFileSync(resolve(root, bakeDirectory, 'manifest.json'), 'utf8'),
  ) as StudyManifest;
  if (manifest.schemaVersion !== 1 || !manifest.assets || !manifest.inputs)
    throw new Error('Invalid study manifest');
  if (JSON.stringify(manifest.inputs) !== JSON.stringify(studyInputs(root)))
    throw new Error('Baked study sources changed. Run npm run assets:bake and review the output.');
  const native = nativeStudyIds(root);
  for (const { id } of STUDIES)
    if (!native.has(id) && !manifest.assets[id]) throw new Error(`Missing baked study: ${id}`);
  for (const [id, asset] of Object.entries(manifest.assets)) {
    if (!STUDIES.some((study) => study.id === id) || native.has(id))
      throw new Error(`Unexpected baked study: ${id}`);
    const bytes = readFileSync(resolve(root, bakeDirectory, `${id}.glb`));
    if (bytes.length !== asset.bytes || sha256(bytes) !== asset.sha256)
      throw new Error(`Baked study fingerprint mismatch: ${id}`);
    if (
      inspectStudyGLB(bytes).tracks !== asset.tracks ||
      !Number.isFinite(asset.seconds) ||
      asset.seconds <= 0
    )
      throw new Error(`Invalid baked motion metadata: ${id}`);
  }
  for (const file of readdirSync(resolve(root, bakeDirectory)))
    if (file.endsWith('.glb') && !manifest.assets[file.slice(0, -4)])
      throw new Error(`Unregistered baked study file: ${file}`);
  return Object.keys(manifest.assets).length;
}
