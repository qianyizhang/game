import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { build } from 'vite';
import ts from 'typescript';
import { fromRoot } from '../../io.ts';
import {
  assetCollection,
  GAME_COLLECTIONS,
  NEXT_BATCH,
  RECENT_UPGRADES,
  type CollectionId,
  type BatchCandidate,
} from './library.ts';

export interface ExportedAsset {
  id: string;
  name: string;
  group: string;
  file: string;
  width: number;
  height: number;
}

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
const inlineScript = (source: string) => source.replace(/<\/script/gi, '<\\/script');
const sourceLink = (path: string, revision = 'main') =>
  `https://github.com/qianyizhang/game/blob/${revision}/${path}`;

function assetCard(asset: ExportedAsset) {
  return `<a class="asset" data-group="${escape(asset.group)}" data-name="${escape(asset.name.toLowerCase())}" href="${escape(asset.file)}" target="_blank" rel="noopener"><div class="picture"><img src="${escape(asset.file)}" alt="${escape(asset.name)}" loading="lazy" width="${asset.width}" height="${asset.height}"></div><span>${escape(asset.name)}</span><small>${escape(asset.group)}</small><small>${asset.width} × ${asset.height} · Open SVG</small></a>`;
}

function filters(assets: ExportedAsset[]) {
  const groups = [...new Set(assets.map((asset) => asset.group))];
  return `<div class="filters"><label><span id="collection-label">Collection</span><select id="group" aria-labelledby="collection-label"><option value="">All collections</option>${groups.map((group) => `<option>${escape(group)}</option>`).join('')}</select></label><label>Find an illustration<input id="search" type="search" placeholder="Sword, Strike, Heartwood…"></label><output id="count" aria-live="polite"></output></div><div class="grid">${assets.map(assetCard).join('\n')}</div><p id="empty" hidden>No illustrations match. Try another name or collection.</p>`;
}

function specimens(game: CollectionId) {
  if (game === 'emberwake')
    return `<h3>Current Canvas figures</h3><p>Fixed poses drawn by the live hero and crypt renderers. No game session is opened.</p><div class="specimens">${[
      ['barbarian', 'Rook'],
      ['sorceress', 'Mira'],
      ['necromancer', 'Silas'],
      ['archer', 'Hollow archer'],
      ['wraith', 'Salt wraith'],
      ['bellkeeper', 'Bellkeeper'],
    ]
      .map(
        ([kind, name]) =>
          `<figure class="specimen"><figcaption>${name}</figcaption><canvas data-specimen="${kind}" width="320" height="260" role="img" aria-label="Current ${name} Canvas figure">Canvas 2D is required to show ${name}.</canvas></figure>`,
      )
      .join('')}</div>`;
  if (game === 'night-passage' || game === 'scrapyard')
    return `<div class="specimens"><figure class="specimen"><figcaption>Current Canvas renderer · fixed ${game === 'scrapyard' ? 'enemy-role fixture' : 'seeded starting scene'}</figcaption><canvas data-specimen="${game}" width="960" height="600" role="img" aria-label="Current ${game} fixed Canvas scene">Canvas 2D is required to show this scene.</canvas></figure></div><p>Presentation fixture only. No running clock, player save, or gameplay evaluation.</p>`;
  if (game === 'cartographer')
    return `<div class="room-samples dc-app"><h3>Current room materials</h3><p>Fixed wall, floor and water specimens using the game’s current CSS. These are material samples, not playable rooms.</p><div class="specimens">${['dry', 'wet', 'overgrown'].map((material) => `<figure><figcaption>${material}</figcaption><div class="dc-board" data-material="${material}" role="img" aria-label="${material} wall, floor and water samples">${['wall', 'wall', 'wall', 'floor', 'floor', 'water', 'floor', 'water', 'water'].map((tile) => `<div class="dc-tile ${tile}"><span>${tile === 'water' ? '≈' : ''}</span></div>`).join('')}</div></figure>`).join('')}</div></div>`;
  return '';
}

