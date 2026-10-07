import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, readdirSync, realpathSync, rmdirSync, unlinkSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';

const roots = ['test-results/disposable', '.work/sessions'];
const receipt = '.retention.json';
const day = 86_400_000;

/** @typedef {{path: string, status: 'eligible'|'retained', reason: string, fingerprint?: string, files?: string[]}} Entry */
/** @param {unknown} value @returns {Record<string, unknown>} */
function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected a record');
  return /** @type {Record<string, unknown>} */ (value);
}
/** @param {string | Buffer} bytes */
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Reject symlinks in every component, including the container roots.
 * @param {string} root @param {string} path
 */
function ownedPath(root, path) {
  if (!path || path.includes('\\') || path.split('/').some((p) => !p || p === '.' || p === '..'))
    throw new Error('Invalid relative path');
  let current = root;
  for (const component of path.split('/')) {
    current = join(current, component);
    if (lstatSync(current).isSymbolicLink()) throw new Error('Symlinks are protected');
  }
  if (!realpathSync(current).startsWith(root + sep)) throw new Error('Path escapes repository');
  return current;
}

/** @param {string} root @param {string} directory @returns {Record<string, string>} */
function fileHashes(root, directory) {
  /** @type {Record<string, string>} */
  const result = {};
  /** @param {string} path */
  function visit(path) {
    const full = ownedPath(root, path);
    const stat = lstatSync(full);
    if (stat.isDirectory()) {
      for (const name of readdirSync(full).sort()) visit(`${path}/${name}`);
    } else {
      if (!stat.isFile() || stat.nlink !== 1) throw new Error('Only ordinary files are disposable');
      // Artist sources, saved games, and source snapshots are never ordinary test output.
      if (/\.(blend\d*|glb|gltf|ts|tsx|js|mjs|py|sqlite|db)$/i.test(path))
        throw new Error('Source or asset files are protected');
      result[path.slice(directory.length + 1)] = digest(readFileSync(full));
    }
  }
  visit(directory);
  return result;
}

/** @param {string} root @param {string} path @param {string[]} tracked @param {Date} now @returns {Entry} */
function inspect(root, path, tracked, now) {
  try {
    if (
      !roots.some(
        (prefix) => path.startsWith(prefix + '/') && !path.slice(prefix.length + 1).includes('/'),
      )
    )
      throw new Error('Not a direct child of a disposable root');
    if (tracked.some((file) => file === path || file.startsWith(path + '/')))
      throw new Error('Git-tracked files are protected');
    const directory = ownedPath(root, path);
    const manifestPath = ownedPath(root, `${path}/${receipt}`);
    const manifest = record(JSON.parse(readFileSync(manifestPath, 'utf8')));
    if (manifest.schemaVersion !== 1 || manifest.state !== 'closed' || manifest.pinned !== false)
      throw new Error('Unclassified, open or pinned');
    const kind = path.startsWith('.work/sessions/') ? 'session' : 'output';
    if (manifest.kind !== kind) throw new Error('Retention kind does not match its home');
    if (
      typeof manifest.closedAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T.*(?:Z|\+00:00)$/.test(manifest.closedAt)
    )
      throw new Error('Explicit UTC closure time is required');
    const closed = Date.parse(manifest.closedAt);
    if (!Number.isFinite(closed) || closed > now.getTime()) throw new Error('Invalid closure time');
    if (kind === 'session') {
      if (!Array.isArray(manifest.promotedTo) || !manifest.promotedTo.length)
        throw new Error('Session decisions must be promoted before expiry');
      for (const destination of manifest.promotedTo) {
        if (
          typeof destination !== 'string' ||
          !destination.startsWith('docs/') ||
          !tracked.includes(destination)
        )
          throw new Error('Promotion must name a Git-tracked durable document');
        if (!lstatSync(ownedPath(root, destination)).isFile())
          throw new Error('Promotion target is not a file');
      }
    }
    const expected = record(manifest.files);
    const actual = fileHashes(root, path);
    const fingerprint = digest(JSON.stringify(actual));
    const files = Object.keys(actual);
    delete actual[receipt];
    if (
      !Object.keys(actual).length ||
      Object.keys(actual).length !== Object.keys(expected).length ||
      Object.entries(actual).some(([name, hash]) => expected[name] !== hash)
    )
      throw new Error('Files changed after closure or manifest is incomplete');
    const days = kind === 'session' ? 30 : 14;
    if (now.getTime() - closed < days * day) throw new Error(`Within ${days}-day retention`);
    if (!lstatSync(directory).isDirectory()) throw new Error('Entry is not a directory');
    return {
      path,
      status: 'eligible',
      reason: `Closed ${kind}, ${days}-day retention elapsed`,
      fingerprint,
      files,
    };
  } catch (error) {
    return {
      path,
      status: 'retained',
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/** @param {string} root */
function trackedFiles(root) {
  return execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
}

/** Existing evidence outside the two opt-in roots is never a deletion candidate.
 * @param {string} repository @param {Date} [now] @returns {Entry[]}
 */
export function planRetention(repository, now = new Date()) {
  const root = realpathSync(repository);
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid planning time');
  const tracked = trackedFiles(root);
  /** @type {Entry[]} */
  const entries = [];
  for (const prefix of roots) {
    try {
      const directory = ownedPath(root, prefix);
      for (const name of readdirSync(directory).sort())
        entries.push(inspect(root, `${prefix}/${name}`, tracked, now));
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') continue;
      entries.push({ path: prefix, status: 'retained', reason: String(error) });
    }
  }
  return entries;
}

/** Revalidate exact bytes, then unlink only listed files. New arrivals prevent directory removal.
 * @param {string} repository @param {Entry[]} plan @param {Date} [now]
 */
export function applyRetention(repository, plan, now = new Date()) {
  const root = realpathSync(repository);
  const tracked = trackedFiles(root);
  /** @type {{path: string, status: 'deleted'|'retained', reason: string}[]} */
  const result = [];
  for (const entry of plan.filter((item) => item.status === 'eligible')) {
    const fresh = inspect(root, entry.path, tracked, now);
    if (fresh.status !== 'eligible' || fresh.fingerprint !== entry.fingerprint || !fresh.files) {
      result.push({
        path: entry.path,
        status: 'retained',
        reason: 'Changed since plan: ' + fresh.reason,
      });
      continue;
    }
    // Remove the receipt last: a partial failure leaves an invalid, therefore protected, entry.
    const files = fresh.files.filter((name) => name !== receipt).concat(receipt);
    const directories = new Set([entry.path]);
    for (const name of files) {
      const path = `${entry.path}/${name}`;
      const full = ownedPath(root, path);
      unlinkSync(full);
      let parent = path.slice(0, path.lastIndexOf('/'));
      while (parent !== entry.path) {
        directories.add(parent);
        parent = parent.slice(0, parent.lastIndexOf('/'));
      }
    }
    for (const path of [...directories].sort((a, b) => b.length - a.length))
      rmdirSync(ownedPath(root, path));
    result.push({
      path: relative(root, resolve(root, entry.path)),
      status: 'deleted',
      reason: entry.reason,
    });
  }
  return result;
}
