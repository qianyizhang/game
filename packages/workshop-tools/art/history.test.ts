import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  symlinkSync,
  realpathSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import react from '@vitejs/plugin-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  HISTORY_PATH,
  SELECTION_PATH,
  MANAGED_PATH,
  digest,
  readHistory,
  useRevision,
  removeRevision,
  removalPlan,
  historyPath,
  verifyHistory,
  removeAttempt,
  importHistory,
  historyState,
  validateSvg,
} from './history-store.ts';
import type { ArtHistory } from './history-types.ts';
import { withBundle, repositoryRoot } from '../io.ts';
import { verifySourceHistory, snapshotHistory } from './history.ts';

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), 'art-history-'));
  const file = `${MANAGED_PATH}/sample/first.svg`;
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 112"><path d="M10 10h100v80H10Z" fill="#d1a963"/></svg>';
  const history: ArtHistory = {
    schema: 1,
    assets: [{ id: 'hearth/cub', name: 'Cub', group: 'Hearth', width: 160, height: 112 }],
    attempts: [
      {
        id: 'first',
        title: 'First',
        date: 'unknown',
        outcome: 'manual',
        notes: 'Fixture',
        files: [],
      },
    ],
    revisions: [
      {
        id: 'first',
        asset: 'hearth/cub',
        attempt: 'first',
        label: 'First',
        file,
        digest: digest(svg),
        runtimeFile: file,
        runtimeDigest: digest(svg),
        parents: [],
        notes: 'Fixture',
      },
    ],
  };
  for (const [path, bytes] of [
    [file, svg],
    [HISTORY_PATH, JSON.stringify(history)],
    [SELECTION_PATH, '{}'],
  ]) {
    mkdirSync(dirname(resolve(root, path)), { recursive: true });
    writeFileSync(resolve(root, path), bytes);
  }
  return { root, file, svg, history };
}

await test('game selections persist exact bytes, reject stale/changed/incompatible inputs, and protect used artwork', (t) => {
  const { root, file, svg } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const version = readHistory(root).version;
  useRevision(root, version, 'hearth/cub', 'first');
  assert.equal(readHistory(root).selections['hearth/cub'].svg, svg);
  const selected = readFileSync(resolve(root, SELECTION_PATH));
  assert.throws(() => useRevision(root, version, 'hearth/cub', null), /History changed/);
  assert.throws(() => removeRevision(root, readHistory(root).version, 'first'), /used in game/);
  assert.deepEqual(readFileSync(resolve(root, SELECTION_PATH)), selected);
  useRevision(root, readHistory(root).version, 'hearth/cub', null);
  writeFileSync(resolve(root, file), svg.replace('160 112', '100 100'));
  assert.throws(
    () => useRevision(root, readHistory(root).version, 'hearth/cub', 'first'),
    /changed since registration/,
  );
  assert.equal(readFileSync(resolve(root, SELECTION_PATH), 'utf8'), '{}\n');
  const state = readHistory(root);
  const revision = state.history.revisions[0];
  revision.runtimeDigest = revision.digest = digest(readFileSync(resolve(root, file)));
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(state.history));
  assert.throws(
    () => useRevision(root, readHistory(root).version, 'hearth/cub', 'first'),
    /aspect ratio/,
  );
});

await test('removal preserves shared and externally referenced bytes, and removes owned payloads with lineage notes', (t) => {
  const { root, file, svg, history } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  history.revisions.push({
    ...history.revisions[0],
    id: 'child',
    label: 'Child',
    parents: ['first'],
  });
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  assert.deepEqual(removalPlan(root, 'first').remove, []);
  removeRevision(root, readHistory(root).version, 'first');
  assert.equal(existsSync(resolve(root, file)), true);
  assert.match(readHistory(root).history.revisions[0].notes, /first.*explicitly removed/);
  mkdirSync(resolve(root, 'docs/guide'), { recursive: true });
  writeFileSync(resolve(root, 'docs/guide/reference.md'), `[Source](../${file.slice(5)})`);
  assert.deepEqual(removalPlan(root, 'child').remove, []);
  rmSync(resolve(root, 'docs/guide/reference.md'));
  assert.deepEqual(removalPlan(root, 'child').remove, [file]);
  removeRevision(root, readHistory(root).version, 'child');
  assert.equal(existsSync(resolve(root, file)), false);
  assert.equal(readHistory(root).history.revisions.length, 0);
  removeAttempt(root, readHistory(root).version, 'first');
  assert.equal(readHistory(root).history.attempts.length, 0);
  assert.ok(svg.length > 0);
});

