import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import react from '@vitejs/plugin-react';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { withBundle, repositoryRoot, reportFailure } from '../io.ts';
import {
  MANAGED_PATH,
  digest,
  readHistory,
  verifyHistory,
  importHistory,
  validateSvg,
  historyPath,
} from './history-store.ts';
import type { ArtHistory, HistoryAsset } from './history-types.ts';

/** Resolve scene colors exactly as the normal exporter does, without changing the source. */
export function standaloneSvg(svg: string) {
  const variables = Object.fromEntries(
    [...svg.matchAll(/(--[\w-]+):([^;"}]+)/g)].map((match) => [match[1], match[2]]),
  );
  svg = svg.replace(
    /var\((--[\w-]+)(?:,\s*([^)]+))?\)/g,
    (_: string, name: string, fallback: string | undefined) =>
      variables[name] ?? fallback ?? 'currentColor',
  );
  if (!svg.includes('xmlns=')) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return svg + '\n';
}

export async function runHistory(args: string[]) {
  const [command, input] = args;
  if (command === 'verify' && args.length === 1) {
    const result = verifyHistory(repositoryRoot);
    console.log({ ...result, registeredSources: await verifySourceHistory(repositoryRoot) });
  } else if (command === 'snapshot' && args.length <= 2)
    console.log(await snapshotHistory(repositoryRoot, readHistory(repositoryRoot).version, input));
  else if (command === 'import' && input && args.length === 2) {
    importHistory(
      repositoryRoot,
      readHistory(repositoryRoot).version,
      JSON.parse(readFileSync(resolve(input), 'utf8')),
    );
    console.log(verifyHistory(repositoryRoot));
  } else
    throw new Error(
      'Usage: npm run assets:history -- snapshot [asset-id] | verify | import <prepared-history.json>',
    );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runHistory(process.argv.slice(2)).catch(reportFailure);

/** Explicit checkpoint, never a watcher: preserve only changed editable sources. */
export async function snapshotHistory(root: string, version: string, assetId?: string) {
  const previous = readHistory(root);
  if (previous.version !== version) throw new Error('History changed. Reload before saving.');
  if (assetId && !previous.history.assets.some((asset) => asset.id === assetId))
    throw new Error('Unknown asset');
  const checkpoint = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const id = 'source-' + checkpoint.slice(0, 7) + '-' + randomUUID().slice(0, 8);
  const incoming: ArtHistory = { schema: 1, assets: [], attempts: [], revisions: [] };
  const created: string[] = [];
  try {
    for (const { asset, svg } of await sourceArtwork()) {
      if (assetId && asset.id !== assetId) continue;
      const parent = previous.history.revisions
        .slice()
        .reverse()
        .find((revision) => revision.asset === asset.id && revision.attempt.startsWith('source-'));
      const prior = previous.history.assets.find((item) => item.id === asset.id);
      const matching = previous.history.revisions.some(
        (revision) => revision.asset === asset.id && revision.runtimeDigest === asset.sourceDigest,
      );
      if (prior?.sourceDigest === asset.sourceDigest && (!assetId || matching)) continue;
      asset.sourceRevision = checkpoint;
      incoming.assets.push(asset);
      const file = `${MANAGED_PATH}/${asset.id}/${id}.svg`;
      const path = historyPath(root, file);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, svg, { flag: 'wx' });
      created.push(file);
      incoming.revisions.push({
        id: `${id}:${asset.id}`,
        asset: asset.id,
        attempt: id,
        label: 'Saved source revision',
        file,
        digest: digest(svg),
        parents: parent ? [parent.id] : [],
        runtimeFile: file,
        runtimeDigest: digest(svg),
        notes: `Editable source at ${checkpoint}, including current working-tree edits. Saved deliberately; no generation was run.`,
      });
    }
    if (!incoming.revisions.length) return { saved: 0 };
    incoming.attempts.push({
      id,
      title: 'Saved editable source',
      date: new Date().toISOString().slice(0, 10),
      outcome: 'manual',
      files: [],
      notes: `Source checkpoint ${checkpoint}; working-tree edits are included in the exact saved SVGs.`,
    });
    importHistory(root, version, incoming);
    return {
      saved: incoming.revisions.length,
      revisions: incoming.revisions.map((revision) => revision.id),
      attempt: id,
    };
  } catch (error) {
    for (const file of created) unlinkSync(resolve(root, file));
    throw error;
  }
}

/** Snapshot and closeout use the same editable-source renderer, excluding game pins. */
function sourceArtwork(): Promise<{ asset: HistoryAsset; svg: string }[]> {
  return withBundle<typeof import('./gallery/catalogue'), { asset: HistoryAsset; svg: string }[]>(
    'packages/workshop-tools/art/gallery/catalogue.tsx',
    ({ cardArtCatalogue }) =>
      Promise.resolve(
        cardArtCatalogue().map((entry) => {
          const svg = standaloneSvg(renderToStaticMarkup(entry.runtimeNode ?? entry.node));
          const size = validateSvg(svg);
          return {
            asset: {
              id: entry.id,
              name: entry.name,
              group: entry.group,
              ...size,
              sourceDigest: digest(svg),
            },
            svg,
          };
        }),
      ),
    [
      react(),
      {
        name: 'editable-art-source',
        enforce: 'pre',
        load(path) {
          if (path.endsWith('/src/shared/art/selected-art.json')) return '{}';
        },
      },
    ],
  );
}

/** This gate observes only: a changed source must first be saved through the art workflow. */
export async function verifySourceHistory(root = repositoryRoot) {
  const { history } = readHistory(root);
  const sources = await sourceArtwork();
  const missing = sources
    .filter(
      ({ asset }) =>
        history.assets.find((item) => item.id === asset.id)?.sourceDigest !== asset.sourceDigest,
    )
    .map(({ asset }) => asset.id);
  if (missing.length)
    throw new Error(
      `Unregistered source artwork: ${missing.join(', ')}. Run npm run assets:history -- snapshot [asset-id], then inspect its gallery revision.`,
    );
  return sources.length;
}

/** Current SVGs are rendered on demand, not persisted as iteration files. */
export async function currentArtwork() {
  return Object.fromEntries(
    (await sourceArtwork()).map(({ asset, svg }) => [
      asset.id,
      `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    ]),
  );
}
