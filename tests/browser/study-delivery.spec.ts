import { expect, test } from '@playwright/test';
import manifest from '../../src/art3d/baked/manifest.json' with { type: 'json' };
import type { StudyId } from '../../src/art3d/catalogue';
import { browserBudget } from './budget';

test('every baked study loads its saved mesh and motion without constructing or rendering', async ({
  page,
}) => {
  test.setTimeout(browserBudget(60_000));
  const procedural: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/src/art3d/procedural/')) procedural.push(request.url());
  });
  await page.goto('/');
  for (const id of Object.keys(manifest.assets)) {
    const result = await page.evaluate(async (id) => {
      const loaderPath = '/src/art3d/delivery.ts';
      const resourcesPath = '/src/shared/three/resources.ts';
      const { loadStudy } = (await import(loaderPath)) as typeof import('../../src/art3d/delivery');
      const { disposeObject } = (await import(
        resourcesPath
      )) as typeof import('../../src/shared/three/resources');
      const loaded = await loadStudy(id as StudyId, new AbortController().signal);
      try {
        let meshes = 0;
        loaded.object.traverse((object) => {
          if (object.type === 'Mesh' || object.type === 'SkinnedMesh') meshes++;
        });
        return {
          meshes,
          tracks: loaded.clip?.tracks.length,
          seconds: loaded.clip?.duration,
          native: loaded.native,
        };
      } finally {
        disposeObject(loaded.object);
      }
    }, id);
    expect(result.meshes, id).toBeGreaterThan(0);
    expect(result.tracks, id).toBeGreaterThan(0);
    expect(result.seconds, id).toBeGreaterThan(0);
    expect(result.native, id).toBe(false);
  }
  expect(procedural).toEqual([]);
});
