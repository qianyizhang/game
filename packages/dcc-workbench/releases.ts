/** Immutable artist deliveries. These receipts record review decisions; they do not
 * authenticate people or turn structural validation into aesthetic acceptance. */
import { createHash, randomUUID } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmdirSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import {
  assetInputPaths,
  definitionDigest,
  getAsset,
  readRegistry,
  resolveAssetPath,
} from './registry.ts';
import type { AssetDefinition } from './registry.ts';

type Hashes = Record<string, string>;
export interface FilePin {
  path: string;
  sha256: string;
}
export interface PreviousRelease {
  kind: 'release' | 'legacy';
  receipt: FilePin;
}
export interface InputSnapshot {
  id: string;
  definitionDigest: string;
  sha256: Hashes;
  previous: PreviousRelease | null;
}
export interface CandidateOutputs {
  model: string;
  audit: string;
  poses?: string;
}
type OutputPins = { model: FilePin; audit: FilePin; poses?: FilePin };
export interface CandidateManifest {
  schemaVersion: 1;
  id: string;
  definitionDigest: string;
  definition: AssetDefinition;
  inputs: Hashes;
  previous: PreviousRelease | null;
  origin: { kind: 'exported' };
  outputs: OutputPins;
  stats: Record<string, unknown>;
}
export interface CandidateReview {
  schemaVersion: 1;
  id: string;
  candidateDigest: string;
  reviewer: { role: 'parent'; name: string };
  decision: 'accepted' | 'rejected';
  scope: 'workbench' | 'gallery';
  evidence: { view: string; reference: string; observation: string }[];
}
export interface StoredCandidateReview extends Omit<CandidateReview, 'evidence'> {
  evidence: (CandidateReview['evidence'][number] & { sha256: string })[];
}
export interface ReleaseReceipt {
  schemaVersion: 1;
  id: string;
  definitionDigest: string;
  candidate: FilePin;
  review: FilePin;
  source: FilePin;
  brief: FilePin;
  outputs: OutputPins;
  previous: PreviousRelease | null;
  previousReceipt?: FilePin;
}
export interface ResolvedPublication {
  kind: 'release' | 'legacy';
  id: string;
  legacyStudyId: string;
  /** Absolute verified paths; source always belongs to this delivery. */
  model: string;
  audit: string;
  poses?: string;
  source: string;
  receipt: string;
  receiptDigest: string;
  modelPath: string;
  auditPath: string;
  posesPath?: string;
  sourcePath: string;
  briefPath: string;
  manifestPath: string;
  stats: Record<string, unknown>;
  modelSha256: string;
  reviewScope?: CandidateReview['scope'];
  reviewDecision?: CandidateReview['decision'];
}
export interface CandidateContext {
  root: string;
  asset: AssetDefinition;
  sharedInputs: readonly string[];
  candidate: string;
}
export interface CandidatePaths extends CandidateOutputs {
  source: string;
  modelPath: string;
  auditPath: string;
  posesPath?: string;
  sourcePath: string;
  briefPath: string;
}
function candidatePaths(
  outputs: CandidateOutputs,
  source: string,
  briefPath: string,
): CandidatePaths {
  return {
    ...outputs,
    source,
    modelPath: outputs.model,
    auditPath: outputs.audit,
    ...(outputs.poses ? { posesPath: outputs.poses } : {}),
    sourcePath: source,
    briefPath,
  };
}
export type CandidateValidator = (paths: CandidatePaths, manifest: CandidateManifest) => void;