function candidateCard(
  candidate: BatchCandidate,
  assets: Map<string, ExportedAsset>,
  records: ReadonlyMap<string, string>,
) {
  const current = candidate.current.map((id) => {
    const asset = assets.get(id);
    if (!asset) throw new Error(`Candidate references missing asset: ${id}`);
    return asset;
  });
  const trial = candidate.trial ? `candidates/${candidate.id}.svg` : null;
  const figure = (file: string, label: string) =>
    `<figure><figcaption>${escape(label)}</figcaption><div class="art-stage"><img src="${escape(file)}" alt="${escape(candidate.title)} · ${escape(label)}" loading="lazy" width="160" height="112"></div><div class="compact"><img src="${escape(file)}" alt="" loading="lazy" width="80" height="56"><small>Compact · 80 × 56</small></div></figure>`;
  return `<article class="candidate" id="candidate-${candidate.id}"><span class="status">${trial ? 'Generated · awaiting review' : candidate.status}</span><h3>${escape(candidate.title)}</h3><p>${escape(candidate.reason)}</p><p><strong>Proposed direction:</strong> ${escape(candidate.brief)}</p>${current.length || trial ? `<div class="comparisons">${current.map((asset) => figure(asset.file, asset.name.endsWith('+') ? 'Current upgrade' : 'Current base')).join('')}${trial ? figure(trial, 'Image 2.6 candidate') : ''}</div><details><summary>Enlarged comparison and SVG sources</summary><div class="enlarged">${current.map((asset) => `<figure><figcaption>${escape(asset.name)}</figcaption><a href="${asset.file}"><img src="${asset.file}" alt="${escape(asset.name)} enlarged" loading="lazy"></a></figure>`).join('')}${trial ? `<figure><figcaption>Candidate · not active in the game</figcaption><a href="${trial}"><img src="${trial}" alt="${escape(candidate.title)} candidate enlarged" loading="lazy"></a></figure>` : ''}</div></details>` : ''}${trial ? `<p>This trial proposes one base illustration. A distinct upgrade still needs review. <a href="${escape(records.get(candidate.trial!.record)!)}">Prompt, usage and generation record</a>.</p>` : '<p>No generation dispatched for this proposal.</p>'}</article>`;
}

