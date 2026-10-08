import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath, type Plugin } from 'vite';
import { record, readBrief } from './contracts.ts';
import { loadRegistry, resolveAssetPath } from './registry.ts';
import { resolvePublication } from './releases.ts';
import type { PublishedAssetInfo, PublishedBrief, PublishedStats } from './src/delivery-types.ts';

const virtualId = 'virtual:card-workshop-dcc';
const resolvedId = '\0' + virtualId;

function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error('Invalid delivery presentation text');
  return value;
}
function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error('Invalid delivery presentation number');
  return value;
}
function count(value: unknown): number {
  const result = number(value);
  if (!Number.isSafeInteger(result) || result < 0)
    throw new Error('Invalid delivery presentation count');
  return result;
}
function rows(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Invalid delivery presentation array');
  return value as unknown[];
}
function parseBrief(json: string, id: string): PublishedBrief {
  const brief = readBrief(json);
  if (brief.id !== id) throw new Error('Published presentation brief identity mismatch');
  const raw = record(JSON.parse(json));
  const animation = raw.animation === undefined ? undefined : record(raw.animation);
  return {
    ...brief,
    title: text(raw.title),
    subtitle: text(raw.subtitle),
    interpretation: text(raw.interpretation),
    gesture: text(raw.gesture),
    polish: rows(raw.polish).map(text),
    palette: rows(raw.palette).map((value) => {
      const entry = record(value);
      return { name: text(entry.name), color: text(entry.color) };
    }),
    nativeFeatures: rows(raw.nativeFeatures).map(text),
    animation: animation
      ? {
          name: text(animation.name),
          seconds: number(animation.seconds),
          fps: count(animation.fps),
        }
      : undefined,
    reference: text(raw.reference),
    reviewStatus: text(raw.reviewStatus),
  };
}
function parseStats(raw: Record<string, unknown>): PublishedStats {
  return {
    bytes: count(raw.bytes),
    triangles: count(raw.triangles),
    meshes: count(raw.meshes),
    materials: count(raw.materials),
    textures: count(raw.textures),
    joints: count(raw.joints),
    animations: rows(raw.animations).map((value) => {
      const animation = record(value);
      return {
        ...(animation.name === undefined ? {} : { name: text(animation.name) }),
        seconds: number(animation.seconds),
        channels: count(animation.channels),
      };
    }),
  };
}
function urlImport(name: string, path: string): string {
  return `import ${name} from ${JSON.stringify('/@fs/' + normalizePath(path) + '?url')};`;
}

/** Generate imports only for publications selected by the registry/current pointers.
 * No history or candidate glob is evaluated, and no Blender process is involved.
 */
export function publishedAssetsModule(packageRoot: string): { code: string; watchFiles: string[] } {
  const registry = loadRegistry(packageRoot);
  const watchFiles = new Set([resolveAssetPath(packageRoot, 'registry.json')]);
  const imports: string[] = [];
  const entries: string[] = [];
  for (const [index, asset] of Object.values(registry.assets).entries()) {
    const current = resolveAssetPath(packageRoot, asset.delivery.publication + '/current.json');
    const legacy = resolveAssetPath(packageRoot, asset.delivery.manifest);
    watchFiles.add(current);
    watchFiles.add(legacy);
    // A registered draft may be exported and reviewed before its first publication.
    // Existing invalid pointers/receipts still fail closed through the resolver.
    if (!existsSync(current) && !existsSync(legacy)) continue;
    const publication = resolvePublication(packageRoot, asset);
    const briefPath = publication.briefPath;
    const brief = parseBrief(readFileSync(briefPath, 'utf8'), asset.id);
    const audit = record(JSON.parse(readFileSync(publication.audit, 'utf8')));
    const info: PublishedAssetInfo = {
      kind: publication.kind,
      receiptDigest: publication.receiptDigest,
      modelSha256: publication.modelSha256,
      blender: text(audit.blender),
      stats: parseStats(publication.stats),
      ...(publication.reviewScope ? { reviewScope: publication.reviewScope } : {}),
      ...(publication.reviewDecision ? { reviewDecision: publication.reviewDecision } : {}),
    };
    imports.push(
      urlImport(`model${index}`, publication.model),
      urlImport(`source${index}`, publication.source),
    );
    if (publication.poses) imports.push(urlImport(`poses${index}`, publication.poses));
    entries.push(
      `${JSON.stringify(asset.id)}: { ...${JSON.stringify({ id: asset.id, legacyStudyId: publication.legacyStudyId, brief, info })}, modelUrl: model${index}, sourceUrl: source${index}${publication.poses ? `, posesUrl: poses${index}` : ''} }`,
    );
    for (const path of [
      briefPath,
      publication.model,
      publication.source,
      publication.audit,
      publication.receipt,
      publication.poses,
    ])
      if (path) watchFiles.add(path);
    if (publication.kind === 'release') {
      const receipt = record(JSON.parse(readFileSync(publication.receipt, 'utf8')));
      for (const key of ['candidate', 'review', 'previousReceipt']) {
        if (receipt[key] === undefined) continue;
        const pin = record(receipt[key]);
        watchFiles.add(resolveAssetPath(dirname(publication.receipt), text(pin.path)));
        if (key === 'review') {
          const reviewPath = resolveAssetPath(dirname(publication.receipt), text(pin.path));
          const review = record(JSON.parse(readFileSync(reviewPath, 'utf8')));
          for (const evidence of rows(review.evidence))
            watchFiles.add(
              resolveAssetPath(dirname(publication.receipt), text(record(evidence).reference)),
            );
        }
      }
    }
  }
  return {
    code: `${imports.join('\n')}\nexport const assets = {${entries.join(',\n')}};\n`,
    watchFiles: [...watchFiles],
  };
}

export function dccAssetsPlugin(packageRoot = dirname(fileURLToPath(import.meta.url))): Plugin {
  let watched = new Set([normalizePath(resolve(packageRoot, 'registry.json'))]);
  let watch: ((files: string[]) => void) | undefined;
  return {
    name: 'card-workshop-dcc-assets',
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id !== resolvedId) return;
      const result = publishedAssetsModule(packageRoot);
      watched = new Set(result.watchFiles.map(normalizePath));
      // Vite also turns addWatchFile dependencies into module imports in development.
      // Draft pointers do not exist yet; watch their creation without importing them.
      for (const file of result.watchFiles) if (existsSync(file)) this.addWatchFile(file);
      watch?.(result.watchFiles);
      return result.code;
    },
    configureServer(server) {
      watch = (files) => {
        server.watcher.add(files);
      };
      watch([...watched]);
      const changed = (file: string) => {
        if (!watched.has(normalizePath(resolve(file)))) return;
        const module = server.moduleGraph.getModuleById(resolvedId);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', changed).on('change', changed).on('unlink', changed);
      server.httpServer?.once('close', () => {
        server.watcher.off('add', changed).off('change', changed).off('unlink', changed);
        watch = undefined;
      });
    },
  };
}
