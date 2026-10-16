import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';
import {
  assertFetchedArtifact,
  decodeArtifact,
  readArtifactStream,
  rolloutFormat,
} from '../../../src/shared/policy/artifact.ts';
import { encodeRolloutArtifact, readRolloutArtifact, writeRolloutArtifact } from './artifact.ts';
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

void test('lossless containers preserve original JSON bytes, Unicode and exact encoded hashes', async () => {
  const text = '{ "known": "观察 · 🧭", "commands": [] }\n';
  for (const format of ['json', 'gzip'] as const) {
    const artifact = encodeRolloutArtifact(text, format);
    assert.equal(await decodeArtifact(artifact.bytes), text);
    assert.equal(artifact.metadata.sha256, sha(artifact.bytes));
    assert.equal(artifact.metadata.decodedSha256, sha(Buffer.from(text)));
    assert.equal(artifact.metadata.decodedBytes, Buffer.byteLength(text));
    assert.equal(artifact.metadata.bytes, artifact.bytes.byteLength);
  }
  assert.deepEqual(encodeRolloutArtifact(text, 'json').bytes, Buffer.from(text));
  assert.equal(rolloutFormat(), 'json');
  assert.throws(() => rolloutFormat('zip'), /json\|gzip/);
});
void test('malformed containers, invalid UTF-8 and oversized encoded/decoded inputs fail closed', async () => {
  const zipped = gzipSync('valid');
  await assert.rejects(decodeArtifact(zipped.subarray(0, -4)));
  const corrupt = Buffer.from(zipped);
  corrupt[corrupt.length - 8] ^= 1;
  await assert.rejects(decodeArtifact(corrupt));
  await assert.rejects(decodeArtifact(Uint8Array.of(0xff)));
  await assert.rejects(decodeArtifact(gzipSync(Uint8Array.of(0xff))));
  await assert.rejects(decodeArtifact(Buffer.alloc(100), 99), /byte limit/);
  await assert.rejects(decodeArtifact(gzipSync(Buffer.alloc(100_000)), 1000), /byte limit/);
  await assert.rejects(decodeArtifact(Buffer.concat([gzipSync('one'), gzipSync('two')])));
  await assert.rejects(decodeArtifact(Buffer.from('valid'), 0), /Invalid/);
});
void test('remote streams stop oversized input and retain exact bytes across chunk boundaries', async () => {
  let canceled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(Buffer.alloc(32));
    },
    cancel() {
      canceled = true;
    },
  });
  await assert.rejects(readArtifactStream(stream, 16), /byte limit/);
  assert.equal(canceled, true);
  const bytes = await readArtifactStream(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(Uint8Array.of(1, 2));
        controller.enqueue(Uint8Array.of(3));
        controller.close();
      },
    }),
  );
  assert.deepEqual(bytes, Uint8Array.of(1, 2, 3));
});
void test('stored artifact receipts pin exact bytes; decode follows magic rather than extension', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'policy-container-'));
  try {
    const text = '{"schema":"policy-rollout-1","preserved":"  original  "}\n';
    const receipt = await writeRolloutArtifact(
      directory,
      'case.rollout',
      text,
      'gzip',
      '/?game=x&review=1',
    );
    assert.equal(receipt.file, 'case.rollout.json.gzip');
    const bytes = await readFile(resolve(directory, receipt.file));
    assert.equal(receipt.sha256, sha(bytes));
    assert.equal(receipt.review, null); // Outside repository: no false local review link.
    assert.deepEqual(await readRolloutArtifact(resolve(directory, receipt.file)), {
      text,
      format: 'gzip',
    });
    await writeFile(resolve(directory, 'misnamed.json'), bytes);
    assert.equal((await readRolloutArtifact(resolve(directory, 'misnamed.json'))).text, text);
    await assert.rejects(
      writeRolloutArtifact(directory, 'case.rollout', text, 'gzip', '/?review=1'),
      /EEXIST/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

void test('HTTP content encoding cannot silently replace original gzip bytes', () => {
  const plain = Buffer.from('{"known":"original JSON"}');
  const zipped = gzipSync(plain);
  for (const path of ['/rollout.json.gz', '/rollout.json.gzip']) {
    assert.throws(
      () => assertFetchedArtifact(plain, path, 'gzip'),
      /server decoded this gzip file/,
    );
    assert.throws(
      () => assertFetchedArtifact(plain, path, 'br, GZIP'),
      /original compressed bytes/,
    );
    assert.throws(() => assertFetchedArtifact(plain, path, null), /may have decoded.*misnamed/);
    assert.throws(() => assertFetchedArtifact(plain, path, 'br'), /may have decoded.*misnamed/);
    // An outer HTTP gzip layer may be removed while preserving the stored inner container.
    assert.doesNotThrow(() => assertFetchedArtifact(zipped, path, 'gzip'));
    assert.doesNotThrow(() => assertFetchedArtifact(zipped, path, null));
  }
  // Ordinary transport-compressed JSON remains a plain JSON artifact after Fetch decoding.
  assert.doesNotThrow(() => assertFetchedArtifact(plain, '/rollout.json', 'gzip'));
});
