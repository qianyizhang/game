import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { diffChanges, safeChangedLines, safeDocumentation } from './docs-fast.ts';

const prose = () => '# Review\n\nThe result is clear.\n';
const doc = 'docs/engineering/maintenance.md';
const image = 'docs/art/assets/hearth-mech-roles/before.webp';

void test('only allowlisted prose and reviewed raster changes qualify, including deletions and rename pairs', () => {
  assert.equal(
    safeDocumentation(
      [
        { path: doc, status: 'M' },
        { path: image, status: 'A' },
      ],
      prose,
    ),
    true,
  );
  assert.equal(safeDocumentation([{ path: doc, status: 'D' }], prose), true);
  assert.equal(
    safeDocumentation(
      [
        { path: image, status: 'D' },
        { path: 'docs/art/assets/hearth-mech-roles/after.webp', status: 'A' },
      ],
      prose,
    ),
    true,
  );
  assert.equal(safeDocumentation([], prose), false);
  assert.equal(safeDocumentation([{ path: doc, status: 'R100' }], prose), false);
  for (const path of [
    'nested/AGENTS.md',
    'docs/engineering/testing.md',
    'skills/card-art/assets/native-brief.md.template',
    'skills/card-art/assets/motion-study.ts.template',
    'docs/art/assets/review/manifest.json',
    'docs/art/assets/review/scene.svg',
    'docs/art/assets/cartographer-map/before-board.webp',
    'docs/guide/../unsafe.md',
    '.github/workflows/maintenance.yml',
    'src/game.ts',
    'new/unknown.md',
  ]) {
    assert.equal(safeDocumentation([{ path, status: 'M' }], prose), false, path);
    assert.equal(
      safeDocumentation(
        [
          { path: doc, status: 'M' },
          { path, status: 'M' },
        ],
        prose,
      ),
      false,
      path,
    );
  }
});

void test('only modifications of the three named inputs qualify; unchanged checks examples are opaque bytes', () => {
  const examples = '\n```sh\nnpm run ci -- core\nplain example line\n```\n';
  for (const path of [
    'AGENTS.md',
    'docs/engineering/checks.md',
    'skills/card-art/assets/native-handoff.md.template',
  ]) {
    assert.equal(safeDocumentation([{ path, status: 'M' }], prose), true, path);
    for (const status of ['A', 'D', 'R100', 'T'])
      assert.equal(safeDocumentation([{ path, status }], prose), false, `${path} ${status}`);
    assert.equal(
      safeDocumentation([{ path, status: 'M' }], (ref) => `${ref} prose${examples}`),
      path === 'docs/engineering/checks.md',
      path,
    );
  }
  for (const changed of [
    examples.replace('plain example line', 'changed example line'),
    examples.replace('npm run ci -- core', 'npm run ci -- browser'),
    examples.replace('```sh', '```bash'),
    '',
    examples + examples,
    examples.slice(0, -4),
  ])
    assert.equal(
      safeDocumentation(
        [{ path: 'docs/engineering/checks.md', status: 'M' }],
        (ref) => prose() + (ref === 'base' ? examples : changed),
      ),
      false,
      changed,
    );
  for (const unsupported of [
    '~~~sh\nnpm test\n~~~',
    '````sh\nnpm test\n````',
    '  ```sh\nnpm test\n  ```',
    '```sh\n<script>alert(1)</script>\n```',
    '    npm test',
  ])
    assert.equal(
      safeDocumentation([{ path: 'docs/engineering/checks.md', status: 'M' }], () => unsupported),
      false,
      unsupported,
    );
});

void test('the named Markdown handoff receives the same executable content guard as documents', () => {
  const path = 'skills/card-art/assets/native-handoff.md.template';
  for (const unsafe of [
    '```js\ncode\n```',
    '    node script.js',
    '<SCRIPT>code</SCRIPT>',
    '<iframe src="x">',
    '<object>',
    '<embed>',
  ])
    for (const side of ['base', 'head'])
      assert.equal(
        safeDocumentation([{ path, status: 'M' }], (ref) => (ref === side ? unsafe : prose())),
        false,
        `${side}: ${unsafe}`,
      );
});

void test('old and new document versions with executable blocks or unreadable blobs fail closed', () => {
  for (const unsafe of [
    '```sh\nnpm test\n```',
    '    npm test',
    '<script>alert(1)</script>',
    '~~~js\ncode\n~~~',
  ]) {
    assert.equal(
      safeDocumentation([{ path: doc, status: 'M' }], (ref) => (ref === 'base' ? unsafe : prose())),
      false,
    );
    assert.equal(
      safeDocumentation([{ path: doc, status: 'M' }], (ref) => (ref === 'head' ? unsafe : prose())),
      false,
    );
  }
  assert.equal(
    safeDocumentation([{ path: doc, status: 'M' }], () => {
      throw new Error('missing');
    }),
    false,
  );
});

void test('changed inline examples and HTML fail closed', () => {
  assert.equal(
    safeChangedLines('--- a/file\n+++ b/file\n@@ -1 +1 @@\n-old prose\n+new prose'),
    true,
  );
  for (const line of ['+Run `npm test`.', '+npm test', '+<img src="x">', '-`git status`'])
    assert.equal(safeChangedLines(`@@ -1 +1 @@\n${line}`), false, line);
});

void test('missing or unavailable diff bases never qualify', () => {
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  assert.equal(diffChanges(undefined, head), null);
  assert.equal(diffChanges('0'.repeat(40), head), null);
  assert.equal(diffChanges('not-a-sha', head), null);
  assert.equal(diffChanges('f'.repeat(40), head), null);
});
