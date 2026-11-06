import {
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  unlinkSync,
  openSync,
  closeSync,
  lstatSync,
  realpathSync,
  readdirSync,
} from 'node:fs';
import { resolve, relative, dirname, sep } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { ArtHistory, HistoryState, HistoryDocument } from './history-types.ts';

export const HISTORY_PATH = 'docs/art/iterations/library.json';
export const SELECTION_PATH = 'src/shared/art/selected-art.json';
export const MANAGED_PATH = 'docs/art/iterations/files';
export const digest = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected an object');
  return value as Record<string, unknown>;
};
const string = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Expected nonempty text');
  return value;
};
const strings = (value: unknown): string[] => {
  if (!Array.isArray(value) || !value.every((item: unknown) => typeof item === 'string'))
    throw new Error('Expected text entries');
  return value;
};
const rows = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) throw new Error('Expected entries');
  return value as unknown[];
};

/** Resolve every existing component; both reads and removals reject symlink escapes. */
export function historyPath(root: string, path: string) {
  if (
    path.startsWith('/') ||
    path.split('/').some((part) => !part || part === '.' || part === '..')
  )
    throw new Error('History paths must be normalized repository-relative paths');
  const base = realpathSync(root);
  const target = resolve(base, path);
  const local = relative(base, target);
  if (!local || local === '..' || local.startsWith('..' + sep) || path.includes('\\'))
    throw new Error('History path must stay inside the repository');
  let current = base;
  for (const part of local.split(sep)) {
    current = resolve(current, part);
    if (existsSync(current) && lstatSync(current).isSymbolicLink())
      throw new Error('Symlinked history paths are not supported');
  }
  return target;
}

export function parseHistory(value: unknown, context?: ArtHistory): ArtHistory {
  const raw = object(value);
  if (raw.schema !== 1) throw new Error('Unsupported art history schema');
  const history: ArtHistory = {
    schema: 1,
    assets: rows(raw.assets).map((entry) => {
      const item = object(entry);
      const width = item.width,
        height = item.height;
      if (
        typeof width !== 'number' ||
        typeof height !== 'number' ||
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0
      )
        throw new Error('Invalid asset dimensions');
      return {
        id: string(item.id),
        name: string(item.name),
        group: string(item.group),
        width,
        height,
        ...(item.sourceDigest === undefined ? {} : { sourceDigest: string(item.sourceDigest) }),
        ...(item.sourceRevision === undefined
          ? {}
          : { sourceRevision: string(item.sourceRevision) }),
      };
    }),
    attempts: rows(raw.attempts).map((entry) => {
      const item = object(entry),
        outcome = string(item.outcome);
      if (!['returned', 'failed', 'manual', 'unknown'].includes(outcome))
        throw new Error('Invalid attempt outcome');
      return {
        id: string(item.id),
        title: string(item.title),
        date: string(item.date),
        outcome: outcome as ArtHistory['attempts'][number]['outcome'],
        notes: string(item.notes),
        files: strings(item.files),
      };
    }),
    revisions: rows(raw.revisions).map((entry) => {
      const item = object(entry);
      return {
        id: string(item.id),
        asset: item.asset === null ? null : string(item.asset),
        attempt: string(item.attempt),
        label: string(item.label),
        file: string(item.file),
        digest: string(item.digest),
        parents: strings(item.parents),
        runtimeFile: item.runtimeFile === null ? null : string(item.runtimeFile),
        runtimeDigest: item.runtimeDigest === null ? null : string(item.runtimeDigest),
        notes: string(item.notes),
      };
    }),
  };
  for (const entries of [history.assets, history.attempts, history.revisions])
    if (new Set(entries.map((entry) => entry.id)).size !== entries.length)
      throw new Error('Duplicate history identity');
  for (const revision of history.revisions) {
    if (
      ![...history.attempts, ...(context?.attempts ?? [])].some(
        (attempt) => attempt.id === revision.attempt,
      ) ||
      (revision.asset !== null &&
        ![...history.assets, ...(context?.assets ?? [])].some(
          (asset) => asset.id === revision.asset,
        ))
    )
      throw new Error('Unknown revision asset or attempt');
    if (
      revision.parents.some(
        (id) =>
          id === revision.id ||
          ![...history.revisions, ...(context?.revisions ?? [])].some((parent) => parent.id === id),
      )
    )
      throw new Error('Unknown or self-referencing revision parent');
    if ((revision.runtimeFile === null) !== (revision.runtimeDigest === null))
      throw new Error('Incomplete runtime source');
  }
  return history;
}

