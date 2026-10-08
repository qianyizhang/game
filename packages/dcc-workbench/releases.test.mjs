import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { getAsset, readRegistry } from './registry.ts';
import {
  createCandidate,
  promoteCandidate,
  resolvePublication,
  sealCandidate,
  snapshotInputs,
  verifyPublicationInputs,
  writeCandidateReview,
} from './releases.ts';

/** These deliberately small synthetic files test artifact authority and interrupted
 * publication. The real GLB/native validator is injected by the delivery pipeline;
 * these checks make no claim about geometry, native execution or aesthetic quality.
 * @typedef {import('./registry.ts').AssetDefinition} Asset
 * @typedef {import('./releases.ts').CandidateReview} Review
 * @typedef {import('./releases.ts').InputSnapshot} Snapshot
 */
/** @param {Uint8Array|string} bytes */
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
/** @param {string} path @param {unknown} data */
const writeJson = (path, data) => writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
/** @param {import('node:test').TestContext} t */
function fixture(t) {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'dcc-releases-')));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const root = join(temporary, 'package');
  mkdirSync(root);
  /** @param {string} path @param {Uint8Array|string} bytes */
  function write(path, bytes) {
    const output = join(root, path);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, bytes);
  }
  /** @param {string} id @param {boolean} [animated] */
  function asset(id, animated = false) {
    const definition = {
      legacyStudyId: id,
      source: `subjects/${id}/source.blend`,
      brief: `subjects/${id}/brief.json`,
      native: { adapter: 'blender/export.py', dependencies: ['blender/export.py'] },
      delivery: {
        profile: animated ? 'skinned' : 'static',
        ...(animated ? { animation: { name: 'Idle', seconds: 2, fps: 24 } } : {}),
        directory: `assets/${id}`,
        publication: `assets/${id}/published`,
        model: `assets/${id}/legacy.glb`,
        audit: `assets/${id}/audit.json`,
        ...(animated ? { poses: `assets/${id}/poses.json` } : {}),
        manifest: `assets/${id}/manifest.json`,
        receipts: `assets/${id}/receipts`,
      },
    };
    const result = getAsset(
      readRegistry(JSON.stringify({ schemaVersion: 1, assets: { [id]: definition } })),
      id,
    );
    write(result.source, Buffer.from([66, 76, 69, 78, 68, 69, 82, 0, 255]));
    write(result.brief, JSON.stringify({ id }));
    write('blender/export.py', '# Native fixture adapter\n');
    return result;
  }
  const selected = asset('fixture-creature', true);
  write('shared.ts', '// Shared delivery authority\n');
  const sharedInputs = ['shared.ts'];
  /** @param {Asset} [selectedAsset] */
  const snapshot = (selectedAsset = selected) => snapshotInputs(root, selectedAsset, sharedInputs);
  /** @param {Asset} [selectedAsset] */
  function exportFiles(selectedAsset = selected) {
    const candidate = createCandidate(root, selectedAsset, join(temporary, 'runtime'));
    assert.equal(
      existsSync(candidate),
      false,
      'the native exporter requires a fresh nonexistent output directory',
    );
    mkdirSync(candidate);
    mkdirSync(join(candidate, 'evidence'));
    writeFileSync(
      join(candidate, 'evidence/front-clay.png'),
      'Synthetic evidence bytes, not an aesthetic review',
    );
    writeFileSync(join(candidate, 'native.pending.glb'), `synthetic model for ${selectedAsset.id}`);
    writeJson(join(candidate, 'authoring.json'), { id: selectedAsset.id, evaluated: true });
    if (selectedAsset.delivery.poses)
      writeJson(join(candidate, 'pose-samples.json'), { samples: [] });
    return candidate;
  }
  /** @param {Asset} [selectedAsset] @param {Snapshot} [before] */
  function sealed(selectedAsset = selected, before = snapshot(selectedAsset)) {
    const candidate = exportFiles(selectedAsset);
    const context = { root, asset: selectedAsset, sharedInputs, candidate };
    const result = sealCandidate({
      ...context,
      snapshot: before,
      outputs: {
        model: 'native.pending.glb',
        audit: 'authoring.json',
        ...(selectedAsset.delivery.poses ? { poses: 'pose-samples.json' } : {}),
      },
      stats: { triangles: 12, bytes: 40 },
    });
    return { ...context, ...result };
  }
  /** @param {ReturnType<typeof sealed>} candidate @param {Partial<Review>} [changes] */
  function reviewed(candidate, changes = {}) {
    /** @type {Review} */
    const review = {
      schemaVersion: 1,
      id: candidate.asset.id,
      candidateDigest: candidate.digest,
      reviewer: { role: 'parent', name: 'Fixture reviewer' },
      decision: 'accepted',
      scope: 'workbench',
      evidence: [
        {
          view: 'front clay',
          reference: 'evidence/front-clay.png',
          observation: 'Synthetic delivery test only; no aesthetic claim.',
        },
      ],
      ...changes,
    };
    writeCandidateReview(candidate.candidate, review);
    return candidate;
  }
  function legacy() {
    write(selected.delivery.model, 'legacy exported geometry');
    write(selected.delivery.audit, '{}');
    if (selected.delivery.poses) write(selected.delivery.poses, '{}');
    const paths = [
      selected.source,
      selected.brief,
      selected.delivery.model,
      selected.delivery.audit,
      ...(selected.delivery.poses ? [selected.delivery.poses] : []),
    ];
    writeJson(join(root, selected.delivery.manifest), {
      schemaVersion: 1,
      id: selected.id,
      source: selected.source,
      asset: selected.delivery.model,
      stats: { triangles: 5 },
      sha256: Object.fromEntries(paths.map((path) => [path, hash(readFileSync(join(root, path)))])),
    });
    return readFileSync(join(root, selected.delivery.manifest));
  }
  const pointer = () => readFileSync(join(root, selected.delivery.publication, 'current.json'));
  return {
    root,
    selected,
    asset,
    write,
    sharedInputs,
    snapshot,
    exportFiles,
    sealed,
    reviewed,
    legacy,
    pointer,
  };
}