function hash(bytes: Uint8Array | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}
function json(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected receipt object');
  return value as Record<string, unknown>;
}
function fields(value: Record<string, unknown>, required: string[], optional: string[] = []) {
  if (required.some((key) => !Object.hasOwn(value, key)))
    throw new Error('Incomplete receipt fields');
  if (Object.keys(value).some((key) => !required.includes(key) && !optional.includes(key)))
    throw new Error('Unknown receipt field');
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Expected nonempty receipt text');
  return value;
}
function digest(value: unknown): string {
  const result = text(value);
  if (!/^[a-f0-9]{64}$/.test(result)) throw new Error('Invalid receipt digest');
  return result;
}
function pin(value: unknown): FilePin {
  const data = object(value);
  fields(data, ['path', 'sha256']);
  return { path: text(data.path), sha256: digest(data.sha256) };
}
function hashes(value: unknown): Hashes {
  return Object.fromEntries(
    Object.entries(object(value)).map(([path, sha]) => [path, digest(sha)]),
  );
}
function previous(value: unknown): PreviousRelease | null {
  if (value === null) return null;
  const data = object(value);
  fields(data, ['kind', 'receipt']);
  if (data.kind !== 'release' && data.kind !== 'legacy') throw new Error('Invalid previous origin');
  return { kind: data.kind, receipt: pin(data.receipt) };
}
function outputPins(value: unknown, animated: boolean): OutputPins {
  const data = object(value);
  fields(data, animated ? ['model', 'audit', 'poses'] : ['model', 'audit']);
  const result = {
    model: pin(data.model),
    audit: pin(data.audit),
    ...(animated ? { poses: pin(data.poses) } : {}),
  };
  const paths = Object.values(result).map((item) => item.path.toLowerCase());
  if (new Set(paths).size !== paths.length) throw new Error('Output path collision');
  return result;
}
function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}
function regular(root: string, path: string): string {
  const resolved = resolveAssetPath(root, path);
  if (!lstatSync(resolved).isFile()) throw new Error(`Expected regular file: ${path}`);
  return resolved;
}
function filePin(root: string, path: string): FilePin {
  return { path, sha256: hash(readFileSync(regular(root, path))) };
}
function verifyPin(root: string, expected: FilePin): string {
  const path = regular(root, expected.path);
  if (hash(readFileSync(path)) !== expected.sha256)
    throw new Error(`Changed delivery file: ${expected.path}`);
  return path;
}
function requiredInputs(asset: AssetDefinition, sharedInputs: readonly string[]): string[] {
  return [...new Set([...assetInputPaths(asset), ...sharedInputs])].sort();
}
function validateInputs(
  root: string,
  asset: AssetDefinition,
  shared: readonly string[],
  supplied: Hashes,
) {
  const required = requiredInputs(asset, shared);
  if (JSON.stringify(Object.keys(supplied).sort()) !== JSON.stringify(required))
    throw new Error('Input pins do not exactly match required inputs');
  for (const path of required) verifyPin(root, { path, sha256: digest(supplied[path]) });
}
function frozenDefinition(value: unknown, id: string): AssetDefinition {
  const data = object(value);
  if (data.id !== id) throw new Error('Embedded definition identity mismatch');
  const raw = Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'id'));
  return getAsset(readRegistry(JSON.stringify({ schemaVersion: 1, assets: { [id]: raw } })), id);
}
function publication(asset: AssetDefinition): string {
  return asset.delivery.publication;
}
function currentPrevious(root: string, asset: AssetDefinition): PreviousRelease | null {
  const pointer = resolveAssetPath(root, publication(asset) + '/current.json');
  if (existsSync(pointer)) {
    const data = object(readJson(pointer));
    fields(data, ['schemaVersion', 'id', 'receiptDigest']);
    if (data.schemaVersion !== 1 || data.id !== asset.id)
      throw new Error('Current pointer identity mismatch');
    const sha256 = digest(data.receiptDigest);
    const receipt = { path: `${publication(asset)}/releases/${sha256}/receipt.json`, sha256 };
    const value = object(readJson(verifyPin(root, receipt)));
    if (value.schemaVersion !== 1 || value.id !== asset.id)
      throw new Error('Current release identity mismatch');
    return { kind: 'release', receipt };
  }
  const legacy = resolveAssetPath(root, asset.delivery.manifest);
  if (!existsSync(legacy)) return null;
  const value = object(readJson(regular(root, asset.delivery.manifest)));
  if (
    value.schemaVersion !== 1 ||
    value.id !== asset.id ||
    value.source !== asset.source ||
    value.asset !== asset.delivery.model
  )
    throw new Error('Legacy publication identity mismatch');
  return { kind: 'legacy', receipt: filePin(root, asset.delivery.manifest) };
}
function samePrevious(expected: PreviousRelease | null, actual: PreviousRelease | null) {
  if (JSON.stringify(expected) !== JSON.stringify(actual))
    throw new Error('Previous publication changed since export began');
}
function candidateDirectory(asset: AssetDefinition, candidate: string): string {
  const result = resolve(candidate);
  if (
    basename(result) !== asset.id ||
    realpathSync(result) !== result ||
    !lstatSync(result).isDirectory()
  )
    throw new Error('Candidate directory identity or canonical path mismatch');
  return result;
}

