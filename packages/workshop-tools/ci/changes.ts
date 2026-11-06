import { execFileSync } from 'node:child_process';
import { lstatSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Change } from './selection.ts';

/** CI compares committed trees. Local checks add staged, unstaged and untracked files. */
export function changedInputs(root: string, base: string | undefined, local = false) {
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
  const head = git('rev-parse', 'HEAD').trim();
  if (base && !/^[a-f0-9]{40}$/.test(base)) throw new Error('CI_BASE must be an exact commit SHA');
  const ancestor = base ? git('merge-base', base, head).trim() : head;
  const fields =
    base || local
      ? git(
          'diff',
          '--no-ext-diff',
          '--name-status',
          '--no-renames',
          '-z',
          ancestor,
          ...(local ? [] : [head]),
        )
          .split('\0')
          .filter(Boolean)
      : [];
  if (fields.length % 2) throw new Error('Malformed changed-file list');
  const changes: Change[] = [];
  for (let i = 0; i < fields.length; i += 2)
    changes.push({ status: fields[i], path: fields[i + 1] });
  if (local)
    for (const path of git('ls-files', '--others', '--exclude-standard', '-z')
      .split('\0')
      .filter(Boolean))
      changes.push({ path, status: 'A' });
  const regular = ({ path, status }: Change) => {
    try {
      const before =
        status === 'A' || git('ls-tree', '-z', ancestor, '--', path).startsWith('100644 blob ');
      const after =
        status === 'D' ||
        (local
          ? (() => {
              const stat = lstatSync(resolve(root, path));
              return stat.isFile() && !(stat.mode & 0o111);
            })()
          : git('ls-tree', '-z', head, '--', path).startsWith('100644 blob '));
      return before && after;
    } catch {
      return false;
    }
  };
  return {
    head,
    changes,
    regular,
    unsafePaths: changes.filter((change) => !regular(change)).map((change) => change.path),
  };
}