await test('promotion preserves source and brief coherently, exposes reviewed scope, and retains previous deliveries', (t) => {
  const f = fixture(t),
    oldReceipt = f.legacy();
  const source = readFileSync(join(f.root, f.selected.source));
  const brief = readFileSync(join(f.root, f.selected.brief));
  const originalLegacyModel = readFileSync(join(f.root, f.selected.delivery.model));
  const first = promoteCandidate(f.reviewed(f.sealed()));
  assert.equal(first.kind, 'release');
  assert.equal(first.reviewScope, 'workbench');
  assert.equal(first.reviewDecision, 'accepted');
  assert.equal(
    readFileSync(join(dirname(first.receipt), 'evidence/front-clay.png'), 'utf8'),
    'Synthetic evidence bytes, not an aesthetic review',
  );
  assert.deepEqual(readFileSync(first.sourcePath), source);
  assert.deepEqual(readFileSync(join(dirname(first.receipt), 'previous-receipt.json')), oldReceipt);
  assert.deepEqual(readFileSync(join(f.root, f.selected.delivery.model)), originalLegacyModel);
  assert.deepEqual(readFileSync(join(f.root, f.selected.delivery.manifest)), oldReceipt);
  verifyPublicationInputs(f.root, f.selected, f.sharedInputs);
  f.write(f.selected.source, 'artist hand edits made after publication');
  f.write(
    f.selected.brief,
    JSON.stringify({ id: f.selected.id, title: 'Unpublished description' }),
  );
  assert.throws(
    () => verifyPublicationInputs(f.root, f.selected, f.sharedInputs),
    /Changed delivery file/,
  );
  const stillPublished = resolvePublication(f.root, f.selected);
  assert.deepEqual(readFileSync(stillPublished.sourcePath), source);
  assert.deepEqual(readFileSync(stillPublished.briefPath), brief);
  const second = promoteCandidate(f.reviewed(f.sealed(), { scope: 'gallery' }));
  assert.notEqual(second.receiptDigest, first.receiptDigest);
  assert.equal(second.reviewScope, 'gallery');
  assert.equal(readFileSync(second.sourcePath, 'utf8'), 'artist hand edits made after publication');
  assert.deepEqual(readFileSync(first.sourcePath), source);
  assert.deepEqual(readFileSync(first.briefPath), brief);
  assert.deepEqual(readFileSync(second.briefPath), readFileSync(join(f.root, f.selected.brief)));
  assert.deepEqual(
    readFileSync(join(dirname(second.receipt), 'previous-receipt.json')),
    readFileSync(first.receipt),
  );
  assert.equal(hash(readFileSync(second.modelPath)), second.modelSha256);
});

