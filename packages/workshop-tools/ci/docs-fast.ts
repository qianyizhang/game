import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkDocumentLinks, checkInventory } from '../governance.mjs';
import { requiredModules } from './commands.ts';
import { isDocumentation, selectPlan, type Change } from './selection.ts';

const root = resolve(import.meta.dirname, '../../..');
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const exactSha = (value: string | undefined): value is string =>
  /^[a-f0-9]{40}$/.test(value ?? '') && !/^0{40}$/.test(value!);

/** Only prose without executable blocks, or reviewed raster evidence in the docs asset home. */
export function safeDocumentation(
  changes: Change[],
  read: (ref: 'base' | 'head', path: string) => string,
): boolean {
  if (!changes.length) return false;
  try {
    return changes.every(({ path, status }) => {
      if (
        path.split('/').includes('..') ||
        !isDocumentation(path) ||
        !['A', 'M', 'D'].includes(status)
      )
        return false;
      if (!path.endsWith('.md')) return true;
      const refs: ('base' | 'head')[] =
        status === 'A' ? ['head'] : status === 'D' ? ['base'] : ['base', 'head'];
      return refs.every(
        (ref) =>
          !/^(?: {0,3}(?:`{3,}|~{3,})| {4}\S|\t\S)|<(?:script|iframe|object|embed)\b/im.test(
            read(ref, path),
          ),
      );
    });
  } catch {
    return false;
  }
}

export function diffChanges(base: string | undefined, head: string): Change[] | null {
  if (!exactSha(base) || !exactSha(head)) return null;
  try {
    const fields = git(
      'diff',
      '--no-ext-diff',
      '--name-status',
      '--no-renames',
      '-z',
      `${base}...${head}`,
    )
      .split('\0')
      .filter(Boolean);
    if (fields.length % 2) return null;
    const changes: Change[] = [];
    for (let i = 0; i < fields.length; i += 2)
      changes.push({ status: fields[i], path: fields[i + 1] });
    return changes;
  } catch {
    return null;
  }
}

/** Inline examples and HTML changes also require normal checks. */
export function safeChangedLines(diff: string): boolean {
  return diff.split('\n').every((line) => {
    if (!/^[+-](?![+-])/.test(line)) return true;
    const text = line.slice(1);
    return (
      !/[`<>]/.test(text) && !/^\s*(?:\$\s*)?(?:npm|npx|node|git|uv|bash|python|curl)\s/.test(text)
    );
  });
}

function fastPlan() {
  const head = git('rev-parse', 'HEAD').trim();
  const base = process.env.CI_BASE;
  const changes = diffChanges(base, head);
  if (process.env.CI_FULL === '1' || !changes) return null;
  try {
    const ancestor = git('merge-base', base!, head).trim();
    const regular = changes.every(({ path, status }) => {
      const refs = status === 'A' ? [head] : status === 'D' ? [ancestor] : [ancestor, head];
      return refs.every(
        (ref) =>
          git('ls-tree', '-z', ref, '--', path) ===
          `100644 blob ${git('rev-parse', `${ref}:${path}`).trim()}\t${path}\0`,
      );
    });
    const changedProse = changes
      .filter(({ path }) => path.endsWith('.md'))
      .every(({ path }) =>
        safeChangedLines(git('diff', '--no-ext-diff', '--unified=0', ancestor, head, '--', path)),
      );
    if (
      !regular ||
      !changedProse ||
      !safeDocumentation(changes, (ref, path) =>
        git('show', `${ref === 'base' ? ancestor : head}:${path}`),
      )
    )
      return null;
    return selectPlan(changes, { application: [], browser: [], geometry: [] }, new Map(), { head });
  } catch {
    return null;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  const operation = process.argv[2];
  const plan = fastPlan();
  if (operation === 'classify') {
    appendFileSync(process.env.GITHUB_OUTPUT!, `fast=${plan?.mode === 'documentation'}\n`);
  } else if (operation === 'plan' && plan?.mode === 'documentation') {
    const json = JSON.stringify(plan);
    appendFileSync(
      process.env.GITHUB_OUTPUT!,
      `plan=${json}\n${Object.entries(requiredModules(plan))
        .filter(([name]) => name !== 'plan')
        .map(([name, required]) => `${name}=${required}`)
        .join('\n')}\nunit_matrix=[1]\n`,
    );
    console.log(json);
  } else if (operation === 'check' && plan?.mode === 'documentation') {
    if (readFileSync(resolve(root, '.node-version'), 'utf8').trim() !== process.versions.node)
      throw new Error('Pinned Node required');
    git('diff', '--check', `${process.env.CI_BASE}...${plan.head}`);
    const files = git('ls-files', '-z').split('\0').filter(Boolean);
    const errors = [
      ...checkInventory(files),
      ...checkDocumentLinks(
        root,
        files.filter((p) => p.endsWith('.md')),
        files,
      ),
    ];
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Documentation diff whitespace, inventory and local links passed');
  } else throw new Error('Invalid documentation fast-path request');
}
