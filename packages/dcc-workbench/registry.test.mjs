import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assetInputPaths,
  definitionDigest,
  getAsset,
  loadRegistry,
  readRegistry,
  resolveAssetPath,
  validateNativeDependencies,
} from './registry.ts';

/** @typedef {Omit<import('./registry.ts').AssetDefinition, 'id'>} RawAsset */
/** @typedef {{schemaVersion:number, assets:Record<string, RawAsset>}} RawRegistry */
const root = import.meta.dirname;
/** @returns {RawRegistry} */
function fixture() {
  const registry = loadRegistry(root);
  return {
    schemaVersion: registry.schemaVersion,
    assets: Object.fromEntries(
      Object.values(registry.assets).map(({ id, ...asset }) => [id, structuredClone(asset)]),
    ),
  };
}
/** A synthetic contract only; it claims no second authored or delivered artwork.
 * @returns {RawAsset}
 */
function second() {
  return {
    legacyStudyId: 'fixture-lantern',
    source: 'subjects/fixture-lantern/source.blend',
    brief: 'subjects/fixture-lantern/brief.json',
    native: {
      adapter: 'blender/export_fixture.py',
      dependencies: ['blender/export_fixture.py'],
    },
    delivery: {
      profile: 'static',
      directory: 'assets/fixture-lantern',
      model: 'assets/fixture-lantern/model.glb',
      audit: 'assets/fixture-lantern/authoring.json',
      manifest: 'assets/fixture-lantern/manifest.json',
      receipts: 'assets/fixture-lantern/receipts',
      publication: 'assets/fixture-lantern/published',
    },
  };
}

await test('Hydra preserves its study identity while the saved native source has complete declared inputs', () => {
  const hydra = getAsset(loadRegistry(root), 'briar-hydra');
  assert.equal(hydra.legacyStudyId, 'hydra');
  assert.equal(hydra.source, 'subjects/briar-hydra/source.blend');
  assert.equal(hydra.delivery.model, 'assets/briar-hydra.glb');
  assert.deepEqual(hydra.delivery.animation, { name: 'hydra_idle', seconds: 6, fps: 24 });
  validateNativeDependencies(hydra, (path) => {
    try {
      return readFileSync(resolveAssetPath(root, path), 'utf8');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
        return undefined;
      throw error;
    }
  });
});

await test('a second synthetic asset stays isolated without changing Hydra receipt identity', () => {
  const input = fixture();
  const hydra = getAsset(readRegistry(JSON.stringify(input)), 'briar-hydra');
  input.assets['fixture-lantern'] = second();
  const registry = readRegistry(JSON.stringify(input));
  assert.equal(definitionDigest(getAsset(registry, 'briar-hydra')), definitionDigest(hydra));
  const lantern = getAsset(registry, 'fixture-lantern');
  assert.equal(lantern.delivery.profile, 'static');
  assert.equal(lantern.delivery.poses, undefined);
  assert.ok(!assetInputPaths(lantern).includes(hydra.source));
  assert.ok(!assetInputPaths(hydra).includes(lantern.source));
  assert.throws(() => getAsset(registry, 'hydra'), /Unknown asset id/);
  assert.throws(() => getAsset(registry, 'constructor'), /Unknown asset id/);
});

await test('unknown schemas, unknown fields, invalid ids and mismatched motion contracts fail closed', () => {
  const input = fixture();
  input.schemaVersion = 2;
  assert.throws(() => readRegistry(JSON.stringify(input)), /schemaVersion/);
  assert.throws(
    () => readRegistry(JSON.stringify({ ...fixture(), approved: true })),
    /Unknown registry field/,
  );
  assert.throws(
    () => readRegistry(JSON.stringify({ schemaVersion: 1, assets: { '../hydra': second() } })),
    /asset id/,
  );
  input.schemaVersion = 1;
  input.assets['briar-hydra'].delivery.profile = 'static';
  assert.throws(() => readRegistry(JSON.stringify(input)), /Animation declaration/);
  const rigid = second();
  rigid.delivery.profile = 'rigid';
  assert.throws(
    () => readRegistry(JSON.stringify({ schemaVersion: 1, assets: { fixture: rigid } })),
    /Animation declaration/,
  );
  rigid.delivery.animation = { name: 'Sway', seconds: 3, fps: 24 };
  assert.throws(
    () => readRegistry(JSON.stringify({ schemaVersion: 1, assets: { fixture: rigid } })),
    /Pose declaration/,
  );
  rigid.delivery.poses = 'assets/fixture-lantern/poses.json';
  assert.equal(
    getAsset(
      readRegistry(JSON.stringify({ schemaVersion: 1, assets: { fixture: rigid } })),
      'fixture',
    ).delivery.profile,
    'rigid',
  );
});

