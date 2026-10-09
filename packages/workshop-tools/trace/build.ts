import { gitDocument } from './documents.ts';
import { renderReview } from '@card-workshop/session-review/build';
import { randomUUID } from 'node:crypto';
import { freshOutput } from './output.ts';
import {
  parseCase,
  type BuildOptions,
  type CaseSpec,
  type MediaRecord,
  type SourceRecord,
  type TraceThread,
} from './contracts.ts';
import { readFile, writeFile, mkdir, readdir, copyFile, realpath } from 'node:fs/promises';
import { resolve, dirname, relative, basename, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { normalizeThread } from './normalize.ts';
import { createEvidenceResolver, episodeModel } from './model.ts';

const here = dirname(fileURLToPath(import.meta.url));
const sourceMetadata = (source: SourceRecord) => ({
  name: source.name,
  path: source.path,
  sourceKey: source.sourceKey,
  subject: source.subject,
  sha256: source.sha256,
});
const repository = resolve(here, '../../..');
export async function buildCase(options: BuildOptions) {
  const requestedRoot = resolve(options.root ?? repository);
  const root = await realpath(requestedRoot);
  const rebase = (path: string) =>
    resolve(root, relative(requestedRoot, resolve(requestedRoot, path)));
  const input = rebase(options.input ?? 'test-results/trace-visualizer-input');
  const output = rebase(options.output ?? `test-results/trace-visualizer-${randomUUID()}`);
  const spec = parseCase(options.spec);
  return freshOutput(root, output, input, () => buildInto({ root, input, output, spec }));
}
async function buildInto({
  root,
  input = resolve(root, 'test-results/trace-visualizer-input'),
  output = resolve(root, 'test-results/trace-visualizer'),
  spec,
}: {
  root: string;
  input: string;
  output: string;
  spec: CaseSpec;
}) {
  root = await realpath(root);
  const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex');
  await mkdir(resolve(output, 'assets'), { recursive: true });
  const rootReal = await realpath(root);
  async function ownedFile(path: string) {
    const full = await realpath(resolve(root, path));
    if (!full.startsWith(rootReal + sep))
      throw new Error(`Evidence must stay inside repository: ${path}`);
    if (full === output || full.startsWith(output + sep))
      throw new Error('Evidence overlaps output');
    return full;
  }
  const threads: TraceThread[] = [];
  const inputs = [];
  for (const item of spec.threads) {
    if (!item.id || /[\\/]/.test(item.id)) throw new Error('Invalid source thread filename');
    const raw = await readFile(await ownedFile(resolve(input, item.id + '.json')));
    const thread = normalizeThread(JSON.parse(raw.toString('utf8')), item.role);
    if (thread.id !== item.id) throw new Error('Thread identity mismatch');
    threads.push({ ...thread, parent: item.parent });
    inputs.push({ threadId: item.id, sha256: hash(raw) });
  }
  const turns = threads.flatMap((t) => t.turns);
  const resolveRefs = createEvidenceResolver(threads);
  const stageIds = new Set<string>();
  const artifacts = [];
  const media: MediaRecord[] = [];
  const mediaByPath = new Map<string, MediaRecord>();
  async function attach(path: string) {
    const full = await ownedFile(path);
    const existing = mediaByPath.get(full);
    if (existing) return existing;
    const bytes = await readFile(full);
    const sha256 = hash(bytes);
    const url = `assets/${sha256.slice(0, 20)}${extname(full)}`;
    await copyFile(full, resolve(output, url));
    const record = { path: relative(root, full), url, sha256, bytes: bytes.length };
    media.push(record);
    mediaByPath.set(full, record);
    return record;
  }
  async function filesIn(directory: string): Promise<string[]> {
    const lexical = relative(root, directory);
    if (lexical === '..' || lexical.startsWith('..' + sep))
      throw new Error(`Evidence must stay inside repository: ${directory}`);
    const result: string[] = [];
    try {
      await ownedFile(directory);
      for (const e of await readdir(directory, { withFileTypes: true })) {
        if (e.isDirectory()) result.push(...(await filesIn(resolve(directory, e.name))));
        else if (e.isFile()) result.push(resolve(directory, e.name));
      }
    } catch (e) {
      if (!e || typeof e !== 'object' || !('code' in e) || e.code !== 'ENOENT') throw e;
    }
    return result.sort();
  }
  const subjects = ['hydra', 'nightjar', 'spiral', 'vajra', 'phoenix', 'catalyst'];
  const stages = [];
  const previousSources = new Map<string, { full: string; stage: number }>();
  for (const [index, stage] of spec.stages.entries()) {
    const matches = turns.filter(
      (t) => t.id === stage.turn && (!stage.thread || t.threadId === stage.thread),
    );
    if (matches.length > 1) throw new Error(`Ambiguous turn: ${stage.title}`);
    const turn = matches[0];
    if (!turn) throw new Error(`Unknown turn for ${stage.title}`);
    const anchorRef = stage.anchorRef;
    const anchorText = stage.anchor;
    const anchor = anchorRef
      ? (resolveRefs([anchorRef], stage.title),
        turn.events.find(
          (e) =>
            e.id === anchorRef.event &&
            e.threadId === anchorRef.thread &&
            e.turnId === anchorRef.turn,
        ))
      : anchorText
        ? turn.events.find(
            (e) => ['message', 'request'].includes(e.kind) && e.text.includes(anchorText),
          )
        : [...turn.events].reverse().find((e) => e.kind === 'message');
    if (!anchor) throw new Error(`Missing evidence anchor: ${stage.title}`);
    const id = stage.id ?? `episode-${index + 1}`;
    if (stageIds.has(id)) throw new Error(`Duplicate episode id: ${id}`);
    stageIds.add(id);
    if (!Array.isArray(stage.evidence))
      throw new Error(`Missing evidence references: ${stage.title}`);
    const model = episodeModel(
      {
        ...stage,
        id,
        evidence: [
          ...stage.evidence,
          {
            thread: turn.threadId,
            turn: turn.id,
            event: anchor.id,
            role: anchor.kind === 'request' ? 'feedback' : 'assessment',
          },
        ],
      },
      threads,
      resolveRefs,
    );
    const captures: Array<MediaRecord & { subject: string; angle: string }> = [];
    const captureFiles: string[] = [];
    for (const folder of [...(stage.captures ?? []), stage.capture, stage.fallbackCapture].filter(
      (folder): folder is string => typeof folder === 'string' && folder.length > 0,
    )) {
      captureFiles.push(...(await filesIn(resolve(root, 'test-results', folder))));
    }
    for (const subject of stage.captureSubjects ?? subjects)
      for (const angle of [
        'hero',
        'side',
        'back',
        'large',
        'roundtrip-live',
        'roundtrip-exported',
      ]) {
        const names =
          angle === 'hero'
            ? [`${subject}-hero.png`, `${subject}-frame.png`, `${subject}-desktop.png`]
            : [`${subject}-${angle}.png`];
        const file = names
          .map((name) => captureFiles.find((f) => basename(f) === name))
          .find(Boolean);
        if (file) captures.push({ subject, angle, ...(await attach(file)) });
      }
    const sources: SourceRecord[] = [];
    const sourceFiles: string[] = [];
    for (const folder of [...(stage.sources ?? []), stage.source].filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    )) {
      sourceFiles.push(...(await filesIn(resolve(root, 'test-results', folder))));
    }
    for (const file of sourceFiles) {
      if (!/\.(ts|tsx|css)$/.test(file)) continue;
      const full = await ownedFile(file);
      const name = basename(full);
      if (stage.sourceFiles && !stage.sourceFiles.includes(name)) continue;
      const bytes = await readFile(full);
      const path = relative(root, full);
      const sourceKey =
        stage.sourceKeys?.[path] ?? spec.sourceKeys?.[path] ?? stage.sourceKey ?? path;
      if (typeof sourceKey !== 'string' || !sourceKey)
        throw new Error(`Invalid sourceKey: ${path}`);
      if (sources.some((s) => s.sourceKey === sourceKey))
        throw new Error(`Artifact sourceKey collision in ${stage.title}: ${sourceKey}`);
      const prior = previousSources.get(sourceKey);
      let diff = null;
      if (prior) {
        const result = spawnSync(
          'git',
          ['diff', '--no-index', '--no-ext-diff', '--no-color', '--', prior.full, full],
          { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
        );
        if (result.error || !(result.status === 0 || result.status === 1))
          throw new Error(`Snapshot comparison failed: ${result.stderr || String(result.error)}`);
        diff = {
          fromStage: prior.stage,
          text: result.stdout || '(No changes between these retained snapshots)',
        };
      }
      const record = {
        name,
        path,
        sourceKey,
        subject: spec.sourceSubjects?.[sourceKey],
        sha256: hash(bytes),
        text: bytes.toString('utf8'),
        diff,
      };
      sources.push(record);
      previousSources.set(sourceKey, { full, stage: index });
    }
    const artifactIds = [];
    for (const subject of new Set([
      ...captures.map((c) => c.subject),
      ...sources
        .map((s) => s.subject)
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
      ...(stage.subjects ?? []),
      ...model.assessments.map((a) => a.subject),
      ...(stage.subject ? [stage.subject] : []),
    ])) {
      const artifact = {
        id: `${id}:${subject}`,
        subject,
        stageId: id,
        stageIndex: index,
        captures: captures.filter((c) => c.subject === subject),
        sources: sources.filter((s) => s.subject === subject).map(sourceMetadata),
        producedBy: model.artifactEvidence[subject]?.producedBy ?? [],
        inspectedBy: model.artifactEvidence[subject]?.inspectedBy ?? [],
        provenance: {
          sourcePairing: 'unknown',
          cameraKnown: false,
          lightingKnown: false,
          ...stage.artifactProvenance?.[subject],
        },
        limits: [
          'Retained bytes collected now; source-to-render pairing unknown.',
          'Camera, lighting and framing may differ across revisions.',
          ...(stage.limits ?? []),
        ],
      };
      artifacts.push(artifact);
      artifactIds.push(artifact.id);
    }
    stages.push({
      ...stage,
      ...model,
      id,
      index,
      threadId: turn.threadId,
      anchorId: anchor.id,
      anchorRef: { thread: turn.threadId, turn: turn.id, event: anchor.id, role: 'assessment' },
      quote: anchor.text,
      captures,
      sources,
      artifacts: artifactIds,
      assessments: model.assessments.map((a) => ({ ...a, artifactId: `${id}:${a.subject}` })),
    });
  }
  const documents = [];
  for (const reference of spec.documents ?? []) {
    const path = typeof reference === 'string' ? reference : reference.path;
    const revision = typeof reference === 'string' ? undefined : reference.revision;
    const bytes = revision
      ? gitDocument(root, path, revision)
      : await readFile(await ownedFile(path));
    documents.push({
      path,
      ...(revision ? { revision } : {}),
      text: bytes.toString('utf8'),
      sha256: hash(bytes),
    });
  }
  const data = {
    version: 2,
    title: spec.title,
    subtitle: spec.subtitle,
    outcome: spec.outcome,
    collectedAt: new Date().toISOString(),
    inputs,
    threads,
    stages,
    artifacts,
    documents,
    media,
  };
  const { stages: episodes, artifacts: revisions, ...recorded } = data;
  await writeFile(
    resolve(output, 'index.html'),
    await renderReview({ ...recorded, curation: { episodes, artifacts: revisions } }),
  );
  await writeFile(
    resolve(output, 'manifest.json'),
    JSON.stringify(
      {
        collectedAt: data.collectedAt,
        inputs,
        media,
        artifacts,
        traceSources: threads.map(({ id, source, coverage }) => ({ id, source, coverage })),
        documents: documents.map(({ path, sha256, revision }) => ({
          path,
          sha256,
          ...(revision ? { revision } : {}),
        })),
        stages: stages.map((s) => ({
          id: s.id,
          title: s.title,
          evidence: s.evidence,
          anchorId: s.anchorId,
          sources: s.sources.map(sourceMetadata),
        })),
      },
      null,
      2,
    ),
  );
  return { ...data, output };
}
export async function runCli(args: string[]) {
  if (args.length === 1 && args[0] === '--help') {
    console.log(
      'npm run trace:build -- [input-directory] [new-output-directory] [case-study.json]\nPaths resolve from the repository root; existing output is never overwritten.',
    );
    return;
  }
  if (args.length > 3 || args.some((arg) => arg.startsWith('--')))
    throw new Error('Unknown trace build arguments; use --help');
  const data = await buildCase({
    input: args[0],
    output: args[1],
    spec: JSON.parse(
      await readFile(resolve(repository, args[2] ?? resolve(here, 'case-study.json')), 'utf8'),
    ),
  });
  console.log(
    JSON.stringify({
      file: resolve(data.output, 'index.html'),
      threads: data.threads.length,
      episodes: data.stages.length,
      artifacts: data.artifacts.length,
      captures: data.media.length,
    }),
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await runCli(process.argv.slice(2));
