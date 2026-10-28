import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { repositoryRoot } from '../io.ts';
import { inspectStudyGLB, verifyStudyAssets } from './study-assets.ts';

void test('every gallery study has a fingerprinted self-contained saved delivery', () => {
  assert.ok(verifyStudyAssets(repositoryRoot) > 0);
});

void test('saved delivery validation rejects truncated data, LFS pointers and broken chunk sizes', () => {
  const bytes = readFileSync(resolve(repositoryRoot, 'src/art3d/baked/spiral.glb'));
  assert.ok(inspectStudyGLB(bytes).tracks > 0);
  assert.throws(() => inspectStudyGLB(bytes.subarray(0, bytes.length - 1)), /Invalid baked GLB/);
  assert.throws(
    () => inspectStudyGLB(Buffer.from('version https://git-lfs.github.com/spec/v1\n')),
    /Invalid baked GLB/,
  );
  const broken = Buffer.from(bytes);
  broken.writeUInt32LE(0xffffffff, 12);
  assert.throws(() => inspectStudyGLB(broken), /Invalid baked GLB/);
});