await test('path escapes and output aliasing cannot redirect source or delivery writes', () => {
  for (const invalid of [
    '/tmp/source.blend',
    '../source.blend',
    'sources/../source.blend',
    'sources//source.blend',
    'sources/./source.blend',
    'C:/source.blend',
    'sources\\source.blend',
    'sources/source.blend\u0000',
  ]) {
    const input = fixture();
    input.assets['briar-hydra'].source = invalid;
    assert.throws(() => readRegistry(JSON.stringify(input)), /registry path/);
  }
  const input = fixture();
  input.assets['briar-hydra'].delivery.audit = input.assets['briar-hydra'].delivery.manifest;
  assert.throws(() => readRegistry(JSON.stringify(input)), /output collision/);
  input.assets['briar-hydra'].delivery.audit = 'elsewhere/audit.json';
  assert.throws(() => readRegistry(JSON.stringify(input)), /outside asset delivery directory/);
});

await test('cross-asset identity and file ownership collisions are rejected while distinct nested outputs work', () => {
  const input = fixture();
  input.assets['fixture-lantern'] = second();
  input.assets['fixture-lantern'].legacyStudyId = 'hydra';
  assert.throws(() => readRegistry(JSON.stringify(input)), /Duplicate legacy study/);
  input.assets['fixture-lantern'] = second();
  input.assets['fixture-lantern'].source = input.assets['briar-hydra'].source
    .toUpperCase()
    .replace('.BLEND', '.blend');
  assert.throws(() => readRegistry(JSON.stringify(input)), /source ownership collision/);
  input.assets['fixture-lantern'] = second();
  input.assets['briar-hydra'].delivery.receipts = 'assets/fixture-lantern';
  assert.throws(() => readRegistry(JSON.stringify(input)), /output ownership collision/);
  input.assets['briar-hydra'] = fixture().assets['briar-hydra'];
  input.assets['fixture-lantern'].delivery.publication =
    'assets/fixture-lantern/receipts/published';
  assert.throws(() => readRegistry(JSON.stringify(input)), /output collision/);
  input.assets['fixture-lantern'] = second();
  input.assets['fixture-lantern'].brief = 'assets/manifest.json';
  assert.throws(() => readRegistry(JSON.stringify(input)), /Source\/output ownership collision/);
});

await test('an omitted local Python import or missing adapter is caught before native execution', () => {
  const input = fixture();
  input.assets['briar-hydra'].native.adapter = 'blender/export_asset.py';
  input.assets['briar-hydra'].native.dependencies = ['blender/export_asset.py'];
  delete input.assets['briar-hydra'].native.recipe;
  const asset = getAsset(readRegistry(JSON.stringify(input)), 'briar-hydra');
  /** @type {Record<string,string>} */
  const files = {
    'blender/export_asset.py': 'import bpy\nfrom shared_shape import points\n',
    'blender/shared_shape.py': 'points = []\n',
  };
  assert.throws(
    () => validateNativeDependencies(asset, (path) => files[path]),
    /Undeclared local native dependency: blender\/shared_shape.py/,
  );
  asset.native.dependencies.push('blender/shared_shape.py');
  validateNativeDependencies(asset, (path) => files[path]);
  delete files['blender/export_asset.py'];
  assert.throws(
    () => validateNativeDependencies(asset, (path) => files[path]),
    /Missing native dependency/,
  );
  input.assets['briar-hydra'].native.dependencies = ['blender/shared_shape.py'];
  assert.throws(() => readRegistry(JSON.stringify(input)), /adapter\/recipe/);
});

await test('existing and future file paths cannot escape through symlinked output directories', () => {
  const directory = mkdtempSync(join(tmpdir(), 'dcc-registry-'));
  try {
    const packageRoot = join(directory, 'package');
    mkdirSync(packageRoot);
    mkdirSync(join(directory, 'outside'));
    symlinkSync(join(directory, 'outside'), join(packageRoot, 'assets'));
    assert.throws(() => resolveAssetPath(packageRoot, 'assets/new/model.glb'), /symlink/);
    mkdirSync(join(packageRoot, 'owned'));
    symlinkSync(join(packageRoot, 'owned'), join(packageRoot, 'alias'));
    assert.throws(() => resolveAssetPath(packageRoot, 'alias/model.glb'), /symlink alias/);
    assert.equal(
      resolveAssetPath(packageRoot, 'subjects/new.blend'),
      join(realpathSync(packageRoot), 'subjects/new.blend'),
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
