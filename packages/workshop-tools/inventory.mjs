import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { constants } from 'node:fs';
import { lstat, open, readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const roots = ['test-results', 'dcc-backups', 'packages/dcc-workbench/sources'];
const textExtensions = new Set(['.md', '.json', '.mjs', '.ts', '.tsx', '.py']);
const sourceExtension = /\.(blend\d*|glb|gltf|ts|tsx|js|mjs|py|sqlite|db)$/i;

/** @typedef {{path: string, bytes: number, sha256?: string, status: string}} FileRecord */
/** @typedef {{files: number, bytes: number, sourceFiles: number, references: string[], status: string}} Group */

/** Read-only occurrence inventory. Equal bytes never establish deletion authority.
 * @param {string} root
 */
export async function inventoryArtifacts(root) {
  const startedAt = new Date().toISOString();
  const tracked = new Set(
    execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
      .split('\0')
      .filter(Boolean),
  );
  /** @type {Map<string, Set<string>>} */
  const references = new Map();
  for (const path of tracked) {
    if (!textExtensions.has(extname(path))) continue;
    const stat = await lstat(join(root, path));
    if (!stat.isFile()) continue;
    const text = await readFile(join(root, path), 'utf8');
    for (const match of text.matchAll(/(?:test-results|dcc-backups)\/[A-Za-z0-9_./-]+/g)) {
      const target = match[0].replace(/[./-]+$/, '');
      const sources = references.get(target) ?? new Set();
      sources.add(path);
      references.set(target, sources);
    }
  }
  /** @type {FileRecord[]} */
  const files = [];
  /** @type {Record<string, Group>} */
  const groups = {};
  /** @param {string} path @param {string} family */
  async function visit(path, family) {
    const full = join(root, path);
    const stat = await lstat(full);
    if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) {
      files.push({ path, bytes: 0, status: 'protected-special-file' });
      return;
    }
    if (stat.isDirectory()) {
      for (const name of (await readdir(full)).sort()) await visit(`${path}/${name}`, family);
      return;
    }
    const hash = createHash('sha256');
    // Refuse a file swapped to a symlink between enumeration and opening.
    const handle = await open(full, constants.O_RDONLY | constants.O_NOFOLLOW);
    let stable;
    try {
      const before = await handle.stat();
      for await (const block of handle.createReadStream({ autoClose: false })) {
        if (!(block instanceof Buffer)) throw new Error('Expected binary artifact stream');
        hash.update(block);
      }
      const after = await handle.stat();
      stable =
        stat.ino === before.ino &&
        stat.size === before.size &&
        stat.mtimeMs === before.mtimeMs &&
        before.size === after.size &&
        before.mtimeMs === after.mtimeMs;
    } finally {
      await handle.close();
    }
    files.push({
      path,
      bytes: stat.size,
      ...(stable ? { sha256: hash.digest('hex') } : {}),
      status: !stable
        ? 'protected-changing'
        : tracked.has(path)
          ? 'protected-tracked'
          : sourceExtension.test(path)
            ? 'protected-source-or-asset'
            : 'protected-unclassified',
    });
    const group = (groups[family] ??= {
      files: 0,
      bytes: 0,
      sourceFiles: 0,
      references: [],
      status: 'protected-unclassified',
    });
    group.files++;
    group.bytes += stat.size;
    if (sourceExtension.test(path)) group.sourceFiles++;
  }
  for (const base of roots) {
    // Check each container component before descending; never follow a root symlink.
    let accessible = true;
    let prefix = '';
    for (const component of base.split('/')) {
      prefix = prefix ? `${prefix}/${component}` : component;
      const stat = await lstat(join(root, prefix)).catch((/** @type {unknown} */ error) => {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
          return null;
        throw error;
      });
      if (!stat) {
        accessible = false;
        break;
      }
      if (!stat.isDirectory() || stat.isSymbolicLink()) {
        files.push({ path: prefix, bytes: 0, status: 'protected-special-file' });
        accessible = false;
        break;
      }
    }
    if (!accessible) continue;
    for (const name of (await readdir(join(root, base))).sort())
      await visit(`${base}/${name}`, base === 'test-results' ? `${base}/${name}` : base);
  }
  for (const [family, group] of Object.entries(groups)) {
    /** @type {Set<string>} */
    const sources = new Set();
    for (const [target, origins] of references)
      if (target === family || target.startsWith(`${family}/`) || family.startsWith(`${target}/`))
        for (const origin of origins) sources.add(origin);
    group.references = [...sources].sort();
    group.status = group.sourceFiles
      ? 'protected-source-or-asset'
      : sources.size
        ? 'protected-referenced-evidence'
        : 'protected-unclassified';
  }
  /** @type {Map<string, FileRecord[]>} */
  const byHash = new Map();
  for (const file of files) {
    if (!file.sha256) continue;
    const occurrences = byHash.get(file.sha256) ?? [];
    occurrences.push(file);
    byHash.set(file.sha256, occurrences);
  }
  const duplicateGroups = [...byHash]
    .filter(([, occurrences]) => occurrences.length > 1)
    .map(([sha256, occurrences]) => ({
      sha256,
      bytesPerFile: occurrences[0].bytes,
      paths: occurrences.map((file) => file.path),
    }));
  return {
    schemaVersion: 1,
    startedAt,
    completedAt: new Date().toISOString(),
    roots,
    consistency: 'Per-file stability checks; this is not an atomic snapshot of active producers.',
    referenceScope: 'Literal artifact paths in tracked text; absence is not proof of non-use.',
    deletionAuthority: 'None. Use guarded prune only for independently eligible receipts.',
    files,
    groups,
    duplicateGroups,
    totals: {
      files: files.length,
      bytes: files.reduce((sum, file) => sum + file.bytes, 0),
      distinctStableHashes: byHash.size,
      duplicateGroups: duplicateGroups.length,
      duplicateBytes: duplicateGroups.reduce(
        (sum, group) => sum + group.bytesPerFile * (group.paths.length - 1),
        0,
      ),
    },
  };
}
