import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, posix, relative, resolve, sep } from 'node:path';

export type DeliveryProfile = 'static' | 'rigid' | 'skinned';
export interface AssetDefinition {
  id: string;
  legacyStudyId: string;
  source: string;
  brief: string;
  native: { adapter: string; recipe?: string; dependencies: string[] };
  delivery: {
    profile: DeliveryProfile;
    animation?: { name: string; seconds: number; fps: number };
    directory: string;
    model: string;
    audit: string;
    poses?: string;
    manifest: string;
    receipts: string;
    publication: string;
  };
}
export interface AssetRegistry {
  schemaVersion: 1;
  assets: Record<string, AssetDefinition>;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`Expected ${label} object`);
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, allowed: string[], label: string) {
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) throw new Error(`Unknown ${label} field: ${key}`);
}
function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim())
    throw new Error(`Invalid ${label}`);
  return value;
}
function identity(value: unknown, label: string): string {
  const result = text(value, label);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) throw new Error(`Invalid ${label}: ${result}`);
  return result;
}
function path(value: unknown): string {
  const result = text(value, 'registry path');
  if (
    result.includes('\\') ||
    result.includes(':') ||
    /[\u0000-\u001f\u007f]/.test(result) ||
    result !== result.normalize('NFC') ||
    result.split('/').some((part) => !part || part === '.' || part === '..' || part !== part.trim())
  )
    throw new Error(`Expected canonical relative registry path: ${result}`);
  return result;
}
function paths(value: unknown): string[] {
  if (!Array.isArray(value) || !value.length) throw new Error('Expected native dependencies');
  const items: unknown[] = value;
  const result = items.map(path);
  if (new Set(result.map((item) => item.toLowerCase())).size !== result.length)
    throw new Error('Duplicate native dependency');
  return result.sort();
}
function positive(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
    throw new Error(`Invalid ${label}`);
  return value;
}
function within(child: string, parent: string): boolean {
  return child.toLowerCase().startsWith(parent.toLowerCase() + '/');
}
function overlaps(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase() || within(left, right) || within(right, left);
}
function outputs(asset: AssetDefinition): string[] {
  return [
    asset.delivery.model,
    asset.delivery.audit,
    asset.delivery.poses,
    asset.delivery.manifest,
    asset.delivery.receipts,
    asset.delivery.publication,
  ].filter((item): item is string => item !== undefined);
}

function definition(id: string, input: unknown): AssetDefinition {
  identity(id, 'asset id');
  const value = object(input, 'asset');
  keys(value, ['legacyStudyId', 'source', 'brief', 'native', 'delivery'], 'asset');
  const native = object(value.native, 'native');
  keys(native, ['adapter', 'recipe', 'dependencies'], 'native');
  const delivery = object(value.delivery, 'delivery');
  keys(
    delivery,
    [
      'profile',
      'animation',
      'directory',
      'model',
      'audit',
      'poses',
      'manifest',
      'receipts',
      'publication',
    ],
    'delivery',
  );
  if (!['static', 'rigid', 'skinned'].includes(text(delivery.profile, 'delivery profile')))
    throw new Error('Unsupported delivery profile');
  const profile = delivery.profile as DeliveryProfile;
  let animation: AssetDefinition['delivery']['animation'];
  if (delivery.animation !== undefined) {
    const data = object(delivery.animation, 'animation');
    keys(data, ['name', 'seconds', 'fps'], 'animation');
    animation = {
      name: text(data.name, 'animation name'),
      seconds: positive(data.seconds, 'animation seconds'),
      fps: positive(data.fps, 'animation fps'),
    };
    if (!Number.isSafeInteger(animation.fps)) throw new Error('Animation fps must be an integer');
  }
  if (profile === 'static' ? animation !== undefined : animation === undefined)
    throw new Error('Animation declaration does not match delivery profile');
  if (profile === 'static' ? delivery.poses !== undefined : delivery.poses === undefined)
    throw new Error('Pose declaration does not match delivery profile');
  const result: AssetDefinition = {
    id,
    legacyStudyId: identity(value.legacyStudyId, 'legacy study id'),
    source: path(value.source),
    brief: path(value.brief),
    native: {
      adapter: path(native.adapter),
      ...(native.recipe === undefined ? {} : { recipe: path(native.recipe) }),
      dependencies: paths(native.dependencies),
    },
    delivery: {
      profile,
      ...(animation ? { animation } : {}),
      directory: path(delivery.directory),
      model: path(delivery.model),
      audit: path(delivery.audit),
      ...(delivery.poses === undefined ? {} : { poses: path(delivery.poses) }),
      manifest: path(delivery.manifest),
      receipts: path(delivery.receipts),
      publication: path(delivery.publication),
    },
  };
  for (const script of [result.native.adapter, result.native.recipe].filter(
    (item): item is string => item !== undefined,
  )) {
    if (!script.endsWith('.py') || !result.native.dependencies.includes(script))
      throw new Error(`Native adapter/recipe must be a declared Python dependency: ${script}`);
  }
  if (!result.source.endsWith('.blend') || !result.brief.endsWith('.json'))
    throw new Error('Expected Blender artist source and JSON brief');
  if (
    !result.delivery.model.endsWith('.glb') ||
    !result.delivery.audit.endsWith('.json') ||
    !result.delivery.manifest.endsWith('.json') ||
    (result.delivery.poses !== undefined && !result.delivery.poses.endsWith('.json'))
  )
    throw new Error('Expected GLB model and JSON delivery metadata');
  const owned = outputs(result);
  for (const [index, output] of owned.entries()) {
    if (!within(output, result.delivery.directory))
      throw new Error(`Output is outside asset delivery directory: ${output}`);
    if (owned.slice(index + 1).some((other) => overlaps(output, other)))
      throw new Error(`Delivery output collision: ${output}`);
  }
  if (overlaps(result.source, result.brief)) throw new Error('Artist source/brief collision');
  return result;
}

