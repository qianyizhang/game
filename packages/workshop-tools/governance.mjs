import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** These are the same explicit scopes used by ESLint, tsc and pyproject.toml. @param {string} path */
export function managedSource(path) {
  return (
    path === 'eslint.config.mjs' ||
    /^packages\/dcc-workbench\/src\/[^/]+\.tsx?$/.test(path) ||
    /^packages\/workshop-tools\/(?:[^/]+\.mjs|trace\/[^/]+\.ts)$/.test(path) ||
    path === 'scripts/trace-visualizer/build.mjs' ||
    /^packages\/dcc-workbench\/blender\/(render_review|review_plan|test_review_plan)\.py$/.test(
      path,
    )
  );
}

/** @param {unknown} value @returns {string[]} */
function stringList(value) {
  if (!Array.isArray(value)) throw new Error('Inventory must contain path arrays');
  /** @type {string[]} */
  const paths = [];
  for (const item of value) {
    if (typeof item !== 'string') throw new Error('Inventory path must be a string');
    paths.push(item);
  }
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate inventory paths');
  return paths;
}

/** @param {unknown} value @returns {Record<string, unknown>} */
function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected a record');
  return /** @type {Record<string, unknown>} */ (value);
}

/** @param {string} root @param {string[]} files @param {string[]} pending @param {string[]} legacyDocs */
export function checkInventory(root, files, pending, legacyDocs) {
  const errors = [];
  const source = /\.(?:[cm]?js|tsx?|py)$/;
  for (const path of files) {
    if (path.startsWith('.agents/skills/')) continue;
    if (source.test(path) && !managedSource(path) && !pending.includes(path))
      errors.push(
        `Unmanaged source: ${path}. Add checker coverage; do not extend the migration backlog.`,
      );
    const ownedDocument =
      ['AGENTS.md', 'README.md', 'docs/README.md'].includes(path) ||
      /^docs\/(guide|engineering|art|research)\//.test(path) ||
      /^packages\/[^/]+\/(?:.*\/)?README\.md$/.test(path) ||
      path.startsWith('skills/');
    if (path.endsWith('.md') && !ownedDocument && !legacyDocs.includes(path))
      errors.push(`Document has no theme home: ${path}`);
  }
  for (const path of [...pending, ...legacyDocs])
    if (!files.includes(path) && existsSync(resolve(root, path)))
      errors.push(`Inventory path is ignored rather than migrated: ${path}`);
    else if (!existsSync(resolve(root, path)))
      errors.push(`Remove migrated inventory entry: ${path}`);
  for (const path of pending)
    if (managedSource(path)) errors.push(`Managed source remains in migration backlog: ${path}`);
  return errors;
}

/** @param {string} root */
export function checkGovernance(root) {
  /** @type {unknown} */
  const parsed = JSON.parse(readFileSync(resolve(root, 'maintenance/migration.json'), 'utf8'));
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('pendingSources' in parsed) ||
    !('legacyDocs' in parsed)
  )
    throw new Error('Invalid migration inventory');
  const pending = stringList(parsed.pendingSources);
  const legacy = stringList(parsed.legacyDocs);
  const files = [
    ...new Set(
      execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
        cwd: root,
        encoding: 'utf8',
      })
        .split('\0')
        .filter((path) => path && existsSync(resolve(root, path))),
    ),
  ];
  const errors = checkInventory(root, files, pending, legacy);
  const expectedNode = readFileSync(resolve(root, '.node-version'), 'utf8').trim();
  if (process.versions.node !== expectedNode)
    errors.push(
      `Use the pinned Node ${expectedNode}; running ${process.versions.node}. Run nvm use.`,
    );
  if (readFileSync(resolve(root, '.nvmrc'), 'utf8').trim() !== expectedNode)
    errors.push('Node runtime pins disagree');
  const skills = record(
    JSON.parse(readFileSync(resolve(root, 'maintenance/skills-lock.json'), 'utf8')),
  );
  if (
    skills.schemaVersion !== 1 ||
    typeof skills.revision !== 'string' ||
    !/^[a-f0-9]{40}$/.test(skills.revision)
  )
    throw new Error('Invalid pinned skill revision');
  const skillFiles = record(skills.files);
  for (const [path, expected] of Object.entries(skillFiles)) {
    if (typeof expected !== 'string' || !/^[a-f0-9]{64}$/.test(expected))
      throw new Error('Invalid skill digest');
    if (!/^(?:\.agents\/skills\/|maintenance\/third-party\/)/.test(path) || path.includes('..'))
      throw new Error('Invalid skill lock path');
    if (
      !existsSync(resolve(root, path)) ||
      createHash('sha256')
        .update(readFileSync(resolve(root, path)))
        .digest('hex') !== expected
    )
      errors.push(`Pinned skill bytes changed: ${path}`);
  }
  for (const path of files.filter((path) => path.startsWith('.agents/skills/')))
    if (!(path in skillFiles)) errors.push(`Unpinned skill file: ${path}`);
  // Check repository-local Markdown links in the new canonical homes and maintained package.
  const documents = files.filter(
    (path) => /^docs\/(engineering|art|guide)\//.test(path) && path.endsWith('.md'),
  );
  documents.push('docs/README.md', 'packages/workshop-tools/README.md');
  for (const path of documents) {
    const text = readFileSync(resolve(root, path), 'utf8').replace(/```[\s\S]*?```/g, '');
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      const full = resolve(root, path, '..', decodeURIComponent(target));
      if (!existsSync(full)) errors.push(`Broken local link in ${path}: ${target}`);
    }
  }
  return {
    managedSources: files.filter(managedSource).length,
    pendingSources: pending.length,
    legacyDocs: legacy.length,
    errors,
  };
}