/** Derive per-game views from the same exported assets; never redraw SVGs here. */
export async function writeGalleryPages(
  output: string,
  manifest: ExportedAsset[],
  batch: readonly BatchCandidate[] = NEXT_BATCH,
) {
  const [css, roomCss, client] = await Promise.all([
    readFile(fromRoot('packages/workshop-tools/art/gallery/cabinet.css'), 'utf8'),
    readFile(fromRoot('src/games/cartographer/ui/styles.css'), 'utf8'),
    readFile(new URL('./client.ts', import.meta.url), 'utf8'),
  ]);
  const clientScript = ts.transpileModule(client, {
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
  }).outputText;
  const built = await build({
    configFile: false,
    logLevel: 'warn',
    build: {
      write: false,
      minify: true,
      lib: {
        entry: fromRoot('packages/workshop-tools/art/gallery/specimens.ts'),
        name: 'AssetSpecimens',
        formats: ['iife'],
      },
    },
  });
  const bundle = Array.isArray(built) && built.length === 1 ? built[0] : built;
  if (Array.isArray(bundle) || !('output' in bundle))
    throw new Error('Expected one browser specimen bundle');
  const specimenScript = bundle.output.find((item) => item.type === 'chunk')?.code;
  if (!specimenScript) throw new Error('Missing browser specimen bundle');
  await mkdir(resolve(output, 'evidence'));
  for (const upgrade of RECENT_UPGRADES)
    await copyFile(
      fromRoot(upgrade.image),
      resolve(output, 'evidence', `${upgrade.id}-${basename(upgrade.image)}`),
    );
  const trials = batch.filter((candidate) => candidate.trial);
  const records = new Map<string, string>();
  if (trials.length) {
    await mkdir(resolve(output, 'candidates'));
    for (const candidate of trials)
      await copyFile(
        fromRoot(candidate.trial!.file),
        resolve(output, 'candidates', `${candidate.id}.svg`),
      );
    for (const candidate of trials) {
      const record = candidate.trial!.record;
      if (records.has(record)) continue;
      const file = `candidates/${candidate.id}.md`;
      await copyFile(fromRoot(record), resolve(output, file));
      records.set(record, file);
    }
  }
  const assets = new Map(manifest.map((asset) => [asset.id, asset]));
  const gameCount = new Set(
    manifest.map((asset) => assetCollection(asset.id)).filter((game) => game !== 'shared'),
  ).size;
  for (const game of [
    null,
    ...GAME_COLLECTIONS,
    {
      id: 'shared',
      name: 'Shared artwork',
      scope: 'Primitives, guides, workshop objects and challenge art.',
    },
  ] as const) {
    const selected = game
      ? manifest.filter((asset) => assetCollection(asset.id) === game.id)
      : manifest;
    const upgrades = (
      game ? RECENT_UPGRADES.filter((upgrade) => upgrade.game === game.id) : RECENT_UPGRADES
    ).toSorted((a, b) => b.date.localeCompare(a.date));
    const candidates = game ? batch.filter((candidate) => candidate.game === game.id) : batch;
    const id = game?.id ?? 'all';
    const navigation = `<nav class="game-nav" aria-label="Game galleries"><a href="index.html"${id === 'all' ? ' aria-current="page"' : ''}>All SVGs</a>${[...GAME_COLLECTIONS, { id: 'shared', name: 'Shared artwork' }].map((item) => `<a href="${item.id}.html"${id === item.id ? ' aria-current="page"' : ''}>${item.name}</a>`).join('')}</nav>`;
    const upgradeView = upgrades.length
      ? `<div class="reviews">${upgrades.map((upgrade) => `<article class="review"><div><time datetime="${upgrade.date}">${upgrade.date}</time><h3>${escape(upgrade.title)}</h3><p>${escape(upgrade.summary)}</p><p>Retained comparison · ${upgrade.revision}</p><a href="${sourceLink(upgrade.record, upgrade.recordRevision ?? upgrade.revision)}">Original review record</a></div><a href="evidence/${upgrade.id}-${basename(upgrade.image)}"><img src="evidence/${upgrade.id}-${basename(upgrade.image)}" alt="Retained ${escape(upgrade.title)} review" loading="lazy"></a></article>`).join('')}</div>`
      : '<p class="empty">No dated 2D upgrade is curated here yet. This does not mean the game has no art changes.</p>';
    const hasSpecimens =
      game &&
      game.id !== 'shared' &&
      ['emberwake', 'cartographer', 'night-passage', 'scrapyard'].includes(game.id);
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${game?.name ?? 'All SVGs'} · Asset gallery</title><style>${roomCss}\n${css}</style></head><body>${navigation}<header><div><span class="eyebrow">CARD WORKSHOP / ASSET GALLERY</span><h1>${game?.name ?? 'Small pieces. Whole worlds.'}</h1><p>${game?.scope ?? 'Original vector artwork composed from the live game renderers.'}</p></div><p>${selected.length} SVG assets${game ? '' : ` · ${gameCount} SVG game collections · ${GAME_COLLECTIONS.length} game galleries`}</p></header><nav class="view-nav" aria-label="Gallery views"><a href="#current" data-view="current" aria-current="page">Current assets</a><a href="#upgrades" data-view="upgrades">Recent upgrades (${upgrades.length})</a><a href="#candidates" data-view="candidates">Next batch (${candidates.length})</a></nav><main><section id="current" data-panel><h2>Current assets</h2><p class="scope">Current source renderers. This is an on-demand snapshot; rebuild it after source changes. Open an SVG for its full-size source.</p>${selected.length ? filters(selected) : '<p class="empty">This game uses Canvas presentation rather than a standalone SVG collection. Current renderer specimens appear below.</p>'}${hasSpecimens ? specimens(game.id) : ''}</section><section id="upgrades" data-panel hidden><h2>Recent upgrades</h2><p class="scope">Dated review evidence is retained separately from current source previews. Review scope and remaining limits belong to each original record.</p><p><a href="reviews/index.html">Historical feedback comparisons</a> · Matched views and dated review history.</p>${upgradeView}</section><section id="candidates" data-panel hidden><h2>Next batch</h2><p class="scope">Curated proposals based on existing art and review records. Review first, select a bounded batch, then generate candidates. Browsing this gallery makes no API requests.</p>${candidates.length ? `<div class="batch">${candidates.map((candidate) => candidateCard(candidate, assets, records)).join('')}</div>` : '<p class="empty">No next batch is proposed for this collection.</p>'}</section></main><footer><a href="manifest.json">Current SVG manifest</a> · Same renderers as the games · Static export, no polling, saves or network requests.${trials.length ? ' Generated candidates are separate from active game art.' : ''}</footer><script type="module">${inlineScript(clientScript)}</script>${hasSpecimens ? `<script>${inlineScript(specimenScript)}</script>` : ''}</body></html>`;
    await writeFile(resolve(output, game ? `${game.id}.html` : 'index.html'), html, { flag: 'wx' });
  }
}
