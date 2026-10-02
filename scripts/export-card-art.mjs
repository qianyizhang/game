import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// A build needs no browser or listening server; exported SVGs also work offline.
const bundleRoot = resolve('test-results/art-export');
await mkdir(bundleRoot, { recursive: true });
const bundleDir = await mkdtemp(resolve(bundleRoot, 'bundle-'));
const outputDir = resolve(process.argv[2] ?? 'test-results/card-art');
try {
  await build({
    configFile: false,
    plugins: [react()],
    logLevel: 'warn',
    build: {
      ssr: 'scripts/card-art-catalogue.tsx',
      outDir: bundleDir,
      emptyOutDir: false,
      rollupOptions: { output: { entryFileNames: 'catalogue.mjs' } },
    },
  });
  const { cardArtCatalogue } = await import(
    pathToFileURL(resolve(bundleDir, 'catalogue.mjs')).href
  );
  const assets = cardArtCatalogue();
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
    );
  const manifest = [];
  for (const { id, group, name, node } of assets) {
    const file = `${id}.svg`;
    const path = resolve(outputDir, file);
    let svg = renderToStaticMarkup(node);
    if (!svg.startsWith('<svg')) throw new Error(`Expected an SVG root: ${id}`);
    // Resolve scene variables so standalone assets work in vector editors and rasterizers too.
    const variables = Object.fromEntries(
      [...svg.matchAll(/(--[\w-]+):([^;"}]+)/g)].map((match) => [match[1], match[2]]),
    );
    svg = svg.replace(
      /var\((--[\w-]+)(?:,\s*([^)]+))?\)/g,
      (_, name, fallback) => variables[name] ?? fallback ?? 'currentColor',
    );
    svg = svg
      .replace('aria-hidden="true"', '')
      .replace(
        '<svg',
        `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escape(name)}"`,
      );
    // Set the intrinsic dimensions from viewBox for tools which do not use CSS sizing.
    const box = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    if (!box) throw new Error(`Expected a sized SVG viewBox: ${id}`);
    svg = svg.replace('<svg', `<svg width="${box[1]}" height="${box[2]}"`);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, svg + '\n');
    manifest.push({ id, name, group, file, width: Number(box[1]), height: Number(box[2]) });
  }
  const groups = [...new Set(manifest.map((asset) => asset.group))];
  const glyphCount = manifest.filter((asset) => asset.group === 'Shared · Primitives').length;
  const cards = manifest
    .map(
      (asset) =>
        `<a class="asset" data-group="${escape(asset.group)}" data-name="${escape(asset.name.toLowerCase())}" href="${escape(asset.file)}" target="_blank" rel="noopener"><div class="picture"><img src="${escape(asset.file)}" alt="${escape(asset.name)}" loading="lazy" width="${asset.width}" height="${asset.height}"></div><span>${escape(asset.name)}</span><small>${escape(asset.group)}</small></a>`,
    )
    .join('\n');
  await writeFile(resolve(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(
    resolve(outputDir, 'index.html'),
    `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Card Workshop · SVG cabinet</title>
<style>
:root{font-family:Inter,system-ui,sans-serif;color:#efe8d3;background:#122c28;color-scheme:dark}*{box-sizing:border-box}body{max-width:1500px;margin:auto;padding:40px 36px}header{display:flex;gap:30px;align-items:flex-end;justify-content:space-between;border-bottom:1px solid #456154;padding-bottom:24px;margin-bottom:24px}h1{font-family:Georgia,serif;font-weight:400;font-size:44px;margin:8px 0}p{color:#acbdab;margin:0;line-height:1.6}.eyebrow{font-size:11px;letter-spacing:.2em;color:#efc47b}label{font-size:12px;display:flex;flex-direction:column;gap:8px}input,select{font:inherit;background:#1d3b33;color:#eee7d4;border:1px solid #6e7b5c;border-radius:5px;padding:12px;max-width:100%}.filters{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:26px}#count{align-self:end;padding:12px;color:#e7bf7b;font-size:13px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:20px}.asset{display:block;text-decoration:none;color:inherit;padding:8px 8px 12px;background:#1b352f;border:1px solid #3c5548;border-radius:9px;transition:transform .15s}.asset:hover{transform:translateY(-3px);border-color:#e6bd70}.asset:focus-visible{outline:3px solid #efc47b;outline-offset:3px}.picture{height:126px;display:grid;place-items:center;margin-bottom:12px}.picture img{display:block;width:100%;height:100%;object-fit:contain}.asset span{font-size:13px;display:block}.asset small{display:block;font-size:10px;color:#a1b49e;margin-top:6px}.asset[hidden]{display:none}footer{margin-top:36px;padding-top:20px;border-top:1px solid #456154;font-size:12px;color:#a1b49e}footer a{color:#efc47b}@media(max-width:600px){body{padding:24px 16px}header{display:block}h1{font-size:36px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.picture{height:112px}}
</style>
<header><div><span class="eyebrow">CARD WORKSHOP / THE SVG CABINET</span><h1>Small pieces. Whole worlds.</h1><p>Original vector artwork composed from reusable shapes.<br>Open any illustration to view or save its standalone SVG.</p></div><p>${manifest.length} SVG assets · 3 games · ${glyphCount} shared glyphs</p></header>
<div class="filters"><label><span id="collection-label">Collection</span><select id="group" aria-labelledby="collection-label"><option value="">All collections</option>${groups.map((group) => `<option>${escape(group)}</option>`).join('')}</select></label><label>Find an illustration<input id="search" type="search" placeholder="Sword, Strike, Heartwood…"></label><output id="count" aria-live="polite"></output></div>
<main class="grid">${cards}</main><p id="empty" hidden>No illustrations match. Try another name or collection.</p><footer>Generated from the same components used in the games. <a href="manifest.json">Asset manifest</a> · No external fonts, images or network requests.</footer>
<script>const group=document.querySelector('#group'),search=document.querySelector('#search'),count=document.querySelector('#count'),empty=document.querySelector('#empty'),cards=[...document.querySelectorAll('.asset')];function filter(){let visible=0;for(const card of cards){card.hidden=!!((group.value&&group.value!==card.dataset.group)||!card.dataset.name.includes(search.value.trim().toLowerCase()));if(!card.hidden)visible++}count.value=visible+' illustrations';empty.hidden=visible!==0;}group.addEventListener('change',filter);search.addEventListener('input',filter);filter();</script></html>`,
  );
  console.log(
    `Exported ${manifest.length} SVG assets to ${outputDir}\nGallery: ${resolve(outputDir, 'index.html')}`,
  );
} finally {
  await rm(bundleDir, { recursive: true, force: true });
}