await test('unsafe paths and malformed selections fail without writes, including a symlinked repository root', (t) => {
  const { root, history, file } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.throws(() => historyPath(root, `${MANAGED_PATH}/../../library.json`), /normalized/);
  const alias = root + '-alias';
  symlinkSync(root, alias);
  t.after(() => rmSync(alias));
  assert.equal(historyPath(alias, file), resolve(realpathSync(root), file));
  symlinkSync(dirname(resolve(root, file)), resolve(root, 'linked'));
  assert.throws(() => historyPath(root, 'linked/first.svg'), /Symlinked/);
  const svg = '<svg viewBox="0 0 160 112" onload="bad()"></svg>';
  writeFileSync(resolve(root, file), svg);
  history.revisions[0].digest = history.revisions[0].runtimeDigest = digest(svg);
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  assert.throws(
    () => useRevision(root, readHistory(root).version, 'hearth/cub', 'first'),
    /static SVG/,
  );
  assert.equal(readFileSync(resolve(root, SELECTION_PATH), 'utf8'), '{}');
  assert.throws(
    () =>
      validateSvg('<svg viewBox="0 0 160 112"><path fill="u&#114;l(https://example.com)"/></svg>'),
    /Escaped SVG resource/,
  );
  assert.throws(() => importHistory(root, readHistory(root).version, { schema: 99 }), /schema/);
});

