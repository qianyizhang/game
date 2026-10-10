import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, existsSync, openSync, readFileSync, readSync } from 'node:fs';
import { resolve } from 'node:path';

/** These are the same explicit scopes used by ESLint, tsc and pyproject.toml. @param {string} path */
export function managedSource(path) {
  return (
    path === 'eslint.config.mjs' ||
    /^(vite|vitest\.playtest|playwright)\.config\.ts$/.test(path) ||
    /^tests\/.*\.ts$/.test(path) ||
    /^src\/.*\.tsx?$/.test(path) ||
    /^packages\/session-review\/.*\.tsx?$/.test(path) ||
    /^packages\/diablo2\/src\/.*\.tsx?$/.test(path) ||
    /^packages\/dcc-workbench\/src\/[^/]+\.tsx?$/.test(path) ||
    /^packages\/dcc-workbench\/[^/]+\.(ts|mjs)$/.test(path) ||
    /^packages\/workshop-tools\/.*\.(mjs|tsx?)$/.test(path) ||
    /^packages\/dcc-workbench\/blender\/[^/]+\.py$/.test(path) ||
    /^packages\/dcc-workbench\/subjects\/canid\/authoring\/[^/]+\.py$/.test(path)
  );
}

/** @param {unknown} value @returns {Record<string, unknown>} */
function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected a record');
  return /** @type {Record<string, unknown>} */ (value);
}

/** Every maintained source and document must have an enforced home. @param {string[]} files */
export function checkInventory(files) {
  const errors = [];
  const source = /\.(?:[cm]?js|tsx?|py)$/;
  for (const path of files) {
    if (path.startsWith('.agents/skills/')) continue;
    if (source.test(path) && !managedSource(path))
      errors.push(`Unmanaged source: ${path}. Add checker coverage.`);
    const ownedDocument =
      ['AGENTS.md', 'README.md', 'docs/README.md'].includes(path) ||
      /^docs\/(guide|engineering|art|research)\//.test(path) ||
      /^packages\/[^/]+\/(?:.*\/)?README\.md$/.test(path) ||
      path.startsWith('skills/');
    if (path.endsWith('.md') && !ownedDocument) errors.push(`Document has no theme home: ${path}`);
  }
  return errors;
}

/** @param {string} root @param {string[]} files */
export function checkNativeHydration(root, files) {
  const errors = [];
  for (const path of files) {
    if (
      !/^packages\/dcc-workbench\/(sources|subjects|assets|references)\/.*\.(blend|glb)$/.test(path)
    )
      continue;
    const descriptor = openSync(resolve(root, path), 'r');
    const header = Buffer.alloc(64);
    try {
      const length = readSync(descriptor, header, 0, header.length, 0);
      if (
        header
          .subarray(0, length)
          .toString()
          .startsWith('version https://git-lfs.github.com/spec/v1\n')
      )
        errors.push(
          `Unhydrated Git LFS asset: ${path}. Run git lfs install --local and git lfs pull, then retry.`,
        );
    } finally {
      closeSync(descriptor);
    }
  }
  return errors;
}

/** @param {string} root */
export function checkGovernance(root) {
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
  const errors = [...checkInventory(files), ...checkNativeHydration(root, files)];
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
    errors,
  };
}
