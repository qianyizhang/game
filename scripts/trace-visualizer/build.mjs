import { readFile, writeFile, mkdir, readdir, copyFile, realpath } from 'node:fs/promises';
import { resolve, dirname, relative, basename, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { normalizeThread, scriptJSON } from './normalize.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(
    'node scripts/trace-visualizer/build.mjs [input-directory] [output-directory] [case-study.json]\nDefaults: test-results/trace-visualizer-input test-results/trace-visualizer scripts/trace-visualizer/case-study.json',
  );
  process.exit(0);
}
const input = resolve(args[0] ?? 'test-results/trace-visualizer-input');
const output = resolve(args[1] ?? 'test-results/trace-visualizer');
const spec = JSON.parse(
  await readFile(resolve(args[2] ?? resolve(here, 'case-study.json')), 'utf8'),
);
const hash = (data) => createHash('sha256').update(data).digest('hex');
await mkdir(resolve(output, 'assets'), { recursive: true });
const rootReal = await realpath(root);
async function ownedFile(path) {
  const full = await realpath(resolve(root, path));
  if (!full.startsWith(rootReal + sep))
    throw new Error(`Evidence must stay inside repository: ${path}`);
  return full;
}
const threads = [];
const inputs = [];
for (const item of spec.threads) {
  const raw = await readFile(resolve(input, item.id + '.json'));
  const thread = normalizeThread(JSON.parse(raw), item.role);
  if (thread.id !== item.id) throw new Error('Thread identity mismatch');
  threads.push({ ...thread, parent: item.parent });
  inputs.push({ threadId: item.id, sha256: hash(raw) });
}
const turns = threads.flatMap((t) => t.turns);
const media = [];
const mediaByPath = new Map();
async function attach(path) {
  const full = await ownedFile(path);
  if (mediaByPath.has(full)) return mediaByPath.get(full);
  const bytes = await readFile(full);
  const sha256 = hash(bytes);
  const url = `assets/${sha256.slice(0, 20)}${extname(full)}`;
  await copyFile(full, resolve(output, url));
  const record = { path: relative(root, full), url, sha256, bytes: bytes.length };
  media.push(record);
  mediaByPath.set(full, record);
  return record;
}
async function filesIn(directory) {
  const result = [];
  try {
    for (const e of await readdir(directory, { withFileTypes: true })) {
      if (e.isDirectory()) result.push(...(await filesIn(resolve(directory, e.name))));
      else if (e.isFile()) result.push(resolve(directory, e.name));
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  return result.sort();
}
const subjects = ['hydra', 'nightjar', 'spiral', 'vajra', 'phoenix', 'catalyst'];
const stages = [];
const previousSources = new Map();
for (const [index, stage] of spec.stages.entries()) {
  const turn = turns.find((t) => t.id === stage.turn);
  if (!turn) throw new Error(`Unknown turn for ${stage.title}`);
  const anchor = stage.anchor
    ? turn.events.find(
        (e) => ['message', 'request'].includes(e.kind) && e.text.includes(stage.anchor),
      )
    : turn.events.findLast((e) => e.kind === 'message');
  if (!anchor) throw new Error(`Missing evidence anchor: ${stage.title}`);
  const captures = [];
  const captureFiles = [];
  for (const folder of [...(stage.captures ?? []), stage.capture, stage.fallbackCapture].filter(
    Boolean,
  )) {
    captureFiles.push(...(await filesIn(resolve(root, 'test-results', folder))));
  }
  for (const subject of stage.captureSubjects ?? subjects)
    for (const angle of ['hero', 'side', 'back', 'large', 'roundtrip-live', 'roundtrip-exported']) {
      const names =
        angle === 'hero'
          ? [`${subject}-hero.png`, `${subject}-frame.png`, `${subject}-desktop.png`]
          : [`${subject}-${angle}.png`];
      const file = names
        .map((name) => captureFiles.find((f) => basename(f) === name))
        .find(Boolean);
      if (file) captures.push({ subject, angle, ...(await attach(file)) });
    }
  const sources = [];
  const sourceFiles = [];
  for (const folder of [...(stage.sources ?? []), stage.source].filter(Boolean)) {
    sourceFiles.push(...(await filesIn(resolve(root, 'test-results', folder))));
  }
  for (const file of sourceFiles) {
    if (!/\.(ts|tsx|css)$/.test(file)) continue;
    const full = await ownedFile(file);
    const name = basename(full);
    if (stage.sourceFiles && !stage.sourceFiles.includes(name)) continue;
    const bytes = await readFile(full);
    const prior = previousSources.get(name);
    let diff = null;
    if (prior) {
      const result = spawnSync(
        'git',
        ['diff', '--no-index', '--no-ext-diff', '--no-color', '--', prior.full, full],
        { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
      );
      if (result.error || ![0, 1].includes(result.status))
        throw new Error(`Snapshot comparison failed: ${result.stderr || result.error}`);
      diff = {
        fromStage: prior.stage,
        text: result.stdout || '(No changes between these retained snapshots)',
      };
    }
    const record = {
      name,
      path: relative(root, full),
      sha256: hash(bytes),
      text: bytes.toString('utf8'),
      diff,
    };
    sources.push(record);
    previousSources.set(name, { full, stage: index });
  }
  stages.push({
    ...stage,
    id: index,
    threadId: turn.threadId,
    anchorId: anchor.id,
    quote: anchor.text,
    captures,
    sources,
  });
}
const documents = [];
for (const path of spec.documents ?? []) {
  const full = await ownedFile(path);
  const bytes = await readFile(full);
  documents.push({ path, text: bytes.toString('utf8'), sha256: hash(bytes) });
}
const data = {
  version: 1,
  title: spec.title,
  subtitle: spec.subtitle,
  outcome: spec.outcome,
  collectedAt: new Date().toISOString(),
  inputs,
  threads,
  stages,
  documents,
  media,
};
const template = await readFile(resolve(here, 'viewer.html'), 'utf8');
if (!/\/\*TRACE_DATA\*\/\s*null/.test(template))
  throw new Error('Missing template data placeholder');
await writeFile(
  resolve(output, 'index.html'),
  template.replace(/\/\*TRACE_DATA\*\/\s*null/, () => scriptJSON(data)),
);
await writeFile(
  resolve(output, 'manifest.json'),
  JSON.stringify(
    {
      collectedAt: data.collectedAt,
      inputs,
      media,
      stages: stages.map((s) => ({
        title: s.title,
        anchorId: s.anchorId,
        sources: s.sources.map(({ text, diff, ...source }) => source),
      })),
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    file: resolve(output, 'index.html'),
    threads: threads.length,
    turns: turns.length,
    events: turns.reduce((n, t) => n + t.events.length, 0),
    stages: stages.length,
    captures: media.length,
  }),
);
