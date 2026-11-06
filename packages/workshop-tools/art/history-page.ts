import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { currentArtwork } from './history.ts';
import { historyState } from './history-store.ts';
import type { HistoryState } from './history-types.ts';

export function historyHtml(state?: HistoryState) {
  const script = ts
    .transpileModule(readFileSync(new URL('./history-client.ts', import.meta.url), 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
    })
    .outputText.replace(/<\/script/gi, '<\\/script');
  const css =
    readFileSync(new URL('./gallery/cabinet.css', import.meta.url), 'utf8') +
    readFileSync(new URL('./history.css', import.meta.url), 'utf8');
  const initial = JSON.stringify(state ?? null).replaceAll('<', '\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Asset history · Card Workshop</title><style>${css}</style></head><body><header><div><span class="eyebrow">CARD WORKSHOP / ASSET GALLERY</span><h1>Asset history</h1><p id="mode">Loading artwork…</p></div><a href="${state && !state.live ? 'index.html' : '/'}">${state && !state.live ? 'Return to gallery' : 'Return to game'}</a></header><button id="reload">Reload history</button><p id="status" role="status" tabindex="-1"></p><div class="history-layout"><aside><details id="browse" open><summary>Browse assets</summary><label>Find an asset<input id="find" type="search" placeholder="Cub, voucher, intent…"></label><label>Collection<select id="collection"><option value="">All collections</option></select></label><p id="asset-count"></p><nav id="assets" aria-label="Artwork"></nav></details><details><summary>Generation and authoring attempts</summary><div id="failures"></div></details></aside><main id="detail"><h2>Choose an asset</h2></main></div><dialog id="remove-dialog"><h2>Remove revision?</h2><div id="remove-plan"></div><button id="confirm-remove">Remove revision</button> <button id="cancel-remove">Cancel</button></dialog><script type="application/json" id="history-state">${initial}</script><script type="module">${script}</script></body></html>`;
}

export async function exportHistoryPage(root: string, output: string) {
  writeFileSync(
    resolve(output, 'history.html'),
    historyHtml(historyState(root, false, await currentArtwork())),
    {
      flag: 'wx',
    },
  );
}
