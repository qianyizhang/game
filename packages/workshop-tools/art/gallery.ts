import react from '@vitejs/plugin-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { freshDirectory, fromRoot, newOutput, withBundle, reportFailure } from '../io.ts';

/** A deliberately small, offline review surface. Only the named public-safe captures enter it. */
export async function exportGallery(output = newOutput('asset-gallery')) {
  output = fromRoot(output);
  await freshDirectory(output);
  const capture = fromRoot('docs/art/assets/spire-intent');
  const [
    before,
    after,
    scoreBefore,
    scoreAfter,
    shieldBefore,
    shieldAfter,
    mapBefore,
    mapAfter,
    threatBefore,
    threatAfter,
    galleryCss,
    cueCss,
    scoreCss,
    shieldCss,
    mapCss,
    changelog,
  ] = await Promise.all([
    readFile(resolve(capture, 'before-battlefield.webp')),
    readFile(resolve(capture, 'after-battlefield.webp')),
    readFile(fromRoot('docs/art/assets/blindside-score/before-score.webp')),
    readFile(fromRoot('docs/art/assets/blindside-score/after-score.webp')),
    readFile(fromRoot('docs/art/assets/hearth-shield/before-unit.webp')),
    readFile(fromRoot('docs/art/assets/hearth-shield/after-unit.webp')),
    readFile(fromRoot('docs/art/assets/cartographer-map/before-board.webp')),
    readFile(fromRoot('docs/art/assets/cartographer-map/after-board.webp')),
    readFile(fromRoot('docs/art/assets/cartographer-map/before-threat.webp')),
    readFile(fromRoot('docs/art/assets/cartographer-map/after-threat.webp')),
    readFile(fromRoot('src/asset-gallery/gallery.css'), 'utf8'),
    readFile(fromRoot('src/games/spire/ui/IntentCue.css'), 'utf8'),
    readFile(fromRoot('src/games/balatro/ui/ScoreFeedback.css'), 'utf8'),
    readFile(fromRoot('src/games/battlegrounds/ui/ShieldFeedback.css'), 'utf8'),
    readFile(fromRoot('src/games/cartographer/ui/MapCues.css'), 'utf8'),
    readFile(fromRoot('src/asset-gallery/CHANGELOG.json'), 'utf8'),
  ]);
  await withBundle<typeof import('../../../src/asset-gallery/ReviewGallery'), void>(
    'src/asset-gallery/ReviewGallery.tsx',
    async ({ ReviewGallery }) => {
      const body = renderToStaticMarkup(
        createElement(ReviewGallery, {
          evidence: {
            before: `data:image/webp;base64,${before.toString('base64')}`,
            after: `data:image/webp;base64,${after.toString('base64')}`,
            screenshotBytes: before.length + after.length,
            score: {
              before: `data:image/webp;base64,${scoreBefore.toString('base64')}`,
              after: `data:image/webp;base64,${scoreAfter.toString('base64')}`,
              screenshotBytes: scoreBefore.length + scoreAfter.length,
            },
            shield: {
              before: `data:image/webp;base64,${shieldBefore.toString('base64')}`,
              after: `data:image/webp;base64,${shieldAfter.toString('base64')}`,
              screenshotBytes: shieldBefore.length + shieldAfter.length,
            },
            cartographer: {
              before: `data:image/webp;base64,${mapBefore.toString('base64')}`,
              after: `data:image/webp;base64,${mapAfter.toString('base64')}`,
              threatBefore: `data:image/webp;base64,${threatBefore.toString('base64')}`,
              threatAfter: `data:image/webp;base64,${threatAfter.toString('base64')}`,
              screenshotBytes:
                mapBefore.length + mapAfter.length + threatBefore.length + threatAfter.length,
            },
          },
        }),
      );
      const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Asset Fieldnotes · Game feedback studies</title><style>${galleryCss}\n${cueCss}\n${scoreCss}\n${shieldCss}\n${mapCss}</style></head><body>${body}</body></html>\n`;
      const bytes = Buffer.byteLength(html);
      if (bytes > 600 * 1024) throw new Error(`Gallery exceeds 600 KiB budget: ${bytes} bytes`);
      await writeFile(resolve(output, 'index.html'), html, { flag: 'wx' });
      await writeFile(resolve(output, 'CHANGELOG.json'), changelog, { flag: 'wx' });
      console.log(
        `Gallery: ${resolve(output, 'index.html')}\n${bytes} bytes; zero JavaScript or external asset requests.`,
      );
    },
    [react()],
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args[0] === '--help') console.log('Usage: npm run assets:gallery -- [new-output-directory]');
  else if (args.length > 1) {
    console.error('Expected at most one fresh output directory');
    process.exitCode = 1;
  } else await exportGallery(args[0]).catch(reportFailure);
}