await test('sealing rejects omitted pins, unexpected pins, changed export inputs and changed definitions', (t) => {
  const f = fixture(t);
  for (const mode of ['omitted', 'extra', 'changed', 'definition']) {
    const before = f.snapshot();
    if (mode === 'omitted') delete before.sha256['shared.ts'];
    if (mode === 'extra') before.sha256['unexpected.ts'] = '0'.repeat(64);
    if (mode === 'changed') f.write('shared.ts', '// Changed while Blender was running\n');
    if (mode === 'definition') before.definitionDigest = '0'.repeat(64);
    assert.throws(
      () => f.sealed(f.selected, before),
      /Input pins|Changed delivery file|definition identity/,
    );
  }
  assert.equal(existsSync(join(f.root, f.selected.delivery.publication, 'current.json')), false);
});

await test('promotion rejects changed model or native metadata, rejected review, and post-review source edits', async (t) => {
  for (const mode of ['model', 'audit', 'poses', 'rejected', 'source']) {
    await t.test(mode, (child) => {
      const f = fixture(child);
      promoteCandidate(f.reviewed(f.sealed()));
      const before = f.pointer();
      const candidate = f.reviewed(f.sealed(), mode === 'rejected' ? { decision: 'rejected' } : {});
      if (mode === 'source') f.write(f.selected.source, 'new artist edit');
      else if (mode !== 'rejected')
        writeFileSync(
          join(
            candidate.candidate,
            mode === 'model'
              ? 'native.pending.glb'
              : mode === 'audit'
                ? 'authoring.json'
                : 'pose-samples.json',
          ),
          'changed bytes',
        );
      assert.throws(() => promoteCandidate(candidate), /Changed delivery file|review is rejected/);
      assert.deepEqual(f.pointer(), before);
      assert.equal(resolvePublication(f.root, f.selected).kind, 'release');
    });
  }
});

await test('a rehashed incomplete candidate still cannot bypass mandatory input membership', (t) => {
  const f = fixture(t),
    candidate = f.sealed();
  delete candidate.manifest.inputs['shared.ts'];
  writeJson(candidate.path, candidate.manifest);
  candidate.digest = hash(readFileSync(candidate.path));
  f.reviewed(candidate);
  assert.throws(() => promoteCandidate(candidate), /exactly match required inputs/);
  assert.equal(existsSync(join(f.root, f.selected.delivery.publication, 'current.json')), false);
});

await test('reviews bind candidate identity, exact digest, parent role and concrete observations', (t) => {
  const f = fixture(t);
  for (const change of [
    { id: 'another-asset' },
    { candidateDigest: '0'.repeat(64) },
    { evidence: [] },
    { evidence: [{ view: 'front', reference: '', observation: 'Looks fine' }] },
    { reviewer: { role: 'artist', name: 'Author' } },
  ]) {
    assert.throws(
      () => f.reviewed(f.sealed(), /** @type {Partial<Review>} */ (change)),
      /identity|digest|evidence|nonempty|parent reviewer/,
    );
  }
  const candidate = f.reviewed(f.sealed());
  candidate.manifest.stats.triangles = 99;
  writeJson(candidate.path, candidate.manifest);
  assert.throws(() => promoteCandidate(candidate), /Review candidate identity\/digest mismatch/);
});

await test('an export based on an older current pointer cannot replace a newer accepted release', (t) => {
  const f = fixture(t);
  const older = f.reviewed(f.sealed()),
    newer = f.reviewed(f.sealed());
  promoteCandidate(newer);
  const pointer = f.pointer();
  assert.throws(() => promoteCandidate(older), /Previous publication changed/);
  assert.deepEqual(f.pointer(), pointer);
});