/** Call before starting native export. Every expected input is pinned, including the saved source. */
export function snapshotInputs(
  root: string,
  asset: AssetDefinition,
  sharedInputs: readonly string[],
): InputSnapshot {
  return {
    id: asset.id,
    definitionDigest: definitionDigest(asset),
    sha256: Object.fromEntries(
      requiredInputs(asset, sharedInputs).map((path) => [path, filePin(root, path).sha256]),
    ),
    previous: currentPrevious(root, asset),
  };
}
export function createCandidate(
  root: string,
  asset: AssetDefinition,
  runtimeRoot = resolve(root, '../../.work/runtime/dcc-candidates'),
): string {
  mkdirSync(runtimeRoot, { recursive: true });
  const parent = realpathSync(runtimeRoot);
  // Native exporters create their own output directory and reject existing destinations.
  return join(mkdtempSync(join(parent, 'export-')), asset.id);
}

export function sealCandidate(
  options: CandidateContext & {
    snapshot: InputSnapshot;
    outputs: CandidateOutputs;
    stats: Record<string, unknown>;
    validate?: CandidateValidator;
  },
): { manifest: CandidateManifest; digest: string; path: string } {
  const { root, asset, sharedInputs, snapshot } = options;
  const directory = candidateDirectory(asset, options.candidate);
  if (snapshot.id !== asset.id || snapshot.definitionDigest !== definitionDigest(asset))
    throw new Error('Candidate definition identity mismatch');
  validateInputs(root, asset, sharedInputs, snapshot.sha256);
  samePrevious(snapshot.previous, currentPrevious(root, asset));
  const outputs = outputPins(
    Object.fromEntries(
      Object.entries(options.outputs).map(([role, path]) => [role, filePin(directory, text(path))]),
    ),
    asset.delivery.profile !== 'static',
  );
  const manifest: CandidateManifest = {
    schemaVersion: 1,
    id: asset.id,
    definitionDigest: snapshot.definitionDigest,
    definition: frozenDefinition(asset, asset.id),
    inputs: { ...snapshot.sha256 },
    previous: snapshot.previous,
    origin: { kind: 'exported' },
    outputs,
    stats: options.stats,
  };
  options.validate?.(
    candidatePaths(
      outputPaths(directory, outputs),
      regular(root, asset.source),
      regular(root, asset.brief),
    ),
    manifest,
  );
  // An injected validator can be expensive or invoke native tools; recheck after it too.
  validateInputs(root, asset, sharedInputs, snapshot.sha256);
  for (const value of Object.values(outputs)) verifyPin(directory, value);
  samePrevious(snapshot.previous, currentPrevious(root, asset));
  const path = resolveAssetPath(directory, 'candidate.json');
  writeFileSync(path, json(manifest), { flag: 'wx' });
  return { manifest, digest: hash(readFileSync(path)), path };
}
function readCandidate(
  directory: string,
  id: string,
): { manifest: CandidateManifest; digest: string } {
  const path = regular(directory, 'candidate.json');
  const value = object(readJson(path));
  fields(value, [
    'schemaVersion',
    'id',
    'definitionDigest',
    'definition',
    'inputs',
    'previous',
    'origin',
    'outputs',
    'stats',
  ]);
  if (value.schemaVersion !== 1 || value.id !== id) throw new Error('Candidate identity mismatch');
  const origin = object(value.origin);
  fields(origin, ['kind']);
  if (origin.kind !== 'exported')
    throw new Error('Unsupported candidate origin; legacy adoption must be explicit');
  const definition = frozenDefinition(value.definition, id);
  if (definitionDigest(definition) !== digest(value.definitionDigest))
    throw new Error('Embedded definition digest mismatch');
  const manifest: CandidateManifest = {
    schemaVersion: 1,
    id,
    definitionDigest: digest(value.definitionDigest),
    definition,
    inputs: hashes(value.inputs),
    previous: previous(value.previous),
    origin: { kind: 'exported' },
    outputs: outputPins(value.outputs, definition.delivery.profile !== 'static'),
    stats: object(value.stats),
  };
  return { manifest, digest: hash(readFileSync(path)) };
}
function evidenceReference(value: unknown): string {
  const reference = text(value);
  if (!reference.startsWith('evidence/'))
    throw new Error('Review evidence must be inside the candidate evidence/ directory');
  return reference;
}
function readReview(value: unknown): CandidateReview {
  const data = object(value);
  fields(data, [
    'schemaVersion',
    'id',
    'candidateDigest',
    'reviewer',
    'decision',
    'scope',
    'evidence',
  ]);
  const reviewer = object(data.reviewer);
  fields(reviewer, ['role', 'name']);
  if (
    data.schemaVersion !== 1 ||
    reviewer.role !== 'parent' ||
    !['accepted', 'rejected'].includes(text(data.decision)) ||
    !['workbench', 'gallery'].includes(text(data.scope))
  )
    throw new Error('Review requires a parent reviewer and explicit decision');
  if (!Array.isArray(data.evidence) || !data.evidence.length)
    throw new Error('Review requires concrete view evidence');
  const evidence: unknown[] = data.evidence;
  return {
    schemaVersion: 1,
    id: text(data.id),
    candidateDigest: digest(data.candidateDigest),
    reviewer: { role: 'parent', name: text(reviewer.name) },
    decision: data.decision as 'accepted' | 'rejected',
    scope: data.scope as 'workbench' | 'gallery',
    evidence: evidence.map((item) => {
      const entry = object(item);
      fields(entry, ['view', 'reference', 'observation']);
      return {
        view: text(entry.view),
        reference: evidenceReference(entry.reference),
        observation: text(entry.observation),
      };
    }),
  };
}
function readStoredReview(value: unknown): StoredCandidateReview {
  const data = object(value);
  if (!Array.isArray(data.evidence)) throw new Error('Review requires concrete view evidence');
  const rows: unknown[] = data.evidence;
  const evidence = rows.map((item) => {
    const row = object(item);
    fields(row, ['view', 'reference', 'observation', 'sha256']);
    return {
      view: row.view,
      reference: row.reference,
      observation: row.observation,
      sha256: digest(row.sha256),
    };
  });
  const review = readReview({
    ...data,
    evidence: evidence.map((entry) => ({
      view: entry.view,
      reference: entry.reference,
      observation: entry.observation,
    })),
  });
  return {
    ...review,
    evidence: review.evidence.map((entry, index) => ({ ...entry, sha256: evidence[index].sha256 })),
  };
}
/** Review remains a separate immutable record bound to exact candidate bytes. */
export function writeCandidateReview(candidate: string, review: CandidateReview): string {
  const parsed = readReview(review);
  const manifest = object(readJson(regular(candidate, 'candidate.json')));
  if (
    manifest.id !== parsed.id ||
    hash(readFileSync(regular(candidate, 'candidate.json'))) !== parsed.candidateDigest
  )
    throw new Error('Review candidate identity/digest mismatch');
  const stored: StoredCandidateReview = {
    ...parsed,
    evidence: parsed.evidence.map((entry) => ({
      ...entry,
      sha256: filePin(candidate, entry.reference).sha256,
    })),
  };
  const path = resolveAssetPath(candidate, 'review.json');
  writeFileSync(path, json(stored), { flag: 'wx' });
  return path;
}
function acceptedReview(
  directory: string,
  id: string,
  candidateDigest: string,
): StoredCandidateReview {
  const review = readStoredReview(readJson(regular(directory, 'review.json')));
  if (review.id !== id || review.candidateDigest !== candidateDigest)
    throw new Error('Review candidate identity/digest mismatch');
  if (review.decision !== 'accepted') throw new Error('Candidate review is rejected');
  for (const entry of review.evidence)
    verifyPin(directory, { path: entry.reference, sha256: entry.sha256 });
  return review;
}
function outputPaths(directory: string, outputs: OutputPins): CandidateOutputs {
  return {
    model: verifyPin(directory, outputs.model),
    audit: verifyPin(directory, outputs.audit),
    ...(outputs.poses ? { poses: verifyPin(directory, outputs.poses) } : {}),
  };
}
function copyPinned(fromRoot: string, from: FilePin, targetRoot: string, to: string): FilePin {
  const original = verifyPin(fromRoot, from);
  const target = resolveAssetPath(targetRoot, to);
  mkdirSync(dirname(target), { recursive: true });
  // COPYFILE_EXCL keeps an existing release immutable, including after interrupted publication.
  copyFileSync(original, target, 1);
  const result = { path: to, sha256: from.sha256 };
  verifyPin(targetRoot, result);
  return result;
}

