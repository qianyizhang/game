import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { commandFor, verifyResults } from './commands.ts';
import { selectPlan, type Catalogue, type Change, type DependencyGraph } from './selection.ts';

const catalogue: Catalogue = {
  application: [
    'src/shared/replay.test.ts',
    'src/games/spire/agent/policy.test.ts',
    'src/games/spire/agent/policy-rollout.test.ts',
    'src/games/spire/game.test.ts',
    'packages/diablo2/src/agent/policy.test.ts',
    'packages/diablo2/src/agent/policy-rollout.test.ts',
    'packages/diablo2/src/game.test.ts',
  ],
  browser: [
    'tests/browser/spire.spec.ts',
    'tests/browser/diablo2.spec.ts',
    'tests/browser/night-passage-hero.spec.ts',
    'tests/browser/art3d.spec.ts',
  ],
  geometry: ['src/art3d/procedural/watcher.test.ts'],
};
const select = (path: string, graph: DependencyGraph = new Map(), status = 'M') =>
  selectPlan([{ path, status }], catalogue, graph, { head: 'a'.repeat(40) });

void test('UI change runs safety regressions and affected browser family without deep policy matrices', () => {
  const plan = select('src/games/spire/ui/SpireGame.tsx');
  assert.equal(plan.mode, 'scoped');
  assert.deepEqual(plan.browserFiles, ['tests/browser/spire.spec.ts']);
  assert.deepEqual(plan.unitFiles, []);
  assert.ok(plan.coreFiles.includes('src/shared/replay.test.ts'));
  assert.ok(plan.coreFiles.includes('src/games/spire/agent/policy.test.ts'));
  assert.ok(plan.coreFiles.includes('packages/diablo2/src/agent/policy.test.ts'));
  assert.equal(plan.geometry, false);
});

void test('policy, observation, adapter, rules, content and replay changes retain the affected full matrix', () => {
  for (const path of [
    'agent/policy.ts',
    'agent/observation.ts',
    'agent/adapter.ts',
    'game.ts',
    'content/cards.ts',
    'application/replay.ts',
  ]) {
    const plan = select(`src/games/spire/${path}`);
    assert.ok(plan.unitFiles.includes('src/games/spire/agent/policy-rollout.test.ts'), path);
    assert.ok(!plan.unitFiles.includes('packages/diablo2/src/agent/policy-rollout.test.ts'), path);
  }
});

void test('transitive imports select cross-game dependants and their browser coverage', () => {
  const plan = select(
    'src/games/spire/content/cards.ts',
    new Map([
      ['src/games/spire/content/cards.ts', new Set(['packages/diablo2/src/adapter.ts'])],
      ['packages/diablo2/src/adapter.ts', new Set(['packages/diablo2/src/game.test.ts'])],
    ]),
  );
  assert.ok(plan.unitFiles.includes('packages/diablo2/src/game.test.ts'));
  assert.ok(plan.unitFiles.includes('packages/diablo2/src/agent/policy-rollout.test.ts'));
  assert.ok(plan.browserFiles.includes('tests/browser/diablo2.spec.ts'));
});

void test('shared evaluator, configuration, deleted and unknown paths select every retained test', () => {
  const changes: Change[] = [
    { path: 'src/shared/policy/rollout.ts', status: 'M' },
    { path: 'vite.config.ts', status: 'M' },
    { path: '.github/workflows/maintenance.yml', status: 'M' },
    { path: 'new-source/asset.ts', status: 'A' },
    { path: 'src/games/spire/game.ts', status: 'D' },
    { path: 'public/new-native-delivery.glb', status: 'M' },
    { path: 'tests/browser/budget.ts', status: 'M' },
  ];
  for (const change of changes) {
    const plan = select(change.path, new Map(), change.status);
    assert.equal(plan.mode, 'full', change.path);
    assert.deepEqual(
      [...plan.coreFiles, ...plan.unitFiles].sort(),
      [...catalogue.application].sort(),
      change.path,
    );
    assert.deepEqual(plan.browserFiles, [...catalogue.browser].sort(), change.path);
    assert.equal(plan.geometry, true, change.path);
  }
});

void test('native producer/delivery changes retain both model and Night Passage journeys', () => {
  for (const path of [
    'packages/dcc-workbench/subjects/night-passage/hero/source.blend',
    'packages/dcc-workbench/authoring/hero_delivery.py',
  ]) {
    const plan = select(path);
    assert.equal(plan.geometry, true);
    assert.ok(plan.browserFiles.includes('tests/browser/night-passage-hero.spec.ts'));
    assert.ok(plan.browserFiles.includes('tests/browser/art3d.spec.ts'));
  }
  const scene = select('src/games/night-passage/ui/presentation/scene/hero.ts');
  assert.equal(scene.geometry, true);
  assert.ok(scene.browserFiles.includes('tests/browser/night-passage-hero.spec.ts'));
  assert.ok(!scene.browserFiles.includes('tests/browser/art3d.spec.ts'));
});

void test('new unclassified tests and unresolved imports fail safely to comprehensive selection', () => {
  for (const extended of [
    { ...catalogue, application: [...catalogue.application, 'src/new-game/unknown.test.ts'] },
    { ...catalogue, browser: [...catalogue.browser, 'tests/browser/new-surface.spec.ts'] },
  ]) {
    const plan = selectPlan([], extended, new Map(), { head: 'a'.repeat(40) });
    assert.equal(plan.mode, 'full');
  }
  assert.equal(
    selectPlan([], catalogue, new Map(), {
      head: 'a'.repeat(40),
      uncertain: ['unknown dynamic import'],
    }).mode,
    'full',
  );
});

void test('manual/main/release mode is comprehensive; documentation retains the safety core', () => {
  assert.equal(
    selectPlan([], catalogue, new Map(), { head: 'a'.repeat(40), full: true }).mode,
    'full',
  );
  const plan = select('README.md');
  assert.equal(plan.mode, 'scoped');
  assert.deepEqual(plan.unitFiles, []);
  assert.deepEqual(plan.browserFiles, []);
});

void test('offline gallery generator retains its browser delivery check', () => {
  const plan = selectPlan(
    [{ path: 'packages/workshop-tools/art/gallery.ts', status: 'M' }],
    { ...catalogue, browser: ['tests/browser/asset-gallery.spec.ts'] },
    new Map(),
    { head: 'a'.repeat(40) },
  );
  assert.deepEqual(plan.browserFiles, ['tests/browser/asset-gallery.spec.ts']);
});

void test('empty selection never runs a whole suite and shard indices are bounded', () => {
  const plan = select('README.md');
  assert.equal(commandFor(plan, 'unit'), null);
  assert.equal(commandFor(plan, 'browser'), null);
  assert.equal(commandFor(plan, 'geometry'), null);
  assert.throws(() => commandFor(plan, 'core', 2), /Invalid shard/);
});

void test('aggregate gate refuses skipped, failed or cancelled required modules', () => {
  const plan = select('README.md');
  const good = {
    plan: 'success',
    core: 'success',
    application: 'skipped',
    assets: 'success',
  } as const;
  verifyResults(plan, good);
  for (const name of ['plan', 'core', 'assets'])
    for (const result of ['skipped', 'failure', 'cancelled'] as const) {
      assert.throws(() => verifyResults(plan, { ...good, [name]: result }), /Required/);
    }
  const full = select('vite.config.ts');
  assert.throws(() => verifyResults(full, good), /Required application/);
});