/** A registry describes ownership and delivery contracts, not visual acceptance. */
export function readRegistry(json: string): AssetRegistry {
  const value = object(JSON.parse(json), 'registry');
  keys(value, ['schemaVersion', 'assets'], 'registry');
  if (value.schemaVersion !== 1) throw new Error('Unsupported registry schemaVersion');
  const assets = Object.fromEntries(
    Object.entries(object(value.assets, 'assets')).map(([id, data]) => [id, definition(id, data)]),
  );
  const entries = Object.values(assets);
  if (!entries.length) throw new Error('Registry must contain an asset');
  const legacy = new Set<string>();
  for (const [index, asset] of entries.entries()) {
    if (legacy.has(asset.legacyStudyId))
      throw new Error(`Duplicate legacy study: ${asset.legacyStudyId}`);
    legacy.add(asset.legacyStudyId);
    for (const other of entries.slice(index + 1)) {
      if (
        [asset.source, asset.brief].some((left) =>
          [other.source, other.brief].some((right) => overlaps(left, right)),
        )
      )
        throw new Error(`Cross-asset source ownership collision: ${asset.id} / ${other.id}`);
      if (
        asset.delivery.directory.toLowerCase() === other.delivery.directory.toLowerCase() ||
        outputs(asset).some((left) => outputs(other).some((right) => overlaps(left, right)))
      )
        throw new Error(`Cross-asset output ownership collision: ${asset.id} / ${other.id}`);
    }
    for (const other of entries)
      if (
        assetInputPaths(other).some((input) =>
          outputs(asset).some((output) => overlaps(input, output)),
        )
      )
        throw new Error(`Source/output ownership collision: ${asset.id} / ${other.id}`);
  }
  return { schemaVersion: 1, assets };
}

export function loadRegistry(packageRoot: string): AssetRegistry {
  return readRegistry(readFileSync(resolveAssetPath(packageRoot, 'registry.json'), 'utf8'));
}
export function getAsset(registry: AssetRegistry, id: string): AssetDefinition {
  if (!Object.hasOwn(registry.assets, id)) throw new Error(`Unknown asset id: ${id}`);
  return registry.assets[id];
}
export function assetInputPaths(asset: AssetDefinition): string[] {
  return [...new Set([asset.source, asset.brief, ...asset.native.dependencies])].sort();
}
/** Pin only the selected validated definition; adding another asset preserves its receipt. */
export function definitionDigest(asset: AssetDefinition): string {
  return createHash('sha256').update(JSON.stringify(asset)).digest('hex');
}

/** Resolve future outputs too; path aliases cannot bypass registry ownership checks. */
export function resolveAssetPath(packageRoot: string, relativePath: string): string {
  const root = realpathSync(packageRoot);
  const target = resolve(root, path(relativePath));
  let ancestor = target;
  while (!lstatSync(ancestor, { throwIfNoEntry: false })) ancestor = dirname(ancestor);
  const actual = realpathSync(ancestor);
  const location = relative(root, actual);
  if (location === '..' || location.startsWith('..' + sep) || isAbsolute(location))
    throw new Error(`Registry path escapes package through a symlink: ${relativePath}`);
  if (actual !== ancestor) throw new Error(`Registry path uses a symlink alias: ${relativePath}`);
  return target;
}

export type ReadNativeInput = (relativePath: string) => string | undefined;
/** Check the declared files and local static Python imports without importing Blender.
 * Dynamic imports and external runtime packages remain explicit authoring-review concerns.
 */
export function validateNativeDependencies(
  asset: AssetDefinition,
  readInput: ReadNativeInput,
): void {
  const declared = new Set(asset.native.dependencies);
  for (const dependency of declared) {
    const source = readInput(dependency);
    if (source === undefined) throw new Error(`Missing native dependency: ${dependency}`);
    if (!dependency.endsWith('.py')) continue;
    for (const match of source.matchAll(
      /^\s*(?:from\s+([\w.]+)\s+import\b|import\s+([^#\n]+))/gm,
    )) {
      const modules = match[1]
        ? [match[1]]
        : match[2].split(',').map((module) => module.trim().split(/\s+as\s+/)[0]);
      for (const module of modules) {
        const directory = posix.dirname(dependency);
        const modulePath = module.replace(/\./g, '/');
        const base = module.startsWith('.')
          ? posix.join(
              directory,
              '../'.repeat((module.match(/^\.+/)?.[0].length ?? 1) - 1),
              module.replace(/^\.+/, '').replace(/\./g, '/'),
            )
          : posix.join(directory, modulePath);
        for (const candidate of [base + '.py', posix.join(base, '__init__.py')]) {
          path(candidate);
          if (readInput(candidate) !== undefined && !declared.has(candidate))
            throw new Error(
              `Undeclared local native dependency: ${candidate} imported by ${dependency}`,
            );
        }
      }
    }
  }
}