/** Writes complete release contents before the single atomic current-pointer replacement.
 * The optional validator performs the caller's native/GLB checks; throwing leaves current intact. */
export function promoteCandidate(
  options: CandidateContext & { validate?: CandidateValidator },
): ResolvedPublication {
  const location = resolveAssetPath(options.root, publication(options.asset));
  mkdirSync(location, { recursive: true });
  const lock = resolveAssetPath(options.root, publication(options.asset) + '/.promotion-lock');
  // Serialize same-asset publishers across processes. A crashed writer leaves an
  // explicit lock for operator inspection; never guess that it is safe to remove.
  mkdirSync(lock);
  try {
    return promoteLocked(options);
  } finally {
    rmdirSync(lock);
  }
}
function promoteLocked(
  options: CandidateContext & { validate?: CandidateValidator },
): ResolvedPublication {
  const { root, asset, sharedInputs } = options;
  const directory = candidateDirectory(asset, options.candidate);
  const candidate = readCandidate(directory, asset.id),
    manifest = candidate.manifest;
  if (manifest.definitionDigest !== definitionDigest(asset))
    throw new Error('Selected asset definition changed');
  validateInputs(root, asset, sharedInputs, manifest.inputs);
  samePrevious(manifest.previous, currentPrevious(root, asset));
  outputPaths(directory, manifest.outputs);
  const review = acceptedReview(directory, asset.id, candidate.digest);
  const reviewPin = filePin(directory, 'review.json');
  const receipt: ReleaseReceipt = {
    schemaVersion: 1,
    id: asset.id,
    definitionDigest: manifest.definitionDigest,
    candidate: { path: 'candidate.json', sha256: candidate.digest },
    review: { path: 'review.json', sha256: reviewPin.sha256 },
    source: { path: 'source.blend', sha256: manifest.inputs[asset.source] },
    brief: { path: 'brief.json', sha256: manifest.inputs[asset.brief] },
    outputs: {
      model: { path: 'model.glb', sha256: manifest.outputs.model.sha256 },
      audit: { path: 'authoring.json', sha256: manifest.outputs.audit.sha256 },
      ...(manifest.outputs.poses
        ? { poses: { path: 'pose-samples.json', sha256: manifest.outputs.poses.sha256 } }
        : {}),
    },
    previous: manifest.previous,
    ...(manifest.previous
      ? {
          previousReceipt: {
            path: 'previous-receipt.json',
            sha256: manifest.previous.receipt.sha256,
          },
        }
      : {}),
  };
  const receiptBytes = json(receipt),
    receiptDigest = hash(receiptBytes);
  const releasePath = `${publication(asset)}/releases/${receiptDigest}`;
  const release = resolveAssetPath(root, releasePath);
  // A fresh staging directory makes partial writes recoverable and never visible as current.
  const releases = resolveAssetPath(root, publication(asset) + '/releases');
  mkdirSync(releases, { recursive: true });
  const staging = mkdtempSync(join(releases, '.pending-'));
  copyPinned(directory, receipt.candidate, staging, receipt.candidate.path);
  copyPinned(directory, reviewPin, staging, receipt.review.path);
  for (const [path, sha256] of new Map(
    review.evidence.map((entry) => [entry.reference, entry.sha256]),
  ))
    copyPinned(directory, { path, sha256 }, staging, path);
  copyPinned(
    root,
    { path: asset.source, sha256: receipt.source.sha256 },
    staging,
    receipt.source.path,
  );
  copyPinned(
    root,
    { path: asset.brief, sha256: receipt.brief.sha256 },
    staging,
    receipt.brief.path,
  );
  for (const role of ['model', 'audit', 'poses'] as const) {
    const from = manifest.outputs[role],
      target = receipt.outputs[role];
    if (from && target) copyPinned(directory, from, staging, target.path);
  }
  if (manifest.previous && receipt.previousReceipt)
    copyPinned(root, manifest.previous.receipt, staging, receipt.previousReceipt.path);
  writeFileSync(join(staging, 'receipt.json'), receiptBytes, { flag: 'wx' });
  const staged = validateRelease(staging, asset, receiptDigest);
  options.validate?.(candidatePaths(staged, staged.source, staged.briefPath), manifest);
  // Check the copied bytes again after caller validation, before making them current.
  validateRelease(staging, asset, receiptDigest);
  if (existsSync(release)) {
    // Retry may reuse only an already complete, byte-identical immutable release.
    validateRelease(release, asset, receiptDigest);
  } else renameSync(staging, release);
  validateInputs(root, asset, sharedInputs, manifest.inputs);
  samePrevious(manifest.previous, currentPrevious(root, asset));
  if (readCandidate(directory, asset.id).digest !== candidate.digest)
    throw new Error('Candidate changed before publication');
  verifyPin(directory, reviewPin);
  acceptedReview(directory, asset.id, candidate.digest);
  const pointer = resolveAssetPath(root, publication(asset) + '/current.json');
  const temporary = resolveAssetPath(root, publication(asset) + `/current.${randomUUID()}.pending`);
  writeFileSync(temporary, json({ schemaVersion: 1, id: asset.id, receiptDigest }), { flag: 'wx' });
  // Both paths are in the same directory, so readers see either complete pointer.
  renameSync(temporary, pointer);
  return resolvePublication(root, asset);
}
function validateRelease(
  directory: string,
  asset: AssetDefinition,
  receiptDigest: string,
): ResolvedPublication {
  const receiptPath = verifyPin(directory, { path: 'receipt.json', sha256: receiptDigest });
  const data = object(readJson(receiptPath));
  fields(
    data,
    [
      'schemaVersion',
      'id',
      'definitionDigest',
      'candidate',
      'review',
      'source',
      'brief',
      'outputs',
      'previous',
    ],
    ['previousReceipt'],
  );
  if (data.schemaVersion !== 1 || data.id !== asset.id)
    throw new Error('Release identity mismatch');
  const candidatePin = pin(data.candidate),
    reviewPin = pin(data.review),
    sourcePin = pin(data.source),
    briefPin = pin(data.brief);
  if (
    candidatePin.path !== 'candidate.json' ||
    reviewPin.path !== 'review.json' ||
    sourcePin.path !== 'source.blend' ||
    briefPin.path !== 'brief.json'
  )
    throw new Error('Invalid release authority paths');
  verifyPin(directory, candidatePin);
  verifyPin(directory, reviewPin);
  const candidate = readCandidate(directory, asset.id);
  if (
    candidate.digest !== candidatePin.sha256 ||
    candidate.manifest.definitionDigest !== digest(data.definitionDigest)
  )
    throw new Error('Release candidate binding mismatch');
  const review = acceptedReview(directory, asset.id, candidate.digest);
  const definition = candidate.manifest.definition;
  const outputs = outputPins(data.outputs, definition.delivery.profile !== 'static');
  if (
    outputs.model.path !== 'model.glb' ||
    outputs.audit.path !== 'authoring.json' ||
    (outputs.poses && outputs.poses.path !== 'pose-samples.json')
  )
    throw new Error('Invalid release output paths');
  for (const role of ['model', 'audit', 'poses'] as const) {
    const output = outputs[role],
      original = candidate.manifest.outputs[role];
    if (output?.sha256 !== original?.sha256) throw new Error('Release output binding mismatch');
  }
  if (candidate.manifest.inputs[definition.source] !== sourcePin.sha256)
    throw new Error('Release source binding mismatch');
  if (candidate.manifest.inputs[definition.brief] !== briefPin.sha256)
    throw new Error('Release brief binding mismatch');
  const prior = previous(data.previous);
  samePrevious(prior, candidate.manifest.previous);
  if (prior) {
    const retained = pin(data.previousReceipt);
    if (retained.path !== 'previous-receipt.json' || retained.sha256 !== prior.receipt.sha256)
      throw new Error('Missing previous receipt binding');
    verifyPin(directory, retained);
  } else if (data.previousReceipt !== undefined) throw new Error('Unexpected previous receipt');
  const paths = outputPaths(directory, outputs),
    source = verifyPin(directory, sourcePin),
    briefPath = verifyPin(directory, briefPin);
  return {
    kind: 'release',
    id: asset.id,
    legacyStudyId: definition.legacyStudyId,
    ...paths,
    source,
    receipt: receiptPath,
    receiptDigest,
    modelPath: paths.model,
    auditPath: paths.audit,
    ...(paths.poses ? { posesPath: paths.poses } : {}),
    sourcePath: source,
    briefPath,
    manifestPath: receiptPath,
    stats: candidate.manifest.stats,
    modelSha256: outputs.model.sha256,
    reviewScope: review.scope,
    reviewDecision: review.decision,
  };
}
/** Current releases remain loadable after further artist edits. Legacy fallback validates
 * its required pins but cannot invent an immutable source absent from old publication. */