await test('every catalogue asset has a registered identity and a real game rendering selection route', async () => {
  const { history } = readHistory(repositoryRoot);
  verifyHistory(repositoryRoot);
  const selections = Object.fromEntries(
    history.assets.map((asset) => [
      asset.id,
      {
        revision: 'fixture:' + asset.id,
        digest: 'fixture',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${asset.width} ${asset.height}"><defs><linearGradient id="paint"><stop stop-color="#abc"/></linearGradient></defs><path fill="url(#paint)" d="M0 0h10v10Z"/></svg>`,
      },
    ]),
  );
  await withBundle<typeof import('./gallery/catalogue'), void>(
    'packages/workshop-tools/art/gallery/catalogue.tsx',
    async ({ cardArtCatalogue }) => {
      const catalogue = cardArtCatalogue();
      assert.deepEqual(
        catalogue.map((asset) => asset.id).sort(),
        history.assets.map((asset) => asset.id).sort(),
      );
      for (const asset of catalogue) {
        const output = renderToStaticMarkup(asset.node);
        assert.ok(
          output.includes(`fixture:${asset.id}`) ||
            output.includes(encodeURIComponent(selections[asset.id].svg).replaceAll('&', '&amp;')),
          `No selection reaches ${asset.id}`,
        );
        assert.doesNotMatch(output, /<image\b/, 'Selected vector paths must inherit game inks');
      }
      const sample = catalogue.find((asset) => asset.id === 'hearth/cub')!;
      const repeated = renderToStaticMarkup(createElement('div', null, sample.node, sample.node));
      const ids = [...repeated.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
      assert.equal(
        new Set(ids).size,
        ids.length,
        'Repeated cards must have distinct local paint IDs',
      );
      await Promise.resolve();
    },
    [
      react(),
      {
        name: 'selected-art-fixture',
        enforce: 'pre',
        load(id) {
          if (id.endsWith('/src/shared/art/selected-art.json')) return JSON.stringify(selections);
        },
      },
    ],
  );
});

await test('new attempts preserve exact settings and failures, and derivatives can reference existing parents', (t) => {
  const { root, history } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const request = `${MANAGED_PATH}/failed-request.json`;
  const bytes = '{"model":"fixture","quality":"high","failure":"connection closed","billing":null}';
  writeFileSync(resolve(root, request), bytes);
  importHistory(root, readHistory(root).version, {
    schema: 1,
    assets: [],
    attempts: [
      {
        id: 'failed',
        title: 'Failed request',
        date: 'unknown',
        outcome: 'failed',
        files: [request],
        notes: 'No image returned. Billing unknown.',
      },
    ],
    revisions: [],
  });
  assert.deepEqual(historyState(root, false).documents?.[request], { kind: 'text', text: bytes });
  assert.equal(readHistory(root).history.revisions.length, 1);
  removeAttempt(root, readHistory(root).version, 'failed');
  assert.equal(existsSync(resolve(root, request)), false);
  importHistory(root, readHistory(root).version, {
    schema: 1,
    assets: [],
    attempts: [],
    revisions: [{ ...history.revisions[0], id: 'adapted', parents: ['first'] }],
  });
  assert.equal(verifyHistory(root).revisions, 2);
  const before = readFileSync(resolve(root, HISTORY_PATH));
  assert.throws(
    () =>
      importHistory(root, readHistory(root).version, {
        schema: 1,
        assets: [],
        revisions: [],
        attempts: [
          {
            id: 'missing',
            title: 'Missing source',
            date: 'unknown',
            outcome: 'failed',
            files: ['docs/missing.json'],
            notes: 'Missing payload.',
          },
        ],
      }),
    /ENOENT/,
  );
  assert.deepEqual(readFileSync(resolve(root, HISTORY_PATH)), before);
});

await test('removing a source and its runtime adaptation from one folder completes successfully', (t) => {
  const { root, history, file, svg } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const runtime = `${MANAGED_PATH}/sample/runtime.svg`;
  writeFileSync(resolve(root, runtime), svg);
  history.revisions[0].runtimeFile = runtime;
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  removeRevision(root, readHistory(root).version, 'first');
  assert.equal(existsSync(resolve(root, file)), false);
  assert.equal(existsSync(resolve(root, runtime)), false);
  assert.equal(readHistory(root).history.revisions.length, 0);
});

await test('unregistered managed outputs block verification until imported or deliberately retired', (t) => {
  const { root, history } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const request = `${MANAGED_PATH}/unsaved-request.json`;
  writeFileSync(resolve(root, request), '{"model":"fixture"}');
  assert.throws(() => verifyHistory(root), /Unregistered art files/);
  history.attempts.push({
    id: 'new-attempt',
    title: 'New attempt',
    date: 'unknown',
    outcome: 'failed',
    notes: 'Request failed without usage.',
    files: [request],
  });
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  assert.equal(verifyHistory(root).assets, 1);
});

await test('source verification detects an unregistered edit while an unchanged catalogue creates no files', async (t) => {
  const { root } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const history = readHistory(repositoryRoot).history;
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  assert.equal(await verifySourceHistory(root), history.assets.length);
  history.assets[0].sourceDigest = '0'.repeat(64);
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  const before = readFileSync(resolve(root, HISTORY_PATH));
  await assert.rejects(verifySourceHistory(root), /Unregistered source artwork.*snapshot/);
  assert.deepEqual(readFileSync(resolve(root, HISTORY_PATH)), before);
  const current = readHistory(repositoryRoot);
  assert.equal((await snapshotHistory(repositoryRoot, current.version)).saved, 0);
  assert.equal(readHistory(repositoryRoot).version, current.version);
});

await test('registering changed source requires its pre-edit checkpoint, which can be restored from the source reference', (t) => {
  const { root, history, file, svg } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  history.assets[0].sourceDigest = digest(svg);
  history.assets[0].sourceRevision = 'previous-source';
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  removeRevision(root, readHistory(root).version, 'first');
  const changed = `${MANAGED_PATH}/sample/changed.svg`;
  const nextSvg = svg.replace('#d1a963', '#123456');
  mkdirSync(dirname(resolve(root, changed)), { recursive: true });
  writeFileSync(resolve(root, changed), nextSvg);
  const incoming: ArtHistory = {
    schema: 1,
    assets: [
      { ...history.assets[0], sourceDigest: digest(nextSvg), sourceRevision: 'next-source' },
    ],
    attempts: [],
    revisions: [
      {
        ...history.revisions[0],
        id: 'next',
        file: changed,
        digest: digest(nextSvg),
        runtimeFile: changed,
        runtimeDigest: digest(nextSvg),
      },
    ],
  };
  assert.throws(
    () => importHistory(root, readHistory(root).version, incoming),
    /Missing pre-edit checkpoint.*previous-source/,
  );
  writeFileSync(resolve(root, file), svg);
  importHistory(root, readHistory(root).version, {
    schema: 1,
    assets: [],
    attempts: [],
    revisions: [{ ...history.revisions[0], id: 'recovered' }],
  });
  incoming.revisions[0].parents = ['recovered'];
  importHistory(root, readHistory(root).version, incoming);
  assert.equal(readHistory(root).history.assets[0].sourceDigest, digest(nextSvg));
  assert.equal(verifyHistory(root).revisions, 2);
});

await test('removal retains artwork referenced by tests or another managed document', (t) => {
  const { root, file, history } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(resolve(root, 'tests'), { recursive: true });
  writeFileSync(resolve(root, 'tests/fixture.ts'), `export const art = '${file}';`);
  assert.deepEqual(removalPlan(root, 'first').remove, []);
  rmSync(resolve(root, 'tests/fixture.ts'));
  const notes = `${MANAGED_PATH}/reference.md`;
  writeFileSync(resolve(root, notes), `[Source](${file})`);
  history.attempts[0].files = [notes];
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  assert.deepEqual(removalPlan(root, 'first').remove, []);
  removeRevision(root, readHistory(root).version, 'first');
  assert.equal(existsSync(resolve(root, file)), true);
  assert.equal(verifyHistory(root).revisions, 0);
});

await test('binary reference inputs remain viewable in offline attempt records', (t) => {
  const { root, history } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const reference = `${MANAGED_PATH}/reference.png`;
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
    'base64',
  );
  writeFileSync(resolve(root, reference), png);
  history.attempts[0].files.push(reference);
  writeFileSync(resolve(root, HISTORY_PATH), JSON.stringify(history));
  assert.deepEqual(historyState(root, false).documents?.[reference], {
    kind: 'image',
    url: 'data:image/png;base64,' + png.toString('base64'),
    animated: false,
  });
});