await test('interruption after copying a complete release leaves current and artist source intact and permits retry', (t) => {
  const f = fixture(t);
  promoteCandidate(f.reviewed(f.sealed()));
  const before = f.pointer(),
    source = readFileSync(join(f.root, f.selected.source));
  const candidate = f.reviewed(f.sealed());
  assert.throws(
    () =>
      promoteCandidate({
        ...candidate,
        validate(paths) {
          assert.deepEqual(readFileSync(paths.sourcePath), source);
          assert.match(paths.sourcePath, /\.pending-/);
          assert.equal(existsSync(join(dirname(paths.sourcePath), 'receipt.json')), true);
          throw new Error('Controlled consumer validation interruption');
        },
      }),
    /Controlled consumer validation interruption/,
  );
  assert.deepEqual(f.pointer(), before);
  assert.deepEqual(readFileSync(join(f.root, f.selected.source)), source);
  const leftovers = readdirSync(join(f.root, f.selected.delivery.publication, 'releases'));
  assert.ok(leftovers.some((name) => name.startsWith('.pending-')));
  assert.equal(promoteCandidate(candidate).kind, 'release');
});

await test('input changes during staged validation cannot publish stale source bytes', (t) => {
  const f = fixture(t);
  promoteCandidate(f.reviewed(f.sealed()));
  const before = f.pointer();
  const candidate = f.reviewed(f.sealed());
  assert.throws(
    () =>
      promoteCandidate({
        ...candidate,
        validate() {
          f.write(f.selected.source, 'artist changed source during validation');
        },
      }),
    /Changed delivery file/,
  );
  assert.deepEqual(f.pointer(), before);
  assert.equal(
    readFileSync(join(f.root, f.selected.source), 'utf8'),
    'artist changed source during validation',
  );
});

await test('candidate files cannot escape through relative paths or symlink aliases', (t) => {
  const f = fixture(t),
    before = f.snapshot(),
    candidate = f.exportFiles();
  const context = {
    root: f.root,
    asset: f.selected,
    sharedInputs: f.sharedInputs,
    candidate,
    snapshot: before,
    stats: {},
  };
  const external = join(dirname(candidate), 'outside.glb');
  writeFileSync(external, 'outside');
  symlinkSync(external, join(candidate, 'link.glb'));
  for (const model of ['../outside.glb', 'link.glb']) {
    assert.throws(
      () =>
        sealCandidate({
          ...context,
          outputs: { model, audit: 'authoring.json', poses: 'pose-samples.json' },
        }),
      /registry path|symlink/,
    );
  }
});

await test('two assets publish independently, and cross-asset candidates and pointers are rejected', (t) => {
  const f = fixture(t),
    other = f.asset('fixture-lantern');
  promoteCandidate(f.reviewed(f.sealed()));
  const before = f.pointer();
  const otherCandidate = f.reviewed(f.sealed(other));
  const otherRelease = promoteCandidate(otherCandidate);
  assert.deepEqual(f.pointer(), before);
  assert.equal(otherRelease.id, other.id);
  assert.throws(
    () => promoteCandidate({ ...otherCandidate, asset: f.selected }),
    /directory identity/,
  );
  writeJson(join(f.root, other.delivery.publication, 'current.json'), {
    schemaVersion: 1,
    id: f.selected.id,
    receiptDigest: otherRelease.receiptDigest,
  });
  assert.throws(() => resolvePublication(f.root, other), /pointer identity mismatch/);
  assert.deepEqual(f.pointer(), before);
});

