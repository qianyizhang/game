import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import type { ReviewDocument } from './src/model/contracts.ts';
let bundle: Promise<{ js: string; css: string }> | undefined;
/** The same Vite entry powers development and self-contained exports. No runtime CDN. */
function assets() {
  return (bundle ??= (async () => {
    const result = await build({
      configFile: fileURLToPath(new URL('vite.config.ts', import.meta.url)),
      logLevel: 'error',
      build: { write: false },
    });
    const outputs = (Array.isArray(result) ? result : [result]).flatMap((result) => {
      if (!('output' in result)) throw new Error('Unexpected review build result');
      return result.output;
    });
    const entry = outputs.find((item) => item.type === 'chunk' && item.isEntry);
    if (!entry || entry.type !== 'chunk') throw new Error('Missing review entry');
    const css = outputs
      .filter((item) => item.type === 'asset' && item.fileName.endsWith('.css'))
      .map((item) => (item.type === 'asset' ? String(item.source) : ''))
      .join('\n');
    return { js: entry.code.replace(/<(?=\/?script\b)/gi, '\\x3c'), css };
  })());
}
export async function renderReview(document: ReviewDocument): Promise<string> {
  const { js, css } = await assets();
  const data = gzipSync(JSON.stringify(document)).toString('base64');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Session review</title><style>${css}</style></head><body><div id="root"></div><script id="trace-data" type="application/octet-stream">${data}</script><script type="module">${js}</script></body></html>`;
}
