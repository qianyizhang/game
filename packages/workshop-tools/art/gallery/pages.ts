import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { build } from 'vite';
import ts from 'typescript';
import { fromRoot } from '../../io.ts';
import {
  assetCollection,
  GAME_COLLECTIONS,
  NEXT_BATCH,
  RECENT_UPGRADES,
  WIP_BATCHES,
  type CollectionId,
  type BatchCandidate,
  type BatchProposal,
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

type Images = ReadonlyMap<string, string>;
function imageSource(images: Images, file: string) {
  const source = images.get(file);
  if (!source) throw new Error(`Gallery image is not registered: ${file}`);
  return source;
}

function assetCard(asset: ExportedAsset, images: Images) {
  return `<a class="asset" data-group="${escape(asset.group)}" data-name="${escape(asset.name.toLowerCase())}" href="${escape(asset.file)}" target="_blank" rel="noopener"><div class="picture"><img src="${imageSource(images, asset.file)}" alt="${escape(asset.name)}" loading="lazy" width="${asset.width}" height="${asset.height}"></div><span>${escape(asset.name)}</span><small>${escape(asset.group)}</small><small>${asset.width} × ${asset.height} · Open SVG</small></a>`;
}

function filters(assets: ExportedAsset[], images: Images) {
  const groups = [...new Set(assets.map((asset) => asset.group))];
  return `<div class="filters"><label><span id="collection-label">Collection</span><select id="group" aria-labelledby="collection-label"><option value="">All collections</option>${groups.map((group) => `<option>${escape(group)}</option>`).join('')}</select></label><label>Find an illustration<input id="search" type="search" placeholder="Sword, Strike, Heartwood…"></label><output id="count" aria-live="polite"></output></div><div class="grid">${assets.map((asset) => assetCard(asset, images)).join('\n')}</div><p id="empty" hidden>No illustrations match. Try another name or collection.</p>`;
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
  images: Images,
) {
  const current = candidate.current.map((id) => {
    const asset = assets.get(id);
    if (!asset) throw new Error(`Candidate references missing asset: ${id}`);
    return asset;
  });
  const trial = candidate.trial ? `candidates/${candidate.id}.svg` : null;
  const installed = candidate.status === 'Installed';
  const figure = (file: string, label: string) =>
    `<figure><figcaption>${escape(label)}</figcaption><div class="art-stage"><img src="${imageSource(images, file)}" alt="${escape(candidate.title)} · ${escape(label)}" loading="lazy" width="160" height="112"></div><div class="compact"><img src="${imageSource(images, file)}" alt="" loading="lazy" width="80" height="56"><small>Compact · 80 × 56</small></div></figure>`;
  return `<article class="candidate" id="candidate-${candidate.id}"><span class="status">${installed ? 'Installed · earlier trial retained' : trial ? 'Earlier SVG trial · awaiting acceptance' : candidate.status}</span><h3>${escape(candidate.title)}</h3><p>${escape(candidate.reason)}</p><p><strong>${installed ? 'Selected direction' : 'Proposed direction'}:</strong> ${escape(candidate.brief)}</p>${current.length || trial ? `<div class="comparisons">${current.map((asset) => figure(asset.file, asset.id.endsWith('-golden') ? 'Current Golden' : asset.id.endsWith('-upgraded') ? 'Current upgrade' : 'Current base')).join('')}${trial ? figure(trial, installed ? 'Earlier individual trial' : 'Image 2.6 candidate') : ''}</div><details><summary>Enlarged comparison and SVG sources</summary><div class="enlarged">${current.map((asset) => `<figure><figcaption>${escape(asset.name)}</figcaption><a href="${asset.file}"><img src="${imageSource(images, asset.file)}" alt="${escape(asset.name)} enlarged" loading="lazy"></a></figure>`).join('')}${trial ? `<figure><figcaption>Earlier candidate · retained source</figcaption><a href="${trial}"><img src="${imageSource(images, trial)}" alt="${escape(candidate.title)} candidate enlarged" loading="lazy"></a></figure>` : ''}</div></details>` : ''}${trial ? `<p>${installed ? 'Selected packed scenes supply the current base and upgrade. This earlier individual trial remains preserved.' : 'This trial proposes one base illustration. A distinct upgrade still needs review.'} <a href="${escape(records.get(candidate.trial!.record)!)}">Prompt, usage and generation record</a>.</p>` : candidate.status === 'SVG trial' ? '<p>Generated candidates and any unavailable results are shown in this batch’s results above; acceptance is pending.</p>' : '<p>No generation dispatched for this proposal.</p>'}</article>`;
}

function proposalCard(
  proposal: BatchProposal,
  records: ReadonlyMap<string, string>,
  candidates: ReadonlyMap<string, BatchCandidate>,
  assets: ReadonlyMap<string, ExportedAsset>,
  images: Images,
) {
  const current = proposal.candidates.flatMap((id) => {
    const candidate = candidates.get(id)!;
    const asset = assets.get(candidate.current[0]);
    return asset ? [{ candidate, asset }] : [];
  });
  const previews = current
    .map(
      ({ candidate, asset }) =>
        `<figure><figcaption>${escape(candidate.title)}</figcaption><img src="${imageSource(images, asset.file)}" alt="${escape(candidate.title)} current artwork" width="160" height="112"></figure>`,
    )
    .join('');
  return `<article class="batch-proposal" id="batch-${proposal.id}"><span class="status">${escape(proposal.state ?? 'Proposed · awaiting agreement')}</span><h3>${escape(proposal.title)}</h3><p>${escape(proposal.reason)}</p><div class="batch-current">${previews}</div><p><strong>Deliverables:</strong> ${escape(proposal.deliverables)}</p><p><strong>Shared reference:</strong> ${escape(proposal.reference)}</p><p><strong>Request plan:</strong> ${proposal.requests.map((request) => request.format).join(' + ')}.</p>${proposal.study ? studyCard(proposal, images) : ''}<details><summary>Request plan and acceptance checks</summary><div class="request-plan">${proposal.requests.map((request) => `<div><h4>One ${request.format} request</h4><p>${escape(request.plan)}</p></div>`).join('')}</div><p class="approval-note">${escape(proposal.stop)}</p><ul>${proposal.acceptance.map((check) => `<li>${escape(check)}</li>`).join('')}</ul><p><a href="${escape(records.get(proposal.record)!)}">Full proposal and preservation record</a></p></details><p class="retention-note">Intermediate artwork and prompts are preserved for future sessions. Accepted batches inform the art skill for later work.</p></article>`;
}

function studyFile(proposal: BatchProposal, source: string) {
  return `batches/${proposal.id}/${basename(source)}`;
}

function studyCard(proposal: BatchProposal, images: Images) {
  const study = proposal.study!;
  const source = (file: string) => imageSource(images, studyFile(proposal, file));
  const effect = study.effect;
  return `<section class="packed-study" aria-label="Packed batch results"><h3>Packed batch results</h3><p>${escape(study.summary)}</p><div class="packed-grid">${study.subjects.map((subject) => `<article><h4>${escape(subject.title)}</h4>${subject.tiers.map((tier) => (tier.unavailable !== undefined ? `<figure><figcaption>${escape(tier.label)}</figcaption><p class="unavailable-art">${escape(tier.unavailable)}</p></figure>` : `<figure><figcaption>${escape(tier.label)}</figcaption><div class="art-stage"><a href="${escape(studyFile(proposal, tier.file))}"><img src="${source(tier.file)}" alt="${escape(subject.title)} · ${escape(tier.label)}" width="160" height="112" loading="lazy"></a></div><div class="compact"><img src="${source(tier.file)}" alt="" width="80" height="56" loading="lazy"><small>Compact · 80 × 56</small></div></figure>`)).join('')}</article>`).join('')}</div><details><summary>${escape(study.sheetLabel ?? 'Full packed sheet')}</summary><a href="${escape(studyFile(proposal, study.sheet))}"><img class="packed-sheet" src="${source(study.sheet)}" alt="${escape(study.sheetLabel ?? 'Original packed artwork sheet')}" loading="lazy"></a></details>${effect ? `<figure class="play-effect" data-gif="${source(effect.file)}" data-still="${source(effect.still)}" data-duration="${effect.durationMs}"><figcaption>${escape(effect.title)}</figcaption><img src="${source(effect.still)}" alt="${escape(effect.title)}" width="320" height="224"><div><button type="button" data-play-effect>Play effect</button> <button type="button" data-stop-effect disabled>Show still</button></div><p role="status" data-effect-status>Still frame · play once to inspect the effect.</p></figure>` : ''}</section>`;
}

/** Derive per-game views from the same exported assets; never redraw SVGs here. */
export async function writeGalleryPages(
  output: string,
  manifest: ExportedAsset[],
  batch: readonly BatchCandidate[] = NEXT_BATCH,
  proposals: readonly BatchProposal[] = WIP_BATCHES,
) {
  const candidateById = new Map(batch.map((candidate) => [candidate.id, candidate]));
  for (const proposal of proposals)
    for (const id of proposal.candidates)
      if (!candidateById.has(id))
        throw new Error(`Batch proposal references missing candidate: ${id}`);
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
  if (proposals.length) {
    await mkdir(resolve(output, 'batches'));
    for (const proposal of proposals) {
      await mkdir(resolve(output, 'batches', proposal.id));
      if (!records.has(proposal.record)) {
        const file = `batches/${proposal.id}/README.md`;
        await copyFile(fromRoot(proposal.record), resolve(output, file));
        records.set(proposal.record, file);
      }
      if (proposal.study) {
        const study = proposal.study;
        for (const source of new Set([
          study.sheet,
          ...study.subjects.flatMap((subject) =>
            subject.tiers.flatMap((tier) => (tier.file ? [tier.file] : [])),
          ),
          ...(study.effect ? [study.effect.file, study.effect.still] : []),
          ...study.attachments,
        ]))
          await copyFile(fromRoot(source), resolve(output, studyFile(proposal, source)));
      }
    }
  }
  // Preview hosts may receive only this HTML, without access to sibling files.
  const imageFiles = new Set([
    ...manifest.map((asset) => asset.file),
    ...RECENT_UPGRADES.map((upgrade) => `evidence/${upgrade.id}-${basename(upgrade.image)}`),
    ...trials.map((candidate) => `candidates/${candidate.id}.svg`),
    ...proposals.flatMap((proposal) =>
      proposal.study
        ? [
            proposal.study.sheet,
            ...proposal.study.subjects.flatMap((subject) =>
              subject.tiers.flatMap((tier) => (tier.file ? [tier.file] : [])),
            ),
            ...(proposal.study.effect
              ? [proposal.study.effect.file, proposal.study.effect.still]
              : []),
          ].map((file) => studyFile(proposal, file))
        : [],
    ),
  ]);
  const mediaTypes: Record<string, string> = {
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
  };
  const images: Images = new Map(
    await Promise.all(
      [...imageFiles].map(async (file) => {
        const mediaType = mediaTypes[extname(file).toLowerCase()];
        if (!mediaType) throw new Error(`Unsupported gallery image format: ${file}`);
        const bytes = await readFile(resolve(output, file));
        return [file, `data:${mediaType};base64,${bytes.toString('base64')}`] as const;
      }),
    ),
  );
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
    const selectedProposals = (
      game ? proposals.filter((proposal) => proposal.game === game.id) : [...proposals]
    ).toSorted(
      (a, b) =>
        Number(a.state === 'Accepted · selected art installed') -
        Number(b.state === 'Accepted · selected art installed'),
    );
    const proposedIds = new Set(selectedProposals.flatMap((proposal) => proposal.candidates));
    const otherCandidates = candidates.filter((candidate) => !proposedIds.has(candidate.id));
    const renderCandidate = (candidate: BatchCandidate) =>
      candidateCard(candidate, assets, records, images);
    const wip = `${selectedProposals
      .map((proposal) => {
        const content = `${proposalCard(proposal, records, candidateById, assets, images)}${proposal.candidates.length ? `<h3>Current artwork and earlier trials</h3><div class="batch">${proposal.candidates.map((id) => renderCandidate(candidateById.get(id)!)).join('')}</div>` : ''}`;
        return proposal.archived
          ? `<details class="batch-history"><summary>History · ${escape(proposal.title)}</summary>${content}</details>`
          : content;
      })
      .join(
        '',
      )}${otherCandidates.length ? `<details class="other-candidates"${selectedProposals.length ? '' : ' open'}><summary>Other candidates (${otherCandidates.length}) · review first</summary><div class="batch">${otherCandidates.map(renderCandidate).join('')}</div></details>` : ''}${candidates.length || selectedProposals.length ? '' : '<p class="empty">No WIP batch is proposed for this collection.</p>'}`;
    const id = game?.id ?? 'all';
    const navigation = `<nav class="game-nav" aria-label="Game galleries"><a href="index.html"${id === 'all' ? ' aria-current="page"' : ''}>All SVGs</a>${[...GAME_COLLECTIONS, { id: 'shared', name: 'Shared artwork' }].map((item) => `<a href="${item.id}.html"${id === item.id ? ' aria-current="page"' : ''}>${item.name}</a>`).join('')}</nav>`;
    const upgradeView = upgrades.length
      ? `<div class="reviews">${upgrades.map((upgrade) => `<article class="review"><div><time datetime="${upgrade.date}">${upgrade.date}</time><h3>${escape(upgrade.title)}</h3><p>${escape(upgrade.summary)}</p><p>Retained comparison · ${upgrade.revision}</p><a href="${escape(records.get(upgrade.record) ?? sourceLink(upgrade.record, upgrade.recordRevision ?? upgrade.revision))}">Original review record</a></div><a href="evidence/${upgrade.id}-${basename(upgrade.image)}"><img src="${imageSource(images, `evidence/${upgrade.id}-${basename(upgrade.image)}`)}" alt="Retained ${escape(upgrade.title)} review" loading="lazy"></a></article>`).join('')}</div>`
      : '<p class="empty">No dated 2D upgrade is curated here yet. This does not mean the game has no art changes.</p>';
    const hasSpecimens =
      game &&
      game.id !== 'shared' &&
      ['emberwake', 'cartographer', 'night-passage', 'scrapyard'].includes(game.id);
    const renderPage = (initialView: 'current' | 'wip' = 'current') =>
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${game?.name ?? (initialView === 'wip' ? 'WIP' : 'All SVGs')} · Asset gallery</title><style>${roomCss}\n${css}</style></head><body data-initial-view="${initialView}">${navigation}<header><div><span class="eyebrow">CARD WORKSHOP / ASSET GALLERY</span><h1>${game?.name ?? (initialView === 'wip' ? 'WIP batches' : 'Small pieces. Whole worlds.')}</h1><p>${game?.scope ?? 'Original vector artwork composed from the live game renderers.'}</p></div><p>${selected.length} SVG assets${game ? '' : ` · ${gameCount} SVG game collections · ${GAME_COLLECTIONS.length} game galleries`}</p></header><nav class="view-nav" aria-label="Gallery views"><a href="#current" data-view="current"${initialView === 'current' ? ' aria-current="page"' : ''}>Current assets</a><a href="#upgrades" data-view="upgrades">Recent upgrades (${upgrades.length})</a><a href="#wip" data-view="wip"${initialView === 'wip' ? ' aria-current="page"' : ''}>WIP (${candidates.length})</a></nav><main><section id="current" data-panel${initialView === 'current' ? '' : ' hidden'}><h2>Current assets</h2><p class="scope">Current source renderers. This is an on-demand snapshot; rebuild it after source changes. Open an SVG for its full-size source.</p>${selected.length ? filters(selected, images) : '<p class="empty">This game uses Canvas presentation rather than a standalone SVG collection. Current renderer specimens appear below.</p>'}${hasSpecimens ? specimens(game.id) : ''}</section><section id="upgrades" data-panel hidden><h2>Recent upgrades</h2><p class="scope">Dated review evidence is retained separately from current source previews. Review scope and remaining limits belong to each original record.</p><p><a href="reviews/index.html">Historical feedback comparisons</a> · Matched views and dated review history.</p>${upgradeView}</section><section id="wip" data-panel${initialView === 'wip' ? '' : ' hidden'}><h2>WIP</h2><p class="scope">Agree on a batch before generation. Existing trials remain available for review; acceptance and runtime promotion are separate decisions.</p>${wip}</section></main><footer><a href="manifest.json">Current SVG manifest</a> · Same renderers as the games · Static export, no polling, saves or network requests.${trials.length ? ' Generated candidates are separate from active game art.' : ''}</footer><script type="module">${inlineScript(clientScript)}</script>${hasSpecimens ? `<script>${inlineScript(specimenScript)}</script>` : ''}</body></html>`;
    await writeFile(resolve(output, game ? `${game.id}.html` : 'index.html'), renderPage(), {
      flag: 'wx',
    });
    if (!game) await writeFile(resolve(output, 'wip.html'), renderPage('wip'), { flag: 'wx' });
  }
}
