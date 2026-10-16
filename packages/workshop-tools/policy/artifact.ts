import { readFile, stat, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  decodeArtifact,
  isGzip,
  MAX_ARTIFACT_BYTES,
  type RolloutFormat,
} from '../../../src/shared/policy/artifact.ts';
import { repositoryRoot, sha256 } from '../runtime-bundle.ts';

export async function readRolloutArtifact(path: string) {
  if ((await stat(path)).size > MAX_ARTIFACT_BYTES)
    throw new Error('Rollout exceeds its byte limit.');
  const bytes = await readFile(path);
  return { text: await decodeArtifact(bytes), format: isGzip(bytes) ? 'gzip' : 'json' };
}
export function encodeRolloutArtifact(text: string, format: RolloutFormat) {
  const decoded = Buffer.from(text, 'utf8');
  if (decoded.byteLength > MAX_ARTIFACT_BYTES)
    throw new Error('Decoded rollout exceeds its byte limit.');
  const bytes = format === 'gzip' ? gzipSync(decoded) : decoded;
  if (bytes.byteLength > MAX_ARTIFACT_BYTES) throw new Error('Rollout exceeds its byte limit.');
  return {
    bytes,
    metadata: {
      format,
      sha256: sha256(bytes),
      bytes: bytes.byteLength,
      decodedSha256: sha256(decoded),
      decodedBytes: decoded.byteLength,
    },
  };
}
export async function writeRolloutArtifact(
  directory: string,
  baseName: string,
  text: string,
  format: RolloutFormat,
  reviewPath: string,
) {
  const artifact = encodeRolloutArtifact(text, format);
  const file = `${baseName}.json${format === 'gzip' ? '.gzip' : ''}`;
  await writeFile(resolve(directory, file), artifact.bytes, { flag: 'wx' });
  const location = relative(repositoryRoot, directory);
  return {
    file,
    ...artifact.metadata,
    review: location.startsWith('..')
      ? null
      : `${reviewPath}&rollout=${encodeURIComponent('/' + location + '/' + file)}`,
  };
}
