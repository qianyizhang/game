import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { withRecruitmentRuntime, sha256 } from './hearth-recruitment-runtime.mjs';

const [replayPath, receiptPath, output, ...extra] = process.argv.slice(2);
if (!replayPath || !receiptPath || !output || extra.length)
  throw new Error(
    'Usage: node scripts/hearth-recruitment-inspect.mjs <replay.json> <receipt.json> <new.html>',
  );
await withRecruitmentRuntime(async ({ runtime, bundleDigest }) => {
  const raw = await readFile(replayPath, 'utf8');
  const receiptBytes = await readFile(receiptPath, 'utf8');
  const receipt = JSON.parse(receiptBytes);
  if (sha256(raw.trimEnd()) !== receipt.replayDigest)
    throw new Error('Replay/receipt digest mismatch.');
  const data = {
    ...runtime.inspectRecruitment(raw, receipt.spec),
    provenance: {
      replayDigest: receipt.replayDigest,
      receiptDigest: sha256(receiptBytes),
      inspectorBundleDigest: bundleDigest,
    },
  };
  const template = await readFile(
    new URL('./hearth-recruitment-viewer.html', import.meta.url),
    'utf8',
  );
  await writeFile(
    resolve(output),
    template.replace('/* INSPECTION_DATA */ null', JSON.stringify(data).replaceAll('<', '\\u003c')),
    { flag: 'wx' },
  );
  console.log(
    JSON.stringify({
      output: resolve(output),
      focalDecisions: data.steps.length,
      placement: data.placement,
    }),
  );
});
