import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { browserBudget } from './budget';

test('enemy batching preserves materials, triangles and every authored deformed surface', async ({
  page,
}) => {
  test.setTimeout(browserBudget(90000));
  await page.goto('/?game=night-passage');
  const results = await page.evaluate(async () => {
    const path = '/tests/browser/night-passage-batches-review.ts';
    const { compareEnemyBatches } = (await import(
      path
    )) as typeof import('./night-passage-batches-review');
    return compareEnemyBatches();
  });
  expect(results.map((entry) => entry.kind)).toEqual(['hunter', 'archer', 'brute', 'witch']);
  let authoredFrames = 0,
    fractionalFrames = 0;
  for (const entry of results) {
    expect(entry.batchedMeshes).toBeLessThan(entry.originalMeshes);
    expect(entry.vertices).toBeGreaterThan(0);
    expect(entry.triangles).toBeGreaterThan(0);
    expect(entry.materialAndAttributesPreserved && entry.topologyAndWindingPreserved).toBe(true);
    expect(entry.maxWorldError).toBeLessThan(0.0001);
    expect(entry.sharedSkeletons).toBe(1);
    expect(entry.independentSkeletons).toBe(1);
    expect(entry.independentClones && entry.untouchedCloneStable && entry.arrowKeptSeparate).toBe(
      true,
    );
    expect(entry.coverage.map((clip) => clip.clip).sort()).toEqual([
      'attack',
      'idle',
      'run',
      'stagger',
    ]);
    authoredFrames += entry.coverage.reduce((sum, clip) => sum + clip.authoredFrames, 0);
    fractionalFrames += entry.coverage.reduce((sum, clip) => sum + clip.fractionalFrames, 0);
  }
  expect(authoredFrames).toBe(550);
  expect(fractionalFrames).toBe(120);
  const directory = 'test-results/night-passage-performance';
  await mkdir(directory, { recursive: true });
  await writeFile(
    `${directory}/batch-agreement.json`,
    JSON.stringify({ authoredFrames, fractionalFrames, results }, null, 2),
  );
});
