import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { fromRoot, reportFailure } from '../io.ts';
import { objectValue, caseSpec, text } from './contracts.ts';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { withRecruitmentRuntime, sha256 } from './recruitment-runtime.ts';

export async function runCli(args: string[]) {
  const [replayPath, receiptPath, output, ...extra] = args;
  if (!replayPath || !receiptPath || !output || extra.length)
    throw new Error(
      'Usage: node packages/workshop-tools/hearth/recruitment-inspect.ts <replay.json> <receipt.json> <new.html>',
    );
  await withRecruitmentRuntime(async ({ runtime, bundleDigest }) => {
    const raw = await readFile(fromRoot(replayPath), 'utf8');
    const receiptBytes = await readFile(fromRoot(receiptPath), 'utf8');
    const receipt = objectValue(JSON.parse(receiptBytes));
    if (sha256(raw.trimEnd()) !== receipt.replayDigest)
      throw new Error('Replay/receipt digest mismatch.');
    const data = {
      ...runtime.inspectRecruitment(raw, caseSpec(receipt.spec, runtime)),
      provenance: {
        replayDigest: text(receipt.replayDigest),
        receiptDigest: sha256(receiptBytes),
        inspectorBundleDigest: bundleDigest,
      },
    };
    const template = await readFile(new URL('./recruitment-viewer.html', import.meta.url), 'utf8');
    const runtimeScript = ts.transpileModule(
      await readFile(new URL('./recruitment-viewer.ts', import.meta.url), 'utf8'),
      { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } },
    ).outputText;
    await writeFile(
      fromRoot(output),
      template
        .replace('/* INSPECTION_RUNTIME */', () => runtimeScript)
        .replace('/* INSPECTION_DATA */ null', () =>
          JSON.stringify(data).replaceAll('<', '\\u003c'),
        ),
      { flag: 'wx' },
    );
    console.log(
      JSON.stringify({
        output: fromRoot(output),
        focalDecisions: data.steps.length,
        placement: data.placement,
      }),
    );
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runCli(process.argv.slice(2)).catch(reportFailure);
