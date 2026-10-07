import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkInventory } from './governance.mjs';

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
