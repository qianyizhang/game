import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { loadRegistry, getAsset } from './registry.ts';
import {
  createCandidate,
  snapshotInputs,
  sealCandidate,
  writeCandidateReview,
  promoteCandidate,
} from './releases.ts';
import { publishedAssetsModule, dccAssetsPlugin } from './vite-assets.ts';
import { createServer } from 'vite';

/** Synthetic delivery bytes exercise publication selection/watch behavior, not geometry. */
await test('draft registrations stay out of browser imports, first publications and review captures are watched, invalid receipts fail closed', async (t) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'dcc-vite-publication-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const definition = {
    legacyStudyId: 'fixture',
    source: 'subjects/fixture/source.blend',
    brief: 'subjects/fixture/brief.json',
    native: { adapter: 'blender/export.py', dependencies: ['blender/export.py'] },
    delivery: {
      profile: 'static',
      directory: 'assets/fixture',
      publication: 'assets/fixture/published',
      model: 'assets/fixture/model.glb',
      audit: 'assets/fixture/audit.json',
      manifest: 'assets/fixture/manifest.json',
      receipts: 'assets/fixture/receipts',
    },
  };
  writeFileSync(
    join(root, 'registry.json'),
    JSON.stringify({ schemaVersion: 1, assets: { fixture: definition } }),
  );
  const asset = getAsset(loadRegistry(root), 'fixture');
  const draft = publishedAssetsModule(root);
  assert.ok(draft.code.includes('export const assets = {};'));
  assert.ok(!draft.code.includes('import model'));
  assert.ok(draft.watchFiles.includes(join(root, asset.delivery.publication, 'current.json')));
  assert.ok(draft.watchFiles.includes(join(root, asset.delivery.manifest)));
  const server = await createServer({
    configFile: false,
    root,
    plugins: [dccAssetsPlugin(root)],
    server: { middlewareMode: true, ws: false },
  });
  try {
    const transformed = await server.transformRequest('virtual:card-workshop-dcc');
    assert.ok(transformed?.code.includes('export const assets = {};'));
  } finally {
    await server.close();
  }
  mkdirSync(join(root, asset.delivery.publication), { recursive: true });
  writeFileSync(join(root, asset.delivery.manifest), '{"schemaVersion":1,"id":"wrong"}');
  assert.throws(() => publishedAssetsModule(root), /identity mismatch/);
  rmSync(join(root, asset.delivery.manifest));
  const pointer = join(root, asset.delivery.publication, 'current.json');
  writeFileSync(pointer, '{"schemaVersion":1,"id":"wrong","receiptDigest":"invalid"}');
  assert.throws(() => publishedAssetsModule(root), /identity mismatch/);
  rmSync(pointer);
  mkdirSync(join(root, 'subjects/fixture'), { recursive: true });
  mkdirSync(join(root, 'blender'));
  writeFileSync(join(root, asset.source), 'synthetic saved source');
  writeFileSync(join(root, asset.native.adapter), '# synthetic adapter');
  writeFileSync(
    join(root, asset.brief),
    JSON.stringify({
      schemaVersion: 1,
      id: asset.id,
      title: 'Fixture',
      subtitle: 'Fixture',
      interpretation: 'Fixture',
      gesture: 'Fixture',
      polish: [],
      palette: [],
      nativeFeatures: [],
      reference: 'fixture',
      reviewStatus: 'fixture',
      budgets: { maxBytes: 100, maxTriangles: 100, maxJoints: 0 },
    }),
  );
  const snapshot = snapshotInputs(root, asset, []);
  const candidate = createCandidate(root, asset, join(root, 'runtime'));
  mkdirSync(join(candidate, 'evidence'), { recursive: true });
  writeFileSync(join(candidate, 'model.glb'), 'synthetic model');
  writeFileSync(join(candidate, 'audit.json'), '{"blender":"fixture"}');
  writeFileSync(join(candidate, 'evidence/front.png'), 'synthetic capture');
  const context = { root, asset, sharedInputs: [], candidate };
  const sealed = sealCandidate({
    ...context,
    snapshot,
    outputs: { model: 'model.glb', audit: 'audit.json' },
    stats: {
      bytes: 15,
      triangles: 1,
      meshes: 1,
      materials: 1,
      textures: 0,
      joints: 0,
      animations: [],
    },
  });
  writeCandidateReview(candidate, {
    schemaVersion: 1,
    id: asset.id,
    candidateDigest: sealed.digest,
    reviewer: { role: 'parent', name: 'Fixture' },
    decision: 'accepted',
    scope: 'workbench',
    evidence: [
      { view: 'front', reference: 'evidence/front.png', observation: 'Synthetic test only' },
    ],
  });
  const release = promoteCandidate(context);
  const published = publishedAssetsModule(root);
  const retainedCapture = join(dirname(release.receipt), 'evidence/front.png');
  assert.ok(published.code.includes('import model0'));
  assert.ok(published.watchFiles.includes(retainedCapture));
  assert.equal(readFileSync(retainedCapture, 'utf8'), 'synthetic capture');
  rmSync(retainedCapture);
  assert.throws(() => publishedAssetsModule(root), /ENOENT/);
});
