import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { commandFor, readPlan, requiredModules, verifyResults } from './commands.ts';
import {
  isNamedDocumentation,
  selectPlan,
  type Catalogue,
  type Change,
  type DependencyGraph,
} from './selection.ts';

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
    'tests/browser/night-passage-scene.spec.ts',
    'tests/browser/night-passage-campaign.spec.ts',
    'tests/browser/shell.spec.ts',
    'tests/browser/art3d.spec.ts',
  ],
  geometry: ['src/art3d/procedural/watcher.test.ts'],
};
const select = (path: string, graph: DependencyGraph = new Map(), status = 'M') =>
  selectPlan([{ path, status }], catalogue, graph, { head: 'a'.repeat(40) });

void test('UI change runs safety regressions and affected browser family without deep policy matrices', () => {
  const plan = select('src/games/spire/ui/SpireGame.tsx');
  assert.equal(plan.mode, 'scoped');
  assert.deepEqual(plan.browserFiles, [
    'tests/browser/shell.spec.ts',
    'tests/browser/spire.spec.ts',
  ]);
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

void test('shared evaluator, configuration, deleted and unknown paths retain all application coverage without exhaustive rendering', () => {
  const changes: Change[] = [
    { path: 'src/shared/policy/rollout.ts', status: 'M' },
    { path: '.github/workflows/maintenance.yml', status: 'M' },
    { path: 'new-source/asset.ts', status: 'A' },
    { path: 'src/games/spire/game.ts', status: 'D' },
    { path: 'public/new-native-delivery.glb', status: 'M' },
    { path: 'tests/browser/budget.ts', status: 'M' },
  ];
  for (const change of changes) {
    const plan = select(change.path, new Map(), change.status);
    assert.equal(plan.mode, 'application', change.path);
    assert.deepEqual(
      [...plan.coreFiles, ...plan.unitFiles].sort(),
      [...catalogue.application].sort(),
      change.path,
    );
    assert.ok(plan.browserFiles.includes('tests/browser/spire.spec.ts'), change.path);
    assert.ok(
      !plan.browserFiles.includes('tests/browser/night-passage-campaign.spec.ts'),
      change.path,
    );
    assert.equal(plan.geometry, false, change.path);
  }
});

void test('native producer/delivery changes retain both model and Night Passage journeys', () => {
  for (const path of [
    'packages/dcc-workbench/subjects/night-passage/hero/source.blend',
    'packages/dcc-workbench/authoring/hero_delivery.py',
  ]) {
    const plan = select(path);
    assert.equal(plan.geometry, false);
    assert.ok(plan.browserFiles.includes('tests/browser/night-passage-scene.spec.ts'));
    assert.ok(!plan.browserFiles.includes('tests/browser/night-passage-hero.spec.ts'));
    assert.ok(plan.browserFiles.includes('tests/browser/art3d.spec.ts'));
  }
  const scene = select('src/games/night-passage/ui/presentation/scene/hero.ts');
  assert.equal(scene.geometry, false);
  assert.ok(scene.browserFiles.includes('tests/browser/night-passage-scene.spec.ts'));
  assert.ok(!scene.browserFiles.includes('tests/browser/art3d.spec.ts'));
});

void test('new unclassified tests and unresolved imports expand application coverage', () => {
  for (const extended of [
    { ...catalogue, application: [...catalogue.application, 'src/new-game/unknown.test.ts'] },
    { ...catalogue, browser: [...catalogue.browser, 'tests/browser/new-surface.spec.ts'] },
  ]) {
    const plan = selectPlan([], extended, new Map(), { head: 'a'.repeat(40) });
    assert.equal(plan.mode, 'application');
    assert.deepEqual(
      [...plan.coreFiles, ...plan.unitFiles].sort(),
      [...extended.application].sort(),
    );
  }
  assert.equal(
    selectPlan([], catalogue, new Map(), {
      head: 'a'.repeat(40),
      uncertain: ['unknown dynamic import'],
    }).mode,
    'application',
  );
});

void test('explicit full validation retains every application, geometry and public browser journey', () => {
  const full = selectPlan([], catalogue, new Map(), { head: 'a'.repeat(40), full: true });
  assert.equal(full.mode, 'full');
  assert.deepEqual(full.browserFiles, [...catalogue.browser].sort());
  assert.deepEqual(
    [...full.coreFiles, ...full.unitFiles].sort(),
    [...catalogue.application].sort(),
  );
  assert.equal(full.geometry, true);
  assert.ok(commandFor(full, 'browser')?.includes('--project=functional'));
  const routine = selectPlan([], catalogue, new Map(), {
    head: 'a'.repeat(40),
    allApplications: true,
  });
  assert.equal(routine.mode, 'application');
  assert.ok(!routine.browserFiles.includes('tests/browser/night-passage-campaign.spec.ts'));
  assert.ok(commandFor(routine, 'browser')?.includes('--project=ci-assets'));
  assert.ok(!commandFor(routine, 'browser')?.includes('--project=functional'));
});

void test('eligible documentation changes select only the documentation module', () => {
  for (const path of [
    'docs/engineering/maintenance.md',
    'docs/art/assets/example/README.md',
    'AGENTS.md',
    'docs/engineering/checks.md',
    'skills/card-art/assets/native-handoff.md.template',
  ]) {
    for (const status of isNamedDocumentation(path) ? ['M'] : ['M', 'D']) {
      const plan = select(path, new Map(), status);
      assert.equal(plan.mode, 'documentation', path);
      assert.deepEqual(requiredModules(plan), {
        plan: true,
        documentation: true,
        core: false,
        application: false,
        assets: false,
      });
      assert.deepEqual(plan.coreFiles, []);
    }
  }
  const mixed = selectPlan(
    [
      { path: 'docs/engineering/checks.md', status: 'M' },
      { path: 'src/games/spire/ui/Card.tsx', status: 'M' },
    ],
    catalogue,
    new Map(),
    { head: 'a'.repeat(40) },
  );
  assert.equal(mixed.mode, 'application');
});

void test('CSS retains bounded game journeys while shared 3D dependencies retain geometry', () => {
  const css = select('src/games/night-passage/ui/night-passage.css');
  assert.deepEqual(css.browserFiles, ['tests/browser/night-passage-scene.spec.ts']);
  assert.equal(css.geometry, false);
  const shared = select(
    'src/shared/three/resources.ts',
    new Map([['src/shared/three/resources.ts', new Set(['src/art3d/procedural/watcher.test.ts'])]]),
  );
  assert.equal(shared.geometry, true);
});

void test('baked assets and viewer edits skip constructors; generator dependencies select their tests', () => {
  for (const path of [
    'src/art3d/baked/watcher.glb',
    'src/art3d/baked/manifest.json',
    'src/art3d/delivery.ts',
    'src/art3d/gallery/controller.ts',
  ]) {
    assert.deepEqual(select(path).geometryFiles, []);
    assert.equal(commandFor(select(path), 'geometry'), null);
  }
  const plan = select(
    'src/art3d/procedural/surfaceSculpt.ts',
    new Map([
      ['src/art3d/procedural/surfaceSculpt.ts', new Set(['src/art3d/procedural/watcher.test.ts'])],
    ]),
  );
  assert.deepEqual(plan.geometryFiles, catalogue.geometry);
  assert.deepEqual(commandFor(plan, 'geometry'), [
    'vitest',
    'run',
    '--project',
    'geometry',
    ...catalogue.geometry,
  ]);
  for (const path of ['package-lock.json', '.node-version', 'vite.config.ts'])
    assert.deepEqual(select(path).geometryFiles, catalogue.geometry);
  assert.deepEqual(
    select('src/art3d/procedural/new.ts', new Map(), 'A').geometryFiles,
    catalogue.geometry,
  );
  assert.deepEqual(
    select('src/art3d/procedural/removed.ts', new Map(), 'D').geometryFiles,
    catalogue.geometry,
  );
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

void test('missing diff base and unresolved constructor imports conservatively retain geometry', () => {
  const missingBase = selectPlan([], catalogue, new Map(), {
    head: 'a'.repeat(40),
    allApplications: true,
  });
  assert.deepEqual(missingBase.geometryFiles, catalogue.geometry);
  const unresolved = selectPlan(
    [{ path: 'src/art3d/procedural/watcher.ts', status: 'M' }],
    catalogue,
    new Map(),
    {
      head: 'a'.repeat(40),
      uncertain: ['src/art3d/procedural/watcher.ts: ./missing'],
    },
  );
  assert.deepEqual(unresolved.geometryFiles, catalogue.geometry);
});

void test('empty selection never runs a whole suite and shard indices are bounded', () => {
  const plan = select('docs/engineering/maintenance.md');
  assert.equal(commandFor(plan, 'unit'), null);
  assert.equal(commandFor(plan, 'browser'), null);
  assert.equal(commandFor(plan, 'geometry'), null);
  assert.equal(commandFor(plan, 'core'), null);
  assert.throws(() => commandFor(select('vite.config.ts'), 'core', 2), /Invalid shard/);
});

void test('aggregate gate refuses skipped, failed or cancelled required modules', () => {
  for (const plan of [
    select('docs/engineering/maintenance.md'),
    select('skills/card-art/assets/native-handoff.md.template'),
    select('vite.config.ts'),
    select('src/games/spire/ui/Card.tsx'),
  ]) {
    const good = Object.fromEntries(
      Object.entries(requiredModules(plan)).map(([name, required]) => [
        name,
        required ? 'success' : 'skipped',
      ]),
    ) as Record<string, 'success' | 'skipped'>;
    verifyResults(plan, good);
    for (const [name, required] of Object.entries(requiredModules(plan))) {
      for (const result of ['failure', 'cancelled'] as const)
        assert.throws(() => verifyResults(plan, { ...good, [name]: result }));
      if (required)
        assert.throws(() => verifyResults(plan, { ...good, [name]: 'skipped' }), /Required/);
      const missing = { ...good };
      delete missing[name];
      assert.throws(() => verifyResults(plan, missing));
    }
  }
});

void test('execution and aggregate gate reject stale or malformed plans before permitting skips', () => {
  const plan = select('docs/engineering/maintenance.md');
  assert.deepEqual(readPlan(plan, plan.head), plan);
  for (const invalid of [
    null,
    {},
    { ...plan, version: 1 },
    { ...plan, version: 3 },
    { ...plan, mode: 'unknown' },
    { ...plan, head: 'b'.repeat(40) },
    { ...plan, unitFiles: null },
    { ...plan, geometry: true },
    { ...plan, browserShards: 0 },
    { ...plan, browserMatrix: undefined },
    { ...plan, browserMatrix: [] },
    { ...plan, browserMatrix: new Array(1) },
    { ...plan, browserMatrix: [2] },
    { ...plan, browserMatrix: [1, 1] },
    { ...plan, coreFiles: ['src/shared/replay.test.ts'] },
  ])
    assert.throws(() => readPlan(invalid, plan.head), /CI plan/);
});
