import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { browserFamilies, selectPlan, type Catalogue, type Change } from './selection.ts';

const film = 'tests/browser/golden-claw.spec.ts';
const catalogue: Catalogue = {
  application: ['src/shared/replay.test.ts', 'src/games/spire/game.test.ts'],
  browser: [film, 'tests/browser/spire.spec.ts', 'tests/browser/asset-gallery.spec.ts'],
  geometry: [],
};
const head = 'a'.repeat(40);
const select = (changes: Change[], current = catalogue) =>
  selectPlan(changes, current, new Map(), { head });

void test('the exact Golden Claw spec is standalone, selected directly and absent from unrelated scopes', () => {
  assert.deepEqual(browserFamilies(film), []);
  for (const status of ['A', 'M']) {
    const plan = select([{ path: film, status }]);
    assert.equal(plan.mode, 'scoped');
    assert.deepEqual(plan.browserFiles, [film]);
    assert.ok(plan.coreFiles.includes('src/shared/replay.test.ts'));
  }
  const unrelated = select([{ path: 'src/games/spire/ui/Card.tsx', status: 'M' }]);
  assert.equal(unrelated.mode, 'scoped');
  assert.ok(unrelated.browserFiles.includes('tests/browser/spire.spec.ts'));
  assert.ok(!unrelated.browserFiles.includes(film));
});

void test('Golden Claw delivery and reference inputs retain conservative application and browser coverage', () => {
  for (const file of [
    'film.html',
    'golden-claw.gif',
    'golden-claw.mp4',
    'hero-front.webp',
    'hero-back.webp',
  ]) {
    for (const status of ['M', 'D']) {
      const path = `docs/art/assets/golden-claw/${file}`;
      const plan = select([{ path, status }]);
      assert.equal(plan.mode, 'application', `${path} ${status}`);
      assert.deepEqual(plan.browserFiles, [...catalogue.browser].sort());
      assert.deepEqual(
        [...plan.coreFiles, ...plan.unitFiles].sort(),
        [...catalogue.application].sort(),
      );
    }
  }
});

void test('unknown and lookalike browser specs still force conservative selection', () => {
  for (const path of [
    'tests/browser/golden-claw-extra.spec.ts',
    'tests/browser/nested/golden-claw.spec.ts',
    'tests/browser/new-surface.spec.ts',
  ]) {
    assert.equal(browserFamilies(path), undefined, path);
    const current = { ...catalogue, browser: [...catalogue.browser, path] };
    const plan = select([{ path: 'src/games/spire/ui/Card.tsx', status: 'M' }], current);
    assert.equal(plan.mode, 'application', path);
    assert.ok(plan.reasons.includes('unclassified test family'), path);
    assert.deepEqual(plan.browserFiles, [...current.browser].sort());
  }
});
