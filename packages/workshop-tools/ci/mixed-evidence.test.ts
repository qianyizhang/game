import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { catalogueFrom, dependencyGraph, trackedFiles } from './graph.ts';
import { safeDocumentation } from './docs-fast.ts';
import {
  browserFamilies,
  isReviewEvidence,
  normalApplicationFallback,
  selectPlan,
  type Change,
} from './selection.ts';

// Exact changed paths/statuses from the published PR heads, not synthetic docs-only PRs.
const fixtures = JSON.parse(
  readFileSync(new URL('./review-inputs.json', import.meta.url), 'utf8'),
) as { pr: number; head: string; changes: Change[] }[];
const root = resolve(import.meta.dirname, '../../..');
const files = trackedFiles(root);
const graph = dependencyGraph(root, files);
const catalogue = catalogueFrom(files);
const head = 'a'.repeat(40);
const art = { path: 'src/games/spire/ui/WorldItemArt.tsx', status: 'M' };
const review = { path: 'docs/art/assets/spire-damage-potions/provenance.json', status: 'A' };

void test('exact mixed #78/#79/#81 inputs retain safety, affected game, SVG and gallery coverage without unrelated deep work', () => {
  assert.deepEqual(graph.uncertain, []);
  for (const fixture of fixtures) {
    // Newly added specs enter the catalogue even before their art branches merge.
    const current = catalogueFrom([...new Set([...files, ...fixture.changes.map((c) => c.path)])]);
    const plan = selectPlan(fixture.changes, current, graph.dependants, {
      head: fixture.head,
      allApplications: normalApplicationFallback(fixture.changes, true, () => true),
      uncertain: graph.uncertain,
    });
    assert.equal(plan.mode, 'scoped', `PR #${fixture.pr}: ${plan.reasons.join(', ')}`);
    assert.deepEqual(plan.coreFiles, selectPlan([], catalogue, new Map(), { head }).coreFiles);
    assert.ok(plan.coreFiles.includes('src/shared/replay.test.ts'));
    for (const spec of [
      'asset-gallery',
      'art-export',
      fixture.pr === 81 ? 'battlegrounds' : 'spire',
    ])
      assert.ok(
        plan.browserFiles.includes(`tests/browser/${spec}.spec.ts`),
        `${fixture.pr}: ${spec}`,
      );
    for (const change of fixture.changes.filter((c) => c.path.endsWith('.spec.ts')))
      assert.ok(plan.browserFiles.includes(change.path), `${fixture.pr}: ${change.path}`);
    assert.ok(!plan.unitFiles.includes('packages/diablo2/src/agent/policy-rollout.test.ts'));
    assert.ok(!plan.browserFiles.includes('tests/browser/night-passage-rollout.spec.ts'));
    if (fixture.pr !== 79)
      // MinionArt/WorldItemArt are also imported by the 3D Studio. Keep its real coverage.
      assert.ok(plan.browserFiles.includes('tests/browser/study-delivery.spec.ts'));
    assert.deepEqual(plan.geometryFiles, []);
    // Review attachments must not add coverage beyond their code/test diff.
    const codeOnly = fixture.changes.filter(({ path }) => !isReviewEvidence(path));
    const code = selectPlan(codeOnly, current, graph.dependants, { head: fixture.head });
    assert.deepEqual(plan.browserFiles, code.browserFiles);
    assert.deepEqual(plan.unitFiles, code.unitFiles);
  }
});

void test('mixed review classification cannot become a second docs-only fast path or ignore unsafe file modes', () => {
  assert.equal(
    normalApplicationFallback([art, review], true, () => true),
    false,
  );
  assert.equal(
    normalApplicationFallback([review], true, () => true),
    true,
  );
  assert.equal(
    normalApplicationFallback([], true, () => true),
    true,
  );
  assert.equal(
    normalApplicationFallback([art, review], false, () => true),
    true,
  );
  // Callback is the Git regular-blob check: symlinks, executable reports and missing blobs fail.
  assert.equal(
    normalApplicationFallback([art, review], true, () => false),
    true,
  );
  for (const fixture of fixtures)
    assert.equal(
      safeDocumentation(fixture.changes, () => '# Report'),
      false,
    );
});

void test('gallery inputs, unknown executable files and new manifests retain conservative application coverage', () => {
  for (const path of [
    'docs/art/assets/cartographer-map/before-board.webp',
    'docs/art/assets/spire-intent/before-battlefield.webp',
    'docs/art/assets/spire-damage-potions/manifest.json',
    'docs/art/assets/spire-damage-potions/scene.svg',
    'docs/art/assets/spire-damage-potions/check.ts',
    'docs/art/assets/spire-damage-potions/logs/check.sh',
    'docs/art/assets/spire-damage-potions/frame.html',
    'docs/art/assets/spire-damage-potions/asset.glb',
    'docs/art/assets/new-review/source-receipt.json',
    'new/unknown.md',
  ]) {
    const changes = [art, { path, status: 'A' }];
    assert.equal(isReviewEvidence(path), false, path);
    const plan = selectPlan(changes, catalogue, graph.dependants, {
      head,
      allApplications: normalApplicationFallback(changes, true, () => true),
    });
    assert.equal(plan.mode, 'application', path);
    assert.ok(plan.browserFiles.includes('tests/browser/asset-gallery.spec.ts'), path);
    assert.deepEqual(
      [...plan.coreFiles, ...plan.unitFiles].sort(),
      [...catalogue.application].sort(),
    );
  }
  // A future literal consumer also overrides the reviewed non-runtime classification.
  const consumed = selectPlan(
    [art, review],
    catalogue,
    new Map([[review.path, new Set(['packages/workshop-tools/art/gallery.ts'])]]),
    { head },
  );
  assert.equal(consumed.mode, 'application');
  assert.ok(consumed.browserFiles.includes('tests/browser/asset-gallery.spec.ts'));
});

void test('legacy issue37 capture has exact Blindside ownership; new issue-named specs still fail closed', () => {
  assert.deepEqual(browserFamilies('tests/browser/issue37-context.spec.ts'), ['balatro']);
  assert.equal(browserFamilies('tests/browser/issue99-context.spec.ts'), undefined);
});

void test('a changed cross-game spec runs its assertions without recursively selecting every suite it covers', () => {
  const path = 'tests/browser/feature-art.spec.ts';
  const plan = selectPlan([{ path, status: 'M' }], catalogue, graph.dependants, { head });
  assert.equal(plan.mode, 'scoped');
  assert.deepEqual(plan.browserFiles, [path]);
  assert.ok(plan.coreFiles.includes('src/shared/replay.test.ts'));
});
