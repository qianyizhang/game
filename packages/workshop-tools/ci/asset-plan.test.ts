import { strict as assert } from 'node:assert';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { readPlan } from './commands.ts';
import { selectPlan, type Plan } from './selection.ts';

const root = resolve(import.meta.dirname, '../../..');
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const browserFiles = Array.from({ length: 17 }, (_, i) => `tests/browser/spire-${i}.spec.ts`);
const plan = selectPlan(
  [{ path: 'src/games/spire/ui/Card.tsx', status: 'M' }],
  { application: ['src/shared/replay.test.ts'], browser: browserFiles, geometry: [] },
  new Map(),
  { head },
);

function assetOutput(value?: unknown) {
  const directory = mkdtempSync(join(tmpdir(), 'asset-plan-output-'));
  const output = join(directory, 'output');
  try {
    const result = spawnSync(process.execPath, ['packages/workshop-tools/ci/asset-plan.ts'], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        CI_PLAN: value === undefined ? '' : JSON.stringify(value),
        GITHUB_OUTPUT: output,
      },
    });
    const fields = Object.fromEntries(
      (existsSync(output) ? readFileSync(output, 'utf8') : '')
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const equals = line.indexOf('=');
          return [line.slice(0, equals), line.slice(equals + 1)];
        }),
    );
    return { ...result, fields };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

void test('parent plan includes every browser shard once; fallback validation preserves that matrix and selection', () => {
  assert.equal(plan.version, 4);
  assert.equal(plan.browserShards, 3);
  assert.deepEqual(plan.browserMatrix, [1, 2, 3]);
  const result = assetOutput(plan);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.fields.plan), plan);
  assert.deepEqual(JSON.parse(result.fields.browser_matrix), [1, 2, 3]);
  assert.equal(result.fields.browser, 'true');
  assert.equal(result.fields.geometry, 'false');
});

void test('standalone asset planning retains full browser and constructor selection without executing those tests', () => {
  const result = assetOutput();
  assert.equal(result.status, 0, result.stderr);
  const full = readPlan(JSON.parse(result.fields.plan), head);
  assert.equal(full.mode, 'full');
  assert.equal(full.geometry, true);
  assert.ok(full.geometryFiles.length > 0);
  assert.ok(full.browserFiles.includes('tests/browser/night-passage-campaign.spec.ts'));
  assert.ok(full.browserFiles.includes('tests/browser/study-delivery.spec.ts'));
  assert.deepEqual(full.browserMatrix, [1, 2, 3, 4]);
});

void test('empty and geometry-only direct calls still validate instead of silently bypassing the asset workflow', () => {
  const empty = selectPlan([], { application: [], browser: [], geometry: [] }, new Map(), { head });
  const geometry: Plan = {
    ...empty,
    geometry: true,
    geometryFiles: ['src/art3d/gallery/recording.test.ts'],
  };
  for (const candidate of [empty, geometry]) {
    const result = assetOutput(candidate);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.fields.plan), candidate);
    assert.equal(result.fields.browser, 'false');
    assert.equal(result.fields.geometry, String(candidate.geometry));
  }
});

void test('actual plan and module CLIs reject omitted, duplicate, malformed and stale matrices before any test command', () => {
  for (const invalid of [
    { ...plan, browserMatrix: undefined },
    { ...plan, browserMatrix: [] },
    { ...plan, browserMatrix: [1] },
    { ...plan, browserMatrix: [1, 1, 3] },
    { ...plan, browserMatrix: [1, 3, 2] },
    { ...plan, browserMatrix: [1, '2', 3] },
    { ...plan, browserMatrix: [1, 2, 3, 4] },
    { ...plan, version: 3 },
    { ...plan, head: '0'.repeat(40) },
    // Even no-work input must validate: it cannot use an empty selection as a shortcut.
    { ...plan, browserFiles: [], browserMatrix: [] },
  ]) {
    const result = assetOutput(invalid);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Invalid or stale CI plan/);
    assert.deepEqual(result.fields, {});
    const module = spawnSync(
      process.execPath,
      ['packages/workshop-tools/ci/cli.ts', 'run', 'browser'],
      {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, CI_PLAN: JSON.stringify(invalid) },
      },
    );
    assert.notEqual(module.status, 0);
    assert.match(module.stderr, /Invalid or stale CI plan/);
  }
});

// Hosted CI exercises the supplied-plan scheduler route. These assertions protect
// fallback/cancellation wiring locally; real CLIs above exercise input validation.
void test('execution retains catalogue validation even when the supplied matrix is complete', () => {
  const invalid = {
    ...plan,
    browserFiles: ['tests/browser/not-a-maintained-journey.spec.ts'],
    browserShards: 1,
    browserMatrix: [1],
  };
  const result = spawnSync(
    process.execPath,
    ['packages/workshop-tools/ci/cli.ts', 'run', 'browser'],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, CI_PLAN: JSON.stringify(invalid) },
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid CI plan/);
});

void test('workflow keeps validation for absent/empty inputs and cannot run asset work after failed planning or cancellation', () => {
  const workflow = readFileSync(
    new URL('../../../.github/workflows/asset-build.yml', import.meta.url),
    'utf8',
  );
  const fallback = workflow.match(/^  plan:\n([\s\S]*?)^  geometry:/m)![1];
  assert.match(
    fallback,
    /inputs\.plan == '' \|\| !fromJSON\(inputs\.plan\)\.browserFiles\[0\] \|\| !fromJSON\(inputs\.plan\)\.browserMatrix\[0\]/,
  );
  assert.match(fallback, /inputs\.blindside_joker_capture != true/);
  assert.match(fallback, /run: node packages\/workshop-tools\/ci\/asset-plan\.ts/);
  for (const block of [
    workflow.match(/^  geometry:\n([\s\S]*?)^  browser-delivery:/m)![1],
    workflow.match(/^  browser-delivery:\n([\s\S]*?)^  blindside-joker-capture:/m)![1],
  ]) {
    assert.match(block, /!cancelled\(\)/);
    assert.match(block, /inputs\.blindside_joker_capture != true/);
    assert.match(
      block,
      /needs\.plan\.result == 'success' \|\|\s+\(inputs\.plan != '' && needs\.plan\.result == 'skipped'\)/,
    );
    assert.match(block, /CI_PLAN: \$\{\{ inputs\.plan \|\| needs\.plan\.outputs\.plan \}\}/);
    assert.doesNotMatch(block, /continue-on-error|permissions:\s+write/);
  }
  assert.match(
    workflow,
    /shard: \$\{\{ fromJSON\(inputs\.plan \|\| needs\.plan\.outputs\.plan\)\.browserMatrix \}\}/,
  );
});
