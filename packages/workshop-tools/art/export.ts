import react from '@vitejs/plugin-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeCabinet, type ExportedAsset } from './cabinet-pages.ts';
import { assetCollection } from '../../../src/asset-gallery/library.ts';
import { freshDirectory, fromRoot, newOutput, withBundle, reportFailure } from '../io.ts';

export async function exportArt(outputDir = newOutput('card-art')) {
  outputDir = fromRoot(outputDir);
  await freshDirectory(outputDir);
  return withBundle<typeof import('./catalogue'), void>(
    'packages/workshop-tools/art/catalogue.tsx',
    async ({ cardArtCatalogue }) => {
      const assets = cardArtCatalogue();
      const escape = (value: string) =>
        String(value).replace(
          /[&<>"']/g,
          (char) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
        );
      const manifest: ExportedAsset[] = [];
      for (const { id, group, name, node } of assets) {
        const file = `${id}.svg`;
        const path = resolve(outputDir, file);
        const local = relative(outputDir, path);
        if (!local || local === '..' || local.startsWith('..' + sep))
          throw new Error(`Asset escaped output: ${id}`);
        let svg = renderToStaticMarkup(node);
        if (!svg.startsWith('<svg')) throw new Error(`Expected an SVG root: ${id}`);
        // Resolve scene variables so standalone assets work in vector editors and rasterizers too.
        const variables = Object.fromEntries(
          [...svg.matchAll(/(--[\w-]+):([^;"}]+)/g)].map((match) => [match[1], match[2]]),
        );
        svg = svg.replace(
          /var\((--[\w-]+)(?:,\s*([^)]+))?\)/g,
          (_: string, name: string, fallback: string | undefined) =>
            variables[name] ?? fallback ?? 'currentColor',
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
        await writeFile(path, svg + '\n', { flag: 'wx' });
        manifest.push({ id, name, group, file, width: Number(box[1]), height: Number(box[2]) });
      }
      await writeFile(
        resolve(outputDir, 'manifest.json'),
        JSON.stringify(
          manifest.map((asset) => ({ ...asset, game: assetCollection(asset.id) })),
          null,
          2,
        ) + '\n',
      );
      await writeCabinet(outputDir, manifest);
      console.log(
        `Exported ${manifest.length} SVG assets to ${outputDir}\nGallery: ${resolve(outputDir, 'index.html')}`,
      );
    },
    [react()],
  );
}
export async function runCli(args: string[]) {
  if (args[0] === '--help') {
    console.log(
      'Usage: npm run assets:export -- [new-output-directory]. Relative paths resolve from the repository; default is a fresh card-art run.',
    );
    return;
  }
  if (args.length > 1) throw new Error('Expected at most one fresh output directory');
  await exportArt(args[0] ? fromRoot(args[0]) : undefined);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runCli(process.argv.slice(2)).catch(reportFailure);