await test('legacy fallback requires source and every delivery pin, and never upgrades provenance by assumption', (t) => {
  const f = fixture(t),
    original = f.legacy();
  const publication = resolvePublication(f.root, f.selected);
  assert.equal(publication.kind, 'legacy');
  assert.equal(publication.reviewScope, undefined);
  assert.equal(publication.sourcePath, join(f.root, f.selected.source));
  const data = {
    schemaVersion: 1,
    id: f.selected.id,
    source: f.selected.source,
    asset: f.selected.delivery.model,
    stats: {},
    sha256: Object.fromEntries(
      [
        f.selected.source,
        f.selected.brief,
        f.selected.delivery.model,
        f.selected.delivery.audit,
        ...(f.selected.delivery.poses ? [f.selected.delivery.poses] : []),
      ].map((path) => [path, hash(readFileSync(join(f.root, path)))]),
    ),
  };
  assert.deepEqual(readFileSync(join(f.root, f.selected.delivery.manifest)), original);
  delete data.sha256[f.selected.delivery.audit];
  writeJson(join(f.root, f.selected.delivery.manifest), data);
  assert.throws(() => resolvePublication(f.root, f.selected), /Missing required legacy pin/);
  data.id = 'different';
  writeJson(join(f.root, f.selected.delivery.manifest), data);
  assert.throws(
    () => resolvePublication(f.root, f.selected),
    /Legacy publication identity mismatch/,
  );
});

await test('reader verification catches changed published output and copied source bytes', async (t) => {
  for (const role of ['modelPath', 'sourcePath', 'briefPath', 'auditPath']) {
    await t.test(role, (child) => {
      const f = fixture(child),
        release = promoteCandidate(f.reviewed(f.sealed()));
      writeFileSync(
        release[/** @type {'modelPath'|'sourcePath'|'briefPath'|'auditPath'} */ (role)],
        'modified immutable output',
      );
      assert.throws(() => resolvePublication(f.root, f.selected), /Changed delivery file/);
    });
  }
});

await test('an existing publisher lock prevents concurrent replacement and is retained for inspection', (t) => {
  const f = fixture(t);
  promoteCandidate(f.reviewed(f.sealed()));
  const candidate = f.reviewed(f.sealed()),
    before = f.pointer();
  const lock = join(f.root, f.selected.delivery.publication, '.promotion-lock');
  mkdirSync(lock);
  assert.throws(() => promoteCandidate(candidate), /EEXIST/);
  assert.deepEqual(f.pointer(), before);
  assert.equal(existsSync(lock), true);
});

await test('review evidence must exist inside its reserved candidate subtree', (t) => {
  const f = fixture(t);
  for (const reference of [
    'evidence/missing.png',
    '../outside.png',
    'source.blend',
    'evidence/../../outside.png',
  ]) {
    const candidate = f.sealed();
    assert.throws(
      () =>
        f.reviewed(candidate, {
          evidence: [{ view: 'front clay', reference, observation: 'Fixture review' }],
        }),
      /ENOENT|evidence\/ directory|registry path/,
    );
    assert.equal(existsSync(join(candidate.candidate, 'review.json')), false);
  }
  const candidate = f.sealed();
  const outside = join(dirname(candidate.candidate), 'outside.png');
  writeFileSync(outside, 'outside capture');
  symlinkSync(outside, join(candidate.candidate, 'evidence/alias.png'));
  assert.throws(
    () =>
      f.reviewed(candidate, {
        evidence: [
          { view: 'front', reference: 'evidence/alias.png', observation: 'Fixture review' },
        ],
      }),
    /symlink/,
  );
});

await test('changed or deleted reviewed evidence cannot promote or remain a verified release', async (t) => {
  for (const mode of [
    'changed-before-promotion',
    'deleted-before-promotion',
    'changed-during-validation',
    'changed-after-publication',
  ]) {
    await t.test(mode, (child) => {
      const f = fixture(child);
      promoteCandidate(f.reviewed(f.sealed()));
      const before = f.pointer(),
        candidate = f.reviewed(f.sealed());
      const capture = join(candidate.candidate, 'evidence/front-clay.png');
      if (mode === 'changed-after-publication') {
        const release = promoteCandidate(candidate);
        writeFileSync(
          join(dirname(release.receipt), 'evidence/front-clay.png'),
          'replacement evidence',
        );
        assert.throws(() => resolvePublication(f.root, f.selected), /Changed delivery file/);
        return;
      }
      if (mode === 'changed-before-promotion') writeFileSync(capture, 'replacement evidence');
      if (mode === 'deleted-before-promotion') rmSync(capture);
      assert.throws(
        () =>
          promoteCandidate({
            ...candidate,
            ...(mode === 'changed-during-validation'
              ? {
                  validate() {
                    writeFileSync(capture, 'changed during validation');
                  },
                }
              : {}),
          }),
        /Changed delivery file|ENOENT/,
      );
      assert.deepEqual(f.pointer(), before);
      assert.equal(resolvePublication(f.root, f.selected).kind, 'release');
    });
  }
});

