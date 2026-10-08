import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { checkInventory, checkNativeHydration } from './governance.mjs';

await test('new source and scattered documentation cannot silently bypass governance', () => {
  const errors = checkInventory(
    '/unused',
    ['scripts/new.py', 'docs/another-review.md', 'session-review.md'],
    [],
    [],
  );
  assert.equal(errors.length, 3);
  assert.match(errors[0], /Unmanaged source/);
  assert.match(errors[1], /theme home/);
});

await test('the maintained slice and canonical document homes are accepted', () => {
  assert.deepEqual(
    checkInventory(
      '/unused',
      [
        'packages/workshop-tools/task.mjs',
        'packages/dcc-workbench/blender/render_review.py',
        'docs/art/assets/example.md',
        '.agents/skills/vendor/example.py',
      ],
      [],
      [],
    ),
    [],
  );
});

await test('unhydrated native binaries name the recovery command before delivery validation', () => {
  const root = mkdtempSync(join(tmpdir(), 'workshop-hydration-'));
  const pointer =
    'version https://git-lfs.github.com/spec/v1\noid sha256:' + 'a'.repeat(64) + '\nsize 32\n';
  const source = 'packages/dcc-workbench/subjects/bird/source.blend';
  const delivery = 'packages/dcc-workbench/assets/bird/releases/one/model.glb';
  const reference = 'packages/dcc-workbench/references/baseline.glb';
  const outside = '.work/sessions/rejected/source.blend';
  const metadata = 'packages/dcc-workbench/assets/bird/receipt.json';
  const files = [source, delivery, reference, outside, metadata];
  try {
    for (const path of files) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), pointer);
    }
    writeFileSync(join(root, reference), Buffer.from([0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0]));
    const errors = checkNativeHydration(root, files);
    assert.equal(errors.length, 2);
    assert.match(
      errors[0],
      /subjects\/bird\/source\.blend.*git lfs install --local and git lfs pull/,
    );
    assert.match(errors[1], /releases\/one\/model\.glb/);
    writeFileSync(join(root, source), 'BLENDER-v450');
    writeFileSync(join(root, delivery), Buffer.from([0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0]));
    assert.deepEqual(checkNativeHydration(root, files), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
