import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import {
  checkInventory,
  checkDocumentLinks,
  checkNativeHydration,
  isMarkdownDocument,
} from '../governance.mjs';
const root = resolve(import.meta.dirname, '../../..');
const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { cwd: root, encoding: 'utf8' },
)
  .split('\0')
  .filter((path) => Boolean(path) && existsSync(resolve(root, path)));
const scope = process.argv[2];
if (!['metadata', 'hydration'].includes(scope)) throw new Error('integrity.ts metadata|hydration');
const errors =
  scope === 'metadata'
    ? [
        ...checkInventory(files),
        ...checkDocumentLinks(root, files.filter(isMarkdownDocument), files),
      ]
    : checkNativeHydration(root, files);
if (errors.length) throw new Error(errors.join('\n'));
console.log(`${scope} integrity passed`);