/** Admit static SVG geometry and local paint resources for previews and inline game rendering. */
export function validateSvg(svg: string) {
  for (const attribute of svg.matchAll(
    /\b(?:fill|stroke|style|filter|mask|clip-path|cursor|marker[\w-]*)\s*=\s*(["'])(.*?)\1/gi,
  )) {
    if (/[\\&]/.test(attribute[2]))
      throw new Error('Escaped SVG resource values are not supported');
  }
  const box = svg
    .match(/\bviewBox=["']([\d.eE+\-\s]+)["']/)?.[1]
    .trim()
    .split(/\s+/)
    .map(Number);
  if (
    !/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/.test(svg) ||
    !box ||
    box.length !== 4 ||
    !box.every(Number.isFinite) ||
    box[2] <= 0 ||
    box[3] <= 0 ||
    /<!DOCTYPE|<!ENTITY|<\s*(?:script|foreignObject|image|use|style|animate\w*|set|a)\b|\bon\w+\s*=|(?:href|src)\s*=|@import|javascript:/i.test(
      svg,
    ) ||
    [...svg.matchAll(/url\(([^)]+)\)/gi)].some(
      (match) => !/^['"]?#[\w:.-]+['"]?$/.test(match[1].trim()),
    )
  )
    throw new Error('Artwork must be a sized static SVG with local paint resources');
  const tags =
    svg.replace(/<!--[\s\S]*?-->/g, '').match(/<\/?[\w:-]+\b(?:"[^"]*"|'[^']*'|[^'">])*>/g) ?? [];
  const supported = new Set([
    'svg',
    'g',
    'path',
    'rect',
    'circle',
    'ellipse',
    'line',
    'polyline',
    'polygon',
    'defs',
    'lineargradient',
    'radialgradient',
    'stop',
    'clippath',
    'mask',
    'title',
    'desc',
    'metadata',
    'text',
    'tspan',
  ]);
  const stack: string[] = [];
  let roots = 0;
  for (const tag of tags) {
    const name = tag.match(/^<\/?([\w:-]+)/)![1].toLowerCase();
    if (!supported.has(name)) throw new Error(`Unsupported static SVG element: ${name}`);
    if (tag.startsWith('</')) {
      if (stack.pop() !== name) throw new Error('Malformed SVG element nesting');
    } else {
      if (!stack.length && (++roots > 1 || name !== 'svg'))
        throw new Error('SVG must have one root');
      if (!tag.endsWith('/>')) stack.push(name);
    }
  }
  if (stack.length || roots !== 1) throw new Error('Incomplete SVG document');
  return { width: box[2], height: box[3] };
}

interface Selection {
  revision: string;
  digest: string;
  svg: string;
}
export function readHistory(root: string) {
  const historyBytes = readFileSync(historyPath(root, HISTORY_PATH), 'utf8');
  const selectionBytes = readFileSync(historyPath(root, SELECTION_PATH), 'utf8');
  const history = parseHistory(JSON.parse(historyBytes));
  const selections: Record<string, Selection> = {};
  for (const [asset, value] of Object.entries(object(JSON.parse(selectionBytes)))) {
    const item = object(value);
    const selection = {
      revision: string(item.revision),
      digest: string(item.digest),
      svg: string(item.svg),
    };
    const revision = history.revisions.find((revision) => revision.id === selection.revision);
    if (
      !revision ||
      revision.asset !== asset ||
      !revision.runtimeFile ||
      selection.digest !== revision.runtimeDigest ||
      digest(selection.svg) !== selection.digest
    )
      throw new Error('Selected artwork and history disagree');
    validateSvg(selection.svg);
    selections[asset] = selection;
  }
  return { history, selections, version: digest(historyBytes + '\0' + selectionBytes) };
}

function checkedFile(root: string, file: string, expected: string) {
  const bytes = readFileSync(historyPath(root, file));
  if (digest(bytes) !== expected) throw new Error(`Artwork changed since registration: ${file}`);
  return bytes;
}

export function historyState(
  root: string,
  live = true,
  current: Record<string, string> = {},
): HistoryState {
  const state = readHistory(root);
  return {
    ...state,
    selections: Object.fromEntries(
      Object.entries(state.selections).map(([id, selection]) => [
        id,
        { revision: selection.revision, digest: selection.digest },
      ]),
    ),
    live,
    current: live ? {} : current,
    ...(!live
      ? {
          documents: Object.fromEntries(
            [...new Set(state.history.attempts.flatMap((attempt) => attempt.files))].map((file) => [
              file,
              historyDocument(root, file),
            ]),
          ),
        }
      : {}),
    previews: live
      ? {}
      : Object.fromEntries(
          state.history.revisions.map((revision) => {
            const bytes = checkedFile(root, revision.file, revision.digest);
            const mime = revision.file.endsWith('.gif') ? 'image/gif' : 'image/svg+xml';
            return [revision.id, `data:${mime};base64,${bytes.toString('base64')}`];
          }),
        ),
  };
}

/** Live previews read only the requested, registered revision and preserve digest checks. */
export function historyPreview(root: string, version: string, revisionId: string): HistoryDocument {
  const state = readHistory(root);
  if (version !== state.version) throw new Error('History changed. Reload before viewing artwork.');
  const revision = state.history.revisions.find((item) => item.id === revisionId);
  if (!revision) throw new Error('Unknown revision');
  const bytes = checkedFile(root, revision.file, revision.digest);
  const animated = revision.file.endsWith('.gif');
  return {
    kind: 'image',
    url: `data:${animated ? 'image/gif' : 'image/svg+xml'};base64,${bytes.toString('base64')}`,
    animated,
  };
}

/** Preserve binary reference inputs as images rather than decoding them as UTF-8 text. */
export function historyDocument(root: string, file: string): HistoryDocument {
  const bytes = readFileSync(historyPath(root, file));
  const types: Record<string, string> = {
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  const mime = types[file.split('.').at(-1)?.toLowerCase() ?? ''];
  return mime
    ? {
        kind: 'image',
        url: `data:${mime};base64,${bytes.toString('base64')}`,
        animated: mime === 'image/gif',
      }
    : { kind: 'text', text: bytes.toString('utf8') };
}

function atomicJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = path + '.' + randomUUID() + '.tmp';
  try {
    writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
    renameSync(temporary, path);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

function locked<T>(
  root: string,
  version: string,
  action: (state: ReturnType<typeof readHistory>) => T,
) {
  const path = historyPath(root, HISTORY_PATH + '.lock');
  const lock = openSync(path, 'wx');
  try {
    const state = readHistory(root);
    if (version !== state.version)
      throw new Error('History changed. Reload before applying this action.');
    return action(state);
  } finally {
    closeSync(lock);
    unlinkSync(path);
  }
}

export function useRevision(
  root: string,
  version: string,
  assetId: string,
  revisionId: string | null,
) {
  return locked(root, version, ({ history, selections }) => {
    const asset = history.assets.find((asset) => asset.id === assetId);
    if (!asset) throw new Error('Unknown asset');
    if (revisionId === null) delete selections[assetId];
    else {
      const revision = history.revisions.find(
        (revision) => revision.id === revisionId && revision.asset === assetId,
      );
      if (!revision?.runtimeFile || !revision.runtimeDigest)
        throw new Error('This revision has no game-compatible SVG');
      const svg = checkedFile(root, revision.runtimeFile, revision.runtimeDigest).toString('utf8');
      const size = validateSvg(svg);
      if (Math.abs(size.width / size.height - asset.width / asset.height) > 0.01)
        throw new Error('Artwork aspect ratio does not match this game slot');
      selections[assetId] = { revision: revision.id, digest: revision.runtimeDigest, svg };
    }
    atomicJson(historyPath(root, SELECTION_PATH), selections);
  });
}

export function removalPlan(root: string, revisionId: string) {
  const { history, selections, version } = readHistory(root);
  const revision = history.revisions.find((revision) => revision.id === revisionId);
  if (!revision) throw new Error('Unknown revision');
  const usedBy = Object.keys(selections).filter(
    (asset) => selections[asset].revision === revisionId,
  );
  const other = history.revisions.filter((item) => item.id !== revisionId);
  const files = [
    ...new Set(
      [revision.file, revision.runtimeFile].filter((path): path is string => path !== null),
    ),
  ];
  const shared = new Set([
    ...other.flatMap((item) => [item.file, item.runtimeFile]),
    ...history.attempts.flatMap((attempt) => attempt.files),
  ]);
  const references = Object.fromEntries(
    files.map((file) => [file, externalReferences(root, file)]),
  );
  const remove = files.filter(
    (file) => file.startsWith(MANAGED_PATH + '/') && !shared.has(file) && !references[file].length,
  );
  for (const file of remove) historyPath(root, file);
  return {
    version,
    revision: revisionId,
    usedBy,
    remove,
    retained: files.filter((file) => !remove.includes(file)),
    references,
    descendants: other.filter((item) => item.parents.includes(revisionId)).map((item) => item.id),
  };
}

export function removeRevision(root: string, version: string, revisionId: string) {
  return locked(root, version, ({ history }) => {
    const plan = removalPlan(root, revisionId);
    if (plan.usedBy.length)
      throw new Error('Choose another revision before removing artwork used in game');
    const revision = history.revisions.find((revision) => revision.id === revisionId)!;
    const moved: [string, string][] = [];
    try {
      for (const file of plan.remove) {
        checkedFile(root, file, file === revision.file ? revision.digest : revision.runtimeDigest!);
        const path = historyPath(root, file),
          temporary = path + '.' + randomUUID() + '.removing';
        renameSync(path, temporary);
        moved.push([path, temporary]);
      }
      history.revisions = history.revisions.filter((item) => item.id !== revisionId);
      for (const item of history.revisions)
        if (item.parents.includes(revisionId)) {
          item.parents = item.parents.filter((id) => id !== revisionId);
          item.notes += ` Parent ${revisionId} (${revision.label}) was explicitly removed.`;
        }
      atomicJson(historyPath(root, HISTORY_PATH), history);
    } catch (error) {
      for (const [path, temporary] of moved.reverse()) renameSync(temporary, path);
      throw error;
    }
    for (const [, temporary] of moved) unlinkSync(temporary);
    return plan;
  });
}

/** Existing source/document consumers retain their bytes even after the gallery entry is removed. */
function externalReferences(root: string, file: string) {
  const found: string[] = [];
  function visit(directory: string) {
    if (!existsSync(resolve(root, directory))) return;
    for (const entry of readdirSync(historyPath(root, directory), { withFileTypes: true })) {
      if (entry.isSymbolicLink() || entry.name === 'node_modules' || entry.name === '.git')
        continue;
      const path = directory + '/' + entry.name;
      if (path === HISTORY_PATH || path === file) continue;
      if (entry.isDirectory()) {
        visit(path);
        continue;
      }
      if (!/\.(?:md|json|ts|tsx|mjs|css|html)$/.test(path)) continue;
      const source = readFileSync(historyPath(root, path), 'utf8');
      const local = relative(dirname(path), file).split(sep).join('/');
      if (source.includes(file) || source.includes(local)) found.push(path);
    }
  }
  for (const directory of ['docs', 'src', 'packages', 'tests']) visit(directory);
  return found;
}

export function attemptRemovalPlan(root: string, attemptId: string) {
  const { history, version } = readHistory(root);
  const attempt = history.attempts.find((item) => item.id === attemptId);
  if (!attempt) throw new Error('Unknown attempt');
  const usedBy = history.revisions
    .filter((item) => item.attempt === attemptId)
    .map((item) => item.id);
  const shared = new Set(
    history.attempts.filter((item) => item.id !== attemptId).flatMap((item) => item.files),
  );
  for (const revision of history.revisions) {
    shared.add(revision.file);
    if (revision.runtimeFile) shared.add(revision.runtimeFile);
  }
  const remove = attempt.files.filter(
    (file) =>
      file.startsWith(MANAGED_PATH + '/') &&
      !shared.has(file) &&
      !externalReferences(root, file).length,
  );
  return {
    version,
    revision: attemptId,
    usedBy,
    remove,
    retained: attempt.files.filter((file) => !remove.includes(file)),
    descendants: [],
  };
}

export function removeAttempt(root: string, version: string, attemptId: string) {
  return locked(root, version, ({ history }) => {
    const plan = attemptRemovalPlan(root, attemptId);
    if (plan.usedBy.length) throw new Error('Remove this attempt’s revisions first');
    const moved: [string, string][] = [];
    try {
      for (const file of plan.remove) {
        const path = historyPath(root, file),
          temporary = path + '.' + randomUUID() + '.removing';
        renameSync(path, temporary);
        moved.push([path, temporary]);
      }
      history.attempts = history.attempts.filter((item) => item.id !== attemptId);
      atomicJson(historyPath(root, HISTORY_PATH), history);
    } catch (error) {
      for (const [path, temporary] of moved.reverse()) renameSync(temporary, path);
      throw error;
    }
    for (const [, temporary] of moved) unlinkSync(temporary);
    return plan;
  });
}

export function verifyHistory(root: string) {
  const { history, selections } = readHistory(root);
  for (const revision of history.revisions) {
    checkedFile(root, revision.file, revision.digest);
    if (revision.runtimeFile)
      validateSvg(
        checkedFile(root, revision.runtimeFile, revision.runtimeDigest!).toString('utf8'),
      );
  }
  for (const attempt of history.attempts)
    for (const file of attempt.files) readFileSync(historyPath(root, file));
  const registered = new Set([
    ...history.revisions.flatMap((revision) => [revision.file, revision.runtimeFile]),
    ...history.attempts.flatMap((attempt) => attempt.files),
  ]);
  const unregistered: string[] = [];
  function visit(directory: string) {
    if (!existsSync(historyPath(root, directory))) return;
    for (const entry of readdirSync(historyPath(root, directory), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      historyPath(root, path);
      if (entry.isDirectory()) visit(path);
      else if (!registered.has(path) && !externalReferences(root, path).length)
        unregistered.push(path);
    }
  }
  visit(MANAGED_PATH);
  if (unregistered.length)
    throw new Error(
      `Unregistered art files: ${unregistered.join(', ')}. Import their attempt/revisions before review, or remove temporary output deliberately.`,
    );
  return {
    assets: history.assets.length,
    revisions: history.revisions.length,
    selections: Object.keys(selections).length,
  };
}

/** Register immutable prepared files; only files under MANAGED_PATH have removable ownership. */
export function importHistory(root: string, version: string, input: unknown) {
  return locked(root, version, ({ history }) => {
    const incoming = parseHistory(input, history);
    for (const asset of incoming.assets) {
      const existing = history.assets.find((item) => item.id === asset.id);
      const sameSlot =
        existing &&
        ['id', 'name', 'group', 'width', 'height'].every(
          (key) => existing[key as keyof typeof existing] === asset[key as keyof typeof asset],
        );
      if (existing && !sameSlot) throw new Error('Import changes an existing asset slot');
      if (
        asset.sourceDigest &&
        asset.sourceDigest !== existing?.sourceDigest &&
        !incoming.revisions.some(
          (revision) =>
            revision.asset === asset.id && revision.runtimeDigest === asset.sourceDigest,
        )
      )
        throw new Error('Source registration needs its exact saved revision');
      if (
        existing?.sourceDigest &&
        asset.sourceDigest &&
        asset.sourceDigest !== existing.sourceDigest &&
        ![...history.revisions, ...incoming.revisions].some(
          (revision) =>
            revision.asset === asset.id && revision.runtimeDigest === existing.sourceDigest,
        )
      )
        throw new Error(
          `Missing pre-edit checkpoint for ${asset.id}. Recover its previous source at ${existing.sourceRevision ?? 'the recorded revision'} before registering the changed artwork.`,
        );
      if (existing && asset.sourceDigest) existing.sourceDigest = asset.sourceDigest;
      if (existing && asset.sourceRevision) existing.sourceRevision = asset.sourceRevision;
      if (!existing) history.assets.push(asset);
    }
    for (const attempt of incoming.attempts) {
      if (history.attempts.some((item) => item.id === attempt.id))
        throw new Error('Attempt already exists');
      for (const file of attempt.files) readFileSync(historyPath(root, file));
      history.attempts.push(attempt);
    }
    for (const revision of incoming.revisions) {
      if (history.revisions.some((item) => item.id === revision.id))
        throw new Error('Revision already exists');
      checkedFile(root, revision.file, revision.digest);
      if (revision.runtimeFile)
        validateSvg(
          checkedFile(root, revision.runtimeFile, revision.runtimeDigest!).toString('utf8'),
        );
      history.revisions.push(revision);
    }
    atomicJson(historyPath(root, HISTORY_PATH), parseHistory(history));
  });
}