await test('registry relocation preserves prior release authority while freshness and next promotion use the new definition', (t) => {
  const f = fixture(t);
  const original = promoteCandidate(f.reviewed(f.sealed()));
  const source = readFileSync(original.sourcePath),
    brief = readFileSync(original.briefPath);
  const beforeRelocation = f.reviewed(f.sealed());
  const relocated = {
    ...structuredClone(f.selected),
    source: 'subjects/relocated/source.blend',
    brief: 'subjects/relocated/brief.json',
  };
  f.write(relocated.source, 'relocated artist edits');
  f.write(relocated.brief, JSON.stringify({ id: relocated.id, title: 'New unpublished brief' }));
  rmSync(join(f.root, f.selected.source));
  rmSync(join(f.root, f.selected.brief));
  const retained = resolvePublication(f.root, relocated);
  assert.equal(retained.receiptDigest, original.receiptDigest);
  assert.deepEqual(readFileSync(retained.sourcePath), source);
  assert.deepEqual(readFileSync(retained.briefPath), brief);
  assert.throws(
    () => verifyPublicationInputs(f.root, relocated, f.sharedInputs),
    /Selected asset definition changed/,
  );
  assert.throws(
    () => promoteCandidate({ ...beforeRelocation, asset: relocated }),
    /Selected asset definition changed/,
  );
  const current = promoteCandidate(f.reviewed(f.sealed(relocated)));
  assert.equal(readFileSync(current.sourcePath, 'utf8'), 'relocated artist edits');
  assert.deepEqual(readFileSync(current.briefPath), readFileSync(join(f.root, relocated.brief)));
  verifyPublicationInputs(f.root, relocated, f.sharedInputs);
  assert.deepEqual(readFileSync(original.sourcePath), source);
  assert.deepEqual(readFileSync(original.briefPath), brief);
});

await test('reader uses the frozen motion contract and rejects tampered embedded definitions', (t) => {
  const f = fixture(t),
    publication = promoteCandidate(f.reviewed(f.sealed()));
  const changed = structuredClone(f.selected);
  changed.delivery.profile = 'static';
  delete changed.delivery.animation;
  delete changed.delivery.poses;
  assert.ok(
    resolvePublication(f.root, changed).posesPath,
    'published skinned delivery retains its own pose contract',
  );
  assert.throws(
    () => verifyPublicationInputs(f.root, changed, f.sharedInputs),
    /Selected asset definition changed/,
  );
  const candidate = f.sealed();
  candidate.manifest.definition.source = 'subjects/unrelated/source.blend';
  writeJson(candidate.path, candidate.manifest);
  candidate.digest = hash(readFileSync(candidate.path));
  f.reviewed(candidate);
  assert.throws(() => promoteCandidate(candidate), /Embedded definition digest mismatch/);
  assert.equal(resolvePublication(f.root, f.selected).receiptDigest, publication.receiptDigest);
});

await test('changing a working gallery mapping cannot redirect a previously accepted release', (t) => {
  const f = fixture(t);
  const approved = promoteCandidate(f.reviewed(f.sealed(), { scope: 'gallery' }));
  const changed = { ...f.selected, legacyStudyId: 'another-gallery-study' };
  const retained = resolvePublication(f.root, changed);
  assert.equal(retained.receiptDigest, approved.receiptDigest);
  assert.equal(retained.reviewScope, 'gallery');
  assert.equal(retained.legacyStudyId, f.selected.legacyStudyId);
  assert.throws(
    () => verifyPublicationInputs(f.root, changed, f.sharedInputs),
    /Selected asset definition changed/,
  );
  const reviewedRemap = promoteCandidate(f.reviewed(f.sealed(changed), { scope: 'gallery' }));
  assert.equal(reviewedRemap.legacyStudyId, changed.legacyStudyId);
  assert.notEqual(reviewedRemap.receiptDigest, approved.receiptDigest);
});
