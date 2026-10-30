import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkDocumentLinks, checkInventory, isMarkdownDocument } from '../governance.mjs';
import { requiredModules } from './commands.ts';
import { isDocumentation, isNamedDocumentation, selectPlan, type Change } from './selection.ts';

const root = resolve(import.meta.dirname, '../../..');
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const exactSha = (value: string | undefined): value is string =>
  /^[a-f0-9]{40}$/.test(value ?? '') && !/^0{40}$/.test(value!);

// Only the simple, complete triple-backtick examples already used by checks.md.
// Compare these opaque bytes; unsupported fence forms still fail the block guard below.
const checkExamples = /^```[^`\r\n]*\r?\n[\s\S]*?^```[ \t]*\r?$/gm;

/** Prose edits, with unchanged examples allowed only in the named checks document. */
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
        !['A', 'M', 'D'].includes(status) ||
        (isNamedDocumentation(path) && status !== 'M')
      )
        return false;
      if (!isMarkdownDocument(path)) return true;
      const refs: ('base' | 'head')[] =
        status === 'A' ? ['head'] : status === 'D' ? ['base'] : ['base', 'head'];
      let texts = refs.map((ref) => read(ref, path));
      if (texts.some((text) => /<(?:script|iframe|object|embed)\b/i.test(text))) return false;
      if (path === 'docs/engineering/checks.md' && status === 'M') {
        const examples = texts.map((text) => text.match(checkExamples) ?? []);
        if (JSON.stringify(examples[0]) !== JSON.stringify(examples[1])) return false;
        texts = texts.map((text) => text.replace(checkExamples, ''));
      }
      return texts.every((text) => !/^(?: {0,3}(?:`{3,}|~{3,})| {4}\S|\t\S)/m.test(text));
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
      .filter(({ path }) => isMarkdownDocument(path))
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
    const changes = diffChanges(process.env.CI_BASE, plan.head);
    if (!changes) throw new Error('Unavailable documentation diff');
    git('diff', '--check', `${process.env.CI_BASE}...${plan.head}`);
    const files = git('ls-files', '-z').split('\0').filter(Boolean);
    const errors = [
      ...checkInventory(files),
      ...checkDocumentLinks(root, files.filter(isMarkdownDocument), files),
    ];
    if (errors.length) throw new Error(errors.join('\n'));
    if (changes.some(({ path }) => path === 'skills/card-art/assets/native-handoff.md.template'))
      execFileSync(
        process.execPath,
        ['--test', 'packages/workshop-tools/art/native-packet.test.ts'],
        {
          cwd: root,
          stdio: 'inherit',
        },
      );
    console.log('Documentation diff whitespace, inventory and local links passed');
  } else throw new Error('Invalid documentation fast-path request');
}
