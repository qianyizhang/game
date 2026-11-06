import react from '@vitejs/plugin-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fromRoot, withBundle } from '../../../io.ts';
import { FEEDBACK_CAPTURES, FEEDBACK_STYLES } from '../library.ts';

/** A deliberately small, offline review surface. Only the named public-safe captures enter it. */
export async function writeReviews(output: string) {
  await mkdir(output);
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
    readFile(fromRoot(FEEDBACK_CAPTURES.combat.before)),
    readFile(fromRoot(FEEDBACK_CAPTURES.combat.after)),
    readFile(fromRoot(FEEDBACK_CAPTURES.score.before)),
    readFile(fromRoot(FEEDBACK_CAPTURES.score.after)),
    readFile(fromRoot(FEEDBACK_CAPTURES.shield.before)),
    readFile(fromRoot(FEEDBACK_CAPTURES.shield.after)),
    readFile(fromRoot(FEEDBACK_CAPTURES.cartographer.before)),
    readFile(fromRoot(FEEDBACK_CAPTURES.cartographer.after)),
    readFile(fromRoot(FEEDBACK_CAPTURES.cartographer.threatBefore)),
    readFile(fromRoot(FEEDBACK_CAPTURES.cartographer.threatAfter)),
    readFile(fromRoot(FEEDBACK_STYLES[0]), 'utf8'),
    readFile(fromRoot(FEEDBACK_STYLES[1]), 'utf8'),
    readFile(fromRoot(FEEDBACK_STYLES[2]), 'utf8'),
    readFile(fromRoot(FEEDBACK_STYLES[3]), 'utf8'),
    readFile(fromRoot(FEEDBACK_STYLES[4]), 'utf8'),
    readFile(fromRoot('packages/workshop-tools/art/gallery/reviews/CHANGELOG.json'), 'utf8'),
  ]);
  await withBundle<typeof import('./ReviewGallery'), void>(
    'packages/workshop-tools/art/gallery/reviews/ReviewGallery.tsx',
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
  const [beforeScene, afterScene, beforeZoom, afterZoom] = await Promise.all(
    Object.values(FEEDBACK_CAPTURES.emberwake).map((path) => readFile(fromRoot(path))),
  );
  await withBundle<typeof import('./EmberwakeReview'), void>(
    'packages/workshop-tools/art/gallery/reviews/EmberwakeReview.tsx',
    async ({ EmberwakeReview }) => {
      const data = (image: Buffer) => `data:image/webp;base64,${image.toString('base64')}`;
      const body = renderToStaticMarkup(
        createElement(EmberwakeReview, {
          evidence: {
            beforeScene: data(beforeScene),
            afterScene: data(afterScene),
            beforeZoom: data(beforeZoom),
            afterZoom: data(afterZoom),
          },
        }),
      );
      const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Emberwake silhouettes · Asset Fieldnotes</title><style>${galleryCss}</style></head><body>${body}</body></html>\n`;
      if (Buffer.byteLength(html) > 600 * 1024)
        throw new Error('Emberwake gallery exceeds 600 KiB budget');
      await writeFile(resolve(output, 'emberwake.html'), html, { flag: 'wx' });
    },
    [react()],
  );
}