export function resolvePublication(root: string, asset: AssetDefinition): ResolvedPublication {
  const selected = currentPrevious(root, asset);
  if (!selected) throw new Error(`No publication for ${asset.id}`);
  if (selected.kind === 'release')
    return validateRelease(
      dirname(resolveAssetPath(root, selected.receipt.path)),
      asset,
      selected.receipt.sha256,
    );
  const receipt = verifyPin(root, selected.receipt),
    value = object(readJson(receipt));
  if (
    value.schemaVersion !== 1 ||
    value.id !== asset.id ||
    value.source !== asset.source ||
    value.asset !== asset.delivery.model
  )
    throw new Error('Legacy publication identity mismatch');
  const supplied = hashes(value.sha256);
  for (const path of [
    asset.source,
    asset.brief,
    asset.delivery.model,
    asset.delivery.audit,
    ...(asset.delivery.poses ? [asset.delivery.poses] : []),
  ]) {
    if (!Object.hasOwn(supplied, path)) throw new Error(`Missing required legacy pin: ${path}`);
    verifyPin(root, { path, sha256: supplied[path] });
  }
  return {
    kind: 'legacy',
    id: asset.id,
    legacyStudyId: asset.legacyStudyId,
    source: regular(root, asset.source),
    model: regular(root, asset.delivery.model),
    audit: regular(root, asset.delivery.audit),
    ...(asset.delivery.poses ? { poses: regular(root, asset.delivery.poses) } : {}),
    receipt,
    receiptDigest: selected.receipt.sha256,
    modelPath: regular(root, asset.delivery.model),
    auditPath: regular(root, asset.delivery.audit),
    ...(asset.delivery.poses ? { posesPath: regular(root, asset.delivery.poses) } : {}),
    sourcePath: regular(root, asset.source),
    briefPath: regular(root, asset.brief),
    manifestPath: receipt,
    stats: object(value.stats),
    modelSha256: supplied[asset.delivery.model],
  };
}

/** CLI freshness is stricter than viewing: existing deliveries remain available
 * while artists edit, but a current-input verification must report those edits. */
export function verifyPublicationInputs(
  root: string,
  asset: AssetDefinition,
  sharedInputs: readonly string[],
): void {
  const selected = resolvePublication(root, asset);
  if (selected.kind === 'release') {
    const { manifest } = readCandidate(dirname(selected.receipt), asset.id);
    if (manifest.definitionDigest !== definitionDigest(asset))
      throw new Error('Selected asset definition changed');
    validateInputs(root, asset, sharedInputs, manifest.inputs);
    return;
  }
  const data = object(readJson(selected.receipt));
  const supplied = hashes(data.sha256);
  // Historical exporters pinned these tools; requiring a newly added tool would
  // incorrectly rewrite history. All currently declared native inputs still apply.
  for (const path of requiredInputs(asset, ['pipeline.mjs', 'pipeline.ts', 'contracts.ts'])) {
    if (!Object.hasOwn(supplied, path))
      throw new Error(`Missing required legacy input pin: ${path}`);
    verifyPin(root, { path, sha256: supplied[path] });
  }
}
